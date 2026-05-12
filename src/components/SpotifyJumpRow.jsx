import { SPOTIFY_CATEGORY_TIMES } from '../data/spotifyCategoryTimes';

// Pill row of "jump to a moment" buttons shown inside QuickScore for Pro
// users connected to Spotify Premium. Surfaces the auto-derived timestamps
// in SPOTIFY_CATEGORY_TIMES so the user can skip straight to the opening
// line, chorus, or closing line of the song they're currently rating.
//
// The Bridge moment is intentionally NOT in this row — it already has a
// dedicated "Play Bridge" button on the Bridge category screen (with the
// bridge lyrics quote above it), and that contextual treatment is stronger
// than a small pill. The three structural picks here aren't surfaced
// anywhere else.
//
// Renders nothing when:
//   - the parent didn't pass an onPlay handler (defensive), or
//   - none of the three timestamps exist for the song.
//
// The parent (QuickScore) is responsible for the Pro + Premium + connected
// + playerReady gate before mounting this — same gate as the mini player.
export default function SpotifyJumpRow({ albumId, songIndex, onPlay, style }) {
  if (!onPlay) return null;

  const key = `${albumId}_${songIndex}`;
  const times = SPOTIFY_CATEGORY_TIMES[key] || {};

  const buttons = [
    { key: 'best-opening-line', label: 'Opening' },
    { key: 'best-chorus',       label: 'Chorus'  },
    { key: 'best-closing-line', label: 'Closing' },
  ].filter(b => Number.isFinite(times[b.key]));

  if (!buttons.length) return null;

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      justifyContent: 'center',
      flexWrap: 'wrap',
      width: '100%',
      maxWidth: 320,
      ...style,
    }}>
      {buttons.map(b => (
        <button
          key={b.key}
          onClick={() => onPlay(b.key)}
          aria-label={`Play the ${b.label.toLowerCase()} of this song`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            color: '#4b5563',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M8 5v14l11-7z" />
          </svg>
          {b.label}
        </button>
      ))}
    </div>
  );
}
