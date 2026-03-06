import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyNanoBananaProPage() {
  redirect('/en/nano-banana-pro');
}
