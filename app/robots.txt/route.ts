import { NextResponse } from 'next/server';

const robots = `User-agent: *
Allow: /

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: msnbot
Allow: /
Crawl-delay: 1

User-agent: msnbot-media
Allow: /
Crawl-delay: 1

Sitemap: https://omniflashai.io/sitemap.xml

Disallow: /api/
Disallow: /admin/
Disallow: /auth/
Disallow: /payment/
Disallow: /pricing/cancelled

Allow: /_next/static/
Allow: /gemini-omni-flash-text-to-video
Allow: /gemini-omni-flash-storyboard
Allow: /multi-scene
Allow: /gemini-omni-flash-image-to-video
Allow: /gemini-omni-flash-video-generator
Allow: /pricing
Allow: /blog
Allow: /faq
Allow: /privacy
Allow: /terms
Allow: /refund

Allow: /en/
Allow: /ar/
Allow: /ja/
Allow: /ru/
Allow: /es/
Allow: /zh-CN/
Allow: /de/
`;

export function GET() {
  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
