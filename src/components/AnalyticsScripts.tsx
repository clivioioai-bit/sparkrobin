'use client'

import Script from 'next/script'

export default function AnalyticsScripts() {
  return (
    <>
      {/* Umami Analytics */}
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="aaf401ff-051f-402f-aec7-bf97bba4a833"
        strategy="lazyOnload"
      />
    </>
  )
}
