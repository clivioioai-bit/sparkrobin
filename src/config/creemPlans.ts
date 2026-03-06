export type CreemPlanCategory = 'subscription' | 'pack';
export type BillingInterval = 'month' | 'year';

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

const resolvePlanConfig = (
  baseId: string,
  billing: 'MONTHLY' | 'YEARLY',
  envSuffix?: string
) => {
  const envKeyRoot = `NEXT_PUBLIC_CREEM_PLAN_${baseId}_${billing}${envSuffix ?? ''}`;

  const checkoutUrl = normalizeCheckoutUrl(readEnv(`${envKeyRoot}_URL`));
  const productId = normalizeProductId(readEnv(`${envKeyRoot}_ID`));

  return { checkoutUrl, productId };
};

const buildSubscriptionPlans = () => {
  const tiers = [
    {
      baseId: 'basic',
      name: 'Basic',
      monthlyPrice: 29.9,
      yearlyPrice: 179,  // $29.9 × 12 × 0.5 = $179
      baseCredits: 935,
      bonusCredits: 0,
      monthlyCredits: 935,
      yearlyCredits: 11220,  // 935 × 12
      yearlyBonusCredits: 0,
      monthlyBadge: 'Perfect for Beginners',
      yearlyBadge: 'Save 50%',
      monthlyCta: 'Buy Now',
      yearlyCta: 'Buy Now',
      description: 'Perfect for testing and personal projects',
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
      name: 'Creator',
      monthlyPrice: 69.9,
      yearlyPrice: 419,  // $69.9 × 12 × 0.5 ≈ $419
      baseCredits: 1560,
      bonusCredits: 180,
      monthlyCredits: 1740,  // 1560 + 180 (10% discount)
      yearlyCredits: 19320,  // 1560 × 12 + 600
      yearlyBonusCredits: 600,
      monthlyBadge: 'Most Popular',
      yearlyBadge: 'Save 50%',
      monthlyCta: 'Buy Now',
      yearlyCta: 'Buy Now',
      description: 'For content creators and small teams',
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
      monthlyPrice: 149,
      yearlyPrice: 894,  // $149 × 12 × 0.5 = $894
      baseCredits: 4650,
      bonusCredits: 450,
      monthlyCredits: 5100,  // 4650 + 450
      yearlyCredits: 57000,  // 4650 × 12 + 1200
      yearlyBonusCredits: 1200,
      monthlyBadge: 'For Professionals',
      yearlyBadge: 'Save 50%',
      monthlyCta: 'Buy Now',
      yearlyCta: 'Buy Now',
      description: 'For agencies, studios & power users',
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

  const yearlyBadgeFallback = 'Annual Savings';

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
    priceCents: toUsdCents(39),
    originalPriceCents: undefined,
    discountPercent: undefined,
    currency: 'USD',
    credits: 800,
    bonusCredits: 0,
    description: 'Pay once, use anytime — credits never expire',
    checkoutUrl: normalizeCheckoutUrl(process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_URL),
    productId: normalizeProductId(process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID),
    iconKey: 'zap' as const,
  },
  {
    id: 'creator_pack',
    category: 'pack',
    name: 'Creator Pack',
    priceCents: toUsdCents(99),
    originalPriceCents: 11000,
    discountPercent: 10,
    currency: 'USD',
    credits: 2400,
    bonusCredits: 140,
    badge: 'Most Popular',
    popular: true,
    highlight: true,
    description: 'Pay once, use anytime — credits never expire',
    checkoutUrl: normalizeCheckoutUrl(process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_URL),
    productId: normalizeProductId(process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_ID),
    iconKey: 'crown' as const,
  },
  {
    id: 'dev_team',
    category: 'pack',
    name: 'Professional Pack',
    priceCents: toUsdCents(199),
    originalPriceCents: 24875,
    discountPercent: 20,
    currency: 'USD',
    credits: 5400,
    bonusCredits: 300,
    badge: 'Best Value',
    description: 'Pay once, use anytime — credits never expire',
    checkoutUrl: normalizeCheckoutUrl(process.env.NEXT_PUBLIC_CREEM_PACK_DEV_URL),
    productId: normalizeProductId(process.env.NEXT_PUBLIC_CREEM_PACK_DEV_ID),
    iconKey: 'building' as const,
    features: ['1-on-1 24/7 customer support'],
  },
];

export const creemPlansById = Object.fromEntries(
  [...creemSubscriptionPlans, ...creemCreditPacks].map((plan) => [plan.id, plan])
);

export type CreemPlanId = keyof typeof creemPlansById;
