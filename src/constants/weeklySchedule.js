// Weekly bracket scheduling + community-result logic.
//
// The redesigned weekly bracket (see Claude Design/design_handoff_weekly_bracket)
// is a paced, multi-day ritual rather than a one-sitting tournament:
//
//   Mon  → Round 1 (of 16) opens
//   Wed  → Round 1 results + Round 2 (of 8) opens
//   Fri  → Round 2 results + Round 3 (of 4) opens
//   Sat  → Round 3 results + the Final opens
//   Sun  → champion crowned + shareable card
//
// This module is PURE logic (no React, no Firestore). It answers:
//   • which round is currently unlocked, given the date
//   • when the next round drops (for countdowns)
//   • who the COMMUNITY advances each round (Phase A: deterministic per week;
//     Phase B swaps this for real aggregated tallies)
//   • the user's Crowd Match score (how often their pick = the crowd's pick)
//
// It is intentionally aligned with getCurrentWeekNumber() in bracketCategories.js,
// which counts weeks from Monday 2024-01-01 00:00 UTC.

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MS_PER_WEEK = 7 * MS_PER_DAY;
const WEEK_EPOCH_MS = new Date('2024-01-01T00:00:00Z').getTime(); // a Monday

// Weekly bracket is fixed at 16 songs → 4 rounds.
export const WEEKLY_BRACKET_SIZE = 16;
export const TOTAL_ROUNDS = 4;

// Day offset (0 = Mon … 6 = Sun) on which each round unlocks for voting.
// Index = round index (0-based). Round 3 is the Final.
export const ROUND_UNLOCK_DAY = [0, 2, 4, 5]; // Mon, Wed, Fri, Sat
// Champion is revealed Sunday.
export const CHAMPION_DAY = 6;

// Phase A drops happen at the start of the unlock day (UTC midnight). A real
// scheduler (Phase B) can shift this to a friendlier local hour — change this
// one constant. Hours after the day boundary, in UTC.
export const DROP_HOUR_UTC = 0;

// ── Date math ────────────────────────────────────────────────────────────────

// Start of a given week (Monday 00:00 UTC), in ms.
export function weekStartMs(weekNumber) {
  return WEEK_EPOCH_MS + weekNumber * MS_PER_WEEK;
}

// How many whole days into the current week we are (0–6), clamped.
export function dayOffset(now, weekNumber) {
  const off = Math.floor((now - weekStartMs(weekNumber)) / MS_PER_DAY);
  return Math.max(0, Math.min(6, off));
}

// Exact ms timestamp a given round unlocks (its day boundary + DROP_HOUR_UTC).
export function roundUnlockMs(weekNumber, roundIndex) {
  return weekStartMs(weekNumber) + ROUND_UNLOCK_DAY[roundIndex] * MS_PER_DAY + DROP_HOUR_UTC * 60 * 60 * 1000;
}

// Ms timestamp the champion is revealed (Sunday).
export function championRevealMs(weekNumber) {
  return weekStartMs(weekNumber) + CHAMPION_DAY * MS_PER_DAY + DROP_HOUR_UTC * 60 * 60 * 1000;
}

// The day a round's voting window closes = when the NEXT round opens, or the
// champion reveal for the Final.
export function roundCloseDay(roundIndex) {
  return roundIndex + 1 < TOTAL_ROUNDS ? ROUND_UNLOCK_DAY[roundIndex + 1] : CHAMPION_DAY;
}

// How many rounds are unlocked given the current day offset (1–4).
export function unlockedRoundCount(now, weekNumber) {
  const off = dayOffset(now, weekNumber);
  return ROUND_UNLOCK_DAY.filter(d => d <= off).length;
}

// Highest round index the user can currently reach (0-based).
export function currentRoundIndex(now, weekNumber) {
  return Math.max(0, unlockedRoundCount(now, weekNumber) - 1);
}

// Is a round currently open for community voting (its window hasn't closed)?
export function isRoundOpen(roundIndex, now, weekNumber) {
  const off = dayOffset(now, weekNumber);
  return off >= ROUND_UNLOCK_DAY[roundIndex] && off < roundCloseDay(roundIndex);
}

// Has a round's window already closed (so any vote now is personal-only catch-up)?
export function isRoundClosed(roundIndex, now, weekNumber) {
  return dayOffset(now, weekNumber) >= roundCloseDay(roundIndex);
}

// Has the champion been revealed (Sunday reached)?
export function isChampionRevealed(now, weekNumber) {
  return dayOffset(now, weekNumber) >= CHAMPION_DAY;
}

