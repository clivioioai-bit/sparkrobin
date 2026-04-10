# 数据库体系架构说明

## 📊 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Auth (系统自带)                  │
│                    auth.users                                │
│                    (用户登录认证)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 1:1 关联
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    核心表：users                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ • id (关联 auth.users)                              │    │
│  │ • email, full_name                                  │    │
│  │ • credits_balance (当前可用积分) ⭐                  │    │
│  │ • credits_total (累计获得积分)                       │    │
│  │ • credits_spent (累计消费积分)                       │    │
│  │ • subscription_plan (订阅计划)                      │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
        ▼            ▼            ▼              ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│ 订阅表    │ │ 积分交易  │ │ 视频任务  │ │ 支付记录  │
│user_      │ │credit_    │ │video_jobs │ │payments   │
│subscriptions││transactions││           │ │           │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
```

---

## 🎯 三大核心模块

### 1️⃣ 用户与认证模块

**核心表：`users`**

```sql
users 表
├── id (UUID, 关联 auth.users) ← 这是关键！关联 Supabase 认证系统
├── email, full_name (用户信息)
├── subscription_plan (订阅计划: free/basic/creator/pro)
├── subscription_status (订阅状态: active/canceled)
└── credits_balance, credits_total, credits_spent (积分系统核心)
```

**作用**：
- 存储用户基本信息（邮箱、姓名）
- 存储积分信息（余额、累计、消费）
- 存储订阅信息（计划、状态）

**关系**：
- `users.id` ← → `auth.users.id` (1:1，每个登录用户对应一个 users 记录)

---

### 2️⃣ 积分系统模块

**核心表：`credit_transactions`**

```sql
credit_transactions 表
├── user_id (关联 users)
├── amount (正数=增加，负数=扣除)
├── transaction_type (credit/debit/refund)
├── reason (purchase/subscription/refund/manual/generation)
└── metadata (JSON，额外信息)
```

**作用**：
- 记录每一次积分变动（增加/扣除/退款）
- 用于审计和调试
- 可以追踪积分来源和去向

**数据流**：
```
用户购买订阅
    ↓
支付成功 (payments 表记录)
    ↓
调用 credit_user_credits_transaction() 函数
    ↓
更新 users.credits_balance (+100)
    ↓
记录到 credit_transactions (记录这笔交易)
```

**关键函数**：
- `credit_user_credits_transaction()` - 增加积分（原子操作）
- `debit_user_credits_transaction()` - 扣除积分（原子操作）
- `refund_user_credits()` - 退还积分（原子操作）

**为什么需要函数？**
- 保证原子性：积分更新 + 记录交易是原子操作（要么都成功，要么都失败）
- 防止并发问题：两个请求同时扣除积分时不会出错
- 数据一致性：`users.credits_balance` 和 `credit_transactions` 始终一致

---

### 3️⃣ 视频生成模块

**核心表：`video_jobs`**

```sql
video_jobs 表
├── user_id (关联 users)
├── job_id (外部系统返回的任务ID，唯一)
├── status (pending/processing/completed/failed)
├── prompt (用户输入的提示词)
├── image_url (输入图片，如果是图片生成视频)
├── result_url (生成的视频URL)
├── cost_credits (消耗的积分)
└── model (使用的模型: veo3/veo4等)
```

**数据流**：
```
用户发起生成请求
    ↓
检查 users.credits_balance 是否足够
    ↓
调用 debit_user_credits_transaction() 扣除积分
    ↓
创建 video_jobs 记录 (status='pending')
    ↓
调用外部 API 生成视频
    ↓
更新 video_jobs (status='processing' → 'completed')
```

---

## 🔄 完整业务流程示例

### 场景：用户购买订阅并生成视频

```
1. 用户注册
   └─> auth.users 创建 (Supabase Auth)
   └─> users 表自动创建记录 (触发器 handle_new_user)
   └─> 初始积分: credits_balance = 3

2. 用户购买订阅
   └─> 支付成功 (Creem 支付系统)
   └─> webhook 收到支付成功通知
   └─> payments 表记录支付信息
   └─> user_subscriptions 表创建订阅记录
   └─> 调用 credit_user_credits_transaction() 增加积分
   └─> users.credits_balance += 100
   └─> credit_transactions 记录: +100, reason='subscription'

