import React from 'react'
import Script from 'next/script'
import './globals.css'

// Root layout must include <html> and <body> tags.
// Keep a server-rendered default lang for crawlers; locale routes can refine it in nested head tags.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="NjZczag78DS8-WMVBUNwIjPdLnascRmdeX6r9oF4oPA" />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HBZBPMZ987"
          strategy="beforeInteractive"
        />
        <Script id="google-analytics" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HBZBPMZ987');
          `}
        </Script>
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
