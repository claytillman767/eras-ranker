import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

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

function saveModesToFirestore(user, modes) {
  if (!user) return;
  setDoc(doc(db, 'users', user.uid), { albumModes: modes }, { merge: true }).catch(() => {});
}

export function useAlbumModes(user) {
  const [modes, setModes] = useState(loadModes);

  // When the user logs in, pull their album modes from Firestore.
  // If Firestore is empty, migrate from localStorage.
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().albumModes) {
        const cloud = snap.data().albumModes;
        setModes(cloud);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud));
      } else {
        const local = loadModes();
        if (Object.keys(local).length > 0) {
          saveModesToFirestore(user, local);
        }
      }
    }).catch(() => {});
  }, [user]);

  // Returns 'score', 'manual', or null if the user hasn't chosen yet.
  const getAlbumMode = useCallback((albumId) => {
    return modes[albumId] ?? null;
  }, [modes]);

  const setAlbumMode = useCallback((albumId, mode) => {
    setModes(prev => {
      const updated = { ...prev, [albumId]: mode };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      saveModesToFirestore(user, updated);
      return updated;
    });
  }, [user]);

  return { getAlbumMode, setAlbumMode };
}
