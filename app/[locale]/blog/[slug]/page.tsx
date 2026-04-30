import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostPage from '@/components/blog/BlogPostPage';
import { routing } from '@/i18n/routing';
import { getPostBySlug, getPostSlugs } from '@/lib/blog';
import { generateHreflangAlternates } from '@/utils/hreflang';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = getPostBySlug(slug, locale);

  if (!post) {
    return {};
  }

  const url = locale === 'en'
    ? `https://veo4video.io/blog/${post.slug}`
    : `https://veo4video.io/${locale}/blog/${post.slug}`;

  return {
    title: post.meta.title,
    description: post.meta.description,
    alternates: generateHreflangAlternates(`/blog/${post.slug}`, locale),
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: 'article',
      url,
      publishedTime: post.meta.date,
      authors: post.meta.author ? [post.meta.author] : undefined,
      images: post.meta.coverImage ? [post.meta.coverImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta.title,
      description: post.meta.description,
      images: post.meta.coverImage ? [post.meta.coverImage] : undefined,
    },
  };
}

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getPostSlugs().map((slug) => ({ locale, slug }))
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params;
  const post = getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  return <BlogPostPage post={post} locale={locale} />;
}
