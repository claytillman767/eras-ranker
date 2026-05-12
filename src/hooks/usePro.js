import { useState, useCallback, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_CATEGORIES, EXTRA_CATEGORIES } from '../data/categories';
import { isDevEmail } from '../uat';
import { isBetaEmail } from '../data/betaEmails';

// Lemon Squeezy storefront slug — the prefix on the checkout URL.
// Hardcoded because it rarely changes and avoids a new env var per store.
const LS_STORE_SLUG = 'erasranker';

// Variant checkout UUIDs come from Vercel env vars so we can swap them
// without code changes (e.g. switching from test to live mode flips both
// UUIDs at once). When either env var is missing, unlockPro falls back to
// the mock-grant path so local dev still works for testing other features.
//
// IMPORTANT: these are the CHECKOUT UUIDs (e.g. 0c29fa1b-03ef-…) shown in
// LS dashboard → Products → Share, NOT the internal numeric variant IDs.
// LS's checkout URLs are `/checkout/buy/{uuid}`; numeric variant IDs 404
// at `/buy/{id}`. Env var names kept as VARIANT_ID for backwards
// compatibility with the existing Vercel config.
const LS_VARIANT_MONTHLY = import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_ID_MONTHLY;
const LS_VARIANT_ANNUAL  = import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_ID_ANNUAL;
const LS_WIRED = !!(LS_VARIANT_MONTHLY && LS_VARIANT_ANNUAL);

