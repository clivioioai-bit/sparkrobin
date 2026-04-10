import { cookies, headers } from 'next/headers';

const SUPPORTED_LOCALES = ['en', 'ar', 'ja', 'ru', 'es', 'zh-CN', 'de'] as const;
type Locale = typeof SUPPORTED_LOCALES[number];

export function detectEntryLocale(): Locale {
  const cookieLocale = cookies().get('NEXT_LOCALE')?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  const acceptLanguage = headers().get('accept-language') || '';
  const normalized = acceptLanguage.toLowerCase();

  if (normalized.includes('zh-cn') || normalized.includes('zh')) return 'zh-CN';
  if (normalized.includes('ar')) return 'ar';
  if (normalized.includes('ja')) return 'ja';
  if (normalized.includes('ru')) return 'ru';
  if (normalized.includes('es')) return 'es';
  if (normalized.includes('de')) return 'de';

  return 'en';
}
