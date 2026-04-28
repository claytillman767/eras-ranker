// Developer-controlled Spotify start positions for the SHUFFLE SCREEN.
// Key format: "albumId_songIndex" (same as the rating key).
// Value: milliseconds into the track to begin playback on the first (shuffle) screen.
// Songs not listed here start from the beginning (0 ms).
//
// Bridge timestamps are auto-generated separately — see find_bridge_times.py
// which outputs src/data/spotifyBridgeTimes.js.
//
// Example — start "Cruel Summer" (fe, index 1) at 0:28 on the shuffle screen:
//   fe_1: 28000,

export const SPOTIFY_START_TIMES = {
  // Add entries here as needed, e.g.:
  // tv_0: 15000,   // Tim McGraw — skip 15s intro
};
