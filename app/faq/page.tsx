import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spark Robin FAQ | Release Watch and AI Video Workflow Questions',
  description: 'Find answers about Spark Robin availability, release-watch claims, prompt workflows, reference images, draft generation, and pricing.',
  alternates: {
    canonical: 'https://sparkrobinai.io/faq',
  },
  openGraph: {
    title: 'Spark Robin FAQ | Release Watch and AI Video Workflow Questions',
    description: 'Find answers about Spark Robin availability, prompt workflows, reference images, draft generation, and pricing.',
    url: 'https://sparkrobinai.io/faq',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://sparkrobinai.io/logo-v2.png',
        width: 1200,
        height: 630,
        alt: 'Spark Robin FAQ',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spark Robin FAQ | Release Watch and AI Video Workflow Questions',
    description: 'Find answers about Spark Robin availability, prompt workflows, reference images, draft generation, and pricing.',
    images: ['https://sparkrobinai.io/logo-v2.png']
  },
}

const faqs = [
  { 
    q: 'What is sparkrobinai.io?', 
    a: 'sparkrobinai.io is an independent Spark Robin release-watch and AI video workflow site. It helps creators track updates, prepare prompt systems, and create reviewable drafts from text or images.' 
  },
  { 
    q: 'Is Spark Robin officially available from Google?', 
    a: 'Official Spark Robin availability and specs should be checked through Google, Google DeepMind, or Google Cloud. This site avoids treating unconfirmed claims as facts.' 
  },
  { 
    q: 'What can I do here now?', 
    a: 'You can structure prompts, upload reference images, generate video drafts, and build a review process that can adapt when model access changes.' 
  },
  { 
    q: 'Why focus on prompts and references?', 
    a: 'Reusable prompt briefs and reference packs make AI video work less random. They help teams compare drafts and preserve what worked.' 
  },
  
  { 
    q: 'Can I control style and tone?', 
    a: 'Yes. Add style, tone, pacing, camera, and continuity notes to the prompt so the draft has a clearer creative target.' 
  },
  { 
    q: 'Will AI video drafts make errors?', 
    a: 'Yes. Treat each output as a draft. Review it against the brief, then refine the prompt or reference notes for the next version.' 
  },
  { 
    q: 'Where should I verify official Spark Robin news?', 
    a: 'Use official Google, Google DeepMind, and Google Cloud channels for confirmed model names, access rules, pricing, and technical limits.' 
  },
  
  {
    q: 'Can I use drafts for commercial projects?',
    a: 'Commercial use depends on your plan, source assets, prompt content, and the applicable terms. Check rights before publishing.'
  },
  {
    q: 'Do I need editing experience?',
    a: 'No. Start with a clear brief or reference image. The workflow is built around writing better instructions and reviewing drafts.'
  },
  {
    q: 'Is this an official Google product?',
    a: 'No. sparkrobinai.io is independent and is not affiliated with Google, Google DeepMind, OpenAI, or official Sora products.'
  },
  {
    q: 'How should I get started?',
    a: 'Start with text to video if you have an idea or script. Start with image to video if you already have a visual reference.'
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
    q: 'What is the relationship between sparkrobinai.io and Google Spark Robin?',
    a: 'sparkrobinai.io is a completely independent AI video generation platform with no affiliation, partnership, or authorization relationship with Google or Google DeepMind. We provide Spark Robin video generation workflows using our own product layer and compatible generation pipeline. All trademarks belong to their respective owners.'
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
      <h1 className="text-3xl font-bold mb-6">Spark Robin Video Generation — Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-8">
        Find answers to common questions about Spark Robin video generation. For more information, visit our 
        <a href="/" className="text-primary hover:underline"> homepage</a>, 
        <a href="/spark-robin-text-to-video" className="text-primary hover:underline"> Text to Video</a>, 
        <a href="/pricing" className="text-primary hover:underline"> Pricing</a>, or review our 
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
