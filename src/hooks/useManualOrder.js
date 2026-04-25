import { useState, useCallback } from 'react';
import { SONGS } from '../data/albums';

// Stores a custom song order per album in localStorage.
// Format: { albumId: [songIndex, songIndex, ...] } — full list of indices in user-defined order.
const STORAGE_KEY = 'eras_manual_order';

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function useManualOrder() {
  const [orders, setOrders] = useState(loadOrders);

  // Get the manual order for an album.
  // If none saved yet, return the default track order (0, 1, 2, ...).
  const getManualOrder = useCallback((albumId) => {
    if (orders[albumId]) return orders[albumId];
    return (SONGS[albumId] || []).map((_, i) => i);
  }, [orders]);

  // Move the song at `position` one slot up (toward the top)
  const moveUp = useCallback((albumId, position) => {
    if (position === 0) return;
    setOrders(prev => {
      const current = prev[albumId] || (SONGS[albumId] || []).map((_, i) => i);
      const next = [...current];
      [next[position - 1], next[position]] = [next[position], next[position - 1]];
      const updated = { ...prev, [albumId]: next };
      saveOrders(updated);
      return updated;
    });
  }, []);

  // Move the song at `position` one slot down (toward the bottom)
  const moveDown = useCallback((albumId, position) => {
    setOrders(prev => {
      const current = prev[albumId] || (SONGS[albumId] || []).map((_, i) => i);
      if (position >= current.length - 1) return prev;
      const next = [...current];
      [next[position], next[position + 1]] = [next[position + 1], next[position]];
      const updated = { ...prev, [albumId]: next };
      saveOrders(updated);
      return updated;
    });
  }, []);

  // Move song from one position to another (drag and drop)
  const reorder = useCallback((albumId, fromPos, toPos) => {
    if (fromPos === toPos) return;
    setOrders(prev => {
      const current = prev[albumId] || (SONGS[albumId] || []).map((_, i) => i);
      const next = [...current];
      const [item] = next.splice(fromPos, 1);
      next.splice(toPos, 0, item);
      const updated = { ...prev, [albumId]: next };
      saveOrders(updated);
      return updated;
    });
  }, []);

  // Directly set the full order for an album (used by "Resort by score")
  const setOrder = useCallback((albumId, indices) => {
    setOrders(prev => {
      const updated = { ...prev, [albumId]: indices };
      saveOrders(updated);
      return updated;
    });
  }, []);

  return { getManualOrder, moveUp, moveDown, reorder, setOrder };
}
