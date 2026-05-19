import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

export default function GeminiOmniFlashVideoGeneratorPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/gemini-omni-flash-video-generator`);
}
