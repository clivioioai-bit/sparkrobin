import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

function mapKieStateToStatus(state: string | undefined): 'processing' | 'completed' | 'failed' {
  if (!state) return 'processing';

  const lowerState = state.toLowerCase();
  if (lowerState === 'success' || lowerState === 'completed') {
    return 'completed';
  }
  if (lowerState === 'fail' || lowerState === 'failed') {
    return 'failed';
  }
  return 'processing';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = `img_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    if (!KIE_API_KEY) {
      return NextResponse.json({ error: 'Kie API key not configured' }, { status: 500 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }

    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Query KIE API
    const url = `${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(id)}`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
      },
      cache: 'no-store',
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`[${requestId}] ❌ KIE API error:`, text);
      return NextResponse.json(
        { error: 'Failed to fetch task status', details: text },
        { status: resp.status }
      );
    }

    const data = await resp.json();

    if (data?.code && data.code !== 200) {
      const message = typeof data.msg === 'string' ? data.msg : 'Failed to fetch task status';
      const status = message === 'recordInfo is null' ? 404 : 422;
      return NextResponse.json(
        { error: message, details: data },
        { status }
      );
    }

    const payload = data?.data ?? {};
    const {
      state,
      resultJson,
      failMsg,
      failCode,
      createTime,
    } = payload as Record<string, unknown>;

    const resolvedState = state as string | undefined;
    const status = mapKieStateToStatus(resolvedState);

    // Parse resultJson to extract image URL
    let imageUrl: string | undefined;
    if (resultJson && typeof resultJson === 'string') {
      try {
        const parsed = JSON.parse(resultJson);
        if (parsed?.resultUrls && Array.isArray(parsed.resultUrls) && parsed.resultUrls.length > 0) {
          imageUrl = parsed.resultUrls[0];
        }
      } catch (e) {
        console.error(`[${requestId}] Failed to parse resultJson:`, e);
      }
    }

    // Calculate progress
    let progress = 0;
    if (status === 'completed' && imageUrl) {
      progress = 100;
    } else if (status === 'failed') {
      progress = 0;
    } else {
      // Estimate progress based on time elapsed
      const createdAt = typeof createTime === 'number' ? new Date(createTime) : new Date();
      const elapsedSeconds = Math.max(0, (Date.now() - createdAt.getTime()) / 1000);

      if (elapsedSeconds < 10) {
        progress = Math.min(20, (elapsedSeconds / 10) * 20);
      } else if (elapsedSeconds < 30) {
        progress = 20 + ((elapsedSeconds - 10) / 20) * 30;
      } else if (elapsedSeconds < 60) {
        progress = 50 + ((elapsedSeconds - 30) / 30) * 30;
      } else if (elapsedSeconds < 90) {
        progress = 80 + ((elapsedSeconds - 60) / 30) * 15;
      } else {
        progress = 95;
      }
    }

    // Update database if completed or failed
    if (status === 'completed' || status === 'failed') {
      try {
        const dbStatus = status === 'completed' ? 'completed' : 'failed';
        const { error: updateError } = await supabase
          .from('video_jobs')
          .update({
            status: dbStatus,
            result_url: imageUrl || null,
            error_message: (failMsg as string) || null,
            updated_at: new Date().toISOString()
          })
          .eq('job_id', id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`[${requestId}] Failed to update job status:`, updateError);
        }
      } catch (dbError) {
        console.error(`[${requestId}] Database update error:`, dbError);
      }
    }

    const createdAt = typeof createTime === 'number'
      ? new Date(createTime).toISOString()
      : new Date().toISOString();

    return NextResponse.json({
      generation_id: id,
      status,
      result_url: imageUrl,
      thumbnail_url: imageUrl,
      progress,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
      error_message: (failMsg as string) || undefined,
    });

  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
