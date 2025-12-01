import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Create next-intl middleware
// next-intl 语言检测优先级（localeDetection: false，不自动检测浏览器语言）：
// 1. URL 路径中的语言前缀（最高优先级）
// 2. Cookie 中的 NEXT_LOCALE（用户手动选择）
// 3. 默认语言 'en'（不会根据浏览器语言自动切换）
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 跳过静态资源和 Next.js 内部文件
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }


  // 跳过 API 路由，让它们直接处理（避免 next-intl 中间件干扰）
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 跳过 auth 回调路由，避免被国际化中间件处理
  if (pathname === '/auth/callback' || pathname.startsWith('/auth/callback')) {
    // 创建响应对象
    const response = NextResponse.next();
    
    // 创建 Supabase 客户端用于处理 OAuth 回调
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            // 设置 cookies 到 response
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            // 删除 cookies 从 response
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );
    
    // 刷新 session 并设置 cookies
    await supabase.auth.getSession();
    return response;
  }

  // Handle locale routing first - this may return a redirect
  // next-intl 会自动处理语言检测和重定向
  const intlResponse = intlMiddleware(request);
  
  // Create base response (use intl response if it's a redirect, otherwise create new)
  let response = intlResponse || NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 确保语言被正确保存到 Cookie
  // next-intl 会自动设置 Cookie，但我们确保它被正确设置
  // 从 URL 路径或重定向后的 URL 中提取语言
  let detectedLocale: string | undefined;
  
  // 检查重定向后的 URL（如果有重定向）
  const redirectUrl = response.headers.get('location');
  if (redirectUrl) {
    const url = new URL(redirectUrl, request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0 && routing.locales.includes(pathSegments[0] as any)) {
      detectedLocale = pathSegments[0];
    }
  } else {
    // 检查当前路径
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0 && routing.locales.includes(pathSegments[0] as any)) {
      detectedLocale = pathSegments[0];
    } else {
      // 如果没有语言前缀，说明是默认语言 'en'（因为 localePrefix: 'as-needed'）
      detectedLocale = routing.defaultLocale;
    }
  }

  // 如果检测到语言，确保 Cookie 被设置（next-intl 通常会自动设置，但为了保险起见）
  if (detectedLocale) {
    const existingCookie = request.cookies.get('NEXT_LOCALE')?.value;
    if (existingCookie !== detectedLocale) {
      response.cookies.set('NEXT_LOCALE', detectedLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
        httpOnly: false, // 允许客户端读取
      });
    }
  }
  
  // 创建 Supabase 客户端用于处理所有需要 session 的路由
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Update response cookies
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // 保护 API 路由
  const protectedApiRoutes = ['/api/videos', '/api/subscriptions', '/api/usage'];
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route));

  if (isProtectedApiRoute) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/auth/:path*',
    '/dashboard/:path*',
    '/:path*',
  ],
};
