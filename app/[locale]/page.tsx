import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import HomePageClient from '@/components/home/HomePageClient'
import WhatIsGeminiOmniFlashSection from '@/components/home/WhatIsGeminiOmniFlashSection'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Gemini Omni Flash Video Generator',
  alternateName: ['Gemini Omni Flash AI Video Generator', 'Text to Video Generator', 'Image to Video Generator'],
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description: 'Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, product demos, and creative projects online.',
  url: 'https://omniflashai.io',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'AI video generation with credits and paid plans available'
  },
  creator: {
    '@type': 'Organization',
    name: 'omniflashai.io',
    url: 'https://omniflashai.io'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
    bestRating: '5',
    worstRating: '1'
  },
  featureList: [
    'Gemini Omni Flash text to video',
    'Gemini Omni Flash image to video',
    'AI video generation from prompts',
    'Image animation and motion prompts',
    'Marketing video generation',
    'Product demo video generation',
    'Social media video clips',
    'Creative AI video workflows'
  ]
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://omniflashai.io'
    }
  ]
}

const videoJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'Gemini Omni Flash AI Video Generator Demo',
  description: 'See how omniflashai.io helps creators turn text prompts and images into AI videos for ads, products, social media, and creative projects.',
  thumbnailUrl: 'https://omniflashai.io/logo-v2.png',
  uploadDate: '2024-01-01T00:00:00Z',
  contentUrl: 'https://omniflashai.io',
  embedUrl: 'https://omniflashai.io',
  duration: 'PT30S',
  publisher: {
    '@type': 'Organization',
    name: 'omniflashai.io',
    logo: {
      '@type': 'ImageObject',
      url: 'https://omniflashai.io/logo-v2.png'
    }
  }
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is omniflashai.io an official Google product?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. omniflashai.io is an independent AI video generation tool site. It is not affiliated with Google, Google DeepMind, OpenAI, or official Sora products.'
      }
    },
    {
      '@type': 'Question',
      name: 'What can I do here today?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can create AI videos from text prompts or images, then refine motion, camera, style, and output settings for marketing or creative use.'
      }
    },
    {
      '@type': 'Question',
      name: 'What types of videos can I create?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can create ad creatives, product demo videos, social media clips, visual concepts, and prompt-based cinematic AI video drafts.'
      }
    },
    {
      '@type': 'Question',
      name: 'How should I start generating a video?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Start with a clear text prompt or upload an image, then describe subject, camera movement, motion, style, and aspect ratio before generating.'
      }
    }
  ]
}

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  return (
    <>
      <script
        id="jsonld-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        id="jsonld-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        id="jsonld-video"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <script
        id="jsonld-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomePageClient>
        <WhatIsGeminiOmniFlashSection locale={locale} />
      </HomePageClient>
    </>
  )
}
