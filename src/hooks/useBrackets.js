import { useState, useCallback, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  generateBracket,
  buildNextRound,
  getCurrentWeekNumber,
  getWeeklyCategoryName,
} from '../constants/bracketCategories';

const STORAGE_KEY = 'eras_brackets';
const WEEKLY_KEY = 'eras_weekly_bracket';
const DAILY_KEY = 'eras_daily_bracket';

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

export function useBrackets(user) {
  const [brackets, setBrackets] = useState(() => loadFromStorage(STORAGE_KEY) || []);
  const [weeklyState, setWeeklyState] = useState(() => loadFromStorage(WEEKLY_KEY) || null);
  const [dailyState, setDailyState] = useState(() => loadFromStorage(DAILY_KEY) || null);

  // Ref that always points to the latest weeklyState — used by recordWeeklyVote
  // to avoid stale closures without using a functional updater (which crashed in StrictMode).
  const weeklyStateRef = useRef(weeklyState);
  weeklyStateRef.current = weeklyState;

  // Sync brackets to Firestore when user logs in
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().brackets) {
        const cloud = snap.data().brackets;
        setBrackets(cloud);
        saveToStorage(STORAGE_KEY, cloud);
      } else {
        const local = loadFromStorage(STORAGE_KEY) || [];
        if (local.length > 0) {
          setDoc(doc(db, 'users', user.uid), { brackets: local }, { merge: true }).catch(() => {});
        }
      }
      if (snap.exists() && snap.data().weeklyBracket) {
        const raw = snap.data().weeklyBracket;
        // rounds is serialized as a JSON string to work around Firestore's nested-array restriction
        const w = typeof raw.rounds === 'string'
          ? { ...raw, rounds: JSON.parse(raw.rounds) }
          : raw;
        const currentWk = getCurrentWeekNumber();
        setWeeklyState(prev => {
          // Keep local state if it's the same week and has at least as many votes —
          // prevents a stale Firestore read (e.g. from StrictMode double-effect) from
          // reverting votes the user just cast.
          if (
            prev && prev.weekNumber === currentWk && w.weekNumber === currentWk &&
            (prev.votes?.length ?? 0) >= (w.votes?.length ?? 0)
          ) return prev;
          saveToStorage(WEEKLY_KEY, w);
          return w;
        });
      }
    }).catch(() => {});
  }, [user]);

  // Persist brackets to localStorage + Firestore
  const persistBrackets = useCallback((next) => {
    saveToStorage(STORAGE_KEY, next);
    if (user) {
      setDoc(doc(db, 'users', user.uid), { brackets: next }, { merge: true }).catch(() => {});
    }
    setBrackets(next);
  }, [user]);

  // Initialize weekly + daily on mount so they're ready before the user taps anything.
  // This avoids calling state-setters from the render phase (which React forbids).
  useEffect(() => {
    const wk = getCurrentWeekNumber();

    // Weekly — reset if it's a new week
    setWeeklyState(prev => {
      if (prev && prev.weekNumber === wk) return prev;
      const seed = wk * 999983;
      const generated = generateBracket('most-devastating', 'all', seed);
      if (!generated) return prev;
      const next = {
        weekNumber: wk,
        categoryName: getWeeklyCategoryName(wk),
        seed,
        status: 'in-progress',
        currentRound: 0,
        currentMatchupIndex: 0,
        contestants: generated.contestants,
        rounds: generated.rounds,
        votes: [],
        winner: null,
      };
      saveToStorage(WEEKLY_KEY, next);
      return next;
    });

    // Daily — reset if it's a new day
    const today = Math.floor(Date.now() / 86400000).toString();
    setDailyState(prev => {
      if (prev && prev.dayKey === today) return prev;
      const seed = parseInt(today) * 777;
      const generated = generateBracket('most-devastating', 'all', seed);
      if (!generated) return prev;
      const next = {
        dayKey: today,
        contestants: generated.contestants,
        matchups: generated.rounds[0].slice(0, 3),
        currentIndex: 0,
        votes: [],
        done: false,
      };
      saveToStorage(DAILY_KEY, next);
      return next;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Create a new personal bracket
  const createBracket = useCallback((categoryId, scope = 'all') => {
    const seed = Date.now();
    const generated = generateBracket(categoryId, scope, seed);
    if (!generated) return null;

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

  const recordWeeklyVote = useCallback((_roundIndex, _matchupIndex, winner) => {
    const w = weeklyStateRef.current;
    if (!w || !w.rounds || w.weekNumber !== getCurrentWeekNumber()) return;

    // Always use the authoritative position from state — never trust params from stale closures.
    const roundIndex = w.currentRound;
    const matchupIndex = w.currentMatchupIndex;

    const rounds = w.rounds.map((round, ri) => {
      if (ri !== roundIndex) return round;
      return round.map((m, mi) => {
        if (mi !== matchupIndex) return m;
        return { ...m, winner };
      });
    });

    const currentRound = rounds[roundIndex];
    if (!currentRound) return;
    const allDone = currentRound.every(m => m.winner !== null);

    let newRounds = rounds;
    let newCurrentRound = roundIndex;
    let newCurrentMatchupIndex = matchupIndex + 1;
    let status = 'in-progress';
    let bracketWinner = null;

    if (allDone) {
      if (currentRound.length === 1) {
        status = 'complete';
        bracketWinner = winner;
      } else {
        const nextRound = buildNextRound(currentRound);
        if (nextRound) {
          newRounds = [...rounds, nextRound];
          newCurrentRound = roundIndex + 1;
          newCurrentMatchupIndex = 0;
        }
      }
    }

    const prevVotes = w.votes || [];
    const votes = [
      ...prevVotes.filter(v => !(v.roundIndex === roundIndex && v.matchupIndex === matchupIndex)),
      { roundIndex, matchupIndex, winnerId: `${winner.albumId}_${winner.songIndex}` },
    ];

    const next = {
      ...w,
      rounds: newRounds,
      currentRound: newCurrentRound,
      currentMatchupIndex: newCurrentMatchupIndex,
      status,
      winner: bracketWinner,
      votes,
    };

    saveToStorage(WEEKLY_KEY, next);
    if (user) {
      // Firestore doesn't support nested arrays (rounds is array-of-arrays).
      // Serialize rounds to JSON string so the document is valid.
      try {
        const firestoreNext = { ...next, rounds: JSON.stringify(next.rounds) };
        setDoc(doc(db, 'users', user.uid), { weeklyBracket: firestoreNext }, { merge: true }).catch(() => {});
      } catch {
        // skip Firestore sync if serialization fails
      }
    }
    setWeeklyState(next);
  }, [user]);

  // ── Daily bracket ───────────────────────────────────────────────────────────

  const todayKey = Math.floor(Date.now() / 86400000).toString();

  const recordDailyVote = useCallback((matchupIndex, winner) => {
    const d = dailyState;
    if (!d) return;

    const matchups = d.matchups.map((m, i) => {
      if (i !== matchupIndex) return m;
      return { ...m, winner };
    });

    const newIndex = matchupIndex + 1;
    const done = newIndex >= matchups.length;

    const next = {
      ...d,
      matchups,
      currentIndex: newIndex,
      done,
      votes: [...(d.votes || []), { matchupIndex, winnerId: `${winner.albumId}_${winner.songIndex}` }],
    };
    saveToStorage(DAILY_KEY, next);
    setDailyState(next);
  }, [dailyState]);

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
    // Daily
    dailyState,
    recordDailyVote,
    todayKey,
  };
}
