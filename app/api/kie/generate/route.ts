import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { refundCredits, debitCredits } from '@/lib/credits';
import { mapModelToKie } from '@/lib/kie';
import { callKieWithFallback, type KieRequestBody } from '@/lib/kie-fallback';
import { callSora2ProWithFallback, type Sora2ProRequestBody } from '@/lib/sora2pro-fallback';
import {
  createEvolinkVideoTask,
  mapAspectRatioToEvolink,
  mapQualityToEvolink,
  mapDurationToEvolink,
  type EvolinkTextToVideoRequest,
  type EvolinkImageToVideoRequest
} from '@/lib/evolink';

export const runtime = 'nodejs';

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE_URL = (process.env.KIE_API_BASE_URL || 'https://api.kie.ai').trim();
const APIMART_API_KEY = process.env.APIMART_API_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

if (!KIE_API_KEY) {
  console.error('KIE_API_KEY is not configured in server environment');
}

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  console.log(`[${requestId}] ========== KIE Generate Request Started ==========`);

  let creditsDeducted = false;
  let deductedAmount = 0;
  let userId = '';
  let prompt: string | undefined;
  let duration: number | undefined;
  let resolution: string | undefined;
  let model: string | undefined;

  try {
    // 1. Validate environment
    if (!KIE_API_KEY) {
      return NextResponse.json({ error: 'Kie API key not configured' }, { status: 500 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // 2. Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }
    ({ prompt, duration, resolution, model } = body);
    const { negative_prompt, aspect_ratio, style, image_url, n_frames, quality, wan26Duration, wan26Resolution, wan26MultiShots, wan26AspectRatio, imageUrls } = body;

    console.log(`[${requestId}] Request params:`, {
      has_prompt: !!prompt,
      duration, resolution, model, aspect_ratio,
      has_image_url: !!image_url
    });

    // 3. Validate required params
    if (!prompt || !duration || !resolution || !model) {
      return NextResponse.json(
        { error: 'Missing required parameters: prompt, duration, resolution, model' },
        { status: 400 }
      );
    }

    // 4. Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // 5. Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }
    userId = user.id;

    // 6. Credits check
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits_balance, credits_total, credits_spent, subscription_plan, subscription_status')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const final_n_frames_for_credits = n_frames && (n_frames === '10' || n_frames === '15')
      ? n_frames
      : (duration <= 10 ? '10' : '15');

    const requiredCredits = calculateCredits(duration, resolution, model, final_n_frames_for_credits, quality, wan26Duration, wan26Resolution);

    if (userData.credits_balance < requiredCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: requiredCredits,
          available: userData.credits_balance,
          details: 'Please purchase credits or subscribe to a plan'
        },
        { status: 402 }
      );
    }

    // Subscription check (warning only, non-blocking)
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (userData.credits_balance >= requiredCredits) {
      if (!subscription || subscription.status !== 'active') {
        console.warn(`[${requestId}] User ${user.id} has credits but subscription status is inactive`);
      }
    }

    // 7. Debit credits
    try {
      const debitResult = await debitCredits(
        userId,
        requiredCredits,
        'video_generation',
        { prompt, duration, resolution, model, status: 'processing', request_id: requestId }
      );
      creditsDeducted = true;
      deductedAmount = requiredCredits;
      console.log(`[${requestId}] Deducted ${requiredCredits} credits, new balance: ${debitResult.balance}`);
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
      }
      return NextResponse.json(
        { error: 'Failed to deduct credits', details: error instanceof Error ? error.message : 'Unknown error', hint: 'Please try again.' },
        { status: 500 }
      );
    }

    // 8. Determine KIE model
    const isImageToVideo = model === 'image-to-video' || model === 'sora2-pro-image-to-video' || model === 'sora2-image-to-video';

    let kieModel: string;
    if (model === 'sora2-pro-image-to-video') {
      kieModel = 'sora-2-pro-image-to-video';
    } else if (model === 'image-to-video') {
      kieModel = 'sora-2-image-to-video-stable';
    } else if (model === 'sora2-pro') {
      kieModel = 'sora-2-pro-text-to-video';
    } else if (model === 'sora-2-pro') {
      kieModel = 'sora-2-pro-text-to-video';
    } else if (model === 'sora-2-image-to-video-stable' || model === 'sora-2-stable-image-to-video') {
      kieModel = 'sora-2-image-to-video-stable';
    } else if (model === 'sora-2-text-to-video-stable' || model === 'sora-2-stable-text-to-video') {
      kieModel = 'sora-2-text-to-video-stable';
    } else if (model === 'wan2.6') {
      const hasWan26ImageInput = !!image_url || (Array.isArray(imageUrls) && imageUrls.length > 0);
      kieModel = hasWan26ImageInput ? 'wan/2-6-image-to-video' : 'wan/2-6-text-to-video';
    } else if (model === 'sora2-text-to-video' || model === 'sora2') {
      kieModel = isImageToVideo ? 'sora-2-image-to-video' : 'sora-2-text-to-video';
    } else if (model === 'sora2-image-to-video') {
      kieModel = 'sora-2-image-to-video';
    } else if (model === 'text-to-video' || model === 'sora3' || !model) {
      kieModel = 'sora-2-text-to-video-stable';
    } else {
      kieModel = mapModelToKie(model as 'sora3' | 'sora3-pro' | 'sora2' | 'sora2-pro' | undefined, isImageToVideo);
    }

    const final_n_frames: string = n_frames && (n_frames === '10' || n_frames === '15')
      ? String(n_frames)
      : (duration <= 10 ? '10' : '15');

    // Build request body
    const requestBody: any = {
      model: kieModel,
      input: {} as any,
    };

    // Wan2.6 model has different parameter structure
    if (kieModel === 'wan/2-6-text-to-video' || kieModel === 'wan/2-6-image-to-video') {
      requestBody.input = {
        prompt,
        duration: wan26Duration || '5',
        resolution: wan26Resolution || '1080p',
        multi_shots: wan26MultiShots !== undefined ? wan26MultiShots : false,
      };
    } else {
      requestBody.input = {
        prompt,
        aspect_ratio: aspect_ratio === '16:9' || aspect_ratio === '9:16'
          ? (aspect_ratio === '16:9' ? 'landscape' : 'portrait')
          : 'landscape',
        n_frames: final_n_frames,
        remove_watermark: true,
      };
    }

    // Add size param for sora2-pro
    if (kieModel === 'sora-2-pro-text-to-video' || kieModel === 'sora-2-pro-image-to-video') {
      if (quality === 'standard') {
        requestBody.input.size = 'standard';
      } else if (quality === 'high') {
        requestBody.input.size = 'high';
      } else {
        requestBody.input.size = kieModel === 'sora-2-pro-text-to-video' ? 'high' : 'standard';
      }
    }

    // Add image URLs for image-to-video modes
    if ((kieModel === 'sora-2-stable-image-to-video' || kieModel === 'sora-2-image-to-video-stable' || kieModel === 'sora-2-image-to-video' || kieModel === 'sora-2-pro-image-to-video' || kieModel === 'wan/2-6-image-to-video')) {
      const hasWan26ImageInput = !!image_url || (Array.isArray(imageUrls) && imageUrls.length > 0);
      const missingImageInput = kieModel === 'wan/2-6-image-to-video' ? !hasWan26ImageInput : !image_url;
      if (missingImageInput) {
        if (creditsDeducted) {
          try {
            await refundCredits(userId, deductedAmount, 'missing_image_url', { kieModel, request_id: requestId });
          } catch (refundError) {
            console.error(`[${requestId}] Failed to refund credits:`, refundError);
          }
        }
        return NextResponse.json(
          { error: 'Reference image URL is required for image to video mode', details: 'Please upload an image before generating the video' },
          { status: 400 }
        );
      }
      if (image_url) {
        requestBody.input.image_urls = [image_url];
      }
    }

    // Validate param types
    if (requestBody.input.n_frames && typeof requestBody.input.n_frames !== 'string') {
      requestBody.input.n_frames = String(requestBody.input.n_frames);
    }
    if (requestBody.input.aspect_ratio && typeof requestBody.input.aspect_ratio !== 'string') {
      requestBody.input.aspect_ratio = 'landscape';
    }
    if (requestBody.input.image_urls && !Array.isArray(requestBody.input.image_urls)) {
      requestBody.input.image_urls = [requestBody.input.image_urls];
    }

    const kieApiUrl = `${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/jobs/createTask`;

    // 9. Call API with fallback
    const isWan26Model = kieModel === 'wan/2-6-text-to-video' || kieModel === 'wan/2-6-image-to-video';
    const isSora2ProModel = kieModel === 'sora-2-pro-text-to-video' || kieModel === 'sora-2-pro-image-to-video';

    let apiResult: any;
    let taskId: string;
    let apiProvider: string;
    let fallbackUsed: boolean;
    let attemptCount: number;

    if (isWan26Model) {
      // Use Evolink API for Wan2.6
      console.log(`[${requestId}] Using Evolink API for Wan2.6`);

      const isI2V = kieModel === 'wan/2-6-image-to-video';
      const evolinkDuration = mapDurationToEvolink(wan26Duration);
      const evolinkQuality = mapQualityToEvolink(wan26Resolution);
      const evolinkAspectRatio = mapAspectRatioToEvolink(wan26AspectRatio || aspect_ratio || '16:9');

      if (isI2V) {
        const imageUrlsArray = imageUrls || (image_url ? [image_url] : []);
        if (!imageUrlsArray || imageUrlsArray.length === 0) {
          if (creditsDeducted) {
            try { await refundCredits(userId, deductedAmount, 'missing_image_url', { model: kieModel, request_id: requestId }); } catch {}
          }
          return NextResponse.json(
            { error: 'Reference image URL is required for image to video mode' },
            { status: 400 }
          );
        }
        const evolinkRequest: EvolinkImageToVideoRequest = {
          model: 'wan2.6-image-to-video',
          prompt: prompt!,
          image_urls: imageUrlsArray,
          aspect_ratio: evolinkAspectRatio,
          quality: evolinkQuality,
          duration: evolinkDuration,
          prompt_extend: true,
          model_params: { shot_type: wan26MultiShots ? 'multi' : 'single' }
        };
        const evolinkResult = await createEvolinkVideoTask(evolinkRequest);
        apiResult = { success: evolinkResult.success, error: evolinkResult.error, errorStatusCode: evolinkResult.statusCode };
        taskId = evolinkResult.taskId || '';
        apiProvider = 'evolink';
        fallbackUsed = false;
        attemptCount = 1;
      } else {
        const evolinkRequest: EvolinkTextToVideoRequest = {
          model: 'wan2.6-text-to-video',
          prompt: prompt!,
          aspect_ratio: evolinkAspectRatio,
          quality: evolinkQuality,
          duration: evolinkDuration,
          prompt_extend: true,
          model_params: { shot_type: wan26MultiShots ? 'multi' : 'single' }
        };
        const evolinkResult = await createEvolinkVideoTask(evolinkRequest);
        apiResult = { success: evolinkResult.success, error: evolinkResult.error, errorStatusCode: evolinkResult.statusCode };
        taskId = evolinkResult.taskId || '';
        apiProvider = 'evolink';
        fallbackUsed = false;
        attemptCount = 1;
      }
    } else if (isSora2ProModel && APIMART_API_KEY) {
      // Use sora2pro fallback (KIE -> apimart)
      console.log(`[${requestId}] Using sora2pro fallback (KIE -> apimart)`);
      const sora2ProResult = await callSora2ProWithFallback(kieApiUrl, KIE_API_KEY!, APIMART_API_KEY, requestBody as Sora2ProRequestBody);
      apiResult = sora2ProResult;
      taskId = sora2ProResult.taskId || '';
      apiProvider = sora2ProResult.provider;
      fallbackUsed = sora2ProResult.fallbackUsed;
      attemptCount = sora2ProResult.attemptCount;
    } else {
      // Use regular KIE fallback (sora2 -> wan2.5)
      console.log(`[${requestId}] Using regular KIE fallback (sora2 -> wan2.5)`);
      const kieResult = await callKieWithFallback(kieApiUrl, KIE_API_KEY!, requestBody as KieRequestBody);
      apiResult = kieResult;
      taskId = kieResult.taskId || '';
      apiProvider = kieResult.apiVersion || 'kie';
      fallbackUsed = kieResult.fallbackUsed;
      attemptCount = kieResult.attemptCount;
    }

    if (!apiResult.success || !taskId) {
      console.error(`[${requestId}] API failed (including fallback):`, apiResult.error);
      const isClientError = apiResult.errorStatusCode && apiResult.errorStatusCode >= 400 && apiResult.errorStatusCode < 500;

      if (creditsDeducted && !isClientError) {
        try {
          await refundCredits(userId, deductedAmount, 'api_failed', {
            api_error: apiResult.error, api_provider: apiProvider,
            fallback_used: fallbackUsed, attempt_count: attemptCount,
            request_id: requestId
          });
          console.log(`[${requestId}] Refunded ${deductedAmount} credits due to API failure`);
        } catch (refundError) {
          console.error(`[${requestId}] Failed to refund credits:`, refundError);
          try {
            await supabase.from('failed_generations').insert({
              user_id: userId, prompt, duration, resolution, model,
              credits_deducted: deductedAmount,
              error_message: `API failed: ${apiResult.error}`,
              status: 'pending'
            });
          } catch {}
        }
      }

      return NextResponse.json(
        {
          error: isClientError ? 'Invalid request parameters' : 'Video generation service temporarily unavailable',
          details: apiResult.error,
          credits_refunded: (creditsDeducted && !isClientError) ? deductedAmount : 0
        },
        { status: apiResult.errorStatusCode || 503 }
      );
    }

    console.log(`[${requestId}] Got taskId: ${taskId}, Provider: ${apiProvider}, Fallback: ${fallbackUsed}`);

    // 10. Save job to database
    const { error: jobError } = await supabase
      .from('video_jobs')
      .insert({
        job_id: taskId,
        user_id: user.id,
        prompt: prompt,
        image_url: image_url || null,
        aspect_ratio: aspect_ratio,
        duration: duration,
        status: 'processing',
        result_url: null,
        preview_url: null,
        error_message: null,
        cost_credits: requiredCredits,
        api_version: apiProvider,
        fallback_used: fallbackUsed,
        attempt_count: attemptCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (jobError) {
      console.error(`[${requestId}] Failed to save job:`, jobError.message);
    }

    // 11. Update credit transaction
    try {
      const { data: tx } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('transaction_type', 'debit')
        .eq('reason', 'video_generation')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tx?.id) {
        await supabase.from('credit_transactions').update({
          metadata: {
            generation_id: taskId, prompt, duration, resolution, model,
            api_provider: apiProvider, fallback_used: fallbackUsed,
            attempt_count: attemptCount, status: 'processing', request_id: requestId
          }
        }).eq('id', tx.id);
      }
    } catch (e) {
      console.error(`[${requestId}] Error updating transaction:`, e);
    }

    // 12. Return result
    const durationMs = Date.now() - startTime;
    console.log(`[${requestId}] Request completed in ${durationMs}ms`);

    return NextResponse.json({
      success: true,
      generation_id: taskId,
      status: 'processing',
      message: 'Video generation started successfully',
      credits_consumed: requiredCredits,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`[${requestId}] Request failed in ${durationMs}ms:`, error instanceof Error ? error.message : error);

    if (creditsDeducted && userId) {
      try {
        await refundCredits(userId, deductedAmount, 'generation_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          request_id: requestId
        });
      } catch (refundError) {
        console.error(`[${requestId}] Failed to refund:`, refundError);
        try {
          await supabase?.from('failed_generations').insert({
            user_id: userId, prompt: 'Unknown', duration: 0, resolution: 'Unknown', model: 'Unknown',
            credits_deducted: deductedAmount,
            error_message: `Generation error: ${error instanceof Error ? error.message : 'Unknown'}`,
            status: 'pending'
          });
        } catch {}
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let userFriendlyError = 'Internal server error';
    if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
      userFriendlyError = 'Invalid request format';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      userFriendlyError = 'Network error occurred';
    }

    return NextResponse.json(
      {
        error: userFriendlyError,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        credits_refunded: creditsDeducted ? deductedAmount : 0,
        request_id: requestId
      },
      { status: 500 }
    );
  }
}

// Credit calculation - keeps sora3 base pricing, adds Wan2.6
function calculateCredits(
  duration: number, resolution: string, model: string,
  n_frames?: '10' | '15', quality?: 'standard' | 'high',
  wan26Duration?: '5' | '10' | '15', wan26Resolution?: '720p' | '1080p'
): number {
  // Wan2.6 pricing
  if (model === 'wan2.6') {
    const durationKey = wan26Duration || '5';
    const resolutionKey = wan26Resolution || '1080p';
    const pricingTable: Record<'720p' | '1080p', Record<'5' | '10' | '15', number>> = {
      '720p': { '5': 80, '10': 160, '15': 220 },
      '1080p': { '5': 120, '10': 220, '15': 320 }
    };
    return pricingTable[resolutionKey][durationKey];
  }

  // Gemini Omni Flash Pro pricing
  if (model === 'sora2-pro' || model === 'sora3-pro') {
    if (quality === 'high') {
      return n_frames === '15' ? 650 : 350;
    } else if (quality === 'standard') {
      return n_frames === '15' ? 270 : 150;
    }
    return n_frames === '15' ? 270 : 150;
  }

  // Sora2 pricing: 10s=40, 15s=50
  if (model === 'sora2' || model === 'sora2-text-to-video' || model === 'sora2-image-to-video') {
    return n_frames === '15' ? 50 : 40;
  }

  // Gemini Omni Flash base pricing: 10s=30, 15s=40
  if (n_frames === '15') {
    return 40;
  }
  return 30;
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed.slice(0, -7);
  }
  return trimmed;
}
