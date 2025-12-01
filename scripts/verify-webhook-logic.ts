#!/usr/bin/env tsx
/**
 * Webhook 处理逻辑验证脚本
 * 验证关键流程是否正确工作
 */

import { config } from 'dotenv';
import { getSupabaseAdmin } from '../src/lib/supabase-admin';
import { creemPlansById } from '../src/config/creemPlans';
import { creditCredits } from '../src/lib/credits';

config({ path: '.env.local' });

const supabaseAdmin = getSupabaseAdmin();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log('   详情:', JSON.stringify(details, null, 2));
  }
}

async function test1_PlanConfigLookup() {
  console.log('\n📋 测试 1: 计划配置查找');
  
  // 检查所有计划配置
  const plans = Object.values(creemPlansById);
  addResult(
    '计划配置数量',
    plans.length > 0,
    `找到 ${plans.length} 个计划配置`,
    { plans: plans.map(p => ({ id: p.id, productId: p.productId, credits: p.credits })) }
  );
  
  // 检查环境变量中的 productId
  const envVars = [
    'NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID',
    'NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID',
    'NEXT_PUBLIC_CREEM_PACK_STARTER_ID',
    'NEXT_PUBLIC_CREEM_PACK_CREATOR_ID',
  ];
  
  for (const envVar of envVars) {
    const productId = process.env[envVar];
    const plan = Object.values(creemPlansById).find(p => p.productId === productId);
    addResult(
      `环境变量 ${envVar}`,
      !!productId && !!plan,
      productId ? (plan ? `匹配计划: ${plan.id}` : '未找到匹配的计划') : '未设置',
      { productId, planId: plan?.id }
    );
  }
}

async function test2_UserEmailMatching() {
  console.log('\n👤 测试 2: 用户邮箱匹配');
  
  // 获取一个测试用户
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .limit(1)
    .maybeSingle();
  
  if (error || !users) {
    addResult('用户查找', false, '无法获取测试用户', { error });
    return;
  }
  
  const testUser = users;
  addResult('用户查找', true, `找到测试用户: ${testUser.email}`, { userId: testUser.id });
  
  // 测试精确匹配
  const { data: exactMatch } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('email', testUser.email)
    .maybeSingle();
  
  addResult('精确邮箱匹配', !!exactMatch, exactMatch ? '匹配成功' : '匹配失败');
  
  // 测试大小写不敏感匹配
  const { data: caseInsensitiveMatch } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .ilike('email', testUser.email.toUpperCase())
    .maybeSingle();
  
  addResult('大小写不敏感匹配', !!caseInsensitiveMatch, caseInsensitiveMatch ? '匹配成功' : '匹配失败');
}

async function test3_CreditRPC() {
  console.log('\n💰 测试 3: 积分 RPC 函数');
  
  // 获取一个测试用户
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, credits_balance, subscription_credits_balance, flex_credits_balance')
    .limit(1)
    .maybeSingle();
  
  if (!user) {
    addResult('积分 RPC 测试', false, '无法获取测试用户');
    return;
  }
  
  const initialBalance = user.credits_balance || 0;
  const initialSub = user.subscription_credits_balance || 0;
  const initialFlex = user.flex_credits_balance || 0;
  
  console.log(`   初始积分: 总=${initialBalance}, 订阅=${initialSub}, 灵活=${initialFlex}`);
  
  // 测试 flex bucket
  try {
    const testAmount = 10;
    const result = await creditCredits(
      user.id,
      testAmount,
      'test_verification',
      { bucket: 'flex', test: true }
    );
    
    addResult(
      'Flex Bucket 积分发放',
      result.balance === initialBalance + testAmount,
      `积分已增加: ${initialBalance} -> ${result.balance}`,
      { expected: initialBalance + testAmount, actual: result.balance }
    );
    
    // 验证 flex_credits_balance
    const { data: verifyUser } = await supabaseAdmin
      .from('users')
      .select('flex_credits_balance, subscription_credits_balance')
      .eq('id', user.id)
      .single();
    
    addResult(
      'Flex Bucket 验证',
      verifyUser?.flex_credits_balance === initialFlex + testAmount,
      `Flex 积分: ${initialFlex} -> ${verifyUser?.flex_credits_balance}`,
      { expected: initialFlex + testAmount, actual: verifyUser?.flex_credits_balance }
    );
    
    // 清理测试积分
    await supabaseAdmin.rpc('debit_user_credits_transaction', {
      p_user_id: user.id,
      p_amount: testAmount,
      p_reason: 'test_cleanup',
      p_metadata: { test: true }
    });
    
  } catch (error) {
    addResult('Flex Bucket 积分发放', false, 'RPC 调用失败', { error: error instanceof Error ? error.message : String(error) });
  }
  
  // 测试 subscription bucket
  try {
    const testAmount = 20;
    const result = await creditCredits(
      user.id,
      testAmount,
      'test_verification',
      { bucket: 'subscription', test: true }
    );
    
    addResult(
      'Subscription Bucket 积分发放',
      result.balance > initialBalance,
      `积分已增加: ${initialBalance} -> ${result.balance}`,
      { expected: initialBalance + testAmount, actual: result.balance }
    );
    
    // 验证 subscription_credits_balance
    const { data: verifyUser } = await supabaseAdmin
      .from('users')
      .select('subscription_credits_balance, flex_credits_balance')
      .eq('id', user.id)
      .single();
    
    addResult(
      'Subscription Bucket 验证',
      verifyUser?.subscription_credits_balance === initialSub + testAmount,
      `Subscription 积分: ${initialSub} -> ${verifyUser?.subscription_credits_balance}`,
      { expected: initialSub + testAmount, actual: verifyUser?.subscription_credits_balance }
    );
    
    // 清理测试积分
    await supabaseAdmin.rpc('debit_user_credits_transaction', {
      p_user_id: user.id,
      p_amount: testAmount,
      p_reason: 'test_cleanup',
      p_metadata: { test: true }
    });
    
  } catch (error) {
    addResult('Subscription Bucket 积分发放', false, 'RPC 调用失败', { error: error instanceof Error ? error.message : String(error) });
  }
}

