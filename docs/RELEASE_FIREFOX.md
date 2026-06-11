# Firefox Add-ons リリース手順

## 事前準備

### 必要なもの

- Firefox アカウント
- 登録料: **無料**
- ZIPファイル: `dist/firefox` フォルダ

## 手順

### 1. Firefox Add-ons 開発者登録

1. [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/) にアクセス
2. Firefox アカウントでログイン（無料）
3. プロフィール情報を入力

### 2. 拡張機能のZIP作成

```bash
cd dist/firefox
zip -r ../../adalab shield-firefox-v0.1.0.zip .
cd ../..
```

またはWindows PowerShellで：

```powershell
Compress-Archive -Path dist\firefox\* -DestinationPath adalab shield-firefox-v0.1.0.zip
```

### 3. 新しいアドオンを登録

1. [Submit a New Add-on](https://addons.mozilla.org/developers/addon/submit/upload-listed) にアクセス
2. 「Upload Your Add-on」をクリック

### 4. アドオンをアップロード

1. ZIPファイルをアップロード
2. 自動検証が実行されます
3. エラーがなければ「Continue」

### 5. 基本情報を入力

#### アドオン名

```
adalab shield
```

#### 概要 (250文字以内)

```
Block short-form videos and reclaim your focus. Comprehensive productivity toolkit with Focus Mode, Pomodoro Timer, Time Limits, Streak Tracking, and more. Privacy-first: zero data collection.
```

#### カテゴリ

- **Primary**: Privacy & Security
- **Secondary**: Productivity

#### サポートURL (任意)

```
https://github.com/adabana-saki/adalab-shield/issues
```

#### ホームページURL (任意)

```
https://github.com/adabana-saki/adalab-shield
```

### 6. 詳細説明

```markdown
adalab shield blocks short-form videos across YouTube Shorts, TikTok, and Instagram Reels to help you reclaim your time and focus.

## Core Features

**Multi-Platform Blocking**
• YouTube Shorts - Remove Shorts shelf and block /shorts URLs
• TikTok - Block For You feed and video pages
• Instagram Reels - Hide Reels tab and block Reels content
• SNS Feed Blocking - Twitter, Facebook, LinkedIn, Reddit feeds
• Custom Domain Blocking - Add any website to block list

**Whitelist System**
• Allow specific YouTube channels
• Allow specific video/post URLs
• Allow entire domains

## Productivity Tools

**Focus Mode**
• One-click distraction blocking
• 30/60/120 minute durations
• Soft lock prevents impulsive canceling

**Pomodoro Timer**
• Classic 25/5 work/break technique
• Customizable durations
• Auto-start options
• Sound notifications

**Site Time Limits**
• Set daily usage limits per platform
• Visual warning at 80% usage
• Automatic blocking when limit reached
• Resets at midnight

**Time Tracking & Reports**
• 90-day usage history
• Daily time spent per platform
• Visual charts and statistics
• Export/delete data

**Streak Tracking**
• Track consecutive focus days
• Milestone achievements (7/30/100 days)
• Motivational progress display

**Challenge Mode**
• Math puzzles (Easy/Medium/Hard)
• Typing challenges
• Pattern memory challenges
• Cooldown system prevents repeated bypassing

**Lockdown Mode**
• PIN-protect settings (4-8 digits)
• SHA-256 PIN hashing for security
• Emergency bypass system (30 min default)
• Prevents impulsive setting changes

**Schedule Blocking**
• Time-based auto-blocking
• Day-specific schedules
• Work hours / sleep time blocking

## Customization

• Custom block page with motivational messages
• Multi-language support (9 languages)
• Dark/Light/System themes
• Custom colors

## Privacy-First Design

• Zero data collection
• No analytics or tracking
• No external requests
• Everything stays local on your device
• Open source for full transparency

Perfect for students, professionals, and anyone looking to reduce screen time and improve focus.

## Open Source

GitHub: https://github.com/adabana-saki/adalab-shield
License: MIT
```

### 7. アイコン・スクリーンショット

#### アイコン

- **64x64px**: `public/icons/icon-64.png`（なければ128pxをリサイズ）

#### スクリーンショット

**推奨: 3-5枚**

推奨サイズ: **1280x800px**

1. メインUI - ポップアップ画面
2. ブロック動作 - 実際のブロック画面
3. Focus Mode - タイマー画面
4. 設定画面 - オプションページ
5. 統計画面 - Time Reports

### 8. ライセンスとプライバシー

#### ソースコードライセンス

```
MIT License
```

#### ソースコードリポジトリ

```
https://github.com/adabana-saki/adalab-shield
```

#### プライバシーポリシーURL

```
https://github.com/adabana-saki/adalab-shield/blob/main/docs/PRIVACY_POLICY.md
```

#### データ収集の説明

```
This extension does not collect, store, or transmit any user data.
All settings and statistics are stored locally on the user's device.
No analytics, no tracking, no external servers.
```

### 9. バージョン情報

#### バージョンノート

```
Initial release (v0.1.0)

Features:
- Multi-platform short-form video blocking (YouTube, TikTok, Instagram)
- SNS feed blocking (Twitter, Facebook, LinkedIn, Reddit)
- 8 productivity features (Focus Mode, Pomodoro, Time Limits, etc.)
- Multi-language support (9 languages)
- Privacy-first design (zero data collection)

See full changelog: https://github.com/adabana-saki/adalab-shield/blob/main/CHANGELOG.md
```

### 10. 審査に提出

1. 「Submit Version」をクリック
2. 自動レビューが即座に実行されます
3. **自動承認**される場合が多い（数分～1時間）
4. 手動レビューが必要な場合は数日かかる場合もあります

### 11. 公開後

#### 承認された場合

- URLは: `https://addons.mozilla.org/firefox/addon/adalab shield/`
- README とソーシャルメディアで共有

#### 手動レビューが必要な場合

- レビュー完了まで待つ（通常1-3営業日）
- 質問があれば回答

## Firefoxの特徴

✅ **自動承認が多い** - シンプルな拡張機能は数分で承認
✅ **登録料無料** - Chrome Web Storeの$5が不要
✅ **オープンソース優先** - GitHubリポジトリへのリンクが推奨される
⚠️ **厳格な審査** - セキュリティとプライバシーに厳しい

## よくある問題

1. **権限の説明不足** - manifest.jsonの各権限の使用理由を明記
2. **外部リソース読み込み** - CDNの使用は避ける（全てローカルにバンドル）
3. **難読化コード** - ビルドツール使用時は元のソースコードも提出

## 更新版のリリース

1. `package.json` のバージョンを更新
2. 新しいZIPをビルド
3. ダッシュボードで「Upload New Version」
4. バージョンノートを記入
5. 提出

## チェックリスト

- [ ] Firefox アカウント作成
- [ ] ZIPファイル作成
- [ ] アドオン基本情報記入
- [ ] スクリーンショット準備（3-5枚）
- [ ] プライバシーポリシーURL設定
- [ ] ソースコードリポジトリURL設定
- [ ] バージョンノート記入
- [ ] 審査に提出
- [ ] 承認待ち

## 参考リンク

- [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
- [提出ガイド](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
- [審査ポリシー](https://extensionworkshop.com/documentation/publish/add-on-policies/)
