import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sora3 AI Video Generator',
    short_name: 'Sora3',
    description: 'Transform ideas into polished Sora 3 video clips perfect for ads and brand campaigns. Professional videos without watermarks.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/favicon.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
