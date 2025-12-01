-- ============================================================
-- 修复 user_subscriptions 表的 RLS 策略
-- ============================================================
-- 问题：webhook 使用 service role 插入/更新订阅记录可能被 RLS 阻止
-- 解决方案：添加允许 service role 管理订阅的策略
-- ============================================================

-- 1. 检查当前 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_subscriptions' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 2. 删除可能冲突的旧策略（如果存在）
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Allow service role to insert subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Allow service role to update subscriptions" ON user_subscriptions;

-- 3. 创建允许 service role 完全管理订阅的策略
-- 注意：service role 使用 service_role JWT，可以通过 auth.role() = 'service_role' 检测
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. 确保用户仍然可以查看自己的订阅（保留现有策略）
-- 如果不存在，创建用户查看策略
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
      AND policyname = 'Users can view own subscriptions'
  ) THEN
    CREATE POLICY "Users can view own subscriptions" ON user_subscriptions 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. 确保触发器可以插入订阅（保留现有策略）
-- 如果不存在，创建触发器插入策略
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
      AND policyname = 'Allow trigger to insert subscriptions'
  ) THEN
    CREATE POLICY "Allow trigger to insert subscriptions" ON user_subscriptions
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. 验证策略已创建
SELECT 
  'RLS Policies for user_subscriptions' as check_type,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%service%role%' THEN '✅ Service Role'
    WHEN policyname LIKE '%trigger%' THEN '✅ Trigger'
    WHEN policyname LIKE '%Users can view%' THEN '✅ User View'
    ELSE '⚠️ Other'
  END as policy_type
FROM pg_policies 
WHERE tablename = 'user_subscriptions' 
  AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================
-- 完成！
-- ============================================================
-- 现在 service role (supabaseAdmin) 可以：
-- 1. 插入新的订阅记录
-- 2. 更新现有的订阅记录
-- 3. 删除订阅记录（如果需要）
-- 
-- 用户仍然可以：
-- 1. 查看自己的订阅记录
-- 
-- 触发器仍然可以：
-- 1. 在用户创建时插入初始订阅记录
-- ============================================================



