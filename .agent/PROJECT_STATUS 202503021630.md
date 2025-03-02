# LINE Bot プロジェクト状態レポート

## プロジェクト概要

このプロジェクトは、LINE Messaging APIを使用して構築されたボットアプリケーションです。ユーザーからのメッセージを受け取り、Google Gemini AIモデルを使用して応答を生成し、LINEプラットフォーム経由でユーザーに返信します。

## 現在の実装状況

### 実装済み機能

- ✅ LINE Webhookハンドラー実装
- ✅ LINE署名検証機能
- ✅ AIレスポンス生成機能（Gemini AI使用）
- ✅ テキストメッセージ応答機能
- ✅ ロギングユーティリティ
- ✅ Vercelへのデプロイ構成

### 使用技術スタック

- **フレームワーク**: Hono
- **ランタイム**: Bun, Node.js
- **AI**: Google Gemini AI (gemini-2.0-pro-exp-02-05)
- **デプロイ**: Vercel
- **パッケージマネージャー**: Bun

## デプロイ状況

アプリケーションはVercelに正常にデプロイされています。

- **本番URL**: https://constructive-line-165saipj2-ramenumaiwhys-projects.vercel.app
- **Webhookエンドポイント**: https://constructive-line-165saipj2-ramenumaiwhys-projects.vercel.app/webhook
- **ヘルスチェックエンドポイント**: https://constructive-line-165saipj2-ramenumaiwhys-projects.vercel.app/health

## デプロイ時の重要ポイント

ESモジュール形式を使用する場合、以下の点に注意が必要です：

1. 相対インポートには `.js` 拡張子を使用する必要があります（TypeScriptでコーディングしていても）
   ```typescript
   // 正しいインポート方法
   import { lineWebhookHandler } from './handlers/line-webhook.js';
   import { generateAIResponse } from '../lib/ai.js';
   ```

2. この変更はデプロイ時に特に重要です。ローカル開発時には問題が発生しない場合でも、Vercelなどの実行環境ではこの形式が必須です。

## 環境変数設定

アプリケーションには以下の環境変数が必要です：

```
# LINE Bot Configuration
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google AI Configuration
GOOGLE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server Configuration
PORT=3000
NODE_ENV=development
```

これらの環境変数はVercelのプロジェクト設定でも設定する必要があります。

## プロジェクト構造

```
constructive-line-bot/
├── src/
│   ├── handlers/
│   │   └── line-webhook.ts       # LINE Webhookハンドラー
│   ├── lib/
│   │   ├── ai.ts                 # AI応答生成機能
│   │   ├── ai.test.ts            # AIテスト
│   │   ├── line.ts               # LINE API連携機能
│   │   └── line.test.ts          # LINEテスト
│   ├── utils/
│   │   └── logger.ts             # ロギングユーティリティ
│   └── index.ts                  # メインアプリケーション
├── package.json                  # 依存関係管理
├── vercel.json                   # Vercel設定
├── build.sh                      # ビルドスクリプト
└── .env                          # 環境変数設定
```

## LINE Botの設定手順

1. LINE Developers Console (https://developers.line.biz/console/) にアクセス
2. プロジェクトのチャネルを選択
3. 「Messaging API設定」タブを開く
4. 「Webhook URL」に以下を設定:
   ```
   https://constructive-line-165saipj2-ramenumaiwhys-projects.vercel.app/webhook
   ```
5. 「Webhookの利用」をオンにする
6. 「検証」ボタンをクリックして接続を確認
7. 「Webhookの再発行」をクリックしてウェブフックを有効化

## 現在のAIモデル設定

現在のシステムプロンプトはダイエットコーチのアシスタントとして設定されています：

```
あなたはダイエットコーチのAIアシスタントです。
以下の特徴を持っています：

- 専門知識：栄養学、運動生理学、行動心理学の知識を持ち、科学的根拠に基づいたアドバイスを提供します
- コミュニケーションスタイル：フレンドリーで励ましながらも、必要に応じて厳しいアドバイスもできます
- 目標：ユーザーの健康的で持続可能なダイエットをサポートします
```

## 今後の拡張可能性

- 会話履歴の保存と参照機能の追加
- リッチメッセージ（画像、ボタン、カルーセルなど）対応
- ユーザーセッション管理
- 定期的なプッシュメッセージ配信機能
- 多言語対応
- アナリティクス機能の実装

## 開発コマンド

- **開発サーバー起動**: `bun run dev`
- **ビルド**: `bun run build`
- **テスト実行**: `bun run test`
- **デプロイ**: `bun run deploy` 