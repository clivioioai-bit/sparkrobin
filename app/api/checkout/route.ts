import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createCheckoutForProduct } from '@/lib/creem-payment';
import { createDodoCheckoutSession } from '@/lib/dodo-payments';
import { creemPlansById, getPlanProductId } from '@/config/creemPlans';
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

    const plan = creemPlansById[planId];
    debug.hasPlan = !!plan;
    debug.usingCheckoutUrl = !!plan?.checkoutUrl;
    debug.hasProductId = !!getPlanProductId(plan, provider);

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
      const adminClient = getSupabaseAdmin();
      const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (userData?.id) {
        checkoutUser = {
          id: userData.id,
          email: userData.email || checkoutUser.email,
        };
      } else {
        console.warn('[API] checkout user lookup missing, trying to provision user record', {
          userId: user.id,
          code: (userError as any)?.code,
          message: (userError as any)?.message,
        });

        const { data: createdUser, error: createUserError } = await adminClient
          .from('users')
          .upsert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email || '',
            subscription_plan: 'free',
            subscription_status: 'active',
            credits_balance: 0,
            credits_total: 0,
            credits_spent: 0,
          }, { onConflict: 'id' })
          .select('id, email')
          .single();

        if (createUserError || !createdUser) {
          console.error('[API] checkout user auto-provision failed, fallback to auth user', createUserError);
        } else {
          checkoutUser = {
            id: createdUser.id,
            email: createdUser.email || checkoutUser.email,
          };
        }
      }
    } catch (userSyncError) {
      console.error('[API] checkout user sync failed, fallback to auth user', userSyncError);
    }

    const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin);
    debug.baseUrl = baseUrl;
    debug.vercelEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
    debug.hasCreemApiKey = !!process.env.CREEM_API_KEY;
    debug.creemApiKeyPrefix = process.env.CREEM_API_KEY?.substring(0, 20) || 'not set';
    const providerProductId = getPlanProductId(plan, provider);
    debug.productId = providerProductId;

    if (provider === 'creem' && !process.env.CREEM_API_KEY) {
      console.error('[API] CREEM_API_KEY not configured');
      return NextResponse.json(
        debugMode
          ? { error: 'Creem API key not configured', debug }
          : { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

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
      const callbackProvider = provider === 'dodo' ? 'dodo' : 'creem';
      const successUrl = `${baseUrl}/api/pay/callback/${callbackProvider}?${callbackParams.toString()}`;

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

        const checkout =
          provider === 'dodo'
            ? await createDodoCheckoutSession({
                productId: providerProductId,
                customerId: checkoutUser.id,
                customerEmail: checkoutUser.email,
                customerName: user.user_metadata?.full_name || null,
                returnUrl: successUrl,
                allowedPaymentMethodTypes: plan.allowedPaymentMethodTypes,
                metadata,
              })
            : await createCheckoutForProduct({
                productId: providerProductId,
                customerId: checkoutUser.id,
                customerEmail: checkoutUser.email,
                successUrl,
                cancelUrl,
                requestId,
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

    // Fallback: if plan only has a static checkoutUrl, return it
    // ⚠️ 注意：静态 URL 可能不存在，优先使用 productId 通过 API 创建 checkout
    if (plan.checkoutUrl && plan.checkoutUrl.length > 0) {
      // 在开发模式下，如果 productId 未配置，给出明确错误而不是使用可能不存在的静态 URL
      const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_API_ENV === 'development';
      if (isDevelopment && !plan.productId) {
        console.error('[API] ⚠️ 开发模式：plan 缺少 productId，无法通过 API 创建 checkout', {
          planId: plan.id,
          hasCheckoutUrl: !!plan.checkoutUrl,
          checkoutUrl: plan.checkoutUrl,
        });
        return NextResponse.json(
          debugMode
            ? {
                error: 'Plan productId not configured',
                message: `Plan "${plan.id}" 需要配置 NEXT_PUBLIC_CREEM_PACK_STARTER_ID (或对应的 productId) 环境变量。静态 checkoutUrl 可能不存在。`,
                debug: {
                  ...debug,
                  planId: plan.id,
                  hasProductId: !!plan.productId,
                  hasCheckoutUrl: !!plan.checkoutUrl,
                  checkoutUrl: plan.checkoutUrl,
                }
              }
            : {
                error: 'Plan not configured for checkout',
                message: 'Please configure productId for this plan in environment variables.'
              },
          { status: 500 }
        );
      }
      // 生产环境或已有 productId 时，允许使用静态 URL（向后兼容）
      return NextResponse.json({ checkoutUrl: plan.checkoutUrl });
    }

    console.error(`[API] Plan ${planId} is missing productId and checkoutUrl`, {
      planId,
      usingCheckoutUrl: !!plan.checkoutUrl,
      hasProductId: !!plan.productId,
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
