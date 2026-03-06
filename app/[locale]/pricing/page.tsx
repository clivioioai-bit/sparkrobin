import Pricing from '@/page-components/Pricing'
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
  
  let title = 'Sora 3 Pricing | Plans for Video Campaigns'
  let description = 'Select your Sora 3 plan for professional video generation. Choose from Basic, Creator, or Pro plans with monthly and annual billing. Start creating Sora 3 content for your campaigns today.'
  
  if (locale === 'ar') {
    title = 'أسعار Sora 3 | خطط فيديوهات الحملات'
    description = 'اختر خطتك Sora 3 لإنشاء فيديوهات احترافية. اختر من بين خطط Basic أو Creator أو Pro مع الفوترة الشهرية والسنوية. ابدأ في إنشاء محتوى Sora 3 اليوم.'
  } else if (locale === 'ja') {
    title = 'Sora 3 料金 | 動画キャンペーン向けプラン'
    description = 'プロフェッショナルな動画生成のためのSora 3プランを選択。Basic、Creator、Proプランから選択。月額・年額請求オプションあり。今すぐSora 3コンテンツを作成開始。'
  } else if (locale === 'ru') {
    title = 'Sora 3 Тарифы | Планы для Видео Кампаний'
    description = 'Выберите план Sora 3 для профессиональной генерации видео. Basic, Creator или Pro с ежемесячной и годовой оплатой. Начните создавать контент Sora 3 для ваших кампаний.'
  } else if (locale === 'es') {
    title = 'Sora 3 Precios | Planes para Campanas de Video'
    description = 'Selecciona tu plan Sora 3 para generacion profesional de video. Elige entre planes Basic, Creator o Pro con facturacion mensual y anual. Comienza a crear contenido Sora 3 hoy.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/pricing', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/pricing`,
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
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function PricingPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  return <Pricing />
}


