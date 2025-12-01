import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
import { rateLimit, apiRateLimiter } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await rateLimit(request, apiRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get authenticated user from session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[API ERROR] Upload authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file type (support both images and videos)
    if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only video and image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 100MB' },
        { status: 400 }
      );
    }

    // Log upload request
    console.log(`[API] Upload file - userId: ${userId}, fileName: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'bin';
    const fileName = `uploads/${userId}/${timestamp}-${randomStr}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await getSupabaseAdmin().storage
      .from('videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[API ERROR] Supabase upload failed:', uploadError);
      
      // 提供更详细的错误信息
      let errorMessage = 'Failed to upload file';
      let errorDetails = uploadError.message || uploadError.error || 'Unknown upload error';
      let errorCode = uploadError.statusCode || uploadError.error || 'UPLOAD_ERROR';
      
      // 检查是否是 bucket 不存在的错误
      if (errorDetails.includes('Bucket not found') || errorDetails.includes('bucket') || errorCode === '404') {
        errorMessage = 'Storage bucket not found';
        errorDetails = `The 'videos' bucket does not exist in Supabase Storage. Please create it in the Supabase Dashboard: Storage → New bucket → Name: 'videos' → Public bucket → Create bucket.`;
        errorCode = 'BUCKET_NOT_FOUND';
      } else if (uploadError.statusCode === '409') {
        errorMessage = 'File already exists. Please try again.';
      } else if (uploadError.statusCode === '413') {
        errorMessage = 'File is too large. Maximum size is 100MB.';
      } else if (uploadError.statusCode === '403') {
        errorMessage = 'Permission denied. Please check your storage permissions.';
      } else if (uploadError.message) {
        errorMessage = uploadError.message;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          code: errorCode,
          hint: errorCode === 'BUCKET_NOT_FOUND' 
            ? 'Go to Supabase Dashboard → Storage → Create a new bucket named "videos" and make it public.'
            : undefined
        },
        { status: uploadError.statusCode === '409' ? 409 : uploadError.statusCode === '413' ? 413 : 500 }
      );
    }

    // Get public URL
    const supabaseAdmin = getSupabaseAdmin();
    console.log('[API] Getting public URL for file:', { 
      fileName, 
      bucket: 'videos',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
    });
    
    const { data: urlData } = supabaseAdmin.storage
      .from('videos')
      .getPublicUrl(fileName);

    console.log('[API] Public URL response:', {
      urlData,
      hasPublicUrl: !!urlData?.publicUrl,
      publicUrl: urlData?.publicUrl
    });

    const videoUrl = urlData.publicUrl;
    
    // 验证URL不为空
    if (!videoUrl || !videoUrl.trim()) {
      console.error('[API ERROR] Generated URL is empty:', { 
        fileName, 
        urlData,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        bucketName: 'videos'
      });
      return NextResponse.json(
        { 
          error: 'Failed to generate public URL',
          details: 'Storage returned empty URL. Please check your Supabase storage configuration.',
          hint: 'Go to Supabase Dashboard → Storage → Ensure "videos" bucket exists and is public.',
          debug: {
            fileName,
            urlData,
            supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL
          }
        },
        { status: 500 }
      );
    }

    console.log(`[API] ✅ Upload successful - fileName: ${fileName}, url: ${videoUrl}`);

    return NextResponse.json({
      success: true,
      url: videoUrl,           // ← 前端期望的字段
      video_url: videoUrl,     // ← 保留兼容性
      result_url: videoUrl,    // ← 额外的兼容性字段
      file_name: fileName,
      file_size: file.size,
      file_type: file.type
    });

  } catch (error) {
    console.error('[API ERROR] Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
