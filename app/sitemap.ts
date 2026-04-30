import { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { buildLocalizedSitemap } from '@/lib/sitemap-pages'

/**
 * Main sitemap consumed by Google Search Console and Bing Webmaster Tools.
 * Keep this as a direct URL set so crawlers do not depend on secondary sitemap routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) => buildLocalizedSitemap(locale))
}
