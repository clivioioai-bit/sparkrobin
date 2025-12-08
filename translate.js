const fs = require('fs');
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

// 简体中文翻译映射（关键部分）
const zhTranslations = {
  "common": {
    "brand": "Sora3",
    "new": "新",
    "generate": "生成",
    "home": "首页",
    "pricing": "定价",
    "blog": "博客",
    "faq": "常见问题",
    "signIn": "登录",
    "getStarted": "开始创建 Sora 3",
    "signOut": "退出",
    "dashboard": "仪表板",
    "account": "账户",
    "settings": "设置",
    "language": "语言",
    "goHome": "返回首页",
    "contactSupport": "联系支持",
    "viewAllFaqs": "查看所有常见问题",
    "haveMoreQuestions": "还有更多问题？我们随时为您提供帮助。"
  }
};

// 德语翻译映射（关键部分）
const deTranslations = {
  "common": {
    "brand": "Sora3",
    "new": "NEU",
    "generate": "Generieren",
    "home": "Startseite",
    "pricing": "Preise",
    "blog": "Blog",
    "faq": "FAQ",
    "signIn": "Anmelden",
    "getStarted": "Sora 3 erstellen starten",
    "signOut": "Abmelden",
    "dashboard": "Dashboard",
    "account": "Konto",
    "settings": "Einstellungen",
    "language": "Sprache",
    "goHome": "Zur Startseite",
    "contactSupport": "Support kontaktieren",
    "viewAllFaqs": "Alle FAQs anzeigen",
    "haveMoreQuestions": "Haben Sie weitere Fragen? Wir helfen Ihnen gerne."
  }
};

console.log('Translation structure created. Full translation needed.');
