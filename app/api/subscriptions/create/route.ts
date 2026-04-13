import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { ensureProvisionedUser } from '@/lib/account-provisioning';
import { createDodoCheckoutSession } from '@/lib/dodo-payments';
import { paymentPlansById, getPlanProductId } from '@/config/payment-plans';
import { resolvePaymentProvider } from '@/lib/payment-provider';
import { rateLimit, apiRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

const LEGACY_PLAN_MAP: Record<string, { monthly: string; yearly: string }> = {
  basic: {
    monthly: 'basic_monthly',
    yearly: 'basic_yearly',
  },
  creator: {
    monthly: 'creator_monthly',
    yearly: 'creator_yearly',
  },
  pro: {
    monthly: 'pro_monthly',
    yearly: 'pro_yearly',
  },
};

function normalizeBaseUrl(value?: string | null) {
  if (!value || value.length === 0) {
    return 'http://localhost:3000';
  }

  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolveLegacyPlanId(planId: string, billingCycle: string) {
  const legacyPlan = LEGACY_PLAN_MAP[planId];
  if (!legacyPlan) {
    return null;
  }

  return legacyPlan[billingCycle as 'monthly' | 'yearly'] || null;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimit(request, apiRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { planId, billingCycle, provider } = await request.json();
    if (!planId || !billingCycle) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const resolvedPlanId = resolveLegacyPlanId(String(planId), String(billingCycle));
    if (!resolvedPlanId) {
      return NextResponse.json({ error: 'Invalid legacy plan mapping' }, { status: 400 });
    }

    const plan = paymentPlansById[resolvedPlanId];
    if (!plan || plan.category !== 'subscription') {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const checkoutUser = await ensureProvisionedUser(user);
    const resolvedProvider = resolvePaymentProvider(provider);
    const productId = getPlanProductId(plan);

    if (!productId) {
      return NextResponse.json({ error: 'Plan not configured for checkout' }, { status: 500 });
    }

    const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin);
    const callbackParams = new URLSearchParams({ plan: plan.id });
    const successUrl = `${baseUrl}/api/pay/callback/dodo?${callbackParams.toString()}`;
    const cancelUrl = `${baseUrl}/pricing?${new URLSearchParams({ checkout: 'cancelled', plan: plan.id }).toString()}`;
    const requestId = `legacy_checkout_${checkoutUser.id}_${plan.id}_${Date.now()}`;
    const metadata = {
      planId: plan.id,
      planCategory: plan.category,
      credits: plan.credits,
      customerId: checkoutUser.id,
      customerEmail: checkoutUser.email,
      requestId,
      provider: resolvedProvider,
      legacyPlanId: String(planId),
      legacyBillingCycle: String(billingCycle),
    };

    const checkout = await createDodoCheckoutSession({
      productId,
      customerId: checkoutUser.id,
      customerEmail: checkoutUser.email,
      customerName: checkoutUser.full_name,
      returnUrl: successUrl,
      allowedPaymentMethodTypes: plan.allowedPaymentMethodTypes,
      metadata,
    });

    return NextResponse.json({
      success: true,
      checkout_url: checkout.checkoutUrl,
      provider: resolvedProvider,
      plan_id: plan.id,
    });
  } catch (error) {
    console.error('[SUBSCRIPTIONS CREATE] compatibility route failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
