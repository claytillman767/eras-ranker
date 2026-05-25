import { useState } from 'react';
import { SignInRequiredStep } from './Settings';

// Shown ONCE on a user's first Vibe Check (gated by 'eras_vibecheck_intro_seen').
// Introduces the Vibe Check rating flow and shows the Pro perks list as the
// upsell hook.
//
// CTA logic depends on user state:
//   - signed-out / non-Pro: "Unlock Pro" + "Maybe later". Tapping Unlock
//     without sign-in routes through a "Sign in to continue" step (matches
//     Settings ProModal).
//   - Pro: no upgrade CTA — just "Maybe later" to continue.
//
// onContinue() is called whenever the user dismisses the screen (Skip, Maybe
// later, or after a sign-in redirect fires). Sign-in redirects off-page, so
// the flag is set before the redirect — when they return, no second showing.
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
  unlockPro,
  signIn,
  onContinue,
}) {
  const [step, setStep] = useState('intro');

  function dismiss() {
    markVibeCheckIntroSeen();
    onContinue();
  }

  function handleUnlock() {
    if (!user) {
      // Let the user commit to upgrading first, THEN ask them to sign in
      setStep('signin');
      return;
    }
    unlockPro?.();
  }

  function handleSignInRedirect() {
    markVibeCheckIntroSeen();
    signIn?.(); // redirects to Google OAuth
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg)',
      zIndex: 9000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Top — Skip (always visible so the user can bail out at any step) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px' }}>
        <button
          onClick={dismiss}
          aria-label="Skip intro"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-3)',
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
        {/* Hero */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 56 }}>🎧</span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: 10,
        }}>
          Vibe Check
        </div>

        {/* Description */}
        <div style={{
          fontSize: 14,
          color: 'var(--text-2)',
          lineHeight: 1.6,
          marginBottom: 16,
          maxWidth: 360,
        }}>
          Tap through a few quick questions per song and we'll turn your
          answers into a score — the fastest way to rank a whole album.
        </div>

        {/* Everything Pro unlocks */}
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-grad-a), var(--accent-soft))',
          border: '0.5px solid var(--accent-soft-2)',
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
            color: 'var(--brand-text)',
            letterSpacing: '0.08em',
            marginBottom: 14,
          }}>
            EVERYTHING PRO UNLOCKS
          </div>

          {[
            {
              icon: '📊',
              title: '8 extra rating categories',
              desc: 'Hook, Vocals, Cry Factor, and more.',
            },
            {
              icon: '✏️',
              title: 'Custom categories',
              desc: 'Add your own scoring dimensions.',
            },
            {
              icon: '🏆',
              title: 'Custom brackets',
              desc: 'Build your own song tournaments.',
            },
          ].map((item, i, arr) => (
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
                background: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 18,
              }}>
                {item.icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                  {item.desc}
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
          <>
            {/* Price/positioning line — matches every other upgrade surface */}
            <div style={{
              fontSize: 13,
              color: 'var(--text-2)',
              textAlign: 'center',
              lineHeight: 1.5,
              marginBottom: 12,
            }}>
              A one-time $3.99 unlock — yours forever, no subscription.
            </div>
            <button
              onClick={handleUnlock}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
                marginBottom: 10,
              }}
            >
              ⭐ Unlock — $3.99 one time
            </button>
          </>
        )}

        {/* Always show a neutral dismiss — user can opt out at any state */}
        <button
          onClick={dismiss}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '0.5px solid var(--control-off)',
            background: 'var(--surface)',
            color: 'var(--text-2)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Maybe later
        </button>
      </div>
      </>
      )}
    </div>
  );
}
