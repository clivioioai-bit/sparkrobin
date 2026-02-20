# 多语言翻译指南

本项目已添加简体中文（zh-CN）和德语（de）支持。翻译文件位于 `messages/` 目录。

## 当前状态

✅ **已完成：**
- 更新了 `i18n/routing.ts`，添加了 `zh-CN` 和 `de` 到支持的语言列表
- 创建了 `messages/zh-CN.json` 和 `messages/de.json` 文件结构

⚠️ **待完成：**
- 将英文内容翻译为简体中文和德语

## 翻译方法

### 方法 1: 使用 Google Cloud Translation API（推荐）

参考文档: https://docs.cloud.google.com/translate/docs/reference/rest

#### 步骤 1: 安装依赖

```bash
pip install google-cloud-translate
```

#### 步骤 2: 设置认证

**选项 A: 使用服务账号密钥文件**

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/credentials.json"
```

**选项 B: 使用 gcloud CLI**

```bash
gcloud auth application-default login
```

#### 步骤 3: 启用 Translation API

在 Google Cloud Console 中启用 Cloud Translation API：
1. 访问 https://console.cloud.google.com/
2. 选择或创建项目
3. 启用 "Cloud Translation API"

#### 步骤 4: 运行翻译脚本

```bash
python scripts/translate_with_google.py
```

脚本会自动：
- 读取 `messages/en.json`
- 翻译为简体中文并保存到 `messages/zh-CN.json`
- 翻译为德语并保存到 `messages/de.json`

### 方法 2: 手动翻译

1. 打开 `messages/zh-CN.json` 和 `messages/de.json`
2. 参考 `messages/ja.json`（日文翻译）的风格
3. 逐项翻译英文内容

### 方法 3: 使用其他翻译服务

你可以修改 `scripts/translate_with_google.py` 来使用其他翻译 API：
- DeepL API
- Azure Translator
- AWS Translate
- 百度翻译 API
- 有道翻译 API

## 文件结构

```
messages/
├── en.json      # 英文（源文件）
├── ja.json      # 日文（已完整翻译，可作为参考）
├── zh-CN.json   # 简体中文（待翻译）
└── de.json      # 德语（待翻译）
```

## 注意事项

1. **保持 JSON 结构一致**：翻译时不要改变 JSON 的键名，只翻译值
2. **保留占位符**：如 `{count}`, `{email}` 等占位符需要保留
3. **HTML 标签**：如 `<strong>`, `<br/>` 等 HTML 标签需要保留
4. **品牌名称**：如 "Sora3" 等品牌名称通常不需要翻译

## 验证翻译

翻译完成后，可以：

1. **检查 JSON 格式**：
```bash
python -m json.tool messages/zh-CN.json > /dev/null && echo "✅ JSON 格式正确"
python -m json.tool messages/de.json > /dev/null && echo "✅ JSON 格式正确"
```

2. **在应用中测试**：
   - 启动开发服务器：`npm run dev`
   - 访问 `http://localhost:3000/zh-CN` 查看简体中文版本
   - 访问 `http://localhost:3000/de` 查看德语版本

## 成本估算

使用 Google Cloud Translation API：
- 前 500,000 字符/月：免费
- 超过部分：$20/百万字符

对于本项目（约 883 行，估计 50,000-100,000 字符），通常在免费额度内。

## 故障排除

### 问题：认证失败

**解决方案：**
```bash
# 检查认证
gcloud auth list

# 重新认证
gcloud auth application-default login
```

### 问题：API 未启用

**解决方案：**
1. 访问 Google Cloud Console
2. 启用 "Cloud Translation API"
3. 等待几分钟让 API 生效

### 问题：翻译质量不佳

**解决方案：**
1. 使用 Google Cloud Translation API 的高级版本（需要付费）
2. 手动审核和编辑关键部分的翻译
3. 参考日文翻译的风格进行调整

## 相关链接

- [Google Cloud Translation API 文档](https://docs.cloud.google.com/translate/docs/reference/rest)
- [next-intl 文档](https://next-intl-docs.vercel.app/)
- [项目路由配置](../i18n/routing.ts)


