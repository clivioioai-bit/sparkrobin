# Creem Payment 集成指南

## 概述

本指南将指导您实现 Creem Payment 集成以进行订阅管理。目前的实现是**模拟**的，必须在生产环境部署之前替换为实际的 Creem Payment API 调用。

## 当前状态

🚨 **模拟实现 - 请勿在生产环境中使用**

当前问题：
- Webhook 签名验证返回 `true`（已绕过）
- 订阅创建是模拟的
- 没有实际的支付处理
- 生产环境会自动拒绝所有 webhook

## 🚀 快速开始

### 第一步：获取密钥

1. 在 Creem Payment Dashboard 中获取**测试模式**和**生产模式**的密钥
2. 创建本地 `.env.local` 文件（使用测试密钥）：

```bash
CREEM_API_KEY=pk_test_xxxxx
CREEM_WEBHOOK_SECRET=whsec_test_xxxxx
CREAM_BASE_URL=https://api-staging.creem.io
```

### 第二步：配置 Vercel

在 Vercel 项目设置中：
- **Development/Preview**: 使用测试密钥 (`pk_test_`, `whsec_test_`)
- **Production**: 使用生产密钥 (`pk_live_`, `whsec_live_`)

### 第三步：实现代码

按照下面的分步指南实现：
1. 环境配置和安全检查
2. Webhook 签名验证
3. 订阅创建 API
4. Webhook 事件处理

### 验证配置

运行以下命令测试配置：
```bash
npm run dev
# 应该看到环境检查通过，无错误提示
```

---

## 分步集成指南

### 1. 获取 Creem Payment 凭证

1. 在 https://creem.io 注册 Creem Payment 账户（或您的支付提供商）
2. 获取两套凭证（测试模式和生产模式）：
   
### 2. 环境配置指南

#### 🔧 为什么需要两套配置？

- **Test Mode（测试模式）**：
  - ✅ 不会产生真实扣款
  - ✅ 可以无限次测试支付流程
  - ✅ 可以使用测试卡号
  - ✅ 用于开发、CI/CD、预发布测试
  - ✅ 可以模拟各种支付场景（成功、失败、退款等）

- **Production Mode（生产模式）**：
  - ⚠️ 会产生真实扣款
  - ⚠️ 仅用于生产环境
  - ⚠️ 避免在开发时误操作真实支付

#### 📁 本地开发环境配置

创建 `.env.local` 文件（使用测试密钥）：

```bash
# Creem Payment - Test Mode（测试模式）
CREEM_API_KEY=pk_test_xxxxx
CREEM_WEBHOOK_SECRET=whsec_test_xxxxx
CREAM_BASE_URL=https://api-staging.creem.io
NODE_ENV=development
```

⚠️ **重要**：`.env.local` 已包含在 `.gitignore` 中，不会被提交到 Git。

#### 🚀 Vercel 生产环境配置

在 Vercel Dashboard 中设置环境变量：

1. 进入项目设置 → Environment Variables
2. 为不同环境添加变量：

**Development 环境（开发分支）**：
```bash
CREEM_API_KEY = pk_test_xxxxx
CREEM_WEBHOOK_SECRET = whsec_test_xxxxx
CREAM_BASE_URL = https://api-staging.creem.io
```

**Preview 环境（预览部署）**：
```bash
CREEM_API_KEY = pk_test_xxxxx
CREEM_WEBHOOK_SECRET = whsec_test_xxxxx
CREAM_BASE_URL = https://api-staging.creem.io
```

**Production 环境（生产部署）**：
```bash
CREEM_API_KEY = pk_live_xxxxx
CREEM_WEBHOOK_SECRET = whsec_live_xxxxx
CREAM_BASE_URL = https://api.creem.io
```

#### 🔒 安全检查代码

更新 `src/lib/creem-payment.ts`，添加环境检查：

```typescript
// Creem Payment 配置
const isProduction = process.env.NODE_ENV === 'production';

const creemConfig = {
  apiKey: process.env.CREEM_API_KEY!,
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
  baseUrl: process.env.CREAM_BASE_URL || 'https://api.creem.io',
  isTestMode: !isProduction,
};

// 安全检查：防止环境密钥混用
if (isProduction && creemConfig.apiKey.startsWith('pk_test_')) {
  throw new Error(
    '🚨 安全错误：生产环境不应使用测试密钥！\n' +
    '请在 Vercel 环境变量中配置正确的生产密钥。'
  );
}

if (!isProduction && creemConfig.apiKey.startsWith('pk_live_')) {
  console.warn(
    '⚠️ 警告：开发环境正在使用生产密钥！\n' +
    '建议使用测试密钥以避免误操作真实支付。'
  );
}

// 验证必要的环境变量
if (!creemConfig.apiKey) {
  throw new Error('缺少 CREEM_API_KEY 环境变量');
}

if (!creemConfig.webhookSecret) {
  throw new Error('缺少 CREEM_WEBHOOK_SECRET 环境变量');
}

export const creemPayment = new CreemPayment(creemConfig);
```

