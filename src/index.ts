/**
 * シンプルなテスト用Honoアプリケーション
 * 
 * 開発環境でHonoが正常に動作することを確認するための
 * 最小限の構成を提供します。
 * 
 * @module index
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';

/**
 * アプリケーションインスタンスを作成
 */
const app = new Hono();

/**
 * ルートパスのハンドラー
 */
app.get('/', (c) => {
  return c.text('Hello, Hono!');
});

/**
 * JSONを返すテストエンドポイント
 */
app.get('/test', (c) => {
  return c.json({
    status: 'success',
    message: 'Hono is working!',
    timestamp: new Date().toISOString()
  });
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

/**
 * サーバー起動
 * Honoアプリケーションをnode-serverを使って起動
 */
serve({
  fetch: app.fetch,
  port: Number(port),
}); 