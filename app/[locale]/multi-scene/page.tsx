import Storyboard from '@/page-components/Storyboard'
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

  const baseUrl = 'https://veo4video.io'
  const prefix = locale === 'en' ? '' : `/${locale}`
  
  let title = 'Veo 4 Multi-Scene | Build Story Videos'
  let description = 'Create Veo 4 multi-scene videos with stronger continuity, cleaner pacing, and scenes built for ads, brand stories, and product narratives.'
  
  if (locale === 'ar') {
    title = 'Veo 4 متعدد المشاهد | إنشاء فيديوهات قصصية'
    description = 'أنشئ فيديوهات Veo 4 متعددة المشاهد باتساق أفضل وإيقاع أنظف ومشاهد مناسبة للإعلانات وقصص العلامة التجارية وعرض المنتجات.'
  } else if (locale === 'ja') {
    title = 'Veo 4 マルチシーン | ストーリー動画を作成'
    description = '広告、ブランドストーリー、商品紹介向けに、流れと一貫性に優れたVeo 4マルチシーン動画を作成できます。'
  } else if (locale === 'ru') {
    title = 'Veo 4 Мульти-сцена | Сюжетные Видео'
    description = 'Создавайте многосценовые видео Veo 4 с лучшей связностью, ритмом и сценами для рекламы, бренда и продуктовых историй.'
  } else if (locale === 'es') {
    title = 'Veo 4 Multi-Escena | Videos con Historia'
    description = 'Crea videos multi-escena de Veo 4 con mejor continuidad, ritmo más limpio y escenas pensadas para anuncios, marca y productos.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/multi-scene', locale),
  openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/multi-scene`,
    siteName: 'Veo4',
    images: [
      {
        url: 'https://veo4video.io/logo-v2.png',
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
    images: ['https://veo4video.io/logo-v2.png']
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

  return <Storyboard />
}
