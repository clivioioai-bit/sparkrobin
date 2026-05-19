import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyLocalizedGeminiOmniFlashTextToVideoPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  redirect(`/${locale}/gemini-omni-flash-text-to-video`);
}
