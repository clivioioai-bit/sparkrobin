/**
 * 给指定用户加积分
 * 运行:
 *   npx tsx scripts/add-user-credits.ts --email=kellyzhaoning@gmail.com --amount=1000
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { ensureProvisionedUser } from '../src/lib/account-provisioning';
import { getSupabaseAdmin } from '../src/lib/supabase-admin';

function getArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || null;
}

async function addUserCredits() {
  const supabase = getSupabaseAdmin();
  const email = getArg('email');
  const amount = Number(getArg('amount'));

  if (!email) {
    throw new Error('Missing --email=<address>');
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Missing or invalid --amount=<positive integer>');
  }

  console.log(`\n[ADD] user=${email} amount=${amount}\n`);

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, credits_balance, credits_total, credits_spent, subscription_credits_balance, flex_credits_balance')
    .eq('email', email)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  let targetUser = user;

  if (!targetUser) {
    console.log('[ADD] user missing in public.users, checking auth.users...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw authError;
    }

    const authUser = authData.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
    if (!authUser) {
      throw new Error(`User not found in auth.users or public.users: ${email}`);
    }

    const provisioned = await ensureProvisionedUser({
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
    });

    const { data: reloadedUser, error: reloadError } = await supabase
      .from('users')
      .select('id, email, credits_balance, credits_total, credits_spent, subscription_credits_balance, flex_credits_balance')
      .eq('id', provisioned.id)
      .single();

    if (reloadError) {
      throw reloadError;
    }

    targetUser = reloadedUser;
  }

  console.log('[ADD] before:');
  console.log(JSON.stringify(targetUser, null, 2));

  const { data, error } = await supabase.rpc('credit_user_credits', {
    p_user_id: targetUser.id,
    p_amount: amount,
    p_reason: 'manual_admin_add',
    p_metadata: {
      bucket: 'flex',
      source: 'codex_manual_admin',
      admin_action: true,
      reason: 'manual production credit adjustment',
      email,
    },
  });

  if (error) {
    throw error;
  }

  console.log('\n[ADD] rpc result:');
  console.log(JSON.stringify(data, null, 2));

  const { data: after, error: afterError } = await supabase
    .from('users')
    .select('id, email, credits_balance, credits_total, credits_spent, subscription_credits_balance, flex_credits_balance')
    .eq('id', targetUser.id)
    .single();

  if (afterError) {
    throw afterError;
  }

  console.log('\n[ADD] after:');
  console.log(JSON.stringify(after, null, 2));

  const { data: latestTx, error: latestTxError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', targetUser.id)
    .order('created_at', { ascending: false })
    .limit(3);

  if (latestTxError) {
    throw latestTxError;
  }

  console.log('\n[ADD] latest transactions:');
  for (const tx of latestTx || []) {
    console.log(JSON.stringify(tx, null, 2));
  }
}

addUserCredits().catch((error) => {
  console.error('[ADD] failed:', error);
  process.exit(1);
});
