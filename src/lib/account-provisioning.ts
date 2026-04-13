import { getSupabaseAdmin } from '@/lib/supabase-admin';

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

type ProvisionedUser = {
  id: string;
  email: string;
  full_name: string;
  subscription_plan: string;
  subscription_status: string;
  credits_balance?: number | null;
  credits_total?: number | null;
  credits_spent?: number | null;
};

const DEFAULT_FREE_PLAN = 'free';
const DEFAULT_ACTIVE_STATUS = 'active';
const DEFAULT_STARTER_CREDITS = 3;

let splitCreditColumnsCache: boolean | null = null;

function getFullName(user: AuthUserLike): string {
  return String(user.user_metadata?.full_name || user.email || '');
}

async function supportsSplitCreditColumns() {
  if (splitCreditColumnsCache !== null) {
    return splitCreditColumnsCache;
  }

  const { error } = await getSupabaseAdmin()
    .from('users')
    .select('subscription_credits_balance, flex_credits_balance')
    .limit(1);

  splitCreditColumnsCache = !error;
  return splitCreditColumnsCache;
}

export function getDefaultUserSummary(user: AuthUserLike) {
  const now = new Date().toISOString();

  return {
    id: user.id,
    email: user.email || '',
    full_name: getFullName(user),
    subscription_plan: DEFAULT_FREE_PLAN,
    subscription_status: DEFAULT_ACTIVE_STATUS,
    subscription_end_date: null,
    credits_balance: 0,
    credits_total: 0,
    credits_spent: 0,
    created_at: now,
    updated_at: now,
  };
}

export async function ensureProvisionedUser(user: AuthUserLike): Promise<ProvisionedUser> {
  const admin = getSupabaseAdmin();
  const fallback = getDefaultUserSummary(user);

  const { data: existingUser, error: lookupError } = await admin
    .from('users')
    .select('id, email, full_name, subscription_plan, subscription_status, credits_balance, credits_total, credits_spent')
    .eq('id', user.id)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existingUser?.id) {
    return {
      id: existingUser.id,
      email: existingUser.email || fallback.email,
      full_name: existingUser.full_name || fallback.full_name,
      subscription_plan: existingUser.subscription_plan || DEFAULT_FREE_PLAN,
      subscription_status: existingUser.subscription_status || DEFAULT_ACTIVE_STATUS,
      credits_balance: existingUser.credits_balance,
      credits_total: existingUser.credits_total,
      credits_spent: existingUser.credits_spent,
    };
  }

  const insertPayload: Record<string, unknown> = {
    id: user.id,
    email: fallback.email,
    full_name: fallback.full_name,
    subscription_plan: DEFAULT_FREE_PLAN,
    subscription_status: DEFAULT_ACTIVE_STATUS,
    credits_spent: 0,
  };

  if (await supportsSplitCreditColumns()) {
    insertPayload.subscription_credits_balance = 0;
    insertPayload.flex_credits_balance = DEFAULT_STARTER_CREDITS;
    insertPayload.credits_total = DEFAULT_STARTER_CREDITS;
  } else {
    insertPayload.credits_balance = DEFAULT_STARTER_CREDITS;
    insertPayload.credits_total = DEFAULT_STARTER_CREDITS;
  }

  const { data: createdUser, error: createError } = await admin
    .from('users')
    .upsert(insertPayload, { onConflict: 'id' })
    .select('id, email, full_name, subscription_plan, subscription_status, credits_balance, credits_total, credits_spent')
    .single();

  if (createError) {
    throw createError;
  }

  return {
    id: createdUser.id,
    email: createdUser.email || fallback.email,
    full_name: createdUser.full_name || fallback.full_name,
    subscription_plan: createdUser.subscription_plan || DEFAULT_FREE_PLAN,
    subscription_status: createdUser.subscription_status || DEFAULT_ACTIVE_STATUS,
    credits_balance: createdUser.credits_balance,
    credits_total: createdUser.credits_total,
    credits_spent: createdUser.credits_spent,
  };
}
