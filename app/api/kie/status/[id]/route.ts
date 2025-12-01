import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapKieStateToJobStatus, parseResultJson } from '@/lib/kie';

export const runtime = 'nodejs';

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE_URL = (process.env.KIE_API_BASE_URL || 'https://api.kie.ai').trim();

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Authenticate user via Bearer token (same pattern as /api/kie/generate)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Query Kie API for status
    const url = `${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(id)}`;
    console.log('🌐 Calling KIE API:', url);
    
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
        'X-API-Key': KIE_API_KEY,
      },
      // Avoid Next caching
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

    const payload = data?.data ?? {};
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
      failMsg,       // ← 添加 KIE API 的失败消息字段
      failCode,      // ← 添加 KIE API 的失败代码字段
      createTime,
    } = payload as Record<string, unknown>;

    console.log('📊 Extracted fields:', {
      state,
      statusField,
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
      failMsg,      // ← 显示 KIE API 失败消息
      failCode      // ← 显示 KIE API 失败代码
    });

    const resolvedState = (state ?? statusField ?? taskStatus ?? taskState) as string | undefined;
    const mapped = mapKieStateToJobStatus(resolvedState);
    
    // 详细记录 resultJson 的原始值和类型
    console.log('📦 Raw resultJson:', {
      resultJson,
      resultJsonType: typeof resultJson,
      resultJsonIsString: typeof resultJson === 'string',
      resultJsonLength: typeof resultJson === 'string' ? resultJson.length : 'N/A',
      resultJsonPreview: typeof resultJson === 'string' ? resultJson.substring(0, 200) : resultJson
    });
    
    const resultPayload = parseResultJson((resultJson ?? result) as string | Record<string, unknown> | undefined);
    
    // 提取错误信息 - 优先使用 KIE API 的 failMsg
    const extractedErrorMessage = typeof failMsg === 'string' ? failMsg
      : typeof error === 'string' ? error
      : typeof errorMessage === 'string' ? errorMessage
      : typeof errorMsg === 'string' ? errorMsg
      : typeof message === 'string' ? message
      : typeof msg === 'string' ? msg
      : undefined;
    
    console.log('🔄 Processing results:', {
      resolvedState,
      mapped,
      resultPayload,
      resultPayloadResultUrls: resultPayload.resultUrls,
      resultPayloadResultUrlsLength: resultPayload.resultUrls?.length,
      rawResultJson: resultJson,
      rawResult: result
    });

    // 尝试多种方式提取视频URL - 增强版
    // 关键：优先使用 resultUrls（无水印版本），如果没有则使用 resultWaterMarkUrls（带水印版本）
    let primaryUrl = resultPayload.resultUrls?.[0]  // 最优先：无水印版本
      ?? resultPayload.resultWaterMarkUrls?.[0]     // 备选：带水印版本
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
    
    console.log('🎯 Primary URL selection:', {
      fromResultUrls: resultPayload.resultUrls?.[0] ? resultPayload.resultUrls[0].substring(0, 80) + '...' : 'N/A',
      fromWatermarkUrls: resultPayload.resultWaterMarkUrls?.[0] ? resultPayload.resultWaterMarkUrls[0].substring(0, 80) + '...' : 'N/A',
      finalPrimaryUrl: primaryUrl ? primaryUrl.substring(0, 80) + '...' : 'N/A',
      isUsingWatermark: !!resultPayload.resultWaterMarkUrls?.[0] && !resultPayload.resultUrls?.[0]
    });
    
    // 如果还没有找到 URL，尝试直接解析 resultJson 字符串（增强版）
    if (!primaryUrl && resultJson) {
      try {
        let parsed = resultJson;
        
        // 如果是字符串，先解析
        if (typeof resultJson === 'string' && resultJson.trim().length > 0) {
          // 过滤掉可能的空字符串或只包含空白的字符串
          if (resultJson.trim() !== '{}' && resultJson.trim() !== '[]') {
            parsed = JSON.parse(resultJson);
          } else {
            console.log('⚠️ resultJson is empty object or array');
            parsed = null;
          }
        }
        
        console.log('🔍 Parsed resultJson:', {
          parsed,
          parsedType: typeof parsed,
          isArray: Array.isArray(parsed),
          hasResultUrls: parsed && typeof parsed === 'object' && 'resultUrls' in parsed,
          resultUrls: parsed?.resultUrls
        });
        
        if (!parsed) {
          // resultJson 是空的，跳过
        }
        // 如果解析结果是对象且包含 resultUrls 数组
        else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // 最优先：检查 resultUrls 字段（无水印版本）
          if ('resultUrls' in parsed) {
            const urls = parsed.resultUrls;
            if (Array.isArray(urls) && urls.length > 0 && typeof urls[0] === 'string' && urls[0].trim().length > 0) {
              primaryUrl = urls[0].trim();
              console.log('🎯 Found URL in resultUrls (no watermark):', primaryUrl.substring(0, 80) + '...');
            }
          }
          // 备选：检查 resultWaterMarkUrls 字段（带水印版本）
          else if ('resultWaterMarkUrls' in parsed) {
            const watermarkUrls = parsed.resultWaterMarkUrls;
            if (Array.isArray(watermarkUrls) && watermarkUrls.length > 0 && typeof watermarkUrls[0] === 'string' && watermarkUrls[0].trim().length > 0) {
              primaryUrl = watermarkUrls[0].trim();
              console.log('⚠️ Using URL from resultWaterMarkUrls (with watermark):', primaryUrl.substring(0, 80) + '...');
            }
          }
          // 也检查其他可能的字段名
          else if ('resultUrl' in parsed && typeof parsed.resultUrl === 'string' && parsed.resultUrl.trim().length > 0) {
            primaryUrl = parsed.resultUrl.trim();
            console.log('🎯 Found URL in resultUrl field:', primaryUrl.substring(0, 80) + '...');
          }
          else if ('url' in parsed && typeof parsed.url === 'string' && parsed.url.trim().length > 0) {
            primaryUrl = parsed.url.trim();
            console.log('🎯 Found URL in url field:', primaryUrl.substring(0, 80) + '...');
          }
          else if ('mediaUrl' in parsed && typeof parsed.mediaUrl === 'string' && parsed.mediaUrl.trim().length > 0) {
            primaryUrl = parsed.mediaUrl.trim();
            console.log('🎯 Found URL in mediaUrl field:', primaryUrl.substring(0, 80) + '...');
          }
        }
        // 如果解析结果是数组格式
        else if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string' && parsed[0].trim().length > 0) {
          primaryUrl = parsed[0].trim();
          console.log('🎯 Found URL in array format:', primaryUrl);
        }
      } catch (e) {
        console.error('❌ Failed to parse resultJson:', e, 'Raw value:', typeof resultJson === 'string' ? resultJson.substring(0, 200) : resultJson);
      }
    }
    
    console.log('🎯 URL extraction:', {
      primaryUrl,
      resultPayloadResultUrls: resultPayload.resultUrls,
      resultPayloadResultUrl: resultPayload.resultUrl,
      resultPayloadMediaUrl: resultPayload.mediaUrl,
      resultPayloadResourceUrl: resultPayload.resourceUrl,
      resultPayloadVideoUrl: resultPayload.videoUrl,
      resultPayloadOutputUrl: resultPayload.outputUrl,
      resultPayloadDownloadUrl: resultPayload.downloadUrl,
      resultPayloadFileUrl: resultPayload.fileUrl,
      resultPayloadUrl: resultPayload.url,
      directResultUrl: resultUrl,
      directMediaUrl: mediaUrl,
      directResourceUrl: resourceUrl
    });

    // Conform to frontend expectations in src/services/videoApi.ts
    // It checks for status === 'completed' | 'success' or presence of video_url
    // 根据 KIE API 文档：当 state 是 'success' 时，resultJson 包含结果
    // 如果有视频URL，无论状态如何，都应该视为已完成
    let statusForClient: string;
    let calculatedProgress: number | undefined = typeof progress === 'number' ? progress : undefined;
    
    // 根据 KIE API 文档，state 为 'success' 时表示任务完成
    const isKieSuccess = resolvedState === 'success';
    
    if (primaryUrl || isKieSuccess) {
      // 如果有视频URL或 KIE API 返回 success 状态，强制设置为 completed 和 100%
      statusForClient = 'completed';
      calculatedProgress = 100;
      console.log('✅ Video URL found or KIE state is success, forcing status to completed and progress to 100%:', {
        primaryUrl: primaryUrl ? primaryUrl.substring(0, 50) + '...' : 'N/A',
        isKieSuccess: isKieSuccess,
        resolvedState: resolvedState,
        originalMappedStatus: mapped
      });
    } else if (mapped === 'completed') {
      statusForClient = 'completed';
      calculatedProgress = 100;
    } else if (mapped === 'failed') {
      statusForClient = 'failed';
      calculatedProgress = 0;
    } else {
      statusForClient = 'processing';
      // 如果没有视频URL且状态是processing，使用原始progress或计算progress
      if (calculatedProgress === undefined) {
        // 根据创建时间计算进度
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
          calculatedProgress = 80 + ((elapsedSeconds - 120) / 30) * 15; // 改为到95%
        } else if (elapsedSeconds < 180) {
          calculatedProgress = 95; // 保持在95%
        } else if (elapsedSeconds < 240) {
          // 超过180秒后，继续缓慢增长到98%
          calculatedProgress = 95 + ((elapsedSeconds - 180) / 60) * 3;
        } else {
          calculatedProgress = 98; // 最多显示98%，避免用户觉得卡住
        }
      }
    }
    
    // 转换createTime为ISO字符串
    const createdAt = typeof createTime === 'number' 
      ? new Date(createTime).toISOString()
      : new Date().toISOString();

    // 更新数据库中的作业状态
    // 根据 KIE API 文档：当 state 是 'success' 时，任务已完成
    // 如果有视频URL或 KIE API 返回 success 状态，即使原始状态不是completed，也应该更新为completed
    const shouldUpdateDb = statusForClient === 'completed' || statusForClient === 'failed' || primaryUrl || isKieSuccess;
    if (shouldUpdateDb) {
      try {
        // 如果 KIE API 返回 success 状态或有视频URL，更新为 completed
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
        } else {
          console.log('✅ Updated job status in database:', {
            job_id: id,
            status: dbStatus,
            result_url: primaryUrl,
            had_video_url: !!primaryUrl,
            is_kie_success: isKieSuccess,
            resolved_state: resolvedState,
            original_mapped_status: mapped
          });
        }
      } catch (dbError) {
        console.error('❌ Database update error:', dbError);
      }
    }

    const response = {
      generation_id: id,
      status: statusForClient,
      result_url: primaryUrl,
      thumbnail_url: primaryUrl,
      progress: calculatedProgress,
      created_at: createdAt, // 使用KIE API的实际创建时间
      updated_at: new Date().toISOString(),
      error_message: extractedErrorMessage,
    };
    
    console.log('📤 Final response:', {
      generation_id: response.generation_id,
      status: response.status,
      result_url: response.result_url,
      result_url_type: typeof response.result_url,
      result_url_length: response.result_url?.length,
      result_url_preview: response.result_url ? response.result_url.substring(0, 100) : 'N/A',
      has_result_url: !!response.result_url,
      progress: response.progress,
      full_response: response
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[KIE STATUS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

