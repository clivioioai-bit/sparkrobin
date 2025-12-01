import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Dynamic robots.txt route
 * This ensures robots.txt is always served correctly with proper content type
 * Falls back to static file if dynamic generation fails
 */
export async function GET() {
  try {
    // Try to read the static robots.txt file
    const filePath = join(process.cwd(), 'public', 'robots.txt')
    const content = await readFile(filePath, 'utf-8')
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (error) {
    // Fallback robots.txt if file read fails
    const fallback = `User-agent: *
Allow: /

Sitemap: https://sora3ai.io/sitemap.xml
`
    
    return new NextResponse(fallback, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }
}

