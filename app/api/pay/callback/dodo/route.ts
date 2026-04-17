import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

import { paymentPlansById } from '@/config/payment-plans';
import { getDodoCheckoutSession } from '@/lib/dodo-payments';
import { creditCredits } from '@/lib/credits';
import { recordUnmatchedPaymentEmail } from '@/lib/payment-recovery';
import { getExternalPaymentId } from '@/lib/payment-records';
import { resolveExternalPaymentIdColumn } from '@/lib/payment-records';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan') || '';
    const sessionId = searchParams.get('session_id');
    const paymentIdFromQuery = searchParams.get('payment_id');
    const statusFromQuery = searchParams.get('status');

    let amount = '1.0';
    let currency = 'USD';
    let transactionId = paymentIdFromQuery || '';

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
    } = await supabase.auth.getUser();

    if (user) {
      const { data: payment } = await getSupabaseAdmin()
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_method', 'dodo')
        .eq('status', 'succeeded')
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (payment) {
        amount = (payment.amount / 100).toFixed(2);
        currency = payment.currency;
        transactionId = getExternalPaymentId(payment) || transactionId;
      }
    }

    let checkoutSession: Awaited<ReturnType<typeof getDodoCheckoutSession>> | null = null;

    if ((!transactionId || !statusFromQuery) && sessionId && process.env.DODO_PAYMENTS_API_KEY) {
      try {
        const checkout = await getDodoCheckoutSession(sessionId);
        checkoutSession = checkout;
        if (!transactionId) {
          transactionId = checkout.payment_id || '';
        }
      } catch (error) {
        console.warn('[CALLBACK][DODO] Failed to fetch checkout session', error);
      }
    }

    if (!transactionId && plan) {
      const planConfig = paymentPlansById[plan];
      if (planConfig) {
        amount = (planConfig.priceCents / 100).toFixed(2);
        currency = planConfig.currency;
        transactionId = `dodo_${Date.now()}`;
      }
    }

    if (!plan) {
      return NextResponse.redirect(new URL('/dashboard?payment=error', request.url));
    }

    const planConfig = paymentPlansById[plan] || null;
    const normalizedStatus = String(statusFromQuery || checkoutSession?.payment_status || '').toLowerCase();
    const isPaid = ['paid', 'succeeded', 'success', 'completed'].includes(normalizedStatus);

    if (!planConfig && isPaid) {
      await recordUnmatchedPaymentEmail({
        email: user?.email || checkoutSession?.customer_email || 'unknown@payment.local',
        paymentId: transactionId || null,
        amount: Number(amount),
        currency,
        webhookData: {
          plan,
          sessionId,
          paymentId: transactionId,
          status: normalizedStatus,
        },
        notes: 'callback reconcile missing plan config',
      });
    }

    if (!user && planConfig && transactionId && isPaid) {
      await recordUnmatchedPaymentEmail({
        email: checkoutSession?.customer_email || 'unknown@payment.local',
        paymentId: transactionId || null,
        amount: planConfig.priceCents / 100,
        currency: planConfig.currency,
        webhookData: {
          plan,
          sessionId,
          paymentId: transactionId,
          status: normalizedStatus,
        },
        notes: 'callback reconcile missing authenticated user',
      });
    }

    if (user && planConfig && transactionId && isPaid) {
      const admin = getSupabaseAdmin();
      const externalPaymentIdColumn = await resolveExternalPaymentIdColumn();

      const { data: existingPayment } = await admin
        .from('payments')
        .select('id')
        .eq(externalPaymentIdColumn, transactionId)
        .maybeSingle();

      let paymentRecordId = existingPayment?.id || null;

      if (!paymentRecordId) {
        const insertedPayment = await admin
          .from('payments')
          .insert({
            user_id: user.id,
            payment_id: transactionId,
            [externalPaymentIdColumn]: transactionId,
            amount: planConfig.priceCents,
            currency: planConfig.currency,
            status: 'succeeded',
            payment_method: 'dodo',
          })
          .select('id')
          .single();

        paymentRecordId = insertedPayment.data?.id || null;
      }

      if (planConfig.category === 'subscription') {
        const { data: existingSubscription } = await admin
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('plan_type', planConfig.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSubscription?.id) {
          await admin
            .from('user_subscriptions')
            .update({
              plan_status: 'active',
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSubscription.id);
        } else {
          const insertedSubscription = await admin
            .from('user_subscriptions')
            .insert({
              user_id: user.id,
              plan_type: planConfig.id,
              plan_status: 'active',
              status: 'active',
            })
            .select('id')
            .single();

          if (paymentRecordId && insertedSubscription.data?.id) {
            await admin
              .from('payments')
              .update({ subscription_id: insertedSubscription.data.id })
              .eq('id', paymentRecordId);
          }
        }

        await admin
          .from('users')
          .update({
            subscription_plan: planConfig.id,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        const existingReset = await admin
          .from('credit_transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('reason', 'subscription_period_reset')
          .eq('metadata->>paymentId', transactionId)
          .maybeSingle();

        if (!existingReset.data) {
          await admin.rpc('reset_subscription_credits_for_period', {
            p_user_id: user.id,
            p_period_credits: planConfig.credits,
            p_reason: 'subscription_period_reset',
            p_metadata: {
              provider: 'dodo',
              planId: planConfig.id,
              paymentId: transactionId,
              eventType: 'callback.reconcile',
            },
          });
        }
      } else {
        const existingCredit = await admin
          .from('credit_transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('reason', 'dodo_payment')
          .eq('metadata->>paymentId', transactionId)
          .maybeSingle();

        if (!existingCredit.data) {
          await creditCredits(user.id, planConfig.credits, 'dodo_payment', {
            provider: 'dodo',
            planId: planConfig.id,
            planCategory: planConfig.category,
            paymentId: transactionId,
            bucket: 'flex',
            eventType: 'callback.reconcile',
          });
        }
      }
    }

    const qp: Record<string, string> = {
      plan,
      provider: 'dodo',
      transaction_id: transactionId || `dodo_${Date.now()}`,
      value: amount,
      currency,
    };

    if (sessionId) qp.session_id = sessionId;
    if (statusFromQuery) qp.status = statusFromQuery;

    return NextResponse.redirect(new URL(`/payment/success?${new URLSearchParams(qp).toString()}`, request.url));
  } catch (error) {
    console.error('[CALLBACK][DODO] Error processing return URL:', error);
    return NextResponse.redirect(new URL('/dashboard?payment=error', request.url));
  }
}
