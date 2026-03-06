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
  } else if (locale === 'ru') {
    title = 'Sora 3 Изображение в Видео | Анимация Фото для Рекламы'
    description = 'Превращайте статичные фотографии в профессиональный видеоконтент Sora 3 для кампаний. Инструмент Sora 3 анимирует изображения с естественным движением. Экспортируйте видео Sora 3 без водяных знаков.'
  } else if (locale === 'es') {
    title = 'Sora 3 Imagen a Video | Animar Fotos para Anuncios'
    description = 'Transforma fotos estaticas en contenido de video Sora 3 profesional para campanas. Nuestra herramienta Sora 3 anima imagenes con movimiento natural. Exporta videos Sora 3 sin marcas de agua.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/sora3-image-to-video', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/sora3-image-to-video`,
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

  return <Generate />
}

export const revalidate = 300




