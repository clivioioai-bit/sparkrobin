'use client'

import Script from 'next/script'

export default function AnalyticsScripts() {
  return (
    <>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-1YBVQCR6CT"
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1YBVQCR6CT');
        `}
      </Script>

      {/* Umami Analytics */}
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="aaf401ff-051f-402f-aec7-bf97bba4a833"
        strategy="lazyOnload"
      />
    </>
  )
}
