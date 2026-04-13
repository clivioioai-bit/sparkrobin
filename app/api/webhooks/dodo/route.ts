import { NextRequest, NextResponse } from 'next/server';

import { paymentPlansById } from '@/config/payment-plans';
import { creditCredits } from '@/lib/credits';
import { verifyDodoWebhookSignature } from '@/lib/dodo-payments';
import { resolveExternalPaymentIdColumn } from '@/lib/payment-records';
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
  if (planId && paymentPlansById[planId]) {
    return paymentPlansById[planId];
  }

  const productId =
    payload?.product_cart?.[0]?.product_id ||
    payload?.product_id ||
    payload?.product?.product_id ||
    payload?.product?.id ||
    payload?.items?.[0]?.product_id;
  if (!productId) return null;

  return Object.values(paymentPlansById).find((plan) => plan.dodoProductId === productId) || null;
}

function getCurrentPeriodEnd(payload: any) {
  return (
    payload?.subscription?.current_period_end ||
    payload?.subscription?.current_period_end_date ||
    payload?.metadata?.currentPeriodEnd ||
    payload?.next_billing_date ||
    payload?.current_period_end ||
    payload?.current_period_end_date ||
    null
  );
}

function getSubscriptionId(payload: any) {
  return (
    payload?.subscription_id ||
    payload?.subscription?.subscription_id ||
    payload?.subscription?.id ||
    payload?.metadata?.subscriptionId ||
    null
  );
}

async function hasExistingSubscriptionReset(params: {
  userId: string;
  paymentId?: string | null;
  subscriptionId?: string | null;
  currentPeriodEnd?: string | null;
  planId?: string | null;
}) {
  const admin = getSupabaseAdmin();

  if (params.paymentId) {
    const { data } = await admin
      .from('credit_transactions')
      .select('id')
      .eq('user_id', params.userId)
      .eq('reason', 'subscription_period_reset')
      .eq('metadata->>paymentId', params.paymentId)
      .maybeSingle();

    if (data?.id) {
      return true;
    }
  }

  if (params.subscriptionId && params.currentPeriodEnd) {
    const { data } = await admin
      .from('credit_transactions')
      .select('id')
      .eq('user_id', params.userId)
      .eq('reason', 'subscription_period_reset')
      .eq('metadata->>subscriptionId', params.subscriptionId)
      .eq('metadata->>currentPeriodEnd', params.currentPeriodEnd)
      .maybeSingle();

    if (data?.id) {
      return true;
    }
  }

  if (params.planId && params.currentPeriodEnd) {
    const { data } = await admin
      .from('credit_transactions')
      .select('id')
      .eq('user_id', params.userId)
      .eq('reason', 'subscription_period_reset')
      .eq('metadata->>planId', params.planId)
      .eq('metadata->>currentPeriodEnd', params.currentPeriodEnd)
      .maybeSingle();

    if (data?.id) {
      return true;
    }
  }

  if (params.planId) {
    const recentThreshold = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data } = await admin
      .from('credit_transactions')
      .select('id')
      .eq('user_id', params.userId)
      .eq('reason', 'subscription_period_reset')
      .eq('metadata->>planId', params.planId)
      .gte('created_at', recentThreshold)
      .maybeSingle();

    if (data?.id) {
      return true;
    }
  }

  return false;
}

async function resetSubscriptionCredits(params: {
  userId: string;
  credits: number;
  planId?: string | null;
  subscriptionId?: string | null;
  paymentId?: string | null;
  currentPeriodEnd?: string | null;
  eventType: string;
}) {
  if (params.credits <= 0) {
    return false;
  }

  const alreadyReset = await hasExistingSubscriptionReset({
    userId: params.userId,
    paymentId: params.paymentId,
    subscriptionId: params.subscriptionId,
    currentPeriodEnd: params.currentPeriodEnd,
    planId: params.planId,
  });

  if (alreadyReset) {
    console.log('[WEBHOOK][DODO] Skipping duplicate subscription credit reset', {
      userId: params.userId,
      subscriptionId: params.subscriptionId,
      paymentId: params.paymentId,
      currentPeriodEnd: params.currentPeriodEnd,
      eventType: params.eventType,
    });
    return false;
  }

  await getSupabaseAdmin().rpc('reset_subscription_credits_for_period', {
    p_user_id: params.userId,
    p_period_credits: params.credits,
    p_reason: 'subscription_period_reset',
    p_metadata: {
      provider: 'dodo',
      planId: params.planId ?? null,
      paymentId: params.paymentId ?? null,
      subscriptionId: params.subscriptionId ?? null,
      currentPeriodEnd: params.currentPeriodEnd ?? null,
      eventType: params.eventType,
    },
  });

  return true;
}

