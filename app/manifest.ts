import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Spark Robin Workflow Lab',
    short_name: 'Spark Robin',
    description: 'Track Spark Robin updates, structure reusable prompts, and create reviewable AI video drafts.',
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
