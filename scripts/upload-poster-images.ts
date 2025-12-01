#!/usr/bin/env tsx
/**
 * 上传主页视频的 Poster 图片到 Supabase Storage
 * 
 * 使用方法:
 *   tsx scripts/upload-poster-images.ts
 * 
 * 需要环境变量:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { readFile } from 'fs/promises';
import { join } from 'path';
import { getSupabaseAdmin } from '../src/lib/supabase-admin';

// 需要上传的 poster 图片文件列表
const POSTER_IMAGES = [
  'bride-poster.webp',
  'bride-poster.jpg',
];

const BUCKET_NAME = 'videos';
const STORAGE_PATH = 'demo-videos'; // Supabase Storage 中的路径

interface UploadResult {
  fileName: string;
  storagePath: string;
  publicUrl: string;
  success: boolean;
  error?: string;
}

async function uploadPoster(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  localPath: string,
  fileName: string
): Promise<UploadResult> {
  try {
    // 读取本地文件
    const fileBuffer = await readFile(localPath);
    const storagePath = `${STORAGE_PATH}/${fileName}`;

    // 根据文件扩展名确定 content type
    const contentType = fileName.endsWith('.webp') 
      ? 'image/webp' 
      : fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'image/png';

    console.log(`📤 Uploading ${fileName}...`);

    // 上传到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: '31536000', // 1年缓存（图片不会经常变化）
        upsert: true, // 如果文件已存在，覆盖它
      });

    if (uploadError) {
      console.error(`❌ Failed to upload ${fileName}:`, uploadError);
      return {
        fileName,
        storagePath,
        publicUrl: '',
        success: false,
        error: uploadError.message,
      };
    }

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    console.log(`✅ Uploaded ${fileName}: ${publicUrl}`);
    return {
      fileName,
      storagePath,
      publicUrl,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error uploading ${fileName}:`, errorMessage);
    return {
      fileName,
      storagePath: `${STORAGE_PATH}/${fileName}`,
      publicUrl: '',
      success: false,
      error: errorMessage,
    };
  }
}

async function main() {
  console.log('🚀 Starting poster images upload to Supabase Storage...\n');

  // 检查环境变量
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }

  // 创建 Supabase admin client
  const supabase = getSupabaseAdmin();

  // 检查 bucket 是否存在
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('❌ Failed to list buckets:', bucketsError);
    process.exit(1);
  }

  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (!bucketExists) {
    console.error(`❌ Bucket "${BUCKET_NAME}" does not exist.`);
    console.error(`   Please create it in Supabase Dashboard: Storage → New bucket → Name: "${BUCKET_NAME}" → Public bucket → Create bucket.`);
    process.exit(1);
  }

  console.log(`✅ Bucket "${BUCKET_NAME}" exists\n`);

  // 获取 public/videos 目录路径
  const videosDir = join(process.cwd(), 'public', 'videos');
  
  // 上传所有 poster 图片
  const results: UploadResult[] = [];
  
  for (const fileName of POSTER_IMAGES) {
    const localPath = join(videosDir, fileName);
    
    try {
      // 检查文件是否存在
      await readFile(localPath);
      const result = await uploadPoster(supabase, localPath, fileName);
      results.push(result);
      
      // 添加小延迟，避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn(`⚠️  File not found: ${fileName}, skipping...`);
        results.push({
          fileName,
          storagePath: `${STORAGE_PATH}/${fileName}`,
          publicUrl: '',
          success: false,
          error: 'File not found',
        });
      } else {
        throw error;
      }
    }
  }

  // 输出结果摘要
  console.log('\n📊 Upload Summary:');
  console.log('='.repeat(60));
  
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}\n`);

  if (successful.length > 0) {
    console.log('✅ Successfully uploaded poster images:');
    successful.forEach((result) => {
      console.log(`   - ${result.fileName}`);
      console.log(`     Storage Path: ${result.storagePath}`);
      console.log(`     Public URL: ${result.publicUrl}`);
    });
    console.log();
  }

  if (failed.length > 0) {
    console.log('❌ Failed poster images:');
    failed.forEach((result) => {
      console.log(`   - ${result.fileName}: ${result.error}`);
    });
    console.log();
  }

  // 提示下一步
  if (successful.length > 0) {
    console.log('📝 Next steps:');
    console.log('='.repeat(60));
    console.log('✅ Poster images have been uploaded to Supabase Storage.');
    console.log('✅ The code in src/config/demoVideos.ts will automatically use the CDN URLs.');
    console.log('✅ No code changes needed - getHeroVideoPoster() will use the uploaded images.\n');
  }

  // 如果所有图片都上传成功，退出码为 0，否则为 1
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});








