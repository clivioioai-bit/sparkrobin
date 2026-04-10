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

  const baseUrl = 'https://veo4video.io'
  const prefix = locale === 'en' ? '' : `/${locale}`
  
  let title = 'Veo 4 Image to Video | Animate Photos'
  let description = 'Turn photos into Veo 4 videos with natural motion, clean detail, and ad-ready output. Upload an image and create polished clips in minutes.'
  
  if (locale === 'ar') {
    title = 'Veo 4 من الصورة إلى الفيديو | تحريك الصور'
    description = 'حوّل الصور إلى فيديوهات Veo 4 بحركة طبيعية وتفاصيل نظيفة ومخرجات جاهزة للإعلانات. ارفع الصورة وأنشئ مقاطع احترافية خلال دقائق.'
  } else if (locale === 'ja') {
    title = 'Veo 4 画像から動画 | 写真をアニメーション化'
    description = '写真を自然な動きと高い再現性を持つVeo 4動画に変換。画像をアップロードして、広告向けの洗練されたクリップを数分で作成できます。'
  } else if (locale === 'ru') {
    title = 'Veo 4 Изображение в Видео | Анимация Фото'
    description = 'Превращайте фото в видео Veo 4 с естественным движением, чистой детализацией и результатом для рекламы. Загрузите изображение и создайте ролик за минуты.'
  } else if (locale === 'es') {
    title = 'Veo 4 Imagen a Video | Animar Fotos'
    description = 'Convierte fotos en videos Veo 4 con movimiento natural, buen detalle y salida lista para anuncios. Sube una imagen y crea clips pulidos en minutos.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/veo4-image-to-video', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/veo4-image-to-video`,
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

  return <Generate />
}

export const revalidate = 300

