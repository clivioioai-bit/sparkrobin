---
title: "أصبح Sora غير متاح رسميًا: كيفية تصدير بياناتك والانتقال إلى Spark Robin"
description: "دليل عملي بعد إيقاف Sora: التواريخ المهمة، تصدير فيديوهات Sora، حفظ المطالبات، والانتقال إلى سير عمل sparkrobinai.io."
date: "2026-04-30"
author: "فريق Spark Robin"
tags: ["OpenAI Sora discontinuation guide", "how to export Sora videos", "Sora alternatives 2026", "transfer Sora prompts to Spark Robin", "ai-video"]
featured: true
---

## الخلاصة

- تم إيقاف تجربة Sora على الويب والتطبيق في **26 أبريل 2026**.
- تشير OpenAI إلى أن **واجهة Sora API ستتوقف في 24 سبتمبر 2026**.
- إذا أنشأت محتوى على Sora، صدّره في أسرع وقت. بعد الإيقاف وأي نافذة تصدير نهائية، قد تُحذف البيانات نهائيًا.
- لا تحفظ ملف MP4 فقط. احفظ المطالبات، الصور المرجعية، النسبة، الإعدادات، الملاحظات وحقوق الاستخدام.
- يمكن لـ sparkrobinai.io دعم text-to-video و image-to-video وتخطيط المشاهد المتعددة وإنتاج فيديوهات إعلانية.

## جدول إيقاف Sora

| التاريخ | التغيير | ما الذي يجب فعله |
|---|---|---|
| **26 أبريل 2026** | إيقاف Sora web و app | تصدير الفيديوهات وسياق المشاريع |
| **24 سبتمبر 2026** | إيقاف Sora API | نقل الأتمتة والمهام المجمعة والتكاملات |

وفقًا لمركز مساعدة OpenAI، يمكن بدء التصدير من `sora.chatgpt.com/sunset` ثم الضغط على **Export**. ستصلك رسالة بريد عند جاهزية التصدير.

## خطوات تصدير بيانات Sora

### 1. ابدأ التصدير الرسمي

افتح:

`https://sora.chatgpt.com/sunset`

اضغط **Export** وانتظر البريد الإلكتروني. إذا كان لديك عدد كبير من الفيديوهات فقد يستغرق الأمر وقتًا.

### 2. احفظ الأصول المهمة أولًا

إذا كانت المكتبة لا تزال متاحة، نزّل يدويًا:

- الفيديوهات المعتمدة من العملاء
- مواد الإعلانات وصفحات الهبوط
- اختبارات الشخصيات
- لقطات المنتجات
- تجارب المطالبات التي احتاجت تكرارات كثيرة
- أي مادة لها قيمة ترخيص أو عقد

### 3. احفظ سياق الإنتاج

استخدم بنية بسيطة لكل مشروع:

| الملف | الغرض |
|---|---|
| `final.mp4` | الفيديو النهائي |
| `prompt.txt` | مطالبة Sora الأصلية |
| `settings.txt` | النسبة، المدة، النمط، التاريخ |
| `references/` | الصور والمراجع |
| `notes.md` | ما نجح وما يجب تغييره |
| `license.txt` | الحقوق والعميل والاستخدام |

## لماذا الانتقال إلى سير عمل Spark Robin؟

مستخدمو Sora يحتاجون إلى استمرار الإنتاج: تحويل النصوص إلى مقاطع، اختبار إعلانات المنتجات، إنشاء فيديوهات عمودية، تحريك الصور وبناء مشاهد متعددة.

يوفر sparkrobinai.io مسارات **Spark Robin text-to-video** و **Spark Robin image-to-video** وسير عمل storyboard للحملات.

## تحويل المطالبات

كانت مطالبة Sora غالبًا فقرة سينمائية واحدة. عند الانتقال، اجعلها تعليمات إنتاج واضحة:

```text
Subject: المنتج أو الشخصية أو العنصر الرئيسي
Scene: المكان والوقت والخلفية
Camera: الزاوية والحركة ونوع اللقطة
Motion: ما الذي يتحرك وكيف
Lighting: اللون والمزاج والتباين
Output: 9:16 أو 16:9 أو إعلان أو social
Avoid: التشوهات، النص المكسور، الشعارات الخاطئة، العناصر الزائدة
```

## FAQ

### هل Sora متوقف رسميًا؟

نعم. تشير OpenAI إلى أن Sora web و app توقفا في **26 أبريل 2026**.

### متى تتوقف Sora API؟

تذكر OpenAI تاريخ **24 سبتمبر 2026**.

### كيف أصدر فيديوهات Sora؟

اذهب إلى `sora.chatgpt.com/sunset`، اضغط **Export**، وانتظر رسالة البريد.

### هل يمكن نقل prompts من Sora مباشرة؟

يمكن إعادة استخدام الفكرة، لكن الأفضل إعادة كتابة المطالبة بشكل منظم: موضوع، كاميرا، حركة، إضاءة، تنسيق وقيود سلبية.

## المصادر

- [OpenAI Help Center: What to know about the Sora discontinuation](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation)
- [Veo on Vertex AI video generation API](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation)
- [Veo 3.1 on Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate-preview)