#### 📊 环境配置对照表

| 环境 | API Key 类型 | Webhook Secret | Base URL | 真实扣款 |
|------|-------------|----------------|----------|----------|
| 本地开发 | `pk_test_` | `whsec_test_` | staging | ❌ 否 |
| Vercel Preview | `pk_test_` | `whsec_test_` | staging | ❌ 否 |
| Vercel Production | `pk_live_` | `whsec_live_` | production | ✅ 是 |

#### 🔄 Webhook URL 配置

在 Creem.io Dashboard 中填写 Webhook URL。

**Webhook URL 格式**：
```
https://[你的域名]/api/webhooks/creem
```

**不同环境的配置**：

1. **Test Mode（测试模式）**:

   **本地开发测试**：
   ```
   https://abc123.ngrok.io/api/webhooks/creem
   ```
   > 使用 ngrok 暴露本地服务器，URL 每次启动都会变化

   **Vercel Preview 环境**：
   ```
   https://[项目名]-git-[分支名]-[用户名].vercel.app/api/webhooks/creem
   ```
   > 从 Vercel 部署日志中获取 Preview URL
   
   示例：`https://sora3-ai-git-dev-username.vercel.app/api/webhooks/creem`

2. **Production Mode（生产模式）**:
   ```
   https://[你的域名]/api/webhooks/creem
   ```
   > 使用您的正式域名
   
   示例：`https://aivido.ai/api/webhooks/creem`

**配置步骤**：

1. 登录 Creem.io Dashboard
2. 进入 Settings → Webhooks
3. 根据当前模式（Test/Production）填写对应的 URL
4. 选择要接收的事件类型：
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.cancelled`
   - ✅ `payment.succeeded`
   - ✅ `payment.failed`
5. 保存并测试 Webhook

**测试 Webhook**：

Creem.io 通常提供测试功能，点击 "Send Test Webhook" 按钮，检查：
- [ ] Webhook 是否成功接收（返回 200 状态码）
- [ ] 签名验证是否通过
- [ ] 事件是否正确处理

#### ✅ 配置验证清单

- [ ] 测试密钥和生产密钥已分别获取
- [ ] 本地 `.env.local` 使用测试密钥
- [ ] `.env.local` 已加入 `.gitignore`
- [ ] Vercel Development 环境配置测试密钥
- [ ] Vercel Preview 环境配置测试密钥
- [ ] Vercel Production 环境配置生产密钥
- [ ] 代码中添加环境检查逻辑
- [ ] Creem Dashboard 配置不同环境的 Webhook 端点
- [ ] 测试环境可以成功调用 API
- [ ] 生产环境密钥未泄露到代码库

### 3. 安装 Creem Payment SDK

Creem 提供官方 TypeScript SDK：

```bash
# 安装官方 SDK
npm install creem

# 或使用 yarn
yarn add creem

# 如果需要 Zod 类型验证支持（推荐）
npm install creem-zod
```

**推荐使用 `creem-zod`**，它提供更好的类型安全和验证。

### 4. 初始化 Creem SDK

**文件**：`src/lib/creem-payment.ts`

更新为使用官方 SDK：

```typescript
import { Creem } from 'creem';
import crypto from 'crypto';

// 初始化 Creem SDK
const creem = new Creem();

interface CreemPaymentConfig {
  apiKey: string;
  webhookSecret: string;
}

// Creem Payment 配置
const isProduction = process.env.NODE_ENV === 'production';

const creemConfig: CreemPaymentConfig = {
  apiKey: process.env.CREEM_API_KEY!,
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
};

// 安全检查：防止环境密钥混用
if (isProduction && creemConfig.apiKey.startsWith('creem_test_')) {
  throw new Error(
    '🚨 安全错误：生产环境不应使用测试密钥！\n' +
    '请在 Vercel 环境变量中配置正确的生产密钥。'
  );
}

if (!isProduction && !creemConfig.apiKey.startsWith('creem_test_')) {
  console.warn(
    '⚠️ 警告：开发环境正在使用生产密钥！\n' +
    '建议使用测试密钥以避免误操作真实支付。'
  );
}

// 验证必要的环境变量
if (!creemConfig.apiKey) {
  throw new Error('缺少 CREEM_API_KEY 环境变量');
}

if (!creemConfig.webhookSecret) {
  throw new Error('缺少 CREEM_WEBHOOK_SECRET 环境变量');
}

