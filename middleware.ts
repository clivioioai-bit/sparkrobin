import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
    if (host === 'sora3ai.io' || host === 'www.sora3ai.io') {
      const redirectUrl = new URL(request.url);
      redirectUrl.protocol = 'https:';
      redirectUrl.hostname = 'sparkrobin.app';
      redirectUrl.port = '';
      return NextResponse.redirect(redirectUrl, { status: 301 });
    }

    const pathname = request.nextUrl.pathname;

    // 跳过静态资源和 Next.js 内部文件
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/static') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/icon') ||
      pathname.startsWith('/logo') ||
      pathname === '/manifest.webmanifest' ||
      pathname.startsWith('/robots.txt') ||
      pathname.startsWith('/sitemap.xml') ||
      pathname.startsWith('/videos/') ||
      pathname.startsWith('/images/') ||
      pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|avif|woff|woff2|ttf|eot|mp4|webm|mov|avi|mkv|webmanifest|xml|txt)$/)
    ) {
      return NextResponse.next();
    }

    // 跳过 PostHog ingest 路由，让 rewrites 处理
    if (pathname.startsWith('/ingest/')) {
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    // 捕获所有未处理的错误，记录并返回基本响应
    console.error('Middleware error:', error);
    // 返回基本响应，避免完全失败
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next|static|videos|images|favicon|icon|logo|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|avif|woff|woff2|ttf|eot|mp4|webm|mov|avi|mkv|webmanifest|xml|txt)$).*)',
  ],
};
