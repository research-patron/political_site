# 政治家評価プラットフォーム

山形県参議院選挙2025の候補者の公約を客観的に評価・分析し、有権者の投票判断をサポートするWebアプリケーションです。

## 🚀 特徴

- **多次元評価システム**: 技術的・政治的・財政的実現性と実施期間の4軸で政策を評価
- **候補者比較機能**: 最大3名の候補者を同時比較
- **詳細分析レポート**: 各政策について500文字程度の分析レポート
- **モバイルファースト**: レスポンシブデザインでスマートフォンに最適化
- **リアルタイム更新**: Firebase基盤でリアルタイムデータ同期（予定）

## 🛠 技術スタック

### フロントエンド
- **React 18** + **TypeScript**
- **Vite** (ビルドツール)
- **Tailwind CSS** (スタイリング)
- **shadcn/ui** (UIコンポーネント)
- **Lucide React** (アイコン)

### バックエンド（予定）
- **Firebase Cloud Functions** (サーバーレス)
- **Firestore** (データベース)
- **Firebase Authentication** (認証)
- **Firebase Storage** (ファイルストレージ)

### AI/ML（予定）
- **Gemini 2.5 Pro** (政策分析)
- **Claude 4.0** (コンテンツ生成)
- **Perplexity API** (情報検索)

## 📁 プロジェクト構造

```
political_site/
├── src/
│   ├── components/          # UIコンポーネント
│   │   ├── ui/             # shadcn/ui基本コンポーネント
│   │   ├── candidates/     # 候補者関連コンポーネント
│   │   ├── policies/       # 政策関連コンポーネント
│   │   ├── comments/       # コメント系統コンポーネント
│   │   └── layout/         # レイアウトコンポーネント
│   ├── data/               # モックデータ
│   ├── lib/                # ユーティリティ関数
│   ├── services/           # API/データサービス層
│   ├── types/              # TypeScript型定義
│   └── App.tsx             # メインアプリケーション
├── functions/              # Firebase Cloud Functions（予定）
├── package.json
└── README.md
```

## 🏗 セットアップ

### 前提条件
- Node.js 18.x 以上
- npm または yarn

### インストール

1. 依存関係をインストール:
```bash
npm install
```

2. 開発サーバーを起動:
```bash
npm run dev
```

3. ブラウザで `http://localhost:5173` を開く

### ビルド

本番用ビルドを作成:
```bash
npm run build
```

## 📱 機能

### 実装済み機能

#### 🏠 ホーム画面
- 選挙概要と候補者サマリー
- 実現可能性の高い政策トップ3
- 全体統計の表示

#### 👥 候補者一覧・詳細
- 候補者の基本情報（名前、年齢、政党、経歴）
- 政策ごとの実現可能性スコア
- 詳細な評価分析（技術的・政治的・財政的・期間）
- 個人への影響度シミュレーション

#### ⚖️ 候補者比較
- 最大3名の候補者を同時比較
- 分野別政策比較
- 総合実現可能性スコアの並列表示

#### 📊 政策分析
- 分野別の実現可能性分析
- 影響度分布の可視化
- 実現可能性トップ5政策

### 今後実装予定

#### 💬 コメント・議論機能
- リアルタイムコメント投稿
- いいね機能
- 不適切コメントの自動フィルタリング
- スレッド形式のディスカッション

#### 🤖 AI自動分析
- URL入力による政策自動抽出
- AIによる実現可能性スコア算出
- 自動レポート生成

#### 🔐 ユーザー認証
- Firebase Authentication
- ユーザープロファイル
- 個人用ダッシュボード

## 📊 データ構造

### 候補者 (Candidate)
```typescript
interface Candidate {
  id: string;
  name: string;
  age: number;
  party: string;
  status: 'incumbent' | 'newcomer' | 'former';
  prefecture: string;
  electionType: string;
  slogan: string;
  policies: Policy[];
  achievements: string[];
}
```

### 政策 (Policy)
```typescript
interface Policy {
  id: string;
  title: string;
  category: string;
  feasibilityScore: number;
  impact: 'high' | 'medium' | 'low';
  detailedEvaluation: {
    technical: EvaluationDetail;
    political: EvaluationDetail;
    financial: EvaluationDetail;
    timeline: EvaluationDetail;
  };
}
```

## 🎯 評価基準

### 実現可能性スコア算出方法
- **技術的実現性** (40%): 制度・技術的な実施可能性
- **政治的実現性** (35%): 政治的合意形成の見込み
- **財政的実現性** (25%): 予算確保・財源の実現性
- **実施期間評価**: 実施までの期間と手続きの複雑さ

### 影響度評価
- **高影響度**: 個人の生活に直接的・短期的な影響
- **中影響度**: 中期的な生活改善効果
- **低影響度**: 長期的・間接的な社会影響

## 🔄 開発ワークフロー

### 現在の開発段階
✅ MVP (Minimum Viable Product) - 基本機能実装完了

### 次のステップ
1. Firebase統合とデータベース設計
2. AI分析機能の実装
3. ユーザー認証システム
4. コメント・議論機能
5. 管理者機能の追加

## 🤝 貢献

このプロジェクトは政治的中立性を重視し、客観的な情報提供を目指しています。

### 開発方針
- 政治的偏見のない客観的分析
- データに基づく評価
- ユーザビリティの重視
- アクセシビリティの確保

## 📄 ライセンス

このプロジェクトはオープンソースです。詳細は LICENSE ファイルを参照してください。

## 📞 お問い合わせ

プロジェクトに関する質問や提案がある場合は、イシューを作成してください。

---

**🗳️ 民主主義の未来を技術でサポート**