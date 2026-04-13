#!/usr/bin/env node
/**
 * 上线前环境检查脚本
 * 检查所有必需的环境变量是否已配置
 */

const requiredEnvVars = {
  // Next.js
  NEXT_PUBLIC_APP_URL: '应用URL',
  NODE_ENV: 'Node环境',
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase Anon Key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase Service Role Key',
  
  // Dodo Payments
  DODO_PAYMENTS_API_KEY: 'Dodo Payments API Key',
  DODO_PAYMENTS_WEBHOOK_KEY: 'Dodo Payments Webhook Key',
  DODO_PAYMENTS_ENVIRONMENT: 'Dodo Payments Environment',
  
  // KIE API
  KIE_API_KEY: 'KIE API Key',
  KIE_API_BASE_URL: 'KIE API Base URL',
};

const optionalEnvVars = {
  GOOGLE_CLIENT_ID: 'Google OAuth',
  GOOGLE_CLIENT_SECRET: 'Google OAuth Secret',
};

console.log('🔍 检查环境变量配置...\n');

let allPassed = true;

// 检查必需的环境变量
console.log('✅ 必需的环境变量:');
for (const [key, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  if (!value) {
    console.log(`  ❌ ${key} (${description}) - 未配置`);
    allPassed = false;
  } else if (value.includes('your_') || value.includes('xxxxx') || value.includes('test_')) {
    console.log(`  ⚠️  ${key} (${description}) - 可能是占位符值: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ✅ ${key} (${description}) - 已配置`);
  }
}

// 检查可选的环境变量
console.log('\n📋 可选的环境变量:');
for (const [key, description] of Object.entries(optionalEnvVars)) {
  const value = process.env[key];
  if (!value) {
    console.log(`  ⚠️  ${key} (${description}) - 未配置`);
  } else {
    console.log(`  ✅ ${key} (${description}) - 已配置`);
  }
}

// 检查生产环境特定配置
console.log('\n🚀 生产环境检查:');
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv === 'production') {
  console.log('  ✅ NODE_ENV=production');
  
  // 检查是否是生产环境的 API key
  const dodoEnvironment = process.env.DODO_PAYMENTS_ENVIRONMENT;
  const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (dodoEnvironment === 'live_mode' && dodoApiKey && dodoApiKey.includes('test_')) {
    console.log('  ⚠️  DODO_PAYMENTS_API_KEY 看起来是测试环境的 key');
    allPassed = false;
  }
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !appUrl.includes('aivido.ai')) {
    console.log(`  ⚠️  NEXT_PUBLIC_APP_URL 不是生产域名: ${appUrl}`);
  }
} else {
  console.log(`  ℹ️  当前环境: ${nodeEnv || 'development'}`);
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ 所有必需的环境变量已配置！');
  process.exit(0);
} else {
  console.log('❌ 发现未配置或配置错误的环境变量，请检查后重试');
  process.exit(1);
}
