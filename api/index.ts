/**
 * LINE Bot アプリケーション - Vercel Serverless Functions向けエントリーポイント
 */

import { Hono } from 'hono';
import { lineWebhookHandler } from '../src/handlers/line-webhook.js';
import 'dotenv/config';

/**
 * アプリケーションインスタンスを作成
 */
const app = new Hono();

/**
 * ルートパスのハンドラー
 */
app.get('/', (c) => {
  return c.text('LINE Bot is running!');
});

/**
 * LINE Webhookエンドポイント
 */
app.post('/webhook', lineWebhookHandler);

/**
 * ヘルスチェックエンドポイント
 */
app.get('/health', (c) => {
  return c.text('OK');
});

/**
 * Vercel Serverless Functions向けのエクスポート
 */
export default app; 