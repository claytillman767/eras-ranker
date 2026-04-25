import { useState, useCallback } from 'react';

// Stores the user's chosen mode per album so the intro modal only shows once.
// Modes: 'score' (Vibe Check) | 'manual' (Sort It Yourself)
const STORAGE_KEY = 'eras_album_modes';

function loadModes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function useAlbumModes() {
  const [modes, setModes] = useState(loadModes);

  // Returns 'score', 'manual', or null if the user hasn't chosen yet.
  const getAlbumMode = useCallback((albumId) => {
    return modes[albumId] ?? null;
  }, [modes]);

  const setAlbumMode = useCallback((albumId, mode) => {
    setModes(prev => {
      const updated = { ...prev, [albumId]: mode };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { getAlbumMode, setAlbumMode };
}
