/**
 * 调试脚本：检查KIE API返回的实际状态
 * 
 * 使用方法：
 * 1. 替换下面的 TASK_ID 为你卡在95%的任务ID
 * 2. 运行: npx tsx scripts/debug-kie-status.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载 .env.local 文件
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE_URL = (process.env.KIE_API_BASE_URL || 'https://api.kie.ai').trim();

// ⚠️ 替换为你的任务ID
const TASK_ID = 'a107fdd553cfa7cbf24fd9f7a1dd6bcb';

async function debugKieStatus() {
  if (!KIE_API_KEY) {
    console.error('❌ KIE_API_KEY 未设置');
    return;
  }

  const url = `${KIE_API_BASE_URL}/api/v1/jobs/recordInfo?taskId=${TASK_ID}`;
  console.log('🌐 KIE API URL:', url);
  console.log('');

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'X-API-Key': KIE_API_KEY,
      },
    });

    console.log('📡 HTTP Status:', response.status, response.statusText);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 错误响应:', errorText);
      return;
    }

    const data = await response.json();
    console.log('📦 完整响应:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (data?.data) {
      const payload = data.data;
      console.log('🔍 关键字段分析:');
      console.log('  state:', payload.state);
      console.log('  taskId:', payload.taskId);
      console.log('  model:', payload.model);
      console.log('');

      console.log('  resultJson (原始):', typeof payload.resultJson === 'string' 
        ? payload.resultJson.substring(0, 200) + (payload.resultJson.length > 200 ? '...' : '')
        : payload.resultJson);
      console.log('  resultJson (类型):', typeof payload.resultJson);
      console.log('  resultJson (长度):', typeof payload.resultJson === 'string' ? payload.resultJson.length : 'N/A');
      console.log('');

      // 尝试解析 resultJson
      if (payload.resultJson) {
        try {
          const parsed = typeof payload.resultJson === 'string' 
            ? JSON.parse(payload.resultJson)
            : payload.resultJson;
          
          console.log('  resultJson (解析后):');
          console.log('    类型:', Array.isArray(parsed) ? 'Array' : typeof parsed);
          console.log('    内容:', JSON.stringify(parsed, null, 4));
          console.log('');

          if (parsed.resultUrls && Array.isArray(parsed.resultUrls)) {
            console.log('  ✅ 找到 resultUrls 数组:');
            parsed.resultUrls.forEach((url: string, i: number) => {
              console.log(`    [${i}]:`, url);
            });
          } else {
            console.log('  ⚠️ 没有找到 resultUrls 数组');
          }
        } catch (e) {
          console.error('  ❌ 解析 resultJson 失败:', e);
        }
      }

      console.log('');
      console.log('  failCode:', payload.failCode);
      console.log('  failMsg:', payload.failMsg);
      console.log('  costTime:', payload.costTime);
      console.log('  completeTime:', payload.completeTime ? new Date(payload.completeTime).toISOString() : null);
      console.log('  createTime:', payload.createTime ? new Date(payload.createTime).toISOString() : null);
      console.log('');

      // 诊断
      console.log('🩺 诊断结果:');
      if (payload.state === 'success' || payload.state === 'succeeded' || payload.state === 'completed') {
        console.log('  ✅ 状态显示已完成:', payload.state);
        
        if (payload.resultJson) {
          try {
            const parsed = typeof payload.resultJson === 'string' 
              ? JSON.parse(payload.resultJson)
              : payload.resultJson;
            
            const hasUrl = (parsed.resultUrls && Array.isArray(parsed.resultUrls) && parsed.resultUrls.length > 0)
              || (Array.isArray(parsed) && parsed.length > 0);
            
            if (hasUrl) {
              console.log('  ✅ 找到视频URL');
              console.log('');
              console.log('  🎬 视频应该正常显示！如果前端卡在95%，可能是:');
              console.log('     1. 前端状态映射有问题');
              console.log('     2. API路由没有正确解析resultJson');
              console.log('     3. 轮询没有更新UI');
            } else {
              console.log('  ❌ 状态是完成，但没有找到视频URL');
              console.log('     这是KIE API的问题，任务可能失败了');
            }
          } catch (e) {
            console.log('  ❌ resultJson 解析失败');
          }
        } else {
          console.log('  ❌ 状态是完成，但 resultJson 为空');
        }
      } else if (payload.state === 'waiting' || payload.state === 'running' || payload.state === 'processing') {
        console.log('  ⏳ 任务仍在处理中:', payload.state);
        console.log('     前端显示95%是正常的，继续等待');
      } else if (payload.state === 'fail' || payload.state === 'failed' || payload.state === 'error') {
        console.log('  ❌ 任务失败:', payload.state);
        console.log('     失败原因:', payload.failMsg || '未知');
      } else {
        console.log('  ⚠️ 未知状态:', payload.state);
      }
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

debugKieStatus();

