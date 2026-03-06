import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import HomePageClient from '@/components/home/HomePageClient'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Sora 3 Video Generator',
  alternateName: ['Sora 3 Generator', 'Sora 3 Video Creator', 'Sora3'],
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description: 'Transform ideas into polished Sora 3 video clips perfect for ads and brand campaigns. Our Sora 3 platform generates professional videos without watermarks, ideal for marketing teams and creators. Start creating Sora 3 content today.',
  url: 'https://sora3ai.io',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Sora 3 video generation with credits, paid plans available'
  },
  creator: {
    '@type': 'Organization',
    name: 'Sora3',
    url: 'https://sora3ai.io'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
    bestRating: '5',
    worstRating: '1'
  },
  featureList: [
    'Sora 3 text-to-video generation',
    'Sora 3 image-to-video conversion',
    'Sora 3 Storyboard builder for extended narratives',
    'Sora 3 multi-model generation pipeline',
    'Sora 3 character consistency across scenes',
    'Sora 3 extended 25-30 second videos',
    'Sora 3 ad-ready output formats',
    'Sora 3 vertical and horizontal layouts',
    'Sora 3 watermark-free exports',
    'Sora 3 campaign-ready video generation'
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
      item: 'https://sora3ai.io'
    }
  ]
}

const videoJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'Sora 3 Video Generator Demo - Create Ad-Ready Content',
  description: 'Discover how Sora3ai.io transforms concepts into polished Sora 3 video clips using advanced Sora 3 technology. Learn to create Sora 3 videos for text-to-video, image-to-video, and Sora 3 Storyboard narratives. Sora3ai.io is an independent Sora 3 platform.',
  thumbnailUrl: 'https://sora3ai.io/logo.jpg',
  uploadDate: '2024-01-01T00:00:00Z',
  contentUrl: 'https://sora3ai.io',
  embedUrl: 'https://sora3ai.io',
  duration: 'PT30S',
  publisher: {
    '@type': 'Organization',
    name: 'Sora3',
    logo: {
      '@type': 'ImageObject',
      url: 'https://sora3ai.io/logo.jpg'
    }
  }
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Does this platform use official Sora 3 technology?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We leverage advanced Sora 3 compatible technology within our generation pipeline. This enables immediate Sora 3 video creation without waiting for official access. Sora3ai.io is not affiliated with OpenAI or any official Sora products.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I build 25-second Sora 3 videos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — Sora 3 Storyboard enables 25-second Sora 3 multi-scene generation for complete brand narratives.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do Sora 3 videos include watermarks?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No — all Sora 3 exports are completely watermark-free. Premium Sora 3 plans ensure no platform branding on downloads.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I create Sora 3 videos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'To create Sora 3 videos, enter your prompt on sora3ai.io and generate. We support Sora 3 text-to-video, image-to-video, and Sora 3 Storyboard creation. All Sora 3 videos export without watermarks.'
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
      <HomePageClient />
    </>
  )
}
