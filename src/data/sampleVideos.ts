// Sample videos to showcase Sora3 capabilities
// These are shown to users before they sign up/generate

import { getVideoUrl, DEMO_VIDEO_PATHS } from '@/config/demoVideos';

export interface SampleVideo {
  id: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  duration: number;
  tags: string[];
}

export const sampleVideos: SampleVideo[] = [
  {
    id: 'sample-sushi',
    prompt: 'A master sushi chef expertly preparing nigiri in a traditional Japanese restaurant. Close-up shots of precise knife work cutting fresh salmon. Rice being molded with practiced hands. Elegant presentation on wooden serving board. Natural window lighting with clean aesthetic. ASMR-style detail focus.',
    videoUrl: getVideoUrl(DEMO_VIDEO_PATHS.sushi),
    thumbnailUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=450&fit=crop',
    aspectRatio: '16:9',
    duration: 8,
    tags: ['food', 'sushi', 'asmr', 'text-to-video']
  },
  {
    id: 'sample-bride',
    prompt: 'A beautiful bride walking down the aisle in a stunning wedding dress. Cinematic lighting with natural colors and smooth camera movement.',
    videoUrl: getVideoUrl(DEMO_VIDEO_PATHS.bride),
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=450&fit=crop',
    aspectRatio: '16:9',
    duration: 8,
    tags: ['wedding', 'cinematic', 'bride']
  },
  {
    id: 'sample-girl',
    prompt: 'A young girl playing in a beautiful garden with flowers and butterflies. Natural lighting and vibrant colors.',
    videoUrl: getVideoUrl(DEMO_VIDEO_PATHS.girl),
    thumbnailUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=450&fit=crop',
    aspectRatio: '16:9',
    duration: 8,
    tags: ['nature', 'child', 'garden']
  },
  {
    id: 'sample-celebrate',
    prompt: 'People celebrating a special moment with joy and excitement. Dynamic movement and energetic atmosphere.',
    videoUrl: getVideoUrl(DEMO_VIDEO_PATHS.celebrate),
    thumbnailUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=450&fit=crop',
    aspectRatio: '16:9',
    duration: 8,
    tags: ['celebration', 'joy', 'party']
  }
];

// Get a random sample video
export function getRandomSampleVideo(): SampleVideo {
  const randomIndex = Math.floor(Math.random() * sampleVideos.length);
  return sampleVideos[randomIndex];
}

// Get sample video by ID
export function getSampleVideoById(id: string): SampleVideo | undefined {
  return sampleVideos.find(v => v.id === id);
}
