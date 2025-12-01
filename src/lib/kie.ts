export type KieModel = 'sora-2-text-to-video' | 'sora-2-image-to-video' | 'sora-2-pro-text-to-video' | 'sora-2-pro-image-to-video';

// Map frontend model name to KIE API model name
export const mapModelToKie = (model?: 'sora3' | 'sora3-pro', isImageToVideo: boolean = false): KieModel => {
  if (model === 'sora3-pro') {
    return isImageToVideo ? 'sora-2-pro-image-to-video' : 'sora-2-pro-text-to-video';
  }
  return isImageToVideo ? 'sora-2-image-to-video' : 'sora-2-text-to-video';
};

export const mapAspectRatioToKie = (aspectRatio?: string): 'portrait' | 'landscape' => {
  if (!aspectRatio) return 'landscape';
  const normalized = aspectRatio.toLowerCase();
  if (['9:16', 'portrait', 'vertical'].includes(normalized)) return 'portrait';
  if (['16:9', 'landscape', 'horizontal'].includes(normalized)) return 'landscape';
  // 1:1 或其他自定义比例先默认归类为 landscape，后续若 API 支持可扩展
  return 'landscape';
};

export const mapKieStateToJobStatus = (state?: string): 'pending' | 'processing' | 'completed' | 'failed' => {
  const normalized = state?.toLowerCase();
  switch (normalized) {
    case 'waiting':
    case 'queued':
    case 'queue':
    case 'running':
    case 'processing':
    case 'generating':  // ← 添加 generating 状态
      return 'processing';
    case 'success':
    case 'succeeded':
    case 'completed':
    case 'complete':
    case 'done':
      return 'completed';
    case 'fail':
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'pending';
  }
};

interface ParsedResultJson {
  resultUrls?: string[]; // 无水印版本（优先使用）
  resultWaterMarkUrls?: string[]; // 带水印版本（备选）
  resultUrl?: string;
  mediaUrl?: string;
  resourceUrl?: string;
  // KIE API 可能返回的其他字段
  videoUrl?: string;
  outputUrl?: string;
  downloadUrl?: string;
  fileUrl?: string;
  url?: string;
}

const normalizeResultPayload = (payload: unknown): ParsedResultJson => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const result = payload as Record<string, unknown>;
  
  // 优先提取无水印版本
  const urls = Array.isArray(result.resultUrls)
    ? result.resultUrls.filter((value): value is string => typeof value === 'string')
    : undefined;
  
  // 备选：带水印版本
  const watermarkUrls = Array.isArray(result.resultWaterMarkUrls)
    ? result.resultWaterMarkUrls.filter((value): value is string => typeof value === 'string')
    : undefined;

  // 优先使用 resultUrls（无水印版本）的第一个 URL
  const firstUrl = urls && urls.length > 0 ? urls[0] : undefined;
  // 如果没有无水印版本，使用带水印版本
  const fallbackUrl = !firstUrl && watermarkUrls && watermarkUrls.length > 0 
    ? watermarkUrls[0] 
    : undefined;
  const finalUrl = firstUrl ?? fallbackUrl;

  console.log('[normalizeResultPayload] URL extraction:', {
    hasResultUrls: !!urls && urls.length > 0,
    resultUrlsCount: urls?.length,
    hasWatermarkUrls: !!watermarkUrls && watermarkUrls.length > 0,
    watermarkUrlsCount: watermarkUrls?.length,
    usingUrl: finalUrl ? finalUrl.substring(0, 80) + '...' : 'N/A',
    isWatermark: !!fallbackUrl && !firstUrl
  });

  return {
    resultUrls: urls,
    resultWaterMarkUrls: watermarkUrls,
    // 优先使用 resultUrls，否则使用 resultWaterMarkUrls
    resultUrl: finalUrl ?? (typeof result.resultUrl === 'string' ? result.resultUrl : undefined),
    mediaUrl: finalUrl ?? (typeof result.mediaUrl === 'string' ? result.mediaUrl : undefined),
    resourceUrl: finalUrl ?? (typeof result.resourceUrl === 'string' ? result.resourceUrl : undefined),
    videoUrl: finalUrl ?? (typeof result.videoUrl === 'string' ? result.videoUrl : undefined),
    outputUrl: finalUrl ?? (typeof result.outputUrl === 'string' ? result.outputUrl : undefined),
    downloadUrl: finalUrl ?? (typeof result.downloadUrl === 'string' ? result.downloadUrl : undefined),
    fileUrl: finalUrl ?? (typeof result.fileUrl === 'string' ? result.fileUrl : undefined),
    url: finalUrl ?? (typeof result.url === 'string' ? result.url : undefined),
  };
};

export const parseResultJson = (resultJson?: string | Record<string, unknown>): ParsedResultJson => {
  if (!resultJson) return {};

  // 如果已经是对象，直接处理
  if (typeof resultJson === 'object' && !Array.isArray(resultJson)) {
    return normalizeResultPayload(resultJson);
  }

  // 如果是字符串，需要先解析
  if (typeof resultJson === 'string') {
    try {
      const parsed = JSON.parse(resultJson);
      
      // 如果解析结果是数组，直接返回第一个元素作为resultUrls
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return {
          resultUrls: parsed.filter((value): value is string => typeof value === 'string'),
          resultUrl: parsed[0],
          mediaUrl: parsed[0],
          resourceUrl: parsed[0],
          videoUrl: parsed[0],
          outputUrl: parsed[0],
          downloadUrl: parsed[0],
          fileUrl: parsed[0],
          url: parsed[0]
        };
      }
      
      // 如果解析结果是对象，使用 normalizeResultPayload 处理
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return normalizeResultPayload(parsed);
      }
    } catch (err) {
      console.error('[parseResultJson] Failed to parse JSON string:', err, 'Input:', resultJson?.substring(0, 200));
      return {};
    }
  }
  
  return {};
};
