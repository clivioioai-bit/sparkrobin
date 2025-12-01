-- ============================================================
-- 订阅问题诊断脚本
-- 在 Supabase SQL Editor 中运行此脚本检查订阅相关问题
-- ============================================================

-- 1. 检查 user_subscriptions 表的所有列
SELECT 
  'Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查是否有 plan_type 和 plan_status 列
SELECT 
  'Column Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
        AND column_name = 'plan_type'
    ) THEN '✅ plan_type exists'
    ELSE '❌ plan_type MISSING'
  END as plan_type_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
        AND column_name = 'plan_status'
    ) THEN '✅ plan_status exists'
    ELSE '❌ plan_status MISSING'
  END as plan_status_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
        AND column_name = 'status'
    ) THEN '✅ status exists'
    ELSE '❌ status MISSING'
  END as status_column_status;

-- 3. 检查 RLS 策略
SELECT 
  'RLS Policies' as check_type,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%service%role%' THEN '✅ Service Role Policy'
    WHEN policyname LIKE '%trigger%' THEN '✅ Trigger Policy'
    WHEN policyname LIKE '%Users can view%' THEN '✅ User View Policy'
    ELSE '⚠️ Other Policy'
  END as policy_type,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'user_subscriptions' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 4. 检查最近的订阅记录（最近 10 条）
SELECT 
  'Recent Subscriptions' as check_type,
  id,
  user_id,
  plan_type,
  plan_status,
  status,
  creem_subscription_id,
  subscription_id,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
FROM user_subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- 5. 检查最近的支付记录（最近 10 条）
SELECT 
  'Recent Payments' as check_type,
  id,
  user_id,
  subscription_id,
  payment_id,
  creem_payment_id,
  amount,
  currency,
  status,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 10;

-- 6. 检查用户订阅状态（最近购买的用户）
SELECT 
  'User Subscription Status' as check_type,
  u.id as user_id,
  u.email,
  u.subscription_plan,
  u.subscription_status,
  u.subscription_end_date,
  us.id as subscription_record_id,
  us.plan_type,
  us.plan_status,
  us.creem_subscription_id,
  us.created_at as subscription_created_at
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE u.subscription_status != 'inactive' 
   OR us.id IS NOT NULL
ORDER BY COALESCE(us.created_at, u.updated_at) DESC
LIMIT 10;

-- 7. 统计信息
SELECT 
  'Statistics' as check_type,
  (SELECT COUNT(*) FROM user_subscriptions) as total_subscriptions,
  (SELECT COUNT(*) FROM user_subscriptions WHERE plan_status IS NOT NULL) as subscriptions_with_plan_status,
  (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type IS NOT NULL) as subscriptions_with_plan_type,
  (SELECT COUNT(*) FROM user_subscriptions WHERE creem_subscription_id IS NOT NULL) as subscriptions_with_creem_id,
  (SELECT COUNT(*) FROM payments WHERE status = 'succeeded') as successful_payments,
  (SELECT COUNT(*) FROM payments WHERE status = 'succeeded' AND subscription_id IS NULL) as payments_without_subscription;

-- 8. 检查是否有支付成功但没有订阅记录的情况
SELECT 
  'Orphaned Payments' as check_type,
  p.id as payment_id,
  p.user_id,
  p.creem_payment_id,
  p.amount,
  p.status,
  p.created_at,
  CASE 
    WHEN us.id IS NULL THEN '❌ No subscription record found'
    ELSE '✅ Subscription record exists'
  END as subscription_status
FROM payments p
LEFT JOIN user_subscriptions us ON p.user_id = us.user_id
WHERE p.status = 'succeeded'
  AND p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================================
-- 诊断完成
-- ============================================================
-- 检查以上结果：
-- 1. 如果 plan_type 或 plan_status 缺失，运行 add-subscription-columns.sql
-- 2. 如果没有 service role 策略，运行 fix-subscription-rls-policies.sql
-- 3. 如果有 "Orphaned Payments"，说明支付成功但订阅未创建
-- ============================================================



