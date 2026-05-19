import { redirect } from 'next/navigation'

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const targetSlug = slug.includes('spark-robin')
    ? slug.replaceAll('spark-robin', 'gemini-omni-flash')
    : slug

  redirect(`/en/blog/${targetSlug}`)
}
