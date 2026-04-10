import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/src/i18n/detectEntryLocale';

export default function LegacyTextToVideoPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/veo4-text-to-video`);
}
