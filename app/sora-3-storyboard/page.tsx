import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyStoryboardPage() {
  redirect('/en/veo4-text-to-video');
}
