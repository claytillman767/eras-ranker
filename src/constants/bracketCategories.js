import { SONGS } from '../data/albums';
import { hasBridge } from '../data/lyricsAccess';

// Bracket categories — each defines a head-to-head competition theme.
// lyricsContext: which lyric section is most relevant to show during matchups.
// spotifyContext: 'shuffle' | 'bridge' — which timestamp to use for Spotify playback.
// songFilter: optional fn(albumId, songIndex) => bool to restrict which songs qualify.
export const BRACKET_CATEGORIES = [
  {
    id: 'best-bridge',
    name: 'Best Bridge',
    description: 'The 8-bar moment that breaks you every time',
    lyricsContext: 'bridge',
    spotifyContext: 'bridge',
    estimatedMinutes: 8,
    songFilter: (albumId, songIndex) => hasBridge(albumId, songIndex),
  },
  {
    id: 'most-devastating',
    name: 'Most Devastating Song',
    description: 'The one that makes you pull over your car',
    lyricsContext: 'snippet',
    spotifyContext: 'shuffle',
    estimatedMinutes: 9,
    songFilter: null,
  },
  {
    id: 'best-opening-line',
    name: 'Best Opening Line',
    description: 'First impressions that never leave',
    lyricsContext: 'snippet',
    spotifyContext: 'shuffle',
    estimatedMinutes: 7,
    songFilter: null,
  },
  {
    id: 'most-romantic',
    name: 'Most Romantic Song',
    description: 'The one you send without context',
    lyricsContext: 'snippet',
    spotifyContext: 'shuffle',
    estimatedMinutes: 8,
    songFilter: null,
  },
  {
    id: 'best-vocal',
    name: 'Best Vocal Performance',
    description: "Where her voice does something impossible",
    lyricsContext: 'snippet',
    spotifyContext: 'shuffle',
    estimatedMinutes: 9,
    songFilter: null,
  },
  {
    id: 'most-underrated',
    name: 'Most Underrated Song',
    description: 'The ones that deserved more',
    lyricsContext: 'snippet',
    spotifyContext: 'shuffle',
    estimatedMinutes: 8,
    songFilter: null,
  },
  {
    id: 'best-chorus',
    name: 'Best Chorus',
    description: 'The part you scream at concerts',
    lyricsContext: 'snippet',
    spotifyContext: 'shuffle',
    estimatedMinutes: 7,
    songFilter: null,
  },
  {
    id: 'best-closing-line',
    name: 'Best Closing Line',
    description: 'The last thing she says that wrecks you',
    lyricsContext: 'snippet',
    spotifyContext: 'shuffle',
    estimatedMinutes: 7,
    songFilter: null,
  },
  {
    id: 'weekly-pick',
    name: 'Weekly Community Pick',
    description: 'A new category every Monday — the whole community votes',
    lyricsContext: 'snippet',
    spotifyContext: 'shuffle',
    estimatedMinutes: 10,
    songFilter: null,
    isWeekly: true,
  },
];

// Rotating weekly category names (cycles through these each week)
export const WEEKLY_CATEGORY_NAMES = [
  'Best Bridge',
  'Most Devastating Song',
  'Best Opening Line',
  'Most Romantic Song',
  'Best Vocal Performance',
  'Most Underrated Song',
  'Best Chorus',
  'Best Closing Line',
];

// Seed a pseudo-random number generator from a number (for deterministic community votes)
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Build a pool of all songs across all albums
function buildAllSongPool() {
  const pool = [];
  const albumIds = Object.keys(SONGS);
  for (const albumId of albumIds) {
    const songs = SONGS[albumId];
    songs.forEach((name, songIndex) => {
      pool.push({ name, albumId, songIndex });
    });
  }
  return pool;
}

// Build a pool of songs from a specific album
function buildAlbumSongPool(albumId) {
  const songs = SONGS[albumId] || [];
  return songs.map((name, songIndex) => ({ name, albumId, songIndex }));
}

// Fisher-Yates shuffle using a seeded random
function shuffleWithSeed(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Allowed bracket sizes, smallest → largest. 32 is the cap — larger
// brackets push past ~15 minutes of voting which is too long for a
// casual feature.
export const BRACKET_SIZES = [4, 8, 16, 32];

// Largest allowed size that fits in `n` eligible songs. Returns 0 if
// `n` is below the minimum (4).
export function bracketSize(n) {
  for (let i = BRACKET_SIZES.length - 1; i >= 0; i--) {
    if (n >= BRACKET_SIZES[i]) return BRACKET_SIZES[i];
  }
  return 0;
}

// Allowed sizes that fit `n` eligible songs (subset of BRACKET_SIZES).
export function availableSizes(n) {
  return BRACKET_SIZES.filter(s => s <= n);
}

// Build matchup array for a given array of songs (must be power of 2 length)
function buildRound(songs) {
  const matchups = [];
  for (let i = 0; i < songs.length; i += 2) {
    matchups.push({ song1: songs[i], song2: songs[i + 1], winner: null });
  }
  return matchups;
}

// Generate initial bracket rounds structure. `desiredSize` (optional) lets
// the caller pick a specific bracket size from BRACKET_SIZES; if omitted or
// larger than the eligible pool, falls back to the largest size that fits.
export function generateBracket(categoryId, scope, seed, desiredSize) {
  const cat = BRACKET_CATEGORIES.find(c => c.id === categoryId);
  let pool = scope === 'all' ? buildAllSongPool() : buildAlbumSongPool(scope);

  // Apply category song filter (e.g. best-bridge only includes bridged songs)
  if (cat?.songFilter) {
    pool = pool.filter(s => cat.songFilter(s.albumId, s.songIndex));
  }

  const rand = seededRandom(seed);
  const shuffled = shuffleWithSeed(pool, rand);
  const maxFit = bracketSize(shuffled.length);
  const size = desiredSize && BRACKET_SIZES.includes(desiredSize) && desiredSize <= maxFit
    ? desiredSize
    : maxFit;

  if (size === 0) return null;

  const contestants = shuffled.slice(0, size);
  const round1 = buildRound(contestants);

  return {
    contestants,
    rounds: [round1],
  };
}

// Given completed round, build next round from winners
export function buildNextRound(completedRound) {
  const winners = completedRound.map(m => m.winner).filter(Boolean);
  if (winners.length < 2) return null;
  return buildRound(winners);
}

// Current week number (Mon–Sun cycle)
export function getCurrentWeekNumber() {
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  // Week 0 = Jan 1 2024 Monday
  const epoch = new Date('2024-01-01T00:00:00Z').getTime();
  return Math.floor((Date.now() - epoch) / MS_PER_WEEK);
}

// Get the weekly category name for a given week number
export function getWeeklyCategoryName(weekNumber) {
  return WEEKLY_CATEGORY_NAMES[weekNumber % WEEKLY_CATEGORY_NAMES.length];
}

// Simulate community vote percentage for a matchup (deterministic per week+matchup)
export function getCommunityVotePercent(weekNumber, matchupIndex, userChoseSong1) {
  const rand = seededRandom(weekNumber * 1000 + matchupIndex * 17);
  rand(); rand(); // burn a couple to spread distribution
  // Community leans slightly toward the seeded pick
  const communityPick1Pct = 35 + Math.floor(rand() * 45); // 35–79%
  return userChoseSong1 ? communityPick1Pct : 100 - communityPick1Pct;
}
