import { MetadataRoute } from 'next'

/**
 * Sitemap index that points to language-specific sitemaps
 * This is the main sitemap.xml that Google Search Console will read
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sora3ai.io'
  
  // Return sitemap index pointing to language-specific sitemaps
  // Next.js will automatically handle the sitemap index format
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
  ]
}
