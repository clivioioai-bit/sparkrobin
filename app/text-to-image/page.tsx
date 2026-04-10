import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

export default function LegacyTextToImagePage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/text-to-image`);
}
