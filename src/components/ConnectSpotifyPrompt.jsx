import SpotifyBadge from './SpotifyBadge';

// Auto-prompt shown immediately after a successful Pro upgrade, asking the
// user if they want to connect Spotify right now. This removes the
// three-tap detour through Settings → Spotify → Connect that used to
// follow every upgrade.
//
// Suppressed when:
//   - the user is already connected to Spotify (race-condition guard)
//   - the upgrade happened inside VibeCheckIntro (that screen has its own
//     adaptive Connect CTA, so a stacked prompt would be redundant)
export default function ConnectSpotifyPrompt({ onConnect, onDismiss, isLoading }) {
  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '28px 24px',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          textAlign: 'center',
        }}
      >
        {/* Celebration */}
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
          You're Pro!
        </div>
        <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 24 }}>
          Connect Spotify now to start the autoplay you just unlocked — and pull in real album art everywhere.
        </div>

        {/* Connect button — Spotify branding (green on white, logo + label) */}
        <button
          onClick={onConnect}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: isLoading ? '#9ca3af' : '#1DB954',
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 700,
            cursor: isLoading ? 'default' : 'pointer',
            boxShadow: isLoading ? 'none' : '0 4px 12px rgba(29,185,84,0.3)',
            marginBottom: 10,
          }}
        >
          <SpotifyBadge variant="white" size={24} />
          {isLoading ? 'Connecting…' : 'Connect Spotify'}
        </button>

        {/* Maybe later */}
        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '0.5px solid #e5e7eb',
            background: '#ffffff',
            color: '#6b7280',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Maybe later
        </button>

        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 14, lineHeight: 1.5 }}>
          You can connect any time from Settings → Spotify. Spotify Premium is required for in-app playback.
        </div>
      </div>
    </div>
  );
}
