# Webhook 测试指南

## 🎯 测试方法

### 方法 1: 使用测试脚本（推荐）

#### 1. 准备测试用户邮箱

确保数据库中有一个测试用户，或者使用现有用户的邮箱：

```bash
# 在 .env.local 中设置（可选）
TEST_USER_EMAIL=your-test-email@example.com
```

#### 2. 运行测试脚本

```bash
# 测试 Basic Monthly 订阅
npx tsx scripts/test-webhook.ts subscription

# 测试一次性包
npx tsx scripts/test-webhook.ts pack

# 测试所有
npx tsx scripts/test-webhook.ts all
```

#### 3. 查看结果

- **开发服务器控制台**: 查看 `[WEBHOOK-xxx]` 开头的日志
- **Supabase 数据库**: 检查 `credit_transactions` 表和 `users` 表的积分余额

---

### 方法 2: 在 Creem Dashboard 中发送测试 Webhook

#### 1. 确认 Webhook URL 已配置

- 登录 [Creem Dashboard](https://creem.io)
- 进入 **Settings → Webhooks**
- 确认 Webhook URL: `https://topographic-cubiform-sloane.ngrok-free.dev/api/webhooks/creem`
- 确认 Webhook Secret 与 `.env.local` 中的 `CREEM_WEBHOOK_SECRET` 一致

#### 2. 发送测试 Webhook

1. 在 Creem Dashboard 中点击 **"Send Test Webhook"**
2. 选择事件类型：`checkout.completed`
3. 查看开发服务器控制台的日志

#### 3. 查看日志

开发服务器会输出详细的日志，包括：
- `[WEBHOOK-xxx]` - Webhook 处理日志
- `[CREDITS:xxx]` - 积分发放日志
- 错误信息（如果有）

---

### 方法 3: 使用 curl 手动测试

```bash
# 1. 生成签名（需要 CREEM_WEBHOOK_SECRET）
SECRET="your_webhook_secret"
BODY='{"eventType":"checkout.completed","object":{...}}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# 2. 发送请求
curl -X POST http://localhost:3000/api/webhooks/creem \
  -H "Content-Type: application/json" \
  -H "creem-signature: $SIGNATURE" \
  -d "$BODY"
```

---

## 📊 验证检查清单

### ✅ 1. Webhook 端点可访问

```bash
curl http://localhost:3000/api/webhooks/creem
# 应该返回: {"message":"Creem webhook endpoint is active",...}
```

### ✅ 2. 签名验证通过

查看日志中是否有：
```
[WEBHOOK-xxx] ✅ Signature verified successfully
```

### ✅ 3. 用户匹配成功

查看日志中是否有：
```
[WEBHOOK-xxx] ✅ Step 1: User found - ID: xxx
```

### ✅ 4. 计划配置找到

查看日志中是否有：
```
[WEBHOOK-xxx] ✅ Step 3: Plan config found: { id: "basic_monthly", credits: 600 }
```

### ✅ 5. 积分发放成功

查看日志中是否有：
```
[CREDITS:xxx] ✅ Credit successful: { amount_added: 600, new_balance: xxx }
```

### ✅ 6. 数据库验证

在 Supabase Dashboard 中检查：

```sql
-- 查看最近的积分交易
SELECT * FROM credit_transactions 
ORDER BY created_at DESC 
LIMIT 5;

-- 查看用户积分余额
SELECT id, email, credits_balance, subscription_credits_balance, flex_credits_balance 
FROM users 
WHERE email = 'your-test-email@example.com';
```

---

## 🔍 常见问题排查

### 问题 1: 签名验证失败

**症状**: 日志显示 `❌ Invalid signature`

**解决**:
- 检查 `CREEM_WEBHOOK_SECRET` 是否与 Creem Dashboard 中的一致
- 确认使用的是测试模式的 Webhook Secret（`whsec_test_...`）

### 问题 2: 用户未找到

**症状**: 日志显示 `❌ User not found for email: xxx`

**解决**:
- 确保测试邮箱在 `users` 表中存在
- 检查邮箱大小写是否匹配
- 查看 `unmatched_payment_emails` 表

### 问题 3: 计划配置未找到

**症状**: 日志显示 `❌ Plan config NOT FOUND`

**解决**:
- 检查环境变量 `NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID` 是否正确
- 确认 productId 与 Creem Dashboard 中的一致
- 如果 metadata 中有 credits，仍然可以工作

### 问题 4: 积分未发放

**症状**: `creditAmount = 0`

**解决**:
- 检查计划配置中的 `credits` 值
- 确认 metadata 中是否有 credits 字段
- 查看日志中的详细错误信息

---

## 📝 测试数据示例

### Basic Monthly 订阅

```json
{
  "eventType": "checkout.completed",
  "object": {
    "product": {
      "id": "prod_68dHOffXCVRWc7NZxX00Z",
      "name": "Basic Monthly Plan"
    },
    "customer": {
      "email": "your-email@example.com"
    },
    "subscription": {
      "id": "sub_test_123",
      "status": "active"
    }
  }
}
```

### Starter Pack 一次性包

```json
{
  "eventType": "checkout.completed",
  "object": {
    "product": {
      "id": "prod_starter_pack_id",
      "name": "Starter Pack"
    },
    "customer": {
      "email": "your-email@example.com"
    },
    "order": {
      "transaction_id": "tx_test_123"
    }
  }
}
```

---

## 🎯 快速测试命令

```bash
# 1. 测试端点健康检查
curl http://localhost:3000/api/webhooks/creem

# 2. 运行测试脚本（需要先设置 TEST_USER_EMAIL）
npx tsx scripts/test-webhook.ts subscription

# 3. 查看 ngrok 请求日志
open http://localhost:4040
```

