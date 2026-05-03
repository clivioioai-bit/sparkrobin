import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import HomePageClient from '@/components/home/HomePageClient'
import WhatIsSparkRobinSection from '@/components/home/WhatIsSparkRobinSection'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Spark Robin Video Generator',
  alternateName: ['AI Video Workflow Lab', 'Video Creator Workspace'],
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description: 'Track release updates, structure reusable AI video prompts, and create reviewable text-to-video or image-to-video drafts while the next model cycle develops.',
  url: 'https://sparkrobin.app',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'AI video generation with credits and paid plans available'
  },
  creator: {
    '@type': 'Organization',
    name: 'sparkrobin.app',
    url: 'https://sparkrobin.app'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
    bestRating: '5',
    worstRating: '1'
  },
  featureList: [
    'Release-watch guidance',
    'Structured text-to-video prompt briefs',
    'Reference-led image-to-video drafts',
    'Reusable shot notes and continuity prompts',
    'AI video workflow preparation',
    'Creative review and iteration support',
    'Prompt libraries for future model access',
    'Marketing and product video draft workflows'
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
      item: 'https://sparkrobin.app'
    }
  ]
}

const videoJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'Workflow Demo - From Brief to Reviewable Draft',
  description: 'See how sparkrobin.app helps creators turn concepts into structured prompts, reference-led drafts, and repeatable AI video workflows while tracking release updates.',
  thumbnailUrl: 'https://sparkrobin.app/logo-v2.png',
  uploadDate: '2024-01-01T00:00:00Z',
  contentUrl: 'https://sparkrobin.app',
  embedUrl: 'https://sparkrobin.app',
  duration: 'PT30S',
  publisher: {
    '@type': 'Organization',
    name: 'sparkrobin.app',
    logo: {
      '@type': 'ImageObject',
      url: 'https://sparkrobin.app/logo-v2.png'
    }
  }
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is sparkrobin.app an official Google product?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. sparkrobin.app is an independent release-watch and AI video workflow site. It is not affiliated with Google, Google DeepMind, OpenAI, or official Sora products.'
      }
    },
    {
      '@type': 'Question',
      name: 'What can I do here today?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can organize prompts, prepare reference assets, create text-to-video or image-to-video drafts, and build a repeatable review workflow.'
      }
    },
    {
      '@type': 'Question',
      name: 'Why prepare before official details are confirmed?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Reusable prompts, shot notes, and reference libraries remain useful across current AI video tools and future model access.'
      }
    },
    {
      '@type': 'Question',
      name: 'How should I start this workflow?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Start with a clear brief, split it into subject, camera, motion, style, and continuity notes, then generate drafts and compare them against the brief.'
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
        <WhatIsSparkRobinSection locale={locale} />
      </HomePageClient>
    </>
  )
}
