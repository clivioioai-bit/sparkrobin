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
  
  let title = 'Veo 4 Text to Video | Create AI Video'
  let description = 'Turn prompts into Veo 4 videos with strong motion, clean scenes, and ad-ready output. Create clips for marketing, social posts, and product stories.'
  
  if (locale === 'ar') {
    title = 'Veo 4 من النص إلى الفيديو | إنشاء فيديو AI'
    description = 'حوّل النص إلى فيديوهات Veo 4 بحركة قوية ومشاهد نظيفة ومخرجات جاهزة للإعلانات. أنشئ مقاطع للتسويق والمحتوى الاجتماعي وعرض المنتجات.'
  } else if (locale === 'ja') {
    title = 'Veo 4 テキストから動画 | AI動画を作成'
    description = 'プロンプトを動きのあるVeo 4動画に変換。広告、SNS投稿、商品紹介向けの洗練されたクリップをすばやく作成できます。'
  } else if (locale === 'ru') {
    title = 'Veo 4 Текст в Видео | Создание AI Видео'
    description = 'Превращайте текст в видео Veo 4 с сильным движением, чистыми сценами и результатом для рекламы. Подходит для маркетинга, соцсетей и продуктовых роликов.'
  } else if (locale === 'es') {
    title = 'Veo 4 Texto a Video | Crear Video AI'
    description = 'Convierte prompts en videos Veo 4 con buen movimiento, escenas limpias y salida lista para anuncios. Crea clips para marketing, redes sociales y productos.'
  }

  return {
    title,
    description,
    keywords: [
      'veo 4',
      'veo 4 text to video',
      'veo 4 ai video generator',
      'veo 4 video generator',
      'text to video ai',
      'cinematic ai video',
      'ai video generator for ads'
    ],
    alternates: generateHreflangAlternates('/veo4-text-to-video', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/veo4-text-to-video`,
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

  const baseUrl = 'https://veo4video.io'
  const prefix = locale === 'en' ? '' : `/${locale}`
  const pageUrl = `${baseUrl}${prefix}/veo4-text-to-video`
  const pageName = locale === 'en'
    ? 'Veo 4 Text to Video Generator'
    : 'Veo 4 Text to Video'
  const pageDescription = locale === 'en'
    ? 'Use the Veo 4 text to video generator to create cinematic AI video from prompts for ads, social posts, and product storytelling.'
    : 'Create Veo 4 videos from text prompts.'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageName,
    url: pageUrl,
    description: pageDescription,
    about: {
      '@type': 'SoftwareApplication',
      name: 'Veo 4 Text to Video Generator',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: locale === 'en' ? baseUrl : `${baseUrl}/${locale}`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: pageName,
          item: pageUrl
        }
      ]
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Generate />
    </>
  )
}

export const revalidate = 300