3. 用户生成视频
   └─> 检查 users.credits_balance >= 20
   └─> 调用 debit_user_credits_transaction() 扣除积分
   └─> users.credits_balance -= 20
   └─> credit_transactions 记录: -20, reason='generation'
   └─> video_jobs 创建记录 (status='pending')
   └─> 调用外部 API 生成视频
   └─> 更新 video_jobs (status='completed', result_url='...')
```

---

## 📋 所有表的功能说明

### 核心表（必须）

| 表名 | 作用 | 关键字段 |
|------|------|----------|
| `users` | 用户信息和积分 | `credits_balance`, `credits_total`, `credits_spent` |
| `credit_transactions` | 积分交易记录 | `amount`, `transaction_type`, `reason` |
| `video_jobs` | 视频生成任务 | `job_id`, `status`, `cost_credits` |
| `payments` | 支付记录 | `payment_id`, `amount`, `status` |
| `user_subscriptions` | 订阅信息 | `plan_type`, `plan_status`, `subscription_id` |

### 辅助表（可选）

| 表名 | 作用 |
|------|------|
| `api_keys` | API 密钥管理 |
| `usage_stats` | 使用统计（每日） |
| `user_email_aliases` | 邮箱别名（用于支付匹配） |
| `unmatched_payment_emails` | 未匹配的支付邮箱（处理异常） |
| `system_config` | 系统配置（积分价格等） |

---

## 🔗 表之间的关系

```
auth.users (Supabase 系统表)
    ↓ 1:1
users (你的用户表)
    ↓ 1:N
    ├── user_subscriptions (一个用户可以有多个订阅历史)
    ├── credit_transactions (一个用户有多笔积分交易)
    ├── video_jobs (一个用户有多个视频生成任务)
    ├── payments (一个用户有多次支付)
    └── api_keys (一个用户可以有多个 API 密钥)
```

---

## 🛡️ 安全机制：RLS (Row Level Security)

**RLS 是什么？**
- 行级安全策略
- 确保用户只能访问自己的数据

**示例**：
```sql
-- 用户只能查看自己的积分交易
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
```

**效果**：
- 用户 A 只能看到自己的 `credit_transactions`
- 用户 A 无法看到用户 B 的数据
- 即使直接查询数据库，也受 RLS 限制

---

## 🔧 关键函数说明

### 积分函数（原子操作）

```sql
-- 增加积分
credit_user_credits_transaction(
  user_id,      -- 用户ID
  amount,        -- 积分数量（正数）
  reason,        -- 原因（'subscription'/'purchase'等）
  metadata       -- 额外信息（JSON）
)
→ 返回: { credits_balance, credits_total, credits_spent }

-- 扣除积分
debit_user_credits_transaction(
  user_id,
  amount,        -- 积分数量（正数）
  reason,        -- 原因（'generation'等）
  metadata
)
→ 返回: { credits_balance, credits_total, credits_spent }

-- 退还积分
refund_user_credits(
  user_id,
  amount,
  reason,
  metadata
)
→ 返回: { credits_balance, credits_total, credits_spent }
```

**为什么需要这些函数？**
1. **原子性**：更新 `users` 表 + 插入 `credit_transactions` 表是原子操作
2. **并发安全**：多个请求同时操作时不会出错
3. **数据一致性**：保证 `users.credits_balance` 和 `credit_transactions` 始终一致

---

## 📊 数据流示例

### 积分增加流程

```
1. 代码调用: credit_user_credits_transaction(user_id, 100, 'subscription')
   ↓
2. 函数内部:
   ├─ 查询 users.credits_balance (当前值)
   ├─ 检查: 当前值 + 100 <= 50000 (上限检查)
   ├─ 更新: users.credits_balance += 100
   ├─ 更新: users.credits_total += 100
   ├─ 插入: credit_transactions (记录这笔交易)
   └─ 返回: 新的积分值
   ↓
