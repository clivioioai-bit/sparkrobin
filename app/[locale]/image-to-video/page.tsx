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
  
  let title = 'Sora 3 Image to Video | Animate Photos for Ads'
  let description = 'Transform static photos into professional Sora 3 video content perfect for campaigns. Our Sora 3 image-to-video tool animates images with natural motion. Export Sora 3 videos without watermarks for immediate use.'
  
  if (locale === 'ar') {
    title = 'Sora 3 من الصورة إلى الفيديو | تحريك الصور للإعلانات'
    description = 'حول الصور الثابتة إلى محتوى Sora 3 احترافي مثالي للحملات. أداة Sora 3 من الصورة إلى الفيديو تحرك الصور بحركة طبيعية. تصدير فيديوهات Sora 3 بدون علامة مائية.'
  } else if (locale === 'ja') {
    title = 'Sora 3 画像から動画 | 広告向け写真アニメーション'
    description = '静止画をキャンペーン向けのプロフェッショナルなSora 3動画コンテンツに変換。Sora 3画像から動画ツールは自然な動きで画像をアニメーション化。ウォーターマークなしのSora 3動画をエクスポート。'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/image-to-video', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/image-to-video`,
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


