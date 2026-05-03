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
  
  let title = 'Spark Robin Text to Video | Prompt Workflow Lab'
  let description = 'Turn rough ideas into structured video prompts, generate reviewable drafts, and build reusable shot language for future AI video models and workflows.'
  
  if (locale === 'ar') {
    title = 'Spark Robin من النص إلى الفيديو | مختبر prompts'
    description = 'حوّل الفكرة الخام إلى prompt منظّم، وأنشئ مسودة فيديو قابلة للمراجعة، وابنِ لغة لقطات قابلة لإعادة الاستخدام.'
  } else if (locale === 'ja') {
    title = 'Spark Robin テキストから動画 | プロンプト設計ラボ'
    description = 'ラフなアイデアを構造化された動画プロンプトに変え、レビューしやすいドラフトと再利用可能なショット指示を作成します。'
  } else if (locale === 'ru') {
    title = 'Spark Robin Текст в Видео | Лаборатория prompts'
    description = 'Превращайте сырые идеи в структурированные prompts, создавайте черновики для ревью и собирайте reusable shot language.'
  } else if (locale === 'es') {
    title = 'Spark Robin Texto a Video | Laboratorio de prompts'
    description = 'Convierte ideas en prompts estructurados, genera borradores para revisar y crea lenguaje de planos reutilizable para video AI.'
  }

  return {
    title,
    description,
    keywords: [
      'spark robin',
      'spark robin text to video',
      'spark robin ai video generator',
      'spark robin video generator',
      'text to video ai',
      'cinematic ai video',
      'ai video prompt workflow'
    ],
    alternates: generateHreflangAlternates('/spark-robin-text-to-video', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/spark-robin-text-to-video`,
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

  const baseUrl = 'https://sparkrobin.app'
  const prefix = locale === 'en' ? '' : `/${locale}`
  const pageUrl = `${baseUrl}${prefix}/spark-robin-text-to-video`
  const pageName = locale === 'en'
    ? 'Spark Robin Text to Video Generator'
    : 'Spark Robin Text to Video'
  const pageDescription = locale === 'en'
    ? 'Use the Spark Robin text to video workspace to turn prompts into reviewable drafts, reusable shot notes, and better AI video briefs.'
    : 'Create structured video drafts from text prompts.'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageName,
    url: pageUrl,
    description: pageDescription,
    about: {
      '@type': 'SoftwareApplication',
      name: 'Spark Robin Text to Video Generator',
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