// The next drop the user is waiting on: { roundIndex, atMs, isChampion } or null
// if the week is fully revealed. roundIndex is the round that will OPEN next
// (or the Final's close → champion when isChampion is true).
export function nextDrop(now, weekNumber) {
  const count = unlockedRoundCount(now, weekNumber);
  if (count < TOTAL_ROUNDS) {
    return { roundIndex: count, atMs: roundUnlockMs(weekNumber, count), isChampion: false };
  }
  if (!isChampionRevealed(now, weekNumber)) {
    return { roundIndex: null, atMs: championRevealMs(weekNumber), isChampion: true };
  }
  return null;
}

// ── Community results (deterministic for Phase A) ────────────────────────────
//
// Phase A has no real vote backend, so the crowd's choices are derived
// deterministically from the week seed — meaning every user sees the SAME
// bracket advance the same way (which is exactly what Option A needs). Phase B
// replaces communityPercent()/communityWinnerIndex() with real Firestore tallies;
// nothing else in the UI has to change.

function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Deterministic split for one matchup → { song1Pct, song2Pct } (integers, sum 100).
// Leans clearly toward a winner (57–82% range) so reveals feel decisive.
export function communityPercent(weekSeed, roundIndex, matchupIndex) {
  const rand = seededRandom(weekSeed * 100003 + roundIndex * 1009 + matchupIndex * 31 + 7);
  rand(); rand(); // spread the distribution
  const song1Pct = 57 + Math.floor(rand() * 26); // 57–82
  return { song1Pct, song2Pct: 100 - song1Pct };
}

// Which side the community advanced: 0 = song1, 1 = song2.
export function communityWinnerIndex(weekSeed, roundIndex, matchupIndex) {
  return communityPercent(weekSeed, roundIndex, matchupIndex).song1Pct >= 50 ? 0 : 1;
}

const songId = (s) => (s ? `${s.albumId}_${s.songIndex}` : null);

// Resolve the entire community bracket from the round-1 contestants + week seed.
// Returns { rounds, champion } where each round is an array of
//   { song1, song2, winnerIndex, song1Pct, song2Pct, winner }
// and champion is the winning song of the Final.
export function computeCommunityBracket(contestants, weekSeed) {
  const rounds = [];
  // Build round 0 matchups from contestants (pairs).
  let current = [];
  for (let i = 0; i < contestants.length; i += 2) {
    current.push({ song1: contestants[i], song2: contestants[i + 1] });
  }

  let roundIndex = 0;
  while (current.length >= 1) {
    const resolved = current.map((m, mi) => {
      const { song1Pct, song2Pct } = communityPercent(weekSeed, roundIndex, mi);
      const winnerIndex = song1Pct >= 50 ? 0 : 1;
      const winner = winnerIndex === 0 ? m.song1 : m.song2;
      return { ...m, song1Pct, song2Pct, winnerIndex, winner };
    });
    rounds.push(resolved);

    if (resolved.length === 1) {
      return { rounds, champion: resolved[0].winner };
    }

    // Next round pairs up this round's winners.
    const winners = resolved.map(m => m.winner);
    const next = [];
    for (let i = 0; i < winners.length; i += 2) {
      next.push({ song1: winners[i], song2: winners[i + 1] });
    }
    current = next;
    roundIndex += 1;
  }

  return { rounds, champion: null };
}

// ── Crowd Match ──────────────────────────────────────────────────────────────
//
// The user's personal pick ledger is keyed `${roundIndex}_${matchupIndex}` →
// the songId they chose. Crowd Match = % of their picks that matched the
// community's advancing song, across every matchup they voted on.

// personalVotes: { [`${r}_${m}`]: winnerId }, communityRounds: from computeCommunityBracket.
export function crowdMatch(personalVotes, communityRounds) {
  let matched = 0;
  let total = 0;
  for (const key of Object.keys(personalVotes || {})) {
    const [r, m] = key.split('_').map(Number);
    const community = communityRounds?.[r]?.[m];
    if (!community) continue;
    total += 1;
    if (personalVotes[key] === songId(community.winner)) matched += 1;
  }
  const pct = total > 0 ? Math.round((matched / total) * 100) : null;
  return { matched, total, pct };
}

// Personality label for a Crowd Match %, used on the reveal + share card.
export function crowdMatchTier(pct) {
  if (pct == null) return '';
  if (pct >= 90) return 'In lockstep with the Swifties';
  if (pct >= 70) return 'Mostly with the crowd';
  if (pct >= 50) return 'A mind of your own';
  return 'Marching to your own beat';
}

export { songId };
