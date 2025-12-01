// Generation Mode Types

export type GenerationMode = 'sora3' | 'reframe';

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
  aspectRatio: '16:9' | '9:16' | '1:1';
  style?: string;
  n_frames?: '10' | '15'; // Video duration: 10s or 15s
  model?: 'sora3' | 'sora3-pro'; // Model selection
  quality?: 'standard' | 'high'; // Quality for sora3-pro (maps to size in API)
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
  model?: 'sora3' | 'sora3-pro' | 'veo3.1';
  veo3SubModel?: 'veo3_fast' | 'veo3'; // For Veo3.1: sub-model selection
  seeds?: number; // For Veo3.1: Optional seed (10000-99999)
  n_frames?: '10' | '15'; // Video duration: 10s or 15s
  quality?: 'standard' | 'high'; // Quality for sora3-pro (maps to size in API)
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
  | { mode: 'sora3'; params: Sora3Params }
  | { mode: 'reframe'; params: ReframeParams };




