import { Metadata } from 'next';
import BlogIndex from '@/components/blog/BlogIndex';
import { generateHreflangAlternates } from '@/utils/hreflang';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Video Blog | Spark Robin',
  description: 'Practical guides and release-watch updates for Spark Robin, Google Veo, and AI video generation workflows.',
  alternates: generateHreflangAlternates('/blog', 'en'),
  openGraph: {
    title: 'AI Video Blog | Spark Robin',
    description: 'Practical guides and release-watch updates for Spark Robin, Google Veo, and AI video generation workflows.',
    url: 'https://sparkrobin.app/blog',
    siteName: 'Spark Robin',
    images: [
      {
        url: 'https://sparkrobin.app/logo-v2.png',
        width: 1200,
        height: 630,
        alt: 'AI Video Blog | Spark Robin',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Video Blog | Spark Robin',
    description: 'Practical guides and release-watch updates for Spark Robin, Google Veo, and AI video generation workflows.',
    images: ['https://sparkrobin.app/logo-v2.png'],
  },
};

export default async function Page() {
  return <BlogIndex locale="en" />;
}
