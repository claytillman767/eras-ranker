import SpotifyBadge from './SpotifyBadge';

// localStorage keys for the "Connect Spotify?" nudge that appears on this
// modal when a Pro user hasn't yet connected Spotify. Free users see the
// post-login SpotifyIntro instead, so this in-modal nudge is Pro-only —
// reminding them to finish the second half of the flow they paid for.
//
//   eras_spotify_connect_nudge_until  — millisecond timestamp; nudge stays
//                                       hidden until this time has passed.
//                                       Set when user picks "Remind me later".
//   eras_spotify_connect_nudge_silenced — 'true' if user picked "Don't show
//                                       me again". Permanent suppression.
const NUDGE_UNTIL_KEY = 'eras_spotify_connect_nudge_until';
const NUDGE_SILENCED_KEY = 'eras_spotify_connect_nudge_silenced';
const REMIND_LATER_MS = 48 * 60 * 60 * 1000;

function shouldShowNudge() {
  try {
    if (localStorage.getItem(NUDGE_SILENCED_KEY) === 'true') return false;
    const until = Number(localStorage.getItem(NUDGE_UNTIL_KEY) || 0);
    if (until && Date.now() < until) return false;
    return true;
  } catch {
    return true;
  }
}

// Shown once when a user opens an album for the first time.
// Asks whether they want to score songs (Vibe Check) or sort manually.
//
// Three Vibe Check states (depend on Pro + Spotify connection):
//   1. Free / no Pro              — original "answer a few questions" copy
//   2. Pro + Spotify connected    — Spotify badge + copy promises song playback
//   3. Pro + Spotify NOT connected — original copy + a Connect Spotify nudge
//                                    panel above the cards (with Remind / Silence)
export default function AlbumModeModal({
  album,
  onChooseScore,
  onChooseManual,
  onBack,
  isPro,
  spotify,
}) {
  const proConnected = isPro && spotify?.isConnected;
  const proNotConnected = isPro && !spotify?.isConnected;
  const showNudge = proNotConnected && shouldShowNudge();

  function handleConnect() {
    spotify?.connect?.(); // redirects to Spotify OAuth
  }

  function handleRemindLater() {
    try {
      localStorage.setItem(NUDGE_UNTIL_KEY, String(Date.now() + REMIND_LATER_MS));
    } catch {}
    // Force re-render so the nudge hides immediately. Cheapest path: ask
    // the parent to re-open this modal — but we don't own that. Easier:
    // just close the modal back to the album list; user re-opens when ready.
    onBack();
  }

  function handleSilence() {
    try {
      localStorage.setItem(NUDGE_SILENCED_KEY, 'true');
    } catch {}
    onBack();
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '28px 20px 20px',
        width: '100%',
        maxWidth: 480,
        margin: '0 16px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            fontSize: 14,
            padding: '0 0 16px',
          }}
        >
          ← Back
        </button>

        {/* Album identity */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>{album.icon}</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#111827' }}>{album.name}</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>How do you want to rank this album?</div>
        </div>

        {/* Connect Spotify nudge — only Pro users who haven't connected, and
            who haven't recently dismissed it */}
        {showNudge && (
          <div style={{
            background: '#f0fdf4',
            border: '0.5px solid #bbf7d0',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <SpotifyBadge variant="green" size={26} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                Connect Spotify for sound?
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.45, marginBottom: 12 }}>
              You're Pro — connect Spotify so each song plays automatically while you rate.
              One more step.
            </div>
            <button
              onClick={handleConnect}
              disabled={spotify?.isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                border: 'none',
                background: spotify?.isLoading ? '#a7f3d0' : '#1DB954',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                cursor: spotify?.isLoading ? 'default' : 'pointer',
                marginBottom: 8,
              }}
            >
              <SpotifyBadge variant="white" size={18} />
              {spotify?.isLoading ? 'Connecting…' : 'Connect Spotify'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleRemindLater}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: '0.5px solid #d1d5db',
                  background: '#ffffff',
                  color: '#4b5563',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Remind me later
              </button>
              <button
                onClick={handleSilence}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: '0.5px solid #e5e7eb',
                  background: '#ffffff',
                  color: '#9ca3af',
                  fontSize: 12,
                  fontWeight: 400,
                  cursor: 'pointer',
                }}
              >
                Don't show again
              </button>
            </div>
          </div>
        )}

        {/* Vibe Check option — copy + iconography adapt to Spotify state */}
        <button
          onClick={onChooseScore}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: 10,
            padding: '16px 16px',
            borderRadius: 14,
            border: '2px solid #a855f7',
            background: '#faf5ff',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {proConnected ? (
              <span style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#ffffff',
                border: '0.5px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <SpotifyBadge variant="green" size={24} />
              </span>
            ) : (
              <span style={{ fontSize: 26 }}>🎧</span>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#7c3aed', marginBottom: 3 }}>
                Vibe Check
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.45 }}>
                {proConnected
                  ? 'Each song plays automatically while you answer a few quick questions. We rank them for you, and you can manually sort after.'
                  : "Answer a few questions about each song and we'll rank them for you. You can manually sort songs after a score is assigned."}
              </div>
            </div>
          </div>
        </button>

        {/* Sort It Yourself option */}
        <button
          onClick={onChooseManual}
          style={{
            display: 'block',
            width: '100%',
            padding: '16px 16px',
            borderRadius: 14,
            border: '1.5px solid #e5e7eb',
            background: '#ffffff',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>✋</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 3 }}>
                Sort It Yourself
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.45 }}>
                Drag songs into your own order without answering any questions.
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
