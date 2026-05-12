import { useEffect } from 'react';

// Privacy policy reachable at /privacy. Linked from the sign-in screen,
// Settings footer, and (eventually) external requests like Lemon Squeezy
// onboarding and Google OAuth verification.
//
// To update: bump EFFECTIVE_DATE and edit the relevant section. The same
// date shows at the top and in the "Changes to this policy" section.
const EFFECTIVE_DATE = 'May 12, 2026';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy · The Eras Ranker';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <a href="/" style={backLinkStyle}>← Back to The Eras Ranker</a>

        <h1 style={h1Style}>Privacy Policy</h1>
        <div style={metaStyle}>
          Effective {EFFECTIVE_DATE} · Last updated {EFFECTIVE_DATE}
        </div>

        <div style={summaryStyle}>
          <strong>The short version.</strong> The Eras Ranker is a personal
          music-ranking app. We collect only what's needed to remember your
          ratings, keep them in sync across your devices, and process Pro
          subscriptions. We don't sell your data and we don't show you ads.
          You can delete your account and everything connected to it at any
          time from Settings → Delete my account.
        </div>

        <h2 style={h2Style}>1. Who we are</h2>
        <p style={pStyle}>
          The Eras Ranker (this "App") is operated by Clayton Tillman, an
          individual based in Texas, United States. In this policy, "we,"
          "us," and "our" refer to that operator. You can reach us at{' '}
          <a href="mailto:privacy@erasranker.com" style={linkStyle}>privacy@erasranker.com</a>
          {' '}for privacy questions, or at{' '}
          <a href="mailto:support@erasranker.com" style={linkStyle}>support@erasranker.com</a>
          {' '}for everything else. Our mailing address is at the bottom of
          this page.
        </p>

        <h2 style={h2Style}>2. What data we collect</h2>
        <p style={pStyle}>
          We try to collect as little as we can while still making the App
          work. Here's the complete list:
        </p>

        <h3 style={h3Style}>2.1 Account information (when you sign in)</h3>
        <p style={pStyle}>
          The App uses Google sign-in. When you sign in, Google shares the
          following with us:
        </p>
        <ul style={ulStyle}>
          <li>Your name (display name on your Google account)</li>
          <li>Your email address</li>
          <li>Your Google profile picture URL</li>
          <li>A unique Google account ID (used to identify you across devices)</li>
        </ul>
        <p style={pStyle}>
          We do not see or store your Google password.
        </p>

        <h3 style={h3Style}>2.2 Your ratings and app activity</h3>
        <p style={pStyle}>
          As you use the App, we store the things you create inside it:
        </p>
        <ul style={ulStyle}>
          <li>Star ratings you give to individual songs</li>
          <li>Custom song orderings, album mode preferences, and category settings</li>
          <li>Bracket picks (personal brackets and weekly community brackets)</li>
          <li>Counters for how many songs you've rated, how many albums you've completed, and when you last opened the App</li>
          <li>Where you originally came from when you first visited the App (the referring website, if any, and any "ref" parameter in the URL)</li>
        </ul>

        <h3 style={h3Style}>2.3 Spotify connection (optional)</h3>
        <p style={pStyle}>
          Connecting Spotify is optional and free for everyone. If you
          connect it, here's exactly what happens to your data:
        </p>
        <ul style={ulStyle}>
          <li>
            Your Spotify access token is stored <strong>only in your
            browser's local storage</strong>. It is never sent to our
            servers and we never see it.
          </li>
          <li>
            We do save a small flag on your account that says "Spotify is
            currently connected" so the App can show the right options. We
            do not save your Spotify username, email, library, listening
            history, or playlists.
          </li>
          <li>
            We call the Spotify API directly from your browser to fetch
            album cover art and (for Spotify Premium users with Pro) to
            play songs. Those calls happen between your browser and
            Spotify; our servers are not in the middle.
          </li>
        </ul>

        <h3 style={h3Style}>2.4 Pro subscription and billing</h3>
        <p style={pStyle}>
          If you upgrade to Pro, payment is handled by{' '}
          <strong>Lemon Squeezy</strong>, an independent payment processor.
          We never see or store your full credit card number. From Lemon
          Squeezy's webhook, we receive and store:
        </p>
        <ul style={ulStyle}>
          <li>Your Lemon Squeezy customer ID and subscription ID</li>
          <li>Your subscription status (active, cancelled, past due, etc.) and the plan you're on (monthly or annual)</li>
          <li>The current billing period end date and, if you've cancelled, when access ends</li>
          <li>A one-time customer-portal URL that lets you manage your subscription</li>
        </ul>
        <p style={pStyle}>
          Lemon Squeezy has its own privacy policy at{' '}
          <a href="https://www.lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            lemonsqueezy.com/privacy
          </a>
          {' '}covering how they handle the payment side.
        </p>

        <h3 style={h3Style}>2.5 Public profile (only if you turn it on)</h3>
        <p style={pStyle}>
          Every account starts with the public profile turned <strong>off</strong>.
          If you turn it on in Settings → Public profile, the App publishes a
          copy of your album rankings and an optional short bio to a
          separate, publicly-readable record. Anyone with your profile link
          can then see it. You can turn the profile off at any time, which
          immediately hides it again.
        </p>

        <h3 style={h3Style}>2.6 Feedback submissions</h3>
        <p style={pStyle}>
          If you send us feedback through the in-app feedback button, we
          save your message along with: your name, email, account ID, the
          App version, your browser's user-agent string, the URL you were
          on, and which screen you were on when you submitted. We use this
          to follow up if needed and to fix bugs you describe.
        </p>

        <h3 style={h3Style}>2.7 Technical information, analytics, and error monitoring</h3>
        <p style={pStyle}>
          Like every website, basic technical information passes through
          our hosting provider when you visit the App — your IP address,
          the type of browser and device you're using, and the pages you
          visit. Our hosting provider (Vercel) may keep request logs for
          a short period for security and performance.
        </p>
        <p style={pStyle}>
          We may use a small number of analytics and error-monitoring
          tools to understand how the App is being used, find features
          that break, and improve the App over time. These tools may
          collect:
        </p>
        <ul style={ulStyle}>
          <li>Pages and screens you visit, and the actions you take inside the App (which buttons you tap, which steps of a flow you reach)</li>
          <li>Approximate location based on your IP address (typically your country and region — not your street address)</li>
          <li>Device and browser information (model, operating system, browser, screen size)</li>
          <li>Errors and crashes (the error message, the line of code that failed, and what you were doing at the time)</li>
          <li>Performance information (how quickly pages load on your device)</li>
        </ul>
        <p style={pStyle}>
          <strong>What we won't do.</strong> We don't sell this data,
          share it with advertising networks, use it to build
          advertising profiles, or use cookies to track you across other
          websites. The specific analytics and error-monitoring
          providers we currently use are listed in section 4 below.
        </p>

        <h3 style={h3Style}>2.8 What we don't collect</h3>
        <ul style={ulStyle}>
          <li>We don't run advertising or marketing trackers.</li>
          <li>We don't sell your data to anyone, ever.</li>
          <li>We don't collect your contacts, location, microphone, or camera.</li>
          <li>We don't read your Spotify playlists or listening history.</li>
        </ul>

        <h2 style={h2Style}>3. How we use your data</h2>
        <p style={pStyle}>
          We use the information above to:
        </p>
        <ul style={ulStyle}>
          <li>Remember your ratings and keep them synced across your devices</li>
          <li>Let you sign in and recognize you when you come back</li>
          <li>Charge for Pro subscriptions and unlock Pro features for paying users</li>
          <li>Show album art and play songs through Spotify (when you've connected it)</li>
          <li>Show your public profile to people you share the link with (only if you turn it on)</li>
          <li>Reply to your feedback and fix problems you report</li>
          <li>Power optional in-app features that analyze or summarize your ratings (see below)</li>
          <li>Keep the App secure and running (logs, basic abuse prevention)</li>
        </ul>

        <h3 style={h3Style}>3.1 AI-assisted features</h3>
        <p style={pStyle}>
          We may use AI tools — including services from third-party
          providers like Anthropic — to power optional features inside
          the App. Examples of what we might use AI for:
        </p>
        <ul style={ulStyle}>
          <li>Summarizing your music taste based on your ratings</li>
          <li>Suggesting songs you may enjoy</li>
          <li>Producing insights from community-wide rating patterns</li>
        </ul>
        <p style={pStyle}>
          When we use AI tools, we send only the minimum data needed for
          the feature, and we use providers whose terms prohibit them
          from training their own models on your data. If we add an
          AI-assisted feature, you'll see a clear description of what it
          does where it appears in the App, and the specific provider
          will be listed in section 4 below.
        </p>
        <p style={pStyle}>
          <strong>What we won't do.</strong> We won't sell your data to
          anyone, share it in bulk with third parties to train their AI
          models, or use your activity to build advertising profiles.
        </p>

        <h2 style={h2Style}>4. Who we share data with</h2>
        <p style={pStyle}>
          We share the minimum needed with the following service providers
          to make the App run. Each one has their own privacy policy you
          can read.
        </p>
        <ul style={ulStyle}>
          <li>
            <strong>Google (Firebase Authentication and Firestore)</strong> —
            handles your sign-in and stores your account data and ratings.{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Google's privacy policy
            </a>
          </li>
          <li>
            <strong>Vercel</strong> — hosts the App's website and code.{' '}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Vercel's privacy policy
            </a>
          </li>
          <li>
            <strong>Lemon Squeezy</strong> — processes Pro subscription
            payments.{' '}
            <a href="https://www.lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Lemon Squeezy's privacy policy
            </a>
          </li>
          <li>
            <strong>Spotify</strong> — provides album art and (for Premium
            accounts) song playback when you connect your Spotify account.{' '}
            <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Spotify's privacy policy
            </a>
          </li>
        </ul>
        <p style={pStyle}>
          We may also share your data if we have to — for example, in
          response to a valid legal request (court order, subpoena), to
          investigate fraud or abuse of the App, or if the App or its
          assets are ever sold or merged into another business. If the App
          is ever sold, you'll be notified by email before your data moves
          and you'll have a chance to delete your account first.
        </p>

        <h2 style={h2Style}>5. Where your data is stored</h2>
        <p style={pStyle}>
          Your data is stored on Google's Firebase platform and Vercel's
          servers. Both providers operate data centers in the United
          States, so if you're outside the US, your data is being
          transferred to and stored in the US. The legal mechanism for
          this transfer is the Standard Contractual Clauses approved by
          the European Commission.
        </p>

        <h2 style={h2Style}>6. Your rights</h2>
        <p style={pStyle}>
          You have the right to:
        </p>
        <ul style={ulStyle}>
          <li>
            <strong>See your data.</strong> Email{' '}
            <a href="mailto:privacy@erasranker.com" style={linkStyle}>privacy@erasranker.com</a>
            {' '}and we'll send you a copy of what we have on you within 30 days.
          </li>
          <li>
            <strong>Correct your data.</strong> You can change your name
            and profile picture by updating them on your Google account.
            For anything else, email us.
          </li>
          <li>
            <strong>Delete your data.</strong> Open Settings → Delete my
            account inside the App. This cancels any active Pro
            subscription, removes your public profile (if any), deletes
            your account record from our database, and signs you out
            permanently. Once deleted, your data cannot be recovered. You
            can also email us if you prefer.
          </li>
          <li>
            <strong>Export your data.</strong> Email us and we'll send you
            a JSON file of your ratings and account information.
          </li>
          <li>
            <strong>Withdraw your consent.</strong> You can disconnect
            Spotify at any time in Settings → Spotify. You can cancel Pro
            at any time from the customer portal linked in Settings →
            Account.
          </li>
        </ul>
        <p style={pStyle}>
          If you're in the European Union, the United Kingdom, or
          California, you have additional rights under your local privacy
          laws (including the right to object to certain uses of your
          data, the right to data portability, and the right to lodge a
          complaint with your local data-protection authority). Email us
          and we'll honor those rights.
        </p>

        <h2 style={h2Style}>7. Children</h2>
        <p style={pStyle}>
          The App is intended for users <strong>13 years of age or older</strong>.
          We do not knowingly collect data from children under 13. If you
          believe a child under 13 has signed up, please email{' '}
          <a href="mailto:privacy@erasranker.com" style={linkStyle}>privacy@erasranker.com</a>
          {' '}and we'll delete the account.
        </p>

        <h2 style={h2Style}>8. Cookies and local storage</h2>
        <p style={pStyle}>
          The App uses your browser's local storage (a private storage
          area on your device, like cookies but more capable) to remember
          your ratings, settings, and sign-in session, and to make the App
          work offline. We use a small number of cookies for things like
          keeping you signed in (set by Google as part of the sign-in
          flow) and, where applicable, by the analytics and
          error-monitoring tools described in section 2.7. We do not use
          advertising cookies, and we do not use cookies to track you
          across other websites.
        </p>

        <h2 style={h2Style}>9. Security</h2>
        <p style={pStyle}>
          We use industry-standard practices to protect your data —
          HTTPS encryption in transit, encryption at rest on Google and
          Vercel's infrastructure, and rule-based access controls so each
          account can only read its own data. No system is perfectly
          secure, but we take reasonable steps to keep yours safe.
        </p>
        <p style={pStyle}>
          If we ever discover a security incident that affects your data,
          we'll notify you by email at the address on your account within
          a reasonable time, with as much detail as we have at the time.
        </p>

        <h2 style={h2Style}>10. How long we keep your data</h2>
        <p style={pStyle}>
          We keep your account data for as long as your account exists.
          If you delete your account, we delete your data right away.
          Some records may stay in backups for a short period (typically
          30 days) before they roll off automatically.
        </p>
        <p style={pStyle}>
          Feedback messages are kept as long as they're useful for
          improving the App. Subscription records (invoices, payment
          confirmations) may be kept longer to meet tax and accounting
          requirements — typically 7 years under US law.
        </p>

        <h2 style={h2Style}>11. Changes to this policy</h2>
        <p style={pStyle}>
          We may update this policy from time to time. When we do, we'll
          update the "Last updated" date at the top of this page. For
          significant changes (anything that materially affects your
          rights), we'll also send an email to the address on your
          account at least 14 days before the change takes effect.
        </p>
        <p style={pStyle}>
          The current effective date of this policy is{' '}
          <strong>{EFFECTIVE_DATE}</strong>.
        </p>

        <h2 style={h2Style}>12. Contact us</h2>
        <p style={pStyle}>
          Privacy questions:{' '}
          <a href="mailto:privacy@erasranker.com" style={linkStyle}>privacy@erasranker.com</a>
          <br />
          General questions:{' '}
          <a href="mailto:support@erasranker.com" style={linkStyle}>support@erasranker.com</a>
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
          <a href="/terms" style={linkStyle}>Terms of Service</a>
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
