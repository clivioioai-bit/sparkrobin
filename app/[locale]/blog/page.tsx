import { Metadata } from 'next';
import BlogIndex from '@/components/blog/BlogIndex';
import { routing } from '@/i18n/routing';
import { generateHreflangAlternates } from '@/utils/hreflang';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = 'https://omniflashai.io';
  const prefix = locale === 'en' ? '' : `/${locale}`;
  const title = 'AI Video Blog | Gemini Omni Flash';
  const description = 'Read practical Gemini Omni Flash guides, video generation guides, AI video workflow notes, prompt systems, and production tips for reviewable video drafts.';

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/blog', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/blog`,
      siteName: 'Gemini Omni Flash',
      images: [
        {
          url: 'https://omniflashai.io/logo-v2.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'ar' ? 'ar_SA' : locale === 'ja' ? 'ja_JP' : locale === 'ru' ? 'ru_RU' : locale === 'es' ? 'es_ES' : locale === 'zh-CN' ? 'zh_CN' : locale === 'de' ? 'de_DE' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://omniflashai.io/logo-v2.png'],
    },
  };
}

export async function generateStaticParams() {
  return routing.locales
    .filter((locale) => locale !== 'en')
    .map((locale) => ({ locale }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  return <BlogIndex locale={locale} />;
}
