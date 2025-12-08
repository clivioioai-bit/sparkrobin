import BlogPostPage from '@/components/blog/BlogPostPage';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { routing } from '@/i18n/routing';
import { generateHreflangAlternates } from '@/utils/hreflang';
import { notFound } from 'next/navigation';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = getAllPosts();

  return routing.locales.flatMap((locale) =>
    posts.map((post) => ({
      slug: post.slug,
      locale,
    }))
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const post = getPostBySlug(slug, locale);

  if (!post) {
    return {
      title: 'Sora3 Blog',
    };
  }

  return {
    title: `${post.meta.title} | Sora3 Blog`,
    description: post.meta.description,
    alternates: generateHreflangAlternates(`/blog/${slug}`, locale),
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      url: locale === 'en' ? `https://sora3ai.io/blog/${slug}` : `https://sora3ai.io/${locale}/blog/${slug}`,
      siteName: 'Sora3',
      images: [
        {
          url: post.meta.coverImage || 'https://sora3ai.io/logo.jpg',
          width: 1200,
          height: 630,
          alt: post.meta.title,
        }
      ],
      locale: locale === 'ar' ? 'ar_SA' : locale === 'ja' ? 'ja_JP' : locale === 'ru' ? 'ru_RU' : locale === 'es' ? 'es_ES' : 'en_US',
      type: 'article',
      publishedTime: post.meta.date,
      authors: post.meta.author ? [post.meta.author] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta.title,
      description: post.meta.description,
      images: [post.meta.coverImage || 'https://sora3ai.io/logo.jpg'],
    },
  };
}

export default async function Page({
  params
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const post = getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  return <BlogPostPage post={post} locale={locale} />;
}