async function upsertSubscriptionRecord(params: {
  userId: string;
  subscriptionId?: string | null;
  planId: string | null;
  status: string;
  currentPeriodEnd?: string | null;
}) {
  const admin = getSupabaseAdmin();
  const subscriptionIdColumn = await resolveSubscriptionIdColumn();
  let existing;

  if (params.subscriptionId) {
    existing = await admin
      .from('user_subscriptions')
      .select('id')
      .eq(subscriptionIdColumn, params.subscriptionId)
      .maybeSingle();
  }

  if (!existing?.data?.id) {
    existing = await admin
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', params.userId)
      .eq('plan_type', params.planId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  const payload = {
    user_id: params.userId,
    plan_type: params.planId,
    plan_status: params.status,
    status: params.status,
    current_period_end: params.currentPeriodEnd || null,
    ...(params.subscriptionId ? { [subscriptionIdColumn]: params.subscriptionId } : {}),
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
  const externalPaymentIdColumn = await resolveExternalPaymentIdColumn();
  const existing = await admin
    .from('payments')
    .select('id')
    .eq(externalPaymentIdColumn, params.paymentId)
    .maybeSingle();

  const payload = {
    user_id: params.userId,
    subscription_id: params.subscriptionRecordId || null,
    payment_id: params.paymentId,
    [externalPaymentIdColumn]: params.paymentId,
    amount: params.amount,
    currency: params.currency,
    status: params.status,
    payment_method: 'dodo',
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
  const subscriptionId = getSubscriptionId(payment);
  const currentPeriodEnd = getCurrentPeriodEnd(payment);
  const amount = Number(payment?.total_amount ?? payment?.amount ?? 0);
  const currency = payment?.currency || 'USD';
  const paymentId = payment?.payment_id || payment?.id || `dodo_${userId}_${Date.now()}`;
  const credits = Number(payment?.metadata?.credits ?? planConfig?.credits ?? 0);

  let subscriptionRecordId: string | null = null;

  if (planCategory === 'subscription' && planId) {
    subscriptionRecordId = await upsertSubscriptionRecord({
      userId,
      subscriptionId: subscriptionId ? String(subscriptionId) : null,
      planId,
      status: 'active',
      currentPeriodEnd,
    });

    await updateUserSubscriptionState({
      userId,
      planId,
      status: 'active',
      currentPeriodEnd,
    });

    if (!subscriptionId) {
      console.warn('[WEBHOOK][DODO] payment.succeeded missing subscription_id for subscription plan', {
        userId,
        planId,
        paymentId,
        currentPeriodEnd,
      });
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

  if (credits > 0) {
    if (planCategory === 'subscription') {
      await resetSubscriptionCredits({
        userId,
        credits,
        planId,
        subscriptionId: subscriptionId ? String(subscriptionId) : null,
        paymentId,
        currentPeriodEnd,
        eventType: 'payment.succeeded',
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
  const subscriptionId = getSubscriptionId(subscription) || subscription?.id;
  if (!userId || !subscriptionId) return;

  const planConfig = getPlanConfig(subscription);
  const planId = subscription?.metadata?.planId || planConfig?.id || null;
  const planCategory = subscription?.metadata?.planCategory || planConfig?.category || null;
  const status = statusOverride || subscription?.status || 'active';
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);
  const credits = Number(subscription?.metadata?.credits ?? planConfig?.credits ?? 0);

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

  if (
    credits > 0 &&
    planCategory === 'subscription' &&
    status === 'active'
  ) {
    await resetSubscriptionCredits({
      userId,
      credits,
      planId,
      subscriptionId: String(subscriptionId),
      currentPeriodEnd,
      eventType: `subscription.${status}`,
    });
  }
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
