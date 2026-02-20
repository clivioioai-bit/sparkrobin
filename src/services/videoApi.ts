// Real Video Generation API Service
import {
  Job,
  JobStatus,
  CreateJobRequest,
  CreateJobResponse,
} from '@/types/jobs';
import { supabase } from '@/lib/supabase';
import { parseResultJson } from '@/lib/kie';

const API_BASE = '/api/kie';

// Helper function to get auth token
const getAuthToken = async (): Promise<string> => {
  try {
    // Use the existing supabase client from the project
    let { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[getAuthToken] Error getting session:', error);
      throw new Error('Failed to get session');
    }

    // If no session or token expired, try to refresh
    if (!session?.access_token) {
      console.warn('[getAuthToken] No session or access token found, attempting to refresh...');

      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !refreshedSession?.access_token) {
        console.error('[getAuthToken] Failed to refresh session:', refreshError);
        throw new Error('User not authenticated. Please sign in again.');
      }

      session = refreshedSession;
      console.log('[getAuthToken] Session refreshed successfully');
    }

    // Check if token is about to expire (within 5 minutes)
    if (session.expires_at) {
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresAt - now < fiveMinutes) {
        console.log('[getAuthToken] Token expiring soon, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !refreshedSession?.access_token) {
          console.warn('[getAuthToken] Failed to refresh expiring token, using current token:', refreshError);
        } else {
          session = refreshedSession;
          console.log('[getAuthToken] Token refreshed proactively');
        }
      }
    }

    if (!session?.access_token) {
      console.error('[getAuthToken] No access token available after refresh attempts');
      throw new Error('User not authenticated. Please sign in again.');
    }

    return session.access_token;
  } catch (error) {
    console.error('[getAuthToken] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Provide more specific error message
    if (error instanceof Error && error.message.includes('not authenticated')) {
      throw error;
    }

    throw new Error('User not authenticated. Please sign in again.');
  }
};