// 导出配置和 SDK 实例
export { creem, creemConfig };
```

### 5. 实现 Webhook 签名验证

**文件**：`src/lib/creem-payment.ts`（继续添加）

实现 HMAC-SHA256 验证：

```typescript
// Webhook 签名验证函数
export function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
    if (!signature) {
      console.error('No signature provided for webhook verification');
      return false;
    }

  try {
    // 使用 HMAC-SHA256 生成预期签名
    const expectedSignature = crypto
      .createHmac('sha256', creemConfig.webhookSecret)
      .update(body)
      .digest('hex');
    
    // 使用时序安全比较以防止时序攻击
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
```

**重要说明**：
- 使用 `crypto.timingSafeEqual()` 防止时序攻击
- 签名头名称可能会有所不同（例如 `X-Creem-Signature`、`Creem-Signature`）
- 查看 Creem Payment 文档以获取确切的头名称

### 6. 使用 Creem SDK 创建订阅

**文件**：`src/lib/creem-payment.ts`（继续添加）

使用官方 SDK 创建订阅：

```typescript
// 创建订阅
export async function createSubscription(params: {
  customerId: string;
  planId: string;
  billingCycle: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    // 使用 Creem SDK 创建订阅
    // 注意：根据实际的 Creem SDK API 调整参数
    const result = await creem.createSubscription({
      xApiKey: creemConfig.apiKey,
      requestBody: {
        customerId: params.customerId,
        planId: params.planId,
        billingCycle: params.billingCycle,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
      },
    });

    return {
      id: result.id,
      checkoutUrl: result.checkoutUrl,
      status: result.status,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}
```

**或者使用 REST API 方式**（如果 SDK 不支持某些操作）：

```typescript
export async function createSubscriptionViaAPI(params: {
  customerId: string;
  planId: string;
  billingCycle: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    const response = await fetch(`https://api.creem.io/subscriptions`, {
          method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': creemConfig.apiKey,
      },
      body: JSON.stringify({
        customerId: params.customerId,
        planId: params.planId,
        billingCycle: params.billingCycle,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Subscription creation failed: ${error.message}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      checkoutUrl: data.checkoutUrl,
      status: data.status,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}
```

### 7. 更新 Webhook 处理器

**文件**：`app/api/webhooks/creem/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/creem-payment';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 获取原始 body 和签名
    const body = await request.text();
    const signature = request.headers.get('x-creem-signature'); // 检查正确的头名称
    
    // 验证 webhook 签名
    const isValid = verifyWebhookSignature(body, signature);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // 解析已验证的 body
    const event = JSON.parse(body);
    
    // 处理不同的事件类型
    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data);
        break;
      
      case 'payment.succeeded':
        await handlePaymentSucceeded(event.data);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.data);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// 处理器函数
async function handleSubscriptionCreated(data: any) {
  const { data: result, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: data.customer_id,
      subscription_id: data.subscription_id,
      plan_id: data.plan_id,
      status: 'active',
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
    });
  
  if (error) {
    console.error('Error creating subscription in DB:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(data: any) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: data.status,
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
    })
    .eq('subscription_id', data.subscription_id);
  
  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(data: any) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('subscription_id', data.subscription_id);
  
  if (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(data: any) {
  // 记录支付、更新积分等
  console.log('Payment succeeded:', data);
}

async function handlePaymentFailed(data: any) {
  // 处理支付失败、通知用户等
  console.error('Payment failed:', data);
}
```

### 8. 本地测试 Webhook

使用 Creem Payment 的 webhook 测试工具或 ngrok：

```bash
# 安装 ngrok
npm install -g ngrok

# 启动开发服务器
npm run dev

# 在另一个终端中，暴露 localhost
ngrok http 3000

# 在 Creem Payment 控制面板中使用 ngrok URL 作为 webhook 端点
# https://your-ngrok-url.ngrok.io/api/webhooks/creem
```

### 9. 添加错误处理和重试逻辑

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}

// 使用方式
const subscription = await retryOperation(() =>
  createSubscription(params)
);
```

### 10. 添加监控和日志

```typescript
// 添加到 webhook 处理器
import * as Sentry from '@sentry/nextjs';

try {
  // ... webhook 处理
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      webhook_type: event.type,
      subscription_id: event.data?.subscription_id,
    },
  });
  throw error;
}
```

### 11. 测试检查清单

创建测试用例：

- [ ] 有效的 webhook 签名验证
- [ ] 无效的 webhook 签名拒绝
- [ ] 缺少签名拒绝
- [ ] 订阅创建成功
- [ ] 订阅创建失败
- [ ] 每个 webhook 事件类型的处理
- [ ] Webhook 后的数据库更新
- [ ] 幂等性（相同的 webhook 处理两次）
- [ ] 支付失败处理
- [ ] 订阅取消流程

### 12. 预发布环境测试

在生产环境之前：

1. 使用测试 API 密钥设置预发布环境
2. 处理测试支付
3. 验证 webhook 正确接收和处理
4. 检查数据库更新
5. 测试所有订阅生命周期事件：
   - 创建
   - 续订
   - 升级/降级
   - 取消
   - 支付失败
   - 重新激活

## 环境变量配置参考

### 本地开发环境（`.env.local`）

```bash
# Creem Payment - Test Mode
CREEM_API_KEY=pk_test_xxxxxxxxxxxxx
CREEM_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxx
CREAM_BASE_URL=https://api-staging.creem.io
NODE_ENV=development

# 其他必要的环境变量
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Vercel 环境变量

#### Development 和 Preview 环境

```bash
CREEM_API_KEY=pk_test_xxxxxxxxxxxxx
CREEM_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxx
CREAM_BASE_URL=https://api-staging.creem.io
```

#### Production 环境

```bash
CREEM_API_KEY=pk_live_xxxxxxxxxxxxx
CREEM_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxx
CREAM_BASE_URL=https://api.creem.io
```

### 环境变量说明

| 变量名 | 测试值示例 | 生产值示例 | 必需 | 说明 |
|--------|-----------|-----------|------|------|
| `CREEM_API_KEY` | `pk_test_...` | `pk_live_...` | ✅ | Creem Payment API 密钥 |
| `CREEM_WEBHOOK_SECRET` | `whsec_test_...` | `whsec_live_...` | ✅ | Webhook 签名验证密钥 |
| `CREEM_BASE_URL` | staging URL | production URL | ✅ | API 基础 URL |
| `NODE_ENV` | `development` | `production` | ✅ | Node 环境标识 |

## 安全检查清单

- [ ] Webhook 签名验证已实现
- [ ] Webhook 端点仅使用 HTTPS
- [ ] 使用时序安全比较进行签名验证
- [ ] 密钥存储在环境变量中（未提交到代码库）
- [ ] Webhook 端点启用速率限制
- [ ] 重试使用幂等键
- [ ] 日志记录不暴露敏感数据
- [ ] 错误监控已设置
- [ ] 访问日志已启用

## 常见问题及解决方案

### 问题：未接收到 Webhook

**解决方案**：
- 检查 webhook URL 是否可公开访问
- 验证是否已启用 HTTPS
- 检查防火墙/安全组设置
- 在本地开发中使用 ngrok 进行测试
- 检查 Creem Payment 控制面板中的 webhook 日志

### 问题：签名验证失败

**解决方案**：
- 验证 webhook 密钥是否正确
- 检查使用的是原始 body（而不是已解析的 JSON）
- 确认正确的签名头名称
- 检查中间件是否对 body 进行了任何修改
- 验证 HMAC 算法是否匹配（通常是 SHA256）

### 问题：重复的 Webhook 处理

**解决方案**：
- 使用 `event.id` 实现幂等性
- 在数据库中存储已处理的 webhook ID
- 使用数据库事务进行原子更新

### 问题：环境密钥配置错误

**常见错误**：

1. **生产环境使用测试密钥**
   ```
   错误: 🚨 安全错误：生产环境不应使用测试密钥！
   ```
   解决方案：在 Vercel Production 环境变量中设置 `pk_live_` 开头的密钥

2. **环境变量未设置**
   ```
   错误: 缺少 CREEM_API_KEY 环境变量
   ```
   解决方案：检查 Vercel 环境变量配置，确保所有必需变量都已设置

3. **Webhook Secret 不匹配**
   ```
   错误: Invalid webhook signature
   ```
   解决方案：
   - 确认测试环境使用 `whsec_test_` 密钥
   - 确认生产环境使用 `whsec_live_` 密钥
   - 在 Creem Dashboard 中验证 Webhook Secret

4. **本地开发使用生产密钥**
   ```
   警告: ⚠️ 警告：开发环境正在使用生产密钥！
   ```
   解决方案：更新 `.env.local` 使用测试密钥

## 生产环境部署检查清单

- [ ] 所有模拟代码已删除
- [ ] 已配置生产环境 API 密钥
- [ ] Webhook 签名验证已实现
- [ ] 所有事件类型已处理
- [ ] 错误处理和重试逻辑已实现
- [ ] 监控和告警已设置
- [ ] 预发布环境已彻底测试
- [ ] 回滚计划已记录
- [ ] 已安排值班轮换
- [ ] 已通知客户支持

## 文档参考

- Creem Payment API 文档：[URL]
- Webhook 文档：[URL]
- 测试指南：[URL]
- 支持联系方式：support@creem.io

## 支持

如果您遇到问题：
1. 查看 Creem Payment 文档
2. 查看 Creem Payment 控制面板中的 webhook 日志
3. 检查应用程序日志
4. 联系 Creem Payment 支持
5. 查看本指南的故障排除部分

---

**最后更新**：2025年10月3日  
**状态**：实施指南  
**下次审查**：生产环境部署之前