async function test4_DuplicateCheck() {
  console.log('\n🔄 测试 4: 防重复检查');
  
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .limit(1)
    .maybeSingle();
  
  if (!user) {
    addResult('防重复检查', false, '无法获取测试用户');
    return;
  }
  
  const testPaymentId = `test_payment_${Date.now()}`;
  
  // 第一次发放
  await creditCredits(
    user.id,
    100,
    'creem_payment',
    { paymentId: testPaymentId, bucket: 'flex', test: true }
  );
  
  // 检查是否已存在
  const { data: existingTx } = await supabaseAdmin
    .from('credit_transactions')
    .select('id, amount, created_at, metadata')
    .eq('user_id', user.id)
    .eq('metadata->>paymentId', testPaymentId)
    .eq('reason', 'creem_payment')
    .maybeSingle();
  
  addResult(
    '防重复检查 - 交易记录',
    !!existingTx,
    existingTx ? '交易记录已创建' : '交易记录未找到',
    { paymentId: testPaymentId, transactionId: existingTx?.id }
  );
  
  // 模拟重复检查（24小时内）
  const { data: duplicateCheck } = await supabaseAdmin
    .from('credit_transactions')
    .select('id, amount, created_at')
    .eq('user_id', user.id)
    .eq('metadata->>paymentId', testPaymentId)
    .eq('reason', 'creem_payment')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle();
  
  addResult(
    '防重复检查 - 24小时窗口',
    !!duplicateCheck,
    duplicateCheck ? '可以检测到重复支付' : '无法检测重复支付',
    { found: !!duplicateCheck }
  );
  
  // 清理
  await supabaseAdmin
    .from('credit_transactions')
    .delete()
    .eq('id', existingTx?.id);
}

async function test5_EnvironmentVariables() {
  console.log('\n🔧 测试 5: 环境变量配置');
  
  const requiredVars = [
    'CREEM_API_KEY',
    'CREEM_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    addResult(
      `环境变量 ${varName}`,
      !!value,
      value ? '已设置' : '未设置',
      { prefix: value?.substring(0, 20) }
    );
  }
  
  // 检查 Creem API Key 是否为测试模式
  const apiKey = process.env.CREEM_API_KEY || '';
  const isTestKey = apiKey.includes('_test_') || apiKey.startsWith('pk_test_');
  addResult(
    'Creem API Key 模式',
    isTestKey,
    isTestKey ? '测试模式' : '生产模式（或格式错误）',
    { isTestKey }
  );
}

async function main() {
  console.log('🚀 Webhook 处理逻辑验证\n');
  console.log('='.repeat(60));
  
  try {
    await test1_PlanConfigLookup();
    await test2_UserEmailMatching();
    await test3_CreditRPC();
    await test4_DuplicateCheck();
    await test5_EnvironmentVariables();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 测试总结:\n');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const failed = results.filter(r => !r.passed);
    
    console.log(`✅ 通过: ${passed}/${total}`);
    console.log(`❌ 失败: ${failed.length}/${total}`);
    
    if (failed.length > 0) {
      console.log('\n❌ 失败的测试:');
      failed.forEach(r => {
        console.log(`   - ${r.name}: ${r.message}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    process.exit(failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ 验证过程出错:', error);
    process.exit(1);
  }
}

main();

