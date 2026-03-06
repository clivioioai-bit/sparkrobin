import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacySora3VideoGeneratorPage() {
  redirect('/en/sora-3-video-generator');
}
