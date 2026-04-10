import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyVeo4TextToVideoPage() {
  redirect('/en/veo4-text-to-video');
}
