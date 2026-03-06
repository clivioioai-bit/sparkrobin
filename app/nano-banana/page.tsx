import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyNanoBananaPage() {
  redirect('/en/nano-banana');
}
