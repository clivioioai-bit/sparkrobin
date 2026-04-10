import { MetadataRoute } from 'next'

/**
 * English sitemap
 */
export default async function sitemapEn(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://veo4video.io'

  // Base pages
  const pages = [
    '', // home
    'veo4-text-to-video',
    'multi-scene',
    'veo4-image-to-video',
    'pricing',
    'faq',
    'privacy',
    'terms',
    'refund',
  ]

  const basePages: MetadataRoute.Sitemap = []

  pages.forEach((page) => {
    const url = page ? `${baseUrl}/${page}` : baseUrl
    basePages.push({
      url,
      lastModified: new Date(),
      changeFrequency: page === '' || page === 'veo4-text-to-video' || page === 'veo4-image-to-video' ? 'daily' as const
        : page === 'pricing' || page === 'faq' ? 'weekly' as const
        : 'yearly' as const,
      priority: page === '' ? 1
        : page === 'veo4-text-to-video' || page === 'veo4-image-to-video' ? 0.95
        : page === 'multi-scene' ? 0.9
        : page === 'pricing' || page === 'faq' ? 0.8
        : 0.3,
    })
  })

  return basePages
}
