import { useState, useCallback, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  generateBracket,
  buildNextRound,
  getCurrentWeekNumber,
  getWeeklyCategoryName,
  BRACKET_CATEGORIES,
} from '../constants/bracketCategories';
import { WEEKLY_BRACKET_SIZE } from '../constants/weeklySchedule';

// Resolve the rotating weekly category NAME → a real category id so the song
// pool matches the displayed theme. Falls back to a no-filter category.
function weeklyCategoryIdForWeek(weekNumber) {
  const name = getWeeklyCategoryName(weekNumber);
  return BRACKET_CATEGORIES.find(c => c.name === name)?.id || 'most-devastating';
}

// Build a fresh weekly bracket for `wk`: 16 contestants, no per-user advancement.
// The community's 4-round outcome is recomputed on the fly from (contestants, seed)
// in the UI; we persist only contestants + the user's personal pick ledger +
// which round reveals they've seen. None of these are nested arrays, so they
// store to Firestore directly (no JSON.stringify needed).
function freshWeekly(wk) {
  const seed = wk * 999983;
  const categoryId = weeklyCategoryIdForWeek(wk);
  let generated = generateBracket(categoryId, 'all', seed, WEEKLY_BRACKET_SIZE);
  if (!generated || generated.contestants.length < WEEKLY_BRACKET_SIZE) {
    generated = generateBracket('most-devastating', 'all', seed, WEEKLY_BRACKET_SIZE);
  }
  if (!generated) return null;
  return {
    weekNumber: wk,
    categoryId,
    categoryName: getWeeklyCategoryName(wk),
    seed,
    contestants: generated.contestants.slice(0, WEEKLY_BRACKET_SIZE),
    personalVotes: {}, // { `${roundIndex}_${matchupIndex}`: "albumId_songIndex" }
    revealsSeen: {},    // { [roundIndex]: true }
  };
}

const isNewWeeklyShape = (w) => !!(w && w.contestants && w.personalVotes);

