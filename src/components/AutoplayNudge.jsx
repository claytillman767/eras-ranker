import SpotifyBadge from './SpotifyBadge';

// Soft Pro upsell shown once when a user has rated 30+ songs, has Spotify
// connected, but isn't yet Pro. Pops between songs in QuickScore so it
// doesn't interrupt the middle of a category. Tapping "Try it" turns on
// autoplay for the rest of the session as a free taste of the Pro
// experience — without flipping their Pro flag.
//
// Skipped entirely if Spotify isn't connected (the demo needs Spotify
// playback to work) or if the user is already Pro (nothing to upsell).
//
// localStorage flag: eras_autoplay_nudge_seen — set on either Try it or
// Maybe later, so the nudge never shows twice.

export const AUTOPLAY_NUDGE_KEY = 'eras_autoplay_nudge_seen';

export function hasSeenAutoplayNudge() {
  return localStorage.getItem(AUTOPLAY_NUDGE_KEY) === '1';
}

export function markAutoplayNudgeSeen() {
  localStorage.setItem(AUTOPLAY_NUDGE_KEY, '1');
}

export default function AutoplayNudge({ onTryIt, onLater }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      zIndex: 1200,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px 32px',
        width: '100%',
        maxWidth: 480,
        animation: 'autoplay-nudge-in 0.32s cubic-bezier(0.2, 0.8, 0.3, 1.1) both',
      }}>
        <style>{`
          @keyframes autoplay-nudge-in {
            from { transform: translateY(20px); opacity: 0; }
            to   { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Spotify-themed icon block */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 14,
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#ffffff',
            border: '0.5px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
          }}>
            <SpotifyBadge variant="green" size={36} />
          </div>
        </div>

        <div style={{
          fontSize: 19,
          fontWeight: 700,
          color: '#111827',
          textAlign: 'center',
          marginBottom: 10,
          lineHeight: 1.3,
        }}>
          Want each song to play while you rate?
        </div>

        <div style={{
          fontSize: 13,
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: 22,
          padding: '0 4px',
        }}>
          Pro users get every song to autoplay automatically — no extra taps,
          just listen and rate. Try it on the next song to hear what it's like.
        </div>

        {/* Try it — Spotify branding (green on white). Activates demo mode in QuickScore. */}
        <button
          onClick={onTryIt}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: '#1DB954',
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(29,185,84,0.28)',
            marginBottom: 10,
          }}
        >
          <SpotifyBadge variant="white" size={20} />
          Try it on the next song
        </button>

        {/* Maybe later */}
        <button
          onClick={onLater}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '0.5px solid #e5e7eb',
            background: '#ffffff',
            color: '#6b7280',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Maybe later
        </button>

        <div style={{
          fontSize: 11,
          color: '#9ca3af',
          textAlign: 'center',
          marginTop: 14,
          lineHeight: 1.5,
        }}>
          Free preview — Pro keeps autoplay on for every album, every song.
        </div>
      </div>
    </div>
  );
}
