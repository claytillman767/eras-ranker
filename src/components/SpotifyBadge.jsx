// Spotify logo mark — three approved color variants per Spotify design guidelines:
//   'green' — on WHITE backgrounds only
//   'black' — on light/colored backgrounds
//   'white' — on dark or Spotify-green backgrounds
//
// CLAUDE.md and Spotify's design guidelines both call for a 24px minimum for
// the logomark in non-cramped contexts. This default keeps every call site
// compliant unless a tighter size is explicitly requested.
export default function SpotifyBadge({ variant = 'green', size = 24 }) {
  const circleFill = variant === 'green' ? '#1DB954'
    : variant === 'black' ? '#191414'
    : 'rgba(255,255,255,0.3)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Spotify" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill={circleFill} />
      <path
        d="M17.25 16.31c-.19.31-.6.41-.91.22-2.49-1.52-5.63-1.87-9.33-1.02-.35.08-.7-.13-.79-.48-.08-.35.13-.7.48-.79 4.05-.93 7.52-.53 10.33 1.16.31.19.41.6.22.91zm1.26-2.81c-.24.38-.75.5-1.13.27-2.85-1.75-7.19-2.26-10.56-1.24-.43.13-.88-.11-1.01-.54-.13-.43.11-.88.54-1.01 3.86-1.17 8.66-.6 11.89 1.4.38.23.5.75.27 1.12zm.11-2.93c-3.42-2.03-9.07-2.21-12.33-1.22-.51.16-1.06-.13-1.22-.64-.16-.51.13-1.06.64-1.22C9.12 6.33 15.3 6.54 19.21 8.9c.46.27.61.86.34 1.32-.27.46-.86.61-1.32.34z"
        fill="white"
      />
    </svg>
  );
}
