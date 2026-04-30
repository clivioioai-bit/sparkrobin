import { Metadata } from 'next';
import BlogIndex from '@/components/blog/BlogIndex';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Video Blog | Veo4',
  description: 'Practical guides and release-watch updates for Veo 4, Google Veo, and AI video generation workflows.',
};

export async function generateStaticParams() {
  return routing.locales
    .filter((locale) => locale !== 'en')
    .map((locale) => ({ locale }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  return <BlogIndex locale={locale} />;
}
