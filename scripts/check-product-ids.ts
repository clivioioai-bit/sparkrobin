#!/usr/bin/env tsx
/**
 * 检查产品 ID 配置状态
 * 显示哪些产品 ID 已配置，哪些缺失
 */

import { config } from 'dotenv';
import { creemPlansById } from '../src/config/creemPlans';

config({ path: '.env.local' });

console.log('🔍 检查产品 ID 配置状态\n');
console.log('='.repeat(80));

// 获取所有计划配置
const allPlans = Object.values(creemPlansById);

// 重新读取环境变量（因为 creemPlansById 在构建时读取，可能没有最新值）
allPlans.forEach(plan => {
  if (plan.id.includes('_monthly') || plan.id.includes('_yearly')) {
    const parts = plan.id.split('_');
    const baseId = parts[0].toUpperCase();
    const billing = parts[1]?.toUpperCase() || 'MONTHLY';
    const envVar = `NEXT_PUBLIC_CREEM_PLAN_${baseId}_${billing}_ID`;
    plan.productId = process.env[envVar] || plan.productId;
  } else {
    const envVarMap: Record<string, string> = {
      'starter': 'NEXT_PUBLIC_CREEM_PACK_STARTER_ID',
      'creator_pack': 'NEXT_PUBLIC_CREEM_PACK_CREATOR_ID',
      'dev_team': 'NEXT_PUBLIC_CREEM_PACK_DEV_ID',
    };
    const envVar = envVarMap[plan.id];
    if (envVar) {
      plan.productId = process.env[envVar] || plan.productId;
    }
  }
});

// 分类统计
const subscriptionPlans = allPlans.filter(p => p.category === 'subscription');
const packs = allPlans.filter(p => p.category === 'pack');

console.log('\n📊 配置概览:');
console.log(`   订阅计划: ${subscriptionPlans.length} 个`);
console.log(`   一次性包: ${packs.length} 个`);
console.log(`   总计: ${allPlans.length} 个\n`);

// 检查订阅计划
console.log('📅 订阅计划配置:');
console.log('-'.repeat(80));

subscriptionPlans.forEach(plan => {
  const hasProductId = !!plan.productId;
  const status = hasProductId ? '✅' : '❌';
  const productId = plan.productId || '未配置';
  
  console.log(`${status} ${plan.id.padEnd(20)} | ${plan.name.padEnd(25)} | ${productId}`);
  
  if (!hasProductId) {
    // 推断环境变量名
    const parts = plan.id.split('_');
    const baseId = parts[0].toUpperCase();
    const billing = parts[1]?.toUpperCase() || 'MONTHLY';
    const envVar = `NEXT_PUBLIC_CREEM_PLAN_${baseId}_${billing}_ID`;
    console.log(`   需要配置: ${envVar}`);
  }
});

// 检查一次性包
console.log('\n📦 一次性包配置:');
console.log('-'.repeat(80));

packs.forEach(plan => {
  const hasProductId = !!plan.productId;
  const status = hasProductId ? '✅' : '❌';
  const productId = plan.productId || '未配置';
  
  console.log(`${status} ${plan.id.padEnd(20)} | ${plan.name.padEnd(25)} | ${productId}`);
  
  if (!hasProductId) {
    // 推断环境变量名
    const envVarMap: Record<string, string> = {
      'starter': 'NEXT_PUBLIC_CREEM_PACK_STARTER_ID',
      'creator_pack': 'NEXT_PUBLIC_CREEM_PACK_CREATOR_ID',
      'dev_team': 'NEXT_PUBLIC_CREEM_PACK_DEV_ID',
    };
    const envVar = envVarMap[plan.id] || `NEXT_PUBLIC_CREEM_PACK_${plan.id.toUpperCase()}_ID`;
    console.log(`   需要配置: ${envVar}`);
  }
});

// 统计
const configured = allPlans.filter(p => !!p.productId).length;
const missing = allPlans.filter(p => !p.productId).length;

console.log('\n' + '='.repeat(80));
console.log('\n📈 配置统计:');
console.log(`   ✅ 已配置: ${configured}/${allPlans.length}`);
console.log(`   ❌ 缺失: ${missing}/${allPlans.length}`);

if (missing > 0) {
  console.log('\n⚠️  缺失的产品 ID:');
  allPlans
    .filter(p => !p.productId)
    .forEach(plan => {
      console.log(`   - ${plan.id} (${plan.name})`);
    });
  
  console.log('\n💡 解决方案:');
  console.log('   1. 在 Creem Dashboard 中查看实际的产品 ID');
  console.log('   2. 在 .env.local 中配置对应的环境变量');
  console.log('   3. 或者：在创建 checkout 时，在 metadata 中包含 credits 字段');
} else {
  console.log('\n✅ 所有产品 ID 都已配置！');
}

console.log('\n' + '='.repeat(80));

