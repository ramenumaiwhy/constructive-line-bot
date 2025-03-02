/**
 * LINE Bot アプリケーション - Vercel Serverless Functions向けエントリーポイント
 */

import { Hono } from 'hono';
import { lineWebhookHandler } from '../src/handlers/line-webhook.js';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

/**
 * アプリケーションインスタンスを作成
 */
const app = new Hono();

/**
 * ルートパスのハンドラー
 */
app.get('/', (c) => {
  return c.text('Constructive LINE Bot is running!');
});

/**
 * LINE Webhookエンドポイント
 */
app.post('/webhook', lineWebhookHandler);

/**
 * ヘルスチェックエンドポイント
 */
app.get('/health', (c) => c.text('OK'));

/**
 * Vercel Serverless Functions向けのエクスポート
 */
export default app; 