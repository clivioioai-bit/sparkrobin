#!/usr/bin/env python3
"""
翻译脚本：将英文翻译文件转换为简体中文和德语
注意：这是一个基础框架，完整翻译需要专业翻译服务或人工审核
"""

import json
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def translate_to_zh(text):
    """将英文翻译为简体中文（这里只是占位符，实际应该使用翻译API）"""
    # 这是一个简化的翻译映射，实际项目中应该使用专业翻译服务
    translations = {
        "NEW": "新",
        "Generate": "生成",
        "Home": "首页",
        "Pricing": "定价",
        "Blog": "博客",
        "FAQ": "常见问题",
        "Sign In": "登录",
        "Sign Out": "退出",
        "Dashboard": "仪表板",
        "Account": "账户",
        "Settings": "设置",
        "Language": "语言",
    }
    return translations.get(text, text)

def translate_to_de(text):
    """将英文翻译为德语（这里只是占位符，实际应该使用翻译API）"""
    translations = {
        "NEW": "NEU",
        "Generate": "Generieren",
        "Home": "Startseite",
        "Pricing": "Preise",
        "Blog": "Blog",
        "FAQ": "FAQ",
        "Sign In": "Anmelden",
        "Sign Out": "Abmelden",
        "Dashboard": "Dashboard",
        "Account": "Konto",
        "Settings": "Einstellungen",
        "Language": "Sprache",
    }
    return translations.get(text, text)

def translate_object(obj, target_lang='zh'):
    """递归翻译对象"""
    if isinstance(obj, dict):
        return {k: translate_object(v, target_lang) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [translate_object(item, target_lang) for item in obj]
    elif isinstance(obj, str):
        if target_lang == 'zh':
            return translate_to_zh(obj)
        elif target_lang == 'de':
            return translate_to_de(obj)
        return obj
    else:
        return obj

if __name__ == '__main__':
    # 读取英文文件
    en_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'messages', 'en.json')
    
    with open(en_path, 'r', encoding='utf-8') as f:
        en_data = json.load(f)
    
    # 创建简体中文版本（保持结构，实际翻译需要完整处理）
    zh_data = json.loads(json.dumps(en_data))
    de_data = json.loads(json.dumps(en_data))
    
    # 保存文件
    messages_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'messages')
    
    zh_path = os.path.join(messages_dir, 'zh-CN.json')
    de_path = os.path.join(messages_dir, 'de.json')
    
    with open(zh_path, 'w', encoding='utf-8') as f:
        json.dump(zh_data, f, ensure_ascii=False, indent=2)
    
    with open(de_path, 'w', encoding='utf-8') as f:
        json.dump(de_data, f, ensure_ascii=False, indent=2)
    
    print(f"Translation files created at:")
    print(f"  - {zh_path}")
    print(f"  - {de_path}")
    print("\nNote: These files currently contain English text as placeholders.")
    print("Full translation requires professional translation service or manual translation.")

