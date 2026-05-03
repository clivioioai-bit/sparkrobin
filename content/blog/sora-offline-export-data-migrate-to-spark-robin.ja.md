---
title: "Sora は正式にオフラインへ：データを書き出して Spark Robin へ移行する方法"
description: "Sora 終了後の実務ガイド。重要な日付、Sora 動画のエクスポート、プロンプト保存、sparkrobin.app ワークフローへの移行方法を解説します。"
date: "2026-04-30"
author: "Spark Robin チーム"
tags: ["OpenAI Sora discontinuation guide", "how to export Sora videos", "Sora alternatives 2026", "transfer Sora prompts to Spark Robin", "ai-video"]
featured: true
---

## 要点

- OpenAI の Sora Web 版とアプリ体験は **2026 年 4 月 26 日**に終了しました。
- OpenAI は **Sora API を 2026 年 9 月 24 日**に終了すると案内しています。
- Sora で作成した動画がある場合は、できるだけ早くエクスポートしてください。終了後、最終エクスポート期間が終わると関連データは永久削除される可能性があります。
- MP4 だけでなく、prompt、参考画像、アスペクト比、生成設定、クライアントメモも保存してください。
- sparkrobin.app は、テキスト動画生成、画像から動画、多シーン構成、広告向け出力の移行先として使えます。

## Sora 終了タイムライン

| 日付 | 変更点 | やるべきこと |
|---|---|---|
| **2026 年 4 月 26 日** | Sora Web 版とアプリが終了 | 生成済みアセットと制作メモを保存 |
| **2026 年 9 月 24 日** | Sora API が終了 | 自動生成、バッチ処理、API 連携を別ワークフローへ移行 |

OpenAI Help Center の案内では、`sora.chatgpt.com/sunset` にアクセスして **Export** をクリックすると、Sora コンテンツのエクスポートを開始できます。準備ができるとアカウントのメールアドレスに通知が届きます。

## Sora データを書き出す手順

### 1. 公式エクスポートを開始する

`https://sora.chatgpt.com/sunset`

上記にアクセスし、**Export** を選択します。動画数が多い場合、完了まで時間がかかることがあります。

### 2. 重要な動画を先に手動保存する

インターフェースにまだアクセスできる場合は、以下を優先して保存します。

- クライアント承認済みの動画
- 広告や LP で使っている動画
- キャラクター検証
- 商品カット
- 多くの試行錯誤を経た prompt 実験
- ライセンスや契約価値がある素材

### 3. MP4 だけでなく制作文脈も保存する

各プロジェクトに次のようなフォルダを作ると移行しやすくなります。

| ファイル | 目的 |
|---|---|
| `final.mp4` | 生成済み動画 |
| `prompt.txt` | 元の Sora prompt |
| `settings.txt` | 比率、長さ、スタイル、生成日 |
| `references/` | 参考画像や商品写真 |
| `notes.md` | 成功点、失敗点、再生成時の注意 |
| `license.txt` | 使用権、公開範囲、クライアント条件 |

## Spark Robin ワークフローへ移行する理由

Sora ユーザーが必要としているのは、単なる代替モデルではなく、制作を止めないためのワークフローです。

- 脚本から短尺動画案を作る
- 商品広告の方向性をテストする
- 縦型 SNS 動画を作る
- 静止画を動画化する
- 複数ショットの広告案を組む
- prompt を素早く改善する

sparkrobin.app は、Spark Robin text-to-video、Spark Robin image-to-video、多シーン制作をまとめて扱えるため、Sora からの移行先として実用的です。

## Prompt 変換ガイド

Sora prompt は映画的な 1 段落で書かれることが多いですが、移行時は制作指示として分解すると安定します。

```text
Subject: 認識されるべき主要な人物・商品・物体
Scene: 場所、時間帯、背景
Camera: アングル、ショットサイズ、動き
Motion: 何がどのように動くか
Lighting: 色、雰囲気、光源
Output: 9:16、16:9、広告、SNS など
Avoid: 歪み、読めない文字、余計な物体、ロゴ崩れ
```

この構造にすると、古い Sora prompt を sparkrobin.app、Runway、Kling などで比較しやすくなります。

## FAQ

### Sora は正式に終了しましたか？

はい。OpenAI は Sora Web 版とアプリ体験が **2026 年 4 月 26 日**に終了したと案内しています。

### Sora API はいつ終了しますか？

OpenAI は **2026 年 9 月 24 日**に Sora API を終了すると案内しています。

### Sora 動画はどうやってエクスポートしますか？

`sora.chatgpt.com/sunset` にアクセスし、**Export** をクリックします。完了後、メール通知が届きます。

### Sora prompt はそのまま使えますか？

アイデアは再利用できますが、主体、カメラ、動き、照明、比率、避けたい要素に分けて書き直すのがおすすめです。

## 出典

- [OpenAI Help Center: What to know about the Sora discontinuation](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation)
- [Veo on Vertex AI video generation API](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation)
- [Veo 3.1 on Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate-preview)
