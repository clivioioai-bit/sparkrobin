import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora3 Text to Video Generator | AI Video Creator Online',
  description: 'Sora3 text-to-video generator - Create cinematic videos from text prompts using Sora3 AI technology. Sora3 text-to-video with advanced motion realism. No watermark, no invite code. Start creating with Sora3 now!',
  alternates: {
    canonical: 'https://sora3ai.io/sora3-text-to-video',
  },
  openGraph: {
    title: 'Sora3 Text to Video Generator | AI Video Creator Online',
    description: 'Sora3 text-to-video generator - Create cinematic videos from text prompts using Sora3 AI. Sora3 text-to-video with advanced motion realism. No watermark required. Try Sora3 now!',
    url: 'https://sora3ai.io/sora3-text-to-video',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://sora3ai.io/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Sora3 Text to Video Generator',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora3 Text to Video Generator | AI Video Creator Online',
    description: 'Sora3 text-to-video generator - Create cinematic videos from text prompts. Sora3 text-to-video with advanced motion realism. No watermark required.',
    images: ['https://sora3ai.io/logo.jpg']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300



