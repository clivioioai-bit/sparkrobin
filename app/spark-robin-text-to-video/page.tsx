import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

export default function SparkRobinTextToVideoPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/spark-robin-text-to-video`);
}
