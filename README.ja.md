<div align="center">

# adalab shield

**ショート動画をブロック。集中力を取り戻す。**

_平均的なユーザーは1日2.5時間をショート動画に費やしています。あなたの時間を取り戻しましょう。_

[![CI](https://github.com/adabana-saki/adalab-shield/actions/workflows/ci.yml/badge.svg)](https://github.com/adabana-saki/adalab-shield/actions/workflows/ci.yml)
[![CodeQL](https://github.com/adabana-saki/adalab-shield/actions/workflows/codeql.yml/badge.svg)](https://github.com/adabana-saki/adalab-shield/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://github.com/adabana-saki/adalab-shield)
[![Firefox](https://img.shields.io/badge/Firefox-Add--on-FF7139?logo=firefox&logoColor=white)](https://github.com/adabana-saki/adalab-shield)
[![Edge](https://img.shields.io/badge/Edge-Add--on-0078D7?logo=microsoftedge&logoColor=white)](https://github.com/adabana-saki/adalab-shield)

[**インストール**](#インストール) · [**機能**](#機能) · [**デモ**](#デモ) · [**コントリビューション**](CONTRIBUTING.ja.md)

[English](README.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md)

</div>

---

## 問題

> 「TikTokを5分だけ見るつもりが…気づいたら2時間経っていた」

心当たりはありませんか？ショート動画はあなたの注意力を奪うように設計されています：

- **ドーパミンループ**: 15秒の動画ごとに報酬反応が発生
- **無限スクロール**: 自然な終わりがない
- **アルゴリズム最適化**: コンテンツは時間とともにより中毒性が高くなる

結果は？注意力の分散、生産性の低下、毎日失われる数時間。

## 解決策

**adalab shieldは、意志力に頼る前に、ショート動画コンテンツを元から断ちます。**

```text
YouTube Shorts  → ブロック
TikTok フィード → ブロック
Instagram Reels → ブロック
```

「あと1本だけ」はもうありません。ドゥームスクロールも終わり。集中するだけ。

---

## デモ

<div align="center">

<!-- TODO: 実際のデモGIFを追加 -->

![adalab shield Demo](docs/assets/demo-placeholder.png)

_ワンクリックでブロック。ワンクリックで解除。完全なコントロール。_

</div>

|  adalab shieldなし  |        adalab shieldあり         |
| :-----------------: | :------------------------------: |
| 無限スクロールの罠  | クリーンで集中できるブラウジング |
| 毎日2時間以上の損失 |          時間を取り戻す          |
|   絶え間ない誘惑    |      ディープワークが可能に      |

---

## 機能

| 機能                           | 説明                                                   |
| ------------------------------ | ------------------------------------------------------ |
| **マルチプラットフォーム対応** | YouTube Shorts、TikTok、Instagram Reels — すべてカバー |
| **プラットフォーム別制御**     | TikTokはブロックしてShortsは許可？あなたが決める       |
| **ホワイトリスト**             | 特定のクリエイター、チャンネル、URLを許可              |
| **カスタムルール**             | 高度なブロックのための独自CSSセレクタを追加            |
| **プライバシー優先**           | データ収集ゼロ。すべてローカルに保存                   |
| **クロスブラウザ**             | Chrome、Firefox、Edge対応                              |

---

## 比較

| 機能            |   adalab shield   |  BlockSite   |   uBlock Origin   | Screen Time |
| --------------- | :---------------: | :----------: | :---------------: | :---------: |
| YouTube Shorts  |        ✅         |  ⚠️ 部分的   |        ❌         |     ❌      |
| TikTok          |        ✅         |      ✅      |        ❌         |     ✅      |
| Instagram Reels |        ✅         |  ⚠️ 部分的   |        ❌         |     ❌      |
| ホワイトリスト  |      ✅ 無料      |   💰 有料    |        N/A        |     ❌      |
| カスタムルール  |        ✅         |      ❌      |        ✅         |     ❌      |
| プライバシー    | ✅ データ収集なし | ❌ 収集あり  | ✅ データ収集なし | ❌ 収集あり |
| オープンソース  |        ✅         |      ❌      |        ✅         |     ❌      |
| 価格            |     **無料**      | フリーミアム |       無料        |    有料     |

---

## インストール

### ブラウザストア

| ブラウザ | ステータス | リンク              |
| -------- | ---------- | ------------------- |
| Chrome   | 近日公開   | Chrome ウェブストア |
| Firefox  | 近日公開   | Firefox Add-ons     |
| Edge     | 近日公開   | Edge アドオン       |

### 手動インストール（開発用）

<details>
<summary><strong>クリックしてインストール手順を展開</strong></summary>

1. **リポジトリをクローン**

   ```bash
   git clone https://github.com/adabana-saki/adalab-shield.git
   cd adalab shield
   ```

2. **依存関係をインストール**

   ```bash
   pnpm install
   ```

3. **拡張機能をビルド**

   ```bash
   # Chrome用
   pnpm build:chrome

   # Firefox用
   pnpm build:firefox

   # Edge用
   pnpm build:edge

   # 全ブラウザ用
   pnpm build:all
   ```

4. **拡張機能を読み込み**
   - **Chrome**: `chrome://extensions/` を開き、「デベロッパーモード」を有効にし、「パッケージ化されていない拡張機能を読み込む」をクリック、`dist/chrome` を選択
   - **Firefox**: `about:debugging#/runtime/this-firefox` を開き、「一時的なアドオンを読み込む」をクリック、`dist/firefox` 内の任意のファイルを選択
   - **Edge**: `edge://extensions/` を開き、「開発者モード」を有効にし、「展開して読み込み」をクリック、`dist/edge` を選択

</details>

---

## 使い方

### クイックスタート

1. ブラウザツールバーの**adalab shieldアイコン**をクリック
2. **メインスイッチ**でブロックの有効/無効を切り替え
3. **プラットフォームトグル**で個別サイトを制御

### ホワイトリスト（特定コンテンツを許可）

1. 拡張機能の**オプション**を開く（歯車アイコン）
2. **ホワイトリスト**セクションに移動
3. 許可したいチャンネル、URL、ドメインを追加

### カスタムブロックルール

1. 拡張機能の**オプション**を開く
2. **カスタムルール**セクションに移動
3. ブロックしたい要素のCSSセレクタを追加

---

## adalab shieldが生まれた理由

**私は怒っていました。** 毎日何時間もショート動画に奪われ、気づけば深夜。何も成し遂げられず、ただ時間だけが消えていく。この無駄な時間への怒りと悔しさが、adalab shieldを生み出しました。

1日3時間以上もショート動画に費やしていることに気づき、様々な対策を試みました：

- ❌ **意志力** — 2日で失敗
- ❌ **アプリタイマー** — 「無視」をタップするだけ
- ❌ **アプリの削除** — 数時間後に再インストール
- ❌ **Webサイトブロッカー** — 全てをブロックしすぎて不便

必要だったのは**外科的な精度**：中毒性のあるコンテンツはブロックしつつ、プラットフォームは正当な目的（検索、特定のクリエイターなど）で使えるようにすること。

adalab shieldがそのツールです。

### このツールに込めた願い

**あなたの時間を取り戻してほしい。** ショート動画という巧妙に設計された時間泥棒から、あなたの人生をガードしてほしい。そして、その時間を使って、本当に大切なことに集中し、**より効率的で充実した人生を歩んでほしい**。

adalab shieldは単なるブロッカーではありません。あなたの時間と人生を守る盾です。

---

## 科学的背景

ショート動画プラットフォームは、エンゲージメントを最大化するために心理学的技術を使用しています：

| 技術               | 仕組み                                       | adalab shieldの対応    |
| ------------------ | -------------------------------------------- | ---------------------- |
| **可変報酬**       | 予測不能なコンテンツがスクロールを続けさせる | フィード全体をブロック |
| **無限スクロール** | 自然な終点がない                             | スクロール機構を削除   |
| **自動再生**       | 同意なく次の動画が開始                       | 動画の読み込みを防止   |
| **FOMO デザイン**  | 「トレンド」「おすすめ」が緊急感を演出       | レコメンドUIを非表示   |

---

## FAQ

<details>
<summary><strong>YouTube/TikTok/Instagramが完全にブロックされますか？</strong></summary>

いいえ。adalab shieldは**ショート動画セクションのみ**（Shorts、For Youページ、Reels）をブロックします。YouTube検索、通常の動画視聴、Instagramの投稿閲覧などは引き続き使用できます。

</details>

<details>
<summary><strong>一時的にブロックを解除できますか？</strong></summary>

はい！拡張機能アイコンをワンクリックでブロックのオン/オフを切り替えられます。また、特定のプラットフォームだけを無効にしながら他をブロックしたままにすることもできます。

</details>

<details>
<summary><strong>adalab shieldはデータを収集しますか？</strong></summary>

**いいえ。** adalab shieldは100%ローカルです。分析なし、トラッキングなし、外部リクエストなし。ブラウジングデータがデバイスから出ることはありません。

</details>

<details>
<summary><strong>uBlock Originを使えばいいのでは？</strong></summary>

uBlock Originは広告には優れていますが、ショート動画のブロックには頻繁に更新が必要なプラットフォーム固有のルールが必要です。adalab shieldはこれらのルールをメンテナンスし、使いやすいインターフェースを提供します。

</details>

<details>
<summary><strong>モバイルで使えますか？</strong></summary>

現在、adalab shieldはデスクトップ専用（ブラウザ拡張機能）です。モバイル対応はロードマップに含まれています。

</details>

---

## ロードマップ

- [x] コアブロッキングエンジン
- [x] YouTube Shorts対応
- [x] TikTok対応
- [x] Instagram Reels対応
- [x] ホワイトリスト機能
- [x] カスタムルール
- [x] マルチブラウザ対応
- [ ] ブラウザストア公開
- [ ] 使用統計ダッシュボード
- [ ] **タイマー機能**（1日の利用時間制限）
- [ ] **カスタムドメインブロック**（独自のブロック対象を追加）
- [ ] **解除防止機能**（簡単に無効化できないようにする仕組み）
- [ ] スケジュールブロック（集中時間）
- [ ] モバイルブラウザ対応（Firefox Android）
- [ ] Safari拡張機能

[完全なロードマップを見る →](https://github.com/adabana-saki/adalab-shield/projects)

---

## 開発

### 前提条件

- Node.js 20以上
- pnpm 9以上

### コマンド

```bash
pnpm install        # 依存関係のインストール
pnpm dev            # 開発サーバーの起動
pnpm build:all      # 全ブラウザ用ビルド
pnpm test:unit      # ユニットテストの実行
pnpm test:e2e       # E2Eテストの実行
pnpm lint           # Lintの実行
pnpm typecheck      # 型チェックの実行
```

### プロジェクト構成

```
adalab shield/
├── src/
│   ├── background/     # Service Worker
│   ├── content/        # Content Scripts
│   │   ├── platforms/  # プラットフォーム検出
│   │   └── actions/    # ブロックアクション
│   ├── popup/          # ポップアップUI
│   ├── options/        # オプションページ
│   └── shared/         # 共有ユーティリティ
├── public/
│   ├── icons/          # 拡張機能アイコン
│   └── _locales/       # i18nメッセージ
└── tests/              # テストスイート
```

---

## コントリビューション

コントリビューションを歓迎します！adalab shieldはコントリビューターにフレンドリーに設計されています。

### クイックスタート

```bash
git clone https://github.com/adabana-saki/adalab-shield.git
cd adalab shield
pnpm install
pnpm dev
```

### Good First Issues

コントリビューションしたい方は [`good first issue`](https://github.com/adabana-saki/adalab-shield/labels/good%20first%20issue) ラベルの付いたIssueをチェックしてください。

詳細なガイドラインは [CONTRIBUTING.ja.md](CONTRIBUTING.ja.md) をご覧ください。

### 翻訳

adalab shieldの翻訳にご協力ください！手順は [TRANSLATING.md](TRANSLATING.md) をご覧ください。

---

## プライバシー

adalab shieldはプライバシーを基本原則として構築されています：

- **データ収集なし** — ユーザーデータは一切収集しません
- **外部リクエストなし** — すべての機能がオフラインで動作
- **ローカルストレージのみ** — 設定はブラウザに保存
- **オープンソース** — 完全なコード透明性

詳細は[プライバシーポリシー](docs/PRIVACY_POLICY.ja.md)をご覧ください。

## セキュリティ

脆弱性を発見されましたか？[セキュリティポリシー](SECURITY.md)をご覧ください。

## ライセンス

[MIT](LICENSE) — 自由に使用、改変、共有してください。

---

## 謝辞

- [React](https://react.dev/) で構築
- [Vite](https://vitejs.dev/) でバンドル
- [@crxjs/vite-plugin](https://crxjs.dev/) による拡張機能フレームワーク

---

<div align="center">

**開発: [ADALAB](https://adalab.pages.dev/)**

プロジェクトリード: Adabana Saki

---

adalab shieldが集中力の回復に役立ちましたら、⭐をお願いします

[⭐ このプロジェクトにスターを付ける](https://github.com/adabana-saki/adalab-shield)

</div>
