import Pricing from '@/page-components/Pricing'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora3 Pricing Plans | Choose Your Sora3 Plan',
  description: 'View Sora3 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options. Create professional videos with Sora3 technology.',
  alternates: {
    canonical: 'https://sora3ai.io/plans',
  },
  openGraph: {
    title: 'Sora3 Pricing Plans | Choose Your Sora3 Plan',
    description: 'View Sora3 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options. Start creating with Sora3 today!',
    url: 'https://sora3ai.io/plans',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://sora3ai.io/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Sora3 Pricing Plans',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora3 Pricing Plans | Choose Your Sora3 Plan',
    description: 'View Sora3 pricing plans. Choose from Basic, Creator, or Pro plans.',
    images: ['https://sora3ai.io/logo.jpg']
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PlansPage() {
  return <Pricing />
}


