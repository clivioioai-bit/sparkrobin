#!/usr/bin/env tsx
/**
 * 验证 Webhook 测试结果
 * 检查积分是否已正确发放
 */

import { config } from 'dotenv';
import { getSupabaseAdmin } from '../src/lib/supabase-admin';

config({ path: '.env.local' });

async function verifyWebhookResult() {
  const supabaseAdmin = getSupabaseAdmin();
  const testEmail = process.env.TEST_USER_EMAIL || 'kellyzhaoning@gmail.com';
  
  console.log('🔍 验证 Webhook 测试结果\n');
  console.log('='.repeat(80));
  console.log(`测试邮箱: ${testEmail}\n`);
  
  // 1. 查找用户
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, credits_balance, subscription_credits_balance, flex_credits_balance, credits_total, credits_spent')
    .eq('email', testEmail)
    .maybeSingle();
  
  if (userError || !user) {
    console.error('❌ 用户未找到:', userError?.message || 'User not found');
    return;
  }
  
  console.log('✅ 用户信息:');
  console.log(`   ID: ${user.id}`);
  console.log(`   邮箱: ${user.email}`);
  console.log(`   总积分余额: ${user.credits_balance || 0}`);
  console.log(`   订阅积分: ${user.subscription_credits_balance || 0}`);
  console.log(`   灵活积分: ${user.flex_credits_balance || 0}`);
  console.log(`   累计获得: ${user.credits_total || 0}`);
  console.log(`   累计消费: ${user.credits_spent || 0}\n`);
  
  // 2. 查看最近的积分交易
  console.log('📋 最近的积分交易（最近 5 条）:');
  console.log('-'.repeat(80));
  
  const { data: transactions, error: txError } = await supabaseAdmin
    .from('credit_transactions')
    .select('id, amount, transaction_type, reason, created_at, metadata')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (txError) {
    console.error('❌ 查询交易记录失败:', txError.message);
  } else if (transactions && transactions.length > 0) {
    transactions.forEach((tx, index) => {
      const sign = tx.transaction_type === 'credit' ? '+' : '-';
      const bucket = tx.metadata?.bucket || 'unknown';
      const planId = tx.metadata?.planId || 'N/A';
      console.log(`${index + 1}. ${sign}${tx.amount} 积分 | ${tx.reason} | bucket: ${bucket} | planId: ${planId}`);
      console.log(`   时间: ${tx.created_at}`);
      console.log(`   交易ID: ${tx.id}\n`);
    });
  } else {
    console.log('   暂无交易记录\n');
  }
  
  // 3. 检查是否有测试相关的交易
  console.log('🧪 测试相关的交易:');
  console.log('-'.repeat(80));
  
  const { data: testTransactions } = await supabaseAdmin
    .from('credit_transactions')
    .select('id, amount, reason, created_at, metadata')
    .eq('user_id', user.id)
    .or('reason.eq.subscription_created,reason.eq.dodo_payment')
    .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // 最近 10 分钟
    .order('created_at', { ascending: false });
  
  if (testTransactions && testTransactions.length > 0) {
    console.log(`✅ 找到 ${testTransactions.length} 条最近的测试交易:\n`);
    testTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. +${tx.amount} 积分 (${tx.reason})`);
      console.log(`   Bucket: ${tx.metadata?.bucket || 'N/A'}`);
      console.log(`   Plan ID: ${tx.metadata?.planId || 'N/A'}`);
      console.log(`   时间: ${tx.created_at}\n`);
    });
  } else {
    console.log('⚠️  最近 10 分钟内没有找到测试交易');
    console.log('   可能的原因：');
    console.log('   1. Webhook 处理失败');
    console.log('   2. 用户匹配失败');
    console.log('   3. 计划配置未找到');
    console.log('   4. 积分数量为 0\n');
  }
  
  // 4. 检查支付记录
  console.log('💳 最近的支付记录（最近 5 条）:');
  console.log('-'.repeat(80));
  
  const { data: payments, error: paymentError } = await supabaseAdmin
    .from('payments')
    .select('id, amount, currency, status, created_at, creem_payment_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (paymentError) {
    console.error('❌ 查询支付记录失败:', paymentError.message);
  } else if (payments && payments.length > 0) {
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. ${payment.amount} ${payment.currency} | ${payment.status}`);
      console.log(`   时间: ${payment.created_at}`);
      console.log(`   Dodo Payment ID: ${payment.creem_payment_id || 'N/A'}\n`);
    });
  } else {
    console.log('   暂无支付记录\n');
  }
  
  console.log('='.repeat(80));
  console.log('\n💡 提示:');
  console.log('   - 如果看到积分交易记录，说明 webhook 处理成功');
  console.log('   - 检查 bucket 字段：subscription 或 flex');
  console.log('   - 检查 planId 字段：应该匹配购买的计划');
}

verifyWebhookResult().catch(console.error);
