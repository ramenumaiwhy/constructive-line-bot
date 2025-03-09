import { WebhookEvent } from "../lib/line.js";
import { processMessage } from "../lib/ai.js";
import { sendTextMessage } from "../lib/line.js";
import { validateSignature } from "../lib/line.js";

export interface WebhookContext {
  req: Request;
  header: (name: string) => string | undefined;
  json: () => Promise<any>;
  text: (text: string, status?: number) => Response;
}

/**
 * LINE Webhookハンドラ
 * LINEプラットフォームからのWebhookリクエストを処理する
 */
export async function lineWebhookHandler(c: WebhookContext): Promise<Response> {
  console.log("=== Webhook Request Start ===");
  
  // リクエストボディをJSON形式で取得
  const body = await c.json();
  console.log("Request Body:", JSON.stringify(body, null, 2));
  
  // リクエストヘッダーからLINE署名を取得
  const signature = c.header("x-line-signature");
  console.log("X-Line-Signature:", signature);
  
  // 署名の検証
  const isValid = validateSignature(JSON.stringify(body), signature);
  console.log("Signature Validation:", isValid);
  
  if (!isValid) {
    console.error("Invalid signature");
    return c.text("Invalid signature", 401);
  }
  
  try {
    // Webhookイベントの処理
    const events: WebhookEvent[] = body.events;
    console.log("Number of Events:", events.length);
    
    // イベントを非同期で処理
    await Promise.all(
      events.map(async (event, index) => {
        console.log(`Processing Event ${index + 1}:`, JSON.stringify(event, null, 2));
        
        // メッセージイベントのみを処理
        if (event.type === "message" && event.message.type === "text") {
          const userMessage = event.message.text;
          console.log(`User ${event.source.userId} Message:`, userMessage);
          
          try {
            // メッセージを処理して応答を生成
            console.log("Generating AI Response...");
            const response = await processMessage(userMessage);
            console.log("AI Response Generated:", response);
            
            // 応答メッセージを送信
            console.log("Sending Response with Token:", event.replyToken);
            await sendTextMessage(event.replyToken, response);
            console.log("Response Sent Successfully");
          } catch (innerError: unknown) {
            if (innerError instanceof Error) {
              console.error("Error processing message:", {
                error: innerError,
                message: innerError.message,
                stack: innerError.stack
              });
            } else {
              console.error("Unknown error:", innerError);
            }
            
            // エラー時のフォールバックメッセージ
            try {
              await sendTextMessage(
                event.replyToken, 
                "申し訳ありません、処理中にエラーが発生しました。しばらくしてからもう一度お試しください。"
              );
              console.log("Fallback Message Sent");
            } catch (fallbackError) {
              console.error("Failed to send fallback message:", fallbackError);
            }
          }
        } else {
          console.log(`Skipping non-text message event: ${event.type}`);
        }
      })
    );
    
    console.log("=== Webhook Request End ===");
    // LINEプラットフォームには200 OKを返す
    return c.text("OK", 200);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Webhook processing error:", {
        error: error,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error("Unknown webhook error:", error);
    }
    // エラーがあっても200を返す（LINEプラットフォームの要件）
    console.log("=== Webhook Request End with Error ===");
    return c.text("OK", 200);
  }
}
