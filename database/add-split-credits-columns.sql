-- 添加订阅积分和灵活积分列到 users 表
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 1. 添加列（如果不存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_credits_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS flex_credits_balance INTEGER NOT NULL DEFAULT 0;

-- 2. 数据迁移：将现有 credits_balance 迁移到 flex_credits_balance
UPDATE users
SET flex_credits_balance = COALESCE(flex_credits_balance, 0) + COALESCE(credits_balance, 0)
WHERE (flex_credits_balance IS NULL OR flex_credits_balance = 0)
  AND COALESCE(credits_balance, 0) > 0;

-- 3. 创建触发器自动维护 credits_balance = subscription + flex
CREATE OR REPLACE FUNCTION maintain_credits_balance()
RETURNS trigger AS $$
BEGIN
  NEW.credits_balance := GREATEST(0, COALESCE(NEW.subscription_credits_balance, 0) + COALESCE(NEW.flex_credits_balance, 0));
  RETURN NEW;
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_maintain_balance ON users;
CREATE TRIGGER trg_users_maintain_balance
BEFORE INSERT OR UPDATE OF subscription_credits_balance, flex_credits_balance ON users
FOR EACH ROW EXECUTE FUNCTION maintain_credits_balance();

-- 4. 验证列已添加
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('subscription_credits_balance', 'flex_credits_balance')
ORDER BY column_name;

