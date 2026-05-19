import { useState } from 'react';
import { SignInRequiredStep } from './Settings';

// Paywall card shown at the bottom of the Categories tab for free users.
// One-time $3.99 unlock — no subscription, no plan picker. unlockPro()
// opens the Lemon Squeezy one-time checkout (or no-ops until LS is wired).
//
// The unlock button is ALWAYS tappable — when no user is signed in,
// tapping it swaps the card to a "Sign in to continue" step instead of
// gating the decision up-front. This lets the user commit to unlocking
// before learning about the sign-in requirement, which felt friendlier.
export default function PaywallCard({ onUnlock, user, signIn }) {
  const [step, setStep] = useState('features');

  const features = [
    '8 extra rating categories',
    'Add your own custom categories',
    'Build your own custom brackets',
  ];

  function handleUnlock() {
    if (!user) {
      setStep('signin');
      return;
    }
    onUnlock();
  }

  return (
    <div style={{
      border: '0.5px solid #e9d5ff',
      borderRadius: 12,
      padding: 16,
      background: '#faf5ff',
      marginTop: 20,
    }}>
      {step === 'features' ? (
        <>
          {/* Header */}
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>Unlock everything</span>
          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 12px', lineHeight: 1.5 }}>
            A one-time $3.99 unlock — yours forever, no subscription.
          </p>

          {/* Feature list */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {features.map(item => (
              <li key={item} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8 }}>
                <span style={{ color: '#a855f7' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>

          {/* Unlock — always tappable; routes through sign-in step when no user */}
          <button
            onClick={handleUnlock}
            style={{
              width: '100%',
              background: '#a855f7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 0',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Unlock — $3.99 one time
          </button>
        </>
      ) : (
        <SignInRequiredStep
          onBack={() => setStep('features')}
          signIn={signIn}
        />
      )}
    </div>
  );
}
