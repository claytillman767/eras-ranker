import { useState } from 'react';

// Settings tab — app-wide display and behaviour preferences.
export default function Settings({ settings, updateSetting, spotify, isPro, unlockPro }) {
  const [showProModal, setShowProModal] = useState(false);

  function handleUnlockPro() {
    unlockPro();
    setShowProModal(false);
  }

  return (
    <div style={{ paddingTop: 20, paddingBottom: 40 }}>

      {/* ── Pro upgrade modal ── */}
      {showProModal && (
        <ProModal onUnlock={handleUnlockPro} onClose={() => setShowProModal(false)} />
      )}

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
        /* Not Pro — show the feature, but clicking Connect opens the upgrade modal */
        <div style={{
          background: '#ffffff',
          border: '0.5px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderBottom: '0.5px solid #f3f4f6',
          }}>
            <SpotifyBadge variant="green" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                  Hear it, then rate it
                </span>
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
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                Play each song on Spotify while you rate it
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 16px' }}>
            <button
              onClick={() => setShowProModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                border: 'none',
                background: '#1DB954',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <SpotifyBadge variant="white" />
              Connect Spotify
            </button>
          </div>
        </div>
      ) : (
        /* Pro — show connect / connected UI */
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
                <SpotifyBadge variant="green" />
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
            /* Pro but not yet connected */
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <SpotifyBadge variant="green" />
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                  Connect Spotify
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 14 }}>
                Link your Spotify Premium account to hear each song play automatically
                while you rate it.
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
                <SpotifyBadge variant="white" />
                {spotify?.isLoading ? 'Connecting…' : 'Connect Spotify'}
              </button>

              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
                Requires Spotify Premium · Your Eras Ranker login stays separate
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ── Pro upgrade modal ─────────────────────────────────────────────────────────
function ProModal({ onUnlock, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 0 0',
      }}
    >
      {/* Sheet — stop clicks from bubbling through */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px 20px 0 0',
          padding: '28px 24px 40px',
          width: '100%',
          maxWidth: 700,
          boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          background: '#e5e7eb',
          margin: '0 auto 24px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>⭐</span>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
            Unlock Pro
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
          One-time unlock. No subscription, no recurring charges.
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {[
            { icon: '🎵', label: 'Connect Spotify', desc: 'Hear each song play while you rate it' },
            { icon: '📊', label: '8 extra categories', desc: 'Hook, Vocals, Cry Factor, and more' },
            { icon: '✏️', label: 'Custom categories', desc: 'Add your own scoring dimensions' },
            { icon: '⚖️', label: 'Weight your scores', desc: 'Adjust how much each category counts' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#f3e8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{f.label}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Unlock button */}
        <button
          onClick={onUnlock}
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
            boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
            marginBottom: 12,
          }}
        >
          Unlock Pro
        </button>

        <button
          onClick={onClose}
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
          Not now
        </button>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

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

function SettingRow({ label, description, value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>
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

// Spotify logo mark — three approved color variants per Spotify design guidelines:
//   'green' — on WHITE backgrounds only
//   'black' — on light/colored backgrounds
//   'white' — on dark or Spotify-green backgrounds
function SpotifyBadge({ variant = 'green' }) {
  const circleFill = variant === 'green' ? '#1DB954'
    : variant === 'black' ? '#191414'
    : 'rgba(255,255,255,0.3)';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-label="Spotify" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill={circleFill} />
      <path
        d="M17.25 16.31c-.19.31-.6.41-.91.22-2.49-1.52-5.63-1.87-9.33-1.02-.35.08-.7-.13-.79-.48-.08-.35.13-.7.48-.79 4.05-.93 7.52-.53 10.33 1.16.31.19.41.6.22.91zm1.26-2.81c-.24.38-.75.5-1.13.27-2.85-1.75-7.19-2.26-10.56-1.24-.43.13-.88-.11-1.01-.54-.13-.43.11-.88.54-1.01 3.86-1.17 8.66-.6 11.89 1.4.38.23.5.75.27 1.12zm.11-2.93c-3.42-2.03-9.07-2.21-12.33-1.22-.51.16-1.06-.13-1.22-.64-.16-.51.13-1.06.64-1.22C9.12 6.33 15.3 6.54 19.21 8.9c.46.27.61.86.34 1.32-.27.46-.86.61-1.32.34z"
        fill="white"
      />
    </svg>
  );
}
