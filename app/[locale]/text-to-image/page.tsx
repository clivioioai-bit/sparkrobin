import NanoBananaGenerator from '@/page-components/NanoBananaGenerator';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LocalizedTextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  return <NanoBananaGenerator defaultTab="text-to-image" />;
}
