import { Metadata } from 'next';
import BlogIndex from '@/components/blog/BlogIndex';
import { routing } from '@/i18n/routing';
import { generateHreflangAlternates } from '@/utils/hreflang';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'AI Video Blog | Spark Robin',
    description: 'Practical guides and release-watch updates for Spark Robin, Google Veo, and AI video generation workflows.',
    alternates: generateHreflangAlternates('/blog', locale),
  };
}

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
