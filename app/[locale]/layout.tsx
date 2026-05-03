import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Merriweather } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '../../i18n/routing'
import { generateHreflangAlternates } from '@/utils/hreflang'
import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Providers } from '../providers'
import CriticalCSSWrapper from '@/components/CriticalCSSWrapper'
import TooltipProviderWrapper from '@/components/TooltipProviderWrapper'
import AnalyticsScripts from '@/components/AnalyticsScripts'
import ClientOnlyNavigation from '@/components/ClientOnlyNavigation'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600', '700'],
})

const merriweather = Merriweather({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
  weight: ['400', '700'],
})

// Arabic font
const tajawal = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-tajawal',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const baseUrl = 'https://sparkrobin.app'
  
  let title = 'Spark Robin Release Watch & AI Video Workflow Lab'
  let description = 'Track Spark Robin updates, organize reusable AI video prompts, and create practical text-to-video or image-to-video drafts for review.'
  let ogTitle = 'Spark Robin Release Watch & AI Video Workflow Lab'
  let ogDescription = 'Track Spark Robin updates, organize reusable AI video prompts, and create practical text-to-video or image-to-video drafts for review.'
  
  if (locale === 'ar') {
    title = 'Spark Robin: متابعة الإطلاق وسير عمل الفيديو'
    description = 'تابع تحديثات Spark Robin، ونظّم prompts قابلة لإعادة الاستخدام، وأنشئ مسودات فيديو من النص أو الصورة للمراجعة.'
    ogTitle = 'Spark Robin: متابعة الإطلاق وسير عمل الفيديو'
    ogDescription = 'تابع تحديثات Spark Robin، ونظّم prompts قابلة لإعادة الاستخدام، وأنشئ مسودات فيديو من النص أو الصورة للمراجعة.'
  } else if (locale === 'ja') {
    title = 'Spark Robin リリースウォッチとAI動画ワークフロー'
    description = 'Spark Robin の更新を追跡し、再利用できるプロンプトと参照素材を整理し、テキストや画像からレビュー用の動画ドラフトを作成します。'
    ogTitle = 'Spark Robin リリースウォッチとAI動画ワークフロー'
    ogDescription = 'Spark Robin の更新を追跡し、再利用できるプロンプトと参照素材を整理し、テキストや画像からレビュー用の動画ドラフトを作成します。'
  } else if (locale === 'ru') {
    title = 'Spark Robin: мониторинг релиза и AI-видео workflow'
    description = 'Отслеживайте обновления Spark Robin, собирайте reusable prompts и создавайте черновики видео из текста или изображения для быстрой проверки.'
    ogTitle = 'Spark Robin: мониторинг релиза и AI-видео workflow'
    ogDescription = 'Отслеживайте обновления Spark Robin, собирайте reusable prompts и создавайте черновики видео из текста или изображения для быстрой проверки.'
  } else if (locale === 'es') {
    title = 'Spark Robin: seguimiento de lanzamiento y workflow de video AI'
    description = 'Sigue las novedades de Spark Robin, organiza prompts reutilizables y crea borradores de video desde texto o imágenes para revisar e iterar.'
    ogTitle = 'Spark Robin: seguimiento de lanzamiento y workflow de video AI'
    ogDescription = 'Sigue las novedades de Spark Robin, organiza prompts reutilizables y crea borradores de video desde texto o imágenes para revisar e iterar.'
  } else if (locale === 'zh-CN') {
    title = 'Spark Robin 发布观察与 AI 视频工作流'
    description = '跟踪 Spark Robin 更新，整理可复用提示词、参考图和镜头说明，并用文本或图片生成可评审的视频草稿。'
    ogTitle = 'Spark Robin 发布观察与 AI 视频工作流'
    ogDescription = '跟踪 Spark Robin 更新，整理可复用提示词、参考图和镜头说明，并用文本或图片生成可评审的视频草稿。'
  } else if (locale === 'de') {
    title = 'Spark Robin Release Watch und AI-Video-Workflow'
    description = 'Verfolgen Sie Spark Robin Updates, strukturieren Sie wiederverwendbare Prompts und erstellen Sie Videoentwürfe aus Text oder Bildern zur schnellen Bewertung.'
    ogTitle = 'Spark Robin Release Watch und AI-Video-Workflow'
    ogDescription = 'Verfolgen Sie Spark Robin Updates, strukturieren Sie wiederverwendbare Prompts und erstellen Sie Videoentwürfe aus Text oder Bildern zur schnellen Bewertung.'
  }

  // Generate hreflang alternates for homepage using utility function
  const alternates = generateHreflangAlternates('/', locale)

  return {
    title: {
      template: '%s | Spark Robin',
      default: title
    },
    description,
    authors: [{ name: 'Spark Robin Team' }],
    creator: 'Spark Robin',
    publisher: 'Spark Robin',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates,
    category: 'AI Video Generation',
    openGraph: {
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : locale === 'ja' ? 'ja_JP' : locale === 'ru' ? 'ru_RU' : locale === 'es' ? 'es_ES' : locale === 'zh-CN' ? 'zh_CN' : locale === 'de' ? 'de_DE' : 'en_US',
      url: locale === 'en' ? baseUrl : `${baseUrl}/${locale}/`,
      siteName: 'Spark Robin',
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: 'https://sparkrobin.app/logo-v2.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: ['https://sparkrobin.app/logo-v2.png'],
      creator: '@sora3aiteam',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/logo-v2.png',
      shortcut: '/logo-v2.png',
      apple: '/logo-v2.png'
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages({ locale })
  const isRTL = false // Disable RTL layout for all locales
  const fontClass = locale === 'ar'
    ? `${tajawal.variable} ${jetbrainsMono.variable} ${merriweather.variable}`
    : `${inter.variable} ${jetbrainsMono.variable} ${merriweather.variable}`

  return (
    <>
      {/* Set lang and dir attributes dynamically */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              document.documentElement.setAttribute('lang', '${locale}');
              document.documentElement.setAttribute('dir', 'ltr');
            })();
          `
        }}
      />
      
      <NextIntlClientProvider messages={messages} locale={locale}>
        <Providers>
          <TooltipProviderWrapper>
            <CriticalCSSWrapper />
            <ClientOnlyNavigation />
            <Toaster />
            <Sonner />
            <div className={`min-h-screen bg-background font-sans antialiased pt-14 ${fontClass}`}>
              <AnalyticsScripts />
              
              {/* JSON-LD */}
        <script
          id="org-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Spark Robin",
              "url": "https://sparkrobin.app",
              "logo": "https://sparkrobin.app/logo-v2.png",
              "description": locale === 'ar' 
                ? "sparkrobin.app موقع مستقل لمتابعة Spark Robin وتنظيم prompts ومراجع الصور ومسودات الفيديو القابلة للمراجعة."
                : locale === 'ja'
                ? "sparkrobin.appは、Spark Robinの更新を追跡し、再利用できるプロンプト、参照素材、レビュー用動画ドラフトを整理する独立サイトです。"
                : locale === 'ru'
                ? "sparkrobin.app — независимый сайт для отслеживания Spark Robin, организации reusable prompts, референсов и черновиков видео для ревью."
                : "sparkrobin.app is an independent Spark Robin release-watch and AI video workflow site. It helps creators organize reusable prompts, reference assets, and reviewable drafts while tracking official model updates. sparkrobin.app is not affiliated with Google, Google DeepMind, OpenAI, or any official Sora products.",
              "sameAs": [
                "https://x.com/sora3aiteam"
              ]
            })
          }}
        />
        <script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://sparkrobin.app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://sparkrobin.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
              {children}
            </div>
          </TooltipProviderWrapper>
        </Providers>
      </NextIntlClientProvider>
    </>
  )
}
