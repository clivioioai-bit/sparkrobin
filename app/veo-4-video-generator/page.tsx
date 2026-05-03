import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

export default function LegacySparkRobinVideoGeneratorPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/spark-robin-video-generator`);
}
