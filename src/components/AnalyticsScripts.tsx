'use client'

import Script from 'next/script'

export default function AnalyticsScripts() {
  return (
    <>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-1YBVQCR6CT"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1YBVQCR6CT');
        `}
      </Script>
      
      {/* Crisp Chat */}
      <Script id="crisp-chat" strategy="afterInteractive">
        {`
          window.$crisp=[];
          window.CRISP_WEBSITE_ID="bf1ad54e-3b19-40ea-abe6-e885ff50e719";
          (function(){
            d=document;
            s=d.createElement("script");
            s.src="https://client.crisp.chat/l.js";
            s.async=1;
            d.getElementsByTagName("head")[0].appendChild(s);
          })();
        `}
      </Script>
      
      {/* Umami Analytics */}
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="aaf401ff-051f-402f-aec7-bf97bba4a833"
        strategy="afterInteractive"
      />
    </>
  )
}

