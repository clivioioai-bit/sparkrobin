import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gemini Omni Flash AI Video Generator',
    short_name: 'Gemini Omni Flash',
    description: 'Create AI videos with Gemini Omni Flash from text prompts or images online.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#0EA5E9',
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
