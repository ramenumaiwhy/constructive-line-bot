# 実装手順書

## 1. 開発環境のセットアップ

### 1.1 必要なツールのインストール
```bash
# Node.jsのインストール（v20以上推奨）
# pnpmのインストール
npm install -g pnpm@8.15.3

# プロジェクトの初期化
pnpm init
```

### 1.2 依存パッケージのインストール
```bash
# 主要な依存パッケージ
pnpm add hono @line/bot-sdk @ai-sdk/google ai

# 開発用依存パッケージ
pnpm add -D typescript @types/node biome vitest
```

### 1.3 TypeScriptの設定
```bash
# TypeScriptの初期化
pnpm tsc --init
```

### 1.4 開発方針
- 開発初期段階では環境分離は行わない
- 各フェーズごとに細かく動作確認を行う
- 実装の各段階で動作確認を行い、問題がないことを確認してから次のフェーズに進む

### 1.4.1 Honoサーバーの動作確認
サーバーフレームワークが正常に動作していることを確認するため、実装初期段階でダミーエンドポイントを作成して検証を行う：

```typescript
// src/index.ts
app.get('/test', (c) => {
  return c.json({
    status: 'success',
    message: 'Hono is working!',
    timestamp: new Date().toISOString()
  });
});
```

以下のコマンドでサーバーを起動し、エンドポイントにアクセスして動作確認：

```bash
# tsxを使用してTypeScriptを直接実行
pnpm add -D tsx

# package.jsonにスクリプトを追加
# "start:dev": "tsx src/index.ts"

# サーバー起動
pnpm run start:dev

# 別ターミナルで動作確認
curl http://localhost:3000/test
```

期待される出力：
```json
{"status":"success","message":"Hono is working!","timestamp":"2024-03-02T..."}
```

## 2. プロジェクト構造の設定

### 2.1 ディレクトリ構造
```
.
├── src/
│   ├── index.ts            # メインアプリケーション（実装済み）
│   ├── handlers/           # メッセージハンドラー
│   │   └── line-webhook.ts # LINE Webhookハンドラー（実装済み）
│   ├── lib/                # 外部サービス連携
│   │   ├── ai.ts           # AI関連機能（実装済み）
│   │   └── line.ts         # LINE関連機能（実装済み）
│   └── utils/              # ユーティリティ関数
│       └── logger.ts       # ロギングユーティリティ（実装済み）
├── package.json
├── tsconfig.json
├── vercel.json            # Vercel設定（実装済み）
└── PROJECT_STATUS.md      # プロジェクト状態ドキュメント（実装済み）
```

## 3. 実装フェーズ

### 3.1 基本設定（Phase 1）
- [x] LINE Messaging APIの設定
- [x] Honoサーバーの基本設定
- [x] Webhookエンドポイントの実装
- [x] 環境変数の設定

### 3.2 コア機能実装（Phase 2）
- [x] メッセージハンドラーの実装
- [x] Google Gemini APIの統合
- [x] システムプロンプトの実装
- [ ] コンテキスト管理の実装

### 3.3 対話機能の実装（Phase 3）
- [ ] 会話履歴の保存機能
- [ ] コンテキスト情報の記録
- [ ] 自動保存機能（5分間隔）
- [ ] キーポイント抽出機能

### 3.4 構造化機能の実装（Phase 4）
- [ ] アイデアの構造化処理
- [ ] Markdownエクスポート機能
- [ ] タグ付け機能
- [ ] カテゴリ分類機能

## 4. テスト実装

### 4.1 ユニットテスト
- [ ] メッセージハンドラーのテスト
- [ ] サービスロジックのテスト
- [ ] ユーティリティ関数のテスト

### 4.2 統合テスト
- [ ] LINE Messaging API連携テスト
- [ ] Google Gemini API連携テスト
- [ ] エンドツーエンドテスト

## 5. デプロイメント準備

### 5.1 本番環境設定
- [x] 環境変数の設定
- [ ] セキュリティ設定
- [ ] パフォーマンス最適化

### 5.2 監視設定
- [ ] ログ収集の設定
- [ ] エラー監視の設定
- [ ] パフォーマンスモニタリング

## 6. コード例

### 6.1 基本的なサーバー設定
```typescript
import { Hono } from 'hono';
import { Client } from '@line/bot-sdk';

const app = new Hono();

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
};

const lineClient = new Client(lineConfig);

export default app;
```

### 6.2 Webhookハンドラー
```typescript
app.post('/webhook', async (c) => {
  const signature = c.req.header('x-line-signature');
  const body = await c.req.json();

  // 署名検証
  // メッセージ処理
  // レスポンス返却

  return c.json({ status: 'ok' });
});
```

### 6.3 AI対話処理
```typescript
import { GoogleGenerativeAI } from '@ai-sdk/google';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function handleDialogue(message: string, context: any) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  // システムプロンプトとコンテキストの設定
  // 応答生成
  // 結果の処理

  return response;
}
```

## 7. 注意事項

### 7.1 セキュリティ
- 環境変数による機密情報の管理
- 適切な認証・認可の実装
- 入力値のバリデーション

### 7.2 パフォーマンス
- レスポンス時間の最適化
- メモリ使用量の管理
- キャッシュ戦略の検討

### 7.3 エラーハンドリング
- 適切なエラーログの記録
- ユーザーフレンドリーなエラーメッセージ
- リトライ機構の実装

## 8. 今後の拡張性

### 8.1 NICE_TO_HAVE機能の実装準備
- 分析・可視化機能の設計
- コラボレーション機能の設計
- AI強化機能の設計

### 8.2 スケーラビリティ
- 水平スケーリングの考慮
- データベース設計の最適化
- キャッシュ戦略の改善

## 9. 現在の実装状況（2024-MM-DD更新）

### 9.1 完了した実装
- Honoフレームワークを使用した基本的なサーバー構造
- LINE Webhook処理ハンドラー（署名検証、メッセージ処理、応答送信）
- Google Gemini AI統合（テキスト生成、ストリーミング応答）
- シンプルなロギングユーティリティ
- Vercelへのデプロイ（https://constructive-line-165saipj2-ramenumaiwhys-projects.vercel.app/）
- PRDに基づいたシステムプロンプトの実装（創造的アイデア引き出し用）

### 9.2 次のステップ（優先順）
1. **会話履歴の保存機能の実装**
   - ユーザーIDごとの会話履歴を保存する仕組み
   - 過去の会話を参照してより文脈に沿った応答を生成
   
2. **コンテキスト情報の記録**
   - 会話の時間、場所、気分などのメタデータを記録
   - 会話セッションのタグ付け機能
   
3. **キーポイント抽出機能**
   - 会話から重要なポイントを自動的に抽出
   - アイデアの構造化の基盤となる機能

4. **ユニットテストの実装**
   - 主要コンポーネントのテストカバレッジ向上
   - エラー処理の検証

### 9.3 技術的課題
- LINE Messaging APIとの継続的な連携の安定性確保
- 会話履歴の効率的な保存と取得の仕組み
- コンテキスト情報の適切な構造化 