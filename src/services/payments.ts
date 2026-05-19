import { safeJsonParse } from '@/lib/utils';
import type { PaymentProvider } from '@/lib/payment-provider';

export type CheckoutResult = {
  checkoutUrl: string;
};

export class CheckoutError extends Error {
  constructor(message: string, public code: string, public cause?: unknown) {
    super(message);
    this.name = 'CheckoutError';
  }
}

async function parseErrorPayload(response: Response): Promise<{
  payload: any;
  rawText: string;
  parseError?: string;
}> {
  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  if (!rawText) {
    return { payload: {}, rawText };
  }

  try {
    if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
      return { payload: JSON.parse(rawText), rawText };
    }
    return { payload: {}, rawText, parseError: `Non-JSON response: ${contentType || 'unknown content-type'}` };
  } catch (error) {
    return {
      payload: {},
      rawText,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function createCheckoutSession(
  planId: string,
  provider?: PaymentProvider
): Promise<CheckoutResult> {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ planId, provider }),
  });

  if (response.status === 401) {
    throw new CheckoutError('Authentication required', 'AUTH_REQUIRED');
  }

  if (response.status === 429) {
    const { payload } = await parseErrorPayload(response);
    const retryAfter = payload.retryAfter || 60;
    throw new CheckoutError(
      `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
      'RATE_LIMIT_EXCEEDED',
      payload
    );
  }

  if (!response.ok) {
    const { payload, rawText, parseError } = await parseErrorPayload(response);
    const message = (payload && (payload.error || payload.message)) || 'Failed to create checkout session';

    // Always print structured fields + raw body preview for diagnosis
    const errorDebug = {
      status: response.status,
      planId,
      error: payload.error,
      message: payload.message,
      code: payload.code,
      debug: payload.debug,
      parseError,
      contentType: response.headers.get('content-type'),
      rawBodyPreview: rawText?.slice(0, 500),
    };
    console.error('[Checkout Error]', errorDebug);

    const error = new CheckoutError(message, 'CHECKOUT_FAILED', payload);
    
    // 提供用户友好的错误消息
    if (message.includes('API key') || message.includes('not configured')) {
      error.message = 'Payment service is temporarily unavailable. Please contact support@omniflashai.io for assistance.';
    } else if (message.includes('安全错误') || message.includes('Security')) {
      error.message = 'Payment service configuration error. Please contact support@omniflashai.io.';
    } else if (message.includes('Plan not found') || message.includes('Plan is not configured') || message.includes('productId')) {
      error.message = 'This plan is not available. Please select a different plan or contact support.';
    } else if (message.includes('Too Many Requests') || message.includes('rate limit')) {
      error.message = 'Too many requests. Please wait a moment and try again.';
    } else if (response.status >= 500) {
      error.message = 'Payment service is temporarily unavailable. Please try again in a few moments.';
    }
    
    throw error;
  }

  const data = await safeJsonParse(response);
  const checkoutUrl = data?.checkoutUrl || data?.checkout_url;
  if (!checkoutUrl) {
    throw new CheckoutError('Checkout URL missing in response', 'INVALID_RESPONSE');
  }

  return { checkoutUrl };
}

export async function startCheckout(
  planId: string,
  provider?: PaymentProvider
): Promise<CheckoutResult> {
  try {
    const result = await createCheckoutSession(planId, provider);

    // Best practice: Redirect in the same window
    // Some browsers like Safari may block popups opened with target="_blank" or window.open()
    if (typeof window !== 'undefined') {
      window.location.href = result.checkoutUrl;
    }

    return result;
  } catch (error) {
    throw error;
  }
}
