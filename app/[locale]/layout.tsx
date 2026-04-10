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

  const baseUrl = 'https://veo4video.io'
  
  // Get locale-specific metadata - Veo 4 focused, keyword density >3%
  let title = 'Veo 4 AI Video Generator — Next-Gen Model'
  let description = 'Explore Veo 4, a next-gen AI video generator for creators and brands. Create realistic videos with stronger motion, detail, and scene control.'
  let ogTitle = 'Veo 4 AI Video Generator — Next-Gen Model'
  let ogDescription = 'Explore Veo 4, a next-gen AI video generator for creators and brands. Create realistic videos with stronger motion, detail, and scene control.'
  
  if (locale === 'ar') {
    title = 'مولّد فيديو Veo 4 بالذكاء الاصطناعي'
    description = 'اكتشف Veo 4، الجيل المتقدم من مولدات الفيديو بالذكاء الاصطناعي. جودة أعلى، لقطات أطول، وتحكم أفضل في الحركة والمشهد. سجّل في الوصول المبكر. ويمكنك تجربة Sora 2 الآن أثناء انتظار الإطلاق.'
    ogTitle = 'مولّد فيديو Veo 4 بالذكاء الاصطناعي'
    ogDescription = 'اكتشف Veo 4، الجيل المتقدم من مولدات الفيديو بالذكاء الاصطناعي. جودة أعلى، لقطات أطول، وتحكم أفضل في الحركة والمشهد. سجّل في الوصول المبكر. ويمكنك تجربة Sora 2 الآن أثناء انتظار الإطلاق.'
  } else if (locale === 'ja') {
    title = 'Veo 4 AI 動画ジェネレーター | 次世代モデル'
    description = 'Veo 4 は、より長いシーン、高精細なビジュアル、自然な物理表現を実現する次世代AI動画モデルです。先行アクセスに登録して最新情報をチェック。公開までの間は Sora 2 をご利用いただけます。'
    ogTitle = 'Veo 4 AI 動画ジェネレーター | 次世代モデル'
    ogDescription = 'Veo 4 は、より長いシーン、高精細なビジュアル、自然な物理表現を実現する次世代AI動画モデルです。先行アクセスに登録して最新情報をチェック。公開までの間は Sora 2 をご利用いただけます。'
  } else if (locale === 'ru') {
    title = 'Veo 4 AI видео генератор — новое поколение'
    description = 'Veo 4 — мощный AI-видео генератор для маркетинга, брендов и создателей контента. Более длинные сцены, улучшенная физика и кинематографическое качество. Подпишитесь на ранний доступ. Пока ждёте — попробуйте Sora 2.'
    ogTitle = 'Veo 4 AI видео генератор — новое поколение'
    ogDescription = 'Veo 4 — мощный AI-видео генератор для маркетинга, брендов и создателей контента. Более длинные сцены, улучшенная физика и кинематографическое качество. Подпишитесь на ранний доступ. Пока ждёте — попробуйте Sora 2.'
  } else if (locale === 'es') {
    title = 'Veo 4 Generador de Video con IA — Próxima generación'
    description = 'Veo 4 es el nuevo generador de video por IA con escenas más largas, realismo mejorado y control avanzado. Únete a la lista de acceso temprano. Mientras tanto, prueba Sora 2 para crear videos profesionales sin marca de agua.'
    ogTitle = 'Veo 4 Generador de Video con IA — Próxima generación'
    ogDescription = 'Veo 4 es el nuevo generador de video por IA con escenas más largas, realismo mejorado y control avanzado. Únete a la lista de acceso temprano. Mientras tanto, prueba Sora 2 para crear videos profesionales sin marca de agua.'
  } else if (locale === 'zh-CN') {
    title = 'Veo 4 AI 视频生成器 — 下一代模型'
    description = '探索 Veo 4，专为创作者、品牌和广告商设计的下一代 AI 视频生成器。制作更长、更清晰、更逼真的视频，具有先进的物理效果和场景控制。'
    ogTitle = 'Veo 4 AI 视频生成器 — 下一代模型'
    ogDescription = '探索 Veo 4，专为创作者、品牌和广告商设计的下一代 AI 视频生成器。制作更长、更清晰、更逼真的视频，具有先进的物理效果和场景控制。'
  } else if (locale === 'de') {
    title = 'Veo 4 AI Video Generator — Naechste Generation'
    description = 'Entdecken Sie Veo 4, den AI-Videogenerator der naechsten Generation fuer Kreative, Marken und Werbetreibende. Erstellen Sie laengere, schaerfere und realistischere Videos mit fortschrittlicher Physik und Szenenkontrolle.'
    ogTitle = 'Veo 4 AI Video Generator — Naechste Generation'
    ogDescription = 'Entdecken Sie Veo 4, den AI-Videogenerator der naechsten Generation fuer Kreative, Marken und Werbetreibende. Erstellen Sie laengere, schaerfere und realistischere Videos mit fortschrittlicher Physik und Szenenkontrolle.'
  }

  // Generate hreflang alternates for homepage using utility function
  const alternates = generateHreflangAlternates('/', locale)

  return {
    title: {
      template: '%s | Veo4',
      default: title
    },
    description,
    authors: [{ name: 'Veo4 Team' }],
    creator: 'Veo4',
    publisher: 'Veo4',
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
      siteName: 'Veo4',
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: 'https://veo4video.io/logo-v2.png',
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
      images: ['https://veo4video.io/logo-v2.png'],
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
              "name": "Veo4",
              "url": "https://veo4video.io",
              "logo": "https://veo4video.io/logo-v2.png",
              "description": locale === 'ar' 
                ? "Veo4Video.io هي منصة مستقلة لإنشاء فيديوهات Veo 4 الاحترافية. نستخدم تقنيات Veo 4 المتقدمة لإنشاء فيديوهات إعلانية جاهزة للاستخدام بدون علامة مائية. منصة Veo 4 مثالية لفرق التسويق والمنشئين."
                : locale === 'ja'
                ? "Veo4Video.ioは独立したVeo 4動画生成プラットフォームです。Veo 4の高度な技術を使用して、ウォーターマークなしの広告向けプロフェッショナルな動画を作成します。Veo 4プラットフォームはマーケティングチームやクリエイターに最適です。"
                : locale === 'ru'
                ? "Veo4Video.io — это независимая платформа для создания профессиональных видео Veo 4. Мы используем передовые технологии Veo 4 для создания рекламных видео без водяных знаков. Платформа Veo 4 идеально подходит для маркетинговых команд и создателей контента."
                : "Veo4Video.io is an independent platform specializing in Veo 4 video generation. We leverage advanced Veo 4 technology to produce ad-ready professional videos without watermarks. Our Veo 4 platform is designed for marketing teams and creators who need high-quality video content. Veo4Video.io is not affiliated with OpenAI, Google or any official Sora products.",
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
              "url": "https://veo4video.io",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://veo4video.io/search?q={search_term_string}",
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
