import React from 'react'
import './globals.css'

// Root layout must include <html> and <body> tags
// The lang and dir attributes will be set dynamically by [locale]/layout.tsx via client-side script
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="NjZczag78DS8-WMVBUNwIjPdLnascRmdeX6r9oF4oPA" />
        {/* Bing Site Verification */}
        {process.env.BING_VERIFICATION_CODE && (
          <meta name="msvalidate.01" content={process.env.BING_VERIFICATION_CODE} />
        )}
        {/* Yandex Verification (if needed) */}
        {process.env.YANDEX_VERIFICATION_CODE && (
          <meta name="yandex-verification" content={process.env.YANDEX_VERIFICATION_CODE} />
        )}
        {/* 资源预连接和优先级优化 */}
        <link rel="dns-prefetch" href="https://*.supabase.co" />
        <link rel="preconnect" href="https://*.supabase.co" crossOrigin="anonymous" />
        {/* Preconnect to search engines for better indexing */}
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.bing.com" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
