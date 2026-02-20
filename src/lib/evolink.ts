/**
 * Evolink API Integration for Wan2.6 Video Generation
 * API Documentation: https://api.evolink.ai
 */

const EVOLINK_API_KEY = process.env.EVOLINK_API_KEY;
const EVOLINK_API_BASE_URL = 'https://api.evolink.ai';

export interface EvolinkTextToVideoRequest {
  model: 'wan2.6-text-to-video';
  prompt: string;
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  quality?: '720p' | '1080p';
  duration?: 5 | 10 | 15;
  prompt_extend?: boolean;
  model_params?: {
    shot_type?: 'single' | 'multi';
  };
  audio_url?: string;
  callback_url?: string;
}

export interface EvolinkImageToVideoRequest {
  model: 'wan2.6-image-to-video';
  prompt: string;
  image_urls: string[];
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  quality?: '720p' | '1080p';
  duration?: 5 | 10 | 15;
  prompt_extend?: boolean;
  model_params?: {
    shot_type?: 'single' | 'multi';
  };
  audio_url?: string;
  callback_url?: string;
}

export interface EvolinkVideoGenerationResponse {
  created: number;
  id: string;
  model: string;
  object: 'video.generation.task';
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  task_info: {
    can_cancel: boolean;
    estimated_time: number;
  };
  type: 'video';
  usage: {
    billing_rule: 'per_call' | 'per_token' | 'per_second';
    credits_reserved: number;
    user_group: 'default' | 'vip';
  };
}

export interface EvolinkTaskStatusResponse {
  created: number;
  id: string;
  model: string;
  object: 'video.generation.task';
  progress: number;
  results?: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  task_info: {
    can_cancel: boolean;
  };
  type: 'video';
}

export interface EvolinkErrorResponse {
  error: {
    code: number;
    message: string;
    type: string;
    param?: string;
    fallback_suggestion?: string;
  };
}

/**
 * Create a video generation task using Evolink API
 */
export async function createEvolinkVideoTask(
  request: EvolinkTextToVideoRequest | EvolinkImageToVideoRequest
): Promise<{ success: boolean; taskId?: string; error?: string; statusCode?: number }> {
  if (!EVOLINK_API_KEY) {
    return {
      success: false,
      error: 'Evolink API key not configured',
      statusCode: 503
    };
  }

  try {
    console.log('[Evolink] Creating video generation task:', {
      model: request.model,
      has_prompt: !!request.prompt,
      has_image_urls: 'image_urls' in request && !!request.image_urls,
      aspect_ratio: request.aspect_ratio,
      quality: request.quality,
      duration: request.duration
    });

    const response = await fetch(`${EVOLINK_API_BASE_URL}/v1/videos/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EVOLINK_API_KEY}`
      },
      body: JSON.stringify(request)
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as EvolinkErrorResponse;
      console.error('[Evolink] API error:', {
        status: response.status,
        error: errorData.error
      });

      return {
        success: false,
        error: errorData.error?.message || 'Unknown error',
        statusCode: response.status
      };
    }

    const result = data as EvolinkVideoGenerationResponse;
    console.log('[Evolink] Task created successfully:', {
      taskId: result.id,
      status: result.status,
      estimated_time: result.task_info.estimated_time
    });

    return {
      success: true,
      taskId: result.id
    };
  } catch (error) {
    console.error('[Evolink] Request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      statusCode: 500
    };
  }
}

/**
 * Query task status using Evolink API
 */
export async function getEvolinkTaskStatus(
  taskId: string
): Promise<{ success: boolean; data?: EvolinkTaskStatusResponse; error?: string }> {
  if (!EVOLINK_API_KEY) {
    return {
      success: false,
      error: 'Evolink API key not configured'
    };
  }

  try {
    console.log('[Evolink] Querying task status:', taskId);

    const response = await fetch(`${EVOLINK_API_BASE_URL}/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${EVOLINK_API_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as EvolinkErrorResponse;
      console.error('[Evolink] Status query error:', {
        status: response.status,
        error: errorData.error
      });

      return {
        success: false,
        error: errorData.error?.message || 'Unknown error'
      };
    }

    const result = data as EvolinkTaskStatusResponse;
    console.log('[Evolink] Task status:', {
      taskId: result.id,
      status: result.status,
      progress: result.progress,
      has_results: !!result.results
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('[Evolink] Status query failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Map aspect ratio from UI format to Evolink API format
 */
export function mapAspectRatioToEvolink(aspectRatio: string): '16:9' | '9:16' | '1:1' | '4:3' | '3:4' {
  switch (aspectRatio) {
    case '16:9':
      return '16:9';
    case '9:16':
      return '9:16';
    case '1:1':
      return '1:1';
    case '4:3':
      return '4:3';
    case '3:4':
      return '3:4';
    default:
      return '16:9';
  }
}

/**
 * Map quality from UI format to Evolink API format
 */
export function mapQualityToEvolink(quality?: string): '720p' | '1080p' {
  if (quality === '720p') return '720p';
  return '1080p';
}

/**
 * Map duration from UI format to Evolink API format
 */
export function mapDurationToEvolink(duration?: string | number): 5 | 10 | 15 {
  const durationNum = typeof duration === 'string' ? parseInt(duration) : duration;
  if (durationNum === 5) return 5;
  if (durationNum === 10) return 10;
  if (durationNum === 15) return 15;
  return 5;
}
