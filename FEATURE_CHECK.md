# 新增功能检查清单

## ✅ 已实现的功能

### 1. 模型选择框
- ✅ Text-to-video 模式：支持 Sora3 和 Sora3 Pro
- ✅ Image-to-video 模式：支持 Sora3 和 Sora3 Pro（已移除 veo3）
- ✅ 未展开时只显示模型名称和图标
- ✅ 使用 `/sora favicon.png` 作为模型 logo
- ✅ 已移除 Premium 标签

### 2. Quality 选择器
- ✅ 仅在 Sora3 Pro 时显示
- ✅ 位置在 Duration 下面
- ✅ 支持 standard 和 high 两个选项
- ✅ 正确映射到 API 的 size 参数

### 3. UI 样式
- ✅ 选项按钮选中时使用深灰色（bg-gray-700）
- ✅ Generate 按钮使用深黑色（bg-black）
- ✅ 模型描述文字已更新：
  - Sora3: "OpenAI's advanced video generation model with high-quality output and precise control."
  - Sora3 Pro: "OpenAI's premium video generation model with enhanced quality, superior realism, and advanced control capabilities."

### 4. 积分计算
- ✅ Sora3: 10s = 15 credits, 15s = 20 credits
- ✅ Sora3 Pro (high): 10s = 175 credits, 15s = 325 credits
- ✅ Sora3 Pro (standard): 10s = 75 credits, 15s = 135 credits
- ✅ 在 UI 中动态显示积分成本

### 5. API 集成
- ✅ 四个 KIE 模型正确映射：
  - `sora-2-text-to-video` (Sora3 text-to-video)
  - `sora-2-pro-text-to-video` (Sora3 Pro text-to-video)
  - `sora-2-image-to-video` (Sora3 image-to-video)
  - `sora-2-pro-image-to-video` (Sora3 Pro image-to-video)
- ✅ image_urls 参数正确添加到 image-to-video 模型
- ✅ size 参数正确添加到 sora3-pro 模型

### 6. 类型定义
- ✅ Sora3Params 包含 model 和 quality 字段
- ✅ ReframeParams 包含 model 和 quality 字段
- ✅ CreateJobRequest 包含 quality 字段

### 7. 默认参数
- ✅ createDefaultSora3Params 包含 model: 'sora3'
- ✅ createDefaultReframeParams 包含 model: 'sora3'

## ⚠️ 注意事项

1. **ReframeParams 类型定义**：仍然包含 `'veo3.1'` 选项，但 UI 中已移除。这是为了保持向后兼容性，因为代码中仍有处理 veo3.1 的逻辑。

2. **Hydration 错误**：已通过将 Next.js Image 组件替换为普通 img 标签解决。

## 🔍 需要测试的场景

1. ✅ Text-to-video 模式选择 Sora3
2. ✅ Text-to-video 模式选择 Sora3 Pro
3. ✅ Text-to-video 模式选择 Sora3 Pro 并切换 quality
4. ✅ Image-to-video 模式选择 Sora3
5. ✅ Image-to-video 模式选择 Sora3 Pro
6. ✅ Image-to-video 模式选择 Sora3 Pro 并切换 quality
7. ✅ 积分计算是否正确显示
8. ✅ API 请求是否正确发送（检查网络请求）
9. ✅ 模型切换时 quality 选择器是否正确显示/隐藏
10. ✅ 按钮颜色是否正确（选中为深灰色，Generate 为深黑色）

