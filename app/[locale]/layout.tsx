import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
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
import '../globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
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

  const baseUrl = 'https://sora3ai.io'
  
  // Get locale-specific metadata - Sora 3 focused, keyword density >3%
  let title = 'Sora 3 AI Video Generator — Next-Gen Model | Coming Soon'
  let description = 'Explore Sora 3, the next-generation AI video generator designed for creators, brands, and advertisers. Produce longer, sharper, and more realistic videos with advanced physics and scene control. Join the early-access waitlist. Try Sora 2 now while Sora 3 is coming soon.'
  let ogTitle = 'Sora 3 AI Video Generator — Next-Gen Model | Coming Soon'
  let ogDescription = 'Explore Sora 3, the next-generation AI video generator designed for creators, brands, and advertisers. Produce longer, sharper, and more realistic videos with advanced physics and scene control. Join the early-access waitlist. Try Sora 2 now while Sora 3 is coming soon.'
  
  if (locale === 'ar') {
    title = 'مولّد فيديو Sora 3 بالذكاء الاصطناعي | قريبًا'
    description = 'اكتشف Sora 3، الجيل المتقدم من مولدات الفيديو بالذكاء الاصطناعي. جودة أعلى، لقطات أطول، وتحكم أفضل في الحركة والمشهد. سجّل في الوصول المبكر. ويمكنك تجربة Sora 2 الآن أثناء انتظار الإطلاق.'
    ogTitle = 'مولّد فيديو Sora 3 بالذكاء الاصطناعي | قريبًا'
    ogDescription = 'اكتشف Sora 3، الجيل المتقدم من مولدات الفيديو بالذكاء الاصطناعي. جودة أعلى، لقطات أطول، وتحكم أفضل في الحركة والمشهد. سجّل في الوصول المبكر. ويمكنك تجربة Sora 2 الآن أثناء انتظار الإطلاق.'
  } else if (locale === 'ja') {
    title = 'Sora 3 AI 動画ジェネレーター | 次世代モデル・近日公開'
    description = 'Sora 3 は、より長いシーン、高精細なビジュアル、自然な物理表現を実現する次世代AI動画モデルです。先行アクセスに登録して最新情報をチェック。公開までの間は Sora 2 をご利用いただけます。'
    ogTitle = 'Sora 3 AI 動画ジェネレーター | 次世代モデル・近日公開'
    ogDescription = 'Sora 3 は、より長いシーン、高精細なビジュアル、自然な物理表現を実現する次世代AI動画モデルです。先行アクセスに登録して最新情報をチェック。公開までの間は Sora 2 をご利用いただけます。'
  } else if (locale === 'ru') {
    title = 'Sora 3 AI видео генератор — новое поколение | Скоро'
    description = 'Sora 3 — мощный AI-видео генератор для маркетинга, брендов и создателей контента. Более длинные сцены, улучшенная физика и кинематографическое качество. Подпишитесь на ранний доступ. Пока ждёте — попробуйте Sora 2.'
    ogTitle = 'Sora 3 AI видео генератор — новое поколение | Скоро'
    ogDescription = 'Sora 3 — мощный AI-видео генератор для маркетинга, брендов и создателей контента. Более длинные сцены, улучшенная физика и кинематографическое качество. Подпишитесь на ранний доступ. Пока ждёте — попробуйте Sora 2.'
  } else if (locale === 'es') {
    title = 'Sora 3 Generador de Video con IA — Próxima generación | Coming Soon'
    description = 'Sora 3 es el nuevo generador de video por IA con escenas más largas, realismo mejorado y control avanzado. Únete a la lista de acceso temprano. Mientras tanto, prueba Sora 2 para crear videos profesionales sin marca de agua.'
    ogTitle = 'Sora 3 Generador de Video con IA — Próxima generación | Coming Soon'
    ogDescription = 'Sora 3 es el nuevo generador de video por IA con escenas más largas, realismo mejorado y control avanzado. Únete a la lista de acceso temprano. Mientras tanto, prueba Sora 2 para crear videos profesionales sin marca de agua.'
  }

  // Generate hreflang alternates for homepage using utility function
  const alternates = generateHreflangAlternates('/', locale)

  return {
    title: {
      template: '%s | Sora3',
      default: title
    },
    description,
    authors: [{ name: 'Sora3 Team' }],
    creator: 'Sora3',
    publisher: 'Sora3',
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
      locale: locale === 'ar' ? 'ar_SA' : locale === 'ja' ? 'ja_JP' : locale === 'ru' ? 'ru_RU' : locale === 'es' ? 'es_ES' : 'en_US',
      url: locale === 'en' ? baseUrl : `${baseUrl}/${locale}/`,
      siteName: 'Sora3',
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: 'https://sora3ai.io/logo.png',
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
      images: ['https://sora3ai.io/logo.png'],
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
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || 'RXG1GciT_6Lk-VckDXsTp0wkUZYZfI0RDWy-9D_P-0E',
      other: {
        'msvalidate.01': process.env.BING_VERIFICATION_CODE || 'your-bing-verification-code',
      },
    },
    icons: {
      icon: '/favicon.png',
      shortcut: '/favicon.png',
      apple: '/favicon.png'
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
  const fontClass = locale === 'ar' ? tajawal.variable : inter.variable

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
            <Toaster />
            <Sonner />
            <div className={`min-h-screen bg-background font-sans antialiased ${fontClass}`}>
              <AnalyticsScripts />
              
              {/* JSON-LD */}
        <script
          id="org-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Sora3",
              "url": "https://sora3ai.io",
              "logo": "https://sora3ai.io/logo.png",
              "description": locale === 'ar' 
                ? "Sora3ai.io هي منصة مستقلة لإنشاء فيديوهات Sora 3 الاحترافية. نستخدم تقنيات Sora 3 المتقدمة لإنشاء فيديوهات إعلانية جاهزة للاستخدام بدون علامة مائية. منصة Sora 3 مثالية لفرق التسويق والمنشئين."
                : locale === 'ja'
                ? "Sora3ai.ioは独立したSora 3動画生成プラットフォームです。Sora 3の高度な技術を使用して、ウォーターマークなしの広告向けプロフェッショナルな動画を作成します。Sora 3プラットフォームはマーケティングチームやクリエイターに最適です。"
                : locale === 'ru'
                ? "Sora3ai.io — это независимая платформа для создания профессиональных видео Sora 3. Мы используем передовые технологии Sora 3 для создания рекламных видео без водяных знаков. Платформа Sora 3 идеально подходит для маркетинговых команд и создателей контента."
                : "Sora3ai.io is an independent platform specializing in Sora 3 video generation. We leverage advanced Sora 3 technology to produce ad-ready professional videos without watermarks. Our Sora 3 platform is designed for marketing teams and creators who need high-quality video content. Sora3ai.io is not affiliated with OpenAI, Google or any official Sora products.",
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
              "url": "https://sora3ai.io",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://sora3ai.io/search?q={search_term_string}",
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
