# Translation Guide

Thank you for helping translate adalab shield!

[日本語版はこちら](#日本語)

## Adding a New Language

1. Copy `public/_locales/en/` to `public/_locales/{locale}/`
2. Translate all `"message"` values in `messages.json`
3. Do NOT translate `"description"` (it's for developers)
4. Do NOT change placeholders like `$COUNT$`
5. Run `pnpm i18n:check` to verify completeness
6. Submit a PR titled `i18n: add {language} translation`

## Language Codes

| Code  | Language              |
| ----- | --------------------- |
| en    | English               |
| ja    | Japanese              |
| zh_CN | Chinese (Simplified)  |
| zh_TW | Chinese (Traditional) |
| ko    | Korean                |
| es    | Spanish               |
| pt_BR | Portuguese (Brazil)   |
| de    | German                |
| fr    | French                |

## Translation Tips

- Keep translations concise (UI space is limited)
- Match the tone of the English original
- Test your translations in the actual extension
- Ask in Issues if you're unsure about context

## Message Format

```json
{
  "keyName": {
    "message": "Your translated text here",
    "description": "Context for translators (don't translate this)"
  },
  "keyWithPlaceholder": {
    "message": "Blocked $COUNT$ items",
    "description": "Shows the number of blocked items",
    "placeholders": {
      "count": {
        "content": "$1",
        "example": "42"
      }
    }
  }
}
```

## Updating Existing Translations

1. Check which keys are missing: `pnpm i18n:check`
2. Add missing translations to your locale
3. Submit a PR titled `i18n({locale}): add missing translations`

## Testing Your Translation

```bash
# Build the extension
pnpm build:chrome

# Load in Chrome with your language
google-chrome --lang={locale}

# Or in Firefox (about:config)
# Set intl.locale.requested to your locale
```

## Credits

All translators are credited in:

- README.md Contributors section
- GitHub release notes
- Extension's About page

---

# 日本語

## 新しい言語の追加

1. `public/_locales/en/` を `public/_locales/{locale}/` にコピー
2. `messages.json` 内のすべての `"message"` 値を翻訳
3. `"description"` は翻訳しないでください（開発者向け）
4. `$COUNT$` などのプレースホルダーは変更しないでください
5. `pnpm i18n:check` で完全性を確認
6. タイトル `i18n: add {language} translation` で PR を提出

## 言語コード

| コード | 言語                     |
| ------ | ------------------------ |
| en     | 英語                     |
| ja     | 日本語                   |
| zh_CN  | 中国語（簡体字）         |
| zh_TW  | 中国語（繁体字）         |
| ko     | 韓国語                   |
| es     | スペイン語               |
| pt_BR  | ポルトガル語（ブラジル） |
| de     | ドイツ語                 |
| fr     | フランス語               |

## 翻訳のヒント

- 翻訳は簡潔に（UI スペースは限られています）
- 英語オリジナルのトーンに合わせる
- 実際の拡張機能で翻訳をテストする
- コンテキストが不明な場合は Issue で質問

## 謝辞

すべての翻訳者は以下でクレジットされます：

- README.md の Contributors セクション
- GitHub リリースノート
- 拡張機能の About ページ
