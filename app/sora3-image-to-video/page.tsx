import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyVeo4ImageToVideoPage() {
  redirect('/en/veo4-image-to-video');
}
