import { useState } from 'react';
import { SignInRequiredStep } from './Settings';

// Paywall card shown at the bottom of the Categories tab for free users.
// In development: the unlock button immediately sets isPro=true (no real payment).
// In production: replace unlockPro() with a Lemon Squeezy Checkout call.
//
// Pro upgrades require a signed-in account. The unlock button is ALWAYS
// tappable — when no user is signed in, tapping it swaps the card to a
// "Sign in to continue" step instead of replacing the button up-front.
// This lets the user commit to upgrading before learning about the login
// requirement, which felt friendlier than gating their decision on it.
export default function PaywallCard({ onUnlock, user, signIn }) {
  const [step, setStep] = useState('features');
  const [plan, setPlan] = useState('monthly'); // monthly is the lower-commitment default

  function handleUnlock() {
    if (!user) {
      setStep('signin');
      return;
    }
    onUnlock(plan);
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
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>Unlock Pro</span>
          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 12px', lineHeight: 1.5 }}>
            Unlock extra categories, build your own custom scoring system, and have every song play while you rate.
          </p>

          {/* Feature list — Spotify *connection* is free for everyone (album art).
              The Pro perk is the in-app playback that connection unlocks. */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Songs autoplay through Spotify while you rate',
              'Jump straight to any song’s bridge',
              '8 new categories to score',
              'Add your own custom categories',
              'Export your full rankings list',
            ].map(item => (
              <li key={item} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8 }}>
                <span style={{ color: '#a855f7' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>

          {/* Plan picker */}
          <PlanPicker plan={plan} onChange={setPlan} compact />

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
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: 12,
            }}
          >
            {plan === 'annual'
              ? 'Subscribe — $46.71/year'
              : 'Subscribe — $4.99/month'}
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

function PlanCard({ id, title, price, sub, badge, selected, onSelect, sizes }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      style={{
        flex: 1,
        textAlign: 'left',
        padding: sizes.pad,
        borderRadius: 10,
        border: selected ? '2px solid #a855f7' : '1px solid #e5e7eb',
        background: '#ffffff',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: selected ? '0 2px 8px rgba(168,85,247,0.15)' : 'none',
      }}
    >
      {badge && (
        <span style={{
          position: 'absolute',
          top: -8,
          right: 8,
          background: '#a855f7',
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 999,
          letterSpacing: 0.3,
        }}>
          {badge}
        </span>
      )}
      <div style={{ fontSize: sizes.title, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: sizes.price, fontWeight: 700, color: '#111827' }}>
        {price}
      </div>
      <div style={{ fontSize: sizes.sub, color: '#6b7280', marginTop: 2 }}>
        {sub}
      </div>
    </button>
  );
}

// Plan picker — two side-by-side cards (Monthly / Annual). Annual shows the
// "Save 22%" tag. `compact` uses a tighter layout to fit inside PaywallCard.
export function PlanPicker({ plan, onChange, compact = false }) {
  const sizes = compact
    ? { pad: 10, title: 13, price: 15, sub: 11 }
    : { pad: 14, title: 14, price: 17, sub: 12 };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <PlanCard
        id="monthly"
        title="Monthly"
        price="$4.99"
        sub="per month"
        selected={plan === 'monthly'}
        onSelect={onChange}
        sizes={sizes}
      />
      <PlanCard
        id="annual"
        title="Annual"
        price="$46.71"
        sub="per year ($3.89/mo)"
        badge="SAVE 22%"
        selected={plan === 'annual'}
        onSelect={onChange}
        sizes={sizes}
      />
    </div>
  );
}
