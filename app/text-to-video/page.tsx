import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/i18n/detectEntryLocale';

export default function LegacyTextToVideoPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/gemini-omni-flash-text-to-video`);
}
