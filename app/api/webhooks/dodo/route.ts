import { NextRequest, NextResponse } from 'next/server';

import { creemPlansById } from '@/config/creemPlans';
import { creditCredits } from '@/lib/credits';
import { verifyDodoWebhookSignature } from '@/lib/dodo-payments';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

type SubscriptionIdColumn = 'subscription_id' | 'creem_subscription_id';

let subscriptionIdColumnCache: SubscriptionIdColumn | null = null;

async function resolveSubscriptionIdColumn(): Promise<SubscriptionIdColumn> {
  if (subscriptionIdColumnCache) {
    return subscriptionIdColumnCache;
  }

  const admin = getSupabaseAdmin();
  for (const column of ['subscription_id', 'creem_subscription_id'] as const) {
    const { error } = await admin.from('user_subscriptions').select(column).limit(1);
    if (!error) {
      subscriptionIdColumnCache = column;
      return column;
    }
  }

  return 'subscription_id';
}

async function findUserId(payload: any) {
  const explicit = payload?.metadata?.customerId || payload?.customer_id || payload?.customer?.customer_id;
  if (explicit) {
    return String(explicit);
  }

  const email = payload?.customer?.email || payload?.metadata?.customerEmail;
  if (!email) return null;

  const { data } = await getSupabaseAdmin()
    .from('users')
    .select('id')
    .ilike('email', String(email))
    .maybeSingle();

  return data?.id || null;
}

function getPlanConfig(payload: any) {
  const planId = payload?.metadata?.planId;
  if (planId && creemPlansById[planId]) {
    return creemPlansById[planId];
  }

  const productId = payload?.product_cart?.[0]?.product_id || payload?.product_id;
  if (!productId) return null;

  return Object.values(creemPlansById).find((plan) => plan.productId === productId || plan.dodoProductId === productId) || null;
}

async function upsertSubscriptionRecord(params: {
  userId: string;
  subscriptionId: string;
  planId: string | null;
  status: string;
  currentPeriodEnd?: string | null;
}) {
  const admin = getSupabaseAdmin();
  const subscriptionIdColumn = await resolveSubscriptionIdColumn();
  const existing = await admin
    .from('user_subscriptions')
    .select('id')
    .eq(subscriptionIdColumn, params.subscriptionId)
    .maybeSingle();

  const payload = {
    user_id: params.userId,
    plan_type: params.planId,
    plan_status: params.status,
    status: params.status,
    current_period_end: params.currentPeriodEnd || null,
    [subscriptionIdColumn]: params.subscriptionId,
  };

  if (existing.data?.id) {
    await admin.from('user_subscriptions').update(payload).eq('id', existing.data.id);
    return existing.data.id;
  }

  const inserted = await admin.from('user_subscriptions').insert(payload).select('id').single();
  return inserted.data?.id || null;
}

