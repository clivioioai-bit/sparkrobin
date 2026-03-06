import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyImageEditorPage() {
  redirect('/en/image-editor');
}
