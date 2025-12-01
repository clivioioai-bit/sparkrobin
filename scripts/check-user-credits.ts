/**
 * 检查用户积分脚本
 * 用于验证 fujashihao@gmail.com 的积分状态
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase-admin';

async function checkUserCredits() {
  const supabase = getSupabaseAdmin();
  const email = 'fujashihao@gmail.com';
  
  console.log(`\n🔍 检查用户: ${email}\n`);
  
  // 1. 查找用户
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
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
  
  console.log('✅ 用户信息:');
  console.log(JSON.stringify(user, null, 2));
  
  // 2. 查找积分交易记录
  console.log('\n🔍 积分交易记录:');
  const { data: transactions, error: txError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (txError) {
    console.error('❌ 查找积分交易失败:', txError);
  } else {
    console.log(`找到 ${transactions?.length || 0} 条交易记录:`);
    transactions?.forEach((t, i) => {
      console.log(`\n  ${i + 1}. 交易ID: ${t.id}`);
      console.log(`     金额: ${t.amount}`);
      console.log(`     类型: ${t.transaction_type}`);
      console.log(`     原因: ${t.reason}`);
      console.log(`     时间: ${t.created_at}`);
      if (t.metadata) {
        console.log(`     元数据:`, JSON.stringify(t.metadata, null, 6));
      }
    });
  }
  
  console.log('\n✅ 完成!\n');
}

// 运行脚本
checkUserCredits().catch(console.error);



