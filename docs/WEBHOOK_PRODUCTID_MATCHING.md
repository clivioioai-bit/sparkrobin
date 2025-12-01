# Webhook ProductId 匹配和积分发放详解

## 📋 核心概念

### 1. `creemPlansById` 数据结构

这是一个包含所有计划配置的对象，结构如下：

```typescript
creemPlansById = {
  "basic_monthly": {
    id: "basic_monthly",
    name: "Basic · Monthly",
    credits: 600,                    // ⭐ 这是要发放的积分数量
    category: "subscription",
    productId: "prod_68dHOffXCVRWc7NZxX00Z",  // ⭐ 这是 Creem 的产品 ID
    priceCents: 1900,
    // ... 其他字段
  },
  "starter": {
    id: "starter",
    name: "Starter Pack",
    credits: 300,                    // ⭐ 这是要发放的积分数量
    category: "pack",
    productId: "prod_xxx",           // ⭐ 这是 Creem 的产品 ID
    priceCents: 990,
    // ... 其他字段
  },
  // ... 其他计划
}
```

### 2. 匹配流程

当 webhook 收到支付成功事件时，会执行以下匹配流程：

```
Webhook 收到支付事件
    ↓
提取 product.id (来自 Creem)
    ↓
在 creemPlansById 中查找匹配的 planConfig
    ↓
如果找到 → 使用 planConfig.credits
如果没找到 → 尝试从 metadata 获取 credits
```

## 🔍 详细匹配逻辑

### 步骤 1: 从 Webhook 中提取 productId

```typescript
// Webhook 数据示例
const checkout = {
  product: {
    id: "prod_68dHOffXCVRWc7NZxX00Z",  // ⭐ Creem 的产品 ID
    name: "Basic Monthly Plan",
    // ...
  },
  order: { /* ... */ },
  customer: { /* ... */ }
};
```

### 步骤 2: 在 creemPlansById 中查找匹配

```typescript
// 方法 1: 通过 productId 直接匹配
let planConfig = Object.values(creemPlansById).find(
  plan => plan.productId === product.id
);

// 示例：
// product.id = "prod_68dHOffXCVRWc7NZxX00Z"
// 查找 creemPlansById 中 productId === "prod_68dHOffXCVRWc7NZxX00Z" 的计划
// 找到 → planConfig = { id: "basic_monthly", credits: 600, ... }
```

### 步骤 3: 如果找到 planConfig，使用 planConfig.credits

```typescript
if (planConfig) {
  creditAmount = planConfig.credits;  // ⭐ 直接使用配置中的积分数量
  planCategory = planConfig.category;  // "subscription" 或 "pack"
  planId = planConfig.id;              // "basic_monthly"
}
```

## 📊 完整示例

### 场景：用户购买了 Basic Monthly 订阅

#### 1. 环境变量配置

```bash
# .env.local
NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID=prod_68dHOffXCVRWc7NZxX00Z
```

#### 2. 代码中的计划配置

```typescript
// src/config/creemPlans.ts
{
  id: "basic_monthly",
  productId: process.env.NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID,  // "prod_68dHOffXCVRWc7NZxX00Z"
  credits: 600,  // ⭐ 这个值会被使用
  category: "subscription"
}
```

#### 3. Webhook 收到的数据

```json
{
  "eventType": "checkout.completed",
  "product": {
    "id": "prod_68dHOffXCVRWc7NZxX00Z",  // ⭐ 匹配的关键
    "name": "Basic Monthly Plan"
  }
}
```

#### 4. 匹配过程

```typescript
// 1. 提取 productId
const productId = checkout.product.id;  // "prod_68dHOffXCVRWc7NZxX00Z"

// 2. 在 creemPlansById 中查找
const planConfig = Object.values(creemPlansById).find(
  plan => plan.productId === productId
);
// 结果：找到 { id: "basic_monthly", credits: 600, productId: "prod_68dHOffXCVRWc7NZxX00Z" }

// 3. 使用 planConfig.credits
if (planConfig) {
  creditAmount = planConfig.credits;  // 600 ⭐
  // 发放 600 积分给用户
}
```

## ⚠️ 如果 productId 不匹配会发生什么？

### 情况 1: productId 未配置或配置错误

```typescript
// 环境变量
NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID=wrong_product_id

// Webhook 收到的
product.id = "prod_68dHOffXCVRWc7NZxX00Z"

// 匹配结果
planConfig = undefined  // ❌ 找不到匹配

// 降级处理
if (!planConfig) {
  // 尝试从 metadata 获取 credits
  const creditsFromMetadata = checkout.metadata?.credits;
  if (creditsFromMetadata) {
    creditAmount = Number(creditsFromMetadata);  // 使用 metadata 中的值
  } else {
    creditAmount = 0;  // ❌ 无法发放积分
  }
}
```

### 情况 2: metadata 中有 credits

即使 productId 不匹配，如果 metadata 中有 credits，仍然可以工作：

```json
{
  "product": {
    "id": "prod_unknown"
  },
  "metadata": {
    "credits": "600"  // ⭐ 降级使用这个值
  }
}
```

## 🎯 关键点总结

1. **productId 匹配是主要方式**
   - 通过 `plan.productId === creemPlansById[x].productId` 匹配
   - 匹配成功 → 使用 `planConfig.credits`

2. **planConfig.credits 的来源**
   - 来自 `src/config/creemPlans.ts` 中的硬编码值
   - 例如：`basic_monthly: { credits: 600 }`

3. **为什么需要环境变量？**
   - 环境变量提供 Creem 的实际产品 ID
   - 代码中的 `productId` 字段从环境变量读取
   - 这样代码配置和 Creem 产品就能关联起来

4. **匹配失败的处理**
   - 优先尝试从 metadata 获取 credits
   - 如果都失败，`creditAmount = 0`，不会发放积分

## 🔧 如何确保匹配成功？

### 方法 1: 配置正确的环境变量（推荐）

```bash
# 1. 在 Creem Dashboard 查看产品 ID
# 2. 在 .env.local 中配置
NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID=prod_68dHOffXCVRWc7NZxX00Z

# 3. 确保与 creemPlansById 中的 productId 一致
```

### 方法 2: 在创建 checkout 时传递 metadata

```typescript
// 创建 checkout 时
await createCheckoutForProduct({
  productId: "prod_xxx",
  metadata: {
    credits: "600",  // ⭐ 即使 productId 不匹配，也能使用这个值
    planId: "basic_monthly"
  }
});
```

## 📝 实际代码位置

- **计划配置定义**: `src/config/creemPlans.ts`
- **匹配逻辑**: `app/api/webhooks/creem/route.ts` (第 1525-1590 行)
- **积分发放**: `app/api/webhooks/creem/route.ts` (第 1586-1589 行)

