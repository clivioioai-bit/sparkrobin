import { NextResponse } from 'next/server'

/**
 * Bing Site Verification XML file route
 * This file is used by Bing Webmaster Tools to verify site ownership
 * 
 * To use this:
 * 1. Get your verification code from Bing Webmaster Tools
 * 2. Set BING_VERIFICATION_CODE in your .env file
 * 3. Bing will look for this file at: https://sparkrobin.app/BingSiteAuth.xml
 * 
 * Alternatively, you can use the meta tag method (already configured in layout.tsx)
 * 
 * Note: Bing supports both XML file and meta tag verification methods.
 * This route provides the XML file method for better compatibility.
 */
export async function GET() {
  const verificationCode = process.env.BING_VERIFICATION_CODE || ''
  
  if (!verificationCode) {
    // Return 404 if no verification code is set (Bing expects this)
    return new NextResponse('', { 
      status: 404,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }

  // Return Bing Site Auth XML format
  // Format: <?xml version="1.0"?><users><user>VERIFICATION_CODE</user></users>
  const xml = `<?xml version="1.0"?>
<users>
  <user>${verificationCode}</user>
</users>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

