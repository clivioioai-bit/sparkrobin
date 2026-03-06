import { redirect } from 'next/navigation';

export default async function LegacyLocalizedNanoBananaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/sora3-image-to-video`);
}
