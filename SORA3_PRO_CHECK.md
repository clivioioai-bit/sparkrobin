# Sora3 Pro 功能检查报告

## ✅ 已修复的问题

### 1. 默认值问题（已修复）
- **Text-to-video**: 默认 `size = "high"` ✅（符合 API 文档第338行）
- **Image-to-video**: 默认 `size = "standard"` ✅（符合 API 文档第112行）
- **修复位置**:
  - `app/api/kie/generate/route.ts`: 根据模型类型设置正确的默认值
  - `src/components/generate/modes/ReframeMode.tsx`: image-to-video 默认使用 standard

### 2. 参数名称 ✅
- 使用 `size` 参数（正确，符合 API 文档）
- 前端使用 `quality`，后端映射为 `size`

### 3. image_urls 参数 ✅
- 正确使用数组格式：`image_urls: [image_url]`
- 仅在 image-to-video 模型时添加
- 检查逻辑：`kieModel === 'sora-2-image-to-video' || kieModel === 'sora-2-pro-image-to-video'`

### 4. Storage 处理 ✅
- **上传阶段**: 用户上传的图片文件通过 `/api/kie/upload` 上传到 Supabase Storage
- **API 调用**: 使用公开 URL 传递给 KIE API 的 `image_urls` 参数
- **结果存储**: 视频结果 URL 从 KIE API 返回，存储在 `video_jobs` 表的 `video_url` 字段
- **无需额外处理**: KIE API 返回的 URL 是公开可访问的，不需要额外的 storage 操作

## 📋 API 参数对照表

### Text-to-Video (sora-2-pro-text-to-video)
| 参数 | 类型 | 必需 | 默认值 | 代码实现 |
|------|------|------|--------|----------|
| model | string | ✅ | `sora-2-pro-text-to-video` | ✅ |
| prompt | string | ✅ | - | ✅ |
| aspect_ratio | string | ❌ | `landscape` | ✅ |
| n_frames | string | ❌ | `10` | ✅ |
| size | string | ❌ | `high` | ✅ |
| remove_watermark | boolean | ❌ | `true` | ✅ |

### Image-to-Video (sora-2-pro-image-to-video)
| 参数 | 类型 | 必需 | 默认值 | 代码实现 |
|------|------|------|--------|----------|
| model | string | ✅ | `sora-2-pro-image-to-video` | ✅ |
| prompt | string | ✅ | - | ✅ |
| image_urls | array | ✅ | `[]` | ✅ |
| aspect_ratio | string | ❌ | `landscape` | ✅ |
| n_frames | string | ❌ | `10` | ✅ |
| size | string | ❌ | `standard` | ✅ |
| remove_watermark | boolean | ❌ | `true` | ✅ |

## 🔍 代码检查点

### 1. 模型映射 ✅
```typescript
// app/api/kie/generate/route.ts
if (model === 'sora3-pro-image-to-video') {
  kieModel = 'sora-2-pro-image-to-video';
} else if (model === 'image-to-video') {
  kieModel = 'sora-2-image-to-video';
} else if (model === 'sora3-pro') {
  kieModel = 'sora-2-pro-text-to-video';
} else if (model === 'text-to-video' || model === 'sora3' || !model) {
  kieModel = 'sora-2-text-to-video';
}
```

### 2. size 参数设置 ✅
```typescript
// 根据模型类型和 quality 设置 size
if (kieModel === 'sora-2-pro-text-to-video' || kieModel === 'sora-2-pro-image-to-video') {
  if (quality === 'standard') {
    requestBody.input.size = 'standard';
  } else if (quality === 'high') {
    requestBody.input.size = 'high';
  } else {
    // 未指定时使用默认值
    if (kieModel === 'sora-2-pro-text-to-video') {
      requestBody.input.size = 'high'; // text-to-video 默认
    } else {
      requestBody.input.size = 'standard'; // image-to-video 默认
    }
  }
}
```

### 3. image_urls 处理 ✅
```typescript
// 仅在 image-to-video 模型时添加
if ((kieModel === 'sora-2-image-to-video' || kieModel === 'sora-2-pro-image-to-video') && image_url) {
  requestBody.input.image_urls = [image_url];
}
```

## ✅ 验证清单

- [x] 参数名称正确（使用 `size`）
- [x] 默认值正确（text-to-video: high, image-to-video: standard）
- [x] image_urls 使用数组格式
- [x] 模型映射正确（四个模型都正确）
- [x] Storage 处理正确（上传→获取URL→传递给API）
- [x] 无 lint 错误
- [x] 代码逻辑完整

## 🎯 测试建议

1. **Text-to-video Sora3 Pro**:
   - 测试 high quality（默认）
   - 测试 standard quality
   - 验证 size 参数是否正确传递

2. **Image-to-video Sora3 Pro**:
   - 测试 standard quality（默认）
   - 测试 high quality
   - 验证 image_urls 数组是否正确传递
   - 验证 size 参数是否正确传递

3. **Storage 流程**:
   - 上传图片文件
   - 验证文件是否成功上传到 Supabase Storage
   - 验证公开 URL 是否正确传递给 KIE API
   - 验证视频结果 URL 是否正确存储

