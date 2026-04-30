import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

const BASE_URL = 'https://veo4video.io';

const publicPages = [
  '',
  'veo-4-video-generator',
  'veo4-text-to-video',
  'veo4-image-to-video',
  'multi-scene',
  'pricing',
  'faq',
  'blog',
  'privacy',
  'terms',
  'refund',
];

const getLocalizedUrl = (page: string, locale: string) => {
  if (locale === 'en') {
    if (!page) return `${BASE_URL}/en`;
    return page ? `${BASE_URL}/${page}` : BASE_URL;
  }

  return page ? `${BASE_URL}/${locale}/${page}` : `${BASE_URL}/${locale}/`;
};

const getPagePriority = (page: string) => {
  if (page === '') return 1;
  if (page === 'veo-4-video-generator' || page === 'veo4-text-to-video' || page === 'veo4-image-to-video') return 0.95;
  if (page === 'multi-scene') return 0.9;
  if (page === 'pricing' || page === 'faq' || page === 'blog') return 0.8;
  return 0.3;
};

const getChangeFrequency = (page: string): MetadataRoute.Sitemap[number]['changeFrequency'] => {
  if (page === '' || page === 'veo-4-video-generator' || page === 'veo4-text-to-video' || page === 'veo4-image-to-video') return 'daily';
  if (page === 'pricing' || page === 'faq' || page === 'blog') return 'weekly';
  return 'yearly';
};

export const buildLocalizedSitemap = (locale: string): MetadataRoute.Sitemap => {
  const now = new Date();

  const basePages: MetadataRoute.Sitemap = publicPages.map((page) => ({
    url: getLocalizedUrl(page, locale),
    lastModified: now,
    changeFrequency: getChangeFrequency(page),
    priority: getPagePriority(page),
  }));

  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: getLocalizedUrl(`blog/${post.slug}`, locale),
    lastModified: post.meta.date ? new Date(post.meta.date) : now,
    changeFrequency: 'weekly',
    priority: post.meta.featured ? 0.85 : 0.75,
  }));

  return [...basePages, ...blogPages];
};
