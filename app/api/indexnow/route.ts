import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { buildLocalizedSitemap } from '@/lib/sitemap-pages';

export const runtime = 'nodejs';

const INDEXNOW_KEY = 'f4226aa28d5202485960101e1ad8874b';
const SITE_HOST = 'sparkrobinai.io';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

function buildUrlList(): string[] {
  return routing.locales.flatMap((locale) =>
    buildLocalizedSitemap(locale).map((entry) => entry.url)
  );
}

/**
 * POST /api/indexnow — submit all site URLs to IndexNow (Bing, Yandex, etc.)
 *
 * Requires Authorization header with CRON_SECRET or INDEXNOW_SECRET to prevent abuse.
 * Can also be called with ?urls=... query param to push specific URLs.
 */
export async function POST(request: NextRequest) {
  // Simple auth: check secret
  const secret = process.env.CRON_SECRET || process.env.INDEXNOW_SECRET;
  if (secret) {
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');
    if (providedSecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let urlList: string[];

  try {
    const body = await request.json().catch(() => null);
    if (body?.urls && Array.isArray(body.urls) && body.urls.length > 0) {
      urlList = body.urls;
    } else {
      urlList = buildUrlList();
    }
  } catch {
    urlList = buildUrlList();
  }

  // IndexNow accepts max 10,000 URLs per request
  const batchSize = 10000;
  const results: Array<{ batch: number; status: number; urls: number }> = [];

  for (let i = 0; i < urlList.length; i += batchSize) {
    const batch = urlList.slice(i, i + batchSize);

    const payload = {
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
      urlList: batch,
    };

    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });

      results.push({
        batch: Math.floor(i / batchSize) + 1,
        status: response.status,
        urls: batch.length,
      });

      console.log(`[IndexNow] Batch ${Math.floor(i / batchSize) + 1}: ${response.status} (${batch.length} URLs)`);
    } catch (error) {
      console.error(`[IndexNow] Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      results.push({
        batch: Math.floor(i / batchSize) + 1,
        status: 0,
        urls: batch.length,
      });
    }
  }

  return NextResponse.json({
    success: true,
    totalUrls: urlList.length,
    results,
    key: INDEXNOW_KEY,
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/indexnow — quick submit (for manual browser trigger or cron)
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.INDEXNOW_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const token = url.searchParams.get('secret');
    if (token !== secret) {
      return NextResponse.json({ error: 'Unauthorized. Pass ?secret=YOUR_SECRET' }, { status: 401 });
    }
  }

  const urlList = buildUrlList();

  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
    urlList,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const statusText = response.status === 200 ? 'OK - URLs submitted'
      : response.status === 202 ? 'Accepted - URLs queued'
      : `Response ${response.status}`;

    console.log(`[IndexNow] Submitted ${urlList.length} URLs: ${statusText}`);

    return NextResponse.json({
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText,
      totalUrls: urlList.length,
      key: INDEXNOW_KEY,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[IndexNow] Failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
