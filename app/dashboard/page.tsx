import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

export default function LegacyDashboardPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/dashboard`);
}
