import type { PaymentProvider } from '@/lib/payment-provider';

export type CreemPlanCategory = 'subscription' | 'pack';
export type BillingInterval = 'month' | 'year';
export type PaymentMethodType = 'credit' | 'debit' | 'apple_pay' | 'google_pay' | 'paypal';

export interface CreemPlanDefinition {
  id: string;
  category: CreemPlanCategory;
  name: string;
  priceCents: number;
  originalPriceCents?: number;
  discountPercent?: number;
  currency: 'USD';
  billingInterval?: BillingInterval;
  groupId?: string;
  credits: number;
  baseCredits?: number;
  bonusCredits?: number;
  highlight?: boolean;
  badge?: string;
  popular?: boolean;
  cta?: string;
  description?: string;
  checkoutUrl?: string;
  productId?: string;
  dodoProductId?: string;
  allowedPaymentMethodTypes?: PaymentMethodType[];
  features?: string[];
  iconKey?: 'zap' | 'crown' | 'building';
}

const toUsdCents = (value: number) => Math.round(value * 100);

const readEnv = (key: string) => process.env[key];

const normalizeEnvValue = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed;
};

// Guard against placeholder values copied from templates
const normalizeProductId = (value?: string) => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return undefined;

  if (
    normalized.startsWith('prod_public_') ||
    normalized.includes('your_') ||
    normalized.includes('placeholder')
  ) {
    return undefined;
  }

  return normalized;
};

const normalizeCheckoutUrl = (value?: string) => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return undefined;
  if (!/^https?:\/\//i.test(normalized)) return undefined;
  return normalized;
};

const resolveProviderProductId = (envKeyRoot: string, provider: PaymentProvider) => {
  const suffix = provider === 'dodo' ? '_DODO_ID' : '_ID';
  return normalizeProductId(readEnv(`${envKeyRoot}${suffix}`));
};

const resolvePlanConfig = (
  baseId: string,
  billing: 'MONTHLY' | 'YEARLY',
  envSuffix?: string
) => {
  const envKeyRoot = `NEXT_PUBLIC_CREEM_PLAN_${baseId}_${billing}${envSuffix ?? ''}`;

  const checkoutUrl = normalizeCheckoutUrl(readEnv(`${envKeyRoot}_URL`));
  const productId = resolveProviderProductId(envKeyRoot, 'creem');
  const dodoProductId = resolveProviderProductId(envKeyRoot, 'dodo');

  return { checkoutUrl, productId, dodoProductId };
};

const buildSubscriptionPlans = () => {
  const tiers = [
    {
      baseId: 'basic',
      name: 'Basic',
      monthlyPrice: 49,
      yearlyPrice: 490,
      baseCredits: 500,
      bonusCredits: 0,
      monthlyCredits: 500,
      yearlyCredits: 6000,
      yearlyBonusCredits: 0,
      monthlyBadge: 'Perfect for Beginners',
      yearlyBadge: 'Save 17%',
      monthlyCta: 'Get Started',
      yearlyCta: 'Get Started',
      description: 'Great for getting started with AI video creation',
      baseFeatures: [
        'HD & 4K quality options',
        'Commercial usage rights',
        'Email support',
        'Generation history'
      ],
      iconKey: 'zap' as const,
      popular: false,
    },
    {
      baseId: 'creator',
      name: 'Standard',
      monthlyPrice: 99,
      yearlyPrice: 990,
      baseCredits: 1100,
      bonusCredits: 0,
      monthlyCredits: 1100,
      yearlyCredits: 13200,
      yearlyBonusCredits: 0,
      monthlyBadge: 'Most Popular',
      yearlyBadge: 'Save 17%',
      monthlyCta: 'Get Standard',
      yearlyCta: 'Get Standard',
      description: 'For professionals who need director-level control',
      baseFeatures: [
        'HD & 4K quality options',
        'Priority queue',
        '4K at 1x credits (Basic uses 2x)',
        'Priority email support',
        'Generation history'
      ],
      iconKey: 'crown' as const,
      popular: true,
    },
    {
      baseId: 'pro',
      name: 'Pro',
      monthlyPrice: 200,
      yearlyPrice: 2000,
      baseCredits: 2400,
      bonusCredits: 0,
      monthlyCredits: 2400,
      yearlyCredits: 28800,
      yearlyBonusCredits: 0,
      monthlyBadge: 'For Professionals',
      yearlyBadge: 'Save 17%',
      monthlyCta: 'Get Pro',
      yearlyCta: 'Get Pro',
      description: 'Maximum power for teams and production workflows',
      baseFeatures: [
        'HD & 4K quality options',
        'Fastest queue',
        'Highest concurrency / batch-friendly',
        '1-on-1 professional consultation support',
        'API early access + priority onboarding',
        'Generation history'
      ],
      iconKey: 'building' as const,
      popular: false,
    }
  ];

  const yearlyBadgeFallback = 'Save 17%';

  return tiers.flatMap((tier) => {
    const baseName = tier.name;
    const envPrefix = tier.baseId.toUpperCase();

    const monthlyPlanConfig = resolvePlanConfig(
      envPrefix,
      'MONTHLY',
      tier.baseId === 'creator' ? '_V2' : undefined
    );
    const yearlyPlanConfig = resolvePlanConfig(
      envPrefix,
      'YEARLY',
      tier.baseId === 'creator' ? '_V2' : undefined
    );

    return [
      {
        id: `${tier.baseId}_monthly`,
        category: 'subscription' as const,
        name: `${baseName} · Monthly`,
        priceCents: toUsdCents(tier.monthlyPrice),
        currency: 'USD' as const,
        billingInterval: 'month' as BillingInterval,
        groupId: tier.baseId,
        credits: tier.monthlyCredits,
        baseCredits: tier.baseCredits,
        bonusCredits: tier.bonusCredits,
        badge: tier.monthlyBadge,
        popular: tier.popular,
        cta: tier.monthlyCta ?? 'Start Creating',
        checkoutUrl: monthlyPlanConfig.checkoutUrl,
        productId: monthlyPlanConfig.productId,
        dodoProductId: monthlyPlanConfig.dodoProductId,
        allowedPaymentMethodTypes: ['credit', 'debit', 'apple_pay', 'google_pay'] as PaymentMethodType[],
        features: [...tier.baseFeatures],
        iconKey: tier.iconKey,
      },
      {
        id: `${tier.baseId}_yearly`,
        category: 'subscription' as const,
        name: `${baseName} · Annual`,
        priceCents: toUsdCents(tier.yearlyPrice),
        currency: 'USD' as const,
        billingInterval: 'year' as BillingInterval,
        groupId: tier.baseId,
        credits: tier.yearlyCredits,
        baseCredits: (tier.baseCredits ?? tier.monthlyCredits) * 12,
        bonusCredits: tier.yearlyBonusCredits ?? (tier.bonusCredits ?? 0) * 12,
        badge: tier.yearlyBadge ?? yearlyBadgeFallback,
        popular: tier.popular,
        cta: tier.yearlyCta ?? 'Save with Annual',
        checkoutUrl: yearlyPlanConfig.checkoutUrl,
        productId: yearlyPlanConfig.productId,
        dodoProductId: yearlyPlanConfig.dodoProductId,
        allowedPaymentMethodTypes: ['credit', 'debit', 'apple_pay', 'google_pay'] as PaymentMethodType[],
        features: [...tier.baseFeatures],
        iconKey: tier.iconKey,
      }
    ];
  });
};

