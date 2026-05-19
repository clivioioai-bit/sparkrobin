export type GenerationWorkflow =
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video'
  | 'text-to-image'
  | 'image-editor';

export type GenerationModelId =
  | 'gemini-omni-flash-fast'
  | 'veo31-fast'
  | 'veo31-quality'
  | 'nano-banana'
  | 'nano-banana-pro';

export interface GenerationModelOption {
  id: GenerationModelId;
  label: string;
  description: string;
  iconSrc: string;
  workflows: GenerationWorkflow[];
  badge?: string;
  creditCost: number;
}

export const generationModels: GenerationModelOption[] = [
  {
    id: 'gemini-omni-flash-fast',
    label: 'Gemini Omni Flash Fast',
    description: 'Gemini Omni Flash branding on the frontend, powered by the Veo3.1 fast backend.',
    iconSrc: '/images/google_veo_logo.jpeg',
    workflows: ['text-to-video', 'image-to-video', 'video-to-video'],
    creditCost: 60,
  },
  {
    id: 'veo31-fast',
    label: 'Veo3.1 Fast',
    description: 'Faster generation with good quality.',
    iconSrc: '/images/google_veo_logo.jpeg',
    workflows: ['text-to-video', 'image-to-video', 'video-to-video'],
    creditCost: 60,
  },
  {
    id: 'veo31-quality',
    label: 'Veo3.1 Quality',
    description: 'Higher quality with longer generation time.',
    iconSrc: '/images/google_veo_logo.jpeg',
    workflows: ['text-to-video', 'image-to-video', 'video-to-video'],
    creditCost: 250,
  },
  {
    id: 'nano-banana',
    label: 'Nano Banana',
    description: 'Fast image generation and editing.',
    iconSrc: '/logo-v2.png',
    workflows: ['text-to-image', 'image-editor'],
    creditCost: 12,
  },
  {
    id: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    description: 'Advanced image generation with extra controls.',
    iconSrc: '/logo-v2.png',
    workflows: ['text-to-image', 'image-editor'],
    creditCost: 24,
  },
];

export const getGenerationModelsForWorkflow = (workflow: GenerationWorkflow) =>
  generationModels.filter(model => model.workflows.includes(workflow));

export const getGenerationModel = (id: GenerationModelId) => {
  const model = generationModels.find(item => item.id === id);
  if (!model) {
    throw new Error(`Unknown generation model: ${id}`);
  }
  return model;
};

export const getGenerationModelCreditCost = (id: GenerationModelId) =>
  getGenerationModel(id).creditCost;

export interface VideoCreditInput {
  model?: string;
  veo3SubModel?: 'veo3_fast' | 'veo3';
  n_frames?: '10' | '15';
  quality?: 'standard' | 'high';
  wan26Duration?: '5' | '10' | '15';
  wan26Resolution?: '720p' | '1080p';
}

export const getVideoGenerationCreditCost = ({
  model,
  veo3SubModel,
  n_frames,
  quality,
}: VideoCreditInput): number => {
  if (model === 'veo3.1' || model === 'wan2.6') {
    return veo3SubModel === 'veo3' || quality === 'high' ? 250 : 60;
  }

  if (model === 'sora3-pro' || model === 'sora2-pro') {
    if (quality === 'high') return n_frames === '15' ? 650 : 350;
    return n_frames === '15' ? 270 : 150;
  }

  if (model === 'sora2') {
    return n_frames === '15' ? 50 : 40;
  }

  return n_frames === '15' ? 40 : 30;
};

export interface VideoModelState {
  model?: string;
  veo3SubModel?: 'veo3_fast' | 'veo3';
  veoDisplayModel?: 'gemini-omni-flash' | 'veo3.1';
}

export interface VideoModelPatch {
  model: 'veo3.1';
  veo3SubModel?: 'veo3_fast' | 'veo3';
  veoDisplayModel?: 'gemini-omni-flash' | 'veo3.1';
}

export const getVideoModelId = (state: VideoModelState): GenerationModelId => {
  if (state.veoDisplayModel === 'veo3.1' && state.veo3SubModel === 'veo3') return 'veo31-quality';
  if (state.veoDisplayModel === 'veo3.1') return 'veo31-fast';
  return 'gemini-omni-flash-fast';
};

export const getVideoModelPatch = (id: GenerationModelId): VideoModelPatch => {
  if (id === 'veo31-quality') {
    return {
      model: 'veo3.1',
      veo3SubModel: 'veo3',
      veoDisplayModel: 'veo3.1',
    };
  }

  if (id === 'veo31-fast') {
    return {
      model: 'veo3.1',
      veo3SubModel: 'veo3_fast',
      veoDisplayModel: 'veo3.1',
    };
  }

  return {
    model: 'veo3.1',
    veo3SubModel: 'veo3_fast',
    veoDisplayModel: 'gemini-omni-flash',
  };
};
