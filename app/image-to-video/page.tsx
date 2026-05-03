import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/i18n/detectEntryLocale';

export default function LegacyImageToVideoPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/spark-robin-image-to-video`);
}
