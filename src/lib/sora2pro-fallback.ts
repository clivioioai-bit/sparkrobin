/**
 * Sora2 Pro API Fallback Utility
 *
 * Provides automatic fallback to apimart's sora2pro API when KIE's sora2-pro models fail.
 * This improves generation success rates for pro users.
 */

export type Sora2ProModel = 'sora-2-pro-text-to-video' | 'sora-2-pro-image-to-video';

export interface Sora2ProCallResult {
  success: boolean;
  taskId?: string;
  provider: 'kie' | 'apimart';
  fallbackUsed: boolean;
  attemptCount: number;
  error?: string;
  errorStatusCode?: number;
  responseData?: any;
}

export interface Sora2ProRequestBody {
  model: Sora2ProModel;
  input: {
    prompt: string;
    aspect_ratio?: string;
    n_frames?: string;
    remove_watermark?: boolean;
    image_urls?: string[];
    size?: string;
  };
}

/**
 * Determines if a model should have apimart fallback support
 */
function shouldUseApimartFallback(model: string): boolean {
  return model === 'sora-2-pro-text-to-video' || model === 'sora-2-pro-image-to-video';
}

/**
 * Extracts taskId from KIE API response
 */
function extractKieTaskId(response: any): string | undefined {
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
 * Extracts taskId from apimart API response
 */
function extractApimartTaskId(response: any): string | undefined {
  if (!response || typeof response !== 'object') return undefined;

  if (response.data && Array.isArray(response.data) && response.data.length > 0) {
    const taskData = response.data[0];
    if (taskData.task_id && typeof taskData.task_id === 'string') {
      return taskData.task_id.trim();
    }
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
 * Checks if apimart API response indicates success
 */
function isApimartSuccess(response: any): boolean {
  if (!response || typeof response !== 'object') return false;
  return response.code === 200;
}

/**
 * Extracts status code from response
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
 * Infers HTTP status code from error code
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
  requestBody: Sora2ProRequestBody
): Promise<{ success: boolean; taskId?: string; error?: string; errorStatusCode?: number; responseData?: any }> {
  try {
    console.log(`[Sora2Pro Fallback] Calling KIE API with model: ${requestBody.model}`);
    console.log(`[Sora2Pro Fallback] Request body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[Sora2Pro Fallback] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Sora2Pro Fallback] API error response:`, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        errorStatusCode: response.status,
      };
    }

    const responseData = await response.json();
    console.log(`[Sora2Pro Fallback] Response data:`, JSON.stringify(responseData, null, 2));

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

    const taskId = extractKieTaskId(responseData);
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
    console.error(`[Sora2Pro Fallback] Fetch error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Calls apimart API with a single request
 */
async function callApimartApi(
  apiKey: string,
  requestBody: Sora2ProRequestBody
): Promise<{ success: boolean; taskId?: string; error?: string; errorStatusCode?: number; responseData?: any }> {
  try {
    console.log(`[Sora2Pro Fallback] Calling apimart API with model: sora-2-pro`);

    const apimartBody: any = {
      model: 'sora-2-pro',
      prompt: requestBody.input.prompt,
    };

    if (requestBody.input.n_frames) {
      apimartBody.duration = parseInt(requestBody.input.n_frames, 10);
    }

    if (requestBody.input.aspect_ratio) {
      if (requestBody.input.aspect_ratio === 'landscape') {
        apimartBody.aspect_ratio = '16:9';
      } else if (requestBody.input.aspect_ratio === 'portrait') {
        apimartBody.aspect_ratio = '9:16';
      } else {
        apimartBody.aspect_ratio = requestBody.input.aspect_ratio;
      }
    }

    if (requestBody.input.image_urls && requestBody.input.image_urls.length > 0) {
      apimartBody.image_urls = requestBody.input.image_urls;
    }

    console.log(`[Sora2Pro Fallback] apimart request body:`, JSON.stringify(apimartBody, null, 2));

    const response = await fetch('https://api.apimart.ai/v1/videos/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(apimartBody),
    });

    console.log(`[Sora2Pro Fallback] apimart response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Sora2Pro Fallback] apimart error response:`, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        errorStatusCode: response.status,
      };
    }

    const responseData = await response.json();
    console.log(`[Sora2Pro Fallback] apimart response data:`, JSON.stringify(responseData, null, 2));

    if (!isApimartSuccess(responseData)) {
      const statusCode = extractStatusCode(responseData);
      return {
        success: false,
        error: responseData.error?.message || 'Unknown error',
        errorStatusCode: inferErrorStatus(statusCode),
        responseData,
      };
    }

    const taskId = extractApimartTaskId(responseData);
    if (!taskId) {
      return {
        success: false,
        error: 'Missing task_id in apimart response',
        responseData,
      };
    }

    return {
      success: true,
      taskId,
      responseData,
    };

  } catch (error) {
    console.error(`[Sora2Pro Fallback] apimart fetch error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Calls sora2-pro API with automatic fallback to apimart on failure
 */
export async function callSora2ProWithFallback(
  kieApiUrl: string,
  kieApiKey: string,
  apimartApiKey: string,
  requestBody: Sora2ProRequestBody
): Promise<Sora2ProCallResult> {
  const originalModel = requestBody.model;
  let attemptCount = 0;

  console.log(`[Sora2Pro Fallback] Starting generation with model: ${originalModel}`);

  if (!shouldUseApimartFallback(originalModel)) {
    console.log(`[Sora2Pro Fallback] Model ${originalModel} does not support apimart fallback`);
    return {
      success: false,
      provider: 'kie',
      fallbackUsed: false,
      attemptCount: 0,
      error: 'Model does not support apimart fallback',
    };
  }

  attemptCount++;
  console.log(`[Sora2Pro Fallback] Attempt ${attemptCount}: Using KIE API`);

  const firstAttempt = await callKieApi(kieApiUrl, kieApiKey, requestBody);

  if (firstAttempt.success && firstAttempt.taskId) {
    console.log(`[Sora2Pro Fallback] Success with KIE API`);
    return {
      success: true,
      taskId: firstAttempt.taskId,
      provider: 'kie',
      fallbackUsed: false,
      attemptCount,
      responseData: firstAttempt.responseData,
    };
  }

  console.log(`[Sora2Pro Fallback] KIE API failed: ${firstAttempt.error}`);

  if (isClientError(firstAttempt.errorStatusCode)) {
    console.log(`[Sora2Pro Fallback] Client error detected (${firstAttempt.errorStatusCode}), skipping fallback`);
    return {
      success: false,
      provider: 'kie',
      fallbackUsed: false,
      attemptCount,
      error: firstAttempt.error,
      errorStatusCode: firstAttempt.errorStatusCode,
    };
  }

  attemptCount++;
  console.log(`[Sora2Pro Fallback] Attempt ${attemptCount}: Falling back to apimart API`);

  const secondAttempt = await callApimartApi(apimartApiKey, requestBody);

  if (secondAttempt.success && secondAttempt.taskId) {
    console.log(`[Sora2Pro Fallback] Success with apimart API`);
    return {
      success: true,
      taskId: secondAttempt.taskId,
      provider: 'apimart',
      fallbackUsed: true,
      attemptCount,
      responseData: secondAttempt.responseData,
    };
  }

  console.log(`[Sora2Pro Fallback] apimart API also failed: ${secondAttempt.error}`);

  return {
    success: false,
    provider: 'apimart',
    fallbackUsed: true,
    attemptCount,
    error: `Both KIE and apimart APIs failed. KIE: ${firstAttempt.error}, apimart: ${secondAttempt.error}`,
    errorStatusCode: secondAttempt.errorStatusCode || firstAttempt.errorStatusCode,
  };
}
