#!/usr/bin/env node
/**
 * 环境变量验证脚本
 * 检查所有必需的环境变量是否已配置
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';

// 加载环境变量
config({ path: '.env.local' });

// 需要检查的环境变量
const requiredVars = {
  '应用配置': [
    'NEXT_PUBLIC_APP_URL',
  ],
  'Supabase': [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  'Creem Payment': [
    'CREEM_API_KEY',
    'CREEM_WEBHOOK_SECRET',
  ],
};

// 可选的环境变量
const optionalVars = {
  'Creem 订阅计划产品 ID': [
    'NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID',
    'NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID',
    'NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_V2_ID',
    'NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_V2_ID',
    'NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID',
    'NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID',
  ],
  'Creem 一次性包产品 ID': [
    'NEXT_PUBLIC_CREEM_PACK_STARTER_ID',
    'NEXT_PUBLIC_CREEM_PACK_CREATOR_ID',
    'NEXT_PUBLIC_CREEM_PACK_DEV_ID',
  ],
  'Google OAuth': [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ],
};

console.log('\n🔍 环境变量验证\n');
console.log('='.repeat(60));

let hasErrors = false;
let hasWarnings = false;

// 检查必需的环境变量
console.log('\n✅ 必需的环境变量:\n');
for (const [category, vars] of Object.entries(requiredVars)) {
  console.log(`📦 ${category}:`);
  for (const varName of vars) {
    const value = process.env[varName];
    if (value) {
      // 隐藏大部分密钥内容
      const maskedValue = value.length > 20 
        ? `${value.substring(0, 20)}...`
        : value.substring(0, 10) + '...';
      console.log(`   ✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`   ❌ ${varName}: 未配置`);
      hasErrors = true;
    }
  }
  console.log('');
}

// 检查可选的环境变量
console.log('⚠️  可选的环境变量:\n');
for (const [category, vars] of Object.entries(optionalVars)) {
  console.log(`📦 ${category}:`);
  for (const varName of vars) {
    const value = process.env[varName];
    if (value) {
      const maskedValue = value.length > 20 
        ? `${value.substring(0, 20)}...`
        : value.substring(0, 10) + '...';
      console.log(`   ✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`   ⚠️  ${varName}: 未配置`);
      hasWarnings = true;
    }
  }
  console.log('');
}

// 安全检查
console.log('🔒 安全检查:\n');

const apiKey = process.env.CREEM_API_KEY || '';
const isProduction = process.env.NODE_ENV === 'production';
const isTestKey = apiKey.includes('_test_');

if (apiKey) {
  if (isProduction && isTestKey) {
    console.log('   ❌ 生产环境使用了测试密钥！');
    hasErrors = true;
  } else if (!isProduction && !isTestKey) {
    console.log('   ⚠️  开发环境使用了生产密钥（建议使用测试密钥）');
    hasWarnings = true;
  } else {
    console.log('   ✅ 密钥环境匹配正确');
  }
} else {
  console.log('   ⚠️  未配置 Creem API 密钥');
}

console.log('');
console.log('='.repeat(60));
console.log('');

// 输出结果
if (hasErrors) {
  console.log('❌ 验证失败：存在缺失的必需环境变量\n');
  console.log('请检查 .env.local 文件，或参考 env.example\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  验证通过但有警告：部分可选配置未设置\n');
  console.log('如需完整功能，请配置所有环境变量\n');
  process.exit(0);
} else {
  console.log('✅ 所有环境变量验证通过！\n');
  process.exit(0);
}
