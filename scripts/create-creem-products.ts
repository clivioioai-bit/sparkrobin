/**
 * Creem 产品自动创建脚本
 * 运行: npx tsx scripts/create-creem-products.ts
 */

import { Creem } from 'creem';
import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

// 从环境变量获取 API Key
const apiKey = process.env.CREEM_API_KEY;

if (!apiKey) {
  console.error('❌ 错误：请先在 .env.local 中设置 CREEM_API_KEY');
  process.exit(1);
}

const creem = new Creem();

// 定义所有产品
const products = [
  // 订阅计划
  {
    name: 'Basic - Monthly',
    price: 1900, // $19/月
    interval: 'month' as const,
    envKey: 'NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID',
    description: 'Perfect for getting started',
    billingType: 'recurring' as const,
  },
  {
    name: 'Basic - Yearly',
    price: 19200, // $192/年
    interval: 'year' as const,
    envKey: 'NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID',
    description: 'Save $36 annually',
    billingType: 'recurring' as const,
  },
  {
    name: 'Creator - Monthly',
    price: 4900, // $49/月
    interval: 'month' as const,
    envKey: 'NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_V2_ID',
    description: 'Ideal for content creators',
    billingType: 'recurring' as const,
  },
  {
    name: 'Creator - Yearly',
    price: 49920, // $499.20/年
    interval: 'year' as const,
    envKey: 'NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_V2_ID',
    description: 'Save $88.80 annually',
    billingType: 'recurring' as const,
  },
  {
    name: 'Pro - Monthly',
    price: 14900, // $149/月
    interval: 'month' as const,
    envKey: 'NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID',
    description: 'For professionals',
    billingType: 'recurring' as const,
  },
  {
    name: 'Pro - Yearly',
    price: 152064, // $1,520.64/年
    interval: 'year' as const,
    envKey: 'NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID',
    description: 'Save $267.36 annually',
    billingType: 'recurring' as const,
  },
  // 一次性包
  {
    name: 'Starter Pack',
    price: 990, // $9.9
    interval: undefined,
    envKey: 'NEXT_PUBLIC_CREEM_PACK_STARTER_ID',
    description: 'Pay once, use anytime — credits never expire',
    billingType: 'one-time' as const,
  },
  {
    name: 'Creator Pack',
    price: 4900, // $49
    interval: undefined,
    envKey: 'NEXT_PUBLIC_CREEM_PACK_CREATOR_ID',
    description: 'Pay once, use anytime — credits never expire',
    billingType: 'one-time' as const,
  },
  {
    name: 'Professional Pack',
    price: 19900, // $199
    interval: undefined,
    envKey: 'NEXT_PUBLIC_CREEM_PACK_DEV_ID',
    description: 'Pay once, use anytime — credits never expire',
    billingType: 'one-time' as const,
  },
];

async function createProducts() {
  console.log('🚀 开始创建 Creem 产品...\n');

  const results: Array<{ name: string; id: string; envKey: string }> = [];

  for (const product of products) {
    try {
      console.log(`📦 创建产品: ${product.name} ($${product.price / 100})...`);

      // 构建符合 Creem API 规范的产品创建请求
      // 参考: https://docs.creem.io/api-reference/endpoint/create-product
      const createRequest: any = {
        name: product.name,
        price: product.price,
        currency: 'usd',
        description: product.description,
      };

      // 根据产品类型设置 billing_type 和 billing_period
      if (product.billingType === 'recurring' && product.interval) {
        createRequest.billing_type = 'recurring';
        // 将 interval 转换为 billing_period 格式
        if (product.interval === 'month') {
          createRequest.billing_period = 'every-month';
        } else if (product.interval === 'year') {
          createRequest.billing_period = 'every-year';
        }
      } else if (product.billingType === 'one-time') {
        createRequest.billing_type = 'one-time';
      }

      // 使用 REST API 创建产品
      // Creem API 端点: https://api.creem.io/v1/products
      const baseUrl = process.env.CREAM_BASE_URL || 'https://api.creem.io';
      
      console.log(`   使用 API: ${baseUrl}/v1/products`);
      console.log(`   API Key: ${apiKey!.substring(0, 20)}...`);
      console.log(`   请求体: ${JSON.stringify(createRequest, null, 2)}`);
      
      const response = await fetch(`${baseUrl}/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey!,
        },
        body: JSON.stringify(createRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ 失败: ${response.status} ${response.statusText}`);
        console.error(`   错误详情: ${errorText}\n`);
        continue;
      }

      const result = await response.json();
      
      if (result.id) {
        const productId = result.id;
        console.log(`✅ 成功! Product ID: ${productId}\n`);
        
        results.push({
          name: product.name,
          id: productId,
          envKey: product.envKey,
        });
      } else {
        console.error(`❌ 失败: 响应中没有产品 ID\n`);
        console.error(`   响应: ${JSON.stringify(result)}\n`);
      }
    } catch (error) {
      console.error(`❌ 创建 ${product.name} 时出错:`, error);
    }
  }

  // 输出环境变量配置
  console.log('\n' + '='.repeat(60));
  console.log('✅ 所有产品创建完成！');
  console.log('='.repeat(60));
  console.log('\n📋 复制以下内容到你的 .env.local 文件:\n');
  
  results.forEach(({ envKey, id }) => {
    console.log(`${envKey}=${id}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 提示：记得重启开发服务器以加载新的环境变量！');
  console.log('   npm run dev\n');
}

createProducts().catch(console.error);
