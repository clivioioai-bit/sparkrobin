import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import HomePageClient from '@/components/home/HomePageClient'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Veo 4 Video Generator',
  alternateName: ['Veo 4 Generator', 'Veo 4 Video Creator', 'Veo4'],
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description: 'Transform ideas into polished Veo 4 video clips perfect for ads and brand campaigns. Our Veo 4 platform generates professional videos without watermarks, ideal for marketing teams and creators. Start creating Veo 4 content today.',
  url: 'https://veo4video.io',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Veo 4 video generation with credits, paid plans available'
  },
  creator: {
    '@type': 'Organization',
    name: 'Veo4',
    url: 'https://veo4video.io'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
    bestRating: '5',
    worstRating: '1'
  },
  featureList: [
    'Veo 4 text-to-video generation',
    'Veo 4 image-to-video conversion',
    'Veo 4 multi-model generation pipeline',
    'Veo 4 character consistency across scenes',
    'Veo 4 extended 25-30 second videos',
    'Veo 4 ad-ready output formats',
    'Veo 4 vertical and horizontal layouts',
    'Veo 4 watermark-free exports',
    'Veo 4 campaign-ready video generation'
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
      item: 'https://veo4video.io'
    }
  ]
}

const videoJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'Veo 4 Video Generator Demo - Create Ad-Ready Content',
  description: 'Discover how Veo4Video.io transforms concepts into polished Veo 4 video clips using advanced Veo 4 technology. Learn to create Veo 4 videos for text-to-video and image-to-video workflows. Veo4Video.io is an independent Veo 4 platform.',
  thumbnailUrl: 'https://veo4video.io/logo-v2.png',
  uploadDate: '2024-01-01T00:00:00Z',
  contentUrl: 'https://veo4video.io',
  embedUrl: 'https://veo4video.io',
  duration: 'PT30S',
  publisher: {
    '@type': 'Organization',
    name: 'Veo4',
    logo: {
      '@type': 'ImageObject',
      url: 'https://veo4video.io/logo-v2.png'
    }
  }
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Does this platform use official Veo 4 technology?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We leverage advanced Veo 4 compatible technology within our generation pipeline. This enables immediate Veo 4 video creation without waiting for official access. Veo4Video.io is not affiliated with OpenAI or any official Sora products.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I build 25-second Veo 4 videos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We currently focus on Veo 4 text-to-video and image-to-video creation for fast, campaign-ready output.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do Veo 4 videos include watermarks?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No — all Veo 4 exports are completely watermark-free. Premium Veo 4 plans ensure no platform branding on downloads.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I create Veo 4 videos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'To create Veo 4 videos, enter your prompt on veo4video.io and generate. We support Veo 4 text-to-video and image-to-video creation. All Veo 4 videos export without watermarks.'
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
