/**
 * KIE API Fallback Utility
 *
 * Provides automatic fallback to stable models when regular Sora2 models fail.
 * This improves generation success rates while maintaining optimal performance.
 */

export type KieModel =
  | 'sora-2-text-to-video'
  | 'sora-2-image-to-video'
  | 'sora-2-stable-text-to-video'
  | 'sora-2-stable-image-to-video'
  | 'sora-2-pro-text-to-video'
  | 'sora-2-pro-image-to-video'
  // Legacy aliases kept for backward compatibility with historical records
  | 'sora-2-text-to-video-stable'
  | 'sora-2-image-to-video-stable'
  | 'wan/2-5-text-to-video'
  | 'wan/2-5-image-to-video';

export type KieApiVersion = 'regular' | 'stable' | 'pro' | 'wan2.5';

export interface KieCallResult {
  success: boolean;
  taskId?: string;
  apiVersion: KieApiVersion;
  fallbackUsed: boolean;
  attemptCount: number;
  error?: string;
  errorStatusCode?: number;
  responseData?: any;
}

export interface KieRequestBody {
  model: KieModel;
  input: {
    prompt: string;
    aspect_ratio?: string;
    n_frames?: string;
    remove_watermark?: boolean;
    image_urls?: string[];
    image_url?: string;
    size?: string;
    duration?: string;
    resolution?: string;
    multi_shots?: boolean;
    negative_prompt?: string;
    enable_prompt_expansion?: boolean;
    seed?: number;
  };
}

/**
 * Maps regular models to their wan2.5 fallback counterparts
 */
function getStableModel(model: KieModel): KieModel | null {
  const stableMapping: Record<string, KieModel> = {
    'sora-2-text-to-video': 'wan/2-5-text-to-video',
    'sora-2-image-to-video': 'wan/2-5-image-to-video',
    'sora-2-stable-text-to-video': 'wan/2-5-text-to-video',
    'sora-2-stable-image-to-video': 'wan/2-5-image-to-video',
    'sora-2-text-to-video-stable': 'wan/2-5-text-to-video',
    'sora-2-image-to-video-stable': 'wan/2-5-image-to-video',
  };

  return stableMapping[model] || null;
}

/**
 * Determines if a model should have fallback support
 */
function shouldUseFallback(model: KieModel): boolean {
  if (model.includes('pro')) {
    return false;
  }

  if (model.includes('wan/2-5')) {
    return false;
  }

  return model === 'sora-2-text-to-video' ||
         model === 'sora-2-image-to-video' ||
         model === 'sora-2-stable-text-to-video' ||
         model === 'sora-2-stable-image-to-video' ||
         model === 'sora-2-text-to-video-stable' ||
         model === 'sora-2-image-to-video-stable';
}

/**
 * Determines the API version from a model name
 */
function getApiVersion(model: KieModel): KieApiVersion {
  if (model.includes('pro')) {
    return 'pro';
  }
  if (model.includes('wan/2-5')) {
    return 'wan2.5';
  }
  if (model.includes('stable')) {
    return 'stable';
  }
  return 'regular';
}

/**
 * Extracts taskId from KIE API response
 */
