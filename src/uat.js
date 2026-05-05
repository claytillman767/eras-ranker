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
  'clay.tillman7@gmail.com',
];

const ONBOARDING_FLAG_KEYS = [
  'eras_welcome_seen',
  'eras_vibecheck_intro_seen',
  'eras_sort_it_yourself_hint_seen',
  'eras_album_modes',
  'eras_bridge_play_count',
  'eras_bridge_autoplay_nudged',
  'eras_spotify_connect_nudge_until',
  'eras_spotify_connect_nudge_silenced',
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
