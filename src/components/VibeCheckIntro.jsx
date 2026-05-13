import { useState } from 'react';
import SpotifyBadge from './SpotifyBadge';
import Spinner from './Spinner';
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
      {/* Body — outer scroll container; inner uses margin:auto for vertical
          centering when there's room and natural top-aligned scrolling when
          the content is taller than the viewport. justify-content: center
          with overflow on the same element clips content above the scroll
          origin, which was hiding the hero icons on small phones. */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}>
      <div style={{
        margin: 'auto 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 24px',
        maxWidth: 480,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'center',
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
          marginBottom: 16,
          maxWidth: 360,
        }}>
          Hear each song before you rate it — so you can <b style={{ color: '#111827' }}>really hear it</b> before you score it.
        </div>

        {/* Everything Pro unlocks */}
        <div style={{
          background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
          border: '0.5px solid #e9d5ff',
          borderRadius: 16,
          padding: '16px 18px',
          marginBottom: 8,
          textAlign: 'left',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#a855f7',
            letterSpacing: '0.08em',
            marginBottom: 14,
          }}>
            EVERYTHING PRO UNLOCKS
          </div>

          {/* Pro perk list. Playback-dependent perks (Spotify-flagged below)
              are hidden when the user is connected to Spotify with a free
              account, since Pro alone can't unlock playback for them — only
              a Spotify Premium upgrade can. We show them by default for
              users who haven't connected yet (still possible they have
              Premium) and for connected Premium users (perks are real). */}
          {[
            {
              spotify: true,
              icon: '🎵',
              title: 'Songs autoplay while you rate',
              desc: 'Each song starts automatically from a hand-picked moment as the screen opens.',
            },
            {
              spotify: true,
              icon: '⏩',
              title: 'Really sit with each song',
              desc: 'Tap to revisit the chorus, bridge, opening line, or closing line — so the rating you give matches the song you actually heard.',
            },
            {
              spotify: false,
              icon: '📊',
              title: '8 extra rating categories',
              desc: 'Hook, Vocals, Cry Factor, Storytelling and more.',
            },
            {
              spotify: false,
              icon: '✏️',
              title: 'Custom categories',
              desc: 'Add your own scoring dimensions and tune their weights.',
            },
          ].filter(item => {
            const knownNonPremium = spotify?.isConnected && !spotify?.isPremium;
            return !(item.spotify && knownNonPremium);
          }).map((item, i, arr) => (
            <div
              key={item.title}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: i === arr.length - 1 ? 0 : 12,
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 18,
              }}>
                {item.spotify ? <SpotifyBadge size={24} /> : item.icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}

          {/* Spotify connection note — adapts to what we know about the user's
              Spotify account so the pitch never lies. */}
          <div style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '0.5px solid #e9d5ff',
            fontSize: 11,
            color: '#6b7280',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <SpotifyBadge size={24} />
            <span>
              {spotify?.isConnected && !spotify?.isPremium
                ? <>Your Spotify is free, so you'll see real album art everywhere. <b style={{ color: '#111827' }}>Spotify Premium</b> is needed for in-app playback (separate from Eras Ranker Pro).</>
                : <>Connect Spotify free for real album art everywhere. In-app playback needs a <b style={{ color: '#111827' }}>Spotify Premium</b> account.</>
              }
            </span>
          </div>
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
              background: spotify?.isLoading ? '#9ca3af' : '#1DB954',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              cursor: spotify?.isLoading ? 'default' : 'pointer',
              boxShadow: spotify?.isLoading ? 'none' : '0 4px 12px rgba(29,185,84,0.3)',
              marginBottom: 10,
            }}
          >
            {spotify?.isLoading ? (
              <Spinner size={20} />
            ) : (
              <SpotifyBadge variant="white" size={24} />
            )}
            {spotify?.isLoading ? 'Connecting to Spotify…' : 'Connect Spotify'}
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