export const creemSubscriptionPlans: CreemPlanDefinition[] = buildSubscriptionPlans();

export const creemCreditPacks: CreemPlanDefinition[] = [
  {
    id: 'starter',
    category: 'pack',
    name: 'Starter Pack',
    priceCents: toUsdCents(50),
    originalPriceCents: undefined,
    discountPercent: undefined,
    currency: 'USD',
    credits: 500,
    bonusCredits: 0,
    description: 'Pay once, use anytime — credits never expire',
    checkoutUrl: normalizeCheckoutUrl(process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_URL),
    productId: normalizeProductId(process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID),
    dodoProductId: normalizeProductId(process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_DODO_ID),
    allowedPaymentMethodTypes: ['credit', 'debit', 'apple_pay', 'google_pay'] as PaymentMethodType[],
    iconKey: 'zap' as const,
  },
  {
    id: 'creator_pack',
    category: 'pack',
    name: 'Creator Pack',
    priceCents: toUsdCents(200),
    originalPriceCents: undefined,
    discountPercent: undefined,
    currency: 'USD',
    credits: 2100,
    bonusCredits: 0,
    badge: 'Most Popular',
    popular: true,
    highlight: true,
    description: 'Pay once, use anytime — credits never expire',
    checkoutUrl: normalizeCheckoutUrl(process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_URL),
    productId: normalizeProductId(process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_ID),
    dodoProductId: normalizeProductId(process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_DODO_ID),
    allowedPaymentMethodTypes: ['credit', 'debit', 'apple_pay', 'google_pay'] as PaymentMethodType[],
    iconKey: 'crown' as const,
  },
  {
    id: 'dev_team',
    category: 'pack',
    name: 'Professional Pack',
    priceCents: toUsdCents(400),
    originalPriceCents: undefined,
    discountPercent: undefined,
    currency: 'USD',
    credits: 5000,
    bonusCredits: 0,
    badge: 'Best Value',
    description: 'Pay once, use anytime — credits never expire',
    checkoutUrl: normalizeCheckoutUrl(process.env.NEXT_PUBLIC_CREEM_PACK_DEV_URL),
    productId: normalizeProductId(process.env.NEXT_PUBLIC_CREEM_PACK_DEV_ID),
    dodoProductId: normalizeProductId(process.env.NEXT_PUBLIC_CREEM_PACK_DEV_DODO_ID),
    allowedPaymentMethodTypes: ['credit', 'debit', 'apple_pay', 'google_pay'] as PaymentMethodType[],
    iconKey: 'building' as const,
    features: ['1-on-1 24/7 customer support'],
  },
];

export const creemPlansById = Object.fromEntries(
  [...creemSubscriptionPlans, ...creemCreditPacks].map((plan) => [plan.id, plan])
);

export type CreemPlanId = keyof typeof creemPlansById;

export function getPlanProductId(
  plan: CreemPlanDefinition,
  provider: PaymentProvider
): string | undefined {
  if (provider === 'dodo') {
    return plan.dodoProductId;
  }

  return plan.productId;
}
