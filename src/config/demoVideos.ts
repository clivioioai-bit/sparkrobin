/**
 * 主页演示视频配置
 * 
 * 这些视频存储在 Supabase Storage 中，通过 CDN 加速加载
 * 
 * 使用说明:
 * 1. 运行 `tsx scripts/upload-demo-videos.ts` 上传视频到 Supabase Storage
 * 2. 上传成功后，脚本会输出视频路径和 URL
 * 3. 将输出内容更新到此文件中
 */

// Supabase Storage bucket 名称
const BUCKET_NAME = 'videos';

/**
 * 获取 Supabase URL（动态获取，确保在客户端也能正确获取）
 */
function getSupabaseUrl(): string {
  // 在客户端和服务端都尝试获取环境变量
  if (typeof window !== 'undefined') {
    // 客户端：从 window 或 process.env 获取
    return (window as any).__NEXT_PUBLIC_SUPABASE_URL__ || 
           process.env.NEXT_PUBLIC_SUPABASE_URL || 
           'https://ggkwbyzdvcckbdtmitkw.supabase.co';
  }
  // 服务端：从 process.env 获取
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ggkwbyzdvcckbdtmitkw.supabase.co';
}

// 视频在 Supabase Storage 中的路径
export const DEMO_VIDEO_PATHS = {
  annimate: 'demo-videos/annimate.mp4',
  bride: 'demo-videos/bride.mp4',
  eyes: 'demo-videos/eyes.mp4',
  grandama_sing: 'demo-videos/grandama sing.mp4',
  girl: 'demo-videos/girl.mp4',
  advertise: 'demo-videos/advertise.mp4',
  celebrate: 'demo-videos/celebrate.mp4',
  neuralMane: 'demo-videos/neuralMane.mp4',
  video_4: 'demo-videos/4_2ec5d6ac08.mp4',
  sushi: 'demo-videos/sushi.mp4',
  runningCar: 'demo-videos/running car.mp4',
  storyboardExample: 'demo-videos/storyboardexample.mp4',
  cyberpunkCity: 'demo-videos/cyberpunk city.mp4',
  flyingBird: 'demo-videos/flying bird.mp4',
  video_3: 'demo-videos/3_d40976e7f1.mp4',
  sora2: 'demo-videos/sora2.mp4',
  sora3: 'demo-videos/sora3.mp4',
  dec30: 'demo-videos/12月30日.mov',
} as const;

// Capability videos (local paths, used by Sora3Capabilities)
export const CAPABILITY_VIDEO_PATHS = {
  cinematic: '/videos/capability-cinematic.mp4',
  camera: '/videos/capability-camera.mp4',
  characters: '/videos/capability-characters.mp4',
  longform: '/videos/capability-longform.mp4',
  scene: '/videos/capability-scene.mp4',
  audio: '/videos/capability-audio.mp4',
} as const;

/**
 * 获取视频的公开 URL（不依赖 supabase 客户端，直接构建 URL）
 * @param path 视频在 Storage 中的路径
 * @returns 公开访问的 URL
 */
export function getVideoUrl(path: string): string {
  // 直接构建 Supabase Storage 的公开 URL，避免在 SSR 时使用客户端
  // 格式: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  const supabaseUrl = getSupabaseUrl();
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${encodedPath}`;
}

/**
 * 获取所有演示视频的 URL 数组（用于 DemoGallery）
 * 使用本地路径，加载更快
 */
export function getDemoVideoUrls(): string[] {
  return [
    '/videos/sora3.mp4',
    '/videos/girl.mp4',
    '/videos/advertise.mp4',
    '/videos/12月30日.mov',
    '/videos/eyes.mp4',
    '/videos/celebrate.mp4',
    '/videos/neuralMane.mp4',
    '/videos/bride.mp4',
    '/videos/sushi.mp4',
    '/videos/annimate.mp4',
    '/videos/running car.mp4',
    '/videos/4_2ec5d6ac08.mp4',
    '/videos/cyberpunk city.mp4',
    '/videos/grandama sing.mp4',
    '/videos/flying bird.mp4',
    '/videos/storyboardexample.mp4',
    '/videos/3_d40976e7f1.mp4',
    '/videos/sora2.mp4',
  ];
}

/**
 * 获取 Hero 组件背景视频 URL
 */
export function getHeroVideoUrl(): string {
  // Use bride video from Supabase Storage
  return getVideoUrl(DEMO_VIDEO_PATHS.bride);
}

/**
 * 获取 Hero 组件背景视频的 Poster 图片 URL
 * 优先使用 WebP 格式，回退到 JPG
 */
export function getHeroVideoPoster(): string {
  // 优先尝试从 Supabase Storage 获取 WebP
  try {
    const webpPath = 'demo-videos/bride-poster.webp';
    return getVideoUrl(webpPath);
  } catch (error) {
    // 如果 Supabase 获取失败，回退到本地或 JPG
    // 注意：在 SSR 时不能检查 WebP 支持，所以统一返回 WebP
    // 浏览器会自动回退到 JPG 如果 WebP 不支持
    return '/videos/bride-poster.webp';
  }
}

/**
 * 回退到本地路径（如果 Supabase URL 加载失败）
 * 保持向后兼容
 */
export function getLocalVideoPath(fileName: string): string {
  return `/videos/${fileName}`;
}



