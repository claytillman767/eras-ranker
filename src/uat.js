// Dev-only "UAT as new user" mode.
//
// When localStorage 'eras_uat_new_user' is 'true', main.jsx clears every
// onboarding flag on app boot so the Welcome tour, album mode modal,
// VibeCheckIntro, drag hint, and bridge-autoplay nudge all reappear from
// scratch. The toggle itself is gated to a developer email in Settings,
// so a normal user never sees or sets it.
//
// Adding a new onboarding flag? Append its localStorage key here so the
// reset clears it too.

export const UAT_NEW_USER_KEY = 'eras_uat_new_user';

export const DEV_EMAILS = [
  // TEMPORARILY EMPTY for real Lemon Squeezy purchase test on 2026-05-12.
  // Add 'clay.tillman7@gmail.com' back after the test + refund completes
  // so dev tools (UAT mode toggle, mock unlock) work again.
];

// Admin accounts (by Firestore uid) that see the admin time-travel panel in
// Settings. Kept separate from DEV_EMAILS so it does NOT re-enable the UAT
// toggle / mock-unlock dev tools — the time-travel panel only shifts the
// bracket view on the admin's own device.
export const ADMIN_UIDS = [
  'OXwJOBuLLpggGIS76UjcnnxCvo43', // clay.tillman7@gmail.com
];

export function isAdminUid(uid) {
  return !!uid && ADMIN_UIDS.includes(uid);
}

const ONBOARDING_FLAG_KEYS = [
  'eras_welcome_seen',
  'eras_vibecheck_intro_seen',
  'eras_sort_it_yourself_hint_seen',
  'eras_album_modes',
];

export function isUatMode() {
  try {
    return localStorage.getItem(UAT_NEW_USER_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setUatMode(on) {
  try {
    localStorage.setItem(UAT_NEW_USER_KEY, on ? 'true' : 'false');
  } catch {}
}

export function clearOnboardingFlags() {
  try {
    for (const key of ONBOARDING_FLAG_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {}
}

export function isDevEmail(email) {
  if (!email) return false;
  return DEV_EMAILS.includes(email.toLowerCase());
}
