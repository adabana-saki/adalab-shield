# Chrome Web Store リリース手順

## 事前準備

### 必要なもの

- Googleアカウント
- 開発者登録料: $5（一回のみ）
- ZIPファイル: `dist/chrome` フォルダ

## 手順

### 1. Chrome Web Store開発者登録

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) にアクセス
2. Googleアカウントでログイン
3. 初回のみ：開発者登録料 $5 を支払う
4. 利用規約に同意

### 2. 拡張機能のZIP作成

```bash
cd dist/chrome
zip -r ../../adalab shield-chrome-v0.1.0.zip .
cd ../..
```

またはWindows PowerShellで：

```powershell
Compress-Archive -Path dist\chrome\* -DestinationPath adalab shield-chrome-v0.1.0.zip
```

### 3. 新しいアイテムを作成

1. ダッシュボードで「新しいアイテム」をクリック
2. ZIPファイルをアップロード
3. 「続行」をクリック

### 4. ストア掲載情報を入力

#### 基本情報

- **名前**: adalab shield
- **概要** (132文字以内):
  ```
  Block short-form videos and reclaim your focus. Comprehensive productivity toolkit with Focus Mode, Pomodoro Timer, Time Limits, and more.
  ```

#### 詳細な説明

```markdown
adalab shield blocks short-form videos across YouTube Shorts, TikTok, and Instagram Reels to help you reclaim your time and focus.

🛡️ CORE FEATURES
• Multi-platform blocking (YouTube Shorts, TikTok, Instagram Reels)
• SNS feed blocking (Twitter, Facebook, LinkedIn, Reddit)
• Custom domain blocking
• Whitelist system for trusted content

⏱️ PRODUCTIVITY TOOLS
• Focus Mode - One-click distraction blocking (30/60/120 min)
• Pomodoro Timer - Classic 25/5 work/break technique
• Site Time Limits - Daily usage limits per platform
• Time Tracking - 90-day usage history with reports
• Streak Tracking - Build consistency with milestones
• Challenge Mode - Solve puzzles to bypass (prevents impulsive unblocking)
• Lockdown Mode - PIN-protect settings
• Schedule Blocking - Auto-block during specific hours

🎨 CUSTOMIZATION
• Custom block page with motivational messages
• Multi-language support (9 languages)
• Dark/Light themes
• Privacy-first: Zero data collection, everything stays local

Perfect for students, professionals, and anyone looking to reduce screen time and improve focus.

Open source: https://github.com/adabana-saki/adalab-shield
```

#### カテゴリ

- **プライマリカテゴリ**: Productivity
- **セカンダリカテゴリ**: Tools (任意)

#### 言語

- 英語 (デフォルト)
- 日本語 (オプション)

### 5. グラフィック素材

#### アイコン (128x128px)

- `public/icons/icon-128.png` を使用

#### スクリーンショット (1280x800px または 640x400px)

**必須: 最低1枚、最大5枚**

推奨スクリーンショット:

1. **メインUI** - ポップアップ画面
2. **ブロック画面** - 実際のブロック動作
3. **Focus Mode** - Focus Modeタイマー
4. **設定画面** - オプションページ
5. **統計画面** - Time Reports

撮影方法:

```bash
# 拡張機能をブラウザで読み込む
# 各画面をスクリーンショット撮影
# 1280x800px にリサイズ
```

#### プロモーション画像 (任意だが推奨)

- **小さいタイル**: 440x280px
- **大きいタイル**: 920x680px
- **マーキータイル**: 1400x560px

### 6. プライバシー情報

#### プライバシープラクティス

- **データ収集**: なし
- **外部送信**: なし
- **ユーザーデータの使用**: なし

#### プライバシーポリシーURL

```
https://github.com/adabana-saki/adalab-shield/blob/main/docs/PRIVACY_POLICY.md
```

#### 権限の説明

拡張機能が使用する権限:

- `storage` - 設定とデータの保存
- `tabs` - アクティブなタブの検出
- `alarms` - タイマー機能
- `notifications` - 通知表示

各権限の理由を明記:

```
storage: Save user settings and time tracking data locally
tabs: Detect when user visits short-form video sites
alarms: Implement Focus Mode and Pomodoro timers
notifications: Notify when focus sessions complete
```

### 7. 配布設定

#### 公開範囲

- **すべての国で公開** (推奨)
- または特定の国のみ選択

#### 料金

- **無料**

#### 年齢制限

- **なし**

### 8. 審査に提出

1. すべての情報を入力後、「公開のために送信」をクリック
2. 審査には通常 **1-3営業日** かかります
3. 審査中は「審査中」ステータスが表示されます

### 9. 審査後

#### 承認された場合

- ストアに公開されます
- URLは: `https://chrome.google.com/webstore/detail/[拡張機能ID]`
- このURLをREADMEとソーシャルメディアで共有

#### 拒否された場合

- 拒否理由を確認
- 修正して再提出

## よくある拒否理由

1. **スクリーンショット不足** - 最低1枚必要
2. **プライバシーポリシー不明** - URLを明記
3. **権限の説明不足** - 各権限の使用理由を説明
4. **不適切なコンテンツ** - 説明文やスクリーンショットを確認

## 更新版のリリース

バージョンアップ時:

1. `package.json` のバージョンを更新
2. 新しいZIPをビルド
3. ダッシュボードで「パッケージをアップロード」
4. 変更点を説明
5. 提出

## チェックリスト

- [ ] 開発者登録完了
- [ ] ZIPファイル作成
- [ ] ストア掲載情報記入
- [ ] スクリーンショット準備（最低1枚）
- [ ] プライバシーポリシーURL設定
- [ ] 権限の説明記入
- [ ] 審査に提出
- [ ] 承認待ち

## 参考リンク

- [Chrome Web Store開発者ダッシュボード](https://chrome.google.com/webstore/devconsole)
- [公式ガイド](https://developer.chrome.com/docs/webstore/publish/)
- [審査ポリシー](https://developer.chrome.com/docs/webstore/program-policies/)
