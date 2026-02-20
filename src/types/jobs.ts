// Job System Types for Sora3 Video Generation

export type JobStatus = 'PENDING' | 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';

export type AspectRatio = '16:9' | '9:16' | '1:1';
export type Duration = 5 | 8 | 10 | 12 | 15 | 16;

export interface JobParams {
  prompt: string;
  negative_prompt?: string;
  duration_sec: Duration;
  aspect_ratio: AspectRatio;
  cfg_scale: number;
  reference_image_url?: string;
  model?: string;
  n_frames?: '10' | '15';
  quality?: 'standard' | 'high';
  wan26Duration?: '5' | '10' | '15';
  wan26Resolution?: '720p' | '1080p';
  wan26MultiShots?: boolean;
  wan26AspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  imageUrls?: string[];
}

export interface Job {
  jobId: string;
  status: JobStatus;
  progress: number; // 0-100
  preview_url?: string;
  result_url?: string;
  error?: {
    code: string;
    message: string;
  };
  params: JobParams;
  created_at: string;
  updated_at?: string;
  visibility?: 'public' | 'private';
  creditCost: number;
}

export interface CreateJobRequest {
  prompt: string;
  negative_prompt?: string;
  duration_sec: Duration;
  aspect_ratio: AspectRatio;
  cfg_scale: number;
  reference_image_url?: string;
  model?: string;
  n_frames?: '10' | '15'; // Video duration: 10s or 15s
  quality?: 'standard' | 'high'; // Quality for sora3-pro (maps to size in API)
  wan26Duration?: '5' | '10' | '15';
  wan26Resolution?: '720p' | '1080p';
  wan26MultiShots?: boolean;
  wan26AspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  imageUrls?: string[];
  veo3Params?: {
    model: 'veo3' | 'veo3_fast';
    generationType: 'TEXT_2_VIDEO' | 'FIRST_AND_LAST_FRAMES_2_VIDEO' | 'REFERENCE_2_VIDEO';
    imageUrls?: string[];
    seeds?: number;
    enableTranslation?: boolean;
    watermark?: string;
  };
}

export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
  message?: string;
}

export interface JobError {
  code: 'MODEL_RATE_LIMIT' | 'MODEL_BUSY' | 'PARAM_INVALID' | 'CONTENT_BLOCKED' | 'INSUFFICIENT_CREDITS' | 'UNKNOWN';
  message: string;
}

// Form validation types
export interface FormErrors {
  prompt?: string;
  negative_prompt?: string;
  reference_image?: string;
}
