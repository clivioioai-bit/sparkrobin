import { Zap, Crown, Building } from "lucide-react";
import { creemSubscriptionPlans, creemCreditPacks, type CreemPlanDefinition } from "./creemPlans";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const creditValueFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPriceLabel = (plan: CreemPlanDefinition) => {
  if (plan.currency !== "USD") {
    return (plan.priceCents / 100).toString();
  }
  return currencyFormatter.format(plan.priceCents / 100);
};

const formatCreditValue = (plan: CreemPlanDefinition) => {
  if (!plan.credits || plan.credits <= 0) {
    return "—";
  }
  const value = plan.priceCents / 100 / plan.credits;
  return `${creditValueFormatter.format(value)}/credit`;
};

const periodLabel = (plan: CreemPlanDefinition) => {
  if (!plan.billingInterval) {
    return "";
  }
  return ` / ${plan.billingInterval}`;
};

const iconMap = {
  zap: Zap,
  crown: Crown,
  building: Building,
} as const;

export type CreditsDisplay = {
  base: number;
  bonus: number;
  total: number;
  period: 'month' | 'year';
  monthlyAvg?: number;
};

// Shared pricing configuration to ensure consistency across the app
export const subscriptionPlans = creemSubscriptionPlans.map((plan) => {
  const Icon = plan.iconKey ? iconMap[plan.iconKey] : Zap;
  const base = plan.baseCredits ?? plan.credits;
  const bonus = plan.bonusCredits ?? 0;
  const total = plan.credits;
  const period = plan.billingInterval === 'year' ? ('year' as const) : ('month' as const);
  const creditsDisplay: CreditsDisplay = {
    base,
    bonus,
    total,
    period,
    ...(period === 'year' ? { monthlyAvg: Math.round(total / 12) } : {}),
  };

  return {
    id: plan.id,
    name: plan.name,
    price: formatPriceLabel(plan),
    period: periodLabel(plan),
    billingInterval: plan.billingInterval,
    groupId: plan.groupId,
    priceCents: plan.priceCents,
    credits: `${plan.credits} Credits`,
    creditValue: formatCreditValue(plan),
    creditsDisplay,
    pricePerCredit: plan.credits > 0 ? plan.priceCents / 100 / plan.credits : undefined,
    badge: plan.badge,
    icon: Icon,
    features: plan.features ?? [],
    cta: plan.cta ?? "Start Creating",
    popular: plan.popular ?? false,
    checkoutUrl: plan.checkoutUrl,
    productId: plan.productId,
  };
});

export const oneTimePacks = creemCreditPacks.map((plan) => ({
  id: plan.id,
  name: plan.name,
  price: formatPriceLabel(plan),
  originalPrice: plan.originalPriceCents ? currencyFormatter.format(plan.originalPriceCents / 100) : undefined,
  discountPercent: plan.discountPercent,
  credits: `${plan.credits} Credits`,
  creditValue: formatCreditValue(plan),
  bonusCredits: plan.bonusCredits ?? 0,
  highlight: plan.highlight ?? false,
  badge: plan.badge,
  popular: plan.popular ?? false,
  limitations: "No API access, No priority queue",
  checkoutUrl: plan.checkoutUrl,
  productId: plan.productId,
  iconKey: plan.iconKey,
  features: plan.features ?? [],
}));

// For homepage teaser, we'll show simplified versions of the main subscription plans
export const homepagePricingTeaser = subscriptionPlans.filter((plan) => plan.period === '/month');

export const getSubscriptionPlanById = (id: string) =>
  subscriptionPlans.find((plan) => plan.id === id);

export const getCreemPlanById = (id: string) => {
  return [...creemSubscriptionPlans, ...creemCreditPacks].find((plan) => plan.id === id) ?? null;
};
