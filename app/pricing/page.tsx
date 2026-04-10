import { redirect } from 'next/navigation';
import { detectEntryLocale } from '@/src/i18n/detectEntryLocale';

export const dynamic = 'force-dynamic';

// Route all legacy non-locale requests into the intl tree.
export default function PricingPage() {
  const locale = detectEntryLocale();
  redirect(`/${locale}/pricing`);
}

