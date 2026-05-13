// Small inline attribution shown wherever Spotify-sourced album art appears
// outside of dedicated Spotify UI (the mini player and Settings already
// carry full branding).
//
// Spotify brand rules: the green logomark (#1DB954) may only appear on white
// backgrounds at >= 24px. Below that we use the wordmark "Spotify" in plain
// text instead of the logo, paired with a neutral attribution phrase.
// Full guidelines: https://developer.spotify.com/documentation/design
//
// Pass `visible={false}` (or omit when no art is showing) and this renders
// nothing — keeps the line out of the UI when there's nothing to attribute.
export default function SpotifyAttribution({ visible = true, style }) {
  if (!visible) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      fontSize: 11,
      color: '#9ca3af',
      letterSpacing: '0.02em',
      ...style,
    }}>
      <span>Album art from</span>
      <span style={{ fontWeight: 600, color: '#6b7280' }}>Spotify</span>
    </div>
  );
}
