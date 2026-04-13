import { getSupabaseAdmin } from '@/lib/supabase-admin';

export type ExternalPaymentIdColumn = 'external_payment_id' | 'creem_payment_id';

let externalPaymentIdColumnCache: ExternalPaymentIdColumn | null = null;

export async function resolveExternalPaymentIdColumn(): Promise<ExternalPaymentIdColumn> {
  if (externalPaymentIdColumnCache) {
    return externalPaymentIdColumnCache;
  }

  const admin = getSupabaseAdmin();
  for (const column of ['external_payment_id', 'creem_payment_id'] as const) {
    const { error } = await admin.from('payments').select(column).limit(1);
    if (!error) {
      externalPaymentIdColumnCache = column;
      return column;
    }
  }

  return 'creem_payment_id';
}

export function getExternalPaymentId(payment: Record<string, any> | null | undefined) {
  if (!payment) return null;
  return payment.external_payment_id || payment.creem_payment_id || payment.payment_id || null;
}
