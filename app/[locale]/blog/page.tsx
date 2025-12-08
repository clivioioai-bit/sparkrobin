import BlogIndex from '@/components/blog/BlogIndex';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { generateHreflangAlternates } from '@/utils/hreflang';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  return {
    title: 'Sora3 Blog | Tutorials, Product Notes, and Release News',
    description: 'Read the latest Sora3 tutorials, product updates, and campaign playbooks.',
    alternates: generateHreflangAlternates('/blog', locale),
  };
}

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  return <BlogIndex locale={locale} />;
}
