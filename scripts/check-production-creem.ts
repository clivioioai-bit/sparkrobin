#!/usr/bin/env tsx
/**
 * 检查生产环境 Creem 配置
 * 用于诊断 "Failed to create payment link" 问题
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载环境变量（仅用于本地检查，生产环境应从 Vercel 读取）
config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔍 检查 Creem 生产环境配置...\n');

// 检查必需的环境变量
const requiredEnvVars = {
  'CREEM_API_KEY': process.env.CREEM_API_KEY,
  'NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID': process.env.NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID,
  'NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID': process.env.NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID,
  'NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_V2_ID': process.env.NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_V2_ID,
  'NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_V2_ID': process.env.NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_V2_ID,
  'NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID': process.env.NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID,
  'NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID': process.env.NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID,
  'NEXT_PUBLIC_CREEM_PACK_STARTER_ID': process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID,
  'NEXT_PUBLIC_CREEM_PACK_CREATOR_ID': process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_ID,
  'NEXT_PUBLIC_CREEM_PACK_DEV_ID': process.env.NEXT_PUBLIC_CREEM_PACK_DEV_ID,
};

let hasErrors = false;

console.log('📋 环境变量检查:\n');

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.log(`  ❌ ${key}: 未设置`);
    hasErrors = true;
  } else {
    // 检查 API Key 格式
    if (key === 'CREEM_API_KEY') {
      const isTestKey = value.includes('_test_') || value.startsWith('pk_test_');
      const isLiveKey = value.includes('_live_') || value.startsWith('pk_live_') || value.startsWith('creem_live_');
      
      if (isTestKey) {
        console.log(`  ⚠️  ${key}: 检测到测试密钥 (${value.substring(0, 20)}...)`);
        console.log(`     生产环境应使用生产密钥 (creem_live_... 或 pk_live_...)`);
        hasErrors = true;
      } else if (isLiveKey) {
        console.log(`  ✅ ${key}: 生产密钥已配置 (${value.substring(0, 20)}...)`);
      } else {
        console.log(`  ⚠️  ${key}: 密钥格式未知 (${value.substring(0, 20)}...)`);
      }
    } else {
      console.log(`  ✅ ${key}: ${value}`);
    }
  }
}

console.log('\n📝 诊断建议:\n');

if (!process.env.CREEM_API_KEY) {
  console.log('1. ❌ CREEM_API_KEY 未配置');
  console.log('   解决方案: 在 Vercel Dashboard → Settings → Environment Variables 中添加');
  console.log('   生产环境应使用: creem_live_xxxxx 或 pk_live_xxxxx\n');
}

const apiKey = process.env.CREEM_API_KEY;
if (apiKey && (apiKey.includes('_test_') || apiKey.startsWith('pk_test_'))) {
  console.log('2. ⚠️  检测到测试密钥用于生产环境');
  console.log('   解决方案: 在 Vercel 生产环境变量中配置生产密钥');
  console.log('   从 Creem Dashboard → Settings → API Keys 获取生产密钥\n');
}

const missingProductIds = Object.entries(requiredEnvVars)
  .filter(([key, value]) => key.startsWith('NEXT_PUBLIC_CREEM_') && !value)
  .map(([key]) => key);

if (missingProductIds.length > 0) {
  console.log(`3. ❌ 缺少 ${missingProductIds.length} 个产品 ID 配置:`);
  missingProductIds.forEach(key => console.log(`   - ${key}`));
  console.log('   解决方案: 在 Vercel 环境变量中添加这些产品 ID');
  console.log('   从 Creem Dashboard → Products 获取产品 ID\n');
}

console.log('🔧 如何修复:\n');
console.log('1. 登录 Vercel Dashboard: https://vercel.com/dashboard');
console.log('2. 选择项目 → Settings → Environment Variables');
console.log('3. 确保选择 "Production" 环境');
console.log('4. 添加或更新以下变量:');
console.log('   - CREEM_API_KEY (生产密钥)');
console.log('   - NEXT_PUBLIC_CREEM_PLAN_*_ID (所有产品 ID)');
console.log('   - NEXT_PUBLIC_CREEM_PACK_*_ID (所有包 ID)');
console.log('5. 重新部署应用\n');

console.log('📊 调试模式:\n');
console.log('在生产环境访问购买页面时，添加 ?debug=1 参数查看详细错误信息');
console.log('例如: https://your-domain.com/plans?debug=1\n');

if (hasErrors) {
  console.log('❌ 发现配置问题，请按照上述建议修复');
  process.exit(1);
} else {
  console.log('✅ 配置检查通过！如果仍有问题，请查看 Vercel 函数日志');
  process.exit(0);
}