function extractTaskId(response: any): string | undefined {
  if (!response || typeof response !== 'object') return undefined;
  const payload = response as Record<string, unknown>;

  const data = payload.data;
  if (data && typeof data === 'object') {
    const taskPayload = data as Record<string, unknown>;
    const candidate =
      taskPayload.taskId ??
      taskPayload.task_id ??
      taskPayload.id ??
      taskPayload.jobId ??
      taskPayload.job_id;
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  const rootCandidate =
    payload.taskId ??
    payload.task_id ??
    payload.id ??
    payload.jobId ??
    payload.job_id;

  if (typeof rootCandidate === 'string' && rootCandidate.trim().length > 0) {
    return rootCandidate.trim();
  }

  return undefined;
}

/**
 * Checks if KIE API response indicates success
 */
function isKieSuccess(response: any): boolean {
  if (!response || typeof response !== 'object') return false;

  const code = extractStatusCode(response);
  if (typeof code === 'number') {
    if (code === 200 || code === 0) return true;
    if (code >= 200 && code < 300) return true;
  }

  if (response.success === true) return true;
  if (typeof response.msg === 'string' && response.msg.trim().toLowerCase() === 'success') return true;

  return false;
}

/**
 * Extracts status code from KIE API response
 */
function extractStatusCode(response: unknown): number | null {
  if (!response || typeof response !== 'object') return null;
  const payload = response as Record<string, unknown>;
  const raw =
    payload.code ??
    payload.statusCode ??
    payload.status_code ??
    payload.status ??
    payload.state;

  if (typeof raw === 'number') {
    return raw;
  }

  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw.trim(), 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

/**
 * Infers HTTP status code from KIE error code
 */
function inferErrorStatus(code: number | null): number {
  if (typeof code === 'number') {
    if (code >= 100 && code <= 599) return code;
    const parsed = Number.parseInt(String(code), 10);
    if (!Number.isNaN(parsed) && parsed >= 100 && parsed <= 599) return parsed;
  }
  return 502;
}

/**
 * Determines if an error is a client error (4xx) that shouldn't trigger fallback
 */
function isClientError(statusCode: number | null): boolean {
  if (!statusCode) return false;
  return statusCode >= 400 && statusCode < 500;
}

/**
 * Calls KIE API with a single request
 */
async function callKieApi(
  apiUrl: string,
  apiKey: string,
  requestBody: KieRequestBody
): Promise<{ success: boolean; taskId?: string; error?: string; errorStatusCode?: number; responseData?: any }> {
  try {
    console.log(`[KIE Fallback] Calling KIE API with model: ${requestBody.model}`);
    console.log(`[KIE Fallback] Request body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[KIE Fallback] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[KIE Fallback] API error response:`, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        errorStatusCode: response.status,
      };
    }

    const responseData = await response.json();
    console.log(`[KIE Fallback] Response data:`, JSON.stringify(responseData, null, 2));

    const statusCode = extractStatusCode(responseData);

    if (!isKieSuccess(responseData)) {
      const inferredStatus = inferErrorStatus(statusCode);
      return {
        success: false,
        error: responseData.msg || responseData.message || 'Unknown error',
        errorStatusCode: inferredStatus,
        responseData,
      };
    }

    const taskId = extractTaskId(responseData);
    if (!taskId) {
      return {
        success: false,
        error: 'Missing taskId in response',
        responseData,
      };
    }

    return {
      success: true,
      taskId,
      responseData,
    };

  } catch (error) {
    console.error(`[KIE Fallback] Fetch error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Calls KIE API with automatic fallback to stable model on failure
 */
export async function callKieWithFallback(
  apiUrl: string,
  apiKey: string,
  requestBody: KieRequestBody
): Promise<KieCallResult> {
  const originalModel = requestBody.model;
  let attemptCount = 0;

  console.log(`[KIE Fallback] Starting generation with model: ${originalModel}`);

  attemptCount++;
  console.log(`[KIE Fallback] Attempt ${attemptCount}: Using ${originalModel}`);

  const firstAttempt = await callKieApi(apiUrl, apiKey, requestBody);

  if (firstAttempt.success && firstAttempt.taskId) {
    console.log(`[KIE Fallback] Success with model: ${originalModel}`);
    return {
      success: true,
      taskId: firstAttempt.taskId,
      apiVersion: getApiVersion(originalModel),
      fallbackUsed: false,
      attemptCount,
      responseData: firstAttempt.responseData,
    };
  }

  console.log(`[KIE Fallback] First attempt failed: ${firstAttempt.error}`);

  if (isClientError(firstAttempt.errorStatusCode)) {
    console.log(`[KIE Fallback] Client error detected (${firstAttempt.errorStatusCode}), skipping fallback`);
    return {
      success: false,
      apiVersion: getApiVersion(originalModel),
      fallbackUsed: false,
      attemptCount,
      error: firstAttempt.error,
      errorStatusCode: firstAttempt.errorStatusCode,
    };
  }

  if (!shouldUseFallback(originalModel)) {
    console.log(`[KIE Fallback] No fallback available for ${originalModel}`);
    return {
      success: false,
      apiVersion: getApiVersion(originalModel),
      fallbackUsed: false,
      attemptCount,
      error: firstAttempt.error,
      errorStatusCode: firstAttempt.errorStatusCode,
    };
  }

  const stableModel = getStableModel(originalModel);
  if (!stableModel) {
    console.log(`[KIE Fallback] No wan2.5 model mapping found for ${originalModel}`);
    return {
      success: false,
      apiVersion: 'regular',
      fallbackUsed: false,
      attemptCount,
      error: firstAttempt.error,
    };
  }

  attemptCount++;
  console.log(`[KIE Fallback] Attempt ${attemptCount}: Falling back to ${stableModel}`);

  const fallbackRequestBody: KieRequestBody = {
    ...requestBody,
    model: stableModel,
    input: {
      ...requestBody.input,
      aspect_ratio: requestBody.input.aspect_ratio === 'landscape' ? '16:9' :
                    requestBody.input.aspect_ratio === 'portrait' ? '9:16' :
                    requestBody.input.aspect_ratio || '16:9',
      duration: requestBody.input.n_frames === '15' ? '10' : '10',
      resolution: '1080p',
      ...(requestBody.input.image_urls && requestBody.input.image_urls.length > 0
        ? { image_url: requestBody.input.image_urls[0] }
        : {}),
      n_frames: undefined,
      remove_watermark: undefined,
      image_urls: undefined,
      size: undefined,
      multi_shots: undefined,
    },
  };

  Object.keys(fallbackRequestBody.input).forEach(key => {
    if (fallbackRequestBody.input[key as keyof typeof fallbackRequestBody.input] === undefined) {
      delete fallbackRequestBody.input[key as keyof typeof fallbackRequestBody.input];
    }
  });

  const secondAttempt = await callKieApi(apiUrl, apiKey, fallbackRequestBody);

  if (secondAttempt.success && secondAttempt.taskId) {
    console.log(`[KIE Fallback] Success with wan2.5 model: ${stableModel}`);
    return {
      success: true,
      taskId: secondAttempt.taskId,
      apiVersion: 'wan2.5',
      fallbackUsed: true,
      attemptCount,
      responseData: secondAttempt.responseData,
    };
  }

  console.log(`[KIE Fallback] Wan2.5 model also failed: ${secondAttempt.error}`);

  return {
    success: false,
    apiVersion: 'wan2.5',
    fallbackUsed: true,
    attemptCount,
    error: `Both regular and wan2.5 models failed. Regular: ${firstAttempt.error}, Wan2.5: ${secondAttempt.error}`,
    errorStatusCode: secondAttempt.errorStatusCode || firstAttempt.errorStatusCode,
  };
}
