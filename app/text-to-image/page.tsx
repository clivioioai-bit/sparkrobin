import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyTextToImagePage() {
  redirect('/en/text-to-image');
}
