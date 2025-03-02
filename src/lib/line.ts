import type { ClientConfig, TextMessage, WebhookEvent } from "@line/bot-sdk";
import { messagingApi } from "@line/bot-sdk";
import crypto from "crypto";

/**
 * LINE Messaging APIのクライアント設定
 * @remarks
 * 環境変数から必要な認証情報を取得します
 * - LINE_CHANNEL_ACCESS_TOKEN: チャネルアクセストークン
 * - LINE_CHANNEL_SECRET: チャネルシークレット
 */
const clientConfig: ClientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

/**
 * LINE Messaging APIクライアントのインスタンス
 * @remarks
 * このクライアントを使用してLINEプラットフォームとの通信を行います
 */
export const lineClient = new messagingApi.MessagingApiClient(clientConfig);

/**
 * テキストメッセージを送信する関数
 * @param replyToken - LINEプラットフォームから受け取った返信用トークン
 * @param text - 送信するテキストメッセージの内容
 * @returns メッセージ送信のレスポンス
 * @throws {Error} メッセージ送信に失敗した場合
 * @example
 * ```ts
 * await sendTextMessage("reply-token-123", "こんにちは！");
 * ```
 */
export const sendTextMessage = async (
  replyToken: string,
  text: string
): Promise<messagingApi.ReplyMessageResponse> => {
  console.log(`Sending message to LINE. Token: ${replyToken}, Text length: ${text.length}`);
  
  // テキストが長すぎる場合は切り詰める（LINEの制限は5000文字）
  const MAX_TEXT_LENGTH = 4000; // 余裕を持って4000文字に
  const finalText = text.length > MAX_TEXT_LENGTH
    ? text.substring(0, MAX_TEXT_LENGTH) + "\n...(続きがあります)"
    : text;
  
  const message: TextMessage = {
    type: "text",
    text: finalText,
  };

  try {
    // タイムアウト設定付きでAPIを呼び出す
    const response = await Promise.race([
      lineClient.replyMessage({
        replyToken,
        messages: [message],
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("LINE API timeout")), 10000)
      )
    ]);
    
    console.log("Message sent successfully to LINE");
    return response as messagingApi.ReplyMessageResponse;
  } catch (error) {
    console.error("Failed to send message to LINE:", {
      error: error,
      replyToken: replyToken,
      textLength: finalText.length
    });
    throw error;
  }
};

/**
 * Webhookリクエストの署名を検証する関数
 * @param body - リクエストボディの文字列
 * @param signature - x-line-signatureヘッダーの値
 * @returns 署名が有効な場合はtrue、それ以外はfalse
 * @remarks
 * LINE Messaging APIからのWebhookリクエストが正当なものであることを
 * チャネルシークレットを使用して検証します
 * @example
 * ```ts
 * const isValid = validateSignature(
 *   JSON.stringify(requestBody),
 *   request.headers["x-line-signature"]
 * );
 * ```
 */
export const validateSignature = (
  body: string,
  signature: string | undefined
): boolean => {
  if (!signature) {
    return false;
  }
  const channelSecret = process.env.LINE_CHANNEL_SECRET!;
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
};

/**
 * LINE Messaging APIのWebhookイベント型
 * @remarks
 * Webhookで受信可能な全てのイベントタイプを含む型定義
 */
export type { WebhookEvent };
