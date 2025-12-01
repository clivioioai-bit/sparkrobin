/**
 * 从视频文件提取第一帧作为poster图片
 * 
 * 使用方法:
 * 1. 确保已安装 ffmpeg: brew install ffmpeg (macOS) 或 apt-get install ffmpeg (Linux)
 * 2. 运行: tsx scripts/generate-video-poster.ts
 * 
 * 输出:
 * - public/videos/bride-poster.webp (WebP格式，推荐)
 * - public/videos/bride-poster.jpg (JPG格式，备用)
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const VIDEO_PATH = join(process.cwd(), 'public/videos/bride.mp4');
const OUTPUT_WEBP = join(process.cwd(), 'public/videos/bride-poster.webp');
const OUTPUT_JPG = join(process.cwd(), 'public/videos/bride-poster.jpg');

function checkFFmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function generatePoster(inputPath: string, outputPath: string, format: 'webp' | 'jpg'): void {
  const formatOptions = format === 'webp' 
    ? '-q:v 80 -vf "scale=1920:-1"'
    : '-q:v 2 -vf "scale=1920:-1"';
  
  const command = `ffmpeg -i "${inputPath}" -ss 00:00:00.1 -vframes 1 ${formatOptions} "${outputPath}" -y`;
  
  try {
    console.log(`Generating ${format.toUpperCase()} poster...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Successfully generated: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to generate ${format.toUpperCase()} poster:`, error);
    throw error;
  }
}

function main() {
  console.log('🎬 Video Poster Generator\n');
  
  // Check if video exists
  if (!existsSync(VIDEO_PATH)) {
    console.error(`❌ Video not found: ${VIDEO_PATH}`);
    console.log('\n💡 Make sure bride.mp4 exists in public/videos/');
    process.exit(1);
  }
  
  // Check if ffmpeg is available
  if (!checkFFmpeg()) {
    console.error('❌ ffmpeg is not installed or not in PATH');
    console.log('\n💡 Install ffmpeg:');
    console.log('   macOS: brew install ffmpeg');
    console.log('   Linux: sudo apt-get install ffmpeg');
    console.log('   Windows: choco install ffmpeg');
    process.exit(1);
  }
  
  console.log(`📹 Input video: ${VIDEO_PATH}\n`);
  
  // Generate WebP (preferred format)
  try {
    generatePoster(VIDEO_PATH, OUTPUT_WEBP, 'webp');
  } catch (error) {
    console.warn('⚠️  WebP generation failed, trying JPG...');
  }
  
  // Generate JPG (fallback)
  try {
    generatePoster(VIDEO_PATH, OUTPUT_JPG, 'jpg');
  } catch (error) {
    console.error('❌ Failed to generate JPG poster');
    process.exit(1);
  }
  
  console.log('\n✨ Poster generation complete!');
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Upload poster to Supabase Storage (if using CDN)`);
  console.log(`   2. Update getHeroVideoPoster() in src/config/demoVideos.ts`);
  console.log(`   3. Use poster path in Hero component`);
}

main();








