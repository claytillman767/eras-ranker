import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const STORAGE_KEY = 'eras_settings';

const DEFAULTS = {
  showCategoryBars:       true,   // show the mini score-bar breakdown on song rows
  spotifyAutoplay:        true,   // automatically start Spotify playback when a new song appears in QuickScore
  spotifyBridgeAutoplay:  false,  // auto-seek to bridge timestamp when the Bridge category appears
  spotifyVolume:          0.8,    // Spotify player volume (0–1)
  confirmQuickScoreExit:  true,   // ask for confirmation before closing QuickScore mid-session
};

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveToFirestore(user, settings) {
  if (!user) return;
  setDoc(doc(db, 'users', user.uid), { settings }, { merge: true }).catch(() => {});
}

export function useSettings(user) {
  const [settings, setSettingsState] = useState(loadSettings);

  // On login, pull settings from Firestore (cloud wins).
  // If nothing in Firestore yet, migrate any non-default local settings up.
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().settings) {
        const cloud = { ...DEFAULTS, ...snap.data().settings };
        setSettingsState(cloud);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud));
      } else {
        const local = loadSettings();
        const hasCustom = Object.keys(DEFAULTS).some(k => local[k] !== DEFAULTS[k]);
        if (hasCustom) saveToFirestore(user, local);
      }
    }).catch(() => {});
  }, [user]);

  const updateSetting = useCallback((key, value) => {
    setSettingsState(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      saveToFirestore(user, next);
      return next;
    });
  }, [user]);

  return { settings, updateSetting };
}