3. 返回结果: { credits_balance: 103, credits_total: 103, credits_spent: 0 }
```

### 积分扣除流程

```
1. 代码调用: debit_user_credits_transaction(user_id, 20, 'generation')
   ↓
2. 函数内部:
   ├─ 查询 users.credits_balance (当前值)
   ├─ 检查: 当前值 >= 20 (余额检查)
   ├─ 更新: users.credits_balance -= 20
   ├─ 更新: users.credits_spent += 20
   ├─ 插入: credit_transactions (记录这笔交易)
   └─ 返回: 新的积分值
   ↓
3. 返回结果: { credits_balance: 83, credits_total: 103, credits_spent: 20 }
```

---

## 🎯 关键概念总结

### 1. 为什么 `users` 表要关联 `auth.users`？

- `auth.users` 是 Supabase 的认证表（系统管理）
- `users` 是你的业务表（存储积分、订阅等信息）
- 通过 `users.id = auth.users.id` 关联，实现：
  - 登录后自动识别用户
  - RLS 策略自动生效（`auth.uid()` 可以获取当前用户）

### 2. 为什么需要 `credit_transactions` 表？

- 审计：记录每次积分变动
- 调试：出问题时可以追踪
- 退款：可以追溯原始交易
- 统计：可以分析积分使用情况

### 3. 为什么积分操作要用函数而不是直接 SQL？

**直接 SQL 的问题**：
```sql
-- 这样不安全！
UPDATE users SET credits_balance = credits_balance - 20 WHERE id = 'xxx';
INSERT INTO credit_transactions ...;
-- 如果 INSERT 失败，UPDATE 已经执行了，数据不一致！
```

**函数的好处**：
```sql
-- 函数内部是原子操作
debit_user_credits_transaction(...);
-- 如果任何一步失败，整个操作回滚，数据一致！
```

### 4. 表之间的关系

- **users** ← 1:1 → **auth.users** (认证关联)
- **users** ← 1:N → **credit_transactions** (一个用户多笔交易)
- **users** ← 1:N → **video_jobs** (一个用户多个视频)
- **users** ← 1:N → **payments** (一个用户多次支付)
- **users** ← 1:1 → **user_subscriptions** (一个用户一个订阅)

---

## ✅ 检查清单

### 数据库是否完整？

1. ✅ `users` 表存在且关联 `auth.users`
2. ✅ `credit_transactions` 表存在
3. ✅ `video_jobs` 表存在
4. ✅ `payments` 表存在
5. ✅ `user_subscriptions` 表存在
6. ✅ 积分函数已创建（`credit_user_credits_transaction`, `debit_user_credits_transaction`, `refund_user_credits`）
7. ✅ RLS 策略已启用
8. ✅ 触发器已创建（自动创建用户记录）

---

## 🔍 常见问题

### Q: `users` 表和 `auth.users` 有什么区别？

**A**: 
- `auth.users`：Supabase 系统表，管理登录认证
- `users`：你的业务表，存储积分、订阅等业务信息
- 两者通过 `id` 字段关联（`users.id = auth.users.id`）

### Q: 为什么积分信息存在 `users` 表，还要 `credit_transactions` 表？

**A**:
- `users.credits_balance`：当前余额（快照）
- `credit_transactions`：历史记录（明细）
- 就像银行账户：余额是当前值，交易记录是历史明细

### Q: 如果用户删除账号会怎样？

**A**:
- 删除 `auth.users` 记录
- 由于 `ON DELETE CASCADE`，`users` 表记录自动删除
- `credit_transactions`, `video_jobs`, `payments` 等关联记录也会自动删除

---

## 📝 总结

你的数据库体系分为三大模块：

1. **用户模块** (`users`) - 存储用户信息和积分余额
2. **积分系统** (`credit_transactions` + 函数) - 管理积分变动
3. **业务模块** (`video_jobs`, `payments`, `user_subscriptions`) - 存储业务数据

所有表都通过 `user_id` 关联到 `users` 表，`users` 表通过 `id` 关联到 `auth.users`。

**核心原则**：
- 积分操作必须通过函数（保证原子性）
- 所有表启用 RLS（保证安全）
- 所有关联都使用 `ON DELETE CASCADE`（保证数据一致性）

