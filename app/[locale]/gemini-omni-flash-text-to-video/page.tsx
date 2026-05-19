import Generate from '@/page-components/Generate'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { generateHreflangAlternates } from '@/utils/hreflang'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const baseUrl = 'https://omniflashai.io'
  const prefix = locale === 'en' ? '' : `/${locale}`

  let title = 'Gemini Omni Flash Text to Video Generator'
  let description = 'Use Gemini Omni Flash to turn text prompts into AI videos online. Create cinematic clips for ads, social posts, product demos, and creative projects.'

  if (locale === 'ar') {
    title = 'Gemini Omni Flash Text to Video Generator'
    description = 'Use Gemini Omni Flash to turn text prompts into AI videos online for ads, social media, product demos, and creative projects.'
  } else if (locale === 'ja') {
    title = 'Gemini Omni Flash Text to Video Generator'
    description = 'Use Gemini Omni Flash to turn text prompts into AI videos online for ads, social media, product demos, and creative projects.'
  } else if (locale === 'ru') {
    title = 'Gemini Omni Flash Text to Video Generator'
    description = 'Use Gemini Omni Flash to turn text prompts into AI videos online for ads, social media, product demos, and creative projects.'
  } else if (locale === 'es') {
    title = 'Gemini Omni Flash Text to Video Generator'
    description = 'Use Gemini Omni Flash to turn text prompts into AI videos online for ads, social media, product demos, and creative projects.'
  }

  return {
    title,
    description,
    keywords: [
      'gemini omni flash',
      'gemini omni flash text to video',
      'gemini omni flash ai video generator',
      'gemini omni flash video generator',
      'text to video ai',
      'cinematic ai video',
      'ai video prompt workflow'
    ],
    alternates: generateHreflangAlternates('/gemini-omni-flash-text-to-video', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/gemini-omni-flash-text-to-video`,
      siteName: 'Gemini Omni Flash',
      images: [
        {
          url: 'https://omniflashai.io/logo-v2.png',
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      locale: locale === 'ar' ? 'ar_SA' : locale === 'ja' ? 'ja_JP' : locale === 'ru' ? 'ru_RU' : locale === 'es' ? 'es_ES' : locale === 'zh-CN' ? 'zh_CN' : locale === 'de' ? 'de_DE' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://omniflashai.io/logo-v2.png']
    },
  }
}

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const baseUrl = 'https://omniflashai.io'
  const prefix = locale === 'en' ? '' : `/${locale}`
  const pageUrl = `${baseUrl}${prefix}/gemini-omni-flash-text-to-video`
  const pageName = locale === 'en'
    ? 'Gemini Omni Flash Text to Video Generator'
    : 'Gemini Omni Flash Text to Video'
  const pageDescription = locale === 'en'
    ? 'Use the Gemini Omni Flash text to video workspace to turn prompts into reviewable drafts, reusable shot notes, and better AI video briefs.'
    : 'Create structured video drafts from text prompts.'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageName,
    url: pageUrl,
    description: pageDescription,
    about: {
      '@type': 'SoftwareApplication',
      name: 'Gemini Omni Flash Text to Video Generator',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: locale === 'en' ? baseUrl : `${baseUrl}/${locale}`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: pageName,
          item: pageUrl
        }
      ]
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Generate />
    </>
  )
}

export const revalidate = 300
