import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/src/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

export default function LegacyNanoBananaProPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/nano-banana-pro`);
}
