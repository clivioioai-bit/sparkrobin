#!/usr/bin/env python3
"""
手动翻译脚本 - 基于日文翻译文件创建简体中文和德语翻译
这是一个简化版本，可以手动编辑翻译内容
"""

import json
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def create_translations():
    """创建翻译文件结构"""
    # 读取英文文件
    en_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'messages', 'en.json')
    ja_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'messages', 'ja.json')
    
    with open(en_path, 'r', encoding='utf-8') as f:
        en_data = json.load(f)
    
    with open(ja_path, 'r', encoding='utf-8') as f:
        ja_data = json.load(f)
    
    # 创建简体中文翻译（保持英文结构，需要手动翻译）
    zh_data = json.loads(json.dumps(en_data))
    
    # 创建德语翻译（保持英文结构，需要手动翻译）
    de_data = json.loads(json.dumps(en_data))
    
    # 保存文件
    messages_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'messages')
    
    zh_path = os.path.join(messages_dir, 'zh-CN.json')
    de_path = os.path.join(messages_dir, 'de.json')
    
    with open(zh_path, 'w', encoding='utf-8') as f:
        json.dump(zh_data, f, ensure_ascii=False, indent=2)
    
    with open(de_path, 'w', encoding='utf-8') as f:
        json.dump(de_data, f, ensure_ascii=False, indent=2)
    
    print("✅ 翻译文件结构已创建")
    print(f"   - {zh_path}")
    print(f"   - {de_path}")
    print("\n📝 下一步:")
    print("   1. 使用 Google Cloud Translation API 自动翻译")
    print("   2. 或手动编辑这些文件完成翻译")


if __name__ == '__main__':
    create_translations()

