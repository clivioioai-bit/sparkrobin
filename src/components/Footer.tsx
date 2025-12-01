import { Github, Twitter, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useTranslations, useLocale } from 'next-intl';

const Footer = () => {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  const navigation = {
    product: [
      { name: t('sora3TextToVideo'), href: `${localePrefix}/text-to-video`, external: false },
      { name: t('sora3ImageToVideo'), href: `${localePrefix}/image-to-video`, external: false },
      { name: t('sora3Pricing'), href: `${localePrefix}/plans`, external: false },
      { name: t('sora3Faq'), href: `${localePrefix}/faq`, external: false },
    ],
    company: [
      { name: 'Aivido LLC', href: '#', external: false },
      { name: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, UNITED KINGDOM', href: '#', external: false },
    ],
    resources: [
      { name: t('aiVideoPromptGpt'), href: "https://chatgpt.com/g/g-690c3e49fb308191aa623c67543a766a-sarogpt-ai-video-prompt-script-assistant", external: true },
      { name: t('privacyPolicy'), href: `${localePrefix}/privacy`, external: false },
      { name: t('termsOfService'), href: `${localePrefix}/terms`, external: false },
      { name: t('refundPolicy'), href: `${localePrefix}/refund`, external: false },
    ],
    support: [
      { name: t('support247'), href: "mailto:support@sora3ai.io", external: true },
      { name: t('contactUs'), href: "mailto:team@sora3ai.io", external: true },
    ],
  } as const;

  return (
    <footer className="gradient-bg dark:gradient-bg-dark border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                <Image 
                  src="/logo.png" 
                  alt={t('logoAlt')} 
                  width={40} 
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-2xl font-extrabold gradient-text dark:gradient-text-dark">
                {tCommon('brand')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
              {t('description')}
            </p>
            {/* Social Links */}
            <div className="flex items-center space-x-3">
              <a 
                href="https://x.com/sora3aiteam" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-all duration-300 p-2.5 rounded-lg hover:bg-muted hover:scale-110"
                aria-label={t('socialLabels.twitter')}
              >
                <Twitter className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="https://discord.com/invite/D48J2Fksm" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#5865F2] transition-all duration-300 p-2.5 rounded-lg hover:bg-muted hover:scale-110"
                aria-label={t('socialLabels.discord')}
              >
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 p-2.5 rounded-lg hover:bg-muted hover:scale-110"
                aria-label={t('socialLabels.github')}
              >
                <Github className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="mailto:support@sora3ai.io" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 p-2.5 rounded-lg hover:bg-muted hover:scale-110"
                aria-label={t('socialLabels.email')}
              >
                <Mail className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-foreground mb-5 text-base">{t('product')}</h4>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 inline-block hover:translate-x-1"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    aria-label={item.name}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Info */}
          <div>
            <h4 className="font-bold text-foreground mb-5 text-base">{t('company')}</h4>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground font-semibold">
                Aivido LLC
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, UNITED KINGDOM
              </div>
            </div>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold text-foreground mb-5 text-base">{t('resources')}</h4>
            <ul className="space-y-3">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 inline-block hover:translate-x-1"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    aria-label={item.name}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-bold text-foreground mb-5 text-base">{t('support')}</h4>
            <ul className="space-y-3">
              {navigation.support.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 inline-block hover:translate-x-1"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    aria-label={item.name}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div className="pt-10 border-t border-border/50 space-y-3 mb-10">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
            {t('disclaimer')}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
            {t('poweredBy')}
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
