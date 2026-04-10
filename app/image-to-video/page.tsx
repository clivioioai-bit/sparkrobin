import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/src/i18n/detectEntryLocale';

export default function LegacyImageToVideoPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/veo4-image-to-video`);
}
