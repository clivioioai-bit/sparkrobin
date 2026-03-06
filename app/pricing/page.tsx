import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Route all legacy non-locale requests into the intl tree.
export default function PricingPage() {
  redirect('/en/pricing');
}

