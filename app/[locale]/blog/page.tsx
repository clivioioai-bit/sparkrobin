import { notFound } from 'next/navigation';

export default async function Page({
  params: _params
}: {
  params: Promise<{ locale: string }>
}) {
  notFound();
}
