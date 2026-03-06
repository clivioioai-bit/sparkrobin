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
  
  let title = 'Sora 3 Multi-Scene | Extended Video Narratives'
  let description = 'Build complete brand stories with Sora 3 multi-scene videos up to 25 seconds. Sora 3 maintains visual consistency across scenes for professional campaigns. Export Sora 3 content without watermarks.'
  
  if (locale === 'ar') {
    title = 'Sora 3 متعدد المشاهد | قصص فيديو ممتدة'
    description = 'أنشئ قصص علامة تجارية كاملة مع فيديوهات Sora 3 متعددة المشاهد حتى 25 ثانية. Sora 3 يحافظ على الاتساق البصري عبر المشاهد. تصدير محتوى Sora 3 بدون علامة مائية.'
  } else if (locale === 'ja') {
    title = 'Sora 3 マルチシーン | 拡張動画ストーリー'
    description = '最大25秒のSora 3マルチシーン動画で完全なブランドストーリーを構築。Sora 3はシーン間で視覚的一貫性を維持。ウォーターマークなしのSora 3コンテンツをエクスポート。'
  } else if (locale === 'ru') {
    title = 'Sora 3 Мульти-сцена | Расширенные Видео Истории'
    description = 'Создавайте полные истории бренда с многосценовыми видео Sora 3 до 25 секунд. Sora 3 поддерживает визуальную согласованность между сценами. Экспортируйте контент Sora 3 без водяных знаков.'
  } else if (locale === 'es') {
    title = 'Sora 3 Multi-Escena | Narrativas de Video Extendidas'
    description = 'Construye historias de marca completas con videos multi-escena Sora 3 de hasta 25 segundos. Sora 3 mantiene la consistencia visual entre escenas. Exporta contenido Sora 3 sin marcas de agua.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/multi-scene', locale),
  openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/multi-scene`,
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

