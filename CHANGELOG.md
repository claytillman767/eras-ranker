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

## 0.5.1 — 2026-05-07

### Fixed
- **Fearless Play/Skip screen showed a white bar over the gold backdrop.**
  The shuffle screen had its own opaque white→lavender gradient that
  wasn't aware of the Fearless theme, so the warm golden-hour
  background only peeked out at the top progress bar and the bottom
  status bar — the middle of the screen looked washed out. Fixed by
  letting the Fearless theme bleed through, same as Midnights, Debut,
  and Speak Now already did.

---

## 0.5.0 — 2026-05-07

### Added
- **Connect Spotify is free for everyone.** Connecting your Spotify
  account no longer requires Pro — it gives you real album cover art
  across the whole app (the album grid, your rankings, the welcome
  tour carousel). The in-app playback features (autoplay, jump to the
  bridge) remain Pro perks, but the connection itself is free.
- **New post-login Spotify intro screen.** Right after you sign in
  with Google for the first time, a single screen asks if you want
  to connect Spotify and explains that it pulls in real album art.
  Skip-able; you can always connect later from Settings.
- **Welcome tour now uses real album art when connected.** The slowly
  rotating carousel on slide 1 shows the real Spotify cover for any
  album whose art has been fetched, falling back to the emoji tile
  otherwise. Slide 2's Vibe Check card now has a dedicated purple
  "PRO" pill so the autoplay benefit reads as a feature, not a
  footnote.
- **Soft Pro upsell at ~30 songs rated.** Once a Spotify-connected
  free user has rated about 30 songs, a friendly bottom-sheet pops
  between songs offering a free taste of Pro autoplay. Tap "Try it
  on the next song" and the next song plays automatically for the
  rest of that session as a preview of what Pro feels like. Tap
  "Maybe later" and nothing changes. Either way, the prompt only
  appears once.
- **"Share rankings" button on every album page.** As soon as you've
  rated at least 2 songs on an album, a Share button appears below
  the action buttons so you can share your in-progress ranking card.
  No more waiting for full album completion to share.

### Changed
- **Settings → Spotify is now visible to everyone.** Free users see
  the Connect/Disconnect controls. The autoplay, bridge autoplay, and
  volume controls show with a small "PRO" badge and route taps to
  the upgrade modal — so the perk is visible, not hidden.
- **Pro pitch copy reworded everywhere it appears.** The PaywallCard,
  Settings ProModal, VibeCheckIntro, ConnectSpotifyPrompt, and
  AlbumModeModal all now describe Pro as "songs autoplay while you
  rate" plus "jump to the bridge", rather than implying connection
  itself is paid. The Spotify Premium footnote in VibeCheckIntro
  clarifies connection is free; Premium is only required for
  in-app playback.

---

## 0.4.1 — 2026-05-06

### Added
- **Fearless album theme.** Rating songs on Fearless now switches the
  whole screen to a soft golden-hour gradient with little gold glitter
  motes drifting slowly upward. The category label uses a warm amber so
  it reads richly against the honey-coloured backdrop.
- **Love Story horse moment.** When you finish rating Love Story, a
  small white horse gallops across the bottom of the screen leaving a
  soft fade trail — about a two-second cameo, then it's back to the
  normal flow.
- **Album-complete fireworks.** Finishing a full Fearless rating
  session pops a brief golden firework crackle behind the "All done!"
  card before it fades.

---

## 0.4.0 — 2026-05-06

### Added
- **Real subscription billing via Lemon Squeezy.** The "Subscribe — $4.99/month" /
  "$46.71/year" buttons now open a real Lemon Squeezy checkout overlay
  instead of granting Pro for free. Pay with a card, and Pro activates
  within a few seconds of the payment going through. Existing mock-Pro
  fallback is preserved for local dev.
- **"Manage subscription" link in Settings → Account.** Once you're Pro,
  a small purple-tinted row appears with a link to the Lemon Squeezy
  customer portal where you can update your card, view invoices, or
  cancel. Cancelled subscriptions show a "Cancels on {date}" line so you
  know exactly when access ends.
- **"Processing your payment…" banner.** A slim purple bar at the top of
  the app is shown for the few seconds between checkout completing and
  the webhook activating Pro. Clears automatically when Pro flips on, or
  after 90 seconds if something goes wrong.

### Changed
- **Pro state is now real-time.** When the Lemon Squeezy webhook updates
  your account, the UI flips to Pro within a second or two without
  needing a refresh. Subscription cancellations and payment changes
  flow through the same way.

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
