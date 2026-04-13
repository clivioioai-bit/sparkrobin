export type PaymentProvider = 'dodo';

export function getEnabledPaymentProviders(): PaymentProvider[] {
  return ['dodo'];
}

export function getDefaultPaymentProvider(): PaymentProvider {
  return 'dodo';
}

export function resolvePaymentProvider(_value?: string | null): PaymentProvider {
  return getDefaultPaymentProvider();
}

export function getPaymentProviderLabel(provider: PaymentProvider): string {
  return provider === 'dodo' ? 'Dodo Payments' : 'Dodo Payments';
}
