// Overridable clock for the admin time-travel panel.
//
// getNow() returns the real time PLUS an offset that the admin can set from the
// Settings → Admin panel (gated to an admin uid). For every normal user the
// offset is 0, so getNow() === Date.now(). The weekly bracket reads getNow()
// instead of Date.now() so an admin can step through the later screens
// (results reveal, locked/waiting, Sunday champion) without waiting for the
// real Mon→Sun schedule. The offset lives in localStorage and only shifts the
// bracket view on this one device — it grants no entitlements and writes
// nothing to the server.

import { useEffect, useState } from 'react';

const OFFSET_KEY = 'eras_dev_clock_offset';
const EVENT = 'eras-devclock';

export function getOffset() {
  try { return Number(localStorage.getItem(OFFSET_KEY)) || 0; } catch { return 0; }
}

export function getNow() {
  return Date.now() + getOffset();
}

export function setOffset(ms) {
  try { localStorage.setItem(OFFSET_KEY, String(Math.round(ms))); } catch {}
  try { window.dispatchEvent(new Event(EVENT)); } catch {}
}

export function advanceMs(ms) {
  setOffset(getOffset() + ms);
}

export function resetClock() {
  setOffset(0);
}

// Subscribe to offset changes (used by the weekly UI so it updates live when
// the admin advances time). Returns an unsubscribe fn.
export function subscribeDevClock(cb) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

// Hook for components that should re-render when the offset changes.
export function useDevClock() {
  const [offset, setOff] = useState(getOffset);
  useEffect(() => subscribeDevClock(() => setOff(getOffset())), []);
  return { offset, getNow, setOffset, advanceMs, resetClock };
}
