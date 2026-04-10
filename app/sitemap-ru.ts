import { MetadataRoute } from 'next'

/**
 * Russian sitemap
 */
export default async function sitemapRu(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://veo4video.io'
  const locale = 'ru'
  const prefix = `/${locale}`

  const pages = [
    '',
    'veo4-text-to-video',
    'multi-scene',
    'veo4-image-to-video',
    'veo-4-video-generator',
    'pricing',
    'faq',
    'privacy',
    'terms',
    'refund',
  ]

  const basePages: MetadataRoute.Sitemap = []

  pages.forEach((page) => {
    const url = page ? `${baseUrl}${prefix}/${page}` : `${baseUrl}${prefix}/`
    basePages.push({
      url,
      lastModified: new Date(),
      changeFrequency: page === '' || page === 'veo4-text-to-video' || page === 'veo4-image-to-video' || page === 'veo-4-video-generator' ? 'daily' as const
        : page === 'pricing' || page === 'faq' ? 'weekly' as const
        : 'yearly' as const,
      priority: page === '' ? 1
        : page === 'veo4-text-to-video' || page === 'veo4-image-to-video' || page === 'veo-4-video-generator' ? 0.95
        : page === 'multi-scene' ? 0.9
        : page === 'pricing' || page === 'faq' ? 0.8
        : 0.3,
    })
  })

  return basePages
}
