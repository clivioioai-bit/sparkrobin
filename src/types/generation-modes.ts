// Generation Mode Types

export type GenerationMode = 'text-to-video' | 'image-to-video';

// Fast Mode
export interface FastModeParams {
  prompt: string;
  duration: 8 | 12;
  style: 'cinematic' | 'anime' | 'realistic';
}

// Sora3 Mode
export interface Sora3Params {
  prompt: string;
  negative_prompt?: string;
  duration?: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | 'Auto';
  style?: string;
  n_frames?: '10' | '15'; // Video duration: 10s or 15s
  model?: 'sora3' | 'sora3-pro' | 'sora2' | 'sora2-pro' | 'storyboard' | 'veo3.1' | 'wan2.6'; // Model selection
  quality?: 'standard' | 'high'; // Quality for sora3-pro/sora2-pro (maps to size in API)
  veo3SubModel?: 'veo3_fast' | 'veo3'; // For Veo3.1: sub-model selection (Fast or Quality)
  veoDisplayModel?: 'spark-robin' | 'veo3.1'; // Frontend-only label while backend continues using veo3.1
  seeds?: number; // For Veo3.1: Optional seed (10000-99999)
  // Wan2.6 specific parameters
  wan26Duration?: '5' | '10' | '15'; // Wan2.6 duration in seconds
  wan26Resolution?: '720p' | '1080p'; // Wan2.6 resolution
  wan26MultiShots?: boolean; // Wan2.6 multi shots parameter
  wan26AspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'; // Wan2.6 aspect ratio
  // Storyboard parameters (when model === 'storyboard')
  storyboardParams?: import('@/types/storyboard').StoryboardParams;
}

// Reframe Mode (Image-to-Video)
export interface ReframeParams {
  prompt?: string;
  sourceVideo?: File;
  startFrame?: File; // For Veo3.1: Start frame image
  endFrame?: File; // For Veo3.1: End frame image
  targetAspectRatio: '16:9' | '9:16' | 'Auto';
  style: 'zoom' | 'pan' | 'crop';
  speed: 'normal' | 'slow' | 'fast';
  model?: 'sora3' | 'sora3-pro' | 'sora2' | 'sora2-pro' | 'veo3.1' | 'wan2.6';
  veo3SubModel?: 'veo3_fast' | 'veo3'; // For Veo3.1: sub-model selection
  veoDisplayModel?: 'spark-robin' | 'veo3.1'; // Frontend-only label while backend continues using veo3.1
  seeds?: number; // For Veo3.1: Optional seed (10000-99999)
  n_frames?: '10' | '15'; // Video duration: 10s or 15s
  quality?: 'standard' | 'high'; // Quality for sora3-pro/sora2-pro (maps to size in API)
  // Wan2.6 specific parameters
  wan26Duration?: '5' | '10' | '15'; // Wan2.6 duration in seconds
  wan26Resolution?: '720p' | '1080p'; // Wan2.6 resolution
  wan26MultiShots?: boolean; // Wan2.6 multi shots parameter
  wan26AspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'; // Wan2.6 aspect ratio
  imageUrls?: string[]; // For Wan2.6: Image URLs array
}

// TikTok Mode
export interface TikTokParams {
  prompt: string;
  style: 'dance' | 'lip-sync' | 'transition' | 'effects';
  music?: File;
  duration: 8 | 12;
}

// Normal Mode
export interface NormalParams {
  prompt: string;
  negative_prompt?: string;
  duration: 8 | 12;
  style: 'standard' | 'creative' | 'abstract';
}

export type ModeParams =
  | { mode: 'text-to-video'; params: Sora3Params }
  | { mode: 'image-to-video'; params: ReframeParams };
