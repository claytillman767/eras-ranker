// Paywall card shown at the bottom of the Categories tab for free users.
// In development: the unlock button immediately sets isPro=true (no real payment).
// In production: replace unlockPro() with a Stripe Checkout call.

export default function PaywallCard({ onUnlock }) {
  return (
    <div style={{
      border: '0.5px solid #e9d5ff',
      borderRadius: 12,
      padding: 16,
      background: '#faf5ff',
      marginTop: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>Unlock Pro</span>
        <span style={{ fontSize: 14, color: '#a855f7', fontWeight: 500 }}>🔒 $4.99</span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 12px', lineHeight: 1.5 }}>
        One-time payment, no subscription. Unlock extra categories and build your own custom scoring system.
      </p>

      {/* Feature list */}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          '8 new categories to score',
          'Add your own custom categories',
          'Adjust category weights',
          'Export your full rankings list',
        ].map(item => (
          <li key={item} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8 }}>
            <span style={{ color: '#a855f7' }}>✓</span>
            {item}
          </li>
        ))}
      </ul>

      {/* Unlock button */}
      <button
        onClick={onUnlock}
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
        }}
      >
        Unlock for $4.99 — one time
      </button>
    </div>
  );
}
