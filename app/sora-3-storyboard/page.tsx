import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyStoryboardPage() {
  redirect('/en/sora-3-storyboard');
}
