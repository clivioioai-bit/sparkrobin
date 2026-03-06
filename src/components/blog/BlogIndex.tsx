import { getTranslations } from 'next-intl/server';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getAllPosts, getFeaturedPost } from '@/lib/blog';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/routing';
import { CalendarDays, Clock, Tag } from 'lucide-react';
import React from 'react';

type Props = {
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

const buildHref = (slug: string, locale?: string) =>
  locale && locale !== 'en' ? `/${locale}/blog/${slug}` : `/blog/${slug}`;

const PostCard = ({
  slug,
  title,
  description,
  date,
  tags,
  readingTime,
  locale = 'en',
  readTimeLabel,
}: {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  tags?: string[];
  readingTime: number;
  locale?: string;
  readTimeLabel: string;
}) => (
  <Link
    href={buildHref(slug, locale)}
    className="group block h-full rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
  >
    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4" />
        <span>{formatDate(date, locale) || '—'}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{readingTime} {readTimeLabel}</span>
      </div>
    </div>
    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
      {title}
    </h3>
    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
      {description || 'No description provided.'}
    </p>
    <div className="flex flex-wrap gap-2">
      {(tags || []).slice(0, 4).map((tag) => (
        <Badge key={tag} variant="outline" className="flex items-center gap-1 text-xs">
          <Tag className="h-3 w-3" />
          {tag}
        </Badge>
      ))}
    </div>
  </Link>
);

const BlogIndex = async ({ locale = 'en' }: Props) => {
  const posts = getAllPosts();
  const featured = getFeaturedPost();
  const rest = posts.filter((post) => post.slug !== featured?.slug);

  const blogTexts = await getTranslations('blogShowcase');
  const t = await getTranslations('blogPage');

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <Navigation />
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-24 pb-10">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_40%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {blogTexts('featured')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4 max-w-3xl">
            {blogTexts('title')}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl">
            {blogTexts('subtitle')}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {!posts.length ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-10 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">{t('emptyTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('emptyDescription')}</p>
          </div>
        ) : (
          <>
            {featured && (
              <Link
                href={buildHref(featured.slug, locale)}
                className="group block rounded-3xl border border-border/60 bg-card/70 p-8 mb-10 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary font-medium">
                        {t('featured')}
                      </span>
                      {featured.meta.date && (
                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(featured.meta.date, locale)}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {featured.readingTime} {t('readTime')}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {featured.meta.title}
                    </h2>
                    <p className="text-base text-muted-foreground max-w-3xl">
                      {featured.meta.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(featured.meta.tags || []).slice(0, 6).map((tag) => (
                        <Badge key={tag} variant="outline" className="flex items-center gap-1 text-xs">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <PostCard
                    key={post.slug}
                    slug={post.slug}
                    title={post.meta.title}
                    description={post.meta.description}
                    date={post.meta.date}
                    tags={post.meta.tags}
                    readingTime={post.readingTime}
                    locale={locale}
                    readTimeLabel={t('readTime')}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default BlogIndex;
