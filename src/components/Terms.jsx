import { useEffect } from 'react';
import { LEGAL_VERSION, formatLegalDate } from '../data/legalVersion';

// Terms of Service reachable at /terms. Linked from the sign-in screen,
// Settings footer, and external services that ask for our terms URL.
//
// The displayed effective date is derived from LEGAL_VERSION in
// src/data/legalVersion.js — bump it there when these terms materially
// change, and the modal-driven re-acceptance flow handles the rest.
const EFFECTIVE_DATE = formatLegalDate(LEGAL_VERSION);

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms of Service · The Eras Ranker';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <a href="/" style={backLinkStyle}>← Back to The Eras Ranker</a>

        <h1 style={h1Style}>Terms of Service</h1>
        <div style={metaStyle}>
          Effective {EFFECTIVE_DATE} · Last updated {EFFECTIVE_DATE}
        </div>

        <div style={summaryStyle}>
          <strong>The short version.</strong> By using The Eras Ranker, you
          agree to these terms. You need to be at least 13 years old. Be
          decent to other people in anything you make public. Pro is a
          recurring subscription you can cancel any time, but past payments
          aren't refunded. The App is a fan-made project — Taylor Swift
          and her record labels have no involvement.
        </div>

        <h2 style={h2Style}>1. Agreement</h2>
        <p style={pStyle}>
          These Terms of Service (the "Terms") are a binding agreement
          between you and Clayton Tillman, an individual based in Texas,
          United States (referred to in these Terms as "we," "us," or
          "our"). The "App" means The Eras Ranker — the website at
          erasranker.com and any related mobile or downloadable versions.
        </p>
        <p style={pStyle}>
          By using the App in any way — including just browsing it
          without signing in — you agree to these Terms and to our{' '}
          <a href="/privacy" style={linkStyle}>Privacy Policy</a>. If you
          don't agree, please don't use the App.
        </p>

        <h2 style={h2Style}>2. Who can use the App</h2>
        <p style={pStyle}>
          You must be at least <strong>13 years old</strong> to use the
          App. If you live somewhere with a higher digital-consent age
          (for example, 16 in parts of the European Union), you must be
          at least that age. By using the App you confirm you meet this
          requirement.
        </p>
        <p style={pStyle}>
          When you sign in, the name and email associated with your
          Google account must be accurate. You may only create one
          account per person.
        </p>

        <h2 style={h2Style}>3. Your account</h2>
        <p style={pStyle}>
          You're responsible for everything that happens under your
          account, including keeping your Google sign-in credentials
          secure. If you think someone else has accessed your account,
          let us know at{' '}
          <a href="mailto:support@erasranker.com" style={linkStyle}>support@erasranker.com</a>
          {' '}and sign out of Google everywhere.
        </p>
        <p style={pStyle}>
          You can delete your account at any time from Settings → Delete
          my account. Deletion is permanent and cancels any active Pro
          subscription.
        </p>

        <h2 style={h2Style}>4. Acceptable use</h2>
        <p style={pStyle}>
          When you use the App, you agree not to:
        </p>
        <ul style={ulStyle}>
          <li>Use it for anything illegal or to harass, harm, or impersonate anyone</li>
          <li>Try to bypass our paywall, scrape our data at scale, or interfere with how the App works</li>
          <li>Reverse-engineer the App except where the law specifically allows it</li>
          <li>Upload anything that violates someone else's rights (including copyright, privacy, or publicity rights)</li>
          <li>Try to access another user's account or private data</li>
          <li>Build automated tools that hit our servers (bots, scrapers, etc.) without our written permission</li>
          <li>Use the App to train AI or machine-learning systems</li>
        </ul>
        <p style={pStyle}>
          If you do any of these, we may suspend or terminate your account.
        </p>

        <h2 style={h2Style}>5. Your content</h2>
        <p style={pStyle}>
          The App lets you create content — ratings, bracket picks, an
          optional public-profile bio, custom rating categories, and
          feedback messages (your "Content"). You keep ownership of your
          Content. By submitting it through the App, you grant us a
          worldwide, royalty-free license to store, display, and process
          your Content as needed to run the App and to show it to other
          users you've chosen to share it with (for example, anyone who
          has the link to your public profile).
        </p>
        <p style={pStyle}>
          You're responsible for your Content. We're not.
        </p>

        <h3 style={h3Style}>5.1 Public profile rules</h3>
        <p style={pStyle}>
          If you turn on the public profile feature, your bio and rankings
          become viewable by anyone with the link. Your bio cannot:
        </p>
        <ul style={ulStyle}>
          <li>Contain profanity, slurs, harassment, or threats</li>
          <li>Include URLs, domain names, or contact information</li>
          <li>Impersonate another person or business</li>
          <li>Promote anything illegal, sexual, or hateful</li>
        </ul>
        <p style={pStyle}>
          We use an automatic word filter to catch many violations, but
          we don't pre-review every bio. We may hide or remove any
          public-profile content that breaks these rules.
        </p>

        <h2 style={h2Style}>6. Pro subscription</h2>
        <p style={pStyle}>
          Some features of the App require a paid <strong>Pro</strong>{' '}
          subscription. Pro is offered as:
        </p>
        <ul style={ulStyle}>
          <li><strong>Monthly</strong> — $4.99 per month</li>
          <li><strong>Annual</strong> — $46.71 per year (a discount equivalent to about 22% off the monthly rate)</li>
        </ul>
        <p style={pStyle}>
          Prices are in US dollars and exclude any sales tax or VAT,
          which Lemon Squeezy adds at checkout based on your location.
        </p>

        <h3 style={h3Style}>6.1 Billing</h3>
        <p style={pStyle}>
          Pro payments are processed by Lemon Squeezy, Inc., who acts as
          the merchant of record. You're agreeing to Lemon Squeezy's own{' '}
          <a href="https://www.lemonsqueezy.com/terms" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            terms of service
          </a>
          {' '}for the payment portion. Your subscription renews
          automatically on the same date each month (or each year, for
          annual plans) until you cancel. We don't store your card
          number — only Lemon Squeezy does.
        </p>

        <h3 style={h3Style}>6.2 Cancellation</h3>
        <p style={pStyle}>
          You can cancel Pro at any time from the customer portal linked
          in Settings → Account. When you cancel, Pro features stay
          active until the end of your current billing period — there is
          no proration or refund for the unused portion. After that, your
          account returns to the free tier and your data stays intact.
        </p>

        <h3 style={h3Style}>6.3 Refunds</h3>
        <p style={pStyle}>
          We do not offer refunds for past Pro payments, except where
          required by law. If you believe you were charged in error,
          email{' '}
          <a href="mailto:support@erasranker.com" style={linkStyle}>support@erasranker.com</a>
          {' '}and we'll look into it. If you're in the European Union,
          the United Kingdom, or another jurisdiction with a statutory
          cooling-off period for digital subscriptions, you have the
          rights given to you by your local law and nothing in these
          Terms takes those away.
        </p>

        <h3 style={h3Style}>6.4 Price changes</h3>
        <p style={pStyle}>
          We may change Pro prices in the future. If we do, we'll notify
          you by email at least 30 days before the new price takes
          effect on your account. The new price never applies
          retroactively to time you've already paid for, and you can
          always cancel before it takes effect.
        </p>

        <h2 style={h2Style}>7. Account deletion and termination</h2>
        <p style={pStyle}>
          You can delete your account at any time from Settings → Delete
          my account. Doing so:
        </p>
        <ul style={ulStyle}>
          <li>Cancels any active Pro subscription effective immediately, with no refund of the current billing period</li>
          <li>Permanently deletes your account record and all data attached to it (ratings, brackets, public profile, etc.)</li>
          <li>Cannot be undone</li>
        </ul>
        <p style={pStyle}>
          We may suspend or terminate your account if you break these
          Terms, if we're legally required to, or if running your
          account becomes legally or technically impractical. If we
          terminate your account, we'll refund any Pro payment for time
          you've already paid for but not used (this is the only refund
          situation under these Terms).
        </p>

        <h2 style={h2Style}>8. Intellectual property</h2>
        <p style={pStyle}>
          The App itself — its code, design, layout, written content,
          logos, and the way features fit together — belongs to Clayton
          Tillman. You may not copy, modify, distribute, or create a
          competing product based on the App without our written
          permission.
        </p>
        <p style={pStyle}>
          Album titles, song titles, and artist names are factual
          information used to describe the music being rated. The App
          does not reproduce album cover artwork and does not play song
          audio — albums are shown as simple colored tiles.
        </p>
        <p style={pStyle}>
          <strong>Not affiliated with Taylor Swift or her record labels.</strong>{' '}
          The Eras Ranker is an independent fan-made project. It is not
          affiliated with, endorsed by, sponsored by, or otherwise
          connected to Taylor Swift, TAS Rights Management, LLC, Republic
          Records, UMG Recordings, Inc., or Big Machine Label Group. All
          trademarks and rights to the underlying music belong to their
          respective owners.
        </p>
        <p style={pStyle}>
          The App does not display song lyrics in its current released
          version.
        </p>

        <h2 style={h2Style}>9. DMCA and copyright concerns</h2>
        <p style={pStyle}>
          If you believe something in the App infringes your copyright,
          email{' '}
          <a href="mailto:dmca@erasranker.com" style={linkStyle}>dmca@erasranker.com</a>
          {' '}with: a description of the work, where in the App you saw
          it, your contact information, a statement that you have a good
          faith belief the use is not authorized, and a statement under
          penalty of perjury that the information is accurate and you're
          authorized to act for the copyright owner. We'll respond
          within a reasonable time.
        </p>

        <h2 style={h2Style}>10. Disclaimers</h2>
        <p style={pStyle}>
          The App is provided <strong>"as is" and "as available."</strong>{' '}
          To the maximum extent permitted by law, we make no warranties
          of any kind — express, implied, statutory, or otherwise —
          about the App, including warranties of merchantability,
          fitness for a particular purpose, non-infringement, or that
          the App will be uninterrupted, accurate, or error-free.
        </p>
        <p style={pStyle}>
          We don't guarantee that:
        </p>
        <ul style={ulStyle}>
          <li>The App will always be available or work without errors</li>
          <li>Your data will never be lost (we strongly encourage you to keep your own backups of anything you care about)</li>
          <li>Third-party services we rely on (Google, Lemon Squeezy, Vercel) will always be available</li>
          <li>Any rating, ranking, or community result on the App is "accurate" — it's a personal opinion tool</li>
        </ul>

        <h2 style={h2Style}>11. Limitation of liability</h2>
        <p style={pStyle}>
          To the maximum extent permitted by law, our total liability to
          you for any claim arising out of or related to the App or
          these Terms is limited to the greater of:
        </p>
        <ul style={ulStyle}>
          <li>The amount you actually paid us in the twelve months before the event giving rise to the claim, or</li>
          <li>One hundred US dollars ($100.00)</li>
        </ul>
        <p style={pStyle}>
          We are not liable for indirect, incidental, special,
          consequential, exemplary, or punitive damages — including lost
          profits, lost data, or loss of goodwill — even if we were
          warned that such damages were possible. Some jurisdictions
          don't allow these limits, so they may not apply to you in full.
        </p>

        <h2 style={h2Style}>12. Indemnification</h2>
        <p style={pStyle}>
          You agree to defend and hold us harmless from any third-party
          claim that arises out of (a) your misuse of the App, (b) your
          violation of these Terms, or (c) your Content. This includes
          reasonable attorney's fees and costs.
        </p>

        <h2 style={h2Style}>13. Governing law and disputes</h2>
        <p style={pStyle}>
          These Terms are governed by the laws of the <strong>State of
          Texas, United States</strong>, without regard to its
          conflict-of-laws rules. Any dispute arising out of or related
          to these Terms or the App will be brought exclusively in the
          state or federal courts located in <strong>Collin County, Texas</strong>,
          and you and we both consent to the jurisdiction of those courts.
        </p>
        <p style={pStyle}>
          Before filing a lawsuit, you agree to first email{' '}
          <a href="mailto:legal@erasranker.com" style={linkStyle}>legal@erasranker.com</a>
          {' '}with a description of your concern and to give us 30 days
          to resolve it informally.
        </p>
        <p style={pStyle}>
          You and we both agree to bring claims only on an individual
          basis. <strong>You waive the right to bring or participate in
          a class action, class arbitration, or other representative
          action</strong> related to the App.
        </p>

        <h2 style={h2Style}>14. Changes to these Terms</h2>
        <p style={pStyle}>
          We may update these Terms from time to time. When we do, we'll
          update the "Last updated" date at the top of this page. For
          material changes (anything that meaningfully reduces your
          rights or increases your obligations), we'll also send an
          email to the address on your account at least 30 days before
          the change takes effect. Continuing to use the App after the
          change takes effect means you accept the new Terms. If you
          don't, you can delete your account.
        </p>

        <h2 style={h2Style}>15. Miscellaneous</h2>
        <p style={pStyle}>
          If any part of these Terms is found to be unenforceable, the
          rest of the Terms still apply. Our failure to enforce a right
          isn't a waiver of that right. These Terms, together with the
          Privacy Policy, are the entire agreement between you and us
          about the App. You can't transfer your rights or obligations
          under these Terms; we can transfer ours, for example if the
          App is acquired by another company.
        </p>

        <h2 style={h2Style}>16. Contact</h2>
        <p style={pStyle}>
          Support and general questions:{' '}
          <a href="mailto:support@erasranker.com" style={linkStyle}>support@erasranker.com</a>
          <br />
          Legal notices:{' '}
          <a href="mailto:legal@erasranker.com" style={linkStyle}>legal@erasranker.com</a>
        </p>
        <p style={pStyle}>
          Mailing address:
          <br />
          Clayton Tillman
          <br />
          1815 Prairie View Dr
          <br />
          Princeton, TX 75407
          <br />
          United States
        </p>

        <div style={{ height: 40 }} />

        <div style={footerLinksStyle}>
          <a href="/privacy" style={linkStyle}>Privacy Policy</a>
          {' · '}
          <a href="/" style={linkStyle}>Back to The Eras Ranker</a>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const pageStyle = {
  minHeight: '100dvh',
  background: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#111827',
  WebkitFontSmoothing: 'antialiased',
};

