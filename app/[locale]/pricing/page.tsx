import Pricing from '@/page-components/Pricing'
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
  
  let title = 'Gemini Omni Flash Pricing | Basic, Standard, and Pro'
  let description = 'Compare Gemini Omni Flash plans for prompt tests, reference-led video drafts, workflow credits, commercial use, and ongoing AI video iteration needs.'
  
  if (locale === 'ar') {
    title = 'أسعار Gemini Omni Flash | Basic وStandard وPro'
    description = 'قارن بين خطط أسعار Gemini Omni Flash للنص إلى فيديو والصورة إلى فيديو وإنشاء المحتوى الجاهز للحملات. اختر الخطة المناسبة لاحتياجك.'
  } else if (locale === 'ja') {
    title = 'Gemini Omni Flash 料金 | Basic・Standard・Pro'
    description = 'テキストから動画、画像から動画、キャンペーン向け制作に対応するGemini Omni Flashの料金プランを比較できます。'
  } else if (locale === 'ru') {
    title = 'Gemini Omni Flash Тарифы | Basic, Standard и Pro'
    description = 'Сравните тарифы Gemini Omni Flash для текст-в-видео, изображение-в-видео и создания контента для кампаний. Выберите план под ваш объём.'
  } else if (locale === 'es') {
    title = 'Gemini Omni Flash Precios | Basic, Standard y Pro'
    description = 'Compara los planes de Gemini Omni Flash para texto a video, imagen a video y creacion lista para campanas. Elige el plan adecuado para tu volumen.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/pricing', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/pricing`,
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
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function PricingPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  return <Pricing />
}
