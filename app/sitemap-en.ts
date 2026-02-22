import { MetadataRoute } from 'next'

/**
 * English sitemap - contains all English pages
 */
export default async function sitemapEn(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sora3ai.io'
  const prefix = '' // English has no prefix
  
  // Base pages
  const pages = [
    '', // home
    'sora3-text-to-video',
    'sora-3-storyboard',
    'multi-scene',
    'sora3-image-to-video',
    'watermark-remover',
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
      changeFrequency: page === '' || page === 'sora3-text-to-video' || page === 'sora-3-storyboard' || page === 'sora3-image-to-video' ? 'daily' as const
        : page === 'pricing' || page === 'faq' ? 'weekly' as const
        : 'yearly' as const,
      priority: page === '' ? 1
        : page === 'sora3-text-to-video' || page === 'sora-3-storyboard' || page === 'sora3-image-to-video' ? 0.95
        : page === 'multi-scene' || page === 'watermark-remover' ? 0.9
        : page === 'pricing' || page === 'faq' ? 0.8
        : 0.3,
    })
  })
  
  return basePages
}
