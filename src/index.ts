/**
 * LINE Bot アプリケーション
 * 
 * Honoを使用したLINE Botアプリケーションのメインエントリーポイント
 * 
 * @module index
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { lineWebhookHandler } from './handlers/line-webhook.js';
import { WebhookContext } from './handlers/line-webhook.js';
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
app.post('/webhook', async (c) => {
  const context: WebhookContext = {
    req: c.req.raw,
    header: (name: string) => c.req.header(name),
    json: () => c.req.json(),
    text: (text: string, status?: number) => new Response(text, { status: status || 200 })
  };
  return await lineWebhookHandler(context);
});

/**
 * ヘルスチェックエンドポイント
 * 
 * アプリケーションの正常稼働を確認するためのエンドポイント
 * 
 * @param c - Honoコンテキスト
 * @returns 「OK」というテキストレスポンス
 */
app.get('/health', (c) => c.text('OK'));

/**
 * サーバーを起動
 * 環境変数PORTの値またはデフォルト値3000を使用
 */
const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

// Vercel Serverless Functions向けのエクスポート
export default {
  fetch: app.fetch
};

// ローカル開発環境での実行用
// Bunやその他の環境変数を使って判断する
if (process.env.NODE_ENV !== 'production') {
  /**
   * サーバー起動
   * Honoアプリケーションをnode-serverを使って起動
   */
  serve({
    fetch: app.fetch,
    port: Number(port),
  });
} 