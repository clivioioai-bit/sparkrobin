"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import AuthModal from "@/components/AuthModal";
import { Lock, Check, CreditCard, MessageCircle } from "lucide-react";
import { useTranslations } from 'next-intl';

const SubscriptionPlans = dynamic(() => import("@/components/pricing/SubscriptionPlans"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border bg-card p-6">
          <div className="space-y-4 animate-pulse">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="mx-auto h-5 w-24 rounded bg-muted" />
                <div className="mx-auto h-10 w-32 rounded bg-muted" />
                <div className="mx-auto h-4 w-28 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-8 rounded-lg bg-muted" />
              <div className="h-8 rounded-lg bg-muted" />
              <div className="h-8 rounded-lg bg-muted" />
            </div>
            <div className="h-10 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  ),
});

const PricingPage = () => {
  const t = useTranslations('pricing');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <SEOHead 
        title="Pricing Plans - Choose Your AI Video Generation Plan | Veo4"
        description="View Veo4 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options. Create professional videos with Veo4 technology."
        canonical="https://veo4video.io/pricing"
      />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="text-primary">{t('title')}</span>
            </h1>
            <p className="mx-auto mb-4 max-w-2xl rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{t('creditRateTitle')}</span>{" "}
              {t('creditRateDescription')}
            </p>
            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/80 backdrop-blur-xl border border-border/50">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">{t('secureCheckout')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/80 backdrop-blur-xl border border-border/50">
                <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-muted-foreground">{t('cancelAnytime')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/80 backdrop-blur-xl border border-border/50">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">{t('noSurpriseCharges')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/80 backdrop-blur-xl border border-border/50">
                <MessageCircle className="w-4 h-4 text-white" />
                <span className="text-sm text-muted-foreground">{t('fastSupport')}</span>
              </div>
            </div>
          </div>

          {/* Pricing Plans (shared component) */}
          <div id="plans" className="mb-12">
            <SubscriptionPlans
              variant="page"
              defaultInterval={billingInterval}
              onRequireAuth={() => setShowAuthModal(true)}
              showToggle={true}
            />
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-12">{t('faqTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
              <div>
                <h3 className="font-semibold mb-2">{t('faqCancelAnytime.question')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('faqCancelAnytime.answer')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('faqCreditsRollOver.question')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('faqCreditsRollOver.answer')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('faqRefundPolicy.question')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('faqRefundPolicy.answer')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('faqContentRestrictions.question')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('faqContentRestrictions.answer')}
                </p>
              </div>

              {/* Credits & subscription reassurance */}
              <div>
                <h3 className="font-semibold mb-2">{t('faqCreditsDeduction.question')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('faqCreditsDeduction.answer')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('faqCancelSubscription.question')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('faqCancelSubscription.answer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <Footer />
    </div>
  );
};

export default PricingPage;
