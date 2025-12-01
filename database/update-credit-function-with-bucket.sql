-- 更新 credit_user_credits_transaction 函数以支持 bucket 参数
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 1. 确保 credit_bucket 类型存在
DO $$ BEGIN
  CREATE TYPE credit_bucket AS ENUM ('subscription','flex');
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

-- 2. 删除旧版本的函数（如果有）
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, credit_bucket);

-- 3. 创建新版本的函数（支持 bucket 参数）
CREATE OR REPLACE FUNCTION credit_user_credits_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_bucket credit_bucket DEFAULT 'flex'
)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER,
  subscription_credits_balance INTEGER,
  flex_credits_balance INTEGER
) AS $$
DECLARE
  max_allowed INTEGER := 100000;
BEGIN
  -- 参数验证
  IF p_amount <= 0 THEN 
    RAISE EXCEPTION 'Amount must be positive: %', p_amount; 
  END IF;
  
  IF p_amount > max_allowed THEN 
    RAISE EXCEPTION 'Amount too large: % (max: %)', p_amount, max_allowed; 
  END IF;

  -- 根据 bucket 更新对应的积分余额（使用表别名避免列名歧义）
  UPDATE users u SET
    subscription_credits_balance = COALESCE(u.subscription_credits_balance, 0) + CASE WHEN p_bucket='subscription' THEN p_amount ELSE 0 END,
    flex_credits_balance = COALESCE(u.flex_credits_balance, 0) + CASE WHEN p_bucket='flex' THEN p_amount ELSE 0 END,
    credits_total = COALESCE(u.credits_total, 0) + p_amount,
    updated_at = NOW()
  WHERE u.id = p_user_id;

  -- 检查是否更新成功
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- 记录交易（在 metadata 中包含 bucket 信息）
  INSERT INTO credit_transactions(
    user_id,
    amount,
    transaction_type,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'credit',
    p_reason,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('bucket', p_bucket)
  );

  -- 返回更新后的积分快照
  RETURN QUERY
  SELECT 
    u.credits_balance,
    u.credits_total,
    COALESCE(u.credits_spent, 0),
    u.subscription_credits_balance,
    u.flex_credits_balance
  FROM users u 
  WHERE u.id = p_user_id;
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. 验证函数已创建
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'credit_user_credits_transaction'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

