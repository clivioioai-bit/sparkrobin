import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyLocalizedGeminiOmniFlashVideoGeneratorPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  redirect(`/${locale}/gemini-omni-flash-video-generator`);
}
