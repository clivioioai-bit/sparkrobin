import { GenerationModelId, GenerationWorkflow } from '@/config/generation-models';
import { ReframeParams, Sora3Params } from '@/types/generation-modes';
import { AspectRatio, CreateJobRequest, Duration } from '@/types/jobs';
import { GenerateImageRequest } from '@/services/imageApi';

type UploadVideoFn = (file: File, userId: string) => Promise<string>;

type TranslateFn = (key: string) => string;

const toVideoAspectRatio = (value?: string): AspectRatio => {
  if (value === '9:16') return '9:16';
  if (value === '1:1') return '1:1';
  return '16:9';
};

export const buildTextToVideoRequest = (params: Sora3Params): CreateJobRequest => {
  const aspectRatio = params.aspectRatio === 'Auto' ? '16:9' : params.aspectRatio;

  if (params.model === 'veo3.1') {
    return {
      prompt: params.prompt.trim(),
      duration_sec: 8 as Duration,
      aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
      cfg_scale: 7,
      model: 'veo3.1',
      veo3Params: {
        model: params.veo3SubModel || 'veo3_fast',
        generationType: 'TEXT_2_VIDEO',
        seeds: params.seeds,
        enableTranslation: true,
      },
    };
  }

  return {
    prompt: params.prompt.trim(),
    negative_prompt: params.negative_prompt?.trim(),
    duration_sec: (params.duration || 8) as Duration,
    aspect_ratio: toVideoAspectRatio(aspectRatio),
    cfg_scale: 7,
    model: params.model || 'sora3',
    n_frames: params.n_frames,
    quality: params.quality,
  };
};

export const buildImageToVideoRequest = async (
  params: ReframeParams,
  options: {
    userId: string;
    uploadVideo: UploadVideoFn;
    t: TranslateFn;
  }
): Promise<CreateJobRequest> => {
  if (params.model === 'veo3.1') {
    const imageUrls: string[] = [];

    if (params.startFrame) {
      try {
        imageUrls.push(await options.uploadVideo(params.startFrame, options.userId));
      } catch (uploadError) {
        throw new Error(`Failed to upload start frame: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }
    }

    if (params.endFrame) {
      try {
        imageUrls.push(await options.uploadVideo(params.endFrame, options.userId));
      } catch (uploadError) {
        throw new Error(`Failed to upload end frame: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }
    }

    if (imageUrls.length === 0) {
      throw new Error(options.t('errors.atLeastOneImageRequired'));
    }

    return {
      prompt: params.prompt?.trim() || options.t('defaultPrompts.smoothTransition'),
      duration_sec: 8 as Duration,
      aspect_ratio: params.targetAspectRatio === '9:16' ? '9:16' : '16:9',
      cfg_scale: 7,
      model: 'veo3.1',
      veo3Params: {
        model: params.veo3SubModel || 'veo3_fast',
        generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
        imageUrls,
        seeds: params.seeds,
        enableTranslation: true,
      },
    };
  }

  if (!params.sourceVideo) {
    throw new Error(options.t('errors.referenceImageUrlRequired'));
  }

  let mediaUrl: string | undefined;
  try {
    mediaUrl = await options.uploadVideo(params.sourceVideo, options.userId);
  } catch (uploadError) {
    const errorMsg = uploadError instanceof Error ? uploadError.message : 'Unknown error';
    if (errorMsg.includes('Failed to upload') || errorMsg.includes('Permission') || errorMsg.includes('too large')) {
      throw new Error(errorMsg);
    }
    throw new Error(`Failed to upload reference image: ${errorMsg}`);
  }

  if (!mediaUrl) {
    throw new Error(options.t('errors.referenceImageUrlRequired'));
  }

  return {
    prompt: params.prompt?.trim() || options.t('defaultPrompts.smoothAnimation'),
    duration_sec: 8,
    aspect_ratio: params.targetAspectRatio === '9:16' ? '9:16' : '16:9',
    cfg_scale: 7,
    reference_image_url: mediaUrl,
    model: params.model || 'sora3',
    n_frames: params.n_frames,
    quality: params.quality,
    wan26Duration: params.wan26Duration,
    wan26Resolution: params.wan26Resolution,
    wan26MultiShots: params.wan26MultiShots,
    wan26AspectRatio: params.wan26AspectRatio,
    imageUrls: [mediaUrl],
  };
};

const getImageProviderModel = (
  workflow: GenerationWorkflow,
  modelId: GenerationModelId
): GenerateImageRequest['model'] => {
  if (modelId === 'nano-banana-pro') return 'nano-banana-pro';
  return workflow === 'image-editor' ? 'nano-banana-image-editor' : 'nano-banana-text-to-image';
};

export const buildImageGenerationRequest = (input: {
  workflow: GenerationWorkflow;
  modelId: GenerationModelId;
  prompt: string;
  outputFormat: 'png' | 'jpeg';
  imageSize: string;
  aspectRatio: string;
  resolution: '1K' | '2K' | '4K';
  imageUrls: string[];
}): GenerateImageRequest => {
  const request: GenerateImageRequest = {
    prompt: input.prompt.trim(),
    model: getImageProviderModel(input.workflow, input.modelId),
    output_format: input.outputFormat === 'jpeg' ? 'jpeg' : 'png',
  };

  if (input.modelId === 'nano-banana-pro') {
    request.aspect_ratio = input.aspectRatio;
    request.resolution = input.resolution;
    if (input.imageUrls.length > 0) {
      request.image_input = input.imageUrls;
    }
    return request;
  }

  if (input.workflow === 'text-to-image') {
    request.image_size = input.imageSize;
    return request;
  }

  request.aspect_ratio = input.aspectRatio;
  if (input.imageUrls.length > 0) {
    request.image_input = input.imageUrls;
  }
  return request;
};