export const videoApi = {
  // Upload video file and get public URL
  async uploadVideo(file: File, userId: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    let response: Response;
    try {
      response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error
        ? fetchError.message
        : 'Network error occurred';
      console.error('[videoApi.uploadVideo] Fetch error:', {
        error: fetchError,
        message: errorMessage,
        url: `${API_BASE}/upload`
      });
      throw new Error(`Network error: ${errorMessage}. Please check your internet connection and try again.`);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to upload file' }));
      // 优先显示详细错误信息
      let errorMessage = error.details || error.error || `Upload failed: ${response.status}`;

      // Handle 413 Payload Too Large with more helpful message
      if (response.status === 413 || error.code === 'PAYLOAD_TOO_LARGE') {
        errorMessage = error.details || error.error || 'File is too large. Maximum size is 4.5MB. Please compress your image or use a smaller file.';
      }

      // Include hint if available
      if (error.hint) {
        errorMessage += ` ${error.hint}`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[videoApi.uploadVideo] Upload response:', {
      has_result_url: !!data.result_url,
      has_video_url: !!data.video_url,
      has_url: !!data.url,
      response_keys: Object.keys(data),
      full_response: data
    });

    const videoUrl = (data.video_url && data.video_url.trim())
      || (data.result_url && data.result_url.trim())
      || (data.url && data.url.trim());

    if (!videoUrl) {
      console.error('[videoApi.uploadVideo] No video URL in response:', {
        response_data: data,
        response_keys: Object.keys(data),
        video_url_raw: data.video_url,
        result_url_raw: data.result_url,
        url_raw: data.url
      });
      throw new Error('Upload succeeded but no URL was returned from server. Please check your Supabase storage configuration.');
    }

    console.log('[videoApi.uploadVideo] Upload successful, returning URL:', videoUrl);
    return videoUrl;
  },

  // Create a new video generation job
  async createJob(
    request: CreateJobRequest,
    mode: 'sora3' | 'reframe' | 'veo3'
  ): Promise<CreateJobResponse> {
    const token = await getAuthToken();

    // Debug: Log all requests to see what we're getting
    console.log('[videoApi.createJob] ========== ALL REQUESTS ==========');
    console.log('[videoApi.createJob] Request:', {
      model: request.model,
      hasVeo3Params: !!request.veo3Params,
      veo3Params: request.veo3Params,
      mode: mode,
      prompt: request.prompt?.substring(0, 50) + '...',
      aspect_ratio: request.aspect_ratio,
      duration_sec: request.duration_sec
    });

    // Handle Veo3.1 API requests
    if (request.model === 'veo3.1' && request.veo3Params) {
      console.log('[Veo3.1 API] ========== STARTING VEO3.1 REQUEST ==========');

      const veo3Body: any = {
        prompt: request.prompt,
        model: request.veo3Params.model,
        generationType: request.veo3Params.generationType,
        aspect_ratio: request.aspect_ratio,
        enableTranslation: request.veo3Params.enableTranslation !== false,
      };

      if (request.veo3Params.imageUrls && request.veo3Params.imageUrls.length > 0) {
        veo3Body.imageUrls = request.veo3Params.imageUrls;
      }

      if (request.veo3Params.seeds) {
        veo3Body.seeds = request.veo3Params.seeds;
      }
      if (request.veo3Params.watermark) {
        veo3Body.watermark = request.veo3Params.watermark;
      }

      const apiUrl = `${API_BASE}/veo3/generate`;

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(veo3Body),
        });
      } catch (fetchError) {
        console.error('[Veo3.1 API] Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to Veo3.1 API. Please check your internet connection and try again.'}`);
      }

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('[Veo3.1 API] Error response:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to generate Veo3.1 video: ${response.status}`);
      }

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[Veo3.1 API] JSON parse error:', parseError);
        throw new Error('Invalid response from Veo3.1 API');
      }

      console.log('[Veo3.1 API] Response:', data);

      const taskId = data.data?.taskId || data.taskId;

      if (!taskId) {
        console.error('[Veo3.1 API] Missing taskId in response:', data);
        throw new Error('Missing taskId in Veo3.1 API response');
      }

      return {
        jobId: taskId,
        status: 'PENDING' as const,
        message: data.msg || 'success'
      };
    }

    // Determine the model: use provided model, or fallback to mode-based logic
    // Frontend uses sora3/sora3-pro branding, map to backend API model names
    let model: string;
    if (request.model) {
      const modelMap: Record<string, string> = {
        'sora3': mode === 'reframe' ? 'image-to-video' : 'text-to-video',
        'sora3-pro': mode === 'reframe' ? 'sora2-pro-image-to-video' : 'sora2-pro',
        'sora2': mode === 'reframe' ? 'sora2-image-to-video' : 'sora2-text-to-video',
        'sora2-pro': mode === 'reframe' ? 'sora2-pro-image-to-video' : 'sora2-pro',
        'veo3': 'veo3',
        'wan2.6': 'wan2.6'
      };
      model = modelMap[request.model] || request.model;
    } else {
      model = mode === 'reframe' && request.reference_image_url ? 'image-to-video' : 'text-to-video';
    }

    if (!request.prompt) {
      throw new Error('Missing required parameter: prompt');
    }
    if (!request.duration_sec) {
      throw new Error('Missing required parameter: duration_sec');
    }
    if (!request.aspect_ratio) {
      throw new Error('Missing required parameter: aspect_ratio');
    }

    const isWan26 = request.model === 'wan2.6';
    const requestBody: any = {
      prompt: request.prompt,
      negative_prompt: request.negative_prompt,
      duration: isWan26 ? Number(request.wan26Duration || '5') : request.duration_sec,
      resolution: isWan26 ? (request.wan26Resolution || '1080p') : '720p',
      model: model,
      aspect_ratio: request.aspect_ratio,
      style: 'realistic',
    };

    if (isWan26) {
      requestBody.wan26Duration = request.wan26Duration || '5';
      requestBody.wan26Resolution = request.wan26Resolution || '1080p';
      requestBody.wan26MultiShots = request.wan26MultiShots ?? false;
      requestBody.wan26AspectRatio = request.wan26AspectRatio || request.aspect_ratio || '16:9';

      if (request.imageUrls && request.imageUrls.length > 0) {
        requestBody.imageUrls = request.imageUrls;
      } else if (request.reference_image_url) {
        requestBody.imageUrls = [request.reference_image_url];
      }
    }

    if (request.n_frames && (request.n_frames === '10' || request.n_frames === '15')) {
      requestBody.n_frames = request.n_frames;
    }

    if (request.quality && (request.quality === 'standard' || request.quality === 'high')) {
      requestBody.quality = request.quality;
    }

    const isWan26ImageToVideoMode = model === 'wan2.6' && (
      (request.imageUrls && request.imageUrls.length > 0) ||
      !!request.reference_image_url
    );
    const isImageToVideoMode =
      model === 'image-to-video' ||
      model === 'sora2-pro-image-to-video' ||
      (mode === 'reframe' && request.reference_image_url) ||
      isWan26ImageToVideoMode;
    const primaryImageUrl = request.reference_image_url || request.imageUrls?.[0];

    if (isImageToVideoMode && primaryImageUrl) {
      requestBody.image_url = primaryImageUrl;
      console.log('[videoApi] Added image_url to request:', {
        model,
        mode,
        has_reference_image_url: !!request.reference_image_url,
        has_image_urls: !!request.imageUrls?.length,
        image_url_preview: primaryImageUrl.substring(0, 50) + '...'
      });
    } else if ((mode === 'reframe' || isWan26ImageToVideoMode) && !primaryImageUrl) {
      console.warn('[videoApi] WARNING: reframe mode but no reference_image_url provided');
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error
        ? fetchError.message
        : (typeof fetchError === 'string' ? fetchError : 'Network error occurred');

      console.error('[videoApi] Fetch error:', {
        error: fetchError,
        errorType: typeof fetchError,
        isError: fetchError instanceof Error,
        message: errorMessage,
        url: `${API_BASE}/generate`,
        stack: fetchError instanceof Error ? fetchError.stack : undefined
      });

      throw new Error(`Network error: ${errorMessage}. Please check your internet connection and try again.`);
    }

    if (!response.ok) {
      let error: any = {};
      let responseText: string = '';

      try {
        responseText = await response.text();
        if (responseText && responseText.trim().length > 0) {
          try {
            error = JSON.parse(responseText);
            if (typeof error !== 'object' || error === null) {
              error = { error: responseText, rawText: responseText };
            }
          } catch {
            error = { error: responseText, rawText: responseText };
          }
        } else {
          error = {
            error: getDefaultErrorMessage(response.status),
            status: response.status,
            statusText: response.statusText
          };
        }
      } catch (parseError) {
        console.error('[videoApi] Failed to read error response:', parseError);
        error = {
          error: getDefaultErrorMessage(response.status),
          status: response.status,
          statusText: response.statusText,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        };
      }

      if (!error || typeof error !== 'object' || Object.keys(error).length === 0) {
        error = {
          error: getDefaultErrorMessage(response.status),
          status: response.status,
          statusText: response.statusText
        };
      }

      const detailCandidates = [
        error?.hint,
        error?.details,
        error?.message,
        error?.error,
        error?.response?.msg,
        error?.response?.message,
        error?.response?.error,
        error?.rawText,
      ];
      const detail =
        detailCandidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0) ??
        getDefaultErrorMessage(response.status);
      const codeCandidate =
        error?.code ??
        error?.response?.code ??
        error?.response?.status ??
        error?.status ??
        response.status;
      const codeText =
        typeof codeCandidate === 'string' || typeof codeCandidate === 'number'
          ? ` (code: ${codeCandidate})`
          : '';
      const message = detail ? `${detail}${codeText}`.trim() : `HTTP ${response.status}${codeText}`;

      console.error('[videoApi] API error response:', {
        status: response.status,
        statusText: response.statusText,
        error,
        responseText: responseText ? responseText.substring(0, 500) : '(empty response)',
        message,
      });

      throw new Error(message);
    }

    let data: any;
    let responseText: string = '';
    try {
      responseText = await response.text();
      if (!responseText) {
        throw new Error('Empty response from server');
      }
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[videoApi] JSON parse error:', {
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        responseText: responseText.substring(0, 500),
        responseLength: responseText.length,
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`Invalid response from server: ${parseError instanceof Error ? parseError.message : 'Failed to parse JSON'}. Please try again.`);
    }

    console.log('Create job response:', {
      generation_id: data.generation_id,
      status: data.status,
      message: data.message,
      fullData: data
    });

    if (!data || typeof data !== 'object') {
      console.error('[videoApi] Invalid response data:', data);
      throw new Error('Invalid response from server: response data is not an object');
    }

    if (!data.generation_id) {
      console.error('[videoApi] Missing generation_id in response:', data);
      throw new Error(`Invalid response from server: missing generation_id. Response: ${JSON.stringify(data)}`);
    }

    console.warn('VIDEO GENERATION STARTED:', {
      jobId: data.generation_id,
      status: data.status,
      timestamp: new Date().toISOString()
    });

    const mapStatus = (apiStatus: string): JobStatus => {
      const status = (apiStatus || 'processing').toLowerCase();
      if (status === 'completed' || status === 'success') {
        return 'SUCCEEDED';
      } else if (status === 'failed' || status === 'error') {
        return 'FAILED';
      } else if (status === 'running') {
        return 'RUNNING';
      } else if (status === 'queued') {
        return 'QUEUED';
      } else if (status === 'pending') {
        return 'PENDING';
      } else {
        return 'PENDING';
      }
    };

    return {
      jobId: data.generation_id,
      status: mapStatus(data.status),
      message: data.message,
    };
  },

  // Get job status
  async getJob(jobId: string): Promise<Job> {
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      console.error('Invalid jobId:', jobId);
      throw new Error('Invalid job ID');
    }

    console.log('Getting job status for:', jobId);

    let token: string;
    try {
      token = await getAuthToken();
    } catch (authError) {
      console.error('Authentication failed:', authError);
      throw new Error('Authentication required. Please sign in again.');
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}${API_BASE}/status/${encodeURIComponent(jobId)}`;

    // Add timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('Request timeout after 30 seconds:', url);
      controller.abort();
    }, 30000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      const errorInfo: Record<string, any> = {
        url: url,
        jobId: jobId,
        errorType: fetchError?.constructor?.name || typeof fetchError,
        hasError: !!fetchError,
      };

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        errorInfo.isTimeout = true;
        errorInfo.message = 'Request timeout: Server did not respond within 30 seconds';
      }

      if (fetchError instanceof Error) {
        errorInfo.message = errorInfo.message || fetchError.message;
        errorInfo.name = fetchError.name;
      } else if (typeof fetchError === 'string') {
        errorInfo.message = fetchError;
      } else {
        errorInfo.errorString = String(fetchError);
      }

      if (fetchError instanceof TypeError || fetchError instanceof DOMException) {
        errorInfo.isNetworkError = true;
      }

      console.error('Fetch error in videoApi.getJob:', errorInfo);

      const errorMessage = errorInfo.message ||
                          errorInfo.errorString ||
                          (errorInfo.isNetworkError ?
                            (errorInfo.isTimeout ?
                              'Request timeout: Server did not respond within 30 seconds. Please check your connection and try again.' :
                              'Network error: Unable to connect to server. Please check your internet connection.') :
                            'Unknown fetch error');

      throw new Error(`Failed to fetch job status: ${errorMessage}`);
    }

    console.log('Response status:', response.status, response.statusText);

    // If 401, try refreshing session and retry once
    if (response.status === 401) {
      console.log('Got 401, refreshing session and retrying...');
      try {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshedSession?.access_token) {
          throw new Error('Failed to refresh session');
        }

        const refreshedToken = refreshedSession.access_token;
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshedToken}`,
          },
        });

        console.log('Retry response status:', response.status, response.statusText);
      } catch (retryError) {
        console.error('Retry after refresh failed:', retryError);
        throw new Error('Authentication failed. Please sign in again.');
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');

      const isHtmlResponse = errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html');

      if (isHtmlResponse) {
        console.error('Got HTML response instead of JSON - route may not exist:', {
          url,
          status: response.status,
        });
        throw new Error(`API route not found (404): ${url}. The route may not be properly configured.`);
      }

      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error || errorJson.message || errorText;
      } catch {
        // Not JSON, use text as-is
      }

      const errorMessage = errorDetails
        ? `Failed to get job status: ${response.status} - ${errorDetails}`
        : `Failed to get job status: ${response.status}`;
      throw new Error(errorMessage);
    }

    let data: any;
    try {
      const responseText = await response.text();
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response JSON:', {
        error: parseError,
        status: response.status,
        url: url
      });
      throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // Calculate progress based on status and elapsed time
    let progress = 0;

    const hasResultUrl = data.result_url &&
                        typeof data.result_url === 'string' &&
                        data.result_url.trim().length > 0;

    if (hasResultUrl || data.status === 'completed' || data.status === 'success' || data.status === 'SUCCEEDED') {
      progress = 100;
    } else if (data.status === 'processing' || data.status === 'running' || data.status === 'RUNNING') {
      const createdTime = data.created_at ? new Date(data.created_at).getTime() : Date.now();
      const elapsedSeconds = Math.max(0, (Date.now() - createdTime) / 1000);

      if (elapsedSeconds < 30) {
        progress = Math.min(20, (elapsedSeconds / 30) * 20);
      } else if (elapsedSeconds < 60) {
        progress = 20 + ((elapsedSeconds - 30) / 30) * 20;
      } else if (elapsedSeconds < 90) {
        progress = 40 + ((elapsedSeconds - 60) / 30) * 20;
      } else if (elapsedSeconds < 120) {
        progress = 60 + ((elapsedSeconds - 90) / 30) * 20;
      } else if (elapsedSeconds < 150) {
        progress = 80 + ((elapsedSeconds - 120) / 30) * 15;
      } else if (elapsedSeconds < 180) {
        progress = 95;
      } else if (elapsedSeconds < 240) {
        progress = 95 + ((elapsedSeconds - 180) / 60) * 3;
      } else {
        progress = 98;
      }
    } else if (data.status === 'failed' || data.status === 'error') {
      progress = 0;
    }

    // Parse result_url handling JSON string formats
    let videoUrl: string | undefined = undefined;
    if (data.result_url) {
      let processedUrl: string | undefined = undefined;

      if (typeof data.result_url === 'string' && data.result_url.trim().length > 0) {
        const trimmedUrl = data.result_url.trim();

        try {
          const parsed = parseResultJson(trimmedUrl);
          processedUrl = parsed.resultUrl || parsed.mediaUrl || parsed.videoUrl ||
                        parsed.url || parsed.outputUrl || parsed.downloadUrl ||
                        parsed.fileUrl || parsed.resourceUrl;
          if (!processedUrl && parsed.resultUrls && parsed.resultUrls.length > 0) {
            processedUrl = parsed.resultUrls[0];
          }
        } catch (parseError) {
          console.warn('parseResultJson failed, trying direct parse:', parseError);

          if ((trimmedUrl.startsWith('[') && trimmedUrl.endsWith(']')) ||
              (trimmedUrl.startsWith('{') && trimmedUrl.endsWith('}'))) {
            try {
              const parsed = JSON.parse(trimmedUrl);
              if (Array.isArray(parsed) && parsed.length > 0) {
                processedUrl = typeof parsed[0] === 'string' ? parsed[0] : String(parsed[0]);
              } else if (parsed && typeof parsed === 'object') {
                processedUrl = (parsed as any).resultUrl || (parsed as any).url ||
                              (parsed as any).videoUrl || (parsed as any).mediaUrl;
              } else if (typeof parsed === 'string') {
                processedUrl = parsed;
              }
            } catch {
              processedUrl = trimmedUrl;
            }
          } else {
            processedUrl = trimmedUrl;
          }
        }

        if (processedUrl) {
          try {
            new URL(processedUrl);
            videoUrl = processedUrl;
          } catch {
            console.warn('result_url is not a valid URL:', processedUrl);
            videoUrl = undefined;
          }
        }
      } else if (Array.isArray(data.result_url) && data.result_url.length > 0) {
        const firstUrl = data.result_url[0];
        if (typeof firstUrl === 'string' && firstUrl.trim().length > 0) {
          try {
            new URL(firstUrl.trim());
            videoUrl = firstUrl.trim();
          } catch {
            console.warn('result_url array element is not a valid URL:', firstUrl);
          }
        }
      }
    }

    // Map status and handle edge cases
    let mappedStatus = mapStatusToJobStatus(data.status);
    const hasFailureDetails = !videoUrl && !!(
      data.error_code ||
      data.fail_code ||
      data.error_message ||
      data.fail_msg ||
      data.error
    );
    if (hasFailureDetails) {
      console.warn('Failure details found in response, forcing status to FAILED:', {
        status: data.status,
        error_code: data.error_code || data.fail_code,
        error_message: data.error_message || data.fail_msg || data.error
      });
      mappedStatus = 'FAILED';
      progress = 0;
    }
    if (videoUrl) {
      if (mappedStatus === 'FAILED') {
        console.warn('Video URL exists but status is FAILED, keeping FAILED status');
      } else {
        mappedStatus = 'SUCCEEDED';
        progress = 100;
      }
    }

    const jobResult: Job = {
      jobId: jobId,
      status: mappedStatus,
      progress: Math.round(progress),
      result_url: videoUrl,
      preview_url: data.thumbnail_url,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at,
      visibility: 'private',
      creditCost: data.credits_consumed ?? 0,
      params: {
        prompt: data.prompt || '',
        duration_sec: data.duration || 10,
        aspect_ratio: data.aspect_ratio || '16:9',
        cfg_scale: 7,
      },
      error: mappedStatus === 'FAILED' ? {
        code: data.error_code || data.fail_code || 'API_ERROR',
        message: data.error_message || data.fail_msg || data.error || 'Video generation failed. Please try again or contact support if the problem persists.',
      } : undefined,
    };

    if (jobResult.result_url && jobResult.status !== 'SUCCEEDED') {
      jobResult.status = 'SUCCEEDED';
      jobResult.progress = 100;
    }

    const finalResultUrl = jobResult.result_url &&
                          typeof jobResult.result_url === 'string' &&
                          jobResult.result_url.trim().length > 0
                          ? jobResult.result_url.trim()
                          : undefined;

    if (finalResultUrl && jobResult.status !== 'SUCCEEDED' && jobResult.status !== 'FAILED') {
      jobResult.status = 'SUCCEEDED';
      jobResult.progress = 100;
      jobResult.error = undefined;
    }

    jobResult.result_url = finalResultUrl;

    return jobResult;
  },

  // Cancel job (Note: Kie API may not support cancellation)
  async cancelJob(jobId: string): Promise<{ success: boolean }> {
    console.warn('Job cancellation not supported by Kie API');
    return { success: false };
  },

  // Get all jobs for current user from local database
  async getJobs(limit: number = 20): Promise<Job[]> {
    try {
      const token = await getAuthToken();

      if (!token) {
        console.warn('[GET JOBS] No auth token available');
        return [];
      }

      const response = await fetch(`/api/jobs?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('[GET JOBS] Jobs API route not found (404).');
        } else if (response.status === 401) {
          console.warn('[GET JOBS] Unauthorized. Token may be invalid.');
        } else {
          console.error('[GET JOBS] Failed to fetch jobs:', response.status, response.statusText);
        }
        return [];
      }

      const data = await response.json();
      console.log(`[GET JOBS] Fetched ${data.jobs?.length || 0} jobs from database`);

      return data.jobs || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('[GET JOBS] Network error - API may not be available yet');
      } else {
        console.error('[GET JOBS] Failed to fetch jobs:', error);
      }
      return [];
    }
  },
};

export default videoApi;

function mapStatusToJobStatus(status?: string): JobStatus {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'queued':
    case 'pending':
      return 'QUEUED';
    case 'processing':
    case 'running':
      return 'RUNNING';
    case 'completed':
    case 'success':
    case 'succeeded':
    case 'finish':
    case 'finished':
    case 'complete':
    case 'done':
      return 'SUCCEEDED';
    case 'failed':
    case 'fail':
    case 'error':
    case 'failure':
      return 'FAILED';
    case 'canceled':
      return 'CANCELED';
    default:
      if (status) {
        console.warn('[videoApi] Unrecognized job status from provider:', status);
      }
      return 'PENDING';
  }
}

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request parameters';
    case 401:
      return 'Authentication failed. Please sign in again.';
    case 402:
      return 'Insufficient credits. Please purchase credits or subscribe to a plan.';
    case 403:
      return 'Access forbidden';
    case 404:
      return 'Resource not found';
    case 422:
      return 'Parameter validation failed';
    case 429:
      return 'Request rate limit exceeded. Please try again later.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. The service may be temporarily unavailable.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return `Request failed with status ${status}`;
  }
}
