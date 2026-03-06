import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyMultiScenePage() {
  redirect('/en/multi-scene');
}
