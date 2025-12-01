"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { subscriptionPlans } from "@/config/pricing";
import AuthModal from "@/components/AuthModal";
import SubscriptionPlans from "@/components/pricing/SubscriptionPlans";
import { Lock, Check, CreditCard, MessageCircle } from "lucide-react";
import { useTranslations } from 'next-intl';

const PricingPage = () => {
  const t = useTranslations('pricing');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const displayedPlans = useMemo(() => {
    return subscriptionPlans.filter((plan) => plan.billingInterval === billingInterval);
  }, [billingInterval]);

  const marketPricePerCredit = 1.0;
  const bestPricePerCredit = useMemo(() => {
    const values = displayedPlans
      .map((plan) => plan.pricePerCredit)
      .filter((value): value is number => typeof value === 'number');
    if (!values.length) return undefined;
    return Math.min(...values);
  }, [displayedPlans]);

  const savingsPercent = bestPricePerCredit
    ? Math.round(Math.max(0, 100 - (bestPricePerCredit / marketPricePerCredit) * 100))
    : 0;

  const intervalLabel = billingInterval === 'year' ? 'Annual' : 'Monthly';

  const popularAnnualPlan = useMemo(() => {
    if (billingInterval !== 'year') return null;
    return displayedPlans.find((plan) => plan.popular) ?? displayedPlans[0] ?? null;
  }, [billingInterval, displayedPlans]);

  const monthlyCounterpart = useMemo(() => {
    if (!popularAnnualPlan || !popularAnnualPlan.groupId) return null;
    return subscriptionPlans.find(
      (plan) => plan.groupId === popularAnnualPlan.groupId && plan.billingInterval === 'month'
    ) ?? null;
  }, [popularAnnualPlan]);

  const annualVsMonthlyCopy = useMemo(() => {
    if (!popularAnnualPlan || !monthlyCounterpart) return null;
    const monthlyPrice = monthlyCounterpart.priceCents / 100;
    const annualPrice = popularAnnualPlan.priceCents / 100;
    const equivalentMonthly = annualPrice / 12;
    const savings = monthlyPrice * 12 - annualPrice;
    return {
      planName: popularAnnualPlan.name.split('·')[0].trim(),
      monthlyPrice,
      equivalentMonthly,
      savings,
    };
  }, [popularAnnualPlan, monthlyCounterpart]);

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <SEOHead 
        title="Pricing Plans - Choose Your AI Video Generation Plan | Sora3"
        description="View Sora3 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options. Create professional videos with Sora3 technology."
        canonical="https://sora3ai.io/plans"
      />
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="text-primary">{t('title')}</span>
            </h1>
            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-muted-foreground">{t('secureCheckout')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
                <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-muted-foreground">{t('cancelAnytime')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
                <CreditCard className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-muted-foreground">{t('noSurpriseCharges')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
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
