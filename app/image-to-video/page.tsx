import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora3 Image to Video Generator | Photo to Video Converter',
  description: 'Sora3 image-to-video generator - Convert photos into animated videos using Sora3 AI technology. Sora3 image-to-video converter. Transform static images into cinematic videos. No watermark required. Try Sora3 now!',
  alternates: {
    canonical: 'https://sora3ai.io/image-to-video',
  },
  openGraph: {
    title: 'Sora3 Image to Video Generator | Photo to Video Converter',
    description: 'Sora3 image-to-video generator - Convert photos into animated videos using Sora3 AI. Sora3 image-to-video converter. Transform static images into cinematic videos. No watermark required. Try Sora3 now!',
    url: 'https://sora3ai.io/image-to-video',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://sora3ai.io/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sora3 Image to Video Generator',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora3 Image to Video Generator | Photo to Video Converter',
    description: 'Sora3 image-to-video generator - Convert photos into animated videos using Sora3 AI. Sora3 image-to-video converter. No watermark required.',
    images: ['https://sora3ai.io/logo.png']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300


