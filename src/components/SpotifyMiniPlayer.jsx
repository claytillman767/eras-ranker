import Spinner from './Spinner';

// Compact Spotify playback bar shown inside the QuickScore overlay.
// - If Spotify is connected + player is ready: shows song name + play/pause + "Open in Spotify" link.
// - If connected but player not yet ready: shows "Connecting…"
// - If not connected: shows a small prompt linking to Settings.
//
// Spotify branding compliance (developer.spotify.com/documentation/design):
//   • Logo (green icon) displayed on WHITE background only — never colored backgrounds.
//   • Minimum icon size: 21px. We use 24px.
//   • Spotify green (#1DB954) used ONLY for the logo, not for our own UI controls.
//   • "Open in Spotify" link provides required attribution / link-back.
export default function SpotifyMiniPlayer({
  isConnected,
  playerReady,
  isPlaying,
  songName,
  trackUri,        // spotify:track:xxx — used to build the "Open in Spotify" link
  onTogglePlay,
  onGoToSettings,  // called when the user taps the "Connect Spotify" prompt
  style,           // optional outer container style overrides
}) {
  // Convert a Spotify URI to a web URL for the "Open in Spotify" link
  // e.g. "spotify:track:abc123" → "https://open.spotify.com/track/abc123"
  function uriToUrl(uri) {
    if (!uri) return 'https://open.spotify.com';
    const parts = uri.split(':');
    return parts.length === 3
      ? `https://open.spotify.com/${parts[1]}/${parts[2]}`
      : 'https://open.spotify.com';
  }

  // ── Not connected — gentle prompt on white background ────────────────────
  if (!isConnected) {
    return (
      <button
        onClick={onGoToSettings}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: 'calc(100% - 40px)',
          margin: '0 20px 8px',
          padding: '9px 12px',
          background: '#ffffff',
          border: '0.5px solid #e5e7eb',
          borderRadius: 10,
          cursor: 'pointer',
          textAlign: 'left',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <SpotifyLogo size={24} />
        <span style={{ flex: 1, fontSize: 12, color: '#374151', lineHeight: 1.3 }}>
          Connect Spotify to hear songs while rating
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>→</span>
      </button>
    );
  }

  // ── Connected — playback controls on white background ────────────────────
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '0 20px 8px',
      padding: '9px 12px',
      background: '#ffffff',
      border: '0.5px solid #e5e7eb',
      borderRadius: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {/* Spotify logo — green on white is the only approved color combination */}
      <SpotifyLogo size={24} />

      {/* Song info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#111827',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {playerReady ? (
            songName || '…'
          ) : (
            <>
              <Spinner size={12} color="#a855f7" strokeWidth={3} />
              <span>Connecting to Spotify…</span>
            </>
          )}
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1, letterSpacing: '0.04em' }}>
          Powered by Spotify
        </div>
      </div>

      {/* Play / Pause — purple, not Spotify green (Spotify green reserved for the logo only) */}
      {playerReady && (
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#a855f7',
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
            <svg width={10} height={10} viewBox="0 0 10 10" fill="white">
              <rect x="1"   y="0" width="3" height="10" rx="1" />
              <rect x="6" y="0" width="3" height="10" rx="1" />
            </svg>
          ) : (
            <svg width={10} height={10} viewBox="0 0 10 10" fill="white">
              <polygon points="1,0 9,5 1,10" />
            </svg>
          )}
        </button>
      )}

      {/* "Open in Spotify" — required attribution link-back per Spotify guidelines */}
      {playerReady && (
        <a
          href={uriToUrl(trackUri)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title="Open in Spotify"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '0.5px solid #e5e7eb',
            color: '#9ca3af',
            textDecoration: 'none',
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          ↗
        </a>
      )}
    </div>
  );
}

// Official Spotify audio mark — green circle with three white arcs.
// Per Spotify guidelines: green version ONLY on white or black backgrounds.
function SpotifyLogo({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-label="Spotify"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <path
        d="M17.25 16.31c-.19.31-.6.41-.91.22-2.49-1.52-5.63-1.87-9.33-1.02-.35.08-.7-.13-.79-.48-.08-.35.13-.7.48-.79 4.05-.93 7.52-.53 10.33 1.16.31.19.41.6.22.91zm1.26-2.81c-.24.38-.75.5-1.13.27-2.85-1.75-7.19-2.26-10.56-1.24-.43.13-.88-.11-1.01-.54-.13-.43.11-.88.54-1.01 3.86-1.17 8.66-.6 11.89 1.4.38.23.5.75.27 1.12zm.11-2.93c-3.42-2.03-9.07-2.21-12.33-1.22-.51.16-1.06-.13-1.22-.64-.16-.51.13-1.06.64-1.22C9.12 6.33 15.3 6.54 19.21 8.9c.46.27.61.86.34 1.32-.27.46-.86.61-1.32.34z"
        fill="white"
      />
    </svg>
  );
}
