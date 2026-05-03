import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'ar', 'ja', 'ru', 'es', 'zh-CN', 'de'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Don't use a prefix for the default locale (en)
  localePrefix: 'as-needed',

  // 禁用自动语言检测，默认使用英语
  // 只有用户主动选择语言后才会变化（通过 URL 前缀或 Cookie）
  localeDetection: false
});
