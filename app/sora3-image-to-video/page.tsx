import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

export default function LegacySparkRobinImageToVideoPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/spark-robin-image-to-video`);
}
