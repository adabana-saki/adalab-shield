# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Report via [GitHub Security Advisories](https://github.com/adabana-saki/adalab-shield/security/advisories/new)
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Assessment**: We will assess the vulnerability within 7 days
- **Resolution**: Critical issues will be addressed within 14 days
- **Disclosure**: We will coordinate with you on public disclosure timing

### Scope

The following are in scope:

- The browser extension code (Chrome, Firefox, Edge)
- Build and deployment scripts
- Dependencies with known vulnerabilities

The following are out of scope:

- Social engineering attacks
- Physical attacks
- Issues in third-party services

## Security Best Practices

This extension follows these security principles:

1. **No External Data Transmission**: All data stays local
2. **Minimal Permissions**: Only essential browser permissions requested
3. **Content Security Policy**: Strict CSP to prevent XSS
4. **Input Validation**: All user inputs are validated and sanitized
5. **Secure Message Passing**: Sender verification for all messages

## Dependencies

We regularly audit our dependencies using:

- `pnpm audit` for vulnerability scanning
- Dependabot for automated security updates
- CodeQL for static analysis

---

# セキュリティポリシー

## サポートバージョン

| バージョン | サポート状況       |
| ---------- | ------------------ |
| 0.1.x      | :white_check_mark: |

## 脆弱性の報告

セキュリティの脆弱性を発見した場合は、責任ある方法で報告してください。

### 報告方法

1. セキュリティ脆弱性についてパブリックなGitHub issueを作成**しないでください**
2. 発見内容をメールで送信してください
3. 以下の情報を含めてください：
   - 脆弱性の説明
   - 再現手順
   - 潜在的な影響
   - 修正案（あれば）

### 対応について

- **受領確認**: 48時間以内に受領を確認します
- **評価**: 7日以内に脆弱性を評価します
- **解決**: 重大な問題は14日以内に対処します
- **公開**: 公開のタイミングについて調整します

## セキュリティ原則

この拡張機能は以下のセキュリティ原則に従っています：

1. **外部データ送信なし**: すべてのデータはローカルに保存
2. **最小権限**: 必要最小限のブラウザ権限のみ要求
3. **コンテンツセキュリティポリシー**: XSS防止のための厳格なCSP
4. **入力検証**: すべてのユーザー入力を検証・サニタイズ
5. **安全なメッセージパッシング**: すべてのメッセージで送信者検証
