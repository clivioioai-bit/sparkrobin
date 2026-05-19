import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyLocalizedGeminiOmniFlashTextToVideoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/gemini-omni-flash-text-to-video`);
}
