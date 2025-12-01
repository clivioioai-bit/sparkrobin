// Real Video Generation API Service
import {
  Job,
  JobStatus,
  CreateJobRequest,
  CreateJobResponse,
} from '@/types/jobs';
import { supabase } from '@/lib/supabase';
import { safeJsonParse } from '@/lib/utils';

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
      let error: any = { error: 'Failed to upload file' };
      try {
        error = await safeJsonParse(response);
      } catch (parseError) {
        // If parsing fails, use status-based error
        error = { error: `Upload failed: ${response.status} ${response.statusText}` };
      }
      // 优先显示详细错误信息
      const errorMessage = error.details || error.error || `Upload failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await safeJsonParse(response);
    console.log('[videoApi.uploadVideo] Upload response:', {
      has_result_url: !!data.result_url,
      has_video_url: !!data.video_url,
      has_url: !!data.url,
      response_keys: Object.keys(data),
      full_response: data
    });
    
    // API 返回 video_url，但为了兼容性也检查 result_url 和 url
    // 使用 filter 确保我们不返回空字符串
    const videoUrl = (data.video_url && data.video_url.trim()) 
      || (data.result_url && data.result_url.trim()) 
      || (data.url && data.url.trim());
    
    if (!videoUrl) {
      console.error('[videoApi.uploadVideo] ❌ No video URL in response:', {
        response_data: data,
        response_keys: Object.keys(data),
        video_url_raw: data.video_url,
        result_url_raw: data.result_url,
        url_raw: data.url
      });
      throw new Error('Upload succeeded but no URL was returned from server. Please check your Supabase storage configuration.');
    }
    
    console.log('[videoApi.uploadVideo] ✅ Upload successful, returning URL:', videoUrl);
    return videoUrl;
  },

  // Create a new video generation job
  async createJob(
    request: CreateJobRequest,
    mode: 'sora3' | 'reframe'
  ): Promise<CreateJobResponse> {
    const token = await getAuthToken();
    
    // Handle Veo3.1 API requests
    if (request.model === 'veo3.1' && request.veo3Params) {
      const veo3Body: any = {
        prompt: request.prompt,
        model: request.veo3Params.model,
        generationType: request.veo3Params.generationType,
        aspectRatio: request.aspect_ratio,
        enableTranslation: request.veo3Params.enableTranslation !== false, // default true
      };

      // Add imageUrls if provided
      if (request.veo3Params.imageUrls && request.veo3Params.imageUrls.length > 0) {
        veo3Body.imageUrls = request.veo3Params.imageUrls;
      }

      // Add optional parameters
      if (request.veo3Params.seeds) {
        veo3Body.seeds = request.veo3Params.seeds;
      }
      if (request.veo3Params.watermark) {
        veo3Body.watermark = request.veo3Params.watermark;
      }

      const apiUrl = `${API_BASE}/veo3/generate`;
      console.log('[Veo3.1 API] Request:', {
        url: apiUrl,
        body: veo3Body,
        hasToken: !!token
      });

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
        console.error('[Veo3.1 API] Fetch error:', {
          error: fetchError,
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          url: apiUrl,
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        });
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to Veo3.1 API. Please check your internet connection and try again.'}`);
      }

      if (!response.ok) {
        let errorData: any = { error: `HTTP ${response.status}: ${response.statusText}` };
        try {
          errorData = await safeJsonParse(response);
        } catch (parseError) {
          console.error('[Veo3.1 API] Failed to parse error response:', parseError);
        }
        console.error('[Veo3.1 API] Error response:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to generate Veo3.1 video: ${response.status}`);
      }

      let data: any;
      try {
        data = await safeJsonParse(response);
      } catch (parseError) {
        console.error('[Veo3.1 API] JSON parse error:', parseError);
        throw new Error(`Invalid response from Veo3.1 API: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      console.log('[Veo3.1 API] Response:', data);
      
      // Handle response format from Veo3.1 API
      // Response format: { code: 200, msg: 'success', data: { taskId: '...' } }
      const taskId = data.data?.taskId || data.taskId;
      
      if (!taskId) {
        console.error('[Veo3.1 API] Missing taskId in response:', data);
        throw new Error('Missing taskId in Veo3.1 API response');
      }
      
      // Return in CreateJobResponse format
      return {
        jobId: taskId,
        status: 'PENDING' as const,
        message: data.msg || 'success'
      };
    }
    
    // Determine the model: use provided model, or fallback to mode-based logic
    // 明确区分四种模型：
    // 1. text-to-video: sora-2-text-to-video
    // 2. sora3-pro (text-to-video): sora-2-pro-text-to-video  
    // 3. image-to-video: sora-2-image-to-video
    // 4. sora3-pro-image-to-video: sora-2-pro-image-to-video
    let model: string;
    if (request.model) {
      // Map frontend model names to backend model names
      const modelMap: Record<string, string> = {
        'sora3': mode === 'reframe' ? 'image-to-video' : 'text-to-video',
        'sora3-pro': mode === 'reframe' ? 'sora3-pro-image-to-video' : 'sora3-pro',
        'veo3': 'veo3'
      };
      model = modelMap[request.model] || request.model;
    } else {
      // Fallback to existing logic
      model = mode === 'reframe' && request.reference_image_url ? 'image-to-video' : 'text-to-video';
    }
    
    // 验证必需参数
    if (!request.prompt) {
      throw new Error('Missing required parameter: prompt');
    }
    if (!request.duration_sec) {
      throw new Error('Missing required parameter: duration_sec');
    }
    if (!request.aspect_ratio) {
      throw new Error('Missing required parameter: aspect_ratio');
    }

    const requestBody: any = {
      prompt: request.prompt,
      negative_prompt: request.negative_prompt,
      duration: request.duration_sec,
      resolution: '720p', // Default resolution
      model: model,
      aspect_ratio: request.aspect_ratio,
      style: 'realistic', // Default style
    };

    // Add n_frames if provided (10 or 15)
    if (request.n_frames && (request.n_frames === '10' || request.n_frames === '15')) {
      requestBody.n_frames = request.n_frames;
    }

    // Add quality if provided (for sora3-pro)
    if (request.quality && (request.quality === 'standard' || request.quality === 'high')) {
      requestBody.quality = request.quality;
    }

    // Add image URL for image-to-video mode
    // Check both the mapped model name and the original mode to determine if this is image-to-video
    const isImageToVideoMode = model === 'image-to-video' || model === 'sora3-pro-image-to-video' || (mode === 'reframe' && request.reference_image_url);
    if (isImageToVideoMode && request.reference_image_url) {
      requestBody.image_url = request.reference_image_url;
      console.log('[videoApi] Added image_url to request:', {
        model,
        mode,
        has_reference_image_url: !!request.reference_image_url,
        image_url_preview: request.reference_image_url.substring(0, 50) + '...'
      });
    } else if (mode === 'reframe' && !request.reference_image_url) {
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
      // 捕获网络错误或其他 fetch 错误
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
        // 先尝试读取响应文本
        responseText = await response.text();
        // 然后尝试解析为 JSON
        if (responseText && responseText.trim().length > 0) {
          try {
            error = JSON.parse(responseText);
            // 确保 error 是一个对象
            if (typeof error !== 'object' || error === null) {
              error = { error: responseText, rawText: responseText };
            }
          } catch {
            // 如果不是 JSON，使用文本作为错误信息
            error = { error: responseText, rawText: responseText };
          }
        } else {
          // 响应体为空，根据状态码提供默认错误信息
          error = { 
            error: getDefaultErrorMessage(response.status),
            status: response.status,
            statusText: response.statusText
          };
        }
      } catch (parseError) {
        // 如果读取响应失败，使用状态信息
        console.error('[videoApi] Failed to read error response:', parseError);
        error = { 
          error: getDefaultErrorMessage(response.status),
          status: response.status,
          statusText: response.statusText,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        };
      }
      
      // 确保 error 对象不为空
      if (!error || typeof error !== 'object' || Object.keys(error).length === 0) {
        error = {
          error: getDefaultErrorMessage(response.status),
          status: response.status,
          statusText: response.statusText
        };
      }
      
      const detailCandidates = [
        error?.hint, // 优先显示提示信息
        error?.details,
        error?.message,
        error?.error,
        error?.response?.msg,
        error?.response?.message,
        error?.response?.error,
        error?.rawText, // 添加原始文本作为备选
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
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
        hasErrorData: !!(error && typeof error === 'object' && Object.keys(error).length > 0)
      });
      
      throw new Error(message);
    }

    let data: any;
    try {
      data = await safeJsonParse(response);
    } catch (parseError) {
      console.error('[videoApi] JSON parse error:', {
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
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

    // 验证响应数据
    if (!data || typeof data !== 'object') {
      console.error('[videoApi] Invalid response data:', data);
      throw new Error('Invalid response from server: response data is not an object');
    }

    if (!data.generation_id) {
      console.error('[videoApi] Missing generation_id in response:', data);
      throw new Error(`Invalid response from server: missing generation_id. Response: ${JSON.stringify(data)}`);
    }

    // 添加更明显的日志
    console.warn('🚀 VIDEO GENERATION STARTED:', {
      jobId: data.generation_id,
      status: data.status,
      timestamp: new Date().toISOString()
    });

    // Map API status to JobStatus
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
        // Default to PENDING for 'processing' or unknown statuses
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
    
    console.log('🔍 Getting job status for:', jobId);
    
    let token: string;
    try {
      token = await getAuthToken();
      console.log('🔑 Auth token obtained:', token ? 'Yes' : 'No');
    } catch (authError) {
      console.error('❌ Authentication failed:', authError);
      throw new Error('Authentication required. Please sign in again.');
    }
    
    const url = `${API_BASE}/status/${jobId}`;
    console.log('🌐 API URL:', url);
    console.log('🔑 Using auth token:', token ? `${token.substring(0, 20)}...` : 'N/A');
    
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store', // 确保不使用缓存
      });
    } catch (fetchError) {
      console.error('❌ Fetch error in videoApi.getJob:', {
        error: fetchError,
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
        url: url,
        jobId: jobId
      });
      throw fetchError;
    }
    
    console.log('📡 Response status:', response.status, response.statusText);

    // If 401, try refreshing session and retry once
    if (response.status === 401) {
      console.log('🔄 Got 401, refreshing session and retrying...');
      try {
        // Force refresh the session
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
        
        console.log('📡 Retry response status:', response.status, response.statusText);
      } catch (retryError) {
        console.error('❌ Retry after refresh failed:', retryError);
        throw new Error('Authentication failed. Please sign in again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `Failed to get job status: ${response.status}`;
      try {
        const errorData = await safeJsonParse(response);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If parsing fails, use status-based error
      }
      throw new Error(errorMessage);
    }

    let data: any;
    try {
      data = await safeJsonParse(response);
      console.log('📄 Parsed response data:', {
        status: data.status,
        has_result_url: !!data.result_url,
        preview: JSON.stringify(data).substring(0, 500)
      });
    } catch (parseError) {
      console.error('❌ Failed to parse response JSON:', {
        error: parseError,
        status: response.status,
        statusText: response.statusText,
        url: url
      });
      throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
    
    console.log('📊 API Response data:', {
      status: data.status,
      result_url: data.result_url,
      result_url_type: typeof data.result_url,
      result_url_length: data.result_url?.length,
      result_url_preview: data.result_url ? data.result_url.substring(0, 100) + '...' : 'N/A',
      result_url_full: data.result_url, // 完整 URL 用于调试
      thumbnail_url: data.thumbnail_url,
      generation_id: data.generation_id,
      progress: data.progress,
      has_result_url: !!data.result_url,
      will_use_url: !!data.result_url && typeof data.result_url === 'string',
      full_data: data
    });
    
    // Calculate progress based on status and elapsed time
    let progress = 0;
    
    // 优先检查状态和视频URL
    if (data.status === 'completed' || data.status === 'success' || data.result_url) {
      progress = 100;
      console.log('🎉 Video generation completed!', {
        status: data.status,
        result_url: data.result_url,
        result_url_valid: !!data.result_url && data.result_url.trim().length > 0,
        progress: 100
      });
    } else if (data.status === 'processing' || data.status === 'running') {
      // For processing jobs, calculate progress based on elapsed time
      const createdTime = data.created_at ? new Date(data.created_at).getTime() : Date.now();
      const elapsedSeconds = Math.max(0, (Date.now() - createdTime) / 1000);
      
      // Estimate progress based on typical 150-second generation time
      if (elapsedSeconds < 30) {
        progress = Math.min(20, (elapsedSeconds / 30) * 20);
      } else if (elapsedSeconds < 60) {
        progress = 20 + ((elapsedSeconds - 30) / 30) * 20;
      } else if (elapsedSeconds < 90) {
        progress = 40 + ((elapsedSeconds - 60) / 30) * 20;
      } else if (elapsedSeconds < 120) {
        progress = 60 + ((elapsedSeconds - 90) / 30) * 20;
      } else if (elapsedSeconds < 150) {
        progress = 80 + ((elapsedSeconds - 120) / 30) * 15; // 改为到95%
      } else if (elapsedSeconds < 180) {
        progress = 95; // 保持在95%
      } else if (elapsedSeconds < 240) {
        // 超过180秒后，继续缓慢增长到98%
        progress = 95 + ((elapsedSeconds - 180) / 60) * 3;
      } else {
        // 超过240秒后，显示98%而不是100%，给用户期待感
        progress = 98;
      }
    } else if (data.status === 'failed' || data.status === 'error') {
      progress = 0;
    }
    
    console.log('Progress calculation:', {
      status: data.status,
      result_url: data.result_url,
      calculated_progress: progress,
      has_result_url: !!data.result_url,
      full_response: data
    });
    
    // 确保 result_url 是有效的字符串URL
    let videoUrl: string | undefined = undefined;
    if (data.result_url) {
      if (typeof data.result_url === 'string' && data.result_url.trim().length > 0) {
        videoUrl = data.result_url.trim();
        // 验证是否为有效URL格式
        try {
          new URL(videoUrl);
        } catch (e) {
          console.warn('⚠️ result_url is not a valid URL:', videoUrl);
          videoUrl = undefined;
        }
      } else {
        console.warn('⚠️ result_url is not a valid string:', {
          type: typeof data.result_url,
          value: data.result_url
        });
      }
    }
    
    // 如果状态是完成但没有视频URL，记录警告
    if ((data.status === 'completed' || data.status === 'success') && !videoUrl) {
      console.warn('⚠️ Status is completed but no valid video URL found:', {
        status: data.status,
        result_url: data.result_url,
        processed_url: videoUrl,
        full_data: data
      });
    }
    
    // 如果有视频URL，强制设置为SUCCEEDED状态，无论原始状态是什么（除非是FAILED）
    let mappedStatus = mapStatusToJobStatus(data.status);
    if (videoUrl) {
      if (mappedStatus === 'FAILED') {
        console.warn('⚠️ Video URL exists but status is FAILED, keeping FAILED status');
      } else {
        console.log('🎬 Video URL found, forcing status to SUCCEEDED:', {
          originalStatus: data.status,
          mappedStatus: mappedStatus,
          videoUrl: videoUrl.substring(0, 100) + '...'
        });
        mappedStatus = 'SUCCEEDED';
        progress = 100; // 确保进度也是100%
      }
    }
    
    console.log('📊 Final job data:', {
      jobId: data.generation_id,
      originalStatus: data.status,
      mappedStatus: mappedStatus,
      progress: Math.round(progress),
      hasResultUrl: !!videoUrl,
      resultUrl: videoUrl,
      willShowVideo: mappedStatus === 'SUCCEEDED' && !!videoUrl,
      rawApiData: data
    });
    
    console.log('🔗 Video URL processing:', {
      raw_result_url: data.result_url,
      processed_result_url: videoUrl,
      has_result_url: !!videoUrl,
      status: mappedStatus,
      will_return_video: mappedStatus === 'SUCCEEDED' && !!videoUrl
    });
    
    const jobResult: Job = {
      jobId: jobId,
      status: mappedStatus,
      progress: Math.round(progress),
      result_url: videoUrl, // 确保result_url被正确设置
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
      error: data.error_message ? {
        code: 'API_ERROR',
        message: data.error_message,
      } : undefined,
    };
    
    // 最终验证：确保如果有result_url，status必须是SUCCEEDED
    if (jobResult.result_url && jobResult.status !== 'SUCCEEDED') {
      console.warn('⚠️ Forcing status to SUCCEEDED because result_url exists:', {
        jobId: jobResult.jobId,
        originalStatus: jobResult.status,
        result_url: jobResult.result_url.substring(0, 50) + '...'
      });
      jobResult.status = 'SUCCEEDED';
      jobResult.progress = 100;
    }
    
    // 最终验证：确保result_url被正确设置
    const finalResultUrl = jobResult.result_url && 
                          typeof jobResult.result_url === 'string' && 
                          jobResult.result_url.trim().length > 0
                          ? jobResult.result_url.trim()
                          : undefined;
    
    // 如果最终有result_url但状态不是SUCCEEDED，再次强制设置
    if (finalResultUrl && jobResult.status !== 'SUCCEEDED' && jobResult.status !== 'FAILED') {
      console.warn('⚠️ Final check: Forcing status to SUCCEEDED because result_url exists:', {
        jobId: jobResult.jobId,
        originalStatus: jobResult.status,
        resultUrl: finalResultUrl.substring(0, 80) + '...'
      });
      jobResult.status = 'SUCCEEDED';
      jobResult.progress = 100;
    }
    
    // 确保result_url被正确设置
    jobResult.result_url = finalResultUrl;
    
    console.log('✅ Returning Job object:', {
      jobId: jobResult.jobId,
      status: jobResult.status,
      hasResultUrl: !!jobResult.result_url,
      resultUrl: jobResult.result_url ? jobResult.result_url.substring(0, 80) + '...' : 'N/A',
      resultUrlFull: jobResult.result_url, // 完整 URL 用于调试
      resultUrlType: typeof jobResult.result_url,
      resultUrlLength: jobResult.result_url?.length,
      progress: jobResult.progress,
      willShowVideo: jobResult.status === 'SUCCEEDED' && !!jobResult.result_url,
      // 验证 URL 格式
      isValidUrl: jobResult.result_url ? (() => {
        try {
          new URL(jobResult.result_url!);
          return true;
        } catch {
          return false;
        }
      })() : false
    });
    
    return jobResult;
  },

  // Cancel job (Note: Kie API may not support cancellation)
  async cancelJob(jobId: string): Promise<{ success: boolean }> {
    // For now, return success as Kie API may not support job cancellation
    // In the future, this could call a refund endpoint if available
    console.warn('Job cancellation not supported by Kie API');
    return { success: false };
  },

  // Get all jobs for current user from local database
  async getJobs(limit: number = 20): Promise<Job[]> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`/api/jobs?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch jobs:', response.status);
        return [];
      }

      const data = await safeJsonParse(response);
      console.log(`[GET JOBS] Fetched ${data.jobs?.length || 0} jobs from database`);
      
      return data.jobs || [];
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
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

// Helper function to get default error message based on HTTP status code
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