const STORAGE_KEY = 'eras_brackets';
const WEEKLY_KEY = 'eras_weekly_bracket';

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Generate a unique bracket ID
function makeBracketId() {
  return `bracket_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Firestore-safe encoding for personal brackets ─────────────────────────
// A personal bracket's `rounds` is an array-of-arrays (each round is an array
// of matchups). Firestore REJECTS nested arrays and throws SYNCHRONOUSLY from
// setDoc() — before the returned promise exists, so a trailing .catch() never
// sees it. That uncaught synchronous throw used to bubble up through
// createBracket and silently kill the "Start voting" tap for signed-in users
// (the bracket never advanced and no error showed). We JSON-encode `rounds`
// only for the cloud write and decode it on read; localStorage and in-memory
// state always keep the real nested-array shape every bracket screen expects.
// (The weekly bracket was redesigned to drop nested arrays; personal brackets
// keep the rounds model, so they need this targeted encoding instead.)
// Decoding is backward-compatible: a bracket whose `rounds` is already an
// array (e.g. legacy data) is returned untouched.
function encodeBracketForCloud(b) {
  if (!b || typeof b.rounds === 'string') return b;
  return { ...b, rounds: JSON.stringify(b.rounds ?? []) };
}
function decodeBracketFromCloud(b) {
  if (!b || typeof b.rounds !== 'string') return b;
  try {
    return { ...b, rounds: JSON.parse(b.rounds) };
  } catch {
    return { ...b, rounds: [] };
  }
}
function encodeBracketsForCloud(list) {
  return Array.isArray(list) ? list.map(encodeBracketForCloud) : list;
}
function decodeBracketsFromCloud(list) {
  return Array.isArray(list) ? list.map(decodeBracketFromCloud) : list;
}

export function useBrackets(user) {
  const [brackets, setBrackets] = useState(() => loadFromStorage(STORAGE_KEY) || []);
  const [weeklyState, setWeeklyState] = useState(() => loadFromStorage(WEEKLY_KEY) || null);

  // Ref that always points to the latest weeklyState — used by recordWeeklyVote
  // to avoid stale closures without using a functional updater (which crashed in StrictMode).
  const weeklyStateRef = useRef(weeklyState);
  weeklyStateRef.current = weeklyState;

  // Sync brackets to Firestore when user logs in
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().brackets) {
        const cloud = decodeBracketsFromCloud(snap.data().brackets);
        setBrackets(cloud);
        saveToStorage(STORAGE_KEY, cloud);
      } else {
        const local = loadFromStorage(STORAGE_KEY) || [];
        if (local.length > 0) {
          try {
            setDoc(doc(db, 'users', user.uid), { brackets: encodeBracketsForCloud(local) }, { merge: true }).catch(() => {});
          } catch { /* cloud migration is best-effort; local data is unaffected */ }
        }
      }
      if (snap.exists() && snap.data().weeklyBracket) {
        const w = snap.data().weeklyBracket;
        const currentWk = getCurrentWeekNumber();
        // Only hydrate from the cloud when it's the redesigned shape for the
        // current week. Old-shape docs (from before the redesign) are ignored —
        // the mount effect regenerates a fresh weekly for this week.
        if (isNewWeeklyShape(w) && w.weekNumber === currentWk) {
          setWeeklyState(prev => {
            // Keep local state if it has at least as many personal votes —
            // prevents a stale Firestore read (e.g. StrictMode double-effect)
            // from reverting votes the user just cast.
            const prevVotes = prev?.personalVotes ? Object.keys(prev.personalVotes).length : 0;
            const cloudVotes = Object.keys(w.personalVotes).length;
            if (prev && prev.weekNumber === currentWk && prevVotes >= cloudVotes) return prev;
            saveToStorage(WEEKLY_KEY, w);
            return w;
          });
        }
      }
    }).catch(() => {});
  }, [user]);

  // Persist brackets to localStorage + Firestore
  const persistBrackets = useCallback((next) => {
    saveToStorage(STORAGE_KEY, next);
    if (user) {
      // setDoc validates its data SYNCHRONOUSLY and throws on anything invalid
      // (e.g. a nested array) BEFORE returning a promise, so the trailing
      // .catch() can't protect us. Wrap the whole call so a cloud-write failure
      // can never abort the local-first state update below — which is exactly
      // what used to leave "Start voting" doing nothing for signed-in users.
      try {
        setDoc(doc(db, 'users', user.uid), { brackets: encodeBracketsForCloud(next) }, { merge: true }).catch(() => {});
      } catch { /* local state + storage still update; cloud syncs on a later write */ }
    }
    setBrackets(next);
  }, [user]);

  // Initialize the weekly bracket on mount so it's ready before the user taps
  // anything. This avoids calling state-setters from the render phase.
  useEffect(() => {
    const wk = getCurrentWeekNumber();

    // Weekly — reset on a new week OR when the stored state predates the
    // redesign (old shape). The community outcome is derived from the seed in
    // the UI; we only persist contestants + the user's personal pick ledger.
    setWeeklyState(prev => {
      if (prev && prev.weekNumber === wk && isNewWeeklyShape(prev)) return prev;
      const next = freshWeekly(wk);
      if (!next) return prev;
      saveToStorage(WEEKLY_KEY, next);
      return next;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Create a new personal bracket. `desiredSize` (optional) overrides the
  // default "largest power-of-two that fits" sizing — see BRACKET_SIZES.
  const createBracket = useCallback((categoryId, scope = 'all', desiredSize, customCategoryName, explicitContestants) => {
    const seed = Date.now();
    const generated = generateBracket(categoryId, scope, seed, desiredSize, explicitContestants);
    if (!generated) {
      // Surface why — the picker's "Start" button silently does nothing if we
      // return null here, which is the symptom reported in feedback.
      // eslint-disable-next-line no-console
      console.warn('[createBracket] generateBracket returned null', {
        categoryId, scope, desiredSize,
      });
      return null;
    }

    const bracket = {
      id: makeBracketId(),
      categoryId,
      scope,
      seed,
      status: 'in-progress',
      currentRound: 0,
      currentMatchupIndex: 0,
      contestants: generated.contestants,
      rounds: generated.rounds,
      winner: null,
      createdAt: Date.now(),
      // Optional — when set, every screen displays this instead of the
      // curated category name. Used by the "Write your own" builder path.
      ...(customCategoryName ? { customCategoryName } : {}),
    };

    persistBrackets([...brackets, bracket]);
    return bracket.id;
  }, [brackets, persistBrackets]);

  // Record a winner for a matchup and advance the bracket
  const recordWinner = useCallback((bracketId, roundIndex, matchupIndex, winner) => {
    const next = brackets.map(b => {
      if (b.id !== bracketId) return b;

      const rounds = b.rounds.map((round, ri) => {
        if (ri !== roundIndex) return round;
        return round.map((m, mi) => {
          if (mi !== matchupIndex) return m;
          return { ...m, winner };
        });
      });

      const currentRound = rounds[roundIndex];
      const allDone = currentRound.every(m => m.winner !== null);

      let newRounds = rounds;
      let newCurrentRound = roundIndex;
      let newCurrentMatchupIndex = matchupIndex + 1;
      let status = 'in-progress';
      let bracketWinner = null;

      if (allDone) {
        if (currentRound.length === 1) {
          // Final matchup complete — bracket done
          status = 'complete';
          bracketWinner = winner;
        } else {
          // Build next round
          const nextRound = buildNextRound(currentRound);
          if (nextRound && nextRound.length > 0) {
            newRounds = [...rounds, nextRound];
            newCurrentRound = roundIndex + 1;
            newCurrentMatchupIndex = 0;
          }
        }
      }

      return {
        ...b,
        rounds: newRounds,
        currentRound: newCurrentRound,
        currentMatchupIndex: newCurrentMatchupIndex,
        status,
        winner: bracketWinner,
      };
    });

    persistBrackets(next);
  }, [brackets, persistBrackets]);

  // Delete a bracket
  const deleteBracket = useCallback((bracketId) => {
    persistBrackets(brackets.filter(b => b.id !== bracketId));
  }, [brackets, persistBrackets]);

  // Get a single bracket by ID
  const getBracket = useCallback((bracketId) => {
    return brackets.find(b => b.id === bracketId) || null;
  }, [brackets]);

  // ── Weekly bracket ──────────────────────────────────────────────────────────

  const weekNumber = getCurrentWeekNumber();

  // Record the user's pick for one matchup. Option A: this does NOT advance the
  // bracket — the community's survivors are derived deterministically from the
  // seed. We only log the pick to the personal ledger (which feeds Crowd Match
  // and the future Eras DNA). Reads the latest ledger from the ref to avoid
  // stale closures.
  const recordWeeklyVote = useCallback((roundIndex, matchupIndex, winner) => {
    const w = weeklyStateRef.current;
    if (!w || !isNewWeeklyShape(w) || w.weekNumber !== getCurrentWeekNumber()) return;

    const key = `${roundIndex}_${matchupIndex}`;
    const winnerId = `${winner.albumId}_${winner.songIndex}`;
    const next = { ...w, personalVotes: { ...w.personalVotes, [key]: winnerId } };

    saveToStorage(WEEKLY_KEY, next);
    if (user) {
      // New shape has no nested arrays → writes directly, no JSON.stringify.
      setDoc(doc(db, 'users', user.uid), { weeklyBracket: next }, { merge: true }).catch(() => {});
    }
    setWeeklyState(next);
  }, [user]);

  // Mark a round's results reveal as watched (so the home hero advances past
  // "results are in" and the reveal isn't replayed every visit).
  const markWeeklyRevealSeen = useCallback((roundIndex) => {
    const w = weeklyStateRef.current;
    if (!w || !isNewWeeklyShape(w)) return;
    if (w.revealsSeen?.[roundIndex]) return;
    const next = { ...w, revealsSeen: { ...w.revealsSeen, [roundIndex]: true } };
    saveToStorage(WEEKLY_KEY, next);
    if (user) {
      setDoc(doc(db, 'users', user.uid), { weeklyBracket: next }, { merge: true }).catch(() => {});
    }
    setWeeklyState(next);
  }, [user]);

  return {
    brackets,
    createBracket,
    recordWinner,
    deleteBracket,
    getBracket,
    // Weekly
    weekNumber,
    weeklyState,
    recordWeeklyVote,
    markWeeklyRevealSeen,
  };
}
