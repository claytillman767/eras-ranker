import { useState, useCallback, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_CATEGORIES, EXTRA_CATEGORIES } from '../data/categories';

// localStorage keys
const KEY_IS_PRO            = 'eras_is_pro';
const KEY_ENABLED_EXTRAS    = 'eras_enabled_extras';
const KEY_CUSTOM_CATS       = 'eras_custom_categories';
const KEY_WEIGHTS           = 'eras_category_weights';
const KEY_DISABLED_CUSTOMS  = 'eras_disabled_customs';
const KEY_DISABLED_DEFAULTS = 'eras_disabled_defaults';

export const CUSTOM_CAT_LIMIT = 13;

function loadPro()     { return localStorage.getItem(KEY_IS_PRO) === 'true'; }
function loadExtras()  {
  try { return new Set(JSON.parse(localStorage.getItem(KEY_ENABLED_EXTRAS) || '[]')); }
  catch { return new Set(); }
}
function loadCustom()  {
  try { return JSON.parse(localStorage.getItem(KEY_CUSTOM_CATS) || '[]'); }
  catch { return []; }
}
function loadWeights() {
  try { return JSON.parse(localStorage.getItem(KEY_WEIGHTS) || '{}'); }
  catch { return {}; }
}
function loadDisabledCustoms() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY_DISABLED_CUSTOMS) || '[]')); }
  catch { return new Set(); }
}
function loadDisabledDefaults() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY_DISABLED_DEFAULTS) || '[]')); }
  catch { return new Set(); }
}

