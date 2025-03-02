#!/bin/bash

# LINEボット修正適用スクリプト
# このスクリプトは.agent/LINEBOT_FIX.mdに記載された修正を適用します

echo "===== LINEボット修正適用スクリプト ====="
echo "開始時刻: $(date)"
echo

# 作業ディレクトリの確認
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"
echo "プロジェクトルートディレクトリ: $PROJECT_ROOT"
echo

# バックアップディレクトリの作成
BACKUP_DIR="$PROJECT_ROOT/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "バックアップディレクトリを作成しました: $BACKUP_DIR"

# 1. src/handlers/line-webhook.tsの修正
echo "1. Webhook処理の強化 (src/handlers/line-webhook.ts)"
if [ -f "src/handlers/line-webhook.ts" ]; then
  cp "src/handlers/line-webhook.ts" "$BACKUP_DIR/"
  cat > "src/handlers/line-webhook.ts" << 'EOF'
import { Context } from "hono";
import { validateSignature, WebhookEvent } from "../lib/line.js";
import { processMessage } from "../lib/ai.js";
import { sendTextMessage } from "../lib/line.js";

/**
 * LINE Webhookハンドラ
 * LINEプラットフォームからのWebhookリクエストを処理する
 */
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
EOF
  echo "  ✓ 修正完了"
else
  echo "  ✗ ファイルが見つかりません"
fi
echo

# 2. src/lib/line.tsの修正
echo "2. LINE API通信の安定化 (src/lib/line.ts)"
if [ -f "src/lib/line.ts" ]; then
  cp "src/lib/line.ts" "$BACKUP_DIR/"
  
  # 既存ファイルを読み込んで修正
  TEMP_FILE=$(mktemp)
  cat "src/lib/line.ts" > "$TEMP_FILE"
  
  # sendTextMessage関数を修正
  sed -i '' '/export const sendTextMessage/,/};/c\
/**\
 * テキストメッセージを送信する関数\
 * @param replyToken - LINEプラットフォームから受け取った返信用トークン\
 * @param text - 送信するテキストメッセージの内容\
 * @returns メッセージ送信のレスポンス\
 * @throws {Error} メッセージ送信に失敗した場合\
 */\
export const sendTextMessage = async (\
  replyToken: string,\
  text: string\
): Promise<messagingApi.ReplyMessageResponse> => {\
  console.log(`Sending message to LINE. Token: ${replyToken}, Text length: ${text.length}`);\
  \
  // テキストが長すぎる場合は切り詰める（LINEの制限は5000文字）\
  const MAX_TEXT_LENGTH = 4000; // 余裕を持って4000文字に\
  const finalText = text.length > MAX_TEXT_LENGTH\
    ? text.substring(0, MAX_TEXT_LENGTH) + "\\n...(続きがあります)"\
    : text;\
  \
  const message: TextMessage = {\
    type: "text",\
    text: finalText,\
  };\
\
  try {\
    // タイムアウト設定付きでAPIを呼び出す\
    const response = await Promise.race([\
      lineClient.replyMessage({\
        replyToken,\
        messages: [message],\
      }),\
      new Promise((_, reject) => \
        setTimeout(() => reject(new Error("LINE API timeout")), 10000)\
      )\
    ]);\
    \
    console.log("Message sent successfully to LINE");\
    return response as messagingApi.ReplyMessageResponse;\
  } catch (error) {\
    console.error("Failed to send message to LINE:", {\
      error: error,\
      replyToken: replyToken,\
      textLength: finalText.length\
    });\
    throw error;\
  }\
};' "$TEMP_FILE"

  cat "$TEMP_FILE" > "src/lib/line.ts"
  rm "$TEMP_FILE"
  
  echo "  ✓ 修正完了"
else
  echo "  ✗ ファイルが見つかりません"
fi
echo

# 3. src/lib/ai.tsの修正
echo "3. AI応答生成の安定化 (src/lib/ai.ts)"
if [ -f "src/lib/ai.ts" ]; then
  cp "src/lib/ai.ts" "$BACKUP_DIR/"
  
  # このファイルは関数名などが異なる可能性があるため、別途手動で対応する必要あり
  echo "  ℹ AI応答生成関連のファイルは手動での確認が必要です"
  echo "  ℹ .agent/LINEBOT_FIX.md の内容を参考に修正してください"
else
  echo "  ✗ ファイルが見つかりません"
fi
echo

# 4. エラー通知機能の追加
echo "4. エラー通知機能の追加 (src/utils/notification.ts)"
mkdir -p "src/utils"
cat > "src/utils/notification.ts" << 'EOF'
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
EOF
echo "  ✓ 修正完了"
echo

# README.mdの更新
echo "5. README.mdの更新"
if [ -f "README.md" ]; then
  cp "README.md" "$BACKUP_DIR/"
  
  # READMEにトラブルシューティングセクションを追加
  cat >> "README.md" << 'EOF'

## トラブルシューティング

LINEボットの動作に問題がある場合は、以下のドキュメントを参照してください：

- [トラブルシューティングガイド](.agent/TROUBLESHOOTING.md) - 一般的な問題と解決策
- [修正実装ガイド](.agent/LINEBOT_FIX.md) - 修正のための実装詳細
- [プロジェクト計画書](.agent/PROJECT_PLAN.md) - 今後の計画と実装予定

問題が解決しない場合は、詳細なログを添えて問題を報告してください。
EOF
  
  echo "  ✓ 修正完了"
else
  echo "  ✗ ファイルが見つかりません"
fi
echo

# 完了メッセージ
echo "===== 修正適用完了 ====="
echo "修正前のファイルは以下のディレクトリにバックアップされています："
echo "$BACKUP_DIR"
echo
echo "次のステップ："
echo "1. 修正内容を確認してください"
echo "2. ローカル環境でテストを行ってください: bun dev"
echo "3. 問題がなければ変更をコミットしてください: git add . && git commit -m 'Fix LINE bot issues'"
echo "4. 変更をデプロイしてください: bun run deploy"
echo
echo "詳細なドキュメントは .agent ディレクトリを参照してください"
echo "完了時刻: $(date)"