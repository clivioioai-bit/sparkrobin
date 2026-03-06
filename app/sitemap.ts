import { MetadataRoute } from 'next'

/**
 * Sitemap index that points to language-specific sitemaps
 * This is the main sitemap.xml that both Google Search Console and Bing Webmaster Tools will read
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sora3ai.io'

  return [
    {
      url: `${baseUrl}/sitemap-en.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sitemap-ar.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sitemap-ja.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sitemap-ru.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sitemap-es.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sitemap-zh-CN.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sitemap-de.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
