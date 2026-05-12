// Beta access allowlist.
//
// Add or remove emails here, then push to ship — no Vercel env var needed.
// Comparison is case-insensitive (handled in App.jsx).
//
// Empty array = ANY signed-in Google account is allowed through (open beta).
// Non-empty   = only the listed addresses are allowed.
export const BETA_EMAILS = [
  'chelsetillman@gmail.com',
  'ashleymacree@gmail.com',
  'isabessa05@gmail.com',
];

// Beta testers get Pro for free during the beta. Used by usePro.js to OR
// this in on top of the cloud isPro value, and to short-circuit the Lemon
// Squeezy checkout if a beta tester somehow taps an upgrade button.
// Goes away naturally when the beta gate is removed at launch.
export function isBetaEmail(email) {
  if (!email) return false;
  return BETA_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

