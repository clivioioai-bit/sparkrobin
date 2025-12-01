import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase-admin';
import { creditCredits } from '../src/lib/credits';

async function addCreditsToUser() {
  const email = 'panzhaoning@outlook.com';
  const creditsToAdd = 1000;

  console.log(`🔍 Looking up user: ${email}`);
  
  try {
    // 1. 查找用户
    const { data: userData, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('id, email, credits_balance, credits_total, credits_spent')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('❌ Error finding user:', userError);
      // 如果用户不存在，尝试从 auth.users 查找
      const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Error listing auth users:', authError);
        process.exit(1);
      }

      const authUser = authData.users.find(u => u.email === email);
      if (!authUser) {
        console.error(`❌ User not found: ${email}`);
        console.log('Available users:', authData.users.map(u => u.email).join(', '));
        process.exit(1);
      }

      console.log(`✅ Found user in auth, but not in users table. User ID: ${authUser.id}`);
      console.log('⚠️  User needs to be created in users table first.');
      process.exit(1);
    }

    if (!userData) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user:`, {
      id: userData.id,
      email: userData.email,
      current_balance: userData.credits_balance,
      current_total: userData.credits_total,
      current_spent: userData.credits_spent
    });

    // 2. 添加积分
    console.log(`\n💰 Adding ${creditsToAdd} credits...`);
    const result = await creditCredits(
      userData.id,
      creditsToAdd,
      'admin_add_credits',
      {
        admin_action: 'manual_credit_addition',
        email: email,
        amount: creditsToAdd,
        timestamp: new Date().toISOString()
      }
    );

    console.log(`\n✅ Successfully added ${creditsToAdd} credits!`);
    console.log('📊 Updated credit snapshot:', {
      new_balance: result.balance,
      new_total: result.total,
      new_spent: result.spent,
      credits_added: creditsToAdd
    });

    // 3. 验证更新
    const { data: verifyData } = await getSupabaseAdmin()
      .from('users')
      .select('credits_balance, credits_total, credits_spent')
      .eq('id', userData.id)
      .single();

    console.log('\n🔍 Verification:', {
      verified_balance: verifyData?.credits_balance,
      verified_total: verifyData?.credits_total,
      verified_spent: verifyData?.credits_spent
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addCreditsToUser();

