import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/src/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

export default function LegacyVeo4VideoGeneratorPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/veo-4-video-generator`);
}
