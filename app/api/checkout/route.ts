import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ensureProvisionedUser } from '@/lib/account-provisioning';
import { createDodoCheckoutSession } from '@/lib/dodo-payments';
import { paymentPlansById, getPlanProductId } from '@/config/payment-plans';
import { getPaymentProviderLabel, resolvePaymentProvider } from '@/lib/payment-provider';
import { rateLimit, apiRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

const normalizeBaseUrl = (value?: string | null) => {
  if (!value || value.length === 0) {
    return 'http://localhost:3000';
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const sanitizeReturnPath = (value: string | undefined, baseUrl: string): string | null => {
  if (!value || value.length === 0) {
    return null;
  }
  try {
    const base = new URL(baseUrl);
    const resolved = new URL(value, base);
    if (resolved.origin !== base.origin) {
      return null;
    }
    const path = `${resolved.pathname}${resolved.search}`;
    if (!path.startsWith('/') || path.startsWith('//')) {
      return null;
    }
    return path;
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  const debug: Record<string, unknown> = { stage: 'init' };
  const debugParam = request.nextUrl.searchParams.get('debug');
  const debugMode = debugParam === '1' || (debugParam ?? '').toLowerCase() === 'true';
  try {
    // Rate limiting check (before authentication to prevent abuse)
    const rateLimitResponse = await rateLimit(request, apiRateLimiter);
    if (rateLimitResponse) {
      console.log('[API] Checkout rate limit exceeded');
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    const planId = body?.planId as string | undefined;
    const returnUrl = body?.returnUrl as string | undefined;
    const provider = resolvePaymentProvider(body?.provider);
    debug.planId = planId;
    debug.returnUrl = returnUrl;
    debug.provider = provider;

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
    }

    const plan = paymentPlansById[planId];
    debug.hasPlan = !!plan;
    debug.usingCheckoutUrl = false;
    debug.hasProductId = !!getPlanProductId(plan);

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[API] checkout auth error', authError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    debug.userId = user?.id ?? null;

    // Additional rate limiting per user (after authentication)
    const userRateLimitResponse = await rateLimit(request, apiRateLimiter, user.id);
    if (userRateLimitResponse) {
      console.log('[API] Checkout rate limit exceeded for user:', user.id);
      return userRateLimitResponse;
    }

    let checkoutUser = {
      id: user.id,
      email: user.email || '',
    };

    try {
      const userData = await ensureProvisionedUser(user);
      if (userData?.id) {
        checkoutUser = {
          id: userData.id,
          email: userData.email || checkoutUser.email,
        };
      }
    } catch (userSyncError) {
      console.error('[API] checkout user sync failed, fallback to auth user', userSyncError);
    }

    const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin);
    debug.baseUrl = baseUrl;
    debug.vercelEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
    const providerProductId = getPlanProductId(plan);
    debug.productId = providerProductId;

    if (provider === 'dodo' && !process.env.DODO_PAYMENTS_API_KEY) {
      console.error('[API] DODO_PAYMENTS_API_KEY not configured');
      return NextResponse.json(
        debugMode
          ? { error: 'Dodo Payments API key not configured', debug }
          : { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    if (!providerProductId) {
      console.error('[API] Plan missing provider productId', { planId: plan.id, provider });
      return NextResponse.json(
        debugMode
          ? { error: `${getPaymentProviderLabel(provider)} productId not configured`, debug }
          : { error: 'Plan not configured for checkout' },
        { status: 500 }
      );
    }

    if (providerProductId) {
      const returnPath = sanitizeReturnPath(returnUrl, baseUrl);
      debug.returnPath = returnPath;

      const callbackParams = new URLSearchParams({ plan: plan.id });
      if (returnPath) {
        callbackParams.set('return_to', returnPath);
      }
      const successUrl = `${baseUrl}/api/pay/callback/dodo?${callbackParams.toString()}`;

      const cancelParams = new URLSearchParams({ checkout: 'cancelled', plan: plan.id });
      if (returnPath) {
        cancelParams.set('return_to', returnPath);
      }
      const cancelUrl = `${baseUrl}/pricing?${cancelParams.toString()}`;

      debug.successUrl = successUrl;
      debug.cancelUrl = cancelUrl;
      debug.productId = providerProductId;
      debug.customerId = checkoutUser.id;

      try {
        const requestId = `checkout_${checkoutUser.id}_${plan.id}_${Date.now()}`;
        const metadata = {
          planId: plan.id,
          planCategory: plan.category,
          credits: plan.credits,
          customerId: checkoutUser.id,
          customerEmail: checkoutUser.email,
          requestId,
          provider,
        };

        const checkout = await createDodoCheckoutSession({
          productId: providerProductId,
          customerId: checkoutUser.id,
          customerEmail: checkoutUser.email,
          customerName: user.user_metadata?.full_name || null,
          returnUrl: successUrl,
          allowedPaymentMethodTypes: plan.allowedPaymentMethodTypes,
          metadata,
        });

        debug.checkoutResult = checkout;

        if (!checkout.checkoutUrl) {
          throw new Error(`${getPaymentProviderLabel(provider)} checkout URL not returned`);
        }
        return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, provider });
      } catch (providerError) {
        const errorMessage = providerError instanceof Error ? providerError.message : String(providerError);
        const errorName = providerError instanceof Error ? providerError.name : 'UnknownError';
        
        debug.providerError = {
          message: errorMessage,
          name: errorName,
          stack: providerError instanceof Error ? providerError.stack : undefined
        };
        
        console.error(`[API] ${getPaymentProviderLabel(provider)} checkout failed:`, {
          planId: plan.id,
          provider,
          productId: providerProductId,
          error: errorMessage,
          errorName,
          debug
        });
        
        // In debug mode, also return the raw error for inspection
        if (debugMode) {
          return NextResponse.json({
            error: `${getPaymentProviderLabel(provider)} checkout failed`,
            debug: {
              ...debug,
              rawError: providerError
            }
          }, { status: 500 });
        }
        
        const isDevelopment = process.env.NODE_ENV === 'development';
        return NextResponse.json(
          (debugMode || isDevelopment)
            ? {
                error: `${getPaymentProviderLabel(provider)} checkout failed`,
                message: errorMessage,
                debug: {
                  ...debug,
                  rawError: providerError instanceof Error ? {
                    message: providerError.message,
                    name: providerError.name,
                    stack: providerError.stack
                  } : String(providerError)
                }
              }
            : {
                error: 'Failed to create payment link',
                message: errorMessage.includes('安全错误') 
                  ? 'Payment service configuration error. Please contact support.'
                  : errorMessage.includes('API key')
                  ? 'Payment service not configured'
                  : 'Failed to create checkout session'
              },
          { status: 500 }
        );
      }
    }

    console.error(`[API] Plan ${planId} is missing Dodo product ID`, {
      planId,
      usingCheckoutUrl: false,
      hasProductId: !!providerProductId,
    });
    return NextResponse.json({ error: 'Plan is not configured for checkout' }, { status: 500 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error('[API ERROR] checkout failed', {
      error: errorMessage,
      errorName,
      stack: error instanceof Error ? error.stack : undefined,
      debug,
    });
    
    // 始终返回错误信息，方便调试
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: errorMessage,
        ...(debugMode && { debug, stack: error instanceof Error ? error.stack : undefined })
      },
      { status: 500 }
    );
  }
}
