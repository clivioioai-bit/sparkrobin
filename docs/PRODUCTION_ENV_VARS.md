# 生产环境变量配置指南

本文档列出了在生产环境（如 Vercel）中需要配置的所有环境变量。

## 📋 快速清单

### ✅ 必需配置（核心功能）

这些变量是应用运行所必需的，必须配置：

```bash
# ==============================================
# Next.js 应用配置
# ==============================================
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NODE_ENV=production

# ==============================================
# Supabase 配置（必需）
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ==============================================
# KIE.ai API 配置（必需 - 视频生成）
# ==============================================
KIE_API_BASE_URL=https://api.kie.ai
KIE_API_KEY=your_kie_api_key
```

### 🔐 支付相关（如果使用 Creem Payment）

**⚠️ 重要**：生产环境必须使用**生产密钥**（`pk_live_` 和 `whsec_live_`），不能使用测试密钥！

```bash
# ==============================================
# Creem Payment 配置（生产环境）
# ==============================================
# ⚠️ 必须使用生产密钥（pk_live_ 开头）
CREEM_API_KEY=pk_live_xxxxxxxxxxxxx
CREEM_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxx

# Creem 产品 ID（从 Creem Dashboard 获取实际值）
NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_V2_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_V2_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PACK_STARTER_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PACK_CREATOR_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PACK_DEV_ID=prod_xxxxx
```

### 🔑 认证相关（如果使用 Google OAuth）

```bash
# ==============================================
# Google OAuth 配置（可选）
# ==============================================
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ⚠️ 注意：在 Google Cloud Console 中配置授权重定向 URI：
# https://your-project.supabase.co/auth/v1/callback
```

### 📦 存储相关（如果使用 Cloudflare R2）

```bash
# ==============================================
# Cloudflare R2 存储配置（可选）
# ==============================================
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

### 🔍 SEO 验证（可选）

```bash
# ==============================================
# 搜索引擎验证（SEO）
# ==============================================
GOOGLE_SITE_VERIFICATION=your_google_verification_code
BING_VERIFICATION_CODE=your_bing_verification_code
YANDEX_VERIFICATION_CODE=your_yandex_verification_code
```

### 📊 分析工具（可选）

```bash
# ==============================================
# 分析与行为记录
# ==============================================
NEXT_PUBLIC_CLARITY_PROJECT_ID=your_clarity_project_id
```

### 🤖 AI 服务（如果使用）

```bash
# ==============================================
# OpenAI 配置（如果使用）
# ==============================================
OPENAI_API_KEY=sk-your_openai_api_key
```

---

## 🚀 Vercel 配置步骤

### 1. 进入 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**

### 2. 添加环境变量

为每个变量设置：
- **Key**: 变量名（如 `NEXT_PUBLIC_SUPABASE_URL`）
- **Value**: 变量值
- **Environment**: 选择适用的环境
  - ✅ **Production** - 生产环境
  - ✅ **Preview** - 预览/分支部署（可选，可使用测试密钥）
  - ✅ **Development** - 本地开发（可选）

### 3. 环境变量分类

#### Production 环境（必须配置）

所有必需变量 + 生产密钥：

```bash
# 核心配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# KIE API
KIE_API_BASE_URL=https://api.kie.ai
KIE_API_KEY=xxx

# Creem Payment（生产密钥）
CREEM_API_KEY=pk_live_xxx
CREEM_WEBHOOK_SECRET=whsec_live_xxx

# Google OAuth（如果使用）
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

#### Preview 环境（可选）

可以使用测试密钥：

```bash
# Creem Payment（测试密钥）
CREEM_API_KEY=pk_test_xxx
CREEM_WEBHOOK_SECRET=whsec_test_xxx
```

---

## ⚠️ 重要注意事项

### 1. 密钥安全

- ✅ **永远不要**将 `SUPABASE_SERVICE_ROLE_KEY` 提交到 Git
- ✅ **永远不要**在生产环境使用测试密钥（`pk_test_`）
- ✅ 使用 Vercel 的环境变量功能，不要硬编码密钥

### 2. NEXT_PUBLIC_ 前缀

- `NEXT_PUBLIC_*` 开头的变量会**暴露到客户端**（浏览器）
- 只在这些变量中填入**公开安全**的密钥（如 `anon key`）
- **不要**将 `SUPABASE_SERVICE_ROLE_KEY` 设置为 `NEXT_PUBLIC_*`

### 3. 环境区分

- **开发环境**（本地）：使用 `.env.local`，可以使用测试密钥
- **预览环境**（Vercel Preview）：可以使用测试密钥
- **生产环境**（Vercel Production）：**必须**使用生产密钥

### 4. Creem Payment 密钥格式

- **测试密钥**：`pk_test_xxxxxxxxxxxxx` / `whsec_test_xxxxxxxxxxxxx`
- **生产密钥**：`pk_live_xxxxxxxxxxxxx` / `whsec_live_xxxxxxxxxxxxx`
- 生产环境使用测试密钥会导致支付功能失败

---

## 🔍 验证配置

### 方法 1: 使用检查脚本

```bash
# 本地检查（需要先设置环境变量）
node scripts/check-supabase-config.js
```

### 方法 2: 部署后检查

1. 部署到 Vercel
2. 查看部署日志，确认没有环境变量错误
3. 测试核心功能：
   - 用户注册/登录
   - 视频生成
   - 支付流程（如果已配置）

### 方法 3: 在代码中验证

应用启动时会检查必需的环境变量，如果缺失会抛出错误。

---

## 📝 完整配置示例

### 最小配置（仅核心功能）

```bash
NEXT_PUBLIC_APP_URL=https://veo4video.io
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
KIE_API_BASE_URL=https://api.kie.ai
KIE_API_KEY=xxx
```

### 完整配置（包含所有功能）

参考 `env.example` 文件，但确保：
- 使用生产域名
- 使用生产密钥
- 填写所有实际的产品 ID

---

## 🆘 常见问题

### Q: 如何知道哪些变量是必需的？

**A**: 查看应用启动日志，如果缺少必需变量会报错。核心必需变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KIE_API_KEY`

### Q: 生产环境可以使用测试密钥吗？

**A**: ❌ **不可以**。Creem Payment 的生产环境必须使用生产密钥（`pk_live_`），否则支付功能会失败。

### Q: 如何获取生产密钥？

**A**: 
- **Supabase**: Dashboard → Settings → API
- **Creem**: Dashboard → Settings → API Keys（切换到生产模式）
- **Google OAuth**: Google Cloud Console → APIs & Services → Credentials

### Q: 环境变量更新后需要重新部署吗？

**A**: ✅ **是的**。在 Vercel 中更新环境变量后，需要重新部署才能生效。

---

## 📚 相关文档

- [Supabase 配置指南](./SUPABASE_SETUP.md)
- [Creem Payment 集成](./CREEM_PAYMENT_INTEGRATION.md)
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)
