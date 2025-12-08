import BlogIndex from '@/components/blog/BlogIndex';
import { generateHreflangAlternates } from '@/utils/hreflang';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata = {
  title: 'Sora3 Blog | Tutorials, Product Notes, and Release News',
  description: 'Read the latest Sora3 tutorials, product updates, and campaign playbooks. Every article is written in Markdown and ships directly on sora3ai.io.',
  alternates: generateHreflangAlternates('/blog', 'en'),
  openGraph: {
    title: 'Sora3 Blog | Tutorials, Product Notes, and Release News',
    description: 'Learn how to get the most from Sora3 with guides, release notes, and real campaign examples.',
    url: 'https://sora3ai.io/blog',
    siteName: 'Sora3',
    images: [
      {
        url: 'https://sora3ai.io/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Sora3 Blog',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora3 Blog | Tutorials, Product Notes, and Release News',
    description: 'Guides, release notes, and campaign ideas for Sora3 video generation.',
    images: ['https://sora3ai.io/logo.jpg']
  },
};

export default function Page() {
  return <BlogIndex locale="en" />;
}
