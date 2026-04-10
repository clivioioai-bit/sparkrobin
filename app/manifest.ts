import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Veo4 AI Video Generator',
    short_name: 'Veo4',
    description: 'Transform ideas into polished Veo 4 video clips perfect for ads and brand campaigns. Professional videos without watermarks.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/logo-v2.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-v2.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
