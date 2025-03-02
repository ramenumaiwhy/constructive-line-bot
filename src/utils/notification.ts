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
