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

  const baseUrl = 'https://sora3ai.io'
  const prefix = locale === 'en' ? '' : `/${locale}`
  
  let title = 'Sora 3 Storyboard | Build 25s Brand Narratives'
  let description = 'Create extended Sora 3 video narratives up to 25 seconds for brand campaigns and social content. Sora 3 Storyboard maintains character consistency across scenes. Export Sora 3 videos without watermarks for immediate deployment.'
  
  if (locale === 'ar') {
    title = 'Sora 3 Storyboard | بناء قصص العلامة التجارية'
    description = 'أنشئ قصص Sora 3 ممتدة حتى 25 ثانية للحملات والوسائط الاجتماعية. Sora 3 Storyboard يحافظ على اتساق الشخصيات عبر المشاهد. تصدير فيديوهات Sora 3 بدون علامة مائية.'
  } else if (locale === 'ja') {
    title = 'Sora 3 ストーリーボード | 25秒ブランドストーリー作成'
    description = 'キャンペーンやソーシャルコンテンツ向けに最大25秒のSora 3動画ストーリーを作成。Sora 3ストーリーボードはシーン間でキャラクターの一貫性を維持。ウォーターマークなしのSora 3動画をエクスポート。'
  } else if (locale === 'ru') {
    title = 'Sora 3 Storyboard | Создание Брендовых Историй'
    description = 'Создавайте расширенные Sora 3 видео-нарративы до 25 секунд для брендовых кампаний и социального контента. Sora 3 Storyboard поддерживает согласованность персонажей между сценами. Экспортируйте Sora 3 видео без водяных знаков.'
  } else if (locale === 'es') {
    title = 'Sora 3 Storyboard | Crea Narrativas de Marca de 25s'
    description = 'Crea narrativas de video Sora 3 extendidas de hasta 25 segundos para campanas de marca y contenido social. Sora 3 Storyboard mantiene la consistencia de personajes entre escenas. Exporta videos Sora 3 sin marcas de agua.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/sora-3-storyboard', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/sora-3-storyboard`,
      siteName: 'Sora3',
      images: [
        {
          url: 'https://sora3ai.io/logo.jpg',
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

  return <Storyboard />
}

export const revalidate = 300

