import { Twitter, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useTranslations, useLocale } from 'next-intl';

const Footer = () => {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const localePrefix = locale === 'en' ? '' : `/${locale}`;

  const navigation = {
    product: [
      { name: t('sora3TextToVideo'), href: `${localePrefix}/sora3-text-to-video` },
      { name: t('sora3ImageToVideo'), href: `${localePrefix}/sora3-image-to-video` },
      { name: 'Storyboard', href: `${localePrefix}/sora-3-storyboard` },
      { name: t('sora3Pricing'), href: `${localePrefix}/pricing` },
      { name: t('sora3Faq'), href: `${localePrefix}/faq` },
    ],
    legal: [
      { name: t('sora3Blog'), href: `${localePrefix}/blog` },
      { name: t('privacyPolicy'), href: `${localePrefix}/privacy` },
      { name: t('termsOfService'), href: `${localePrefix}/terms` },
      { name: t('refundPolicy'), href: `${localePrefix}/refund` },
    ],
    support: [
      { name: t('support247'), href: "mailto:support@sora3ai.io", external: true },
      { name: t('contactUs'), href: "mailto:team@sora3ai.io", external: true },
    ],
  } as const;

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
                  src="/logo.jpg"
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
                href="https://x.com/sora3aiteam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/[0.06]"
                aria-label={t('socialLabels.twitter')}
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com/invite/D48J2Fksm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-primary transition-all duration-200 p-2 rounded-lg hover:bg-white/[0.06]"
                aria-label={t('socialLabels.discord')}
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="mailto:support@sora3ai.io"
                className="text-white/40 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/[0.06]"
                aria-label={t('socialLabels.email')}
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>

            {/* Company */}
            <div className="text-xs text-white/25 leading-relaxed">
              <p className="font-medium text-white/35 mb-0.5">Aivido LLC</p>
              <p>71-75 Shelton Street, Covent Garden</p>
              <p>London WC2H 9JQ, United Kingdom</p>
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
              {navigation.support.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col gap-3">
          <p className="text-xs text-white/25 leading-relaxed max-w-4xl">
            {t('disclaimer')}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-white/25">
              {t('copyright')}
            </p>
            <div className="flex items-center gap-4">
              <a href={`${localePrefix}/privacy`} className="text-xs text-white/25 hover:text-white/50 transition-colors">{t('privacyPolicy')}</a>
              <a href={`${localePrefix}/terms`} className="text-xs text-white/25 hover:text-white/50 transition-colors">{t('termsOfService')}</a>
              <a href={`${localePrefix}/refund`} className="text-xs text-white/25 hover:text-white/50 transition-colors">{t('refundPolicy')}</a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
