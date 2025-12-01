import Storyboard from '@/page-components/Storyboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora3 Pro Storyboard | Multi-Scene Video Generator',
  description: 'Sora3 Pro Storyboard - Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels. Sora3 Pro storyboard with scene control and visual consistency. No watermark required. Try Sora3 Pro now!',
  alternates: {
    canonical: 'https://sora3ai.io/sora-3-storyboard',
  },
  openGraph: {
    title: 'Sora3 Pro Storyboard | Multi-Scene Video Generator',
    description: 'Sora3 Pro Storyboard - Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels. Sora3 Pro storyboard with scene control. No watermark required. Try Sora3 Pro now!',
    url: 'https://sora3ai.io/sora-3-storyboard',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://sora3ai.io/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Sora3 Pro Storyboard Video Generator',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora3 Pro Storyboard | Multi-Scene Video Generator',
    description: 'Sora3 Pro Storyboard - Create multi-scene AI videos up to 25s for YouTube Shorts, TikTok and Reels. Sora3 Pro storyboard. No watermark required.',
    images: ['https://sora3ai.io/logo.jpg']
  },
}

export default function Page() {
  return <Storyboard />
}

export const revalidate = 300

