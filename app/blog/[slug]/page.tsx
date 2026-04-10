import { notFound } from 'next/navigation';

export default async function Page({
  params: _params
}: {
  params: Promise<{ slug: string }>
}) {
  notFound();
}
