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

  const baseUrl = 'https://sora3ai.io'
  const prefix = locale === 'en' ? '' : `/${locale}`
  
  let title = 'Sora 3 Without Watermark | Clean Export Tool'
  let description = 'Remove watermarks from Sora 3 videos instantly for campaign deployment. Our Sora 3 watermark removal tool processes Sora 3 content quickly. Export clean Sora 3 videos ready for commercial use.'
  
  if (locale === 'ar') {
    title = 'Sora 3 بدون علامة مائية | أداة التصدير النظيف'
    description = 'قم بإزالة العلامات المائية من فيديوهات Sora 3 على الفور للنشر في الحملات. أداة Sora 3 لإزالة العلامة المائية تعالج محتوى Sora 3 بسرعة. تصدير فيديوهات Sora 3 نظيفة جاهزة للاستخدام التجاري.'
  } else if (locale === 'ja') {
    title = 'Sora 3 ウォーターマークなし | クリーンエクスポートツール'
    description = 'キャンペーン展開のためにSora 3動画からウォーターマークを即座に削除。Sora 3ウォーターマーク除去ツールはSora 3コンテンツを迅速に処理。商用利用可能なクリーンなSora 3動画をエクスポート。'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/watermark-remover', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/watermark-remover`,
      siteName: 'Sora3',
      images: [
        {
          url: 'https://sora3ai.io/logo.jpg',
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
      images: ['https://sora3ai.io/logo.jpg']
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



