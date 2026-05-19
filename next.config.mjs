import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(), // 明确指定项目根目录，避免 lockfile 警告
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: true, // Enable CSS optimization for better performance
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'recharts',
      'react-markdown',
    ], // Optimize icon and component imports
  },
  // SWC minification is enabled by default in Next.js 15+
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Externalize packages for better compatibility
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sora3ai.io',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false, // Enable Next.js Image optimization for better performance
  },
  // CSS optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  // Enable compression (Gzip + Brotli handled by server/CDN)
  compress: true,
  skipTrailingSlashRedirect: true,
  // Configure headers for better SEO and performance
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Signals',
            value: 'search=yes, ai-train=no',
          },
        ],
      },
      // Static assets caching (Next.js build files)
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public folder assets caching
      {
        source: '/favicon.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      // Video assets caching
      {
        source: '/videos/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'video/mp4',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
      // Image assets caching - match common image extensions
      {
        source: '/:path*\\.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*\\.jpeg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*\\.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*\\.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*\\.avif',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*\\.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*\\.gif',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/placeholder.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/icon.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
  // Configure redirects if needed
  async redirects() {
    return [
      {
        source: '/spark-robin-text-to-video',
        destination: '/gemini-omni-flash-text-to-video',
        permanent: true,
      },
      {
        source: '/spark-robin-image-to-video',
        destination: '/gemini-omni-flash-image-to-video',
        permanent: true,
      },
      {
        source: '/spark-robin-video-generator',
        destination: '/gemini-omni-flash-video-generator',
        permanent: true,
      },
      {
        source: '/:locale(en|ar|ja|ru|es|zh-CN|de)/spark-robin-text-to-video',
        destination: '/:locale/gemini-omni-flash-text-to-video',
        permanent: true,
      },
      {
        source: '/:locale(en|ar|ja|ru|es|zh-CN|de)/spark-robin-image-to-video',
        destination: '/:locale/gemini-omni-flash-image-to-video',
        permanent: true,
      },
      {
        source: '/:locale(en|ar|ja|ru|es|zh-CN|de)/spark-robin-video-generator',
        destination: '/:locale/gemini-omni-flash-video-generator',
        permanent: true,
      },
      {
        source: '/blog/spark-robin-release-date',
        destination: '/blog/gemini-omni-flash-release-date',
        permanent: true,
      },
      {
        source: '/blog/sora-offline-export-data-migrate-to-spark-robin',
        destination: '/blog/sora-offline-export-data-migrate-to-gemini-omni-flash',
        permanent: true,
      },
      {
        source: '/blog/top-5-sora-alternatives-may-2026-spark-robin',
        destination: '/blog/top-5-sora-alternatives-may-2026-gemini-omni-flash',
        permanent: true,
      },
      {
        source: '/:locale(en|ar|ja|ru|es|zh-CN|de)/blog/spark-robin-release-date',
        destination: '/:locale/blog/gemini-omni-flash-release-date',
        permanent: true,
      },
      {
        source: '/:locale(en|ar|ja|ru|es|zh-CN|de)/blog/sora-offline-export-data-migrate-to-spark-robin',
        destination: '/:locale/blog/sora-offline-export-data-migrate-to-gemini-omni-flash',
        permanent: true,
      },
      {
        source: '/:locale(en|ar|ja|ru|es|zh-CN|de)/blog/top-5-sora-alternatives-may-2026-spark-robin',
        destination: '/:locale/blog/top-5-sora-alternatives-may-2026-gemini-omni-flash',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'sora3ai.io',
          },
        ],
        destination: 'https://omniflashai.io/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.sora3ai.io',
          },
        ],
        destination: 'https://omniflashai.io/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'sparkrobin.app',
          },
        ],
        destination: 'https://omniflashai.io/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.sparkrobin.app',
          },
        ],
        destination: 'https://omniflashai.io/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'omniflash.art',
          },
        ],
        destination: 'https://omniflashai.io/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.omniflash.art',
          },
        ],
        destination: 'https://omniflashai.io/:path*',
        permanent: true,
      },
    ];
  },
  // Configure rewrites if needed
  async rewrites() {
    return [
      // Add any necessary rewrites here
    ];
  }
};

export default withNextIntl(nextConfig);
