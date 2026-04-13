import crypto from 'crypto';

import type { PaymentMethodType } from '@/config/payment-plans';

type DodoEnvironment = 'test_mode' | 'live_mode';

const dodoConfig = {
  apiKey: process.env.DODO_PAYMENTS_API_KEY || '',
  webhookSecret: process.env.DODO_PAYMENTS_WEBHOOK_KEY || '',
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode') as DodoEnvironment,
};

function getBaseUrl() {
  return dodoConfig.environment === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';
}

function getAuthHeaders() {
  if (!dodoConfig.apiKey) {
    throw new Error('Dodo Payments API key not configured');
  }

  return {
    Authorization: `Bearer ${dodoConfig.apiKey}`,
    'Content-Type': 'application/json',
  };
}

function normalizeMetadata(metadata?: Record<string, string | number | boolean | null | undefined>) {
  if (!metadata) return undefined;

  const entries = Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)]);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export async function createDodoCheckoutSession(params: {
  productId: string;
  customerId: string;
  customerEmail?: string | null;
  customerName?: string | null;
  returnUrl?: string;
  allowedPaymentMethodTypes?: PaymentMethodType[];
  metadata?: Record<string, string | number | boolean | null | undefined>;
}) {
  if (!params.productId) {
    throw new Error('Dodo Payments product ID is required');
  }

  const body: Record<string, unknown> = {
    product_cart: [{ product_id: params.productId, quantity: 1 }],
    allowed_payment_method_types:
      params.allowedPaymentMethodTypes && params.allowedPaymentMethodTypes.length > 0
        ? Array.from(new Set(['credit', 'debit', ...params.allowedPaymentMethodTypes]))
        : ['credit', 'debit'],
  };

  if (params.returnUrl) {
    body.return_url = params.returnUrl;
  }

  if (params.customerEmail || params.customerName) {
    body.customer = {
      email: params.customerEmail || undefined,
      name: params.customerName || undefined,
    };
  }

  const metadata = normalizeMetadata({
    ...params.metadata,
    customerId: params.customerId,
    customerEmail: params.customerEmail ?? undefined,
  });

  if (metadata) {
    body.metadata = metadata;
  }

  const response = await fetch(`${getBaseUrl()}/checkouts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Dodo checkout failed (${response.status}): ${payload?.message || payload?.error || 'Unknown error'}`
    );
  }

  return {
    id: payload?.session_id || '',
    checkoutUrl: payload?.checkout_url || '',
  };
}

export async function getDodoCheckoutSession(sessionId: string) {
  if (!sessionId) {
    throw new Error('Dodo session ID is required');
  }

  const response = await fetch(`${getBaseUrl()}/checkouts/${sessionId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${dodoConfig.apiKey}`,
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Failed to retrieve Dodo checkout session (${response.status}): ${
        payload?.message || payload?.error || 'Unknown error'
      }`
    );
  }

  return payload as {
    id?: string;
    created_at?: string;
    customer_email?: string | null;
    customer_name?: string | null;
    payment_id?: string | null;
    payment_status?: string | null;
  };
}

function extractSignatureCandidates(signatureHeader: string) {
  return signatureHeader
    .split(/[ ,]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const [, value] = part.includes(',') ? part.split(',', 2) : part.split('=', 2);
      return value ? [part, value] : [part];
    });
}

export function verifyDodoWebhookSignature(
  body: string,
  headers: {
    webhookId?: string | null;
    webhookSignature?: string | null;
    webhookTimestamp?: string | null;
  }
) {
  const webhookId = headers.webhookId?.trim();
  const webhookSignature = headers.webhookSignature?.trim();
  const webhookTimestamp = headers.webhookTimestamp?.trim();

  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return false;
  }

  if (!dodoConfig.webhookSecret) {
    return false;
  }

  const signedPayload = `${webhookId}.${webhookTimestamp}.${body}`;
  const expectedHex = crypto.createHmac('sha256', dodoConfig.webhookSecret).update(signedPayload).digest('hex');
  const expectedBase64 = crypto.createHmac('sha256', dodoConfig.webhookSecret).update(signedPayload).digest('base64');
  const candidates = extractSignatureCandidates(webhookSignature);

  return candidates.some((candidate) => {
    const normalized = candidate.trim();
    if (!normalized) return false;
    return normalized === expectedHex || normalized === expectedBase64;
  });
}

export { dodoConfig };
