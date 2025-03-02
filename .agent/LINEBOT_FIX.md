# LINE Bot 問題修正実装ガイド

## 優先度の高い修正

### 1. デバッグログの強化

**目的**: エラーの原因を特定するために詳細なログを残す

#### src/handlers/line-webhook.ts の修正

```typescript
export async function lineWebhookHandler(c: Context): Promise<Response> {
  console.log("=== Webhook Request Start ===");
  
  // リクエストボディをJSON形式で取得
  const body = await c.req.json();
  console.log("Request Body:", JSON.stringify(body, null, 2));
  
  // リクエストヘッダーからLINE署名を取得
  const signature = c.req.header("x-line-signature");
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
          } catch (innerError) {
            console.error("Error processing message:", {
              error: innerError,
              message: innerError.message,
              stack: innerError.stack
            });
            
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
  } catch (error) {
    console.error("Webhook processing error:", {
      error: error,
      message: error.message,
      stack: error.stack
    });
    // エラーがあっても200を返す（LINEプラットフォームの要件）
    console.log("=== Webhook Request End with Error ===");
    return c.text("OK", 200);
  }
}
```

### 2. LINE API通信の安定化

**目的**: LINE APIとの通信を安定させ、タイムアウトを防ぐ

#### src/lib/line.ts の修正

```typescript
/**
 * テキストメッセージを送信する関数
 * @param replyToken - LINEプラットフォームから受け取った返信用トークン
 * @param text - 送信するテキストメッセージの内容
 * @returns メッセージ送信のレスポンス
 * @throws {Error} メッセージ送信に失敗した場合
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
        setTimeout(() => reject(new Error('LINE API timeout')), 10000)
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
```

### 3. AI応答生成の安定化

**目的**: AI応答生成のタイムアウトや障害に対応する

#### src/lib/ai.ts の修正

```typescript
/**
 * AI応答を生成する関数
 * @param userMessage - ユーザーからのメッセージ
 * @param chatHistory - これまでの会話履歴（オプション）
 * @returns 生成されたテキスト応答
 */
export async function generateAIResponse(
  userMessage: string,
  chatHistory: Message[] = []
): Promise<string> {
  console.log("Generating AI response for:", userMessage);
  
  try {
    // タイムアウト設定付きでAI応答を生成
    const result = await Promise.race([
      generateText({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...chatHistory,
          { role: "user", content: userMessage },
        ],
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('AI response generation timeout')), 15000)
      )
    ]);
    
    console.log("AI response generated successfully");
    return (result as any).text;
  } catch (error) {
    console.error("AI response generation error:", {
      error: error,
      message: error.message,
      stack: error.stack
    });
    
    // エラー種別に応じたフォールバックメッセージ
    if (error.message?.includes('timeout')) {
      return "応答生成に時間がかかっています。もう少し簡潔な質問をいただくか、後ほどお試しください。";
    }
    
    return "申し訳ありません。現在応答を生成できません。しばらく経ってからもう一度お試しください。";
  }
}
```

### 4. エラー通知機能の追加

**目的**: 重大なエラーが発生した場合に開発者に通知する

#### src/utils/notification.ts の新規作成

```typescript
/**
 * エラー通知ユーティリティ
 * 
 * エラーが発生した場合に開発者に通知する機能を提供します
 */

/**
 * エラーを通知する関数
 * 
 * @param context - エラーが発生したコンテキスト（モジュール名など）
 * @param error - 発生したエラーオブジェクト
 * @param additionalInfo - 追加情報（オプション）
 */
export async function notifyError(
  context: string,
  error: Error,
  additionalInfo: Record<string, any> = {}
): Promise<void> {
  // エラー情報をフォーマット
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    errorMessage: error.message,
    errorName: error.name,
    errorStack: error.stack,
    ...additionalInfo
  };
  
  console.error("CRITICAL ERROR:", JSON.stringify(errorInfo, null, 2));
  
  // TODO: 将来的には実際の通知機能を実装
  // 例: Slack通知、メール送信、エラー監視サービスへの通知など
  
  // この関数は常に成功する（通知の失敗でアプリを止めない）
  return Promise.resolve();
}
```

## 実装手順

1. 上記の修正をそれぞれのファイルに適用する
2. ローカル環境でテストを行う
3. 変更をバージョン管理システムにコミットする
4. Vercelにデプロイする
5. LINE Developer Consoleで設定を確認・修正する

## リッチメニュー問題の対応

リッチメニュー機能は二次的な優先度ですが、以下の手順で対応することを推奨します：

1. LINE Official Account Manager (https://manager.line.biz/) にアクセス
2. 問題のあるボットアカウントを選択
3. 「リッチメニュー」設定を確認
4. 既存のリッチメニューを削除
5. 正しいサイズ（幅2500px、高さ1686pxまたは843px）の画像で新しいリッチメニューを作成
6. 設定を保存して公開

リッチメニューAPIを使用している場合は、コードの確認も必要です。