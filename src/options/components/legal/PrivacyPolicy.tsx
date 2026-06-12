/**
 * Privacy Policy page component
 * GDPR and CCPA compliant privacy policy
 */

import { useI18n } from '@/shared/hooks/useI18n';
import {
  SELLER_INFO,
  DATA_COLLECTION,
  SUPPORT_INFO,
} from '@/shared/constants/legal';

export function PrivacyPolicy() {
  const { t, locale } = useI18n();
  const isJapanese = locale === 'ja';
  const lastUpdated = '2025-01-01';

  return (
    <div className="legal-page">
      <div className="legal-header">
        <h1 className="legal-title">{t('privacyPolicyTitle')}</h1>
        <p className="legal-updated">
          {t('lastUpdated')}: {lastUpdated}
        </p>
      </div>

      <div className="legal-content">
        {/* Introduction */}
        <section className="legal-section">
          <h2>{isJapanese ? '1. はじめに' : '1. Introduction'}</h2>
          <p>
            {isJapanese
              ? `${SELLER_INFO.businessName}（以下「当社」）は、お客様のプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーは、当社がどのようなデータを収集し、どのように使用するかを説明します。`
              : `${SELLER_INFO.businessName} ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains what data we collect and how we use it.`}
          </p>
        </section>

        {/* Data We Collect */}
        <section className="legal-section">
          <h2>{isJapanese ? '2. 収集するデータ' : '2. Data We Collect'}</h2>

          <h3>{isJapanese ? '2.1 収集するデータ' : '2.1 Data We Collect'}</h3>
          <ul>
            {DATA_COLLECTION.collectedData.map((item) => (
              <li key={item}>
                {isJapanese
                  ? item === 'blocking_statistics'
                    ? 'ブロック統計（ブロック数、対象プラットフォーム）'
                    : item === 'usage_patterns'
                      ? '使用パターン（機能の使用状況、サービス改善のため）'
                      : '設定情報（お客様の設定内容）'
                  : item === 'blocking_statistics'
                    ? 'Blocking statistics (number of blocks, platforms blocked)'
                    : item === 'usage_patterns'
                      ? 'Usage patterns (feature usage for service improvement)'
                      : 'Settings and preferences'}
              </li>
            ))}
          </ul>

          <h3>
            {isJapanese ? '2.2 収集しないデータ' : '2.2 Data We Do NOT Collect'}
          </h3>
          <ul>
            {DATA_COLLECTION.notCollectedData.map((item) => (
              <li key={item}>
                {isJapanese
                  ? item === 'browsing_history'
                    ? '閲覧履歴'
                    : item === 'personal_identifiers'
                      ? '個人識別情報（氏名、住所等）'
                      : item === 'location_data'
                        ? '位置情報'
                        : '決済情報（Googleが処理）'
                  : item === 'browsing_history'
                    ? 'Browsing history'
                    : item === 'personal_identifiers'
                      ? 'Personal identifiers (name, address, etc.)'
                      : item === 'location_data'
                        ? 'Location data'
                        : 'Payment details (handled by Google)'}
              </li>
            ))}
          </ul>
        </section>

        {/* How We Use Your Data */}
        <section className="legal-section">
          <h2>
            {isJapanese ? '3. データの利用目的' : '3. How We Use Your Data'}
          </h2>
          <ul>
            <li>
              {isJapanese
                ? 'サービスの提供と機能の実行'
                : 'To provide and operate the Service'}
            </li>
            <li>
              {isJapanese
                ? 'サービスの改善とバグ修正'
                : 'To improve the Service and fix bugs'}
            </li>
            <li>
              {isJapanese
                ? 'サブスクリプションの管理'
                : 'To manage your subscription'}
            </li>
            <li>
              {isJapanese
                ? 'カスタマーサポートの提供'
                : 'To provide customer support'}
            </li>
          </ul>
        </section>

        {/* Data Storage */}
        <section className="legal-section">
          <h2>{isJapanese ? '4. データの保存' : '4. Data Storage'}</h2>
          <p>
            {isJapanese
              ? `お客様のデータは、主にお客様のブラウザのローカルストレージに保存されます。データの保存期間: ${DATA_COLLECTION.retentionPeriod}`
              : `Your data is primarily stored in your browser's local storage. Retention period: ${DATA_COLLECTION.retentionPeriod}`}
          </p>
        </section>

        {/* Third Party Sharing */}
        <section className="legal-section">
          <h2>{isJapanese ? '5. 第三者への提供' : '5. Third Party Sharing'}</h2>
          <p>
            {isJapanese
              ? 'お客様のデータを第三者に提供することはありません。すべてのデータはお客様のブラウザ内に保存されます。'
              : 'We do not share your data with any third parties. All data stays in your browser.'}
          </p>
        </section>

        {/* Your Rights (GDPR) */}
        <section className="legal-section">
          <h2>
            {isJapanese ? '6. お客様の権利（GDPR）' : '6. Your Rights (GDPR)'}
          </h2>
          <p>
            {isJapanese
              ? 'EU/EEA在住のお客様は、以下の権利を有します：'
              : 'If you are in the EU/EEA, you have the following rights:'}
          </p>
          <ul>
            <li>
              <strong>{isJapanese ? 'アクセス権' : 'Right of Access'}</strong>
              {isJapanese
                ? ' - お客様のデータのコピーを要求できます'
                : ' - Request a copy of your data'}
            </li>
            <li>
              <strong>
                {isJapanese ? '訂正権' : 'Right to Rectification'}
              </strong>
              {isJapanese
                ? ' - 不正確なデータの訂正を要求できます'
                : ' - Request correction of inaccurate data'}
            </li>
            <li>
              <strong>
                {isJapanese ? '削除権（忘れられる権利）' : 'Right to Erasure'}
              </strong>
              {isJapanese
                ? ' - データの削除を要求できます'
                : ' - Request deletion of your data'}
            </li>
            <li>
              <strong>
                {isJapanese
                  ? 'データポータビリティ権'
                  : 'Right to Data Portability'}
              </strong>
              {isJapanese
                ? ' - データを機械可読形式で受け取る権利'
                : ' - Receive your data in a machine-readable format'}
            </li>
            <li>
              <strong>
                {isJapanese ? '処理制限権' : 'Right to Restrict Processing'}
              </strong>
              {isJapanese
                ? ' - データ処理の制限を要求できます'
                : ' - Request restriction of processing'}
            </li>
            <li>
              <strong>{isJapanese ? '異議権' : 'Right to Object'}</strong>
              {isJapanese
                ? ' - 特定の処理に異議を唱える権利'
                : ' - Object to certain processing'}
            </li>
          </ul>
        </section>

        {/* CCPA Rights */}
        <section className="legal-section">
          <h2>
            {isJapanese
              ? '7. カリフォルニア州居住者の権利（CCPA）'
              : '7. California Residents Rights (CCPA)'}
          </h2>
          <p>
            {isJapanese
              ? 'カリフォルニア州居住者は、以下の追加権利を有します：'
              : 'California residents have the following additional rights:'}
          </p>
          <ul>
            <li>
              {isJapanese
                ? '収集される個人情報のカテゴリを知る権利'
                : 'Right to know what personal information is collected'}
            </li>
            <li>
              {isJapanese
                ? '個人情報の削除を要求する権利'
                : 'Right to request deletion of personal information'}
            </li>
            <li>
              {isJapanese
                ? '個人情報の販売をオプトアウトする権利（当社は個人情報を販売しません）'
                : 'Right to opt-out of sale of personal information (we do not sell personal information)'}
            </li>
            <li>
              {isJapanese
                ? '権利行使により差別されない権利'
                : 'Right to non-discrimination for exercising your rights'}
            </li>
          </ul>
        </section>

        {/* Cookies */}
        <section className="legal-section">
          <h2>{isJapanese ? '8. Cookieについて' : '8. Cookies'}</h2>
          <p>
            {isJapanese
              ? '本拡張機能はCookieを使用しません。すべてのデータはブラウザのローカルストレージに保存されます。'
              : "This extension does not use cookies. All data is stored in your browser's local storage."}
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="legal-section">
          <h2>
            {isJapanese ? '9. 子供のプライバシー' : "9. Children's Privacy"}
          </h2>
          <p>
            {isJapanese
              ? '本サービスは13歳未満の子供を対象としていません。13歳未満の子供から故意に個人情報を収集することはありません。'
              : 'The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13.'}
          </p>
        </section>

        {/* Changes to Policy */}
        <section className="legal-section">
          <h2>
            {isJapanese ? '10. ポリシーの変更' : '10. Changes to This Policy'}
          </h2>
          <p>
            {isJapanese
              ? '当社は、本プライバシーポリシーを随時更新することがあります。重要な変更がある場合は、サービス内で通知します。'
              : 'We may update this Privacy Policy from time to time. We will notify you of significant changes through the Service.'}
          </p>
        </section>

        {/* Contact */}
        <section className="legal-section">
          <h2>{isJapanese ? '11. お問い合わせ' : '11. Contact Us'}</h2>
          <p>
            {isJapanese
              ? 'プライバシーに関するご質問やデータに関するリクエストは、以下までご連絡ください：'
              : 'For privacy-related questions or data requests, please contact us at:'}
          </p>
          <p className="legal-contact">
            {SELLER_INFO.businessName}
            <br />
            Email: {SUPPORT_INFO.email}
            <br />
            {isJapanese
              ? `回答時間: ${SUPPORT_INFO.responseTimeHours}時間以内`
              : `Response time: Within ${SUPPORT_INFO.responseTimeHours} hours`}
          </p>
        </section>
      </div>
    </div>
  );
}
