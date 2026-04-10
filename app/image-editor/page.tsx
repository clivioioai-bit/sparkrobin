import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/src/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

export default function LegacyImageEditorPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/image-editor`);
}
