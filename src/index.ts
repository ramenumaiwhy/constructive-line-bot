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

/**
 * サーバー起動
 * Honoアプリケーションをnode-serverを使って起動
 */
serve({
  fetch: app.fetch,
  port: Number(port),
}); 