const containerStyle = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '32px 20px 60px',
  lineHeight: 1.6,
};

const backLinkStyle = {
  display: 'inline-block',
  fontSize: 13,
  color: '#7c3aed',
  textDecoration: 'none',
  marginBottom: 24,
};

const h1Style = {
  fontSize: 28,
  fontWeight: 700,
  color: '#111827',
  margin: '0 0 6px',
  lineHeight: 1.2,
};

const metaStyle = {
  fontSize: 13,
  color: '#9ca3af',
  marginBottom: 24,
};

const summaryStyle = {
  background: '#f9fafb',
  border: '0.5px solid #e5e7eb',
  borderRadius: 10,
  padding: '14px 16px',
  fontSize: 14,
  color: '#374151',
  marginBottom: 28,
  lineHeight: 1.6,
};

const h2Style = {
  fontSize: 19,
  fontWeight: 600,
  color: '#111827',
  margin: '32px 0 10px',
  lineHeight: 1.3,
};

const h3Style = {
  fontSize: 15,
  fontWeight: 600,
  color: '#1f2937',
  margin: '20px 0 6px',
};

const pStyle = {
  fontSize: 14,
  color: '#374151',
  margin: '0 0 12px',
  lineHeight: 1.65,
};

const ulStyle = {
  fontSize: 14,
  color: '#374151',
  margin: '0 0 12px',
  paddingLeft: 22,
  lineHeight: 1.7,
};

const linkStyle = {
  color: '#7c3aed',
  textDecoration: 'underline',
};

const footerLinksStyle = {
  fontSize: 13,
  color: '#9ca3af',
  textAlign: 'center',
  borderTop: '0.5px solid #e5e7eb',
  paddingTop: 20,
  marginTop: 20,
};
