# 修复 Checkout 404 错误

## 问题描述

点击支付时跳转到 `https://creem.io/checkout/starter-pack` 等静态 URL，但这些页面返回 404。

## 原因

代码逻辑：
1. **优先**：使用 `productId` 通过 Creem API 创建 checkout session（动态生成 URL）
2. **Fallback**：如果 `productId` 未配置，使用静态的 `checkoutUrl`

当 `NEXT_PUBLIC_CREEM_PACK_STARTER_ID` 为空时，代码会 fallback 到静态 URL `https://creem.io/checkout/starter-pack`，但这个 URL 不存在。

## 解决方案

### 方案 1：配置正确的 productId（推荐）

1. **登录 Creem Dashboard**
   - 访问 https://creem.io
   - 进入 **Products** 页面
   - 找到 "Starter Pack" 产品
   - 复制产品 ID（格式：`prod_xxxxx`）

2. **更新 `.env.local`**
   ```bash
   # 移除或注释掉静态 URL（这些 URL 不存在）
   # NEXT_PUBLIC_CREEM_PACK_STARTER_URL=https://creem.io/checkout/starter-pack
   
   # 配置正确的产品 ID
   NEXT_PUBLIC_CREEM_PACK_STARTER_ID=prod_xxxxx  # 从 Creem Dashboard 获取
   ```

3. **重启开发服务器**
   ```bash
   # 停止当前服务器 (Ctrl+C)
   pnpm dev
   ```

### 方案 2：本地测试时使用模拟支付

如果暂时无法获取真实的 productId，可以在本地测试时：

1. **确保开发模式已启用**
   ```bash
   NEXT_PUBLIC_API_ENV=development
   ```

2. **代码会自动使用模拟支付**（不会跳转到 Creem）

### 方案 3：创建测试产品（如果还没有）

如果 Creem Dashboard 中还没有创建产品：

1. 参考 [CREEM_PRODUCT_CREATION_GUIDE.md](./CREEM_PRODUCT_CREATION_GUIDE.md)
2. 在 Creem Dashboard 创建产品
3. 获取产品 ID 并配置到 `.env.local`

## 验证配置

检查环境变量是否正确：

```bash
# 检查 productId 是否配置
grep "NEXT_PUBLIC_CREEM_PACK_STARTER_ID" .env.local

# 应该看到类似：
# NEXT_PUBLIC_CREEM_PACK_STARTER_ID=prod_xxxxx
```

## 代码修改说明

已修改 `app/api/checkout/route.ts`：
- 在开发模式下，如果 `productId` 未配置，会返回明确的错误提示
- 不再使用可能不存在的静态 URL
- 错误信息会提示需要配置哪个环境变量

## 相关文件

- `src/config/creemPlans.ts` - 计划配置
- `app/api/checkout/route.ts` - Checkout API 路由
- `env.example` - 环境变量示例

## 常见问题

### Q: 如何获取 productId？

1. 登录 Creem Dashboard
2. 进入 Products 页面
3. 找到对应的产品
4. 复制产品 ID（通常在 URL 或产品详情中）

### Q: 静态 URL 为什么不存在？

Creem 不提供预定义的静态 checkout URL。每个 checkout session 都是通过 API 动态创建的，包含：
- 用户信息
- 成功/取消回调 URL
- 元数据（planId, credits 等）

### Q: 本地测试时可以不配置 productId 吗？

可以，但需要：
1. 设置 `NEXT_PUBLIC_API_ENV=development`
2. 代码会使用模拟支付，不会跳转到 Creem

---

**最后更新**: 2025-01-XX

