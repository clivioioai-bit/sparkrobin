/**
 * 检查 Supabase Storage 配置
 * 
 * 使用方法：
 * npx tsx scripts/check-supabase-storage.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载 .env.local 文件
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('📁 环境变量加载状态:');
console.log('   当前目录:', process.cwd());
console.log('   .env.local 路径:', path.resolve(process.cwd(), '.env.local'));
console.log('');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkStorage() {
  console.log('🔍 检查 Supabase Storage 配置...\n');

  // 检查环境变量
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL 未设置');
    return;
  }
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY 未设置');
    return;
  }

  console.log('✅ 环境变量已配置:');
  console.log('   Supabase URL:', supabaseUrl);
  console.log('   Service Key:', supabaseServiceKey.substring(0, 20) + '...');
  console.log('');

  // 创建 Supabase 客户端
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 列出所有 buckets
    console.log('📦 检查存储桶...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ 无法列出存储桶:', bucketsError);
      return;
    }

    console.log(`✅ 找到 ${buckets?.length || 0} 个存储桶:`);
    buckets?.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? '公开' : '私有'})`);
    });
    console.log('');

    // 检查 videos bucket
    const videosBucket = buckets?.find(b => b.name === 'videos');
    if (!videosBucket) {
      console.error('❌ "videos" 存储桶不存在');
      console.log('');
      console.log('📝 创建 "videos" 存储桶的步骤:');
      console.log('   1. 打开 Supabase Dashboard: https://app.supabase.com');
      console.log('   2. 选择你的项目');
      console.log('   3. 点击左侧菜单 "Storage"');
      console.log('   4. 点击 "New bucket"');
      console.log('   5. 名称输入: videos');
      console.log('   6. 选择 "Public bucket" ✅');
      console.log('   7. 点击 "Create bucket"');
      return;
    }

    if (!videosBucket.public) {
      console.warn('⚠️  "videos" 存储桶不是公开的');
      console.log('');
      console.log('📝 将存储桶设为公开的步骤:');
      console.log('   1. 打开 Supabase Dashboard');
      console.log('   2. Storage → videos');
      console.log('   3. 点击设置图标');
      console.log('   4. 启用 "Public bucket"');
      console.log('   5. 保存');
      return;
    }

    console.log('✅ "videos" 存储桶已正确配置（公开）');
    console.log('');

    // 测试上传
    console.log('🧪 测试文件上传...');
    const testFileName = `test/check-${Date.now()}.txt`;
    const testContent = 'Test file content';

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ 上传测试文件失败:', uploadError);
      return;
    }

    console.log('✅ 测试文件上传成功:', uploadData.path);

    // 测试获取公开URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(testFileName);

    console.log('');
    console.log('🔗 公开URL测试:');
    console.log('   URL:', urlData.publicUrl);
    console.log('   有效:', !!urlData.publicUrl && urlData.publicUrl.length > 0);

    if (!urlData.publicUrl || urlData.publicUrl.trim().length === 0) {
      console.error('❌ 生成的公开URL为空！');
      console.log('   这可能是 Supabase 配置问题');
      return;
    }

    console.log('');
    console.log('✅ 所有测试通过！Supabase Storage 配置正确');

    // 清理测试文件
    console.log('');
    console.log('🧹 清理测试文件...');
    const { error: deleteError } = await supabase.storage
      .from('videos')
      .remove([testFileName]);

    if (deleteError) {
      console.warn('⚠️  无法删除测试文件:', deleteError);
    } else {
      console.log('✅ 测试文件已清理');
    }

  } catch (error) {
    console.error('❌ 发生错误:', error);
  }
}

checkStorage();

