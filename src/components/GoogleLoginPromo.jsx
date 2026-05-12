import { useEffect } from 'react';

// Shown ONCE per device, after the Welcome tour and before the SpotifyIntro,
// pitching Google sign-in as the natural way to keep ratings on every
// device. Skip-able with a "Not now" button — the user can still sign in
// later from the header avatar or Settings → Account.
//
// Auto-skips when a Google account is already connected (e.g. a returning
// user signed in via the header avatar in a previous session). In that
// case the promo flag is set behind the scenes so the screen never tries
// to reappear.
//
// localStorage flag: eras_google_login_promo_seen — set on either Sign in
// or Not now. Also set automatically when the auto-skip path runs.

const PROMO_KEY = 'eras_google_login_promo_seen';

export function hasSeenGoogleLoginPromo() {
  return localStorage.getItem(PROMO_KEY) === '1';
}

export function markGoogleLoginPromoSeen() {
  localStorage.setItem(PROMO_KEY, '1');
}

export default function GoogleLoginPromo({ user, signIn, onContinue }) {
  // Auto-skip when a Google account is already connected — the promo is
  // only useful to a user who's not yet signed in.
  useEffect(() => {
    if (user) {
      markGoogleLoginPromoSeen();
      onContinue();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSignIn() {
    markGoogleLoginPromoSeen();
    signIn?.(); // redirects to Google OAuth — won't return to this screen
  }

  function handleSkip() {
    markGoogleLoginPromoSeen();
    onContinue();
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(180deg, #fdf4ff 0%, #ffffff 50%, #eff6ff 100%)',
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowY: 'auto',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 24px 32px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Hero — two devices with a sync arrow between them */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          marginBottom: 28,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#ffffff',
            border: '0.5px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            fontSize: 30,
            animation: 'glp-pop 0.5s 0s cubic-bezier(0.2, 0.8, 0.3, 1.2) both',
          }}>
            📱
          </div>
          <div style={{
            fontSize: 26,
            color: '#a855f7',
            animation: 'glp-pop 0.5s 0.12s cubic-bezier(0.2, 0.8, 0.3, 1.2) both',
          }}>
            ↔
          </div>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#ffffff',
            border: '0.5px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            fontSize: 30,
            animation: 'glp-pop 0.5s 0.24s cubic-bezier(0.2, 0.8, 0.3, 1.2) both',
          }}>
            💻
          </div>
        </div>

        <style>{`
          @keyframes glp-pop {
            0%   { transform: scale(0.4) translateY(10px); opacity: 0; }
            60%  { transform: scale(1.06) translateY(-2px); opacity: 1; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Heading */}
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#111827',
          textAlign: 'center',
          marginBottom: 10,
          lineHeight: 1.25,
        }}>
          Keep your rankings on every device
        </div>
        <div style={{
          fontSize: 14,
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          Sign in with Google so your ratings, brackets, and settings
          follow you to your phone, tablet, and laptop. Without an
          account, your data only lives on this browser.
        </div>

        {/* Sign in with Google — primary CTA, Google-branded white-on-grey */}
        <button
          onClick={handleSignIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#111827',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            marginBottom: 10,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Sign in with Google
        </button>

        {/* Not now — secondary bypass */}
        <button
          onClick={handleSkip}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '0.5px solid #e5e7eb',
            background: '#ffffff',
            color: '#6b7280',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: 14,
          }}
        >
          Not now
        </button>

        {/* Footer note */}
        <div style={{
          fontSize: 11,
          color: '#9ca3af',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          You can sign in any time from Settings → Account.
          Pro (extra categories, custom scoring, and more) needs a signed-in account.
        </div>
      </div>
    </div>
  );
}
