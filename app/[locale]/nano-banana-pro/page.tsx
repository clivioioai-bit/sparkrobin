import { redirect } from 'next/navigation';

export default async function LegacyLocalizedNanoBananaProPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/gemini-omni-flash-image-to-video`);
}
