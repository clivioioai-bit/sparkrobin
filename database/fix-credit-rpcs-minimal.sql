-- Minimal repair for credit RPCs used by the app.
-- Safe to run in Supabase SQL Editor.
--
-- Fixes:
-- 1. ambiguous column references in debit/refund RPCs
-- 2. missing compatible credit_user_credits_transaction signature
-- 3. keeps return shape compatible with app code

BEGIN;

DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, credit_bucket);
DROP FUNCTION IF EXISTS debit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS debit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS debit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, credit_bucket);
DROP FUNCTION IF EXISTS refund_user_credits(UUID, INTEGER, TEXT, JSONB);

DO $$
BEGIN
  CREATE TYPE credit_bucket AS ENUM ('subscription', 'flex');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION credit_user_credits_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_total INTEGER;
  v_spent INTEGER;
  v_bucket TEXT := COALESCE(NULLIF(p_metadata->>'bucket', ''), 'flex');
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive: %', p_amount USING ERRCODE = 'P0003';
  END IF;

  UPDATE users AS u
  SET
    subscription_credits_balance = COALESCE(u.subscription_credits_balance, 0) +
      CASE WHEN v_bucket = 'subscription' THEN p_amount ELSE 0 END,
    flex_credits_balance = COALESCE(u.flex_credits_balance, 0) +
      CASE WHEN v_bucket = 'flex' THEN p_amount ELSE 0 END,
    credits_total = COALESCE(u.credits_total, 0) + p_amount,
    credits_balance = COALESCE(u.subscription_credits_balance, 0) +
      CASE WHEN v_bucket = 'subscription' THEN p_amount ELSE 0 END +
      COALESCE(u.flex_credits_balance, 0) +
      CASE WHEN v_bucket = 'flex' THEN p_amount ELSE 0 END,
    updated_at = NOW()
  WHERE u.id = p_user_id
  RETURNING
    u.credits_balance,
    COALESCE(u.credits_total, 0),
    COALESCE(u.credits_spent, 0)
  INTO v_balance, v_total, v_spent;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'P0005';
  END IF;

  INSERT INTO credit_transactions (
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
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('bucket', v_bucket)
  );

  RETURN QUERY SELECT v_balance, v_total, v_spent;
END;
$$;

CREATE OR REPLACE FUNCTION debit_user_credits_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_balance INTEGER;
  v_flex_balance INTEGER;
  v_from_sub INTEGER := 0;
  v_from_flex INTEGER := 0;
  v_balance INTEGER;
  v_total INTEGER;
  v_spent INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive: %', p_amount USING ERRCODE = 'P0003';
  END IF;

  SELECT
    COALESCE(u.subscription_credits_balance, 0),
    COALESCE(u.flex_credits_balance, 0)
  INTO v_sub_balance, v_flex_balance
  FROM users AS u
  WHERE u.id = p_user_id
  FOR UPDATE;

  IF v_sub_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'P0005';
  END IF;

  IF v_sub_balance + v_flex_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: % (available: %)', p_amount, v_sub_balance + v_flex_balance USING ERRCODE = 'P0008';
  END IF;

  v_from_sub := LEAST(p_amount, v_sub_balance);
  v_from_flex := p_amount - v_from_sub;

  UPDATE users AS u
  SET
    subscription_credits_balance = COALESCE(u.subscription_credits_balance, 0) - v_from_sub,
    flex_credits_balance = COALESCE(u.flex_credits_balance, 0) - v_from_flex,
    credits_spent = COALESCE(u.credits_spent, 0) + p_amount,
    credits_balance = (COALESCE(u.subscription_credits_balance, 0) - v_from_sub) +
      (COALESCE(u.flex_credits_balance, 0) - v_from_flex),
    updated_at = NOW()
  WHERE u.id = p_user_id
  RETURNING
    u.credits_balance,
    COALESCE(u.credits_total, 0),
    COALESCE(u.credits_spent, 0)
  INTO v_balance, v_total, v_spent;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update user credits' USING ERRCODE = 'P0007';
  END IF;

  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'debit',
    p_reason,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'split',
      jsonb_build_object('subscription', v_from_sub, 'flex', v_from_flex)
    )
  );

  RETURN QUERY SELECT v_balance, v_total, v_spent;
END;
$$;

CREATE OR REPLACE FUNCTION refund_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_total INTEGER;
  v_spent INTEGER;
  v_bucket TEXT := COALESCE(NULLIF(p_metadata->>'bucket', ''), 'flex');
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be positive: %', p_amount USING ERRCODE = 'P0003';
  END IF;

  UPDATE users AS u
  SET
    subscription_credits_balance = COALESCE(u.subscription_credits_balance, 0) +
      CASE WHEN v_bucket = 'subscription' THEN p_amount ELSE 0 END,
    flex_credits_balance = COALESCE(u.flex_credits_balance, 0) +
      CASE WHEN v_bucket = 'flex' THEN p_amount ELSE 0 END,
    credits_spent = GREATEST(COALESCE(u.credits_spent, 0) - p_amount, 0),
    credits_balance = COALESCE(u.subscription_credits_balance, 0) +
      CASE WHEN v_bucket = 'subscription' THEN p_amount ELSE 0 END +
      COALESCE(u.flex_credits_balance, 0) +
      CASE WHEN v_bucket = 'flex' THEN p_amount ELSE 0 END,
    updated_at = NOW()
  WHERE u.id = p_user_id
  RETURNING
    u.credits_balance,
    COALESCE(u.credits_total, 0),
    COALESCE(u.credits_spent, 0)
  INTO v_balance, v_total, v_spent;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'P0005';
  END IF;

  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'credit',
    'refund_' || p_reason,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'bucket', v_bucket,
      'refund_reason', p_reason,
      'refund_timestamp', NOW()
    )
  );

  RETURN QUERY SELECT v_balance, v_total, v_spent;
END;
$$;

COMMIT;

-- Optional verification:
-- select proname, pg_get_function_identity_arguments(p.oid)
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and proname in ('credit_user_credits_transaction', 'debit_user_credits_transaction', 'refund_user_credits')
-- order by proname;
