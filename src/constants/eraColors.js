// Era color palettes — primary and secondary used for card gradients in brackets.
// Each albumId maps to { primary, secondary, text, accent }.
import { ALL_ALBUMS } from '../data/albums';

export const ERA_COLORS = {
  tv: {
    primary: '#6b8cba',
    secondary: '#b8c9e1',
    text: '#1a2f4a',
    accent: '#4a6fa5',
    label: 'Taylor Swift (Debut)',
  },
  fe: {
    primary: '#d4a017',
    secondary: '#f5d97a',
    text: '#3d2c00',
    accent: '#b8860b',
    label: 'Fearless',
  },
  st: {
    primary: '#7c3aed',
    secondary: '#c4b5fd',
    text: '#2e1065',
    accent: '#6d28d9',
    label: 'Speak Now',
  },
  rd: {
    primary: '#b91c1c',
    secondary: '#fca5a5',
    text: '#1c0a0a',
    accent: '#991b1b',
    label: 'Red',
  },
  '89': {
    primary: '#0ea5e9',
    secondary: '#bae6fd',
    text: '#0c1d2e',
    accent: '#0284c7',
    label: '1989',
  },
  rp: {
    primary: '#1c1c1c',
    secondary: '#3d4d3a',
    text: '#e5e5e5',
    accent: '#4a7c59',
    label: 'Reputation',
  },
  lv: {
    primary: '#ec4899',
    secondary: '#fbcfe8',
    text: '#3b0764',
    accent: '#a855f7',
    label: 'Lover',
  },
  fl: {
    primary: '#4b5563',
    secondary: '#d1d5db',
    text: '#111827',
    accent: '#374151',
    label: 'Folklore',
  },
  ev: {
    primary: '#92400e',
    secondary: '#fde68a',
    text: '#1c0a00',
    accent: '#b45309',
    label: 'Evermore',
  },
  ml: {
    primary: '#1e3a5f',
    secondary: '#c7d2fe',
    text: '#f0f4ff',
    accent: '#6366f1',
    label: 'Midnights',
  },
  tp: {
    primary: '#44403c',
    secondary: '#e7e5e4',
    text: '#1c1917',
    accent: '#78716c',
    label: 'TTPD',
  },
  ls: {
    primary: '#701a75',
    secondary: '#f5d0fe',
    text: '#1a0028',
    accent: '#a21caf',
    label: 'The Life of a Showgirl',
  },
};

// Fallback for songs without a known album
export const DEFAULT_ERA_COLORS = {
  primary: '#6b7280',
  secondary: '#d1d5db',
  text: '#111827',
  accent: '#374151',
  label: 'Taylor Swift',
};

export function getEraColors(albumId) {
  return ERA_COLORS[albumId] || DEFAULT_ERA_COLORS;
}

// ── Weekly-bracket tile palette ─────────────────────────────────────────────
// The redesigned weekly bracket renders songs as vibrant gradient tiles (emoji
// on a colored square) over a dark navy "arena" background. Those tiles need a
// brighter primary + a darker gradient end + an on-tile text color — tuned to
// sit in the SAME color family as each album's ERA_COLORS above, so an album
// reads consistently across the old and new bracket surfaces. Cosmetic — tweak
// freely.
//   tile — bright primary (lighter end of the tile gradient)
//   deep — darker end of the tile gradient
//   ink  — text / numerals laid ON the tile (must contrast with `tile`)
export const ERA_TILES = {
  tv: { tile: '#8fb0d6', deep: '#3c5980', ink: '#102338' }, // Debut — steel blue
  fe: { tile: '#e8bd45', deep: '#8a6610', ink: '#3a2900' }, // Fearless — gold
  st: { tile: '#9258d6', deep: '#56268a', ink: '#ffffff' }, // Speak Now — violet
  rd: { tile: '#d83a3f', deep: '#6b0f12', ink: '#ffe1e3' }, // Red — crimson
  '89': { tile: '#5cc0ef', deep: '#0b6ea0', ink: '#06304a' }, // 1989 — sky blue
  rp: { tile: '#44464a', deep: '#1a1a1d', ink: '#e8eaec' }, // Reputation — charcoal
  lv: { tile: '#f48bc4', deep: '#b03578', ink: '#4a0a31' }, // Lover — pink
  fl: { tile: '#828995', deep: '#3a414c', ink: '#f7f8fa' }, // Folklore — muted slate
  ev: { tile: '#c66a2a', deep: '#6e3410', ink: '#ffeede' }, // Evermore — autumn orange
  ml: { tile: '#3f5a8e', deep: '#182a48', ink: '#e4e8ff' }, // Midnights — midnight navy
  tp: { tile: '#b3a89a', deep: '#57514a', ink: '#2a241d' }, // Tortured Poets — dove sepia
  ls: { tile: '#b13bb6', deep: '#5e0f63', ink: '#ffe6ff' }, // Showgirl — magenta
  ot: { tile: '#7e8ba0', deep: '#39414f', ink: '#f1f4f9' }, // Other — neutral steel
};

const FALLBACK_TILE = { tile: '#7e8ba0', deep: '#39414f', ink: '#f1f4f9' };

const ALBUM_EMOJI = ALL_ALBUMS.reduce((m, a) => { m[a.id] = a.icon; return m; }, {});
const ALBUM_NAME = ALL_ALBUMS.reduce((m, a) => { m[a.id] = a.name; return m; }, {});

// Full era descriptor consumed by the bracket screens:
// { tile, deep, ink, emoji, name }. Keyed by albumId.
export function getEra(albumId) {
  const t = ERA_TILES[albumId] || FALLBACK_TILE;
  return {
    ...t,
    emoji: ALBUM_EMOJI[albumId] || '🎵',
    name: ALBUM_NAME[albumId] || 'Other',
  };
}
