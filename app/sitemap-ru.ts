import { MetadataRoute } from 'next'

/**
 * Russian sitemap - contains all Russian pages
 */
export default async function sitemapRu(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sora3ai.io'
  const locale = 'ru'
  const prefix = `/${locale}`
  
  // Base pages
  const pages = [
    '', // home
    'sora3-text-to-video',
    'sora-3-storyboard',
    'multi-scene',
    'sora3-image-to-video',
    'watermark-remover',
    'sora-3-video-generator',
    'pricing',
    'faq',
    'blog',
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
      changeFrequency: page === '' || page === 'sora3-text-to-video' || page === 'sora-3-storyboard' || page === 'sora3-image-to-video' || page === 'sora-3-video-generator' ? 'daily' as const
        : page === 'pricing' || page === 'faq' || page === 'blog' ? 'weekly' as const
        : 'yearly' as const,
      priority: page === '' ? 1
        : page === 'sora3-text-to-video' || page === 'sora-3-storyboard' || page === 'sora3-image-to-video' || page === 'sora-3-video-generator' ? 0.95
        : page === 'multi-scene' || page === 'watermark-remover' ? 0.9
        : page === 'pricing' || page === 'faq' || page === 'blog' ? 0.8
        : 0.3,
    })
  })
  
  return basePages
}

