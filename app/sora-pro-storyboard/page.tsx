import Storyboard from '@/page-components/Storyboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora3 Pro Storyboard | Multi-Scene Video Generator',
  description: 'Sora3 Pro Storyboard - Create professional multi-scene videos with sequential shots, visual consistency and precise duration control. Sora3 Pro storyboard generator. No watermark required. Try Sora3 Pro now!',
  alternates: {
    canonical: 'https://sora3ai.io/sora-pro-storyboard',
  },
  openGraph: {
    title: 'Sora3 Pro Storyboard | Multi-Scene Video Generator',
    description: 'Sora3 Pro Storyboard - Create professional multi-scene videos with sequential shots, visual consistency and precise duration control. Sora3 Pro storyboard. No watermark required. Try Sora3 Pro now!',
    url: 'https://sora3ai.io/sora-pro-storyboard',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://sora3ai.io/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora3 Pro Storyboard',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora3 Pro Storyboard | Multi-Scene Video Generator',
    description: 'Sora3 Pro Storyboard - Create professional multi-scene videos with sequential shots and visual consistency. Sora3 Pro storyboard. No watermark required.',
    images: ['https://sora3ai.io/logo.png']
  },
}

export default function Page() {
  return <Storyboard />
}

export const revalidate = 300
