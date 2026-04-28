// Developer-controlled Spotify start positions.
// Key format: "albumId_songIndex" (same as the rating key).
// Value: milliseconds into the track to begin playback.
// Songs not listed here start from the beginning (0 ms).
//
// Example — start "Cruel Summer" (fe, index 2) at 0:28:
//   fe_2: 28000,

export const SPOTIFY_START_TIMES = {
  // Add entries here as needed, e.g.:
  // tv_0: 15000,   // The 1 — skip 15s intro
};
