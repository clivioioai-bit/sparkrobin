/**
 * 给 eli.irvin@gmail.com 添加 300 积分
 * 运行: npx tsx scripts/add-credits-eli.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase-admin';
import { creditCredits } from '../src/lib/credits';

async function addCredits() {
  const supabase = getSupabaseAdmin();
  const email = 'eli.irvin@gmail.com';
  const creditsToAdd = 300;
  
  console.log(`\n🎁 给 ${email} 添加 ${creditsToAdd} 积分\n`);
  
  // 1. 查找用户
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, credits_balance, credits_total')
    .eq('email', email)
    .maybeSingle();
  
  if (userError) {
    console.error('❌ 查找用户失败:', userError);
    return;
  }
  
  if (!user) {
    console.error(`❌ 用户不存在: ${email}`);
    return;
  }
  
  console.log('✅ 找到用户:', {
    id: user.id,
    email: user.email,
    current_balance: user.credits_balance,
    current_total: user.credits_total,
  });
  
  // 2. 使用标准积分系统添加积分
  try {
    const result = await creditCredits(
      user.id,
      creditsToAdd,
      'manual_admin_add',
      {
        source: 'manual_script',
        admin_action: true,
        reason: '手动添加积分',
        email: email
      }
    );
    
    console.log('\n✅ 积分添加成功!');
    console.log('📊 新的积分状态:', {
      balance: result.balance,
      total: result.total,
      spent: result.spent,
      added: creditsToAdd
    });
  } catch (error) {
    console.error('❌ 添加积分失败:', error);
    return;
  }
  
  console.log('\n✅ 完成!\n');
}

// 运行脚本
addCredits().catch(console.error);

