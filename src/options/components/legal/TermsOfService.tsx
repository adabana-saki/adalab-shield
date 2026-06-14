/**
 * Terms of Service page component
 * Displays the terms and conditions for using adalab shield
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { SELLER_INFO, LEGAL_URLS } from '@/shared/constants/legal';

export function TermsOfService() {
  const { t, locale } = useI18n();
  const isJapanese = locale === 'ja';
  const lastUpdated = '2025-01-01';

  return (
    <div className="legal-page">
      <div className="legal-header">
        <h1 className="legal-title">{t('termsOfServiceTitle')}</h1>
        <p className="legal-updated">
          {t('lastUpdated')}: {lastUpdated}
        </p>
      </div>

      <div className="legal-content">
        {/* Introduction */}
        <section className="legal-section">
          <h2>{isJapanese ? '第1条（はじめに）' : '1. Introduction'}</h2>
          <p>
            {isJapanese
              ? `本利用規約（以下「本規約」）は、${SELLER_INFO.businessName}（以下「当社」）が提供するブラウザ拡張機能「adalab shield」（以下「本サービス」）の利用条件を定めるものです。本サービスをご利用いただく前に、本規約をよくお読みください。`
              : `These Terms of Service ("Terms") govern your use of the adalab shield browser extension ("Service") provided by ${SELLER_INFO.businessName} ("we", "us", or "our"). Please read these Terms carefully before using the Service.`}
          </p>
        </section>

        {/* Agreement to Terms */}
        <section className="legal-section">
          <h2>
            {isJapanese ? '第2条（規約への同意）' : '2. Agreement to Terms'}
          </h2>
          <p>
            {isJapanese
              ? '本サービスをインストールまたは使用することにより、お客様は本規約に同意したものとみなされます。本規約に同意されない場合は、本サービスをご利用いただけません。'
              : 'By installing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the Service.'}
          </p>
        </section>

        {/* Service Description */}
        <section className="legal-section">
          <h2>
            {isJapanese ? '第3条（サービス内容）' : '3. Service Description'}
          </h2>
          <p>
            {isJapanese
              ? 'adalab shieldは、ショート動画コンテンツをブロックし、生産性向上を支援するブラウザ拡張機能です。'
              : 'adalab shield is a browser extension designed to block short-form video content and help users improve their productivity.'}
          </p>
          <ul>
            <li>
              {isJapanese
                ? 'YouTube Shorts、TikTok、Instagram Reels等のショート動画のブロック'
                : 'Blocking short-form videos from YouTube Shorts, TikTok, Instagram Reels, etc.'}
            </li>
            <li>
              {isJapanese
                ? 'フォーカスモード、ポモドーロタイマー等の生産性ツール'
                : 'Productivity tools including Focus Mode and Pomodoro Timer'}
            </li>
            <li>
              {isJapanese
                ? '使用状況の統計表示'
                : 'Usage statistics and reporting'}
            </li>
          </ul>
        </section>

        {/* Free of Charge */}
        <section className="legal-section">
          <h2>{isJapanese ? '第4条（利用料金）' : '4. Fees'}</h2>
          <p>
            {isJapanese
              ? '本サービスのすべての機能は無料で提供されます。'
              : 'All features of the Service are provided free of charge.'}
          </p>
        </section>

        {/* User Responsibilities */}
        <section className="legal-section">
          <h2>
            {isJapanese ? '第5条（禁止事項）' : '5. Prohibited Activities'}
          </h2>
          <p>{isJapanese ? '以下の行為を禁止します：' : 'You agree not to:'}</p>
          <ul>
            <li>
              {isJapanese
                ? '本サービスのリバースエンジニアリング、逆コンパイル、または逆アセンブル'
                : 'Reverse engineer, decompile, or disassemble the Service'}
            </li>
            <li>
              {isJapanese
                ? '本サービスを違法な目的で使用すること'
                : 'Use the Service for any illegal purpose'}
            </li>
            <li>
              {isJapanese
                ? '本サービスの改変、派生物の作成'
                : 'Modify the Service or create derivative works'}
            </li>
            <li>
              {isJapanese
                ? 'アカウントの共有または譲渡'
                : 'Share or transfer your account'}
            </li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section className="legal-section">
          <h2>
            {isJapanese ? '第6条（知的財産権）' : '6. Intellectual Property'}
          </h2>
          <p>
            {isJapanese
              ? '本サービスおよびそのコンテンツに関するすべての知的財産権は、当社または当社のライセンサーに帰属します。'
              : 'All intellectual property rights in the Service and its content belong to us or our licensors.'}
          </p>
        </section>

        {/* Disclaimer */}
        <section className="legal-section">
          <h2>{isJapanese ? '第7条（免責事項）' : '7. Disclaimer'}</h2>
          <p>
            {isJapanese
              ? '本サービスは「現状有姿」で提供されます。当社は、本サービスの中断、エラー、または不具合について責任を負いません。'
              : 'The Service is provided "as is" without warranties of any kind. We are not responsible for any interruption, errors, or defects in the Service.'}
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="legal-section">
          <h2>
            {isJapanese ? '第8条（責任制限）' : '8. Limitation of Liability'}
          </h2>
          <p>
            {isJapanese
              ? '当社の責任は、お客様が支払った金額を上限とします。いかなる場合も、間接的、偶発的、特別、結果的、または懲罰的損害について責任を負いません。'
              : 'Our liability is limited to the amount you paid for the Service. In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages.'}
          </p>
        </section>

        {/* Termination */}
        <section className="legal-section">
          <h2>{isJapanese ? '第9条（解約）' : '9. Termination'}</h2>
          <p>
            {isJapanese
              ? 'お客様はいつでも本サービスの利用を停止できます。当社は、本規約に違反した場合、サービスへのアクセスを停止する権利を有します。'
              : 'You may stop using the Service at any time. We reserve the right to suspend access to the Service if you violate these Terms.'}
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="legal-section">
          <h2>
            {isJapanese ? '第10条（規約の変更）' : '10. Changes to Terms'}
          </h2>
          <p>
            {isJapanese
              ? '当社は、本規約を随時変更する権利を有します。重要な変更がある場合は、事前にお知らせします。'
              : 'We may modify these Terms at any time. We will notify you of any significant changes in advance.'}
          </p>
        </section>

        {/* Governing Law */}
        <section className="legal-section">
          <h2>{isJapanese ? '第11条（準拠法）' : '11. Governing Law'}</h2>
          <p>
            {isJapanese
              ? '本規約は日本法に準拠し、東京地方裁判所を第一審の専属的合意管轄裁判所とします。'
              : 'These Terms are governed by the laws of Japan. Any disputes shall be subject to the exclusive jurisdiction of the Tokyo District Court.'}
          </p>
        </section>

        {/* Contact */}
        <section className="legal-section">
          <h2>{isJapanese ? '第12条（お問い合わせ）' : '12. Contact Us'}</h2>
          <p>
            {isJapanese
              ? '本規約に関するお問い合わせは、以下までご連絡ください。'
              : 'If you have any questions about these Terms, please contact us at:'}
          </p>
          <p className="legal-contact">
            {SELLER_INFO.businessName}
            <br />
            Email: {SELLER_INFO.email}
          </p>
        </section>

        {/* Links */}
        <section className="legal-section">
          <h2>{isJapanese ? '関連リンク' : 'Related Links'}</h2>
          <ul className="legal-links">
            <li>
              <a href={LEGAL_URLS.privacyPolicy}>{t('privacyPolicyTitle')}</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
