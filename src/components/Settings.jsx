// Settings tab — app-wide display and behaviour preferences.
export default function Settings({ settings, updateSetting, spotify, isPro }) {
  return (
    <div style={{ paddingTop: 20, paddingBottom: 40 }}>

      {/* ── Display section ── */}
      <SectionHeader>Display</SectionHeader>

      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 28,
      }}>
        <SettingRow
          label="Category breakdown"
          description="Show score bars under each song in the album view."
          value={settings.showCategoryBars}
          onChange={v => updateSetting('showCategoryBars', v)}
        />
      </div>

      {/* ── Spotify section ── */}
      <SectionHeader>Spotify</SectionHeader>

      {!isPro ? (
        /* Pro paywall for Spotify */
        <div style={{
          background: '#faf5ff',
          border: '0.5px solid #e9d5ff',
          borderRadius: 12,
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <SpotifyBadge />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Hear it, then rate it
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#a855f7',
              background: '#f3e8ff',
              padding: '2px 7px',
              borderRadius: 99,
              letterSpacing: '0.05em',
            }}>
              PRO
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 0 }}>
            Connect your Spotify Premium account to play each song automatically
            while you score it — right inside the rating screen.
          </div>
        </div>
      ) : (
        /* Spotify connect / connected UI */
        <div style={{
          background: '#ffffff',
          border: '0.5px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {spotify?.isConnected ? (
            <>
              {/* Connected state */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderBottom: '0.5px solid #f3f4f6',
              }}>
                <SpotifyBadge />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                    Spotify connected
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {spotify.playerReady ? 'Player ready' : 'Player loading…'}
                  </div>
                </div>
                <button
                  onClick={spotify.disconnect}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '0.5px solid #e5e7eb',
                    background: '#ffffff',
                    fontSize: 12,
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              </div>

              {/* Autoplay toggle */}
              <SettingRow
                label="Autoplay songs"
                description="Start playing each song automatically when it appears in the rating screen."
                value={settings.spotifyAutoplay}
                onChange={v => updateSetting('spotifyAutoplay', v)}
              />
            </>
          ) : (
            /* Not connected state */
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <SpotifyBadge />
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                  Connect Spotify
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 14 }}>
                Link your Spotify Premium account to hear each song play automatically
                while you rate it. Your ratings stay here — Spotify just provides the audio.
              </div>

              {spotify?.error && (
                <div style={{
                  fontSize: 12,
                  color: '#dc2626',
                  background: '#fef2f2',
                  border: '0.5px solid #fecaca',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 12,
                }}>
                  {spotify.error}
                </div>
              )}

              <button
                onClick={spotify?.connect}
                disabled={spotify?.isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: spotify?.isLoading ? '#d1d5db' : '#1DB954',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: spotify?.isLoading ? 'default' : 'pointer',
                }}
              >
                <SpotifyBadge white />
                {spotify?.isLoading ? 'Connecting…' : 'Connect Spotify'}
              </button>

              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
                Requires Spotify Premium · You stay logged in to Eras Ranker
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#6b7280',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

// A single toggle row inside a settings card
function SettingRow({ label, description, value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>

      {/* Toggle switch */}
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          background: value ? '#a855f7' : '#d1d5db',
          position: 'relative',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 3,
          left: value ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  );
}

// Spotify logo mark — green by default, white variant for dark backgrounds.
function SpotifyBadge({ white = false }) {
  const fill = white ? '#ffffff' : '#1DB954';
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      aria-label="Spotify"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="12" fill={white ? 'rgba(255,255,255,0.25)' : '#1DB954'} />
      <path
        d="M17.25 16.31c-.19.31-.6.41-.91.22-2.49-1.52-5.63-1.87-9.33-1.02-.35.08-.7-.13-.79-.48-.08-.35.13-.7.48-.79 4.05-.93 7.52-.53 10.33 1.16.31.19.41.6.22.91zm1.26-2.81c-.24.38-.75.5-1.13.27-2.85-1.75-7.19-2.26-10.56-1.24-.43.13-.88-.11-1.01-.54-.13-.43.11-.88.54-1.01 3.86-1.17 8.66-.6 11.89 1.4.38.23.5.75.27 1.12zm.11-2.93c-3.42-2.03-9.07-2.21-12.33-1.22-.51.16-1.06-.13-1.22-.64-.16-.51.13-1.06.64-1.22C9.12 6.33 15.3 6.54 19.21 8.9c.46.27.61.86.34 1.32-.27.46-.86.61-1.32.34z"
        fill="white"
      />
    </svg>
  );
}
