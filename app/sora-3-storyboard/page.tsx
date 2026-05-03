import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

export default function LegacyStoryboardPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/spark-robin-text-to-video`);
}
