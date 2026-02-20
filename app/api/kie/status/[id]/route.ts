import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapKieStateToJobStatus, parseResultJson } from '@/lib/kie';
import { isRetryableError } from '@/lib/kie-errors';
import { refundCredits } from '@/lib/credits';
import { getEvolinkTaskStatus } from '@/lib/evolink';

export const runtime = 'nodejs';

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE_URL = (process.env.KIE_API_BASE_URL || 'https://api.kie.ai').trim();
const APIMART_API_KEY = process.env.APIMART_API_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed.slice(0, -7);
  return trimmed;
}

function isVeo3Model(model?: string) {
  return model === 'veo3' || model === 'veo3_fast' || model === 'veo3.1';
}

function extractTaskIdFromResponse(response: any): string | undefined {
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

function isKieSuccessResponse(response: any): boolean {
  if (!response || typeof response !== 'object') return false;
  const code = (response.code ?? response.statusCode ?? response.status) as number | string | undefined;
  if (typeof code === 'number') {
    if (code === 200 || code === 0) return true;
    if (code >= 200 && code < 300) return true;
  }
  if (typeof code === 'string') {
    const parsed = Number.parseInt(code.trim(), 10);
    if (!Number.isNaN(parsed)) {
      if (parsed === 200 || parsed === 0) return true;
      if (parsed >= 200 && parsed < 300) return true;
    }
  }
  if (response.success === true) return true;
  if (typeof response.msg === 'string' && response.msg.trim().toLowerCase() === 'success') return true;
  return false;
}

function isRetryableFailure(failCode?: unknown, failMsg?: unknown): boolean {
  if (typeof failCode === 'string' && isRetryableError(failCode)) {
    return true;
  }
  if (typeof failMsg !== 'string' || !failMsg.trim()) return false;
  const msg = failMsg.toLowerCase();
  const keywords = [
    'heavy load',
    'not responding',
    'timeout',
    'timed out',
    'time out',
    'busy',
    'overload',
    'overloaded',
    'service unavailable',
    'temporary',
    'try again later',
    'rate limit',
    'too many requests',
    'gateway timeout',
  ];
  return keywords.some(k => msg.includes(k));
}

async function refundGenerationFailureOnce(params: {
  userId: string;
  generationId: string;
  amount: number;
  source: 'kie_status_standard' | 'kie_status_apimart';
  errorMessage?: string;
}) {
  const { userId, generationId, amount, source, errorMessage } = params;
  if (!supabase || !userId || !generationId || amount <= 0) {
    return false;
  }

  const knownRefundReasons = [
    'generation_failed',
    'refund_generation_failed',
    'generation_refund',
    'refund_generation_error',
    'refund_api_failed',
    'refund_veo3_generation_error',
    'refund_veo3_api_failed',
    'refund_veo3_missing_taskid',
    'refund_kie_api_failed',
    'refund_kie_api_error',
    'refund_unexpected_error',
  ];

  const { data: existingRefund, error: lookupError } = await supabase
    .from('credit_transactions')
    .select('id, reason')
    .eq('user_id', userId)
    .eq('transaction_type', 'credit')
    .in('reason', knownRefundReasons)
    .or(
      `metadata->>job_id.eq.${generationId},metadata->>generation_id.eq.${generationId},metadata->>refund_for.eq.${generationId},metadata->>storyboard_task_id.eq.${generationId}`
    )
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error('[KIE STATUS] Failed to check existing refund:', lookupError);
  }

  if (existingRefund) {
    console.log('[KIE STATUS] Skip duplicate refund:', {
      userId,
      generationId,
      refundReason: existingRefund.reason,
      source,
    });
    return false;
  }

  await refundCredits(userId, amount, 'generation_failed', {
    job_id: generationId,
    generation_id: generationId,
    source,
    error: errorMessage ?? null,
  });

  console.log('[KIE STATUS] Refunded credits for failed generation:', {
    userId,
    generationId,
    amount,
    source,
  });
  return true;
}