async function updateUserSubscriptionState(params: {
  userId: string;
  planId: string | null;
  status: string;
  currentPeriodEnd?: string | null;
}) {
  await getSupabaseAdmin()
    .from('users')
    .update({
      subscription_plan: params.planId || 'free',
      subscription_status: params.status,
      subscription_end_date: params.currentPeriodEnd || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.userId);
}

async function recordPayment(params: {
  userId: string;
  paymentId: string;
  subscriptionRecordId?: string | null;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed';
}) {
  const admin = getSupabaseAdmin();
  const existing = await admin
    .from('payments')
    .select('id')
    .eq('creem_payment_id', params.paymentId)
    .maybeSingle();

  const payload = {
    user_id: params.userId,
    subscription_id: params.subscriptionRecordId || null,
    payment_id: params.paymentId,
    amount: params.amount,
    currency: params.currency,
    status: params.status,
    payment_method: 'dodo',
    creem_payment_id: params.paymentId,
  };

  if (existing.data?.id) {
    await admin.from('payments').update(payload).eq('id', existing.data.id);
    return;
  }

  await admin.from('payments').insert(payload);
}

async function handlePaymentSucceeded(payment: any) {
  const userId = await findUserId(payment);
  if (!userId) {
    console.error('[WEBHOOK][DODO] Could not resolve user for payment.succeeded');
    return;
  }

  const planConfig = getPlanConfig(payment);
  const planId = payment?.metadata?.planId || planConfig?.id || null;
  const planCategory = payment?.metadata?.planCategory || planConfig?.category || null;
  const subscriptionId = payment?.subscription_id || null;
  const amount = Number(payment?.total_amount ?? payment?.amount ?? 0);
  const currency = payment?.currency || 'USD';
  const paymentId = payment?.payment_id || payment?.id || `dodo_${userId}_${Date.now()}`;
  const credits = Number(payment?.metadata?.credits ?? planConfig?.credits ?? 0);

  let subscriptionRecordId: string | null = null;

  if (subscriptionId) {
    subscriptionRecordId = await upsertSubscriptionRecord({
      userId,
      subscriptionId: String(subscriptionId),
      planId,
      status: 'active',
      currentPeriodEnd: payment?.metadata?.currentPeriodEnd || null,
    });

    await updateUserSubscriptionState({
      userId,
      planId,
      status: 'active',
      currentPeriodEnd: payment?.metadata?.currentPeriodEnd || null,
    });
  }

  if (credits > 0) {
    if (planCategory === 'subscription' && subscriptionId) {
      await getSupabaseAdmin().rpc('reset_subscription_credits_for_period', {
        p_user_id: userId,
        p_period_credits: credits,
        p_reason: 'subscription_period_reset',
        p_metadata: {
          provider: 'dodo',
          planId,
          paymentId,
          subscriptionId,
          eventType: 'payment.succeeded',
        },
      });
    } else {
      const existingCredit = await getSupabaseAdmin()
        .from('credit_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('metadata->>paymentId', paymentId)
        .eq('reason', 'dodo_payment')
        .maybeSingle();

      if (!existingCredit.data) {
        await creditCredits(userId, credits, 'dodo_payment', {
          provider: 'dodo',
          planId,
          planCategory,
          paymentId,
          bucket: 'flex',
          eventType: 'payment.succeeded',
        });
      }
    }
  }

  await recordPayment({
    userId,
    paymentId,
    subscriptionRecordId,
    amount,
    currency,
    status: 'succeeded',
  });
}

async function handlePaymentFailed(payment: any) {
  const userId = await findUserId(payment);
  if (!userId) return;

  await recordPayment({
    userId,
    paymentId: payment?.payment_id || payment?.id || `dodo_failed_${Date.now()}`,
    amount: Number(payment?.total_amount ?? payment?.amount ?? 0),
    currency: payment?.currency || 'USD',
    status: 'failed',
  });
}

async function handleSubscriptionUpdated(subscription: any, statusOverride?: string) {
  const userId = await findUserId(subscription);
  const subscriptionId = subscription?.subscription_id || subscription?.id;
  if (!userId || !subscriptionId) return;

  const planConfig = getPlanConfig(subscription);
  const planId = subscription?.metadata?.planId || planConfig?.id || null;
  const status = statusOverride || subscription?.status || 'active';
  const currentPeriodEnd = subscription?.next_billing_date || subscription?.current_period_end || null;

  await upsertSubscriptionRecord({
    userId,
    subscriptionId: String(subscriptionId),
    planId,
    status,
    currentPeriodEnd,
  });

  await updateUserSubscriptionState({
    userId,
    planId,
    status,
    currentPeriodEnd,
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'Dodo Payments webhook endpoint is active',
    methods: ['POST'],
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const webhookId = request.headers.get('webhook-id');
  const webhookSignature = request.headers.get('webhook-signature');
  const webhookTimestamp = request.headers.get('webhook-timestamp');

  const verified = verifyDodoWebhookSignature(body, {
    webhookId,
    webhookSignature,
    webhookTimestamp,
  });

  if (!verified) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  const event = JSON.parse(body);
  const eventType = event?.type || 'unknown';
  const payload = event?.data || {};

  try {
    switch (eventType) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(payload);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      case 'subscription.active':
      case 'subscription.renewed':
      case 'subscription.updated':
      case 'subscription.plan_changed':
        await handleSubscriptionUpdated(payload);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionUpdated(payload, 'canceled');
        break;
      case 'subscription.expired':
      case 'subscription.on_hold':
      case 'subscription.failed':
        await handleSubscriptionUpdated(payload, 'inactive');
        break;
      default:
        console.log('[WEBHOOK][DODO] Ignored event:', eventType);
    }
  } catch (error) {
    console.error('[WEBHOOK][DODO] Failed to process event', { eventType, error });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