// How long to keep the "Processing your payment…" banner up after the
// LS overlay closes before giving up and clearing the in-flight state.
// 90s comfortably covers the typical 1–5s webhook delivery window plus
// LS API hiccups, while still feeling un-stuck if the user closed without
// paying.
const UPGRADE_FAILSAFE_MS = 90_000;

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

  // Subscription metadata mirrored from the Firestore doc. The webhook
  // populates these fields on every subscription event so the UI can show:
  //   - a "Manage subscription" button when a portal URL is present
  //   - "Cancels on {date}" copy when the user has cancelled but still has
  //     access until period end
  const [customerPortalUrl, setCustomerPortalUrl] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState(null);
  // Next renewal date for ACTIVE subscriptions. Webhook stores LS's
  // `renews_at` here on every subscription_created/updated event.
  // (Distinct from subscriptionEndsAt, which is set only after a cancel.)
  const [nextRenewalAt, setNextRenewalAt] = useState(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);

  // True from the moment the user opens the LS checkout until the webhook
  // writes isPro=true (or the failsafe timer expires). Drives the
  // "Processing your payment…" banner. Tracked via a ref so unlockPro can
  // arm the failsafe without re-running every render.
  const [isUpgrading, setIsUpgrading] = useState(false);
  const upgradeTimerRef = useRef(null);

  function clearUpgradeTimer() {
    if (upgradeTimerRef.current) {
      clearTimeout(upgradeTimerRef.current);
      upgradeTimerRef.current = null;
    }
  }

  // Tracks the previous user so we can detect a real sign-out transition
  // (had a user, now don't) without firing on the initial null→null render.
  const prevUserRef = useRef(null);

  // Live Firestore subscription on users/{uid}.
  //
  // Cloud wins unconditionally — a localStorage 'eras_is_pro=true' without
  // a matching cloud record is either stale state or DevTools tampering, so
  // we mirror cloud truth on every snapshot.
  //
  // We use onSnapshot (not getDoc) so the moment the LS webhook writes
  // isPro=true to the user doc, the UI flips to Pro within a second or two
  // — no refresh needed. Same listener catches subscription cancellations,
  // payment failures, and webhook-driven status changes in real time.
  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    // Sign-out transition: had a user, now don't. Doesn't fire on the
    // initial null→null render (prevUser starts null too).
    if (prevUser && !user) {
      setIsPro(false);
      setCustomerPortalUrl(null);
      setSubscriptionStatus(null);
      setSubscriptionEndsAt(null);
      setNextRenewalAt(null);
      setSubscriptionPlan(null);
      localStorage.removeItem(KEY_IS_PRO);
      return;
    }

    if (!user || !db) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const data = snap.exists() ? snap.data() : null;
        const cloudIsPro = data?.isPro === true;
        // Beta override: anyone on the BETA_EMAILS allowlist gets Pro for
        // free during the beta. Layered on top of cloud truth so removing
        // someone from the list immediately revokes Pro on next render —
        // we deliberately don't write the override to Firestore.
        // Goes away when the beta gate is removed at launch.
        const effectiveIsPro = cloudIsPro || isBetaEmail(user.email);
        if (effectiveIsPro) {
          setIsPro(true);
          localStorage.setItem(KEY_IS_PRO, 'true');
        } else {
          setIsPro(false);
          localStorage.removeItem(KEY_IS_PRO);
        }
        setCustomerPortalUrl(data?.customerPortalUrl ?? null);
        setSubscriptionStatus(data?.subscriptionStatus ?? null);
        setSubscriptionEndsAt(data?.subscriptionEndsAt ?? null);
        setNextRenewalAt(data?.currentPeriodEnd ?? null);
        setSubscriptionPlan(data?.proPlan ?? null);
      },
      () => {
        // Network or permission error — keep local state for now rather
        // than wrongly revoking Pro because Firestore was momentarily
        // unreachable.
      }
    );

    return unsubscribe;
  }, [user]);

  // When isPro flips to true (webhook landed), clear the in-flight banner.
  useEffect(() => {
    if (isPro && isUpgrading) {
      setIsUpgrading(false);
      clearUpgradeTimer();
    }
  }, [isPro, isUpgrading]);

  // Open the Lemon Squeezy checkout overlay (if lemon.js loaded) or fall
  // back to a redirect. user.uid is passed as custom_data so the webhook
  // can find the right Firestore doc when the subscription is created.
  //
  // Returns true if the checkout was opened, false if blocked (no user, or
  // we're in mock-fallback mode and the legacy mock unlock fired instead).
  // The caller doesn't need to await — Pro state flips via the onSnapshot
  // listener once the webhook lands.
  //
  // Pro upgrades REQUIRE a signed-in account. LS's customer record needs a
  // stable identity, and the entitlement should follow the user across
  // devices.
  const unlockPro = useCallback((plan = 'monthly') => {
    if (!user || !db) return false;

    // Mock-grant path. Used in three cases:
    //   1. Local dev / pre-LS environments where the variant-ID env vars
    //      aren't set, so other Pro features can be tested without LS.
    //   2. Developer accounts (isDevEmail) so we can test upgrade-gated UI
    //      end-to-end without running real cards through Lemon Squeezy.
    //   3. Beta testers (isBetaEmail) — they already have Pro via the
    //      override in the onSnapshot effect above; this just makes sure
    //      a stray tap on an upgrade button never opens a real checkout.
    // All three paths write isPro=true to Firestore + localStorage and skip
    // the LS checkout entirely.
    if (!LS_WIRED || isDevEmail(user.email) || isBetaEmail(user.email)) {
      localStorage.setItem(KEY_IS_PRO, 'true');
      setIsPro(true);
      setDoc(
        doc(db, 'users', user.uid),
        { isPro: true, proPlan: plan, proUpgradedAt: serverTimestamp() },
        { merge: true }
      ).catch(() => {});
      return true;
    }

    const variantUuid = plan === 'annual' ? LS_VARIANT_ANNUAL : LS_VARIANT_MONTHLY;
    const params = new URLSearchParams();
    params.set('checkout[custom][uid]', user.uid);
    if (user.email) params.set('checkout[email]', user.email);
    // Path must be `/checkout/buy/{uuid}` — `/buy/{id}` returns 404 for
    // most stores. UUID is the share-panel checkout UUID, not the
    // numeric variant ID.
    const checkoutUrl = `https://${LS_STORE_SLUG}.lemonsqueezy.com/checkout/buy/${variantUuid}?${params.toString()}`;

    // Mark in-flight and arm the failsafe so the banner doesn't hang forever
    // if the user closes the overlay without paying. The success path clears
    // it sooner via the isPro→true effect above.
    setIsUpgrading(true);
    clearUpgradeTimer();
    upgradeTimerRef.current = setTimeout(() => {
      setIsUpgrading(false);
      upgradeTimerRef.current = null;
    }, UPGRADE_FAILSAFE_MS);

    // Open the LS overlay if lemon.js has loaded; otherwise fall back to a
    // new-tab redirect so the user still gets to checkout. main.jsx loads
    // the script at app start, so the overlay is normally available.
    if (typeof window !== 'undefined' && window.LemonSqueezy?.Url?.Open) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      window.open(checkoutUrl, '_blank', 'noopener');
    }

    return true;
  }, [user]);

  // Cleanup any pending failsafe timer when the hook unmounts.
  useEffect(() => () => clearUpgradeTimer(), []);

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
    isUpgrading,
    customerPortalUrl,
    subscriptionStatus,
    subscriptionEndsAt,
    nextRenewalAt,
    subscriptionPlan,
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
