import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostPage from '@/components/blog/BlogPostPage';
import { routing } from '@/i18n/routing';
import { getAvailablePostLocales, getPostBySlug, getPostSlugs, hasPostLocale } from '@/lib/blog';
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
    ? `https://sparkrobinai.io/blog/${post.slug}`
    : `https://sparkrobinai.io/${locale}/blog/${post.slug}`;
  const hasLocalizedContent = hasPostLocale(post.slug, locale);

  return {
    title: post.meta.title,
    description: post.meta.description,
    alternates: hasLocalizedContent
      ? generateHreflangAlternates(`/blog/${post.slug}`, locale, getAvailablePostLocales(post.slug))
      : {
        canonical: `https://sparkrobinai.io/blog/${post.slug}`,
      },
    robots: hasLocalizedContent ? undefined : {
      index: false,
      follow: true,
    },
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
    getPostSlugs()
      .filter((slug) => hasPostLocale(slug, locale))
      .map((slug) => ({ locale, slug }))
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
