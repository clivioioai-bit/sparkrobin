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

  const baseUrl = 'https://sparkrobin.app'
  const prefix = locale === 'en' ? '' : `/${locale}`
  
  let title = 'Spark Robin Image to Video | Reference-Led Drafts'
  let description = 'Use images as creative anchors for AI video drafts. Add motion notes, camera direction, pacing, and review criteria before final production.'
  
  if (locale === 'ar') {
    title = 'Spark Robin من الصورة إلى الفيديو | مسودات مرجعية'
    description = 'استخدم الصور كمرجع إبداعي لمسودات الفيديو، ثم أضف تعليمات الحركة والكاميرا والإيقاع للمراجعة.'
  } else if (locale === 'ja') {
    title = 'Spark Robin 画像から動画 | 参照ベースのドラフト'
    description = '画像をクリエイティブの基準にして、モーション、カメラ、テンポを指定したレビュー用動画ドラフトを作成します。'
  } else if (locale === 'ru') {
    title = 'Spark Robin Изображение в Видео | Черновики от референса'
    description = 'Используйте изображения как визуальный якорь, добавляйте движение, камеру и темп, чтобы получить черновик для ревью.'
  } else if (locale === 'es') {
    title = 'Spark Robin Imagen a Video | Borradores con referencia'
    description = 'Usa imágenes como ancla creativa, añade notas de movimiento y cámara, y genera borradores de video para revisar.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/spark-robin-image-to-video', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/spark-robin-image-to-video`,
      siteName: 'Spark Robin',
      images: [
        {
          url: 'https://sparkrobin.app/logo-v2.png',
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
      images: ['https://sparkrobin.app/logo-v2.png']
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
