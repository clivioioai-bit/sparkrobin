import Generate from '@/page-components/Generate'
import { getTranslations } from 'next-intl/server'
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

  const baseUrl = 'https://sora3ai.io'
  const prefix = locale === 'en' ? '' : `/${locale}`
  
  let title = 'Sora 3 Text to Video | Create Ad-Ready Clips'
  let description = 'Transform text into polished Sora 3 video clips ready for ads and campaigns. Our Sora 3 text-to-video generator produces professional content without watermarks. Start creating Sora 3 videos from prompts today.'
  
  if (locale === 'ar') {
    title = 'Sora 3 من النص إلى الفيديو | إنشاء فيديوهات إعلانية'
    description = 'حول النص إلى فيديوهات Sora 3 جاهزة للإعلانات. مولد Sora 3 من النص إلى الفيديو ينتج محتوى احترافي بدون علامة مائية. ابدأ في إنشاء فيديوهات Sora 3 اليوم.'
  } else if (locale === 'ja') {
    title = 'Sora 3 テキストから動画 | 広告向け動画作成'
    description = 'テキストを広告向けのSora 3動画クリップに変換。Sora 3テキストから動画生成ツールは、ウォーターマークなしのプロフェッショナルなコンテンツを生成。今すぐSora 3動画を作成開始。'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/text-to-video', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/text-to-video`,
      siteName: 'Sora3',
      images: [
        {
          url: 'https://sora3ai.io/logo.png',
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      locale: locale === 'ar' ? 'ar_SA' : locale === 'ja' ? 'ja_JP' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://sora3ai.io/logo.png']
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



