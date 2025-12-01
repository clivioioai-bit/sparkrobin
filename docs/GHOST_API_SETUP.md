# Ghost API 配置指南

## 问题诊断

如果已经配置了 Ghost API 但仍未生效，请按以下步骤检查：

## 1. 检查环境变量

确保在 `.env.local` 文件中设置了以下变量（**不需要** `NEXT_PUBLIC_` 前缀）：

```bash
GHOST_URL=https://your-ghost-blog.com
GHOST_CONTENT_API_KEY=your_ghost_content_api_key_here
```

⚠️ **重要提示**：
- 这些是**服务端环境变量**，不需要 `NEXT_PUBLIC_` 前缀
- `GHOST_URL` 应该是完整的域名，例如：`https://blog.example.com`（**不要**包含 `/ghost` 路径）
- 不要有尾随斜杠

## 2. 获取 Ghost Content API Key

1. 登录 Ghost Admin 后台
2. 进入 **Settings** → **Integrations**
3. 点击 **Add custom integration**
4. 创建新的集成并复制 **Content API Key**

## 3. 运行诊断脚本

```bash
npx tsx scripts/check-ghost-config.ts
```

这个脚本会检查：
- 环境变量是否正确设置
- API 连接是否正常
- 是否能获取文章列表

## 4. 清除缓存并重新构建

如果配置正确但仍未生效：

```bash
# 删除 Next.js 缓存
rm -rf .next

# 重新构建
npm run build

# 或重启开发服务器
npm run dev
```

## 5. 检查部署平台环境变量

如果部署在 Vercel、Netlify 等平台：

1. 进入平台的项目设置
2. 找到 **Environment Variables** 或 **环境变量** 设置
3. 添加以下变量：
   - `GHOST_URL`
   - `GHOST_CONTENT_API_KEY`
4. 重新部署项目

## 6. 常见问题

### 问题 1: 环境变量已设置但仍使用文件博客

**原因**：
- Next.js 缓存了旧的构建
- 环境变量名称错误（例如使用了 `NEXT_PUBLIC_GHOST_URL`）
- 环境变量文件位置错误（应该在项目根目录的 `.env.local`）

**解决方案**：
```bash
rm -rf .next
npm run build
```

### 问题 2: API 返回 401 错误

**原因**：
- API Key 不正确
- API Key 没有 Content API 权限

**解决方案**：
- 检查 Ghost Admin → Settings → Integrations
- 确认使用的是 **Content API Key**，不是 Admin API Key
- 重新生成 API Key

### 问题 3: API 返回 404 错误

**原因**：
- Ghost URL 不正确
- URL 包含了 `/ghost` 路径

**解决方案**：
- 确保 URL 格式为：`https://your-blog.com`（**不要**包含 `/ghost`）
- 检查 Ghost 实例是否正常运行

### 问题 4: 连接超时

**原因**：
- Ghost 服务器无法访问
- 网络问题
- Ghost URL 错误

**解决方案**：
- 在浏览器中访问 Ghost URL 确认可访问
- 检查防火墙设置
- 确认 Ghost 实例正在运行

## 7. 验证配置

配置成功后，访问 `/blog` 页面应该显示来自 Ghost 的文章，而不是本地文件。

在开发模式下，控制台会显示：
```
✅ Ghost API 配置已检测到
   URL: https://your-ghost-blog.com
```

## 8. 调试日志

代码会在以下情况输出日志：

- **开发模式**：配置检测结果
- **API 错误**：详细的错误信息
- **连接失败**：网络错误详情

查看日志：
- 开发模式：终端输出
- 生产模式：Vercel/平台日志

## 9. 回退机制

如果 Ghost API 配置失败或无法连接，系统会自动回退到使用本地 Markdown 文件。

要禁用回退（强制使用 Ghost）：
- 确保 Ghost API 配置正确
- 确保 Ghost 实例可访问
- 确保有已发布的文章















