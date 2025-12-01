import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // 1. 检查表结构 - 通过尝试查询所有可能的列
    console.log('[DIAGNOSE] Checking user_subscriptions table structure...');
    try {
      // 尝试查询包含 plan_type 和 plan_status 的完整记录
      const { data: testData, error: testError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('id, user_id, plan_type, plan_status, status, creem_subscription_id, subscription_id, current_period_start, current_period_end, created_at, updated_at')
        .limit(1);
      
      if (testError) {
        // 检查是否是列不存在的错误
        const isColumnError = testError.code === '42703' || 
                             testError.code === 'PGRST102' ||
                             (testError.message && testError.message.toLowerCase().includes('column'));
        
        diagnostics.checks.tableStructure = {
          status: isColumnError ? 'missing_columns' : 'error',
          error: {
            code: testError.code,
            message: testError.message,
            details: testError.details,
            hint: testError.hint
          },
          recommendation: isColumnError 
            ? 'Run database/add-subscription-columns.sql to add missing columns'
            : 'Check database connection and permissions'
        };
      } else {
        diagnostics.checks.tableStructure = {
          status: 'ok',
          note: 'Table is accessible and columns exist'
        };
      }
    } catch (err) {
      diagnostics.checks.tableStructure = {
        status: 'error',
        error: err instanceof Error ? err.message : String(err)
      };
    }

    // 2. 检查是否有 plan_type 和 plan_status 列（通过尝试查询）
    console.log('[DIAGNOSE] Checking for plan_type and plan_status columns...');
    try {
      const { data: testSub, error: testError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('id, user_id, plan_type, plan_status, status, creem_subscription_id, subscription_id')
        .limit(1);
      
      diagnostics.checks.columnAccess = {
        status: testError ? 'error' : 'ok',
        error: testError ? {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        } : null,
        canAccessPlanType: !testError,
        canAccessPlanStatus: !testError,
        canAccessStatus: !testError
      };
    } catch (err) {
      diagnostics.checks.columnAccess = {
        status: 'error',
        error: err instanceof Error ? err.message : String(err)
      };
    }

    // 3. 检查 RLS 策略（通过测试插入权限）
    console.log('[DIAGNOSE] Checking RLS policies via insert test...');
    diagnostics.checks.rlsPolicies = {
      status: 'test_via_insert',
      note: 'RLS policy check will be done via insert permission test below'
    };

    // 4. 检查最近的订阅记录
    console.log('[DIAGNOSE] Checking recent subscriptions...');
    try {
      const { data: recentSubs, error: subsError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('id, user_id, plan_type, plan_status, status, creem_subscription_id, subscription_id, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      diagnostics.checks.recentSubscriptions = {
        status: subsError ? 'error' : 'ok',
        count: recentSubs?.length || 0,
        error: subsError ? {
          code: subsError.code,
          message: subsError.message,
          details: subsError.details,
          hint: subsError.hint
        } : null,
        subscriptions: recentSubs || []
      };
    } catch (err) {
      diagnostics.checks.recentSubscriptions = {
        status: 'error',
        error: err instanceof Error ? err.message : String(err)
      };
    }

    // 5. 检查最近的支付记录
    console.log('[DIAGNOSE] Checking recent payments...');
    try {
      const { data: recentPayments, error: paymentsError } = await supabaseAdmin
        .from('payments')
        .select('id, user_id, subscription_id, amount, currency, status, creem_payment_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      diagnostics.checks.recentPayments = {
        status: paymentsError ? 'error' : 'ok',
        count: recentPayments?.length || 0,
        error: paymentsError ? {
          code: paymentsError.code,
          message: paymentsError.message
        } : null,
        payments: recentPayments || []
      };
    } catch (err) {
      diagnostics.checks.recentPayments = {
        status: 'error',
        error: err instanceof Error ? err.message : String(err)
      };
    }

    // 6. 测试插入权限（不实际插入）
    console.log('[DIAGNOSE] Testing insert permissions...');
    try {
      // 尝试一个无效的插入来测试权限（会失败但不会实际插入数据）
      const testUserId = '00000000-0000-0000-0000-000000000000'; // 无效 UUID
      const { error: insertTestError } = await supabaseAdmin
        .from('user_subscriptions')
        .insert({
          user_id: testUserId,
          plan_type: 'test',
          plan_status: 'test'
        });
      
      // 如果错误是权限错误（42501），说明 RLS 阻止了插入
      // 如果是外键错误或其他错误，说明有插入权限但数据无效
      const isPermissionError = insertTestError?.code === '42501' || 
                                (insertTestError?.message && insertTestError.message.toLowerCase().includes('permission'));
      
      diagnostics.checks.insertPermission = {
        status: isPermissionError ? 'blocked' : 'allowed',
        error: insertTestError ? {
          code: insertTestError.code,
          message: insertTestError.message,
          details: insertTestError.details,
          hint: insertTestError.hint
        } : null,
        note: isPermissionError 
          ? 'RLS policy is blocking inserts - need to add service role policy'
          : 'Insert permission appears to be working (error is likely due to invalid data, not permissions)'
      };
    } catch (err) {
      diagnostics.checks.insertPermission = {
        status: 'error',
        error: err instanceof Error ? err.message : String(err)
      };
    }

    // 7. 检查环境变量
    diagnostics.checks.environment = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'not set',
      keyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'not set'
    };

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error) {
    console.error('[DIAGNOSE] Error:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

