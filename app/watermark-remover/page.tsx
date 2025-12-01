import Generate from '@/page-components/Generate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sora3 Watermark Remover | Remove Watermark Tool',
  description: 'Sora3 watermark remover - Remove watermarks from Sora3 videos instantly. Sora3 watermark removal tool for Sora3 Pro and Sora3 generated videos. API-ready, commercial use. Try Sora3 watermark remover now!',
  alternates: {
    canonical: 'https://sora3ai.io/watermark-remover',
  },
  openGraph: {
    title: 'Sora3 Watermark Remover | Remove Watermark Tool',
    description: 'Sora3 watermark remover - Remove watermarks from Sora3 videos instantly. Sora3 watermark removal tool for Sora3 Pro and Sora3 generated videos. API-ready, commercial use. Try Sora3 now!',
    url: 'https://sora3ai.io/watermark-remover',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://sora3ai.io/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Sora3 Watermark Remover',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora3 Watermark Remover | Remove Watermark Tool',
    description: 'Sora3 watermark remover - Remove watermarks from Sora3 videos instantly. Sora3 watermark removal tool. API-ready, commercial use.',
    images: ['https://sora3ai.io/logo.jpg']
  },
}

export default function Page() {
  return <Generate />
}

export const revalidate = 300



