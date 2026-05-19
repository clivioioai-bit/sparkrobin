export const PUBLIC_SITE_URL = 'https://omniflashai.io';

const LOCAL_SITE_URL = 'http://localhost:3000';
const LEGACY_HOSTS = new Set([
  'sparkrobin.app',
  'www.sparkrobin.app',
  'sora3ai.io',
  'www.sora3ai.io',
  'omniflash.art',
  'www.omniflash.art',
]);

export function normalizePublicBaseUrl(value?: string | null, fallback = PUBLIC_SITE_URL) {
  const rawValue = value?.trim();

  if (!rawValue) {
    return fallback;
  }

  try {
    const url = new URL(rawValue);

    if (LEGACY_HOSTS.has(url.hostname.toLowerCase())) {
      return PUBLIC_SITE_URL;
    }

    return url.origin;
  } catch {
    return fallback;
  }
}

export function getPublicBaseUrl(options?: {
  currentOrigin?: string;
  envUrl?: string | null;
  preferCurrentOriginInDevelopment?: boolean;
}) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction && options?.preferCurrentOriginInDevelopment !== false) {
    return normalizePublicBaseUrl(options?.currentOrigin, LOCAL_SITE_URL);
  }

  return normalizePublicBaseUrl(
    options?.envUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL,
    PUBLIC_SITE_URL
  );
}

export function getAuthCallbackUrl(options?: {
  currentOrigin?: string;
  envUrl?: string | null;
}) {
  return `${getPublicBaseUrl(options)}/auth/callback`;
}
