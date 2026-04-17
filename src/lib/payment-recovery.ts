import { getSupabaseAdmin } from '@/lib/supabase-admin';

type EmailMatchType = 'exact' | 'case_insensitive' | 'alias' | 'explicit_user_id' | 'none';

type PaymentRecoveryRecord = {
  email: string;
  paymentId?: string | null;
  subscriptionId?: string | null;
  amount?: number | null;
  currency?: string | null;
  webhookData?: Record<string, unknown> | null;
  notes?: string | null;
};

function isMissingSchemaObject(error: any) {
  const code = error?.code;
  return code === 'PGRST205' || code === '42P01' || code === '42703';
}

export function getPaymentEmail(payload: any) {
  const rawEmail = payload?.customer?.email || payload?.metadata?.customerEmail || null;
  return rawEmail ? String(rawEmail).trim().toLowerCase() : null;
}

export function getPaymentIdentifier(payload: any) {
  return String(payload?.payment_id || payload?.id || payload?.metadata?.paymentId || '');
}

export function getPaymentSubscriptionIdentifier(payload: any) {
  return String(
    payload?.subscription_id ||
      payload?.subscription?.subscription_id ||
      payload?.subscription?.id ||
      payload?.metadata?.subscriptionId ||
      ''
  );
}

export async function logEmailMatchingAttempt(params: {
  searchedEmail: string;
  matchType: EmailMatchType;
  matchedUserId?: string | null;
  matchedEmail?: string | null;
  webhookEventType?: string | null;
  webhookData?: Record<string, unknown> | null;
}) {
  try {
    const { error } = await getSupabaseAdmin().from('email_matching_logs').insert({
      searched_email: params.searchedEmail,
      matched_user_id: params.matchedUserId ?? null,
      matched_email: params.matchedEmail ?? null,
      match_type: params.matchType,
      webhook_event_type: params.webhookEventType ?? null,
      webhook_data: params.webhookData ?? null,
    });

    if (error && !isMissingSchemaObject(error)) {
      console.warn('[PAYMENT-RECOVERY] Failed to write email matching log', error);
    }
  } catch (error) {
    console.warn('[PAYMENT-RECOVERY] Email matching log unavailable', error);
  }
}

export async function recordUnmatchedPaymentEmail(record: PaymentRecoveryRecord) {
  if (!record.email) {
    return;
  }

  try {
    const { error } = await getSupabaseAdmin().from('unmatched_payment_emails').insert({
      email: record.email,
      payment_id: record.paymentId || null,
      subscription_id: record.subscriptionId || null,
      amount: record.amount ?? null,
      currency: record.currency || 'USD',
      webhook_data: record.webhookData ?? null,
      notes: record.notes ?? null,
      status: 'pending',
    });

    if (error && !isMissingSchemaObject(error)) {
      console.warn('[PAYMENT-RECOVERY] Failed to store unmatched payment email', error);
    }
  } catch (error) {
    console.warn('[PAYMENT-RECOVERY] Unmatched payment storage unavailable', error);
  }
}

async function resolveExplicitUserId(userId: string, eventType?: string, payload?: Record<string, unknown> | null) {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('id, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  if (data?.id) {
    await logEmailMatchingAttempt({
      searchedEmail: data.email || userId,
      matchType: 'explicit_user_id',
      matchedUserId: data.id,
      matchedEmail: data.email,
      webhookEventType: eventType,
      webhookData: payload ?? null,
    });
  }

  return data?.id || null;
}

export async function resolveUserIdFromPaymentPayload(params: {
  payload: any;
  eventType?: string;
}) {
  const { payload, eventType } = params;
  const explicit =
    payload?.metadata?.customerId ||
    payload?.customer_id ||
    payload?.customer?.customer_id;

  if (explicit) {
    const explicitResolved = await resolveExplicitUserId(String(explicit), eventType, payload);
    if (explicitResolved) {
      return explicitResolved;
    }
  }

  const email = getPaymentEmail(payload);
  if (!email) {
    return null;
  }

  const admin = getSupabaseAdmin();

  const exact = await admin
    .from('users')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (exact.data?.id) {
    await logEmailMatchingAttempt({
      searchedEmail: email,
      matchType: 'exact',
      matchedUserId: exact.data.id,
      matchedEmail: exact.data.email,
      webhookEventType: eventType,
      webhookData: payload,
    });
    return exact.data.id;
  }

  const caseInsensitive = await admin
    .from('users')
    .select('id, email')
    .ilike('email', email)
    .maybeSingle();

  if (caseInsensitive.data?.id) {
    await logEmailMatchingAttempt({
      searchedEmail: email,
      matchType: 'case_insensitive',
      matchedUserId: caseInsensitive.data.id,
      matchedEmail: caseInsensitive.data.email,
      webhookEventType: eventType,
      webhookData: payload,
    });
    return caseInsensitive.data.id;
  }

  try {
    const alias = await admin
      .from('user_email_aliases')
      .select('user_id, alias_email')
      .eq('alias_email', email)
      .eq('status', 'active')
      .maybeSingle();

    if (alias.data?.user_id) {
      await logEmailMatchingAttempt({
        searchedEmail: email,
        matchType: 'alias',
        matchedUserId: alias.data.user_id,
        matchedEmail: alias.data.alias_email,
        webhookEventType: eventType,
        webhookData: payload,
      });
      return alias.data.user_id;
    }
  } catch (error) {
    console.warn('[PAYMENT-RECOVERY] Alias lookup unavailable', error);
  }

  await logEmailMatchingAttempt({
    searchedEmail: email,
    matchType: 'none',
    webhookEventType: eventType,
    webhookData: payload,
  });

  return null;
}

export function isMissingPaymentRecoveryTable(error: any) {
  return isMissingSchemaObject(error);
}
