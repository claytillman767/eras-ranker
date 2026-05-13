// Single source of truth for the current legal-text version.
//
// The Privacy Policy (/privacy) and Terms of Service (/terms) read
// LEGAL_VERSION as their displayed effective date. Each signed-in user's
// Firestore doc stores their accepted version in `termsAcceptedVersion`
// (along with a server timestamp in `termsAcceptedAt`). When the two
// disagree, the app shows UpdatedTermsModal asking the user to re-accept
// before continuing.
//
// ── When to bump ────────────────────────────────────────────────────────
// Bump LEGAL_VERSION only for MATERIAL changes — anything that affects:
//   • What data we collect
//   • How we use it
//   • Who we share it with
//   • What rights the user has
//   • Pro subscription pricing or cancellation terms
//   • Acceptable-use rules
//
// Do NOT bump for typo fixes, formatting tweaks, or clarifying wording
// that doesn't change the underlying meaning.
//
// ── How to bump ─────────────────────────────────────────────────────────
// 1. Set LEGAL_VERSION below to today's date (YYYY-MM-DD).
// 2. Set LEGAL_VERSION_CHANGES_NOTE to a 1–2 sentence plain-English
//    summary of what changed. This text shows inside the modal users
//    see when they're prompted to re-accept.
// 3. Update the Effective/Last-updated date in the relevant section
//    of PrivacyPolicy.jsx and/or Terms.jsx — those still read from
//    LEGAL_VERSION here, so this happens automatically.
// 4. Per Section 11 of the Privacy Policy, also email signed-in users
//    at least 14 days before the change takes effect for material
//    changes. The in-app modal is the friction-free confirmation on
//    next visit, NOT the only notification.
//
// ── Initial release ─────────────────────────────────────────────────────
// On 2026-05-12 this version-tracking system shipped alongside the very
// first published Privacy Policy + ToS. Existing users (who signed up
// before tracking existed) are grandfathered in by useUserStats on
// their next session — the modal does NOT appear for them on the
// initial rollout. The system starts auditing from this point forward.

export const LEGAL_VERSION = '2026-05-12';

// Plain-English summary of what changed in the current LEGAL_VERSION.
// Shown inside UpdatedTermsModal so users know what they're re-accepting.
// Keep to 1–2 sentences. Set to null when there's nothing meaningful to
// summarize (e.g. the initial release).
export const LEGAL_VERSION_CHANGES_NOTE = null;

// Converts the ISO date string (YYYY-MM-DD) to a human-readable
// "Month DD, YYYY" form for display at the top of /privacy and /terms.
// Pure function; doesn't depend on the user's locale.
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatLegalDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
