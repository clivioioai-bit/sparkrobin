# 订阅信息保存修复指南

## 问题描述

Creem 购买成功后，订阅支付信息没有保存到 Supabase 数据库中。

## 修复内容

本次修复包括以下改进：

1. **数据库结构修复** - 添加缺失的列
2. **错误处理改进** - 增强日志和错误诊断
3. **RLS 策略修复** - 确保服务端可以插入/更新订阅
4. **数据验证** - 添加保存后的验证步骤

## 执行步骤

### 1. 运行数据库迁移脚本

在 Supabase SQL Editor 中依次执行以下脚本：

#### 步骤 1.1: 添加缺失的列
```sql
-- 执行文件: database/add-subscription-columns.sql
```
这个脚本会：
- 添加 `plan_type` 列（如果不存在）
- 添加 `plan_status` 列（如果不存在）
- 从现有的 `status` 列复制数据到 `plan_status`（如果需要）
- 创建必要的索引

#### 步骤 1.2: 修复 RLS 策略
```sql
-- 执行文件: database/fix-subscription-rls-policies.sql
```
这个脚本会：
- 添加允许 service role 管理订阅的策略
- 保留用户查看自己订阅的策略
- 保留触发器插入订阅的策略

### 2. 验证修复

执行以下 SQL 查询验证修复是否成功：

```sql
-- 检查列是否存在
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND table_schema = 'public'
  AND column_name IN ('plan_type', 'plan_status')
ORDER BY column_name;

-- 检查 RLS 策略
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_subscriptions' 
  AND schemaname = 'public'
ORDER BY policyname;
```

### 3. 测试订阅创建

1. 进行一次测试购买
2. 检查 webhook 日志，应该看到：
   - `[WEBHOOK-xxx] ✅ Subscription created successfully`
   - `[WEBHOOK-xxx] ✅ Verification successful - subscription record confirmed in database`
   - `[WEBHOOK-xxx] Final Summary` 显示 `subscriptionSaved: true`

3. 在 Supabase 中验证数据：
```sql
SELECT id, user_id, plan_type, plan_status, creem_subscription_id, created_at
FROM user_subscriptions
ORDER BY created_at DESC
LIMIT 5;
```

## 代码改进说明

### 1. 增强的错误处理

`handleSubscriptionCreated` 函数现在包含：
- 详细的输入验证
- 完整的错误日志（包括错误代码、消息、详情和提示）
- 操作类型标识（INSERT vs UPDATE）
- 列缺失错误的特殊检测
- RLS 策略错误的特殊检测

### 2. 数据验证

订阅创建/更新后，代码会：
- 立即查询数据库验证数据是否保存
- 记录验证结果到日志
- 如果验证失败，记录详细错误信息

### 3. 改进的日志格式

所有日志现在包含：
- 唯一的 handler ID（便于追踪）
- 时间戳
- 清晰的操作步骤标识
- 结构化的数据输出

## 故障排查

### 如果订阅仍然无法保存

1. **检查 webhook 日志**：
   - 查找 `[WEBHOOK-xxx] ❌❌❌ CRITICAL` 错误
   - 查看错误代码和消息

2. **检查数据库列**：
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'user_subscriptions';
   ```
   确保 `plan_type` 和 `plan_status` 存在

3. **检查 RLS 策略**：
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_subscriptions';
   ```
   确保存在 "Service role can manage subscriptions" 策略

4. **检查环境变量**：
   - `SUPABASE_SERVICE_ROLE_KEY` 必须设置
   - `NEXT_PUBLIC_SUPABASE_URL` 必须设置

5. **检查 Supabase 服务角色权限**：
   - 在 Supabase Dashboard 中确认 service role key 有效
   - 确认 RLS 已启用但 service role 可以绕过

## 相关文件

- `database/add-subscription-columns.sql` - 添加列迁移
- `database/fix-subscription-rls-policies.sql` - RLS 策略修复
- `app/api/webhooks/creem/route.ts` - Webhook 处理逻辑（已改进）

## 注意事项

1. **备份数据**：在执行迁移脚本前，建议备份 `user_subscriptions` 表
2. **测试环境**：先在测试环境验证修复，再应用到生产环境
3. **监控日志**：修复后密切监控 webhook 日志，确保没有新的错误

## 后续优化建议

1. 考虑添加数据库迁移版本管理
2. 添加自动化测试验证订阅创建流程
3. 考虑添加重试机制处理临时性错误
4. 添加监控告警，当订阅保存失败时通知



