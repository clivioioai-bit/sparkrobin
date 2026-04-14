import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({
  params: _params
}: {
  params: Promise<{ slug: string }>
}) {
  notFound();
}