export function usePro(user) {
  const [isPro, setIsPro]               = useState(loadPro);
  const [enabledExtras, setEnabledExtras] = useState(loadExtras);
  const [customCategories, setCustomCategories] = useState(loadCustom);
  const [categoryWeights, setCategoryWeightsState] = useState(loadWeights);
  const [disabledCustoms, setDisabledCustoms] = useState(loadDisabledCustoms);
  const [disabledDefaults, setDisabledDefaults] = useState(loadDisabledDefaults);

  // Tracks the previous user so we can detect a real sign-out transition
  // (had a user, now don't) without firing on the initial null→null render.
  const prevUserRef = useRef(null);

  // Watches `user` changes — handles both sign-in (hydrate from Firestore)
  // and sign-out (revoke Pro locally) for the same entitlement flag.
  //
  // SIGN-IN — CLOUD WINS unconditionally. Unlike the other hooks (ratings,
  // manualOrder, settings) we do NOT migrate localStorage up to the cloud
  // here. A paid Pro purchase only ever exists in Firestore (written by
  // unlockPro while signed in), so a localStorage 'eras_is_pro=true' without
  // a matching cloud record is either stale state or DevTools tampering —
  // either way, cloud is the truth and local resets to match.
  //
  // SIGN-OUT — clears the local Pro flag so the device stops claiming the
  // entitlement once the account that paid for it leaves. Firestore still
  // has the isPro record on the user's doc, so signing back in restores
  // Pro instantly via the hydration branch.
  //
  // Other Pro-related state (extras, custom categories, weights) is left
  // alone — those are user preferences, not entitlements.
  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    // Sign-out transition: had a user, now don't. Doesn't fire on the
    // initial null→null render (prevUser starts null too).
    if (prevUser && !user) {
      setIsPro(false);
      localStorage.removeItem(KEY_IS_PRO);
      return;
    }

    if (!user || !db) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const cloudIsPro = snap.exists() && snap.data().isPro === true;
      if (cloudIsPro) {
        setIsPro(true);
        localStorage.setItem(KEY_IS_PRO, 'true');
      } else {
        setIsPro(false);
        localStorage.removeItem(KEY_IS_PRO);
      }
    }).catch(() => {
      // Network or permission error — keep local state for now rather than
      // wrongly revoking Pro because Firestore was momentarily unreachable.
    });
  }, [user]);

  // Mock unlock — sets isPro immediately without any payment.
  // Replace this with Lemon Squeezy Checkout in production (see CLAUDE.md
  // "Payment provider plan"). The `plan` argument ('monthly' | 'annual') is
  // captured now so the LS hook-up later only needs to read it and open the
  // matching checkout variant.
  //
  // Pro upgrades REQUIRE a signed-in account. This ties the purchase to a
  // user identity (so it carries to other devices and survives a localStorage
  // wipe), and it's a hard prerequisite once Lemon Squeezy is wired up —
  // LS needs a customer record. Returns true on success, false if no user.
  const unlockPro = useCallback((plan = 'monthly') => {
    if (!user || !db) return false;
    localStorage.setItem(KEY_IS_PRO, 'true');
    setIsPro(true);
    setDoc(
      doc(db, 'users', user.uid),
      { isPro: true, proPlan: plan, proUpgradedAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {});
    return true;
  }, [user]);

  // Toggle an extra category on or off
  const toggleExtra = useCallback((id) => {
    setEnabledExtras(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      localStorage.setItem(KEY_ENABLED_EXTRAS, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Toggle a custom category on/off (does not affect stored ratings)
  const toggleCustom = useCallback((id) => {
    setDisabledCustoms(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      localStorage.setItem(KEY_DISABLED_CUSTOMS, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Toggle a default category on/off. Stored star ratings are preserved —
  // turning the category off just removes it from the active set so it stops
  // counting toward composite scores. Turning it back on re-applies them.
  const toggleDefault = useCallback((id) => {
    setDisabledDefaults(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      localStorage.setItem(KEY_DISABLED_DEFAULTS, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Update the type ('stars' | 'yesno') of an existing custom category
  const setCustomCategoryType = useCallback((id, type) => {
    setCustomCategories(prev => {
      const next = prev.map(c => c.id === id ? { ...c, type } : c);
      localStorage.setItem(KEY_CUSTOM_CATS, JSON.stringify(next));
      return next;
    });
  }, []);

  // Add a new custom category (max name length 30 chars, max CUSTOM_CAT_LIMIT total)
  const addCustomCategory = useCallback((name, type = 'stars') => {
    const trimmed = name.trim().slice(0, 30);
    if (!trimmed) return;
    setCustomCategories(prev => {
      if (prev.length >= CUSTOM_CAT_LIMIT) return prev;
      const newCat = { id: `custom_${Date.now()}`, name: trimmed, weight: 10, type };
      const next = [...prev, newCat];
      localStorage.setItem(KEY_CUSTOM_CATS, JSON.stringify(next));
      return next;
    });
  }, []);

  // Set a raw priority weight for a category by id
  const setCategoryWeight = useCallback((id, value) => {
    setCategoryWeightsState(prev => {
      const next = { ...prev, [id]: value };
      localStorage.setItem(KEY_WEIGHTS, JSON.stringify(next));
      return next;
    });
  }, []);

  // Clear all weight overrides — restores every category to its built-in default
  const resetCategoryWeights = useCallback(() => {
    localStorage.removeItem(KEY_WEIGHTS);
    setCategoryWeightsState({});
  }, []);

  // Remove a custom category by id
  const removeCustomCategory = useCallback((id) => {
    setCustomCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem(KEY_CUSTOM_CATS, JSON.stringify(next));
      return next;
    });
  }, []);

  // Build the full list of active categories and recalculate weights so they sum to exactly 100.
  // Order: default cats → enabled extra cats → custom cats
  const getActiveCategories = useCallback(() => {
    // Collect all active categories, using stored weight overrides when present
    const active = [
      ...DEFAULT_CATEGORIES.filter(c => !disabledDefaults.has(c.id)).map(c => ({ ...c, weight: categoryWeights[c.id] ?? c.weight })),
      ...EXTRA_CATEGORIES.filter(c => enabledExtras.has(c.id)).map(c => ({ ...c, weight: categoryWeights[c.id] ?? 10 })),
      ...customCategories.filter(c => !disabledCustoms.has(c.id)).map(c => ({ ...c, weight: categoryWeights[c.id] ?? c.weight })),
    ];

    // Sum of all raw weights
    const totalRaw = active.reduce((sum, c) => sum + c.weight, 0);
    if (totalRaw === 0) return active;

    // Scale each weight proportionally so they sum to 100
    let scaled = active.map(c => ({
      ...c,
      weight: Math.round((c.weight / totalRaw) * 100),
    }));

    // Fix rounding drift — adjust the largest category so the total is exactly 100
    const scaledSum = scaled.reduce((sum, c) => sum + c.weight, 0);
    const diff = 100 - scaledSum;
    if (diff !== 0) {
      const maxIdx = scaled.reduce((best, c, i) => c.weight > scaled[best].weight ? i : best, 0);
      scaled[maxIdx] = { ...scaled[maxIdx], weight: scaled[maxIdx].weight + diff };
    }

    return scaled;
  }, [enabledExtras, customCategories, categoryWeights, disabledCustoms, disabledDefaults]);

  return {
    isPro,
    unlockPro,
    enabledExtras,
    toggleExtra,
    customCategories,
    addCustomCategory,
    removeCustomCategory,
    disabledCustoms,
    toggleCustom,
    disabledDefaults,
    toggleDefault,
    setCustomCategoryType,
    categoryWeights,
    setCategoryWeight,
    resetCategoryWeights,
    getActiveCategories,
  };
}
