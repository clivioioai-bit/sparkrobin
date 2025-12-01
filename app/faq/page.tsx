import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sora3 FAQ | Frequently Asked Questions About Sora3',
  description: 'Find answers to common Sora3 questions: What is Sora3? How to use Sora3? Is Sora3 free? Learn about Sora3 video generation, features, and more.',
  alternates: {
    canonical: 'https://sora3ai.io/faq',
  },
  openGraph: {
    title: 'Sora3 FAQ | Frequently Asked Questions About Sora3',
    description: 'Find answers to common Sora3 questions: What is Sora3? How to use Sora3? Learn about Sora3 video generation, features, pricing, and more.',
    url: 'https://sora3ai.io/faq',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://sora3ai.io/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Sora3 FAQ',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora3 FAQ | Frequently Asked Questions About Sora3',
    description: 'Find answers to common Sora3 questions: What is Sora3? How to use Sora3? Learn about Sora3 features and pricing.',
    images: ['https://sora3ai.io/logo.jpg']
  },
}

const faqs = [
  { 
    q: 'What is Sora3?', 
    a: 'Sora3 is an advanced video + audio generation model, designed to be more physically accurate, realistic, and controllable than prior systems. It also features synchronized dialogue and sound effects.' 
  },
  { 
    q: 'What are the core advantages of Sora3?', 
    a: 'Sora3 offers physical realism with better physics respect, higher controllability for intricate instructions, audio-video synchronization, cameo/likeness insertion capabilities, and flexible style support.' 
  },
  { 
    q: 'Does Sora3 generate both video and audio?', 
    a: 'Yes. Sora3 is a unified video-audio generation system that can create dialogues, ambient soundscapes, and sound effects in sync with the visuals.' 
  },
  { 
    q: 'How does synchronized dialogue work?', 
    a: 'Sora3 aligns generated dialogue and sound effects with character lip movements, scene timing, and camera cuts, ensuring coherent voice, motion, and cut transitions.' 
  },
  
  { 
    q: 'Can I control the style and tone?', 
    a: 'Yes. Sora3 supports various styles (realistic, cinematic, anime, etc.) and can follow instructions across shots to maintain consistent tone and look.' 
  },
  { 
    q: 'Will Sora3 make errors?', 
    a: 'Yes, it\'s not perfect. Mistakes often resemble internal-agent errors rather than broken visuals, which is seen as progress in better simulating reality.' 
  },
  { 
    q: 'Where is Sora3 available?', 
    a: 'Sora3 is available via the Sora iOS app in the U.S. and Canada initially, with plans to expand to additional countries and provide web/API access.' 
  },
  
  {
    q: 'Can I use for commercial advertising?',
    a: 'Yes. Videos generated with Sora3 can be used for commercial projects, including TikTok ads, Shopify product videos, and social media campaigns. You own the rights to videos you create, subject to our acceptable use policy.'
  },
  {
    q: 'Do videos have watermarks?',
    a: 'No — all Sora3 videos are watermark-free. Premium plans include no platform watermark downloads. Your exported AI videos include no platform-added marks and are ready for commercial use. "No Watermark" refers only to watermarks added by this platform. We do not support removing watermarks from copyrighted or stock footage. Not for removing third-party or stock provider watermarks.'
  },
  {
    q: 'Does Saro use the official Sora3 model?',
    a: 'Saro.ai uses Sora-compatible and Sora3 models within our multi-model generation pipeline. This allows creators to produce Sora3–like results instantly without needing official access.'
  },
  {
    q: 'Can I create Sora3 25-second videos?',
    a: 'Yes — our Sora3 Storyboard feature supports 25-second Sora3 multi-scene generation.'
  },
  {
    q: 'If I make a payment, will my payment information be safe?',
    a: 'Absolutely. We use secure, trusted payment platforms and banks. Your payment is fully protected, and no personal information will ever be exposed or leaked.'
  },
  {
    q: 'Are there any hidden charges?',
    a: 'No, the price displayed is the total amount you\'ll pay. There are no additional hidden fees.'
  },
  {
    q: 'Do I need editing experience?',
    a: 'No. Simply enter prompts to generate cinematic videos.'
  },
  {
    q: 'How do I get started?',
    a: 'You can start generating videos immediately. Credits are available through our pricing plans. Visit our pricing page to choose a plan that fits your needs.'
  },
  {
    q: 'What is the relationship between sora3ai.io and OpenAI\'s Sora3?',
    a: 'sora3ai.io is a completely independent AI video generation platform with no affiliation, partnership, or authorization relationship with OpenAI\'s Sora3. We provide Sora3 video generation services using our own technology. We use the term "Sora3" only for descriptive and comparative purposes to help users understand our service positioning. "Sora3" is a registered trademark of OpenAI, and all trademarks belong to their respective owners.'
  }
]

export default function FAQPage() {
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
      <h1 className="text-3xl font-bold mb-6">Sora3 Video Generation — Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-8">
        Find answers to common questions about Sora3 video generation. For more information, visit our 
        <a href="/" className="text-primary hover:underline"> homepage</a>, 
        <a href="/sora3-text-to-video" className="text-primary hover:underline"> Text to Video</a>, 
        <a href="/plans" className="text-primary hover:underline"> Pricing</a>, or review our 
        <a href="/terms" className="text-primary hover:underline"> Terms of Service</a> and 
        <a href="/privacy" className="text-primary hover:underline"> Privacy Policy</a>.
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

