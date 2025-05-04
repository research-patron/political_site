# Ronshin - 論文新聞生成アプリ

Ronshinは学術論文を新聞形式に変換し、研究内容をわかりやすく視覚化するWebアプリケーションです。

## 機能

- 論文PDFのアップロードと解析
- AI（Vertex AI Gemini 2.5 Pro）による自動要約・構造化
- 複数のテンプレートから選択可能な新聞レイアウト
- レイアウトのカスタマイズ機能
- PDF出力機能
- 新聞の共有機能
- ユーザー管理（無料会員/プレミアム会員）

## 技術スタック

- フロントエンド
  - React (Vite)
  - TypeScript
  - Material-UI
  - React Router
  - Firebase Authentication
  - Firebase Storage

- バックエンド
  - Cloud Functions for Firebase
  - Vertex AI Gemini 2.5 Pro
  - Firebase Firestore

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/your-username/ronshin.git
cd ronshin
```

2. 依存パッケージのインストール
```bash
pnpm install
```

3. 環境変数の設定
```bash
cp .env.example .env
```
`.env`ファイルを編集し、必要な環境変数を設定してください。

4. 開発サーバーの起動
```bash
pnpm dev
```

## 利用可能なスクリプト

- `pnpm dev`: 開発サーバーの起動
- `pnpm build`: プロダクションビルドの作成
- `pnpm preview`: ビルドしたアプリのプレビュー
- `pnpm lint`: ESLintによるコード検証
- `pnpm format`: Prettierによるコードフォーマット
- `pnpm test`: テストの実行

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| VITE_FIREBASE_API_KEY | Firebase API Key | ✅ |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase Auth Domain | ✅ |
| VITE_FIREBASE_PROJECT_ID | Firebase Project ID | ✅ |
| VITE_FIREBASE_STORAGE_BUCKET | Firebase Storage Bucket | ✅ |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Firebase Messaging Sender ID | ✅ |
| VITE_FIREBASE_APP_ID | Firebase App ID | ✅ |
| VITE_STRIPE_PUBLIC_KEY | Stripe Public Key | ✅ |

## ライセンス

MIT

## コントリビューション

1. このリポジトリをフォークする
2. 新しいブランチを作成する (`git checkout -b feature/amazing-feature`)
3. 変更をコミットする (`git commit -m 'Add some amazing feature'`)
4. ブランチをプッシュする (`git push origin feature/amazing-feature`)
5. プルリクエストを作成する
