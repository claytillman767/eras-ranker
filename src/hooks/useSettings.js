import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const STORAGE_KEY = 'eras_settings';

const DEFAULTS = {
  showCategoryBars:       true,   // show the mini score-bar breakdown on song rows
  confirmQuickScoreExit:  true,   // ask for confirmation before closing QuickScore mid-session
  theme:                  'light', // 'light' | 'dark' — drives the data-theme attribute
};

// Apply the theme by toggling data-theme on <html>. CSS variables in index.css
// do the rest. Also keeps the address-bar theme-color meta in sync. Light mode
// removes the attribute so the :root defaults apply.
function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0e1014' : '#a855f7');
}

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

  // Keep the document theme in sync with the setting. Covers the initial
  // load and any later change (including a value pulled down from Firestore
  // on login). The index.html bootstrap handles the very first paint; this
  // reconciles once React is running.
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

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
