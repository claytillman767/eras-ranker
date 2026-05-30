import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

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

  let current = null;
  for (const id in entries) {
    if (!current || entries[id].seq > current.seq) current = entries[id];
  }

  return (
    <Ctx.Provider value={{ current, register, unregister }}>
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

  useEffect(() => {
    if (!ctx) return undefined;
    ctx.register(idRef.current, key, detail);
    return () => ctx.unregister(idRef.current);
  }, [ctx, key, detail]);
}

// Read the current winning screen entry ({ key, detail }) or null.
export function useCurrentFeedbackScreen() {
  const ctx = useContext(Ctx);
  return ctx?.current ?? null;
}
