import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { generateHreflangAlternates } from '@/utils/hreflang'

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
  const prefix = locale === 'en' ? '' : `/${locale}`
  
  let title = 'Veo 4 FAQ | Pricing, Use, and Video Limits'
  let description = 'Find answers about Veo 4 pricing, commercial use, video length, watermarks, and how the platform works before you start.'
  
  if (locale === 'ar') {
    title = 'أسئلة Veo 4 الشائعة | الأسعار والاستخدام والمدة'
    description = 'اعثر على إجابات حول أسعار Veo 4 والاستخدام التجاري ومدة الفيديو والعلامات المائية وكيف تعمل المنصة قبل البدء.'
  } else if (locale === 'ja') {
    title = 'Veo 4 よくある質問 | 料金・用途・動画尺'
    description = 'Veo 4の料金、商用利用、動画の長さ、ウォーターマーク、プラットフォームの使い方に関する回答を確認できます。'
  } else if (locale === 'ru') {
    title = 'Veo 4 FAQ | Тарифы, Использование и Лимиты'
    description = 'Найдите ответы о тарифах Veo 4, коммерческом использовании, длине видео, водяных знаках и работе платформы до начала генерации.'
  } else if (locale === 'es') {
    title = 'Veo 4 FAQ | Precios, Uso y Duracion'
    description = 'Encuentra respuestas sobre precios de Veo 4, uso comercial, duracion del video, marcas de agua y funcionamiento de la plataforma.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/faq', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/faq`,
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

const faqs = [
  {
    q: 'What is a VEO 4 AI video platform?',
    a: 'A VEO 4 AI video platform helps you create videos from text prompts or images through a faster web workflow. On veo4video.io, that includes VEO 4 text to video, VEO 4 image to video, and campaign-ready exports for ads, product videos, and social content.'
  },
  {
    q: 'Can I create VEO 4 videos from text prompts?',
    a: 'Yes. VEO 4 text to video lets you turn prompts into polished clips for ads, social posts, product storytelling, and landing-page media. This workflow is useful when you want to move from idea to first draft quickly.'
  },
  {
    q: 'Can I turn images into VEO 4 videos?',
    a: 'Yes. VEO 4 image to video helps you animate a still image into a more dynamic clip with motion, cleaner framing, and export-ready output. This is useful for product shots, creator assets, and ad variations.'
  },
  {
    q: 'How does Veo4 maintain character consistency across scenes?',
    a: 'Veo4 maintains stronger character consistency by keeping the same subject appearance, wardrobe, and visual direction across related shots. This is useful for brand storytelling, product explainers, and ad campaigns where the same character must stay recognizable.'
  },
  {
    q: 'Can Veo4 generate videos longer than 10 seconds?',
    a: 'Yes. Veo4 supports longer video workflows beyond short clips, including multi-scene generation for more complete brand stories and campaign concepts. Available duration depends on the workflow you choose on the platform.'
  },
  {
    q: 'Are VEO 4 videos suitable for commercial use?',
    a: 'Yes. VEO 4 videos can be used for commercial work such as paid ads, e-commerce content, landing pages, and social campaigns, subject to the platform terms and the rules that apply to your source assets and prompts.'
  },
  {
    q: 'Do Veo4 videos include watermarks?',
    a: 'No. Veo4 exports from our platform are watermark-free, so the final video is cleaner for ads, product demos, and social publishing.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept the payment methods shown at checkout through secure payment providers. Pricing is shown before purchase so you can review the plan and billing terms before you pay.'
  },
  {
    q: 'Are there any hidden charges?',
    a: 'No. The displayed price is the amount you pay for the selected plan. There are no hidden charges added later outside the stated billing terms.'
  },
  {
    q: 'Who is VEO 4 best for?',
    a: 'VEO 4 is a strong fit for marketers, creators, e-commerce teams, agencies, and product teams that need faster video production for ads, social content, explainers, and campaign testing.'
  },
  {
    q: 'How do I get started with VEO 4?',
    a: 'Choose a plan, open the text-to-video or image-to-video workflow, enter your prompt or upload your image, then generate and export your clip. Most teams can move from concept to usable output in a few minutes.'
  }
]

export default async function FAQPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const prefix = locale === 'en' ? '' : `/${locale}`
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    }))
  }
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-3xl font-bold mb-6">VEO 4 FAQ</h1>
      <p className="text-muted-foreground mb-8">
        Find answers about VEO 4 pricing, text to video, image to video, commercial use, video length, watermarks, and platform setup. For more details, explore our 
        <a href={`${prefix}/`} className="text-primary hover:underline"> homepage</a>, 
        <a href={`${prefix}/veo4-text-to-video`} className="text-primary hover:underline"> Veo 4 Text to Video</a>, 
        <a href={`${prefix}/veo4-image-to-video`} className="text-primary hover:underline"> Veo 4 Image to Video</a>, 
        <a href={`${prefix}/pricing`} className="text-primary hover:underline"> Veo 4 Pricing</a>, or review our 
        <a href={`${prefix}/terms`} className="text-primary hover:underline"> Terms of Service</a> and 
        <a href={`${prefix}/privacy`} className="text-primary hover:underline"> Privacy Policy</a>.
      </p>
      <ul className="space-y-6">
        {faqs.map((f, i) => (
          <li key={i}>
            <h2 className="text-xl font-semibold mb-1">{f.q}</h2>
            <p className="text-muted-foreground">{f.a}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
