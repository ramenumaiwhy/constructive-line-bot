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
} from "../lib/line.js";
import { generateAIResponse } from "../lib/ai.js";

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