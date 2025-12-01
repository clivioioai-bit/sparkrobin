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
        {/* 资源预连接和优先级优化 */}
        <link rel="dns-prefetch" href="https://*.supabase.co" />
        <link rel="preconnect" href="https://*.supabase.co" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
