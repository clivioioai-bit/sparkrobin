import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

import { creemPlansById } from '@/config/creemPlans';
import { getDodoCheckoutSession } from '@/lib/dodo-payments';
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
        .select('amount, currency, creem_payment_id, payment_method')
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
        transactionId = payment.creem_payment_id || transactionId;
      }
    }

    if ((!transactionId || !statusFromQuery) && sessionId && process.env.DODO_PAYMENTS_API_KEY) {
      try {
        const checkout = await getDodoCheckoutSession(sessionId);
        if (!transactionId) {
          transactionId = checkout.payment_id || '';
        }
      } catch (error) {
        console.warn('[CALLBACK][DODO] Failed to fetch checkout session', error);
      }
    }

    if (!transactionId && plan) {
      const planConfig = creemPlansById[plan];
      if (planConfig) {
        amount = (planConfig.priceCents / 100).toFixed(2);
        currency = planConfig.currency;
        transactionId = `dodo_${Date.now()}`;
      }
    }

    if (!plan) {
      return NextResponse.redirect(new URL('/dashboard?payment=error', request.url));
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
