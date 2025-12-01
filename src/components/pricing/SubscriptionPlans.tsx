"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PendingButton from "@/components/PendingButton";
import { Card } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { subscriptionPlans, oneTimePacks } from "@/config/pricing";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckoutSession, CheckoutError } from "@/services/payments";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

type Variant = "page" | "modal" | "teaser";
type TabType = "month" | "year" | "one-time";

interface SubscriptionPlansProps {
  variant?: Variant;
  defaultInterval?: "month" | "year";
  showToggle?: boolean;
  onRequireAuth?: () => void;
  afterRedirect?: () => void;
}

const SubscriptionPlans = ({
  variant = "page",
  defaultInterval = "month",
  showToggle = true,
  onRequireAuth,
  afterRedirect,
}: SubscriptionPlansProps) => {
  const t = useTranslations('pricing.plans');
  const { isAuthenticated } = useAuth();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(defaultInterval === "year" ? "year" : "month");

  // Function to translate feature text
  const translateFeature = (feature: string): string => {
    // Match patterns and translate
    const creditsMatch = feature.match(/([\d,]+)\s+credits\s+included/i);
    if (creditsMatch) {
      const count = creditsMatch[1].replace(/,/g, '');
      return t('features.creditsIncluded', { count });
    }

    const videosPerMonthMatch = feature.match(/([\d,]+)\s+AI\s+videos\s+per\s+month/i);
    if (videosPerMonthMatch) {
      const count = videosPerMonthMatch[1].replace(/,/g, '');
      return t('features.aiVideosPerMonth', { count });
    }

    const videosPerYearMatch = feature.match(/([\d,]+)\s+AI\s+videos\s+per\s+year/i);
    if (videosPerYearMatch) {
      const count = videosPerYearMatch[1].replace(/,/g, '');
      return t('features.aiVideosPerYear', { count });
    }

    // Direct text matches
    if (feature.toLowerCase().includes('hd & 4k quality options') || feature.toLowerCase().includes('hd and 4k quality options')) {
      return t('features.hd4kQuality');
    }
    if (feature.toLowerCase().includes('commercial usage rights')) {
      return t('features.commercialUsageRights');
    }
    if (feature.toLowerCase().includes('priority email support')) {
      return t('features.priorityEmailSupport');
    }
    if (feature.toLowerCase().includes('email support') && !feature.toLowerCase().includes('priority')) {
      return t('features.emailSupport');
    }
    if (feature.toLowerCase().includes('api access')) {
      return t('features.apiAccess');
    }
    if (feature.toLowerCase().includes('generation history')) {
      return t('features.generationHistory');
    }
    if (feature.toLowerCase().includes('fastest processing')) {
      return t('features.fastestProcessing');
    }
    if (feature.toLowerCase().includes('1-on-1 professional consultation') || feature.toLowerCase().includes('professional consultation')) {
      return t('features.professionalConsultation');
    }

    // Return original if no match
    return feature;
  };

  // Function to translate CTA button text
  const translateCta = (cta: string): string => {
    const ctaLower = cta.toLowerCase();
    if (ctaLower.includes('get annual deal')) return t('cta.getAnnualDeal');
    if (ctaLower.includes('best value')) return t('cta.bestValue');
    if (ctaLower.includes('unlock pro')) return t('cta.unlockPro');
    if (ctaLower.includes('get creator')) return t('cta.getCreator');
    if (ctaLower.includes('go pro')) return t('cta.goPro');
    if (ctaLower.includes('start creating')) return t('cta.startCreating');
    if (ctaLower.includes('save with annual')) return t('cta.saveWithAnnual');
    return cta;
  };

  const beginCheckout = async (plan: any) => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      toast({
        variant: "destructive",
        title: t('pleaseLogInFirst'),
        description: t('logInToProceed'),
      });
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      // All plans (subscription and one-time) go through backend to attach URLs + metadata
      const result = await createCheckoutSession(plan.id);
      // Best practice: Redirect in the same window
      // Some browsers like Safari may block popups opened with target="_blank" or window.open()
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          try {
            const href = window.location.href;
            if (!/payment\/success|creem|checkout/i.test(href)) {
              window.location.href = result.checkoutUrl;
            }
          } catch {
            window.location.href = result.checkoutUrl;
          }
        }, 200);
      }

      afterRedirect?.();
    } catch (error) {
      if (error instanceof CheckoutError && error.code === "AUTH_REQUIRED") {
        onRequireAuth?.();
        toast({
          variant: "destructive",
          title: t('loginSessionExpired'),
          description: t('pleaseLogInAgain'),
        });
      } else if (error instanceof CheckoutError && error.code === "RATE_LIMIT_EXCEEDED") {
        toast({
          variant: "destructive",
          title: t('tooManyRequests'),
          description: error.message || t('pleaseWait'),
        });
      } else {
        // Fallback: if one-time pack has static URL, try direct redirect
        const isOneTime = plan.billingInterval === 'one-time';
        if (isOneTime && plan.checkoutUrl && typeof plan.checkoutUrl === 'string' && plan.checkoutUrl.length > 0) {
          
          if (typeof window !== 'undefined') {
            try {
              // Best practice: Redirect in the same window
              window.location.href = plan.checkoutUrl;
              return;
            } catch (_) {}
          }
        }
        const errorMessage = error instanceof Error ? error.message : t('tryAgainLater');
        toast({
          variant: "destructive",
          title: t('failedToCreatePaymentLink'),
          description: errorMessage,
        });
        // If error suggests contacting support, show additional help
        if (errorMessage.includes('contact support')) {
          setTimeout(() => {
            toast({
              title: t('needHelp'),
              description: t('contactSupport'),
              action: (
                <a 
                  href="mailto:support@sora3ai.io?subject=Payment Issue" 
                  className="text-primary hover:underline"
                >
                  {t('contactSupportLink')}
                </a>
              ),
            });
          }, 2000);
        }
      }
    } finally {
      setLoadingPlanId(null);
    }
  };

  const displayedPlans = useMemo(() => {
    if (activeTab === "one-time") {
      return oneTimePacks.map(pack => ({
        id: pack.id,
        name: pack.name,
        price: pack.price,
        credits: pack.credits,
        description: pack.limitations,
        features: (() => {
          return [
            t('oneTimePurchaseLabel'),
            t('noSubscriptionRequired'),
            t('commercialUsageRights')
          ];
        })(),
        cta: t('buyNow'),
        popular: false,
        icon: pack.iconKey ? (() => {
          const IconMap = {
            'zap': () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap h-6 w-6"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>,
            'crown': () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown h-6 w-6"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>,
            'building': () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building h-6 w-6"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
          };
          return IconMap[pack.iconKey as keyof typeof IconMap] || (() => null);
        })() : () => null,
        priceCents: parseInt(pack.price.replace(/[^\d]/g, '')) * 100,
        billingInterval: 'one-time' as const,
        groupId: null,
        period: '',
        creditValue: '',
        pricePerCredit: parseInt(pack.price.replace(/[^\d]/g, '')) / parseInt(pack.credits.replace(/[^\d]/g, '')),
        badge: '',
        checkoutUrl: pack.checkoutUrl,
        productId: pack.productId,
      }));
    }
    return subscriptionPlans.filter((plan) => plan.billingInterval === activeTab);
  }, [activeTab]);

  const wrapperPadding = variant === "page" ? "" : variant === "modal" ? "" : "";
  const cardDensity = variant === "teaser" ? "p-5" : "p-6";
  const buttonSize = variant === "teaser" ? "default" : "lg";

  return (
    <div className={wrapperPadding}>
      {showToggle && (
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center bg-muted rounded-full p-1 border border-border shadow-inner">
            <button
              className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === "month"
                  ? "bg-background text-primary shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("month")}
              aria-pressed={activeTab === "month"}
            >
              {t('monthly')}
            </button>
            <button
              className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${
                activeTab === "year"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("year")}
              aria-pressed={activeTab === "year"}
            >
              <span className="hidden sm:inline">{t('annual')}</span>
              <span className="sm:hidden">{t('annual')}</span>
              <Badge
                className="text-[9px] sm:text-[10px] uppercase tracking-wide bg-red-500 text-white shadow-lg border-0 hover:bg-red-600"
              >
                {t('save50Percent')}
              </Badge>
            </button>
            <button
              className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === "one-time"
                  ? "bg-background text-primary shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("one-time")}
              aria-pressed={activeTab === "one-time"}
            >
              {t('oneTime')}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {displayedPlans.map((plan) => {
          const Icon = plan.icon as any;
          const nameParts = plan.name.split("·");
          const planNamePart = nameParts[0]?.trim() || '';
          const periodPart = nameParts[1]?.trim() || '';
          
          // Translate plan name if it's a known plan
          const translatedPlanName = planNamePart === 'Basic' ? t('planNames.basic') :
                                    planNamePart === 'Creator' ? t('planNames.creator') :
                                    planNamePart === 'Pro' ? t('planNames.pro') :
                                    planNamePart;
          
          // For teaser variant, only show plan name without period
          // For other variants, show plan name with period if available
          const planTitle = variant === 'teaser' 
            ? translatedPlanName 
            : (periodPart 
              ? `${translatedPlanName} · ${periodPart === 'Monthly' ? t('monthly') : periodPart === 'Annual' ? t('annual') : periodPart}` 
              : translatedPlanName);
          const isAnnualPlan = plan.billingInterval === "year";
          const isOneTime = plan.billingInterval === "one-time";
          const matchingMonthly = isAnnualPlan && plan.groupId
            ? subscriptionPlans.find(
                (monthlyPlan) =>
                  monthlyPlan.groupId === plan.groupId && monthlyPlan.billingInterval === "month"
              )
            : null;
          const matchingAnnual = !isAnnualPlan && plan.groupId
            ? subscriptionPlans.find(
                (annualPlan) =>
                  annualPlan.groupId === plan.groupId && annualPlan.billingInterval === "year"
              )
            : null;
          const equivalentMonthly = isAnnualPlan ? plan.priceCents / 100 / 12 : null;
          const yearlySavings = isAnnualPlan && matchingMonthly
            ? (matchingMonthly.priceCents * 12) / 100 - plan.priceCents / 100
            : null;
          const monthlyUpsellSavings = !isAnnualPlan && matchingAnnual
            ? (plan.priceCents * 12) / 100 - matchingAnnual.priceCents / 100
            : null;
          const periodText = plan.period ? plan.period.replace("/", "") : "";
          const headlineValue = isAnnualPlan && equivalentMonthly ? `$${equivalentMonthly.toFixed(2)}` : plan.price;
          const headlineSuffix = isAnnualPlan ? t('perMonth') : periodText ? `per ${periodText}` : "";
          const billingCopy = isAnnualPlan ? `${plan.price}${t('perYear')}` : t('billedMonthly');
          const savingsInfo = isAnnualPlan && yearlySavings && yearlySavings > 0 ? t('savePerYear', { amount: yearlySavings.toFixed(0) }) : null;
          const cardClassName = cn(
            `relative group rounded-2xl border ${cardDensity} transition-all duration-300`,
            plan.popular
              ? "border-primary bg-primary/20 shadow-2xl ring-2 ring-primary ring-offset-2 ring-offset-background hover:-translate-y-1 hover:shadow-2xl"
              : "border-border bg-card hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
          );
          const buttonVariant = plan.popular ? "gradient" : "secondary";

          return (
            <Card key={plan.id} className={cardClassName}>
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="bg-primary text-primary-foreground shadow-soft">
                    {t('mostPopular')}
                  </Badge>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold">{planTitle.trim()}</h4>
                  </div>
                  <div className="space-y-3">
                    {isAnnualPlan ? (
                      // Annual plan display with strikethrough original price
                      <div className="space-y-2">
                        {/* Monthly original price with strikethrough */}
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg sm:text-xl font-medium text-muted-foreground line-through">
                            ${matchingMonthly ? (matchingMonthly.priceCents / 100).toFixed(2) : '0.00'} {t('perMonth')}
                          </span>
                        </div>
                        
                        {/* Equivalent monthly price (annual/12) */}
                        <div className="flex items-baseline justify-center gap-2 font-display">
                          <span className="font-bold text-3xl sm:text-4xl md:text-5xl text-foreground">
                            ${equivalentMonthly ? equivalentMonthly.toFixed(2) : '0.00'}
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t('perMonth')}</span>
                        </div>
                        
                        {/* Billed annually note */}
                        <p className="text-sm text-muted-foreground text-center">
                          ${(plan.priceCents / 100).toFixed(1)} {t('billedAnnually')}
                        </p>
                        
                        {/* Save percentage badge */}
                        {yearlySavings && yearlySavings > 0 && (
                          <div className="flex justify-center">
                            <span className="inline-flex items-center rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                              {t('save50Percent')}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : isOneTime ? (
                      // One-time purchase display
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-center gap-2 font-display">
                          <span className="font-bold text-3xl sm:text-4xl md:text-5xl text-foreground">{plan.price}</span>
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                          {t('payOnce')}
                        </div>
                        <div className="flex justify-center">
                          <span className="inline-flex items-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400 border border-yellow-500">
                            {plan.credits.replace(/Credits/gi, t('credits'))}
                          </span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded p-2">
                          {t('oneTimePurchase')}
                        </div>
                      </div>
                    ) : (
                      // Monthly plan display (existing logic)
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-center gap-2 font-display">
                          <span className="font-bold text-3xl sm:text-4xl md:text-5xl text-foreground">{headlineValue}</span>
                          {headlineSuffix && (
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">{headlineSuffix}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{billingCopy}</p>
                        {savingsInfo && (
                          <div className="flex justify-center">
                            <span className="inline-flex items-center rounded-lg bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                              {savingsInfo}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3 rounded-lg bg-muted/30 px-3 py-1.5 text-left">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-muted-foreground">{translateFeature(feature)}</span>
                    </div>
                  ))}
                </div>

                <PendingButton
                  variant={buttonVariant as any}
                  className="w-full font-semibold shadow-soft transition-transform duration-300 hover:-translate-y-0.5 text-sm sm:text-base"
                  size={buttonSize as any}
                  onAction={() => beginCheckout(plan)}
                  disabled={loadingPlanId === plan.id}
                >
                  {translateCta(plan.cta)}
                </PendingButton>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlans;


