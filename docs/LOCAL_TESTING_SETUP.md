# 本地测试支付和积分系统配置指南

## 📋 配置清单

### 1. 环境变量配置 (`.env.local`)

创建或更新 `.env.local` 文件，确保包含以下配置：

```bash
# ==============================================
# Next.js 基础配置
# ==============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
NEXT_PUBLIC_API_ENV=development  # ⚠️ 重要：启用本地模拟支付

# ==============================================
# Supabase 配置（必需）
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ==============================================
# Creem Payment 配置（测试模式）
# ==============================================
# 从 Creem Dashboard → Settings → API Keys 获取测试密钥
CREEM_API_KEY=pk_test_xxxxxxxxxxxxx  # 或 creem_test_xxxxxxxxxxxxx
CREEM_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxx
CREAM_BASE_URL=https://api-staging.creem.io  # 测试环境URL

# ==============================================
# Creem 产品ID配置（从 Creem Dashboard 获取）
# ==============================================
# 订阅计划ID
NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID=prod_xxx
NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID=prod_xxx
NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_V2_ID=prod_xxx
NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_V2_ID=prod_xxx
NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID=prod_xxx
NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID=prod_xxx

# 一次性包ID
NEXT_PUBLIC_CREEM_PACK_STARTER_ID=prod_xxx
NEXT_PUBLIC_CREEM_PACK_CREATOR_ID=prod_xxx
NEXT_PUBLIC_CREEM_PACK_DEV_ID=prod_xxx

# ==============================================
# KIE API 配置（视频生成）
# ==============================================
KIE_API_BASE_URL=https://api.kie.ai
KIE_API_KEY=your_kie_api_key

# ==============================================
# Google OAuth（可选，用于登录）
# ==============================================
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**关键配置说明**：
- `NEXT_PUBLIC_API_ENV=development` - 启用本地模拟支付，不会调用真实支付接口
- `CREEM_API_KEY` 和 `CREEM_WEBHOOK_SECRET` - 必须使用测试模式的密钥（`pk_test_` 或 `creem_test_` 开头）
- `SUPABASE_SERVICE_ROLE_KEY` - 用于服务端操作，包括积分系统

---

### 2. 数据库配置

#### 2.1 确保积分系统 RPC 函数已创建

在 Supabase Dashboard → SQL Editor 中执行：

```sql
-- 执行 database/fix-all-credit-functions.sql
-- 这会创建以下函数：
-- - debit_user_credits_transaction (扣除积分)
-- - credit_user_credits_transaction (增加积分)
-- - refund_user_credits (退还积分)
```

**验证函数是否存在**：
```sql
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN (
  'debit_user_credits_transaction', 
  'credit_user_credits_transaction',
  'refund_user_credits'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

#### 2.2 确保数据库表结构正确

检查以下表是否存在：
- `users` - 用户表（包含积分字段）
- `credit_transactions` - 积分交易记录表
- `payments` - 支付记录表
- `user_subscriptions` - 用户订阅表

**检查表结构**：
```sql
-- 检查 users 表是否有积分字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('credits_balance', 'credits_total', 'credits_spent');

-- 检查 credit_transactions 表
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'credit_transactions';
```

---

### 3. Webhook 配置（本地测试）

#### 3.1 安装 ngrok

```bash
# macOS
brew install ngrok

# 或使用 npm
npm install -g ngrok

# 注册并配置 authtoken（可选，用于固定域名）
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### 3.2 启动本地服务器和 ngrok

**终端 1 - 启动开发服务器**：
```bash
npm run dev
# 确保运行在 http://localhost:3000
```

**终端 2 - 启动 ngrok**：
```bash
ngrok http 3000

# 或使用固定域名（推荐）
ngrok http 3000 --domain=your-fixed-domain.ngrok-free.app
```

ngrok 会显示类似输出：
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

#### 3.3 配置 Creem Dashboard Webhook

1. 登录 [Creem Dashboard](https://creem.io)
2. 进入 **Settings → Webhooks**
3. 在 **Webhook URL** 填入：
   ```
   https://你的ngrok域名.ngrok-free.app/api/webhooks/creem
   ```
4. 选择要接收的事件类型：
   - ✅ `checkout.completed`
   - ✅ `subscription.active`
   - ✅ `subscription.paid`
   - ✅ `subscription.update`
   - ✅ `subscription.canceled`
   - ✅ `payment.succeeded`
   - ✅ `payment.failed`
5. 确保使用**测试模式**的 Webhook Secret（与 `.env.local` 中的 `CREEM_WEBHOOK_SECRET` 一致）
6. 点击 **Save** 保存

#### 3.4 测试 Webhook

在 Creem Dashboard 中：
1. 点击 **Send Test Webhook** 按钮
2. 选择事件类型（如 `checkout.completed`）
3. 检查本地服务器日志，应该能看到：
   ```
   [WEBHOOK] Starting webhook processing...
   [WEBHOOK] Event type: checkout.completed
   [WEBHOOK] Signature verified successfully
   ```

**查看 Webhook 请求**：
- 访问 `http://localhost:4040` 查看 ngrok 的请求日志
- 查看 Next.js 开发服务器的控制台输出

---

### 4. 支付流程测试配置

#### 4.1 本地模拟支付模式

当 `NEXT_PUBLIC_API_ENV=development` 时，系统会：
- ✅ 跳过真实的 Creem API 调用
- ✅ 模拟支付成功流程
- ✅ 仍然会触发 webhook 处理（如果配置了 ngrok）
- ✅ 测试积分系统逻辑

#### 4.2 支付回调 URL 配置

支付成功后的回调 URL 格式：
```
http://localhost:3000/api/pay/callback/creem?plan=basic&checkout_id=xxx&...
```

在 Creem Dashboard 中配置：
- **Success URL**: `https://你的ngrok域名.ngrok-free.app/api/pay/callback/creem`
- **Cancel URL**: `https://你的ngrok域名.ngrok-free.app/dashboard?payment=cancelled`

---

### 5. 测试步骤

#### 5.1 验证环境配置

```bash
# 检查环境变量
node scripts/verify-env.js

# 或手动检查
echo $CREEM_API_KEY
echo $CREEM_WEBHOOK_SECRET
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### 5.2 测试积分系统

**方法 1：通过 API 测试**

```bash
# 测试扣除积分
curl -X POST http://localhost:3000/api/test/credits/debit \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id", "amount": 10}'

# 测试增加积分
curl -X POST http://localhost:3000/api/test/credits/credit \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id", "amount": 100, "reason": "test_payment"}'
```

**方法 2：通过 Supabase Dashboard**

在 SQL Editor 中执行：
```sql
-- 给用户增加积分
SELECT * FROM credit_user_credits_transaction(
  'your-user-id'::uuid,
  100,
  'test_payment',
  '{"test": true}'::jsonb
);

-- 查看用户积分
SELECT id, email, credits_balance, credits_total, credits_spent 
FROM users 
WHERE id = 'your-user-id'::uuid;

-- 查看积分交易记录
SELECT * FROM credit_transactions 
WHERE user_id = 'your-user-id'::uuid 
ORDER BY created_at DESC 
LIMIT 10;
```

#### 5.3 测试支付流程

1. **启动开发服务器和 ngrok**
   ```bash
   # 终端 1
   npm run dev
   
   # 终端 2
   ngrok http 3000
   ```

2. **访问支付页面**
   - 打开 `http://localhost:3000/dashboard`
   - 点击购买积分或订阅
   - 选择支付计划

3. **模拟支付（开发模式）**
   - 在开发模式下，支付会自动模拟成功
   - 检查浏览器控制台和服务器日志

4. **验证积分增加**
   - 支付成功后，检查用户积分是否增加
   - 查看 `credit_transactions` 表是否有新记录
   - 查看 `payments` 表是否有支付记录

#### 5.4 测试 Webhook 处理

**手动触发 Webhook（使用 ngrok 界面）**：
1. 访问 `http://localhost:4040`
2. 找到之前的 webhook 请求
3. 点击 **Replay** 重放请求
4. 检查服务器日志和数据库更新

**使用 Creem Dashboard 测试**：
1. 在 Creem Dashboard → Webhooks
2. 点击 **Send Test Webhook**
3. 选择事件类型
4. 检查本地服务器是否收到请求

---

### 6. 常见问题排查

#### 问题 1: 环境变量未生效

**解决方案**：
```bash
# 确保 .env.local 文件存在
ls -la .env.local

# 重启开发服务器
# 按 Ctrl+C 停止，然后重新运行
npm run dev
```

#### 问题 2: 积分函数不存在

**错误信息**：
```
function debit_user_credits_transaction does not exist
```

**解决方案**：
1. 在 Supabase Dashboard → SQL Editor
2. 执行 `database/fix-all-credit-functions.sql`
3. 验证函数是否创建成功

#### 问题 3: Webhook 签名验证失败

**错误信息**：
```
[WEBHOOK] Invalid webhook signature
```

**解决方案**：
1. 检查 `CREEM_WEBHOOK_SECRET` 是否正确
2. 确保 Creem Dashboard 中的 Webhook Secret 与 `.env.local` 一致
3. 确保使用测试模式的密钥（`whsec_test_` 开头）

#### 问题 4: ngrok URL 无法访问

**解决方案**：
1. 确保本地服务器正在运行（`npm run dev`）
2. 检查 ngrok 是否正常启动
3. 尝试访问 `http://localhost:4040` 查看 ngrok 状态
4. 确保防火墙没有阻止连接

#### 问题 5: 支付回调失败

**解决方案**：
1. 检查回调 URL 配置是否正确
2. 确保 ngrok URL 已更新到 Creem Dashboard
3. 查看服务器日志中的错误信息
4. 检查用户是否已登录（某些回调需要认证）

---

### 7. 测试检查清单

在开始测试前，确认以下项目：

- [ ] `.env.local` 文件已创建并配置
- [ ] `NEXT_PUBLIC_API_ENV=development` 已设置
- [ ] Supabase 环境变量已配置
- [ ] Creem 测试密钥已配置
- [ ] 数据库 RPC 函数已创建
- [ ] ngrok 已安装并运行
- [ ] Webhook URL 已配置到 Creem Dashboard
- [ ] 本地开发服务器正在运行
- [ ] 可以访问 `http://localhost:3000`

测试过程中检查：

- [ ] 支付流程可以正常启动
- [ ] 支付成功后积分正确增加
- [ ] `credit_transactions` 表有记录
- [ ] `payments` 表有记录
- [ ] Webhook 可以正常接收
- [ ] Webhook 签名验证通过
- [ ] 积分扣除功能正常
- [ ] 积分退还功能正常

---

### 8. 下一步

测试完成后，准备生产环境部署：

1. **移除模拟代码**
   - 将 `NEXT_PUBLIC_API_ENV` 设置为 `production`
   - 确保所有支付流程使用真实 API

2. **配置生产环境变量**
   - 使用生产模式的 Creem 密钥（`pk_live_` 开头）
   - 配置生产环境的 Webhook URL

3. **安全审查**
   - 查看 [SECURITY.md](./SECURITY.md)
   - 确保所有密钥安全存储
   - 启用 webhook 签名验证

---

## 📚 相关文档

- [Creem Payment 集成指南](./CREEM_PAYMENT_INTEGRATION.md)
- [Supabase 配置指南](./SUPABASE_SETUP.md)
- [ngrok Webhook 设置](./NGROK_WEBHOOK_SETUP.md)
- [数据库架构文档](./DATABASE_ARCHITECTURE.md)
- [安全指南](./SECURITY.md)

---

**最后更新**: 2025-01-XX  
**状态**: 测试配置指南

