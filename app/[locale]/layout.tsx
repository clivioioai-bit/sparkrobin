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

  const baseUrl = 'https://omniflashai.io'
  
  let title = 'Gemini Omni Flash AI Video Generator'
  let description = 'Create AI videos with Gemini Omni Flash. Turn text prompts or images into videos for ads, social media, products, and creative projects online.'
  let ogTitle = 'Gemini Omni Flash AI Video Generator'
  let ogDescription = 'Create AI videos with Gemini Omni Flash. Turn text prompts or images into videos for ads, social media, products, and creative projects online.'
  
  if (locale === 'ar') {
    title = 'Gemini Omni Flash AI Video Generator'
    description = 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects online.'
    ogTitle = 'Gemini Omni Flash AI Video Generator'
    ogDescription = 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects online.'
  } else if (locale === 'ja') {
    title = 'Gemini Omni Flash AI Video Generator'
    description = 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects online.'
    ogTitle = 'Gemini Omni Flash AI Video Generator'
    ogDescription = 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects online.'
  } else if (locale === 'ru') {
    title = 'Gemini Omni Flash AI Video Generator'
    description = 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects online.'
    ogTitle = 'Gemini Omni Flash AI Video Generator'
    ogDescription = 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects online.'
  } else if (locale === 'es') {
    title = 'Gemini Omni Flash AI Video Generator'
    description = 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects online.'
    ogTitle = 'Gemini Omni Flash AI Video Generator'
    ogDescription = 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects online.'
  } else if (locale === 'zh-CN') {
    title = 'Gemini Omni Flash AI 视频生成器'
    description = '使用 Gemini Omni Flash 在线生成 AI 视频，将文本提示词或图片转成广告、社媒、产品展示和创意项目视频。'
    ogTitle = 'Gemini Omni Flash AI 视频生成器'
    ogDescription = '使用 Gemini Omni Flash 在线生成 AI 视频，将文本提示词或图片转成广告、社媒、产品展示和创意项目视频。'
  } else if (locale === 'de') {
    title = 'Gemini Omni Flash AI Video Generator'
    description = 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects online.'
    ogTitle = 'Gemini Omni Flash AI Video Generator'
    ogDescription = 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects online.'
  }

  // Generate hreflang alternates for homepage using utility function
  const alternates = generateHreflangAlternates('/', locale)

  return {
    title: {
      template: '%s | Gemini Omni Flash',
      default: title
    },
    description,
    authors: [{ name: 'Gemini Omni Flash Team' }],
    creator: 'Gemini Omni Flash',
    publisher: 'Gemini Omni Flash',
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
      siteName: 'Gemini Omni Flash',
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: 'https://omniflashai.io/logo-v2.png',
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
      images: ['https://omniflashai.io/logo-v2.png'],
      creator: '@omniflashai',
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
              "name": "Gemini Omni Flash",
              "url": "https://omniflashai.io",
              "logo": "https://omniflashai.io/logo-v2.png",
              "description": locale === 'ar' 
                ? "omniflashai.io موقع مستقل لمتابعة Gemini Omni Flash وتنظيم prompts ومراجع الصور ومسودات الفيديو القابلة للمراجعة."
                : locale === 'ja'
                ? "omniflashai.ioは、Gemini Omni Flashの更新を追跡し、再利用できるプロンプト、参照素材、レビュー用動画ドラフトを整理する独立サイトです。"
                : locale === 'ru'
                ? "omniflashai.io — независимый сайт для отслеживания Gemini Omni Flash, организации reusable prompts, референсов и черновиков видео для ревью."
                : "omniflashai.io is an independent Gemini Omni Flash AI video generation tool site. It helps creators turn text prompts and images into AI videos for ads, social media, product demos, and creative projects. omniflashai.io is not affiliated with Google, Google DeepMind, OpenAI, or any official Sora products.",
              "sameAs": [
                "https://x.com/omniflashai"
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
              "url": "https://omniflashai.io",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://omniflashai.io/search?q={search_term_string}",
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
