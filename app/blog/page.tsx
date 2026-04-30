import { Metadata } from 'next';
import BlogIndex from '@/components/blog/BlogIndex';
import { generateHreflangAlternates } from '@/utils/hreflang';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Video Blog | Veo4',
  description: 'Practical guides and release-watch updates for Veo 4, Google Veo, and AI video generation workflows.',
  alternates: generateHreflangAlternates('/blog', 'en'),
};

export default async function Page() {
  return <BlogIndex locale="en" />;
}
