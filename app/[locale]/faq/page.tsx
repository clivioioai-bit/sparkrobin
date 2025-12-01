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

  const baseUrl = 'https://sora3ai.io'
  const prefix = locale === 'en' ? '' : `/${locale}`
  
  let title = 'Sora 3 FAQ | Answers About Sora 3 Videos'
  let description = 'Get answers about Sora 3 video generation, campaign use, and platform capabilities. Understand how Sora 3 works and why marketing teams choose Sora 3 for video content needs.'
  
  if (locale === 'ar') {
    title = 'أسئلة Sora 3 الشائعة | إجابات عن فيديوهات Sora 3'
    description = 'احصل على إجابات حول إنشاء فيديوهات Sora 3 والاستخدام في الحملات وإمكانيات المنصة. افهم كيف يعمل Sora 3 ولماذا تختار فرق التسويق Sora 3.'
  } else if (locale === 'ja') {
    title = 'Sora 3 よくある質問 | Sora 3動画に関する回答'
    description = 'Sora 3動画生成、キャンペーンでの使用、プラットフォーム機能に関する回答を取得。Sora 3の動作方法と、マーケティングチームがSora 3を選択する理由を理解。'
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/faq', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/faq`,
      siteName: 'Sora3',
      images: [
        {
          url: 'https://sora3ai.io/logo.png',
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      locale: locale === 'ar' ? 'ar_SA' : locale === 'ja' ? 'ja_JP' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://sora3ai.io/logo.png']
    },
  }
}

const faqs = [
  { 
    q: 'What is Sora 3?', 
    a: 'Sora 3 represents the next generation of video generation technology, delivering enhanced realism, improved physics understanding, and synchronized audio. Sora 3 produces professional content ideal for advertising and brand campaigns.' 
  },
  { 
    q: 'What makes Sora 3 ideal for marketing campaigns?', 
    a: 'Sora 3 excels at creating ad-ready content with consistent character identity, extended durations up to 25 seconds, and watermark-free exports. Sora 3 is designed for marketing teams who need professional video output quickly.' 
  },
  { 
    q: 'Does Sora 3 include audio generation?', 
    a: 'Yes. Sora 3 generates synchronized audio including dialogue, ambient sounds, and effects that match your visuals. Sora 3 audio enhances the overall production value of your content.' 
  },
  { 
    q: 'How does Sora 3 maintain character consistency?', 
    a: 'Sora 3 Storyboard preserves character appearance, wardrobe, and styling across multiple scenes. This Sora 3 capability ensures your brand narratives maintain visual coherence throughout extended videos.' 
  },
  
  { 
    q: 'Can I customize Sora 3 output style?', 
    a: 'Yes. Sora 3 supports various visual styles and can maintain consistent tone across scenes. Sora 3 adapts to your creative direction for brand-aligned content.' 
  },
  { 
    q: 'Is Sora 3 output perfect?', 
    a: 'Sora 3 produces high-quality results, though occasional imperfections may occur. Sora 3 technology continues evolving to deliver increasingly realistic output.' 
  },
  { 
    q: 'Where can I access Sora 3?', 
    a: 'Sora 3 is available through our platform at sora3ai.io. We provide immediate Sora 3 access without waitlists, enabling you to start creating Sora 3 content right away.' 
  },
  
  {
    q: 'Can I use Sora 3 videos for paid advertising?',
    a: 'Absolutely. Sora 3 generated content is fully licensed for commercial use including paid ads, e-commerce videos, and social campaigns. You retain full rights to Sora 3 videos you create.'
  },
  {
    q: 'Do Sora 3 videos include watermarks?',
    a: 'No — all Sora 3 exports are completely watermark-free. Premium Sora 3 plans ensure no platform branding appears on your downloads. Sora 3 videos export clean and ready for immediate campaign use.'
  },
  {
    q: 'Does this platform use official Sora 3 technology?',
    a: 'We leverage advanced Sora 3 compatible technology within our generation pipeline. This enables immediate Sora 3 video creation without waiting for official access. sora3ai.io is not affiliated with OpenAI or any official Sora products.'
  },
  {
    q: 'Can I build 25-second Sora 3 videos?',
    a: 'Yes — Sora 3 Storyboard enables 25-second Sora 3 multi-scene generation for complete brand narratives. Sora 3 extended videos are perfect for campaigns requiring full story presentation.'
  },
  {
    q: 'Is payment information secure?',
    a: 'Absolutely. We use secure, trusted payment platforms. Your payment data is fully protected, and personal information remains confidential.'
  },
  {
    q: 'Are there hidden fees?',
    a: 'No, the displayed price is the total amount. There are no additional hidden charges. Annual Sora 3 plans offer significant savings.'
  },
  {
    q: 'Do I need video editing skills?',
    a: 'No. Simply describe your vision and Sora 3 generates professional content. Sora 3 handles the technical aspects automatically.'
  },
  {
    q: 'How do I start creating Sora 3 videos?',
    a: 'Begin immediately by signing up. Sora 3 credits are available through our pricing plans. Choose a Sora 3 plan that matches your content production needs.'
  },
  {
    q: 'What is the relationship between sora3ai.io and OpenAI\'s Sora 3?',
    a: 'sora3ai.io is an independent platform specializing in Sora 3 video generation. We leverage advanced Sora 3 technology but have no affiliation, partnership, or authorization relationship with OpenAI. We use "Sora 3" for descriptive purposes to help users understand our service. "Sora 3" is a registered trademark of OpenAI, and all trademarks belong to their respective owners.'
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
      <h1 className="text-3xl font-bold mb-6">Sora 3 Video Generation — Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-8">
        Get answers about Sora 3 video generation, campaign use, and platform capabilities. For more details, explore our 
        <a href={`${prefix}/`} className="text-primary hover:underline"> homepage</a>, 
        <a href={`${prefix}/text-to-video`} className="text-primary hover:underline"> Sora 3 Text to Video</a>, 
        <a href={`${prefix}/plans`} className="text-primary hover:underline"> Sora 3 Pricing</a>, or review our 
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
