import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';

// Lightweight "where is the user right now?" registry for the Feedback button.
//
// Any screen or overlay calls useFeedbackScreen(key, detail) on mount. The most
// recently registered live entry wins, so an overlay (QuickScore, a bracket
// matchup) automatically beats the screen beneath it. FeedbackButton reads the
// winner and stamps it onto each submission.

const Ctx = createContext(null);

// Monotonic counter — the highest-seq live entry is the current screen.
let _seq = 0;

export function FeedbackScreenProvider({ children }) {
  const [entries, setEntries] = useState({});
  // Whether the feedback modal is open. Held here (not in a launcher) so any
  // launcher icon — header or an overlay top bar — can open the one shared
  // modal, which renders once at the app root.
  const [open, setOpen] = useState(false);

  const register = useCallback((id, key, detail) => {
    setEntries(prev => ({ ...prev, [id]: { key, detail, seq: ++_seq } }));
  }, []);

  const unregister = useCallback((id) => {
    setEntries(prev => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const openFeedback  = useCallback(() => setOpen(true), []);
  const closeFeedback = useCallback(() => setOpen(false), []);

  // Highest-seq live entry wins. Recomputed from `entries` only, so the
  // result is referentially stable as long as `entries` doesn't change.
  const current = useMemo(() => {
    let c = null;
    for (const id in entries) {
      if (!c || entries[id].seq > c.seq) c = entries[id];
    }
    return c;
  }, [entries]);

  // CRITICAL: memoize the context value. Without this, every provider render
  // produces a new value object, which makes `ctx` in useFeedbackScreen a new
  // reference every render. That new ref re-fires useFeedbackScreen's effect
  // (whose deps include ctx) which calls register → setEntries → re-render →
  // new value → … → "Maximum update depth exceeded". The render-loop bailout
  // is what made the bracket builder's Start button look like it did nothing.
  const value = useMemo(
    () => ({ current, register, unregister, open, openFeedback, closeFeedback }),
    [current, register, unregister, open, openFeedback, closeFeedback]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

// Call from a screen/overlay to report it as the user's current location.
// `key` matches a key in screenRegistry.js; `detail` is a free-text string
// (album name, song · category, week label) shown alongside the label.
export function useFeedbackScreen(key, detail = null) {
  const ctx = useContext(Ctx);
  const idRef = useRef(null);
  if (idRef.current === null) idRef.current = `fs_${++_seq}`;

  // Belt-and-suspenders: even with the provider's value memoized, we keep
  // ctx out of the effect deps via a ref. That way an unrelated provider
  // re-render can never re-trigger register/unregister churn — only an
  // actual change in screen `key` or `detail` does.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  useEffect(() => {
    const c = ctxRef.current;
    if (!c) return undefined;
    const id = idRef.current;
    c.register(id, key, detail);
    return () => ctxRef.current?.unregister(id);
  }, [key, detail]);
}

// Read the current winning screen entry ({ key, detail }) or null.
export function useCurrentFeedbackScreen() {
  const ctx = useContext(Ctx);
  return ctx?.current ?? null;
}

// Open/close controls for the shared feedback modal. `open` reflects the
// modal's current state. Returns no-op openers when used outside the provider.
export function useFeedbackControls() {
  const ctx = useContext(Ctx);
  return {
    open: ctx?.open ?? false,
    openFeedback: ctx?.openFeedback ?? (() => {}),
    closeFeedback: ctx?.closeFeedback ?? (() => {}),
  };
}
