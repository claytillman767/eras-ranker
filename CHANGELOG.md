# Changelog

All notable user-facing changes to The Eras Ranker are recorded here.

The version number is set in `package.json` and shown in the app under
**Settings → About**. Bump the version and add an entry below whenever a
shipped change affects what users see or do.

Versioning follows a loose [Semantic Versioning](https://semver.org/) idea:

- **Major** (`x.0.0`) — big rewrites, redesigns, or breaking data changes.
- **Minor** (`0.x.0`) — new features, screens, or notable UX shifts.
- **Patch** (`0.0.x`) — bug fixes, copy tweaks, small visual polish.

Newest entries go at the top.

---

## 0.3.0 — 2026-05-05

### Added
- **Delete my account.** New option in **Settings → Account** below
  "Forget me on this device." Walks through a clear three-step flow:
  what will be wiped (with a reminder to export your CSV first), a final
  "I understand" checkbox, and a goodbye screen once it's done. Removes
  your ratings, brackets, public profile, Pro subscription, and Firebase
  account in one go. Required for legal compliance (GDPR / CCPA) before
  the public launch.

## 0.2.1 — 2026-05-05

### Changed
- **Brackets tab hidden until phase 2.** The Brackets tab is no longer shown
  in the main navigation. The feature is still in development (community vote
  tallies, audio playback in matchups, and trivia fact-checking aren't ready
  yet) and will return in a later release. All underlying code is preserved
  — the tab can be flipped back on with a single flag in `src/App.jsx`.

---

## 0.2.0 — 2026-05-04

### Added
- **Public profile (anyone-with-link sharing).** New section under
  **Settings → Public profile** lets a signed-in user flip a switch and
  share their album rankings via a `/u/{uid}` URL. Default is **off** for
  every account; only people with the link can view a profile (no public
  listing or directory). Optional 140-char bio with a profanity filter and
  no links allowed. Backed by a new `profiles/{uid}` Firestore collection
  with public-read security rules — see CLAUDE.md for the rules to apply
  in the Firebase console.

### Notes
- Vanity handles (`/u/{your-name}`) are not in this release. The full plan
  for that and other follow-on profile work is captured in CLAUDE.md and
  the original scope discussion.

---

## 0.1.0 — 2026-05-04

First versioned release. Captures the state of the app since the beta gate
went up. Earlier work isn't itemised here — see the git log for full history.

### Added
- Versioning system with this changelog and a version label in **Settings → About**.
- Custom **ConfirmModal** component replacing OS-native `window.confirm()` dialogs
  (used by "Rank by score" and "Clear bracket data" prompts).
- **Spinner** loading indicator in the Connect-Spotify buttons and the Spotify
  mini-player while the connection is establishing.
- **× dismiss button** on the Daily Matchup prompt — hides the card for the
  rest of the day (resets at midnight).
- **VibeCheckIntro** screen: full Pro feature list in one box with a footnote
  spelling out the Spotify Premium requirement.
- **Forget me on this device** option in the Account section — clears the
  local copy without touching the cloud record.

### Changed
- "★ Score Album" button renamed to **★ Vibe Check** for consistency with the
  rest of the flow.
- Song rows no longer show abbreviated category labels by default. Tap a row
  to expand it; categories now display full names with `N/5` for stars,
  `Y`/`N` for custom yes/no categories, and a Play / Skip pill for
  "Skip on shuffle?".
- **Rankings → Songs** view no longer caps at 20 — every rated song is shown.
- Account section "Sign out" button is now neutral rather than red, with a
  subtitle clarifying that cloud data is preserved.
