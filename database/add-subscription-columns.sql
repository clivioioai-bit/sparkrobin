-- ============================================================
-- 添加 user_subscriptions 表缺失的列
-- ============================================================
-- 问题：代码使用 plan_type 和 plan_status，但基础 schema 中只有 status
-- 解决方案：添加 plan_type 和 plan_status 列，保持向后兼容
-- ============================================================

-- 1. 添加 plan_type 字段（如果不存在）
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'basic';

-- 2. 添加 plan_status 字段（如果不存在）
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS plan_status VARCHAR(50);

-- 3. 如果 status 列存在且有数据，将数据复制到 plan_status（如果 plan_status 为空）
-- 先检查 status 列是否存在
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
      AND column_name = 'status'
      AND table_schema = 'public'
  ) THEN
    -- status 列存在，复制数据
    UPDATE user_subscriptions 
    SET plan_status = status 
    WHERE plan_status IS NULL 
      AND status IS NOT NULL;
    
    RAISE NOTICE 'Copied data from status column to plan_status';
  ELSE
    RAISE NOTICE 'status column does not exist, skipping data copy';
  END IF;
END $$;

-- 4. 添加索引（优化查询性能）
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_type 
ON user_subscriptions(plan_type);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_status 
ON user_subscriptions(plan_status);

-- 5. 验证字段已添加
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND table_schema = 'public'
  AND column_name IN ('plan_type', 'plan_status', 'status')
ORDER BY column_name;

-- ============================================================
-- 完成！
-- ============================================================
-- 现在代码可以同时使用 status、plan_type 和 plan_status
-- plan_status 用于存储订阅状态（active/canceled/past_due 等）
-- plan_type 用于存储订阅计划类型（basic/creator/pro 等）
-- ============================================================

