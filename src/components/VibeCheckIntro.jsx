import { useState } from 'react';
import SpotifyBadge from './SpotifyBadge';
import { SignInRequiredStep } from './Settings';

// Shown ONCE on a user's first Vibe Check (gated by 'eras_vibecheck_intro_seen').
// Teaches the Spotify integration so users understand why they'd want it,
// and shows the full Pro perks list as the upsell hook.
//
// CTA logic depends on user state:
//   - signed-out / non-Pro:    "Unlock Pro"      + "Continue without sound"
//                              Tapping Unlock without sign-in routes through a
//                              "Sign in to continue" step (matches Settings ProModal).
//   - Pro but not connected:   "Connect Spotify" + "Continue without sound"
//   - Pro + connected:         suppressed by App — already enjoying the feature.
//
// onContinue() is called whenever the user dismisses the screen (Skip, Continue
// without sound, or after sign-in/connect redirects fire). Connect-Spotify and
// Sign-in redirect off-page, so the flag is set before the redirect — when they
// return, no second showing.
const FLAG_KEY = 'eras_vibecheck_intro_seen';

export function markVibeCheckIntroSeen() {
  localStorage.setItem(FLAG_KEY, '1');
}

export function hasSeenVibeCheckIntro() {
  return localStorage.getItem(FLAG_KEY) === '1';
}

// Full Pro perks list — shown together so users see the whole value of Pro
// at the moment it matters most (their first Vibe Check). Order is roughly
// "what they'll experience first" → "deeper customisation".
const PRO_PERKS = [
  {
    icon: '🎵',
    label: 'Songs play while you rate',
    desc: 'Each song auto-plays from a hand-picked moment as the screen opens.',
  },
  {
    icon: '💿',
    label: 'Real album cover art',
    desc: 'Real Spotify covers replace the emoji tiles across the whole app.',
  },
  {
    icon: '🌉',
    label: 'Jump straight to the bridge',
    desc: "On the Bridge category, tap one button to skip right to the song's bridge.",
  },
  {
    icon: '📊',
    label: '8 extra rating categories',
    desc: 'Hook, Vocals, Cry Factor, Storytelling and more.',
  },
  {
    icon: '✏️',
    label: 'Custom categories',
    desc: 'Add your own scoring dimensions and tune their weights.',
  },
];

export default function VibeCheckIntro({
  user,
  isPro,
  spotify,
  unlockPro,
  signIn,
  onContinue,
}) {
  const [step, setStep] = useState('intro');

  function dismiss() {
    markVibeCheckIntroSeen();
    onContinue();
  }

  function handleConnect() {
    markVibeCheckIntroSeen();
    spotify?.connect?.(); // redirects to Spotify OAuth
  }

  function handleUnlock() {
    if (!user) {
      // Let the user commit to upgrading first, THEN ask them to sign in
      setStep('signin');
      return;
    }
    unlockPro?.(); // mock for now; on success re-renders with Connect CTA
  }

  function handleSignInRedirect() {
    markVibeCheckIntroSeen();
    signIn?.(); // redirects to Google OAuth
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#ffffff',
      zIndex: 9000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Top — Skip (always visible so the user can bail out at any step) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px' }}>
        <button
          onClick={dismiss}
          aria-label="Skip Spotify intro"
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '6px 10px',
          }}
        >
          Skip
        </button>
      </div>

      {step === 'signin' ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 24px',
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <SignInRequiredStep
            onBack={() => setStep('intro')}
            signIn={handleSignInRedirect}
          />
        </div>
      ) : (
      <>
      {/* Body — scrolls when the perks list overflows on small screens */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'center',
        overflowY: 'auto',
      }}>
        {/* Hero — headphones + Spotify */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 56 }}>🎧</span>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          }}>
            <SpotifyBadge size={48} />
          </div>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#111827',
          marginBottom: 10,
        }}>
          Hear it. Rate it.
        </div>

        {/* Description */}
        <div style={{
          fontSize: 14,
          color: '#6b7280',
          lineHeight: 1.6,
          marginBottom: 24,
          maxWidth: 360,
        }}>
          Connect Spotify and each song plays automatically during your Vibe Check —
          so you can <b style={{ color: '#111827' }}>really hear it</b> before you rate.
        </div>

        {/* Pro perks — full list of what Pro unlocks */}
        <div style={{
          background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
          border: '0.5px solid #e9d5ff',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 8,
          textAlign: 'left',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#a855f7',
            letterSpacing: '0.08em',
            marginBottom: 12,
          }}>
            EVERYTHING PRO UNLOCKS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PRO_PERKS.map(perk => (
              <div key={perk.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 16,
                }}>
                  {perk.icon}
                </div>
                <div style={{ minWidth: 0, paddingTop: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                    {perk.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
                    {perk.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{
        padding: '20px 24px 32px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Unlock Pro — primary CTA for any non-Pro user (signed-in or not).
            Tapping without sign-in routes through the signin step instead. */}
        {!isPro && (
          <button
            onClick={handleUnlock}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
              marginBottom: 10,
            }}
          >
            ⭐ Unlock Pro
          </button>
        )}

        {isPro && !spotify?.isConnected && (
          <button
            onClick={handleConnect}
            disabled={spotify?.isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: spotify?.isLoading ? '#a7f3d0' : '#1DB954',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              cursor: spotify?.isLoading ? 'default' : 'pointer',
              boxShadow: '0 4px 12px rgba(29,185,84,0.3)',
              marginBottom: 10,
            }}
          >
            <SpotifyBadge variant="white" size={22} />
            {spotify?.isLoading ? 'Connecting…' : 'Connect Spotify'}
          </button>
        )}

        {/* Always show "Continue without sound" — user can opt out at any state */}
        <button
          onClick={dismiss}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '0.5px solid #d1d5db',
            background: '#ffffff',
            color: '#4b5563',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Continue without sound
        </button>
      </div>
      </>
      )}
    </div>
  );
}
