#!/usr/bin/env python3
"""
使用 Google Cloud Translation API 批量翻译语言文件
参考: https://docs.cloud.google.com/translate/docs/reference/rest

使用方法:
1. 安装依赖: pip install google-cloud-translate
2. 设置认证: export GOOGLE_APPLICATION_CREDENTIALS="path/to/credentials.json"
3. 运行: python scripts/translate_with_google.py
"""

import json
import os
import sys
from typing import Any, Dict

try:
    from google.cloud import translate_v2 as translate
except ImportError:
    print("❌ 请先安装 Google Cloud Translation 库:")
    print("   pip install google-cloud-translate")
    sys.exit(1)


def translate_text(text: str, target_lang: str, client: translate.Client) -> str:
    """翻译单个文本"""
    if not text or text.strip() == "":
        return text
    
    # 跳过已经是目标语言的文本（简单检查）
    if target_lang == "zh-CN" and any('\u4e00' <= char <= '\u9fff' for char in text):
        return text
    if target_lang == "de" and any(char.isalpha() and ord(char) > 127 for char in text):
        # 简单检查是否包含德语字符
        pass
    
    try:
        result = client.translate(text, target_language=target_lang)
        return result['translatedText']
    except Exception as e:
        print(f"⚠️  翻译失败: {text[:50]}... 错误: {e}")
        return text


def translate_object(obj: Any, target_lang: str, client: translate.Client) -> Any:
    """递归翻译 JSON 对象"""
    if isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            result[key] = translate_object(value, target_lang, client)
        return result
    elif isinstance(obj, list):
        return [translate_object(item, target_lang, client) for item in obj]
    elif isinstance(obj, str):
        # 跳过 HTML 标签和特殊格式
        if obj.startswith('<') and obj.endswith('>'):
            return obj
        if obj.startswith('{') and '}' in obj:
            # 可能是模板字符串，保持原样
            return obj
        return translate_text(obj, target_lang, client)
    else:
        return obj


def main():
    # 检查认证
    if not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
        print("⚠️  未设置 GOOGLE_APPLICATION_CREDENTIALS 环境变量")
        print("   请设置: export GOOGLE_APPLICATION_CREDENTIALS='path/to/credentials.json'")
        print("\n或者使用以下方式认证:")
        print("   gcloud auth application-default login")
        return
    
    # 初始化翻译客户端
    try:
        client = translate.Client()
    except Exception as e:
        print(f"❌ 无法初始化 Google Cloud Translation 客户端: {e}")
        print("   请确保已启用 Translation API 并正确配置认证")
        return
    
    # 读取英文文件
    en_path = 'messages/en.json'
    if not os.path.exists(en_path):
        print(f"❌ 文件不存在: {en_path}")
        return
    
    with open(en_path, 'r', encoding='utf-8') as f:
        en_data = json.load(f)
    
    print("📖 开始翻译...")
    
    # 翻译为简体中文
    print("\n🇨🇳 翻译为简体中文 (zh-CN)...")
    zh_data = translate_object(en_data, 'zh-CN', client)
    
    zh_path = 'messages/zh-CN.json'
    with open(zh_path, 'w', encoding='utf-8') as f:
        json.dump(zh_data, f, ensure_ascii=False, indent=2)
    print(f"✅ 已保存: {zh_path}")
    
    # 翻译为德语
    print("\n🇩🇪 翻译为德语 (de)...")
    de_data = translate_object(en_data, 'de', client)
    
    de_path = 'messages/de.json'
    with open(de_path, 'w', encoding='utf-8') as f:
        json.dump(de_data, f, ensure_ascii=False, indent=2)
    print(f"✅ 已保存: {de_path}")
    
    print("\n🎉 翻译完成!")


if __name__ == '__main__':
    main()

