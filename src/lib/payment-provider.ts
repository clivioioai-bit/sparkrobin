export type PaymentProvider = 'creem' | 'dodo';

const DEFAULT_PROVIDER: PaymentProvider = 'dodo';

function normalizeProvider(value?: string | null): PaymentProvider | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'creem' || normalized === 'dodo') {
    return normalized;
  }
  return null;
}

export function getEnabledPaymentProviders(): PaymentProvider[] {
  return [DEFAULT_PROVIDER];
}

export function getDefaultPaymentProvider(): PaymentProvider {
  return DEFAULT_PROVIDER;
}

export function resolvePaymentProvider(value?: string | null): PaymentProvider {
  return normalizeProvider(value) === 'dodo' ? 'dodo' : getDefaultPaymentProvider();
}

export function getPaymentProviderLabel(provider: PaymentProvider): string {
  return provider === 'dodo' ? 'Dodo Payments' : 'Creem';
}
