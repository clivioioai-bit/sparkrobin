#!/usr/bin/env node
/**
 * Submit all public URLs to Bing IndexNow
 * Usage: node scripts/submit-indexnow.js
 * Or with a specific domain: SITE_URL=https://sora3.ai node scripts/submit-indexnow.js
 */

const SITE_URL = process.env.SITE_URL || "https://sora3.ai";
const KEY = process.env.INDEXNOW_KEY || "f4226aa28d5202485960101e1ad8874b";
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;

// All public-facing pages (no auth/dashboard/payment routes)
const PUBLIC_PAGES = [
  "/",
  "/sora-3-video-generator",
  "/sora3-text-to-video",
  "/sora3-image-to-video",
  "/sora-3-storyboard",
  "/multi-scene",
  "/watermark-remover",
  "/pricing",
  "/blog",
  "/faq",
  "/terms",
  "/privacy",
  "/refund",
];

const urls = PUBLIC_PAGES.map((p) => `${SITE_URL}${p}`);

async function submitToIndexNow() {
  const host = new URL(SITE_URL).hostname;

  const body = {
    host,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  console.log(`Submitting ${urls.length} URLs to Bing IndexNow...`);
  console.log("Host:", host);
  console.log("Key location:", KEY_LOCATION);
  console.log("URLs:", urls);

  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  console.log(`\nResponse: HTTP ${res.status}`);

  const STATUS_MESSAGES = {
    200: "Success — URLs submitted.",
    202: "Accepted — URLs received, will be processed.",
    400: "Bad request — invalid format.",
    403: "Forbidden — key not valid or key file not found.",
    422: "Unprocessable — URLs don't belong to host or key schema mismatch.",
    429: "Too Many Requests — slow down.",
  };

  console.log(STATUS_MESSAGES[res.status] || "Unknown response.");

  if (res.status >= 400) {
    const text = await res.text().catch(() => "");
    if (text) console.log("Details:", text);
    process.exit(1);
  }
}

submitToIndexNow().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
