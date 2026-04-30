// ─────────────────────────────────────────────────────────────────────────────
// Lyrics display kill switch.
//
// Until proper lyrics licensing exists (see CLAUDE.md → "Synchronized Lyrics
// Display"), every place in the app that DISPLAYS Taylor Swift lyric text
// must go through this module instead of importing from `bridgeLyrics.js`
// or `snippetLyrics.js` directly.
//
// To turn lyrics back on (after a Musixmatch contract or equivalent license
// is in place): change LYRICS_DISPLAY_ENABLED to `true` and redeploy.
//
// What this controls:
//   - Bridge quote shown in QuickScore's bridge category
//   - Lyric scroller shown in QuickScore's lyrics category
//   - Floating snippet background on the shuffle screen
//   - Lyric snippet shown on bracket matchup cards
//   - Bridge quote shown in RatingPanel
//
// What this does NOT control (these are pure data lookups, not display):
//   - "Does this song have a bridge?" auto-skip logic in QuickScore
//   - Composite score weighting in useRatings (folds bridge into lyrics
//     weight when no bridge exists)
//   - The "Best Bridge" bracket's eligibility filter
// Those callers should use hasBridge / hasSnippet below.
// ─────────────────────────────────────────────────────────────────────────────

import { getBridgeLyrics as _getBridgeLyrics } from './bridgeLyrics';
import { getSnippetLyrics as _getSnippetLyrics } from './snippetLyrics';

// Developer toggle — flip to `true` once a proper lyrics license exists.
const LYRICS_DISPLAY_ENABLED = false;

// Display-gated getters. Call these wherever lyrics are SHOWN to the user.
// Returns null when display is off, so existing `lyric && (...)` UI checks
// gracefully render nothing.
export function getBridgeLyrics(albumId, songIndex) {
  if (!LYRICS_DISPLAY_ENABLED) return null;
  return _getBridgeLyrics(albumId, songIndex);
}

export function getSnippetLyrics(albumId, songIndex) {
  if (!LYRICS_DISPLAY_ENABLED) return null;
  return _getSnippetLyrics(albumId, songIndex);
}

// Data-only existence checks. Bypass the display gate — use these when you
// only need to know whether a section EXISTS, without showing the words.
export function hasBridge(albumId, songIndex) {
  return _getBridgeLyrics(albumId, songIndex) !== null;
}

export function hasSnippet(albumId, songIndex) {
  return _getSnippetLyrics(albumId, songIndex) !== null;
}

// Read-only helper — exported for tests / debugging only.
export function isLyricsDisplayEnabled() {
  return LYRICS_DISPLAY_ENABLED;
}
