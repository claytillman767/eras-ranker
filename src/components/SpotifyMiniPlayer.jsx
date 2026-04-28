// Compact Spotify playback bar shown inside the QuickScore overlay.
// - If Spotify is connected + player is ready: shows song name + play/pause button.
// - If connected but not yet ready: shows "Connecting…"
// - If not connected: shows a small prompt linking to Settings.
//
// Spotify branding note: The green Spotify logo and wordmark are required by
// Spotify's design guidelines whenever playback attribution is shown.
export default function SpotifyMiniPlayer({
  isConnected,
  playerReady,
  isPlaying,
  songName,
  onTogglePlay,
  onGoToSettings, // called when the user taps the "Connect Spotify" prompt
}) {
  // ── Not connected — show a gentle prompt ────────────────────────────────
  if (!isConnected) {
    return (
      <button
        onClick={onGoToSettings}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: 'calc(100% - 40px)',
          margin: '0 20px 8px',
          padding: '8px 12px',
          background: '#f0fdf4',
          border: '0.5px solid #86efac',
          borderRadius: 10,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <SpotifyLogo size={16} />
        <span style={{ flex: 1, fontSize: 12, color: '#166534', lineHeight: 1.3 }}>
          Connect Spotify to hear songs while rating
        </span>
        <span style={{ fontSize: 11, color: '#16a34a' }}>→</span>
      </button>
    );
  }

  // ── Connected — show playback controls ───────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '0 20px 8px',
      padding: '8px 12px',
      background: '#f0fdf4',
      border: '0.5px solid #86efac',
      borderRadius: 10,
    }}>
      <SpotifyLogo size={18} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#15803d',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {playerReady ? (songName || '…') : 'Connecting…'}
        </div>
        <div style={{ fontSize: 9, color: '#4ade80', letterSpacing: '0.08em', marginTop: 1 }}>
          SPOTIFY
        </div>
      </div>

      {/* Play / Pause button — only shown once the SDK player is ready */}
      {playerReady && (
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#1DB954',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isPlaying ? (
            <svg width={11} height={11} viewBox="0 0 11 11" fill="white">
              <rect x="1"   y="0.5" width="3.5" height="10" rx="1" />
              <rect x="6.5" y="0.5" width="3.5" height="10" rx="1" />
            </svg>
          ) : (
            <svg width={11} height={11} viewBox="0 0 11 11" fill="white">
              <polygon points="1.5,0.5 10.5,5.5 1.5,10.5" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// Official Spotify "audio mark" — the three-arc icon with a green circle background.
function SpotifyLogo({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-label="Spotify"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      {/* Three white sound-wave arcs */}
      <path
        d="M17.25 16.31c-.19.31-.6.41-.91.22-2.49-1.52-5.63-1.87-9.33-1.02-.35.08-.7-.13-.79-.48-.08-.35.13-.7.48-.79 4.05-.93 7.52-.53 10.33 1.16.31.19.41.6.22.91zm1.26-2.81c-.24.38-.75.5-1.13.27-2.85-1.75-7.19-2.26-10.56-1.24-.43.13-.88-.11-1.01-.54-.13-.43.11-.88.54-1.01 3.86-1.17 8.66-.6 11.89 1.4.38.23.5.75.27 1.12zm.11-2.93c-3.42-2.03-9.07-2.21-12.33-1.22-.51.16-1.06-.13-1.22-.64-.16-.51.13-1.06.64-1.22C9.12 6.33 15.3 6.54 19.21 8.9c.46.27.61.86.34 1.32-.27.46-.86.61-1.32.34z"
        fill="white"
      />
    </svg>
  );
}
