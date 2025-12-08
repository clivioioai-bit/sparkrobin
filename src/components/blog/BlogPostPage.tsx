import { getTranslations } from 'next-intl/server';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { BlogPost } from '@/lib/blog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Tag } from 'lucide-react';
import Image from 'next/image';

type Props = {
  post: BlogPost;
  locale?: string;
};

const formatDate = (value: string | undefined, locale: string) => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale || 'en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const BlogPostPage = async ({ post, locale = 'en' }: Props) => {
  if (!post || !post.meta) {
    return null;
  }

  const t = await getTranslations({ locale, namespace: 'blogPage' });
  const blogTexts = await getTranslations({ locale, namespace: 'blogShowcase' });

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <Navigation />

      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
          {blogTexts('title')}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          {post.meta.title}
        </h1>
        <p className="text-base text-muted-foreground mb-6">
          {post.meta.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-8">
          {post.meta.date && (
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {t('publishedOn')} {formatDate(post.meta.date, locale)}
            </span>
          )}
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {post.readingTime} {t('readTime')}
          </span>
          {(post.meta.tags?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {t('tags')}
            </span>
          )}
          {post.meta.author && (
            <span className="inline-flex items-center gap-2">
              • {post.meta.author}
            </span>
          )}
        </div>

        {post.meta.tags && post.meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.meta.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="flex items-center gap-1 text-xs">
                <Tag className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {post.meta.coverImage && (
          <div className="relative w-full h-72 sm:h-96 mb-10 overflow-hidden rounded-2xl border border-border/70">
            <Image
              src={post.meta.coverImage}
              alt={post.meta.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 800px, 100vw"
              priority
            />
          </div>
        )}

        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
