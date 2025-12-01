#!/usr/bin/env tsx
/**
 * 上传主页演示视频到 Supabase Storage
 * 
 * 使用方法:
 *   tsx scripts/upload-demo-videos.ts
 * 
 * 需要环境变量:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getSupabaseAdmin } from '../src/lib/supabase-admin';

// 需要上传的视频文件列表（主页使用的视频）
const DEMO_VIDEOS = [
  'annimate.mp4',
  'bride.mp4',
  'eyes.mp4',
  'grandama sing.mp4',
  'girl.mp4',
  'advertise.mp4',
  'celebrate.mp4',
  'neuralMane.mp4',
  '4_2ec5d6ac08.mp4',
  'sushi.mp4',
  'running car.mp4',
  'storyboardexample.mp4',
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

async function uploadVideo(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  localPath: string,
  fileName: string
): Promise<UploadResult> {
  try {
    // 读取本地文件
    const fileBuffer = await readFile(localPath);
    const storagePath = `${STORAGE_PATH}/${fileName}`;

    console.log(`📤 Uploading ${fileName}...`);

    // 上传到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
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
  console.log('🚀 Starting demo videos upload to Supabase Storage...\n');

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
  
  // 上传所有视频
  const results: UploadResult[] = [];
  
  for (const fileName of DEMO_VIDEOS) {
    const localPath = join(videosDir, fileName);
    
    try {
      // 检查文件是否存在
      await readFile(localPath);
      const result = await uploadVideo(supabase, localPath, fileName);
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
    console.log('✅ Successfully uploaded videos:');
    successful.forEach((result) => {
      console.log(`   - ${result.fileName}`);
      console.log(`     URL: ${result.publicUrl}`);
    });
    console.log();
  }

  if (failed.length > 0) {
    console.log('❌ Failed videos:');
    failed.forEach((result) => {
      console.log(`   - ${result.fileName}: ${result.error}`);
    });
    console.log();
  }

  // 生成配置文件内容
  if (successful.length > 0) {
    console.log('📝 Generated config for src/config/demoVideos.ts:');
    console.log('='.repeat(60));
    console.log('\n// Video paths in Supabase Storage');
    console.log('export const DEMO_VIDEO_PATHS = {');
    successful.forEach((result) => {
      const key = result.fileName.replace('.mp4', '').replace(/\s+/g, '_');
      console.log(`  ${key}: '${result.storagePath}',`);
    });
    console.log('} as const;\n');
    console.log('// Public URLs');
    console.log('export const DEMO_VIDEO_URLS = {');
    successful.forEach((result) => {
      const key = result.fileName.replace('.mp4', '').replace(/\s+/g, '_');
      console.log(`  ${key}: '${result.publicUrl}',`);
    });
    console.log('} as const;\n');
  }

  // 如果所有视频都上传成功，退出码为 0，否则为 1
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

