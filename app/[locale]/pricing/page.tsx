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

  const baseUrl = 'https://sparkrobinai.io'
  const prefix = locale === 'en' ? '' : `/${locale}`
  
  let title = 'Spark Robin Pricing | Basic, Standard, and Pro'
  let description = 'Compare plans for prompt tests, reference-led video drafts, workflow credits, and ongoing AI video iteration.'
  
  if (locale === 'ar') {
    title = 'أسعار Spark Robin | Basic وStandard وPro'
    description = 'قارن بين خطط أسعار Spark Robin للنص إلى فيديو والصورة إلى فيديو وإنشاء المحتوى الجاهز للحملات. اختر الخطة المناسبة لاحتياجك.'
  } else if (locale === 'ja') {
    title = 'Spark Robin 料金 | Basic・Standard・Pro'
    description = 'テキストから動画、画像から動画、キャンペーン向け制作に対応するSpark Robinの料金プランを比較できます。'
  } else if (locale === 'ru') {
    title = 'Spark Robin Тарифы | Basic, Standard и Pro'
    description = 'Сравните тарифы Spark Robin для текст-в-видео, изображение-в-видео и создания контента для кампаний. Выберите план под ваш объём.'
  } else if (locale === 'es') {
    title = 'Spark Robin Precios | Basic, Standard y Pro'
    description = 'Compara los planes de Spark Robin para texto a video, imagen a video y creacion lista para campanas. Elige el plan adecuado para tu volumen.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/pricing', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/pricing`,
      siteName: 'Spark Robin',
      images: [
        {
          url: 'https://sparkrobinai.io/logo-v2.png',
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
      images: ['https://sparkrobinai.io/logo-v2.png']
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
