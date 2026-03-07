import { MetadataRoute } from 'next'
import { getPostSlugs } from '@/lib/blog'

/**
 * Arabic sitemap - contains all Arabic pages including dynamic blog posts
 */
export default async function sitemapAr(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sora3ai.io'
  const locale = 'ar'
  const prefix = `/${locale}`

  const pages = [
    '',
    'sora3-text-to-video',
    'sora-3-storyboard',
    'multi-scene',
    'sora3-image-to-video',
    'watermark-remover',
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
      changeFrequency: page === '' || page === 'sora3-text-to-video' || page === 'sora-3-storyboard' || page === 'sora3-image-to-video' ? 'daily' as const
        : page === 'pricing' || page === 'faq' || page === 'blog' ? 'weekly' as const
        : 'yearly' as const,
      priority: page === '' ? 1
        : page === 'sora3-text-to-video' || page === 'sora-3-storyboard' || page === 'sora3-image-to-video' ? 0.95
        : page === 'multi-scene' || page === 'watermark-remover' ? 0.9
        : page === 'pricing' || page === 'faq' || page === 'blog' ? 0.8
        : 0.3,
    })
  })

  try {
    const slugs = getPostSlugs()
    slugs.forEach((slug) => {
      basePages.push({
        url: `${baseUrl}${prefix}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })
    })
  } catch {
    // Blog posts unavailable, skip
  }

  return basePages
}
