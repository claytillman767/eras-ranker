// Era color palettes — primary and secondary used for card gradients in brackets.
// Each albumId maps to { primary, secondary, text, accent }.
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
