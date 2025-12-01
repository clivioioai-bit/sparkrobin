import { getSupabaseAdmin } from '@/lib/supabase-admin';

export interface CreditSnapshot {
  balance: number;
  total: number;
  spent: number;
}

const toNumber = (value: any): number => Number(value ?? 0);

export async function fetchCreditSnapshot(userId: string): Promise<CreditSnapshot | null> {
  const requestId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[CREDITS:${requestId}] Fetching credit snapshot for user: ${userId}`);
  
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('users')
      .select('credits_balance, credits_total, credits_spent')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`[CREDITS:${requestId}] ❌ Fetch snapshot error:`, {
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        user_id: userId
      });
      return null;
    }

    const result = {
      balance: toNumber(data.credits_balance),
      total: toNumber(data.credits_total),
      spent: toNumber(data.credits_spent),
    };

    console.log(`[CREDITS:${requestId}] ✅ Snapshot fetched:`, {
      user_id: userId,
      balance: result.balance,
      total: result.total,
      spent: result.spent
    });

    return result;
  } catch (error) {
    console.error(`[CREDITS:${requestId}] ❌ Fetch snapshot exception:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: userId
    });
    return null;
  }
}

export async function debitCredits(
  userId: string,
  amount: number,
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<CreditSnapshot> {
  const requestId = metadata?.request_id as string || `debit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[CREDITS:${requestId}] ========== Debit Credits Started ==========`, {
    user_id: userId,
    amount,
    reason: reason || 'unspecified',
    metadata_keys: metadata ? Object.keys(metadata) : []
  });

  try {
    const { data, error } = await getSupabaseAdmin().rpc('debit_user_credits_transaction', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason ?? null,
      p_metadata: metadata ?? null,
    });

    if (error) {
      console.error(`[CREDITS:${requestId}] ❌ Debit RPC error:`, {
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        error_hint: error.hint,
        user_id: userId,
        amount
      });
      if (error.code === 'P0008') {
        throw new Error('INSUFFICIENT_BALANCE');
      }
      throw error;
    }

    const row = (data as any[])?.[0];
    if (!row) {
      console.error(`[CREDITS:${requestId}] ❌ Debit RPC returned no data`);
      throw new Error('Failed to debit credits');
    }

    const result = {
      balance: toNumber(row.credits_balance),
      total: toNumber(row.credits_total),
      spent: toNumber(row.credits_spent),
    };

    console.log(`[CREDITS:${requestId}] ✅ Debit successful:`, {
      user_id: userId,
      amount_deducted: amount,
      new_balance: result.balance,
      new_total: result.total,
      new_spent: result.spent
    });

    return result;
  } catch (error) {
    console.error(`[CREDITS:${requestId}] ❌ Debit exception:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : undefined,
      user_id: userId,
      amount
    });
    throw error;
  }
}

export async function creditCredits(
  userId: string,
  amount: number,
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<CreditSnapshot> {
  const requestId = metadata?.request_id as string || `credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 从 metadata 中提取 bucket，默认为 'flex'
  const bucket = (metadata?.bucket as 'subscription' | 'flex') || 'flex';
  
  console.log(`[CREDITS:${requestId}] ========== Credit Credits Started ==========`, {
    user_id: userId,
    amount,
    reason: reason || 'unspecified',
    bucket,
    metadata_keys: metadata ? Object.keys(metadata) : []
  });

  try {
    const { data, error } = await getSupabaseAdmin().rpc('credit_user_credits_transaction', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason ?? null,
      p_metadata: metadata ?? null,
      p_bucket: bucket, // 🔥 传递 bucket 参数
    });

    if (error) {
      console.error(`[CREDITS:${requestId}] ❌ Credit RPC error:`, {
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        error_hint: error.hint,
        user_id: userId,
        amount
      });
      throw error;
    }

    const row = (data as any[])?.[0];
    if (!row) {
      console.error(`[CREDITS:${requestId}] ❌ Credit RPC returned no data`);
      throw new Error('Failed to credit credits');
    }

    const result = {
      balance: toNumber(row.credits_balance),
      total: toNumber(row.credits_total),
      spent: toNumber(row.credits_spent),
    };

    console.log(`[CREDITS:${requestId}] ✅ Credit successful:`, {
      user_id: userId,
      amount_added: amount,
      new_balance: result.balance,
      new_total: result.total,
      new_spent: result.spent
    });

    return result;
  } catch (error) {
    console.error(`[CREDITS:${requestId}] ❌ Credit exception:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : undefined,
      user_id: userId,
      amount
    });
    throw error;
  }
}

export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<CreditSnapshot> {
  const requestId = metadata?.request_id as string || `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[CREDITS:${requestId}] ========== Refund Credits Started ==========`, {
    user_id: userId,
    amount,
    reason,
    metadata_keys: metadata ? Object.keys(metadata) : []
  });
  
  try {
    const { data, error } = await getSupabaseAdmin().rpc('refund_user_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_metadata: metadata ?? null,
    });

    if (error) {
      console.error(`[CREDITS:${requestId}] ❌ Refund RPC error:`, {
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        error_hint: error.hint,
        user_id: userId,
        amount,
        reason
      });
      throw error;
    }

    const row = (data as any[])?.[0];
    if (!row) {
      console.error(`[CREDITS:${requestId}] ❌ Refund RPC returned no data`);
      throw new Error('Failed to refund credits');
    }

    const result = {
      balance: toNumber(row.credits_balance),
      total: toNumber(row.credits_total),
      spent: toNumber(row.credits_spent),
    };

    console.log(`[CREDITS:${requestId}] ✅ Refund successful:`, {
      user_id: userId,
      amount_refunded: amount,
      reason,
      new_balance: result.balance,
      new_total: result.total,
      new_spent: result.spent
    });

    return result;
  } catch (error) {
    console.error(`[CREDITS:${requestId}] ❌ Refund exception:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : undefined,
      user_id: userId,
      amount,
      reason
    });
    throw error;
  }
}
