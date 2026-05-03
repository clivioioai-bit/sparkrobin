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

  const baseUrl = 'https://sparkrobin.app'
  const prefix = locale === 'en' ? '' : `/${locale}`
  
  let title = 'Spark Robin FAQ | Pricing, Use, and Video Limits'
  let description = 'Find answers about Spark Robin pricing, commercial use, video length, watermarks, and how the platform works before you start.'
  
  if (locale === 'ar') {
    title = 'أسئلة Spark Robin الشائعة | الأسعار والاستخدام والمدة'
    description = 'اعثر على إجابات حول أسعار Spark Robin والاستخدام التجاري ومدة الفيديو والعلامات المائية وكيف تعمل المنصة قبل البدء.'
  } else if (locale === 'ja') {
    title = 'Spark Robin よくある質問 | 料金・用途・動画尺'
    description = 'Spark Robinの料金、商用利用、動画の長さ、ウォーターマーク、プラットフォームの使い方に関する回答を確認できます。'
  } else if (locale === 'ru') {
    title = 'Spark Robin FAQ | Тарифы, Использование и Лимиты'
    description = 'Найдите ответы о тарифах Spark Robin, коммерческом использовании, длине видео, водяных знаках и работе платформы до начала генерации.'
  } else if (locale === 'es') {
    title = 'Spark Robin FAQ | Precios, Uso y Duracion'
    description = 'Encuentra respuestas sobre precios de Spark Robin, uso comercial, duracion del video, marcas de agua y funcionamiento de la plataforma.'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/faq', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/faq`,
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

const faqs = [
  {
    q: 'What is sparkrobin.app?',
    a: 'sparkrobin.app is an independent Spark Robin release-watch and AI video workflow site. It helps creators track confirmed updates, structure reusable prompts, and create reviewable video drafts from text or images.'
  },
  {
    q: 'Can I create drafts from text prompts?',
    a: 'Yes. The text workflow helps you turn a rough idea into layered scene notes, then generate a draft you can compare against the brief.'
  },
  {
    q: 'Can I use images as creative references?',
    a: 'Yes. The image workflow uses a reference image as the visual anchor, then lets you add motion, camera, pacing, and continuity notes.'
  },
  {
    q: 'How do I keep drafts consistent?',
    a: 'Use the same reference assets and continuity notes across related drafts. Keep wardrobe, subject, setting, and camera rules explicit instead of relying on memory.'
  },
  {
    q: 'Can I plan multi-shot ideas?',
    a: 'Yes. Write the idea as shot notes first, then generate drafts from the sections you want to test. This keeps longer concepts easier to review.'
  },
  {
    q: 'Are drafts suitable for commercial work?',
    a: 'Commercial use depends on your plan, assets, prompts, and applicable terms. Check rights and licensing before publishing any output.'
  },
  {
    q: 'What should I review before exporting?',
    a: 'Check factual claims, asset rights, brand fit, visual artifacts, and whether the draft actually follows the brief.'
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
    q: 'Who is this workflow best for?',
    a: 'It is best for creators, marketers, e-commerce teams, agencies, and product teams that want reusable AI video briefs and faster draft review.'
  },
  {
    q: 'How do I get started?',
    a: 'Open text to video for a written idea, or image to video for a visual reference. Add shot notes, generate a draft, then revise the brief.'
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
      <h1 className="text-3xl font-bold mb-6">Spark Robin FAQ</h1>
      <p className="text-muted-foreground mb-8">
        Find answers about Spark Robin pricing, text to video, image to video, commercial use, video length, watermarks, and platform setup. For more details, explore our 
        <a href={`${prefix}/`} className="text-primary hover:underline"> homepage</a>, 
        <a href={`${prefix}/spark-robin-text-to-video`} className="text-primary hover:underline"> Spark Robin Text to Video</a>, 
        <a href={`${prefix}/spark-robin-image-to-video`} className="text-primary hover:underline"> Spark Robin Image to Video</a>, 
        <a href={`${prefix}/pricing`} className="text-primary hover:underline"> Spark Robin Pricing</a>, or review our 
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
