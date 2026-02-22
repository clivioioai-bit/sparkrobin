import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createSubscription, subscriptionPlans } from '@/lib/creem-payment';
import { createServerClient } from '@supabase/ssr';
import { rateLimit, apiRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const requestId = `sub_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`[SUBSCRIPTION:${requestId}] ========== Create Subscription Request Started ==========`);
  
  try {
    // Rate limiting
    console.log(`[SUBSCRIPTION:${requestId}] Checking rate limit...`);
    const rateLimitResponse = await rateLimit(request, apiRateLimiter);
    if (rateLimitResponse) {
      console.warn(`[SUBSCRIPTION:${requestId}] ⚠️ Rate limit exceeded`);
      return rateLimitResponse;
    }
    console.log(`[SUBSCRIPTION:${requestId}] ✅ Rate limit check passed`);

    // Get authenticated user from session
    console.log(`[SUBSCRIPTION:${requestId}] Authenticating user...`);
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
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      console.error(`[SUBSCRIPTION:${requestId}] ❌ Authentication failed:`, {
        error: authError?.message,
        error_code: authError?.status
      });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authUser.id;
    console.log(`[SUBSCRIPTION:${requestId}] ✅ User authenticated: ${userId}`);

    // Parse request body
    console.log(`[SUBSCRIPTION:${requestId}] Parsing request body...`);
    const { planId, billingCycle } = await request.json();

    console.log(`[SUBSCRIPTION:${requestId}] Request params:`, {
      plan_id: planId,
      billing_cycle: billingCycle
    });

    if (!planId || !billingCycle) {
      console.error(`[SUBSCRIPTION:${requestId}] ❌ Missing required parameters:`, {
        has_plan_id: !!planId,
        has_billing_cycle: !!billingCycle
      });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get user data
    console.log(`[SUBSCRIPTION:${requestId}] Fetching user data from database...`);
    const { data: user, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error(`[SUBSCRIPTION:${requestId}] ❌ User not found:`, {
        error: userError?.message,
        error_code: userError?.code,
        user_id: userId
      });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`[SUBSCRIPTION:${requestId}] ✅ User data fetched:`, {
      user_id: userId,
      user_email: user.email
    });

    // Get plan details
    console.log(`[SUBSCRIPTION:${requestId}] Validating plan: ${planId}`);
    const plan = subscriptionPlans[planId];
    if (!plan) {
      console.error(`[SUBSCRIPTION:${requestId}] ❌ Invalid plan ID: ${planId}`);
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const priceInfo = plan[billingCycle as 'monthly' | 'yearly'];
    if (!priceInfo) {
      console.error(`[SUBSCRIPTION:${requestId}] ❌ Invalid billing cycle: ${billingCycle}`);
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`;

    console.log(`[SUBSCRIPTION:${requestId}] Plan details:`, {
      plan_id: planId,
      billing_cycle: billingCycle,
      product_id: priceInfo.productId,
      price: priceInfo.price
    });

    // Create subscription with Creem Payment
    console.log(`[SUBSCRIPTION:${requestId}] Creating subscription with Creem Payment...`);
    const subscription = await createSubscription({
      customerId: userId,
      customerEmail: user.email,
      planId: priceInfo.productId,
      billingCycle: billingCycle,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
    });

    console.log(`[SUBSCRIPTION:${requestId}] ✅ Creem subscription created:`, {
      subscription_id: subscription.id,
      checkout_url: subscription.checkoutUrl ? `${subscription.checkoutUrl.substring(0, 50)}...` : null
    });

    // Store subscription in database
    console.log(`[SUBSCRIPTION:${requestId}] Storing subscription in database...`);
    const { data: subscriptionData, error: subError } = await getSupabaseAdmin()
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_type: planId,
        plan_status: 'pending',
        subscription_id: subscription.id,
        customer_id: userId,
      })
      .select()
      .single();

    if (subError) {
      console.error(`[SUBSCRIPTION:${requestId}] ❌ Subscription DB insert failed:`, {
        error: subError.message,
        error_code: subError.code,
        error_details: subError.details,
        user_id: userId,
        subscription_id: subscription.id
      });
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    const durationMs = Date.now() - startTime;
    console.log(`[SUBSCRIPTION:${requestId}] ========== Subscription Created Successfully ==========`, {
      user_id: userId,
      subscription_id: subscriptionData.id,
      creem_subscription_id: subscription.id,
      plan_type: planId,
      billing_cycle: billingCycle,
      duration_ms: durationMs
    });

    return NextResponse.json({
      success: true,
      checkout_url: subscription.checkoutUrl,
      subscription_id: subscriptionData.id,
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`[SUBSCRIPTION:${requestId}] ========== Subscription Creation Failed ==========`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : undefined,
      duration_ms: durationMs
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
