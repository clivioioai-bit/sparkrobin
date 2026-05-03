import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import HomePageClient from '@/components/home/HomePageClient'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Spark Robin Video Generator',
  alternateName: ['Spark Robin Generator', 'Spark Robin Video Creator', 'Spark Robin'],
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description: 'Track Spark Robin updates, structure reusable AI video prompts, and create reviewable text-to-video or image-to-video drafts while the next model cycle develops.',
  url: 'https://sparkrobinai.io',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Spark Robin video generation with credits, paid plans available'
  },
  creator: {
    '@type': 'Organization',
    name: 'Spark Robin',
    url: 'https://sparkrobinai.io'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
    bestRating: '5',
    worstRating: '1'
  },
  featureList: [
    'Spark Robin release-watch guidance',
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
      item: 'https://sparkrobinai.io'
    }
  ]
}

const videoJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'Spark Robin Workflow Demo - From Brief to Reviewable Draft',
  description: 'See how sparkrobinai.io helps creators turn concepts into structured prompts, reference-led drafts, and repeatable AI video workflows while tracking Spark Robin updates.',
  thumbnailUrl: 'https://sparkrobinai.io/logo-v2.png',
  uploadDate: '2024-01-01T00:00:00Z',
  contentUrl: 'https://sparkrobinai.io',
  embedUrl: 'https://sparkrobinai.io',
  duration: 'PT30S',
  publisher: {
    '@type': 'Organization',
    name: 'Spark Robin',
    logo: {
      '@type': 'ImageObject',
      url: 'https://sparkrobinai.io/logo-v2.png'
    }
  }
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is sparkrobinai.io an official Google Spark Robin product?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. sparkrobinai.io is an independent Spark Robin release-watch and AI video workflow site. It is not affiliated with Google, Google DeepMind, OpenAI, or official Sora products.'
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
      name: 'Why prepare before official Spark Robin details are confirmed?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Reusable prompts, shot notes, and reference libraries remain useful across current AI video tools and future model access.'
      }
    },
    {
      '@type': 'Question',
      name: 'How should I start a Spark Robin workflow?',
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
      <HomePageClient />
    </>
  )
}
