import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { refundCredits, debitCredits } from '@/lib/credits';
import { mapModelToKie } from '@/lib/kie';

export const runtime = 'nodejs';

// 服务器端环境变量
const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE_URL = (process.env.KIE_API_BASE_URL || 'https://api.kie.ai').trim();

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 验证必需的环境变量
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// 验证 API Key
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
    // 1. 验证环境变量
    console.log(`[${requestId}] Checking environment variables...`);
    if (!KIE_API_KEY) {
      console.error(`[${requestId}] ❌ KIE_API_KEY not configured`);
      return NextResponse.json(
        { error: 'Kie API key not configured' },
        { status: 500 }
      );
    }

    if (!supabase) {
      console.error(`[${requestId}] ❌ Supabase not configured`);
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }
    console.log(`[${requestId}] ✅ Environment variables validated`);

    // 2. 获取请求数据
    console.log(`[${requestId}] Parsing request body...`);
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(`[${requestId}] ❌ Failed to parse request body:`, {
        error: parseError instanceof Error ? parseError.message : 'Unknown error',
        content_type: request.headers.get('content-type')
      });
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }
    ({ prompt, duration, resolution, model } = body);
    const { negative_prompt, aspect_ratio, style, image_url, n_frames, quality } = body;
    
    console.log(`[${requestId}] Request params:`, {
      has_prompt: !!prompt,
      prompt_length: prompt?.length || 0,
      duration,
      resolution,
      model,
      aspect_ratio,
      has_image_url: !!image_url,
      image_url: image_url ? `${image_url.substring(0, 50)}...` : null
    });

    // 3. 验证必需参数
    console.log(`[${requestId}] Validating required parameters...`);
    if (!prompt || !duration || !resolution || !model) {
      console.error(`[${requestId}] ❌ Missing required parameters:`, {
        has_prompt: !!prompt,
        has_duration: !!duration,
        has_resolution: !!resolution,
        has_model: !!model
      });
      return NextResponse.json(
        { error: 'Missing required parameters: prompt, duration, resolution, model' },
        { status: 400 }
      );
    }
    console.log(`[${requestId}] ✅ Required parameters validated`);

    // 4. 获取用户信息（从 Authorization header）
    console.log(`[${requestId}] Checking authorization header...`);
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error(`[${requestId}] ❌ Authorization header missing`);
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // 5. 验证用户身份
    console.log(`[${requestId}] Authenticating user...`);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error(`[${requestId}] ❌ Authentication failed:`, authError?.message || 'User not found');
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    userId = user.id;
    console.log(`[${requestId}] ✅ User authenticated: ${userId}`);

    // 6. 统一的订阅和积分校验
    console.log(`[${requestId}] Fetching user data from database...`);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits_balance, credits_total, credits_spent, subscription_plan, subscription_status')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error(`[${requestId}] ❌ User not found in database:`, userError?.message);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 确定 n_frames（如果用户提供了，使用它；否则根据 duration 计算）
    const final_n_frames_for_credits = n_frames && (n_frames === '10' || n_frames === '15') 
      ? n_frames 
      : (duration <= 10 ? '10' : '15');
    
    // 检查积分余额
    const requiredCredits = calculateCredits(duration, resolution, model, final_n_frames_for_credits, quality);
    console.log(`[${requestId}] Credit calculation:`, {
      duration,
      resolution,
      model,
      n_frames: final_n_frames_for_credits,
      required_credits: requiredCredits,
      user_balance: userData.credits_balance
    });
    
    if (userData.credits_balance < requiredCredits) {
      console.warn(`[${requestId}] ⚠️ Insufficient credits:`, {
        required: requiredCredits,
        available: userData.credits_balance,
        deficit: requiredCredits - userData.credits_balance
      });
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
    console.log(`[${requestId}] ✅ Credits sufficient`);

    // 检查订阅状态（作为额外验证，但不是强制要求）
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 如果用户有积分但订阅状态异常，记录警告但不阻止
    if (userData.credits_balance >= requiredCredits) {
      if (!subscription || subscription.status !== 'active') {
        console.warn(`[${requestId}] ⚠️ User ${user.id} has credits but subscription status is inactive:`, {
          subscription_plan: userData.subscription_plan,
          subscription_status: userData.subscription_status,
          subscription_record: subscription
        });
      }
    }

    // 7. 使用事务安全的积分扣除
    console.log(`[${requestId}] Attempting to deduct credits...`);
    try {
      const debitResult = await debitCredits(
        userId,
        requiredCredits,
        'video_generation',
        {
          prompt,
          duration,
          resolution,
          model,
          status: 'processing',
          request_id: requestId
        }
      );

      creditsDeducted = true;
      deductedAmount = requiredCredits;
      
      console.log(`[${requestId}] ✅ Successfully deducted ${requiredCredits} credits from user ${userId}`, {
        new_balance: debitResult.balance,
        new_total: debitResult.total,
        new_spent: debitResult.spent
      });
    } catch (error) {
      console.error(`[${requestId}] ❌ Credit deduction exception:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        user_id: userId,
        amount: requiredCredits
      });
      
      if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { 
          error: 'Failed to deduct credits',
          details: errorMessage,
          hint: 'This may be due to a database connection issue. Please try again.'
        },
        { status: 500 }
      );
    }

    // 8. 调用 Kie API
    console.log(`[${requestId}] Preparing Kie API request...`);
    // 确定模型类型：使用 mapModelToKie 函数映射前端模型名称到 KIE API 模型名称
    // 判断是否为 image-to-video 模式
    const isImageToVideo = model === 'image-to-video' || model === 'sora3-pro-image-to-video';
    
    let kieModel: string;
    // 明确处理四种模型情况：
    // 1. sora-2-pro-image-to-video
    // 2. sora-2-image-to-video  
    // 3. sora-2-pro-text-to-video
    // 4. sora-2-text-to-video
    if (model === 'sora3-pro-image-to-video') {
      kieModel = 'sora-2-pro-image-to-video';
    } else if (model === 'image-to-video') {
      kieModel = 'sora-2-image-to-video';
    } else if (model === 'sora3-pro') {
      kieModel = 'sora-2-pro-text-to-video';
    } else if (model === 'text-to-video' || model === 'sora3' || !model) {
      kieModel = 'sora-2-text-to-video';
    } else {
      // 使用 mapModelToKie 处理其他情况（向后兼容）
      kieModel = mapModelToKie(model as 'sora3' | 'sora3-pro' | undefined, isImageToVideo);
    }
    
    // 确定 n_frames：如果用户直接传入了 n_frames，使用它；否则根据 duration 计算
    // duration 8-10 秒 -> "10", duration 11-15 秒 -> "15"
    // 确保 n_frames 是字符串类型，符合 API 文档要求
    const final_n_frames: string = n_frames && (n_frames === '10' || n_frames === '15') 
      ? String(n_frames) 
      : (duration <= 10 ? '10' : '15');
    
    // 构建请求体
    const requestBody: any = {
      model: kieModel,
      input: {
        prompt,
        aspect_ratio: aspect_ratio === '16:9' || aspect_ratio === '9:16' 
          ? (aspect_ratio === '16:9' ? 'landscape' : 'portrait')
          : 'landscape', // 默认 landscape
        n_frames: final_n_frames,
        remove_watermark: true, // 默认移除水印
      },
    };

    // 如果是 sora3-pro，添加 size 参数（从 quality 映射）
    // 根据 API 文档：
    // - text-to-video 默认值为 "high"
    // - image-to-video 默认值为 "standard"
    if (kieModel === 'sora-2-pro-text-to-video' || kieModel === 'sora-2-pro-image-to-video') {
      if (quality === 'standard') {
        requestBody.input.size = 'standard';
      } else if (quality === 'high') {
        requestBody.input.size = 'high';
      } else {
        // 未指定 quality 时，根据模型类型设置默认值
        if (kieModel === 'sora-2-pro-text-to-video') {
          requestBody.input.size = 'high'; // text-to-video 默认 high
        } else {
          requestBody.input.size = 'standard'; // image-to-video 默认 standard
        }
      }
    }

    // 如果是image-to-video模式，添加图片URL
    // 检查是否为 image-to-video 模型（包括 sora-2-image-to-video 和 sora-2-pro-image-to-video）
    if ((kieModel === 'sora-2-image-to-video' || kieModel === 'sora-2-pro-image-to-video')) {
      if (!image_url) {
        console.error(`[${requestId}] ❌ Image-to-video mode requires image_url but it's missing`, {
          kieModel,
          has_image_url: !!image_url,
          request_body_keys: Object.keys(body)
        });
        // 退还积分
        if (creditsDeducted) {
          try {
            await refundCredits(userId, deductedAmount, 'missing_image_url', {
              kieModel,
              request_id: requestId
            });
          } catch (refundError) {
            console.error(`[${requestId}] ❌ Failed to refund credits:`, refundError);
          }
        }
        return NextResponse.json(
          { 
            error: 'Reference image URL is required for image to video mode',
            details: 'Please upload an image before generating the video'
          },
          { status: 400 }
        );
      }
      requestBody.input.image_urls = [image_url];
      console.log(`[${requestId}] ✅ Added image_urls to request:`, {
        kieModel,
        image_url_preview: image_url.substring(0, 50) + '...'
      });
    }

    const kieApiUrl = `${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/jobs/createTask`;
    
    // 验证参数类型符合 API 文档要求
    console.log(`[${requestId}] Calling Kie API:`, {
      url: kieApiUrl,
      model: kieModel,
      has_prompt: !!prompt,
      aspect_ratio: requestBody.input.aspect_ratio,
      aspect_ratio_type: typeof requestBody.input.aspect_ratio,
      n_frames: requestBody.input.n_frames,
      n_frames_type: typeof requestBody.input.n_frames,
      n_frames_source: n_frames ? 'user_provided' : 'calculated_from_duration',
      remove_watermark: requestBody.input.remove_watermark,
      remove_watermark_type: typeof requestBody.input.remove_watermark,
      has_image_urls: !!requestBody.input.image_urls,
      image_urls_count: requestBody.input.image_urls?.length || 0,
      image_urls_type: Array.isArray(requestBody.input.image_urls) ? 'array' : typeof requestBody.input.image_urls,
      image_urls_preview: requestBody.input.image_urls?.map((url: string) => url.substring(0, 50) + '...') || [],
      size: requestBody.input.size,
      size_type: requestBody.input.size ? typeof requestBody.input.size : 'undefined'
    });
    
    // 验证关键参数类型
    if (typeof requestBody.input.n_frames !== 'string') {
      console.error(`[${requestId}] ❌ n_frames must be string, got:`, typeof requestBody.input.n_frames, requestBody.input.n_frames);
      requestBody.input.n_frames = String(requestBody.input.n_frames);
    }
    if (typeof requestBody.input.aspect_ratio !== 'string') {
      console.error(`[${requestId}] ❌ aspect_ratio must be string, got:`, typeof requestBody.input.aspect_ratio);
      requestBody.input.aspect_ratio = 'landscape';
    }
    if (typeof requestBody.input.remove_watermark !== 'boolean') {
      console.error(`[${requestId}] ❌ remove_watermark must be boolean, got:`, typeof requestBody.input.remove_watermark);
      requestBody.input.remove_watermark = true;
    }
    if (requestBody.input.image_urls && !Array.isArray(requestBody.input.image_urls)) {
      console.error(`[${requestId}] ❌ image_urls must be array, got:`, typeof requestBody.input.image_urls);
      requestBody.input.image_urls = [requestBody.input.image_urls];
    }

    const kieResponse = await fetch(kieApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'X-API-Key': KIE_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const kieResponseStatus = kieResponse.status;
    const kieResponseStatusText = kieResponse.statusText;
    
    console.log(`[${requestId}] Kie API response status: ${kieResponseStatus} ${kieResponseStatusText}`);
    
    if (!kieResponse.ok) {
      const errorData = await kieResponse.json().catch(() => ({}));
      console.error(`[${requestId}] ❌ Kie API error:`, {
        status: kieResponseStatus,
        status_text: kieResponseStatusText,
        error_data: errorData,
        url: kieApiUrl
      });
      
      // Kie API失败，退还积分
      if (creditsDeducted) {
        console.log(`[${requestId}] Attempting to refund credits due to Kie API failure...`);
        try {
          await refundCredits(userId, deductedAmount, 'kie_api_failed', {
            kie_status: kieResponse.status,
            kie_error: errorData,
            original_metadata: { prompt, duration, resolution, model },
            request_id: requestId
          });
          
          console.log(`[${requestId}] ✅ Refunded ${deductedAmount} credits to user ${userId} due to Kie API failure`);
        } catch (refundError) {
          console.error(`[${requestId}] ❌ Failed to refund credits:`, {
            error: refundError instanceof Error ? refundError.message : 'Unknown error',
            user_id: userId,
            amount: deductedAmount
          });
          // 记录到失败表，等待手动处理
          try {
            await supabase.from('failed_generations').insert({
              user_id: userId,
              prompt,
              duration,
              resolution,
              model,
              credits_deducted: deductedAmount,
              error_message: `Kie API failed (${kieResponse.status}): ${JSON.stringify(errorData)}`,
              status: 'pending'
            });
            console.log(`[${requestId}] Recorded failed generation to database`);
          } catch (insertError) {
            console.error(`[${requestId}] ❌ Failed to record failed generation:`, insertError);
          }
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Video generation service temporarily unavailable', 
          details: errorData,
          credits_refunded: creditsDeducted ? deductedAmount : 0
        },
        { status: 503 }
      );
    }

    const kieData = await kieResponse.json();
    console.log(`[${requestId}] ✅ Kie API response received:`, {
      has_data: !!kieData,
      response_keys: Object.keys(kieData || {}),
      status_code: extractStatusCode(kieData),
      task_id: extractTaskId(kieData)
    });

    const taskId = extractTaskId(kieData);
    const kieStatusCode = extractStatusCode(kieData);
    const kieStatusText = extractStatusText(kieData);
    const kieSuccessFlag = isKieSuccess(kieData);

    if (!kieSuccessFlag && !taskId) {
      console.error(`[${requestId}] ❌ Unexpected Kie API response shape:`, {
        response: kieData,
        status_code: kieStatusCode,
        status_text: kieStatusText,
        success_flag: kieSuccessFlag
      });
      const status = inferErrorStatus(kieStatusCode);
      return NextResponse.json(
        {
          error: 'Kie API error',
          details: kieStatusText || 'Unexpected response from Kie API',
          response: kieData,
        },
        { status }
      );
    }

    if (!taskId) {
      console.error(`[${requestId}] ❌ Missing taskId in Kie API response:`, {
        response: kieData,
        status_code: kieStatusCode,
        status_text: kieStatusText
      });
      const status = inferErrorStatus(kieStatusCode);
      return NextResponse.json(
        {
          error: 'Invalid Kie API response',
          details: kieStatusText || 'Missing task identifier',
          response: kieData,
        },
        { status }
      );
    }

    console.log(`[${requestId}] ✅ Successfully got taskId from Kie API: ${taskId}`);

    // 12. 保存作业到数据库
    console.log(`[${requestId}] Saving job to database...`);
    const { error: jobError } = await supabase
      .from('video_jobs')
      .insert({
        job_id: taskId,  // 使用job_id而不是id
        user_id: user.id,
        prompt: prompt,
        image_url: image_url || null,  // 使用image_url而不是reference_image_url
        aspect_ratio: aspect_ratio,
        duration: duration,  // 使用duration而不是duration_sec
        status: 'processing',
        result_url: null,
        preview_url: null,
        error_message: null,
        cost_credits: requiredCredits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (jobError) {
      console.error(`[${requestId}] ❌ Failed to save job to database:`, {
        error: jobError.message,
        error_code: jobError.code,
        error_details: jobError.details,
        task_id: taskId,
        user_id: userId
      });
      // 注意：KIE API已成功，但数据库保存失败
      // 在生产环境中应该实现补偿机制
    } else {
      console.log(`[${requestId}] ✅ Job saved to database: ${taskId}`);
    }

    // 13. 更新交易记录（将生成 ID 写入最近一次扣款交易）
    console.log(`[${requestId}] Updating credit transaction with generation ID...`);
    try {
      const { data: tx, error: txSelectError } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('transaction_type', 'debit')
        .eq('reason', 'video_generation')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (txSelectError) {
        console.error(`[${requestId}] ❌ Failed to locate last debit transaction:`, txSelectError);
      } else if (tx?.id) {
        const { error: updateError } = await supabase
          .from('credit_transactions')
          .update({
            metadata: {
              generation_id: taskId,
              prompt,
              duration,
              resolution,
              model,
              kie_api_response: kieData,
              status: 'processing',
              request_id: requestId
            }
          })
          .eq('id', tx.id);

        if (updateError) {
          console.error(`[${requestId}] ❌ Failed to update transaction:`, updateError);
        } else {
          console.log(`[${requestId}] ✅ Updated credit transaction ${tx.id} with generation_id ${taskId}`);
        }
      } else {
        console.warn(`[${requestId}] ⚠️ No debit transaction found to update`);
      }
    } catch (e) {
      console.error(`[${requestId}] ❌ Unexpected error updating last debit transaction:`, {
        error: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      });
    }

    // 14. 返回结果
    const durationMs = Date.now() - startTime;
    console.log(`[${requestId}] ========== Request Completed Successfully ==========`, {
      task_id: taskId,
      user_id: userId,
      credits_deducted: deductedAmount,
      duration_ms: durationMs
    });
    
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
    console.error(`[${requestId}] ========== Request Failed ==========`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : undefined,
      user_id: userId,
      credits_deducted: creditsDeducted,
      deducted_amount: deductedAmount,
      duration_ms: durationMs
    });
    
    // 如果积分已扣除但出现其他错误，退还积分
    if (creditsDeducted && userId) {
      console.log(`[${requestId}] Attempting to refund credits due to generation error...`);
      try {
        await refundCredits(userId, deductedAmount, 'generation_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          original_metadata: { prompt, duration, resolution, model },
          request_id: requestId
        });
        
        console.log(`[${requestId}] ✅ Refunded ${deductedAmount} credits to user ${userId} due to generation error`);
      } catch (refundError) {
        console.error(`[${requestId}] ❌ Failed to refund credits:`, {
          refund_error: refundError instanceof Error ? refundError.message : 'Unknown error',
          user_id: userId,
          amount: deductedAmount
        });
        // 记录到失败表，等待手动处理
        try {
          await supabase?.from('failed_generations').insert({
            user_id: userId,
            prompt: 'Unknown',
            duration: 0,
            resolution: 'Unknown',
            model: 'Unknown',
            credits_deducted: deductedAmount,
            error_message: `Generation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: 'pending'
          });
          console.log(`[${requestId}] Recorded failed generation to database`);
        } catch (insertError) {
          console.error(`[${requestId}] ❌ Failed to record failed generation:`, insertError);
        }
      }
    }
    
    // 提供更详细的错误信息，但不在生产环境暴露敏感信息
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // 根据错误类型提供更具体的错误信息
    let userFriendlyError = 'Internal server error';
    if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
      userFriendlyError = 'Invalid request format';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      userFriendlyError = 'Network error occurred';
    } else if (errorMessage.includes('database') || errorMessage.includes('supabase')) {
      userFriendlyError = 'Database connection error';
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

// 计算所需积分的函数
function calculateCredits(duration: number, resolution: string, model: string, n_frames?: '10' | '15', quality?: 'standard' | 'high'): number {
  // Sora3 Pro pricing
  if (model === 'sora3-pro') {
    if (quality === 'high') {
      return n_frames === '15' ? 325 : 175;
    } else if (quality === 'standard') {
      return n_frames === '15' ? 135 : 75;
    }
    // Default to standard if quality not specified
    return n_frames === '15' ? 135 : 75;
  }
  
  // Sora3 (default) pricing: 10s = 15 credits, 15s = 20 credits
  let baseCredits = 15;
  if (n_frames === '15') {
    baseCredits = 20;
  } else if (n_frames === '10') {
    baseCredits = 15;
  } else {
    // 如果没有提供 n_frames，根据 duration 计算（向后兼容）
    if (duration > 10) {
      baseCredits += (duration - 10) * 1;
    }
  }
  
  // 根据分辨率调整
  if (resolution === '1080p') {
    baseCredits = Math.round(baseCredits * 1.5);
  } else if (resolution === '4K') {
    baseCredits = Math.round(baseCredits * 2);
  }
  
  // 根据模型调整
  if (model.includes('fast')) {
    baseCredits = Math.round(baseCredits * 0.8);
  } else if (model.includes('standard')) {
    baseCredits = Math.round(baseCredits * 1.2);
  }
  
  return baseCredits;
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed.slice(0, -7);
  }
  return trimmed;
}

function isKieSuccess(response: unknown) {
  const code = extractStatusCode(response);
  if (typeof code === 'number') {
    if (code === 200 || code === 0) return true;
    if (code >= 200 && code < 300) return true;
  }

  if (!response || typeof response !== 'object') return false;
  const payload = response as Record<string, unknown>;
  if (payload.success === true) return true;
  if (typeof payload.msg === 'string' && payload.msg.trim().toLowerCase() === 'success') return true;

  return false;
}

function extractStatusText(response: unknown) {
  if (!response || typeof response !== 'object') return undefined;
  const payload = response as Record<string, unknown>;
  const msg = payload.msg ?? payload.message ?? payload.error;
  return typeof msg === 'string' ? msg : undefined;
}

function extractTaskId(response: unknown) {
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

function inferErrorStatus(code: number | null) {
  if (typeof code === 'number') {
    if (code >= 100 && code <= 599) return code;
    const parsed = Number.parseInt(String(code), 10);
    if (!Number.isNaN(parsed) && parsed >= 100 && parsed <= 599) return parsed;
  }
  return 502;
}

function extractStatusCode(response: unknown): number | null {
  if (!response || typeof response !== 'object') return null;
  const payload = response as Record<string, unknown>;
  const raw =
    payload.code ??
    payload.statusCode ??
    payload.status_code ??
    payload.status ??
    payload.state;

  if (typeof raw === 'number') {
    return raw;
  }

  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw.trim(), 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}
