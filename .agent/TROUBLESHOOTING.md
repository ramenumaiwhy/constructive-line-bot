# LINE Bot トラブルシューティングガイド

## 現在確認されている問題

1. **返信が返ってこない**: ユーザーがメッセージを送信しても、ボットからの応答がない
2. **リッチメニューがエラーで開かない**: 「一時的なエラーによりリクエストが完了しませんでした」というエラーメッセージが表示される

## 問題1: 返信が返ってこない

### 考えられる原因

1. **Webhook URL設定の問題**
   - LINE Developer ConsoleのWebhook URLが正しく設定されていない
   - Webhook送信が有効になっていない

2. **署名検証の問題**
   - LINE_CHANNEL_SECRETが間違っている
   - 署名検証ロジックに問題がある

3. **エラーハンドリングの問題**
   - エラーが発生しているが、LINEプラットフォームには200 OKを返しているため、エラーが見えない

4. **トークンの問題**
   - LINE_CHANNEL_ACCESS_TOKENが無効または期限切れ
   - トークンの権限設定が不足している

5. **サーバーの問題**
   - Vercelサーバーがタイムアウトしている
   - メモリ制限に達している
   - コールドスタートの問題

6. **AIレスポンス生成の問題**
   - Google Gemini APIが応答しない
   - APIキーの問題
   - レスポンスが長すぎる

### 調査手順

1. **Webhook受信確認**
   ```bash
   # Vercelのログを確認（Vercel管理画面で確認可能）
   # または一時的にローカルでサーバーを起動してngrokでトンネリングし、ログを確認
   ```

2. **環境変数の確認**
   ```bash
   # Vercelの環境変数設定を確認
   # LINE_CHANNEL_SECRET、LINE_CHANNEL_ACCESS_TOKEN、GOOGLE_API_KEYが正しく設定されているか
   ```

3. **LINE Developer Console設定確認**
   - Webhook URLが正しいか確認: `https://constructive-line-165saipj2-ramenumaiwhys-projects.vercel.app/webhook`
   - Webhook送信が有効になっているか確認
   - 「検証」ボタンでWebhookのテストを実行

4. **テスト環境での動作確認**
   ```bash
   # ローカルで実行
   bun run dev
   
   # ngrokでトンネリング
   ngrok http 3000
   
   # LINE Developer Consoleでngrok URLに一時的に変更してテスト
   ```

5. **デバッグログの追加**
   ```typescript
   // src/handlers/line-webhook.ts に詳細なログを追加
   console.log('Request body:', JSON.stringify(body));
   console.log('Signature:', signature);
   console.log('Validation result:', isValid);
   
   // src/lib/line.ts の sendTextMessage 関数にログを追加
   console.log('Sending message:', text);
   console.log('Reply token:', replyToken);
   ```

### 解決策

1. **Webhook URL設定を修正**
   - LINE Developer Consoleで正しいWebhook URLを設定
   - Webhook送信を有効化

2. **環境変数の再設定**
   - Vercel管理画面で環境変数を確認し、必要に応じて再設定
   - 特にLINE_CHANNEL_ACCESS_TOKENとLINE_CHANNEL_SECRETを確認

3. **エラーハンドリングの強化**
   ```typescript
   // より詳細なエラーログを追加
   try {
     // 既存のコード
   } catch (error) {
     console.error("詳細なエラー情報:", {
       message: error.message,
       stack: error.stack,
       name: error.name
     });
     // LINEプラットフォームには200を返す
     return c.text("OK", 200);
   }
   ```

4. **トークンの再発行**
   - LINE Developer Consoleでチャネルアクセストークンを再発行
   - 新しいトークンをVercelの環境変数に設定

5. **サーバー設定の確認**
   - Vercelの実行タイムアウト設定を確認
   - メモリ割り当てを確認

6. **AIレスポンス生成の修正**
   ```typescript
   // タイムアウト設定を追加
   const { text } = await Promise.race([
     generateText({
       model,
       messages: [...],
     }),
     new Promise((_, reject) => 
       setTimeout(() => reject(new Error('AI response timeout')), 5000)
     )
   ]);
   ```

## 問題2: リッチメニューがエラーで開かない

### 考えられる原因

1. **リッチメニュー設定の問題**
   - リッチメニューが正しく設定されていない
   - リッチメニューの画像サイズが要件を満たしていない

2. **リッチメニュー関連APIの問題**
   - リッチメニューの取得に失敗している
   - リッチメニューのAPIレスポンスにエラーがある

3. **権限の問題**
   - ボットアカウントにリッチメニュー操作の権限がない

### 調査手順

1. **LINE Developer Console確認**
   - 「リッチメニュー」設定を確認
   - リッチメニューが正しく作成・設定されているか確認

2. **LINE Official Account Manager確認**
   - リッチメニューの設定を確認

3. **リッチメニューの再設定**
   - 一度リッチメニューを削除して再設定

### 解決策

1. **リッチメニューの再作成**
   - LINE Developer ConsoleまたはLINE Official Account Managerでリッチメニューを再作成
   - 画像サイズが規定に合っているか確認（幅2500px、高さ1686pxまたは843px）

2. **リッチメニューAPIの確認**
   - Messaging APIでリッチメニューを取得するAPIを実行して確認

3. **ボット設定の確認**
   - LINE Official Account Managerでボットの設定を確認
   - 必要な権限が付与されていることを確認

## 実装時の注意点

1. **エラーログの充実**
   - エラー発生時に詳細な情報をログに残す
   - フラグメントではなく完全なエラー情報を記録

2. **異常検知の仕組み**
   - 致命的なエラー発生時に通知する仕組みを導入
   - 定期的なヘルスチェックの実装

3. **フォールバック機能**
   - AI応答生成に失敗した場合のデフォルトメッセージを用意
   - タイムアウト時の対応策を実装

4. **ユーザーフレンドリーなエラーメッセージ**
   - エラー発生時にユーザーに分かりやすい説明を提供
   - 再試行の案内を含める 