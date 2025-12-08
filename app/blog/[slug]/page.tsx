import BlogPostPage from '@/components/blog/BlogPostPage';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { generateHreflangAlternates } from '@/utils/hreflang';
import { notFound } from 'next/navigation';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const posts = getAllPosts();
    if (!posts || posts.length === 0) {
      return [];
    }
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for blog:', error);
    return [];
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Sora3 Blog',
    };
  }

  return {
    title: `${post.meta.title} | Sora3 Blog`,
    description: post.meta.description,
    alternates: generateHreflangAlternates(`/blog/${slug}`, 'en'),
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      url: `https://sora3ai.io/blog/${slug}`,
      siteName: 'Sora3',
      images: [
        {
          url: post.meta.coverImage || 'https://sora3ai.io/logo.jpg',
          width: 1200,
          height: 630,
          alt: post.meta.title,
        }
      ],
      locale: 'en_US',
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
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <BlogPostPage post={post} locale="en" />;
}
