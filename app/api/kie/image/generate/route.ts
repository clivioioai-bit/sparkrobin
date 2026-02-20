import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { refundCredits, debitCredits } from '@/lib/credits';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE_URL = (process.env.KIE_API_BASE_URL || 'https://api.kie.ai').trim();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

// Credit costs for each model
const CREDIT_COSTS = {
  'nano-banana-text-to-image': 12,
  'nano-banana-pro': 24,
  'nano-banana-image-editor': 12,
};

export async function POST(request: NextRequest) {
  const requestId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[${requestId}] ========== Image Generation Request Started ==========`);

  let creditsDeducted = false;
  let deductedAmount = 0;
  let userId = '';

  try {
    // 1. Validate environment variables
    if (!KIE_API_KEY) {
      return NextResponse.json(
        { error: 'Kie API key not configured' },
        { status: 500 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
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

    const { prompt, model, output_format, image_size, aspect_ratio, resolution, image_input } = body;

    // 3. Validate required parameters
    if (!prompt || !model) {
      return NextResponse.json(
        { error: 'Missing required parameters: prompt, model' },
        { status: 400 }
      );
    }

    if (!CREDIT_COSTS[model as keyof typeof CREDIT_COSTS]) {
      return NextResponse.json(
        { error: `Invalid model: ${model}` },
        { status: 400 }
      );
    }

    // 4. Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    userId = user.id;

    // 5. Check user credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits_balance, credits_total, credits_spent')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const requiredCredits = CREDIT_COSTS[model as keyof typeof CREDIT_COSTS];
    const currentBalance = Number(userData.credits_balance || 0);

    if (currentBalance < requiredCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: requiredCredits, available: currentBalance },
        { status: 402 }
      );
    }

    // 6. Deduct credits
    try {
      await debitCredits(
        userId,
        requiredCredits,
        'image_generation',
        {
          prompt,
          model,
          status: 'processing',
          request_id: requestId
        }
      );

      creditsDeducted = true;
      deductedAmount = requiredCredits;
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to deduct credits', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // 7. Upload images if needed (for image-editor and pro with image_input)
    let imageUrls: string[] = [];
    if (image_input && Array.isArray(image_input) && image_input.length > 0) {
      imageUrls = image_input.filter((url: any) => typeof url === 'string' && url.startsWith('http'));
    }

    // 8. Build KIE API request
    const kieModel = model === 'nano-banana-text-to-image'
      ? 'google/nano-banana'
      : 'nano-banana-pro';

    const requestBody: any = {
      model: kieModel,
      input: {
        prompt,
      },
    };

    // Add model-specific parameters
    if (model === 'nano-banana-text-to-image') {
      requestBody.input.output_format = output_format || 'png';
      requestBody.input.image_size = image_size || '1:1';
    } else {
      // nano-banana-pro or nano-banana-image-editor
      if (imageUrls.length > 0) {
        requestBody.input.image_input = imageUrls;
      }
      requestBody.input.aspect_ratio = aspect_ratio || '1:1';
      requestBody.input.resolution = resolution || '1K';
      requestBody.input.output_format = output_format || 'png';
    }

    // 9. Call KIE API
    const kieApiUrl = `${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/jobs/createTask`;

    const kieResponse = await fetch(kieApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!kieResponse.ok) {
      const errorText = await kieResponse.text();
      console.error(`[${requestId}] ❌ KIE API error:`, errorText);

      // Refund credits on API failure
      if (creditsDeducted) {
        try {
          await refundCredits(userId, deductedAmount, 'kie_api_failed', {
            kie_status: kieResponse.status,
            kie_error: errorText,
            request_id: requestId
          });
        } catch (refundError) {
          console.error(`[${requestId}] ❌ Failed to refund credits:`, refundError);
        }
      }

      return NextResponse.json(
        { error: 'Image generation service temporarily unavailable', details: errorText },
        { status: kieResponse.status >= 500 ? 503 : kieResponse.status }
      );
    }

    const kieData = await kieResponse.json();

    if (kieData.code !== 200 || !kieData.data?.taskId) {
      const errorMsg = kieData.msg || 'Failed to create image generation task';
      console.error(`[${requestId}] ❌ KIE API returned error:`, errorMsg);

      // Refund credits
      if (creditsDeducted) {
        try {
          await refundCredits(userId, deductedAmount, 'kie_api_error', {
            kie_response: kieData,
            request_id: requestId
          });
        } catch (refundError) {
          console.error(`[${requestId}] ❌ Failed to refund credits:`, refundError);
        }
      }

      return NextResponse.json(
        { error: errorMsg, details: kieData },
        { status: 422 }
      );
    }

    const taskId = kieData.data.taskId;

    // 10. Save job to database
    try {
      const { error: insertError } = await getSupabaseAdmin()
        .from('video_jobs')
        .insert({
          job_id: taskId,
          user_id: userId,
          status: 'pending',
          params: {
            prompt,
            model,
            output_format,
            image_size,
            aspect_ratio,
            resolution,
            image_input: imageUrls,
          },
          cost_credits: requiredCredits,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`[${requestId}] ⚠️ Failed to save job to database:`, insertError);
      }
    } catch (dbError) {
      console.error(`[${requestId}] ⚠️ Database error:`, dbError);
    }

    // 11. Return success response
    return NextResponse.json({
      jobId: taskId,
      status: 'processing',
      message: 'Image generation task created successfully',
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Unexpected error:`, error);

    // Refund credits on unexpected error
    if (creditsDeducted && userId) {
      try {
        await refundCredits(userId, deductedAmount, 'unexpected_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          request_id: requestId
        });
      } catch (refundError) {
        console.error(`[${requestId}] ❌ Failed to refund credits:`, refundError);
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
