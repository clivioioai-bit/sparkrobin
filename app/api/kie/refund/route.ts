import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 验证必需的环境变量
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// 积分退还 API - 用于处理生成失败的情况
export async function POST(request: NextRequest) {
  const requestId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`[REFUND:${requestId}] ========== Refund Request Started ==========`);
  
  try {
    // 1. 验证环境变量
    console.log(`[REFUND:${requestId}] Checking environment variables...`);
    if (!supabase) {
      console.error(`[REFUND:${requestId}] ❌ Supabase not configured`);
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }
    console.log(`[REFUND:${requestId}] ✅ Environment variables validated`);

    // 2. 获取请求数据
    console.log(`[REFUND:${requestId}] Parsing request body...`);
    const body = await request.json();
    const { generation_id, reason = 'generation_failed' } = body;

    console.log(`[REFUND:${requestId}] Request params:`, {
      generation_id,
      reason
    });

    if (!generation_id) {
      console.error(`[REFUND:${requestId}] ❌ Generation ID missing`);
      return NextResponse.json(
        { error: 'Generation ID is required' },
        { status: 400 }
      );
    }

    // 2. 获取用户信息
    console.log(`[REFUND:${requestId}] Checking authorization header...`);
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error(`[REFUND:${requestId}] ❌ Authorization header missing`);
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    console.log(`[REFUND:${requestId}] Authenticating user...`);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error(`[REFUND:${requestId}] ❌ Authentication failed:`, authError?.message || 'User not found');
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }
    
    console.log(`[REFUND:${requestId}] ✅ User authenticated: ${user.id}`);

    // 3. 查找原始交易记录
    console.log(`[REFUND:${requestId}] Looking up original transaction for generation_id: ${generation_id}`);
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('metadata->>generation_id', generation_id)
      .eq('reason', 'video_generation')
      .eq('transaction_type', 'debit')
      .single();

    if (transactionError || !transaction) {
      console.error(`[REFUND:${requestId}] ❌ Original transaction not found:`, {
        error: transactionError?.message,
        generation_id,
        user_id: user.id
      });
      return NextResponse.json(
        { error: 'Original transaction not found' },
        { status: 404 }
      );
    }

    console.log(`[REFUND:${requestId}] ✅ Found original transaction:`, {
      transaction_id: transaction.id,
      amount: transaction.amount,
      created_at: transaction.created_at
    });

    // 4. 检查是否已经退还过
    console.log(`[REFUND:${requestId}] Checking if already refunded...`);
    const { data: refundExists } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('metadata->>refund_for', generation_id)
      .eq('reason', 'generation_refund')
      .single();

    if (refundExists) {
      console.warn(`[REFUND:${requestId}] ⚠️ Credits already refunded for this generation:`, {
        refund_transaction_id: refundExists.id,
        generation_id
      });
      return NextResponse.json(
        { error: 'Credits already refunded for this generation' },
        { status: 400 }
      );
    }

    const refundAmount = Math.abs(transaction.amount);
    console.log(`[REFUND:${requestId}] Refund amount calculated: ${refundAmount}`);

    // 5. 获取用户当前积分信息
    console.log(`[REFUND:${requestId}] Fetching user current credit balance...`);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits_balance, credits_spent')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error(`[REFUND:${requestId}] ❌ Failed to fetch user data:`, {
        error: userError?.message,
        user_id: user.id
      });
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    console.log(`[REFUND:${requestId}] Current user credits:`, {
      balance: userData.credits_balance,
      spent: userData.credits_spent,
      will_refund: refundAmount
    });

    // 6. 退还积分
    console.log(`[REFUND:${requestId}] Updating user credits...`);
    const { error: refundError } = await supabase
      .from('users')
      .update({
        credits_balance: userData.credits_balance + refundAmount,
        credits_spent: userData.credits_spent - refundAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (refundError) {
      console.error(`[REFUND:${requestId}] ❌ Failed to refund credits:`, {
        error: refundError.message,
        error_code: refundError.code,
        error_details: refundError.details,
        user_id: user.id,
        refund_amount: refundAmount
      });
      return NextResponse.json(
        { error: 'Failed to refund credits' },
        { status: 500 }
      );
    }

    console.log(`[REFUND:${requestId}] ✅ Credits updated:`, {
      old_balance: userData.credits_balance,
      new_balance: userData.credits_balance + refundAmount,
      old_spent: userData.credits_spent,
      new_spent: userData.credits_spent - refundAmount
    });

    // 6. 记录退还交易
    console.log(`[REFUND:${requestId}] Recording refund transaction...`);
    const { error: refundTransactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: refundAmount,
        transaction_type: 'credit',
        reason: 'generation_refund',
        metadata: {
          refund_for: generation_id,
          original_transaction_id: transaction.id,
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
          request_id: requestId
        }
      });

    if (refundTransactionError) {
      console.error(`[REFUND:${requestId}] ❌ Failed to record refund transaction:`, {
        error: refundTransactionError.message,
        error_code: refundTransactionError.code,
        error_details: refundTransactionError.details
      });
      // 注意：积分已退还，但交易记录失败
    } else {
      console.log(`[REFUND:${requestId}] ✅ Refund transaction recorded`);
    }

    // 7. 更新原始交易状态
    console.log(`[REFUND:${requestId}] Updating original transaction status...`);
    const { error: updateError } = await supabase
      .from('credit_transactions')
      .update({
        metadata: {
          ...transaction.metadata,
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_reason: reason,
          request_id: requestId
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error(`[REFUND:${requestId}] ❌ Failed to update original transaction:`, {
        error: updateError.message,
        transaction_id: transaction.id
      });
    } else {
      console.log(`[REFUND:${requestId}] ✅ Original transaction updated`);
    }

    // 8. 返回结果
    const durationMs = Date.now() - startTime;
    console.log(`[REFUND:${requestId}] ========== Refund Completed Successfully ==========`, {
      generation_id,
      refunded_amount: refundAmount,
      user_id: user.id,
      duration_ms: durationMs
    });
    
    return NextResponse.json({
      success: true,
      refunded_amount: refundAmount,
      generation_id,
      message: 'Credits successfully refunded'
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`[REFUND:${requestId}] ========== Refund Failed ==========`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : undefined,
      duration_ms: durationMs
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
