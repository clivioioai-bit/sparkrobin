import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type BlogPostMeta = {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
  featured?: boolean;
};

export type BlogPost = {
  slug: string;
  content: string;
  meta: BlogPostMeta;
  readingTime: number;
};

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

const getPostFilePath = (slug: string, locale?: string) => {
  // If locale is provided, try locale-specific file first
  if (locale && locale !== 'en') {
    const localeMdPath = path.join(BLOG_DIR, `${slug}.${locale}.md`);
    if (fs.existsSync(localeMdPath)) return localeMdPath;

    const localeMdxPath = path.join(BLOG_DIR, `${slug}.${locale}.mdx`);
    if (fs.existsSync(localeMdxPath)) return localeMdxPath;
  }

  // Fallback to default (English) file
  const mdPath = path.join(BLOG_DIR, `${slug}.md`);
  if (fs.existsSync(mdPath)) return mdPath;

  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (fs.existsSync(mdxPath)) return mdxPath;

  return null;
};

const safeDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const estimateReadingTime = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

export const getPostSlugs = () => {
  try {
    if (!fs.existsSync(BLOG_DIR)) {
      console.warn(`Blog directory does not exist: ${BLOG_DIR}`);
      return [];
    }
    const files = fs.readdirSync(BLOG_DIR);
    const slugs = files
      .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
      .map((file) => file.replace(/\.(en|ar|ja|ru|es|zh-CN|de)\.mdx?$/, '').replace(/\.mdx?$/, ''))
      .filter((slug, index, self) => self.indexOf(slug) === index); // Remove duplicates
    return slugs;
  } catch (error) {
    console.error('Error getting post slugs:', error);
    return [];
  }
};

export const getPostBySlug = (slug: string, locale?: string): BlogPost | null => {
  try {
    const filePath = getPostFilePath(slug, locale);
    if (!filePath) return null;

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    const meta: BlogPostMeta = {
      title: data.title || slug,
      description: data.description,
      date: safeDate(data.date),
      author: data.author,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
      coverImage: data.coverImage,
      featured: Boolean(data.featured),
    };

    return {
      slug,
      content,
      meta,
      readingTime: estimateReadingTime(content),
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug} (locale: ${locale}):`, error);
    return null;
  }
};

export const getAllPosts = () => {
  try {
    const slugs = getPostSlugs();
    const posts = slugs
      .map((slug) => getPostBySlug(slug))
      .filter((post): post is BlogPost => Boolean(post));

    return posts.sort((a, b) => {
      const aTime = a.meta.date ? new Date(a.meta.date).getTime() : 0;
      const bTime = b.meta.date ? new Date(b.meta.date).getTime() : 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error getting all posts:', error);
    return [];
  }
};

export const getFeaturedPost = () => {
  const posts = getAllPosts();
  return posts.find((post) => post.meta.featured) || posts[0] || null;
};
