import { MetadataRoute } from 'next'

/**
 * Sitemap index that points to language-specific sitemaps
 * This is the main sitemap.xml that both Google Search Console and Bing Webmaster Tools will read
 * 
 * Bing and Google will automatically discover this sitemap via:
 * 1. robots.txt declaration
 * 2. Direct submission in webmaster tools
 * 3. Auto-discovery via link tags (if configured)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sora3ai.io'
  
  // Return sitemap index pointing to language-specific sitemaps
  // Next.js will automatically handle the sitemap index format
  // Both Bing and Google support sitemap index format
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
