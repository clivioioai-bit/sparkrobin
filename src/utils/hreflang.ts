import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'

const baseUrl = 'https://sparkrobinai.io'

/**
 * Generate hreflang alternates for a given pathname and locale
 * @param pathname - The pathname without locale prefix (e.g., '/text-to-video' or '/')
 * @param locale - The current locale (e.g., 'en', 'ar', 'ja')
 * @returns Metadata alternates object with hreflang links
 */
export function generateHreflangAlternates(
  pathname: string,
  locale: string,
  supportedLocales: readonly string[] = routing.locales
): Metadata['alternates'] {
  // Normalize pathname: remove leading/trailing slashes except for root
  const normalizedPath = pathname === '/' ? '' : pathname.replace(/^\/|\/$/g, '')
  
  // Build URLs for each locale
  const urls: Record<string, string> = {}
  
  supportedLocales.forEach((loc) => {
    // English (default locale) has no prefix
    if (loc === 'en') {
      urls[loc] = normalizedPath ? `${baseUrl}/${normalizedPath}` : `${baseUrl}/en`
    } else {
      urls[loc] = normalizedPath 
        ? `${baseUrl}/${loc}/${normalizedPath}` 
        : `${baseUrl}/${loc}/`
  }
  })
  
  // Create alternates object
  const alternates: Metadata['alternates'] = {
    canonical: locale === 'en'
      ? (normalizedPath ? `${baseUrl}/${normalizedPath}` : `${baseUrl}/en`)
      : (normalizedPath ? `${baseUrl}/${locale}/${normalizedPath}` : `${baseUrl}/${locale}/`),
    languages: Object.fromEntries(
      [
        ['en', urls['en']],
        ['ar', urls['ar']],
        ['ar-SA', urls['ar']],
        ['ar-AE', urls['ar']],
        ['ja', urls['ja']],
        ['ru', urls['ru']],
        ['ru-RU', urls['ru']],
        ['es', urls['es']],
        ['es-ES', urls['es']],
        ['zh-CN', urls['zh-CN']],
        ['zh-Hans', urls['zh-CN']],
        ['de', urls['de']],
        ['de-DE', urls['de']],
        ['x-default', urls['en']],
      ].filter((entry): entry is [string, string] => Boolean(entry[1]))
    ),
  }
  
  return alternates
}

/**
 * Get the pathname without locale prefix from a full pathname
 * @param fullPathname - Full pathname that may include locale (e.g., '/ar/text-to-video' or '/text-to-video')
 * @param locale - Current locale
 * @returns Pathname without locale prefix (e.g., '/text-to-video' or '/')
 */
export function getPathnameWithoutLocale(fullPathname: string, locale: string): string {
  // Remove locale prefix if present
  if (locale !== 'en' && fullPathname.startsWith(`/${locale}/`)) {
    return fullPathname.replace(`/${locale}`, '') || '/'
  }
  // If it's the root path or doesn't have locale prefix, return as is
  return fullPathname || '/'
}