async function resolveGenerationCreditAmount(userId: string, generationId: string, fallbackAmount: number): Promise<number> {
  if (!supabase) {
    return Math.max(0, Number(fallbackAmount || 0));
  }

  const normalizedFallback = Math.max(0, Number(fallbackAmount || 0));
  if (normalizedFallback > 0) {
    return normalizedFallback;
  }

  const { data: debitTx, error } = await supabase
    .from('credit_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('transaction_type', 'debit')
    .or(`metadata->>job_id.eq.${generationId},metadata->>generation_id.eq.${generationId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[KIE STATUS] Failed to resolve credit amount from debit transaction:', error);
  }

  return Math.max(0, Number(debitTx?.amount || 0));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    if (!KIE_API_KEY) {
      return NextResponse.json({ error: 'Kie API key not configured' }, { status: 500 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
    }

    // Authenticate user via Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Check if this is a veo3.1 job or apimart job or evolink job by querying the database
    let isVeo3Job = false;
    let isApimartJob = false;
    let isEvolinkJob = false;
    let jobRecord: any = null;
    let fallbackTaskId: string | undefined;
    try {
      const { data: job } = await supabase
        .from('video_jobs')
        .select('params, api_version, fallback_used, attempt_count, prompt, image_url, aspect_ratio, duration, status, cost_credits, credit_cost')
        .eq('job_id', id)
        .eq('user_id', user.id)
        .single();

      if (job) {
        jobRecord = job;
        const apiVersion = job.api_version as string | undefined;

        // Check if this is an apimart job
        isApimartJob = apiVersion === 'apimart';

        // Check if this is an evolink job
        isEvolinkJob = apiVersion === 'evolink';

        if (job.params) {
          const params = job.params as any;
          fallbackTaskId = typeof params?.fallback_task_id === 'string' ? params.fallback_task_id : undefined;
          isVeo3Job =
            isVeo3Model(params.model) ||
            isVeo3Model(params.veo3Params?.model) ||
            params.veo3Params !== undefined ||
            id.startsWith('veo_task_') ||
            id.startsWith('veo_');
        } else {
          // Fallback: check if taskId starts with known veo3 prefixes
          isVeo3Job = id.startsWith('veo_task_') || id.startsWith('veo_');
        }
      }
    } catch (error) {
      console.warn('[KIE STATUS] Could not determine job type, defaulting to standard endpoint:', error);
    }

    const taskIdForStatus = fallbackTaskId || id;

    // Handle apimart jobs differently
    if (isApimartJob) {
      if (!APIMART_API_KEY) {
        console.error('[KIE STATUS] APIMART_API_KEY is missing for apimart job:', { jobId: id });
        return NextResponse.json(
          { error: 'apimart status service not configured' },
          { status: 503 }
        );
      }

      const finalizeApimartFailure = async (errorMessage: string, responseStatus: number, details?: unknown) => {
        try {
          const { error: updateError } = await supabase
            .from('video_jobs')
            .update({
              status: 'failed',
              error_message: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq('job_id', id);

          if (updateError) {
            console.error('[KIE STATUS] Failed to mark apimart job as failed:', updateError);
          }
        } catch (dbError) {
          console.error('[KIE STATUS] Database error while marking apimart failure:', dbError);
        }

        try {
          const refundAmount = await resolveGenerationCreditAmount(
            user.id,
            id,
            Number(jobRecord?.cost_credits ?? jobRecord?.credit_cost ?? 0)
          );
          await refundGenerationFailureOnce({
            userId: user.id,
            generationId: id,
            amount: refundAmount,
            source: 'kie_status_apimart',
            errorMessage,
          });
        } catch (refundError) {
          console.error('[KIE STATUS] Failed to refund apimart failed job:', refundError);
        }

        return NextResponse.json(
          {
            generation_id: id,
            status: 'failed',
            result_url: null,
            thumbnail_url: null,
            progress: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            error_message: errorMessage,
            details: details ?? null,
          },
          { status: responseStatus }
        );
      };

      console.log('🌐 Calling apimart API for task:', taskIdForStatus);

      const apimartUrl = `https://api.apimart.ai/v1/tasks/${encodeURIComponent(taskIdForStatus)}`;
      const apimartResp = await fetch(apimartUrl, {
        headers: {
          Authorization: `Bearer ${APIMART_API_KEY}`,
        },
        cache: 'no-store',
      });

      console.log('📡 apimart API response status:', apimartResp.status, apimartResp.statusText);

      if (!apimartResp.ok) {
        const text = await apimartResp.text();
        console.error('❌ apimart API error:', text);

        // Only finalize for terminal upstream errors to avoid premature refunds.
        if ([404, 410, 422].includes(apimartResp.status)) {
          return finalizeApimartFailure(`apimart status fetch failed: ${text}`, apimartResp.status, text);
        }

        return NextResponse.json(
          { error: 'apimart status fetch failed', details: text },
          { status: apimartResp.status }
        );
      }

      const apimartData = await apimartResp.json();
      console.log('🔍 apimart API Response:', JSON.stringify(apimartData, null, 2));

      // apimart response format: { code: 200, data: { id, status, progress, result: { videos: [{ url: [...] }] } } }
      if (apimartData?.code !== 200) {
        const message = apimartData.error?.message || 'apimart status fetch failed';

        const upstreamCode = Number(apimartData?.error?.code ?? apimartData?.code ?? 0);
        if ([404, 410, 422].includes(upstreamCode)) {
          return finalizeApimartFailure(message, 422, apimartData);
        }

        return NextResponse.json(
          { error: message, details: apimartData },
          { status: 422 }
        );
      }

      const apimartTaskData = apimartData.data;
      const apimartStatus = apimartTaskData.status; // pending, processing, completed, failed, cancelled
      const apimartProgress = apimartTaskData.progress || 0;
      const apimartResult = apimartTaskData.result;

      // Extract video URL from apimart response
      let videoUrl: string | undefined;
      if (apimartResult?.videos && Array.isArray(apimartResult.videos) && apimartResult.videos.length > 0) {
        const video = apimartResult.videos[0];
        if (video.url && Array.isArray(video.url) && video.url.length > 0) {
          videoUrl = video.url[0];
        }
      }

      // Map apimart status to our status
      let statusForClient: string;
      let calculatedProgress: number;
      let errorMessage: string | undefined;

      if (apimartStatus === 'completed') {
        statusForClient = 'completed';
        calculatedProgress = 100;
      } else if (apimartStatus === 'failed' || apimartStatus === 'cancelled') {
        statusForClient = 'failed';
        calculatedProgress = 0;
        errorMessage = apimartTaskData.error?.message || 'Video generation failed';
      } else {
        statusForClient = 'processing';
        calculatedProgress = apimartProgress;
      }

      // Update database
      const shouldUpdateDb = statusForClient === 'completed' || statusForClient === 'failed' || videoUrl;
      if (shouldUpdateDb) {
        try {
          const dbStatus = (statusForClient === 'completed' || videoUrl) ? 'completed' : 'failed';
          const { error: updateError } = await supabase
            .from('video_jobs')
            .update({
              status: dbStatus,
              result_url: videoUrl || null,
              error_message: errorMessage || null,
              updated_at: new Date().toISOString()
            })
            .eq('job_id', id);

          if (updateError) {
            console.error('❌ Failed to update job status in database:', updateError);
          }
        } catch (dbError) {
          console.error('❌ Database update error:', dbError);
        }
      }

      if (statusForClient === 'failed') {
        try {
          const refundAmount = await resolveGenerationCreditAmount(
            user.id,
            id,
            Number(jobRecord?.cost_credits ?? jobRecord?.credit_cost ?? 0)
          );
          await refundGenerationFailureOnce({
            userId: user.id,
            generationId: id,
            amount: refundAmount,
            source: 'kie_status_apimart',
            errorMessage,
          });
        } catch (refundError) {
          console.error('[KIE STATUS] Failed to refund apimart failed job:', refundError);
        }
      }

      const response = {
        generation_id: id,
        status: statusForClient,
        result_url: videoUrl,
        thumbnail_url: videoUrl,
        progress: calculatedProgress,
        created_at: apimartTaskData.created ? new Date(apimartTaskData.created * 1000).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: errorMessage,
      };

      console.log('📤 Final apimart response:', response);
      return NextResponse.json(response);
    }

    // Handle evolink jobs
    if (isEvolinkJob) {
      console.log('[KIE STATUS] Querying evolink status for job:', id);

      const evolinkResult = await getEvolinkTaskStatus(id);

      if (!evolinkResult.success || !evolinkResult.data) {
        console.error('[KIE STATUS] Evolink status query failed:', evolinkResult.error);
        return NextResponse.json(
          { error: evolinkResult.error || 'Failed to query evolink status' },
          { status: 503 }
        );
      }

      const evolinkData = evolinkResult.data;
      const evolinkStatus = evolinkData.status;
      const evolinkProgress = evolinkData.progress || 0;
      const evolinkResults = evolinkData.results;

      // Extract video URL from evolink response
      let videoUrl: string | undefined;
      if (evolinkResults && Array.isArray(evolinkResults) && evolinkResults.length > 0) {
        videoUrl = evolinkResults[0];
      }

      // Map evolink status to our status
      let statusForClient: string;
      let calculatedProgress: number;
      let errorMessage: string | undefined;

      if (evolinkStatus === 'completed') {
        statusForClient = 'completed';
        calculatedProgress = 100;
      } else if (evolinkStatus === 'failed') {
        statusForClient = 'failed';
        calculatedProgress = 0;
        errorMessage = 'Video generation failed';
      } else if (evolinkStatus === 'processing') {
        statusForClient = 'processing';
        calculatedProgress = evolinkProgress;
      } else {
        // pending
        statusForClient = 'processing';
        calculatedProgress = evolinkProgress;
      }

      // Update database
      const shouldUpdateDb = statusForClient === 'completed' || statusForClient === 'failed' || videoUrl;
      if (shouldUpdateDb) {
        try {
          const dbStatus = (statusForClient === 'completed' || videoUrl) ? 'completed' : 'failed';
          const { error: updateError } = await supabase
            .from('video_jobs')
            .update({
              status: dbStatus,
              result_url: videoUrl || null,
              error_message: errorMessage || null,
              updated_at: new Date().toISOString()
            })
            .eq('job_id', id);

          if (updateError) {
            console.error('❌ Failed to update job status in database:', updateError);
          }
        } catch (dbError) {
          console.error('❌ Database update error:', dbError);
        }
      }

      if (statusForClient === 'failed') {
        try {
          const refundAmount = await resolveGenerationCreditAmount(
            user.id,
            id,
            Number(jobRecord?.cost_credits ?? jobRecord?.credit_cost ?? 0)
          );
          await refundGenerationFailureOnce({
            userId: user.id,
            generationId: id,
            amount: refundAmount,
            source: 'kie_status_standard',
            errorMessage,
          });
        } catch (refundError) {
          console.error('[KIE STATUS] Failed to refund evolink failed job:', refundError);
        }
      }

      const response = {
        generation_id: id,
        status: statusForClient,
        result_url: videoUrl,
        thumbnail_url: videoUrl,
        progress: calculatedProgress,
        created_at: evolinkData.created ? new Date(evolinkData.created * 1000).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: errorMessage,
      };

      console.log('📤 Final evolink response:', response);
      return NextResponse.json(response);
    }

    // Use different endpoints for veo3.1 vs standard jobs
    const url = isVeo3Job
      ? `${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/veo/record-info?taskId=${encodeURIComponent(taskIdForStatus)}`
      : `${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskIdForStatus)}`;

    console.log('🌐 Calling KIE API:', url, `(isVeo3: ${isVeo3Job})`, `(taskIdForStatus: ${taskIdForStatus})`);

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
      },
      cache: 'no-store',
    });

    console.log('📡 KIE API response status:', resp.status, resp.statusText);

    if (!resp.ok) {
      const text = await resp.text();
      console.error('❌ KIE API error:', text);
      return NextResponse.json(
        { error: 'Kie status fetch failed', details: text },
        { status: resp.status }
      );
    }

    const data = await resp.json();

    console.log('🔍 KIE API Response:', JSON.stringify(data, null, 2));

    if (data?.code && data.code !== 200) {
      const message = typeof data.msg === 'string' ? data.msg : 'Kie status fetch failed';
      const status = message === 'recordInfo is null' ? 404 : 422;
      return NextResponse.json(
        { error: message, details: data },
        { status }
      );
    }

    // Handle veo3.1 response format differently
    let payload: Record<string, unknown> = {};
    let successFlag: number | undefined;
    let veoMsg: string | undefined;
    let veoResultUrlsRaw: unknown;

    if (isVeo3Job && data?.data) {
      const veoData = data.data as Record<string, unknown>;
      successFlag = veoData.successFlag as number | undefined;
      veoMsg = data.msg as string | undefined;
      const responseData = (veoData.response ?? {}) as Record<string, unknown>;
      const resultUrlsRaw = responseData.resultUrls as unknown;
      veoResultUrlsRaw = resultUrlsRaw;
      const originUrlsRaw = responseData.originUrls as unknown;
      const resolution = responseData.resolution as string | undefined;
      const fallbackFlag = veoData.fallbackFlag as boolean | undefined;
      const errorMessage = veoData.errorMessage as string | undefined;

      payload = {
        state: successFlag === 1 ? 'success' : successFlag === 2 || successFlag === 3 ? 'fail' : 'processing',
        resultJson: resultUrlsRaw || originUrlsRaw || resolution ? JSON.stringify({
          resultUrls: resultUrlsRaw,
          originUrls: originUrlsRaw,
          resolution,
          fallbackFlag
        }) : undefined,
        msg: veoMsg,
        failMsg: successFlag === 2 || successFlag === 3 ? (errorMessage || veoMsg || 'Video generation failed') : undefined,
      };
    } else {
      payload = data?.data ?? {};
    }

    const {
      state,
      status: statusField,
      taskStatus,
      taskState,
      resultJson,
      result,
      resultUrl,
      mediaUrl,
      resourceUrl,
      progress,
      error,
      errorMessage,
      errorMsg,
      message,
      msg,
      failMsg,
      failCode,
      createTime,
    } = payload as Record<string, unknown>;

    const resolvedState = (state ?? statusField ?? taskStatus ?? taskState) as string | undefined;
    const mapped = mapKieStateToJobStatus(resolvedState);

    // For veo3.1, parse resultUrls directly
    let resultPayload: { resultUrls?: string[]; resultUrl?: string; [key: string]: any } = {};
    if (isVeo3Job && veoResultUrlsRaw) {
      const parsedUrls = Array.isArray(veoResultUrlsRaw)
        ? veoResultUrlsRaw
        : [veoResultUrlsRaw].filter(Boolean);
      resultPayload.resultUrls = parsedUrls as string[];
      if (resultPayload.resultUrls.length > 0) {
        resultPayload.resultUrl = resultPayload.resultUrls[0];
      }
    } else {
      const inputForParsing = (resultJson ?? result ?? payload) as string | Record<string, unknown> | undefined;
      resultPayload = parseResultJson(inputForParsing);
    }

    // Extract error message - prioritize KIE API's failMsg
    let extractedErrorMessage = typeof failMsg === 'string' ? failMsg
      : typeof error === 'string' ? error
      : typeof errorMessage === 'string' ? errorMessage
      : typeof errorMsg === 'string' ? errorMsg
      : typeof message === 'string' ? message
      : typeof msg === 'string' ? msg
      : typeof veoMsg === 'string' && (successFlag === 2 || successFlag === 3) ? veoMsg
      : undefined;

    // Extract video URL - enhanced version
    // Priority: resultUrls (no watermark) > resultWaterMarkUrls (with watermark)
    let primaryUrl = resultPayload.resultUrls?.[0]
      ?? resultPayload.resultWaterMarkUrls?.[0]
      ?? resultPayload.resultUrl
      ?? resultPayload.mediaUrl
      ?? resultPayload.resourceUrl
      ?? resultPayload.videoUrl
      ?? resultPayload.outputUrl
      ?? resultPayload.downloadUrl
      ?? resultPayload.fileUrl
      ?? resultPayload.url
      ?? (typeof resultUrl === 'string' ? resultUrl : undefined)
      ?? (typeof mediaUrl === 'string' ? mediaUrl : undefined)
      ?? (typeof resourceUrl === 'string' ? resourceUrl : undefined);

    // If no URL found yet, try re-parsing resultJson
    if (!primaryUrl && resultJson) {
      try {
        if (typeof resultJson === 'string' && resultJson.trim().length > 0) {
          if (resultJson.trim() !== '{}' && resultJson.trim() !== '[]') {
            const reparsedPayload = parseResultJson(resultJson);
            primaryUrl = reparsedPayload.resultUrls?.[0]
              ?? reparsedPayload.resultWaterMarkUrls?.[0]
              ?? reparsedPayload.resultUrl
              ?? reparsedPayload.mediaUrl
              ?? reparsedPayload.videoUrl
              ?? reparsedPayload.url
              ?? reparsedPayload.outputUrl
              ?? reparsedPayload.downloadUrl
              ?? reparsedPayload.fileUrl
              ?? reparsedPayload.resourceUrl;
          }
        } else if (typeof resultJson === 'object' && !Array.isArray(resultJson)) {
          const obj = resultJson as Record<string, unknown>;
          if ('resultUrls' in obj && Array.isArray(obj.resultUrls) && obj.resultUrls.length > 0) {
            const url = obj.resultUrls[0];
            if (typeof url === 'string' && url.trim().length > 0) {
              primaryUrl = url.trim();
            }
          } else if ('resultWaterMarkUrls' in obj && Array.isArray(obj.resultWaterMarkUrls) && obj.resultWaterMarkUrls.length > 0) {
            const url = obj.resultWaterMarkUrls[0];
            if (typeof url === 'string' && url.trim().length > 0) {
              primaryUrl = url.trim();
            }
          } else if ('resultUrl' in obj && typeof obj.resultUrl === 'string' && obj.resultUrl.trim().length > 0) {
            primaryUrl = obj.resultUrl.trim();
          } else if ('url' in obj && typeof obj.url === 'string' && obj.url.trim().length > 0) {
            primaryUrl = obj.url.trim();
          } else if ('mediaUrl' in obj && typeof obj.mediaUrl === 'string' && obj.mediaUrl.trim().length > 0) {
            primaryUrl = obj.mediaUrl.trim();
          }
        } else if (Array.isArray(resultJson) && resultJson.length > 0 && typeof resultJson[0] === 'string' && resultJson[0].trim().length > 0) {
          primaryUrl = resultJson[0].trim();
        }
      } catch (e) {
        console.error('❌ Failed to parse resultJson:', e);
      }
    }

    // Determine status for client
    let statusForClient: string;
    let calculatedProgress: number | undefined = typeof progress === 'number' ? progress : undefined;

    const isKieSuccess = resolvedState === 'success';

    if (primaryUrl || isKieSuccess) {
      statusForClient = 'completed';
      calculatedProgress = 100;
    } else if (mapped === 'completed') {
      statusForClient = 'completed';
      calculatedProgress = 100;
    } else if (mapped === 'failed') {
      statusForClient = 'failed';
      calculatedProgress = 0;
    } else {
      statusForClient = 'processing';
      if (calculatedProgress === undefined) {
        const createdAt = typeof createTime === 'number' ? new Date(createTime) : new Date();
        const elapsedSeconds = Math.max(0, (Date.now() - createdAt.getTime()) / 1000);
        if (elapsedSeconds < 30) {
          calculatedProgress = Math.min(20, (elapsedSeconds / 30) * 20);
        } else if (elapsedSeconds < 60) {
          calculatedProgress = 20 + ((elapsedSeconds - 30) / 30) * 20;
        } else if (elapsedSeconds < 90) {
          calculatedProgress = 40 + ((elapsedSeconds - 60) / 30) * 20;
        } else if (elapsedSeconds < 120) {
          calculatedProgress = 60 + ((elapsedSeconds - 90) / 30) * 20;
        } else if (elapsedSeconds < 150) {
          calculatedProgress = 80 + ((elapsedSeconds - 120) / 30) * 15;
        } else if (elapsedSeconds < 180) {
          calculatedProgress = 95;
        } else if (elapsedSeconds < 240) {
          calculatedProgress = 95 + ((elapsedSeconds - 180) / 60) * 3;
        } else {
          calculatedProgress = 98;
        }
      }
    }

    const createdAt = typeof createTime === 'number'
      ? new Date(createTime).toISOString()
      : new Date().toISOString();

    // Handle retryable failures with fallback to stable model
    if (statusForClient === 'failed' && !isVeo3Job) {
      const retryable = isRetryableFailure(failCode, extractedErrorMessage);
      const apiVersion = jobRecord?.api_version as string | undefined;
      const fallbackUsed = Boolean(jobRecord?.fallback_used);
      const attemptCount = typeof jobRecord?.attempt_count === 'number' ? jobRecord.attempt_count : 1;
      const canFallback = retryable &&
        !fallbackUsed &&
        attemptCount < 2 &&
        (apiVersion === undefined || apiVersion === 'regular') &&
        !fallbackTaskId;

      if (canFallback && jobRecord?.prompt) {
        const stableModel = jobRecord?.image_url
          ? 'wan/2-5-image-to-video'
          : 'wan/2-5-text-to-video';
        const duration = '10';
        const aspectRatio = jobRecord?.aspect_ratio === 'landscape' ? '16:9' :
                           jobRecord?.aspect_ratio === 'portrait' ? '9:16' :
                           jobRecord?.aspect_ratio || '16:9';
        const requestBody = {
          model: stableModel,
          input: {
            prompt: jobRecord.prompt,
            aspect_ratio: aspectRatio,
            duration: duration,
            resolution: '1080p',
            ...(jobRecord?.image_url ? { image_url: jobRecord.image_url } : {})
          }
        };

        try {
          const existingParams = (jobRecord?.params && typeof jobRecord.params === 'object') ? jobRecord.params : {};
          const lockParams = {
            ...existingParams,
            fallback_lock: requestId,
            fallback_lock_at: new Date().toISOString(),
          };

          // Acquire a lock to prevent duplicate fallback under concurrent polling
          const { data: lockRow, error: lockError } = await supabase
            .from('video_jobs')
            .update({
              fallback_used: true,
              attempt_count: attemptCount + 1,
              params: lockParams,
              updated_at: new Date().toISOString(),
            })
            .eq('job_id', id)
            .eq('fallback_used', false)
            .eq('attempt_count', attemptCount)
            .select('job_id')
            .maybeSingle();

          if (lockError) {
            console.error(`[${requestId}] ❌ Failed to acquire fallback lock:`, lockError);
          }

          if (lockRow?.job_id) {
            const createUrl = `${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/jobs/createTask`;
            console.log(`[${requestId}] ⚠️ Retryable failure detected, creating stable task:`, {
              original_task_id: id,
              stableModel,
              createUrl
            });
            const createResp = await fetch(createUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIE_API_KEY}`,
                'X-API-Key': KIE_API_KEY
              },
              body: JSON.stringify(requestBody)
            });

            const createData = await createResp.json().catch(() => ({}));
            if (createResp.ok && isKieSuccessResponse(createData)) {
              const newTaskId = extractTaskIdFromResponse(createData);
              if (newTaskId) {
                const updatedParams = {
                  ...lockParams,
                  fallback_task_id: newTaskId,
                  original_task_id: id,
                  fallback_started_at: new Date().toISOString(),
                  fallback_reason: extractedErrorMessage || 'retryable_failure'
                };

                await supabase
                  .from('video_jobs')
                  .update({
                    status: 'processing',
                    api_version: 'wan2.5',
                    fallback_used: true,
                    params: updatedParams,
                    updated_at: new Date().toISOString(),
                    error_message: null
                  })
                  .eq('job_id', id);

                console.log(`[${requestId}] ✅ Fallback task created:`, { newTaskId, originalTaskId: id });

                statusForClient = 'processing';
                calculatedProgress = 0;
                primaryUrl = undefined;
                extractedErrorMessage = undefined;
              } else {
                console.error(`[${requestId}] ❌ Fallback createTask succeeded but taskId missing:`, createData);
              }
            } else {
              console.error(`[${requestId}] ❌ Fallback createTask failed:`, {
                status: createResp.status,
                response: createData
              });

              // Release lock if creation failed
              const releaseParams = { ...lockParams };
              delete releaseParams.fallback_lock;
              delete releaseParams.fallback_lock_at;
              await supabase
                .from('video_jobs')
                .update({
                  fallback_used: false,
                  attempt_count: attemptCount,
                  params: releaseParams,
                  updated_at: new Date().toISOString(),
                })
                .eq('job_id', id)
                .eq('fallback_used', true)
                .eq('attempt_count', attemptCount + 1);
            }
          }
        } catch (fallbackError) {
          console.error(`[${requestId}] ❌ Fallback createTask error:`, fallbackError);

          // Release lock if creation threw
          const existingParams = (jobRecord?.params && typeof jobRecord.params === 'object') ? jobRecord.params : {};
          const releaseParams = { ...existingParams };
          delete releaseParams.fallback_lock;
          delete releaseParams.fallback_lock_at;
          await supabase
            .from('video_jobs')
            .update({
              fallback_used: false,
              attempt_count: attemptCount,
              params: releaseParams,
              updated_at: new Date().toISOString(),
            })
            .eq('job_id', id)
            .eq('fallback_used', true)
            .eq('attempt_count', attemptCount + 1);
        }
      }
    }

    const shouldUpdateDb = statusForClient === 'completed' || statusForClient === 'failed' || primaryUrl || isKieSuccess;
    if (shouldUpdateDb) {
      try {
        const dbStatus = (statusForClient === 'completed' || primaryUrl || isKieSuccess) ? 'completed' : 'failed';
        const { error: updateError } = await supabase
          .from('video_jobs')
          .update({
            status: dbStatus,
            result_url: primaryUrl || null,
            error_message: extractedErrorMessage || null,
            updated_at: new Date().toISOString()
          })
          .eq('job_id', id);

        if (updateError) {
          console.error('❌ Failed to update job status in database:', updateError);
        }
      } catch (dbError) {
        console.error('❌ Database update error:', dbError);
      }
    }

    if (statusForClient === 'failed') {
      try {
        const refundAmount = await resolveGenerationCreditAmount(
          user.id,
          id,
          Number(jobRecord?.cost_credits ?? jobRecord?.credit_cost ?? 0)
        );
        await refundGenerationFailureOnce({
          userId: user.id,
          generationId: id,
          amount: refundAmount,
          source: 'kie_status_standard',
          errorMessage: extractedErrorMessage,
        });
      } catch (refundError) {
        console.error('[KIE STATUS] Failed to refund KIE failed job:', refundError);
      }
    }

    const response = {
      generation_id: id,
      status: statusForClient,
      result_url: primaryUrl,
      thumbnail_url: primaryUrl,
      progress: calculatedProgress,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
      error_message: extractedErrorMessage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[KIE STATUS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
