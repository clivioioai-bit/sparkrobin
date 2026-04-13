/**
 * 检查指定用户积分状态
 * 运行:
 *   npx tsx scripts/check-user-credits.ts --email=kellyzhaoning@gmail.com
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase-admin';

function getArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || null;
}

async function checkUserCredits() {
  const supabase = getSupabaseAdmin();
  const email = getArg('email');

  if (!email) {
    throw new Error('Missing --email=<address>');
  }

  console.log(`\n[CHECK] user=${email}\n`);

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  if (!user) {
    console.log('[CHECK] user not found in public.users');
    return;
  }

  console.log('[CHECK] user record:');
  console.log(JSON.stringify(user, null, 2));

  const { data: transactions, error: txError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (txError) {
    throw txError;
  }

  console.log(`\n[CHECK] recent credit transactions=${transactions?.length || 0}`);
  for (const tx of transactions || []) {
    console.log(JSON.stringify(tx, null, 2));
  }

  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (paymentsError) {
    throw paymentsError;
  }

  console.log(`\n[CHECK] recent payments=${payments?.length || 0}`);
  for (const payment of payments || []) {
    console.log(JSON.stringify(payment, null, 2));
  }
}

checkUserCredits().catch((error) => {
  console.error('[CHECK] failed:', error);
  process.exit(1);
});
