#!/usr/bin/env tsx
/**
 * 测试 Webhook 脚本
 * 模拟 Creem webhook 请求来测试积分发放
 */

import { config } from 'dotenv';
import crypto from 'crypto';

config({ path: '.env.local' });

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/creem';
const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || '';

if (!WEBHOOK_SECRET) {
  console.error('❌ CREEM_WEBHOOK_SECRET 未设置');
  process.exit(1);
}

// 生成 webhook 签名
function generateSignature(body: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
}

// 测试 Basic Monthly 订阅
async function testBasicMonthlySubscription() {
  console.log('\n🧪 测试 Basic Monthly 订阅支付\n');
  
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const productId = process.env.NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID || 'prod_68dHOffXCVRWc7NZxX00Z';
  
  // 模拟 checkout.completed 事件
  const webhookPayload = {
    eventType: 'checkout.completed',
    object: {
      order: {
        id: `order_test_${Date.now()}`,
        type: 'subscription',
        amount: 1900,
        currency: 'USD',
        transaction_id: `tx_test_${Date.now()}`,
        metadata: {
          planId: 'basic_monthly',
          credits: '600'
        }
      },
      product: {
        id: productId,  // ⭐ 使用环境变量中的产品 ID
        name: 'Basic Monthly Plan',
        billing_type: 'recurring',
        metadata: {
          planId: 'basic_monthly',
          credits: '600'
        }
      },
      customer: {
        id: `customer_test_${Date.now()}`,
        email: testEmail,  // ⭐ 使用测试邮箱
        name: 'Test User'
      },
      subscription: {
        id: `sub_test_${Date.now()}`,
        status: 'active',
        current_period_start_date: new Date().toISOString(),
        current_period_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          planId: 'basic_monthly',
          credits: '600'
        }
      },
      metadata: {
        planId: 'basic_monthly',
        credits: '600',
        customerId: 'test_user_id'
      }
    }
  };
  
  const body = JSON.stringify(webhookPayload);
  const signature = generateSignature(body, WEBHOOK_SECRET);
  
  console.log('📤 发送 webhook 请求...');
  console.log(`   URL: ${WEBHOOK_URL}`);
  console.log(`   Product ID: ${productId}`);
  console.log(`   Customer Email: ${testEmail}`);
  console.log(`   Expected Credits: 600\n`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': signature,
      },
      body: body,
    });
    
    const responseData = await response.json();
    
    console.log('📥 Webhook 响应:');
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应:`, JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Webhook 请求成功！');
      console.log('   请检查：');
      console.log('   1. 开发服务器控制台的 [WEBHOOK] 日志');
      console.log('   2. Supabase 数据库中的 credit_transactions 表');
      console.log('   3. users 表的积分余额');
    } else {
      console.log('\n❌ Webhook 请求失败');
      console.log(`   错误: ${responseData.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n❌ 请求出错:', error);
  }
}

// 测试一次性包（Starter Pack）
async function testStarterPack() {
  console.log('\n🧪 测试 Starter Pack 一次性支付\n');
  
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const productId = process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID || '';
  
  if (!productId) {
    console.log('⚠️  NEXT_PUBLIC_CREEM_PACK_STARTER_ID 未设置，跳过测试');
    return;
  }
  
  const webhookPayload = {
    eventType: 'checkout.completed',
    object: {
      order: {
        id: `order_test_${Date.now()}`,
        type: 'one_time',
        amount: 990,
        currency: 'USD',
        transaction_id: `tx_test_${Date.now()}`,
        metadata: {
          planId: 'starter',
          credits: '300'
        }
      },
      product: {
        id: productId,
        name: 'Starter Pack',
        billing_type: 'one_time',
        metadata: {
          planId: 'starter',
          credits: '300'
        }
      },
      customer: {
        id: `customer_test_${Date.now()}`,
        email: testEmail,
        name: 'Test User'
      },
      metadata: {
        planId: 'starter',
        credits: '300'
      }
    }
  };
  
  const body = JSON.stringify(webhookPayload);
  const signature = generateSignature(body, WEBHOOK_SECRET);
  
  console.log('📤 发送 webhook 请求...');
  console.log(`   URL: ${WEBHOOK_URL}`);
  console.log(`   Product ID: ${productId}`);
  console.log(`   Customer Email: ${testEmail}`);
  console.log(`   Expected Credits: 300\n`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': signature,
      },
      body: body,
    });
    
    const responseData = await response.json();
    
    console.log('📥 Webhook 响应:');
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应:`, JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Webhook 请求成功！');
    } else {
      console.log('\n❌ Webhook 请求失败');
    }
  } catch (error) {
    console.error('\n❌ 请求出错:', error);
  }
}

async function main() {
  console.log('🚀 Webhook 测试工具\n');
  console.log('='.repeat(80));
  
  const testType = process.argv[2] || 'subscription';
  
  if (testType === 'subscription' || testType === 'all') {
    await testBasicMonthlySubscription();
  }
  
  if (testType === 'pack' || testType === 'all') {
    await testStarterPack();
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 提示:');
  console.log('   - 查看开发服务器控制台查看详细日志');
  console.log('   - 日志会以 [WEBHOOK-xxx] 开头');
  console.log('   - 检查 Supabase 数据库验证积分是否发放');
  console.log('\n📝 使用方法:');
  console.log('   npx tsx scripts/test-webhook.ts subscription  # 测试订阅');
  console.log('   npx tsx scripts/test-webhook.ts pack         # 测试一次性包');
  console.log('   npx tsx scripts/test-webhook.ts all         # 测试所有');
}

main();

