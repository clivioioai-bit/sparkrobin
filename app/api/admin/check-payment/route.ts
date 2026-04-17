import { NextRequest, NextResponse } from 'next/server';
import { isMissingPaymentRecoveryTable } from '@/lib/payment-recovery';
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

// 检查特定支付的处理状态
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const checkoutId = searchParams.get('checkout_id');
  const orderId = searchParams.get('order_id');
  const customerId = searchParams.get('customer_id');
  const productId = searchParams.get('product_id');
  
  if (!checkoutId && !orderId) {
    return NextResponse.json({
      error: 'Please provide checkout_id or order_id'
    }, { status: 400 });
  }
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const externalPaymentIdColumn = await resolveExternalPaymentIdColumn();
    const subscriptionIdColumn = await resolveSubscriptionIdColumn();
    
    const result: any = {
      timestamp: new Date().toISOString(),
      schema: {
        externalPaymentIdColumn,
        subscriptionIdColumn,
      },
      searchParams: {
        checkoutId,
        orderId,
        customerId,
        productId
      }
    };
    
    // 1. 检查支付记录
    if (orderId) {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq(externalPaymentIdColumn, orderId)
        .maybeSingle();
      
      result.payment = {
        found: !!payment,
        data: payment,
        error: paymentError?.message
      };
    }

    // 1.1 检查数据库中的积分 RPC 是否存在
    let rpcRows: any[] | null = null;
    let rpcError: { message: string } | null = null;

    try {
      const rpcResult = await supabaseAdmin
        .rpc('exec_sql', {
          query: `
            select
              proname,
              oidvectortypes(proargtypes) as arguments
            from pg_proc
            where pronamespace = 'public'::regnamespace
              and proname in ('credit_user_credits_transaction', 'credit_user_credits', 'reset_subscription_credits_for_period')
            order by proname asc
          `,
        })
        .single();

      rpcRows = Array.isArray(rpcResult.data) ? rpcResult.data : [];
      rpcError = rpcResult.error ? { message: rpcResult.error.message } : null;
    } catch {
      rpcError = { message: 'exec_sql RPC unavailable' };
    }

    result.rpcFunctions = {
      success: !rpcError,
      functions: Array.isArray(rpcRows) ? rpcRows : [],
      error: rpcError?.message || null,
    };
    
    // 2. 检查积分交易（通过 checkout_id 或 order_id）
    const creditQueries = [];
    if (checkoutId) {
      creditQueries.push(
        supabaseAdmin
          .from('credit_transactions')
          .select('*')
          .eq('metadata->>paymentId', checkoutId)
          .eq('reason', 'dodo_payment')
      );
    }
    if (orderId) {
      creditQueries.push(
        supabaseAdmin
          .from('credit_transactions')
          .select('*')
          .eq('metadata->>paymentId', orderId)
          .eq('reason', 'dodo_payment')
      );
    }
    
    if (creditQueries.length > 0) {
      const creditResults = await Promise.all(creditQueries);
      const allCredits = creditResults.flatMap(r => r.data || []);
      result.credits = {
        found: allCredits.length > 0,
        count: allCredits.length,
        transactions: allCredits
      };
    }

    // 2.1 检查订阅记录
    if (orderId || customerId) {
      let subscriptionQuery = supabaseAdmin
        .from('user_subscriptions')
        .select(`id, user_id, plan_type, plan_status, status, ${subscriptionIdColumn}, current_period_end, created_at, updated_at`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (customerId) {
        subscriptionQuery = subscriptionQuery.eq('user_id', customerId);
      } else if (result.payment?.data?.subscription_id) {
        subscriptionQuery = subscriptionQuery.eq('id', result.payment.data.subscription_id);
      }

      const { data: subscriptions, error: subscriptionError } = await subscriptionQuery;
      result.subscriptions = {
        found: (subscriptions?.length || 0) > 0,
        count: subscriptions?.length || 0,
        records: subscriptions || [],
        error: subscriptionError?.message,
      };
    }
    
    // 3. 如果提供了 customer_id，检查用户信息
    if (customerId) {
      // 先尝试通过 Creem customer_id 查找（如果有映射表）
      // 否则通过邮箱查找
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email, credits_balance, flex_credits_balance, subscription_credits_balance, credits_total')
        .limit(100);
      
      result.users = {
        total: users?.length || 0,
        sample: users?.slice(0, 10) || []
      };
    }
    
    // 4. 检查未匹配的邮箱
    if (checkoutId || orderId) {
      const { data: unmatched, error: unmatchedError } = await supabaseAdmin
        .from('unmatched_payment_emails')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      result.unmatchedEmails = {
        count: unmatched?.length || 0,
        recent: unmatched || [],
        disabled: !!unmatchedError && isMissingPaymentRecoveryTable(unmatchedError),
        error: unmatchedError && !isMissingPaymentRecoveryTable(unmatchedError) ? unmatchedError.message : null,
      };
    }
    
    // 5. 总结
    result.summary = {
      paymentFound: result.payment?.found || false,
      creditsFound: result.credits?.found || false,
      subscriptionsFound: result.subscriptions?.found || false,
      rpcFunctionsChecked: result.rpcFunctions?.success || false,
      status: result.payment?.found && result.credits?.found 
        ? 'COMPLETE' 
        : result.payment?.found 
          ? 'PAYMENT_ONLY' 
          : result.credits?.found
            ? 'CREDITS_ONLY'
            : 'NOT_FOUND',
      notes: [
        !result.rpcFunctions?.success && 'Could not verify RPC functions from this environment',
        result.payment?.found && !result.credits?.found && 'Payment exists but no credit transaction matched this paymentId',
        result.payment?.found && !result.subscriptions?.found && 'Payment exists but no subscription record was found',
      ].filter(Boolean)
    };
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
