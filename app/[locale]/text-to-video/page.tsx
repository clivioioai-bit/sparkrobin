import { redirect } from 'next/navigation';

export default async function LegacyLocalizedTextToVideoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/sora3-text-to-video`);
}
