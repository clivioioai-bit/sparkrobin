"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import Image from "next/image";
import { useTranslations, useLocale } from 'next-intl';

const Footer = () => {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [isMounted, setIsMounted] = useState(false);
  const localePrefix = locale === 'en' ? '' : `/${locale}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const navigation = {
    product: [
      { name: t('sora3TextToVideo'), href: `${localePrefix}/spark-robin-text-to-video` },
      { name: t('sora3ImageToVideo'), href: `${localePrefix}/spark-robin-image-to-video` },
      { name: t('sora3Pricing'), href: `${localePrefix}/pricing` },
      { name: t('sora3Faq'), href: `${localePrefix}/faq` },
      { name: t('sora3Blog'), href: `${localePrefix}/blog` },
    ],
    legal: [
      { name: t('privacyPolicy'), href: `${localePrefix}/privacy` },
      { name: t('termsOfService'), href: `${localePrefix}/terms` },
      { name: t('refundPolicy'), href: `${localePrefix}/refund` },
    ],
  } as const;

  const footerBadges = [
    { name: "happyhorse.llc", label: "HH", href: "https://happyhorse.llc" },
    { name: "veemo.ai", label: "V", href: "https://veemo.ai" },
    { name: "seedancev2.ai", label: "S2", href: "https://seedancev2.ai" },
  ] as const;

  return (
    <footer className="bg-background/80 backdrop-blur-xl border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">

          {/* Brand */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                <Image
                  src="/logo-v2.png"
                  alt={t('logoAlt')}
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-extrabold text-white">{tCommon('brand')}</span>
            </div>

            <p className="text-sm text-white/40 mb-6 max-w-sm leading-relaxed">
              {t('description')}
            </p>

            {/* Social */}
            <div className="flex items-center space-x-1 mb-6">
              <a
                href="mailto:support@sparkrobin.app"
                className="text-white/40 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/[0.06]"
                aria-label={t('socialLabels.email')}
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>

          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white/70 mb-4 text-xs uppercase tracking-widest">{t('product')}</h4>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Resources */}
          <div>
            <h4 className="font-semibold text-white/70 mb-4 text-xs uppercase tracking-widest">{t('resources')}</h4>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white/70 mb-4 text-xs uppercase tracking-widest">{t('support')}</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@sparkrobin.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                >
                  {t('support247')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col gap-3">
          <p className="text-xs text-white/25 leading-relaxed max-w-4xl">
            {t('disclaimer')}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-white/25">
              {t('copyright')}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
              <div className="flex flex-wrap items-center gap-2">
                {footerBadges.map((badge) => (
                  <a
                    key={badge.href}
                    href={badge.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={badge.name}
                    className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 text-[11px] font-medium text-white/35 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white/60"
                  >
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-sm bg-white/10 px-1 text-[9px] font-bold leading-none text-white/45">
                      {badge.label}
                    </span>
                    <span>{badge.name}</span>
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <a href={`${localePrefix}/privacy`} className="text-xs text-white/25 hover:text-white/50 transition-colors">{t('privacyPolicy')}</a>
                <a href={`${localePrefix}/terms`} className="text-xs text-white/25 hover:text-white/50 transition-colors">{t('termsOfService')}</a>
                <a href={`${localePrefix}/refund`} className="text-xs text-white/25 hover:text-white/50 transition-colors">{t('refundPolicy')}</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
