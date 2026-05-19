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

  let title = 'Gemini Omni Flash Image to Video Generator'
  let description = 'Use Gemini Omni Flash to turn images into AI videos online. Animate product photos, concept art, and visual references for ads and social clips.'

  if (locale === 'ar') {
    title = 'Gemini Omni Flash Image to Video Generator'
    description = 'Use Gemini Omni Flash to turn images into AI videos online for ads, social media, product demos, and creative projects.'
  } else if (locale === 'ja') {
    title = 'Gemini Omni Flash Image to Video Generator'
    description = 'Use Gemini Omni Flash to turn images into AI videos online for ads, social media, product demos, and creative projects.'
  } else if (locale === 'ru') {
    title = 'Gemini Omni Flash Image to Video Generator'
    description = 'Use Gemini Omni Flash to turn images into AI videos online for ads, social media, product demos, and creative projects.'
  } else if (locale === 'es') {
    title = 'Gemini Omni Flash Image to Video Generator'
    description = 'Use Gemini Omni Flash to turn images into AI videos online for ads, social media, product demos, and creative projects.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/gemini-omni-flash-image-to-video', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/gemini-omni-flash-image-to-video`,
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

  return <Generate />
}

export const revalidate = 300
