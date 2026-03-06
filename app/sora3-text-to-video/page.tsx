import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacySora3TextToVideoPage() {
  redirect('/en/sora3-text-to-video');
}
