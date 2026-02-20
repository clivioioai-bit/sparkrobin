export type KieModel =
  | 'sora-2-text-to-video'
  | 'sora-2-image-to-video'
  | 'sora-2-text-to-video-stable'
  | 'sora-2-image-to-video-stable'
  | 'sora-2-pro-text-to-video'
  | 'sora-2-pro-image-to-video'
  | 'sora-2-pro-storyboard'
  | 'wan/2-6-text-to-video'
  | 'wan/2-6-image-to-video';

// Map frontend model name to KIE API model name
// Frontend uses sora3/sora3-pro branding, backend uses sora-2 KIE API model names
export const mapModelToKie = (
  model?: 'sora3' | 'sora3-pro' | 'sora2' | 'sora2-pro',
  isImageToVideo: boolean = false
): KieModel => {
  if (model === 'sora2-pro' || model === 'sora3-pro') {
    return isImageToVideo ? 'sora-2-pro-image-to-video' : 'sora-2-pro-text-to-video';
  }
  if (model === 'sora2') {
    return isImageToVideo ? 'sora-2-image-to-video' : 'sora-2-text-to-video';
  }
  // sora3 or default → stable
  return isImageToVideo ? 'sora-2-image-to-video-stable' : 'sora-2-text-to-video-stable';
};

export const mapAspectRatioToKie = (aspectRatio?: string): 'portrait' | 'landscape' => {
  if (!aspectRatio) return 'landscape';
  const normalized = aspectRatio.toLowerCase();
  if (['9:16', 'portrait', 'vertical'].includes(normalized)) return 'portrait';
  if (['16:9', 'landscape', 'horizontal'].includes(normalized)) return 'landscape';
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
    case 'generating':
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
  resultUrls?: string[];
  resultWaterMarkUrls?: string[];
  resultUrl?: string;
  mediaUrl?: string;
  resourceUrl?: string;
  videoUrl?: string;
  outputUrl?: string;
  downloadUrl?: string;
  fileUrl?: string;
  url?: string;
}

const extractUrls = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const flat = value.flatMap((item) => {
      if (typeof item === 'string') return [item];
      if (item && typeof item === 'object') {
        const candidate = (item as Record<string, unknown>).url;
        return typeof candidate === 'string' ? [candidate] : [];
      }
      return [];
    });
    return flat.length > 0 ? flat : undefined;
  }
  if (typeof value === 'string') {
    return value.trim() ? [value.trim()] : undefined;
  }
  return undefined;
};

const normalizeResultPayload = (payload: unknown): ParsedResultJson => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const result = payload as Record<string, unknown>;

  const urls = extractUrls(result.resultUrls ?? result.result_urls);
  const watermarkUrls = extractUrls(result.resultWaterMarkUrls ?? result.result_watermark_urls ?? result.resultWatermarkUrls);

  const firstUrl = urls && urls.length > 0 ? urls[0] : undefined;
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
    resultUrl: finalUrl ?? (typeof result.resultUrl === 'string' ? result.resultUrl : typeof result.result_url === 'string' ? result.result_url : undefined),
    mediaUrl: finalUrl ?? (typeof result.mediaUrl === 'string' ? result.mediaUrl : typeof result.media_url === 'string' ? result.media_url : undefined),
    resourceUrl: finalUrl ?? (typeof result.resourceUrl === 'string' ? result.resourceUrl : typeof result.resource_url === 'string' ? result.resource_url : undefined),
    videoUrl: finalUrl ?? (typeof result.videoUrl === 'string' ? result.videoUrl : typeof result.video_url === 'string' ? result.video_url : undefined),
    outputUrl: finalUrl ?? (typeof result.outputUrl === 'string' ? result.outputUrl : typeof result.output_url === 'string' ? result.output_url : undefined),
    downloadUrl: finalUrl ?? (typeof result.downloadUrl === 'string' ? result.downloadUrl : typeof result.download_url === 'string' ? result.download_url : undefined),
    fileUrl: finalUrl ?? (typeof result.fileUrl === 'string' ? result.fileUrl : typeof result.file_url === 'string' ? result.file_url : undefined),
    url: finalUrl ?? (typeof result.url === 'string' ? result.url : undefined),
  };
};

/**
 * Recursively parse JSON strings, handling multiple nesting levels
 */
const parseJsonRecursively = (value: string, maxDepth: number = 5): unknown => {
  if (maxDepth <= 0) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'string') {
      const trimmed = parsed.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return parseJsonRecursively(trimmed, maxDepth - 1);
      }
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return parseJsonRecursively(trimmed, maxDepth - 1);
      }
      return trimmed;
    }
    return parsed;
  } catch {
    return value;
  }
};

export const parseResultJson = (resultJson?: string | Record<string, unknown>): ParsedResultJson => {
  if (!resultJson) return {};

  if (typeof resultJson === 'object' && !Array.isArray(resultJson)) {
    return normalizeResultPayload(resultJson);
  }

  if (typeof resultJson === 'string') {
    const trimmed = resultJson.trim();

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return {
        resultUrls: [trimmed],
        resultUrl: trimmed,
        mediaUrl: trimmed,
        resourceUrl: trimmed,
        videoUrl: trimmed,
        outputUrl: trimmed,
        downloadUrl: trimmed,
        fileUrl: trimmed,
        url: trimmed
      };
    }

    try {
      let parsed: unknown = parseJsonRecursively(trimmed);

      if (typeof parsed === 'string') {
        const nested = parsed.trim();
        if (nested.startsWith('http://') || nested.startsWith('https://')) {
          return {
            resultUrls: [nested],
            resultUrl: nested,
            mediaUrl: nested,
            resourceUrl: nested,
            videoUrl: nested,
            outputUrl: nested,
            downloadUrl: nested,
            fileUrl: nested,
            url: nested
          };
        }
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const parsedUrls = extractUrls(parsed);
        if (parsedUrls && parsedUrls.length > 0) {
          console.log('[parseResultJson] Found array format, extracted URLs:', parsedUrls);
          return {
            resultUrls: parsedUrls,
            resultUrl: parsedUrls[0],
            mediaUrl: parsedUrls[0],
            resourceUrl: parsedUrls[0],
            videoUrl: parsedUrls[0],
            outputUrl: parsedUrls[0],
            downloadUrl: parsedUrls[0],
            fileUrl: parsedUrls[0],
            url: parsedUrls[0]
          };
        }
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstElement = parsed[0];
        if (typeof firstElement === 'string' && firstElement.trim().startsWith('http')) {
          console.log('[parseResultJson] Found array with direct URL string:', firstElement);
          return {
            resultUrls: [firstElement],
            resultUrl: firstElement,
            mediaUrl: firstElement,
            resourceUrl: firstElement,
            videoUrl: firstElement,
            outputUrl: firstElement,
            downloadUrl: firstElement,
            fileUrl: firstElement,
            url: firstElement
          };
        }
      }

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
