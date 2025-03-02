# LINE Bot Webhook実装手順

このドキュメントでは、Hono、Bun、および既存のライブラリを使用してLINE Bot用のWebhookを実装する手順を説明します。

## 1. 実装概要

以下の機能を実装します：

- LINE Messaging APIからのWebhookリクエストを受け取るエンドポイント
- Webhookリクエストの署名検証
- 受信したメッセージに応じた応答処理
- Gemini AIを使用した応答生成

## 2. ファイル構成

```
src/
├── handlers/
│   └── line-webhook.ts  # LINE Webhook専用ハンドラー
├── lib/
│   ├── ai.ts            # AI関連の機能（既存）
│   └── line.ts          # LINE関連の機能（既存）
├── utils/
│   └── logger.ts        # ロギング用ユーティリティ
└── index.ts             # メインアプリケーション
```

## 3. 実装手順

### 3.1 Webhookハンドラーの作成

以下のステップで`src/handlers/line-webhook.ts`ファイルを作成します：

```typescript
/**
 * LINE Webhook ハンドラー
 * 
 * LINE Messaging APIからのWebhookリクエストを処理します
 */
import { Context } from "hono";
import { 
  validateSignature, 
  sendTextMessage, 
  WebhookEvent 
} from "../lib/line";
import { generateAIResponse } from "../lib/ai";

/**
 * LINEプラットフォームからのメッセージを処理する関数
 * @param message - ユーザーからのメッセージテキスト
 * @returns AI生成の応答テキスト
 */
async function processMessage(message: string): Promise<string> {
  return await generateAIResponse(message);
}

/**
 * LINE Webhookハンドラー
 * 
 * @param c - Honoコンテキスト
 * @returns レスポンス
 */
export async function lineWebhookHandler(c: Context): Promise<Response> {
  // リクエストボディをJSON形式で取得
  const body = await c.req.json();
  
  // リクエストヘッダーからLINE署名を取得
  const signature = c.req.header("x-line-signature");
  
  // 署名の検証
  const isValid = validateSignature(JSON.stringify(body), signature);
  
  if (!isValid) {
    console.error("Invalid signature");
    return c.text("Invalid signature", 401);
  }
  
  try {
    // Webhookイベントの処理
    const events: WebhookEvent[] = body.events;
    
    // イベントを非同期で処理
    await Promise.all(
      events.map(async (event) => {
        // メッセージイベントのみを処理
        if (event.type === "message" && event.message.type === "text") {
          const userMessage = event.message.text;
          console.log(`Received message: ${userMessage}`);
          
          // メッセージを処理して応答を生成
          const response = await processMessage(userMessage);
          
          // 応答メッセージを送信
          await sendTextMessage(event.replyToken, response);
        }
      })
    );
    
    // LINEプラットフォームには200 OKを返す
    return c.text("OK", 200);
  } catch (error) {
    console.error("Webhook processing error:", error);
    // エラーがあっても200を返す（LINEプラットフォームの要件）
    return c.text("OK", 200);
  }
}
```

### 3.2 ロギングユーティリティの作成（オプション）

より良いデバッグとモニタリングのために、`src/utils/logger.ts`を作成します：

```typescript
/**
 * ロギングユーティリティ
 */

/**
 * ログレベルの定義
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

/**
 * アプリケーションロガー
 */
export class Logger {
  /**
   * ロギング情報を出力
   * @param level - ログレベル
   * @param message - ログメッセージ
   * @param data - 追加データ（オプション）
   */
  static log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data ? { data } : {}),
    };
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(JSON.stringify(logEntry));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logEntry));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logEntry));
        break;
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logEntry));
        break;
    }
  }
  
  // ショートカットメソッド
  static debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  static info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  static warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  static error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }
}
```

### 3.3 メインアプリケーションの更新

既存の`src/index.ts`ファイルを更新して、LINE Webhookハンドラーを追加します：

```typescript
/**
 * LINE Bot アプリケーション
 * 
 * Honoを使用したLINE Botアプリケーションのメインエントリーポイント
 * 
 * @module index
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { lineWebhookHandler } from './handlers/line-webhook';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// アプリケーションインスタンスを作成
const app = new Hono();

// ルートパスのハンドラー
app.get('/', (c) => {
  return c.text('Constructive LINE Bot is running!');
});

// LINE Webhookエンドポイント
app.post('/webhook', lineWebhookHandler);

// ヘルスチェックエンドポイント
app.get('/health', (c) => c.text('OK'));

// サーバーを起動
const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

// サーバー起動
serve({
  fetch: app.fetch,
  port: Number(port),
});
```

## 4. 必要なディレクトリの作成

以下のコマンドを実行して、必要なディレクトリ構造を作成します：

```bash
mkdir -p src/handlers src/utils
```

## 5. LINE Bot設定

LINE Developers Consoleで以下の設定を行う必要があります：

1. LINE Developers Console (https://developers.line.biz/console/) にログイン
2. プロバイダーを選択または作成
3. チャネルを作成（Messaging API）
4. 以下の情報を取得し、`.env`ファイルに設定
   - Channel Secret
   - Channel Access Token

```
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
```

5. Webhook URLを設定
   - 本番環境: `https://your-domain.com/webhook`
   - 開発環境: 
     - ngrokなどのトンネリングサービスを使用: `https://xxxx-xxx-xxx.ngrok.io/webhook`
     - または Vercel の Preview URL: `https://your-preview-url.vercel.app/webhook`

6. Webhook送信を有効化

## 6. ローカルでのテスト

ローカル環境でテストするには、以下の手順を実行します：

1. アプリケーションを起動
```bash
bun dev
```

2. ngrokなどを使ってローカルサーバーを公開
```bash
ngrok http 3000
```

3. 表示されたURLを LINE Developers Console の Webhook URL に設定

## 7. デプロイ

Vercelにデプロイするには：

```bash
bun run deploy
```

デプロイが完了したら、生成されたURLのパスに`/webhook`を追加して、LINE Developers ConsoleのWebhook URLに設定します。

## 8. 注意点

- Webhookのリクエスト処理は15秒以内に完了する必要があります
- エラーが発生しても、LINEプラットフォームには常に200 OKを返すことが推奨されています
- 環境変数の管理には注意し、APIキーなど機密情報を公開しないようにしてください
- AIレスポンスの生成に時間がかかる場合は、非同期処理や別のキューイングシステムの利用を検討してください

## 9. 応用例

- ユーザーIDごとに会話履歴を保存し、コンテキストを維持する
- 複数のAIモデルを切り替えて使用する
- 特定のキーワードに基づいて異なる処理を行う
- リッチメニューや画像、ボタンなどのリッチコンテンツを活用する 