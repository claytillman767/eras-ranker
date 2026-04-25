import { useState, useCallback } from 'react';
import { DEFAULT_CATEGORIES, EXTRA_CATEGORIES } from '../data/categories';

// localStorage keys
const KEY_IS_PRO        = 'eras_is_pro';
const KEY_ENABLED_EXTRAS = 'eras_enabled_extras';
const KEY_CUSTOM_CATS   = 'eras_custom_categories';
const KEY_WEIGHTS       = 'eras_category_weights';

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

export function usePro() {
  const [isPro, setIsPro]               = useState(loadPro);
  const [enabledExtras, setEnabledExtras] = useState(loadExtras);
  const [customCategories, setCustomCategories] = useState(loadCustom);
  const [categoryWeights, setCategoryWeightsState] = useState(loadWeights);

  // Mock unlock — sets isPro immediately without any payment.
  // Replace this with Stripe Checkout in production.
  const unlockPro = useCallback(() => {
    localStorage.setItem(KEY_IS_PRO, 'true');
    setIsPro(true);
  }, []);

  // Toggle an extra category on or off
  const toggleExtra = useCallback((id) => {
    setEnabledExtras(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      localStorage.setItem(KEY_ENABLED_EXTRAS, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Add a new custom category (max name length 30 chars)
  const addCustomCategory = useCallback((name) => {
    const trimmed = name.trim().slice(0, 30);
    if (!trimmed) return;
    const newCat = { id: `custom_${Date.now()}`, name: trimmed, weight: 10 };
    setCustomCategories(prev => {
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
      ...DEFAULT_CATEGORIES.map(c => ({ ...c, weight: categoryWeights[c.id] ?? c.weight })),
      ...EXTRA_CATEGORIES.filter(c => enabledExtras.has(c.id)).map(c => ({ ...c, weight: categoryWeights[c.id] ?? 10 })),
      ...customCategories.map(c => ({ ...c, weight: categoryWeights[c.id] ?? c.weight })),
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
  }, [enabledExtras, customCategories, categoryWeights]);

  return {
    isPro,
    unlockPro,
    enabledExtras,
    toggleExtra,
    customCategories,
    addCustomCategory,
    removeCustomCategory,
    categoryWeights,
    setCategoryWeight,
    resetCategoryWeights,
    getActiveCategories,
  };
}
