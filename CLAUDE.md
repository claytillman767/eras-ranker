# The Eras Ranker — Claude Context

## User
Not a developer. Use plain, simple language — no jargon.

## App intent
This is a **commercial product**, not a hobby or fan project. Treat every decision — licensing, architecture, legal risk, monetization, scalability — accordingly. Do not assume small scale or low stakes.

## Conversion goals — the four key activities

Every user-facing decision should be evaluated against these four conversion goals, in this order. Each step builds on the previous one — completing one makes the next one a natural offer.

1. **Account login (Google sign-in)** — the backbone. Required for cross-device sync, Pro billing, and identity. Pushed via the dedicated GoogleLoginPromo screen that appears right after the Welcome tour for anyone not yet signed in, with "Sign in with Google" as the primary CTA and "Not now" as the bypass.
2. **Spotify connection (free for everyone)** — gives real album art across the app and is the natural runway toward Pro playback. Connecting is FREE; no Pro required. Pushed via the SpotifyIntro screen (shown once for signed-in users after the GoogleLoginPromo) and the Settings → Spotify section.
3. **Pro upgrade ($4.99/mo or $46.71/yr)** — the revenue. Pro adds in-app autoplay, per-moment seeking (chorus / bridge / opening / closing line), 8 extra rating categories, and custom categories. CSV export is FREE for everyone (data portability) — Settings → Data → Download CSV. Pushed softly via the 30-song AutoplayNudge for connected free users, the VibeCheckIntro on first Vibe Check, and the PaywallCard in Categories.
4. **Sharing to social media** — viral growth. The shareable card unlocks once a user fully ranks at least one album (RankingCard / AlbumCompleteCard).

**Stance the app takes:** the natural path is *Login → Connect Spotify → Pro → Share*. Any other path is an "avoidance" — always allowed, but never framed as the obvious thing to do. Skip buttons exist, but they sit in secondary positioning (smaller, lower contrast, farther from the primary CTA).

**Canonical first-time flow:** Welcome tour → GoogleLoginPromo → (if signed in) SpotifyIntro → Home. Anonymous users can browse the whole app; signing in is a soft ask, never forced.

## When you change Pro benefits

Inconsistent Pro copy across screens is a credibility hit on a paid product, so any change that adds, removes, renames, reprices, or shifts the scope of a Pro perk needs a cross-surface audit before it ships.

**After implementing a Pro change, invoke the `pro-funnel-auditor` subagent** to verify copy consistency across every Pro-mentioning surface. The subagent owns the canonical file list and the Pro/Spotify boundary rules — it will return a prioritized fix list, then the main agent makes the edits.

Same applies to Spotify-tier changes (free vs. Premium): playback-only Pro perks (autoplay, per-moment seeking) MUST be hidden when `spotify?.isConnected && !spotify?.isPremium`, since Pro alone can't unlock playback for free Spotify accounts. The auditor enforces this rule.

## When you change the Privacy Policy or Terms of Service

The legal text lives in [src/components/PrivacyPolicy.jsx](src/components/PrivacyPolicy.jsx) and [src/components/Terms.jsx](src/components/Terms.jsx), served at `/privacy` and `/terms`. The current accepted version is tracked per user in Firestore.

**Material changes** — anything that affects what data is collected, how it's used, who it's shared with, user rights, Pro pricing/cancellation terms, or acceptable-use rules — require a version bump so existing users are re-prompted:

1. Edit the policy text in [src/components/PrivacyPolicy.jsx](src/components/PrivacyPolicy.jsx) and/or [src/components/Terms.jsx](src/components/Terms.jsx).
2. Bump `LEGAL_VERSION` in [src/data/legalVersion.js](src/data/legalVersion.js) to today's date (`YYYY-MM-DD`).
3. Set `LEGAL_VERSION_CHANGES_NOTE` in the same file to a 1–2 sentence plain-English summary of what changed. This text shows inside [src/components/UpdatedTermsModal.jsx](src/components/UpdatedTermsModal.jsx) when a user is asked to re-accept.
4. Per Section 11 of the Privacy Policy, also email signed-in users at least 14 days before the change takes effect. The in-app modal is the friction-free confirmation on next visit, NOT the only notification.

**Non-material changes** (typo fixes, formatting tweaks, wording that doesn't change meaning) — just edit the file. Do NOT bump `LEGAL_VERSION`, or every existing user will see a re-acceptance modal for a change they don't need to re-accept.

How the acceptance system works:
- [src/hooks/useUserStats.js](src/hooks/useUserStats.js) writes `termsAcceptedVersion = LEGAL_VERSION` and `termsAcceptedAt` to each user's Firestore doc on their first session ever. For users who predate the tracking feature, this also runs on their next session as a one-time grandfather (so the modal does not fire for terms that haven't changed since they signed up).
- [src/hooks/useTermsAcceptance.js](src/hooks/useTermsAcceptance.js) compares the stored version to the current `LEGAL_VERSION` via an `onSnapshot` listener. When they don't match, it returns `needsAcceptance: true`.
- [src/App.jsx](src/App.jsx) pre-empts the rest of the app with [src/components/UpdatedTermsModal.jsx](src/components/UpdatedTermsModal.jsx) when `needsAcceptance` is true. The modal's inline links to /privacy and /terms open in a new tab so users can read the new text without losing the modal.
- Clicking "I agree, continue" writes the new `LEGAL_VERSION` to the user's doc; the snapshot listener flips `needsAcceptance` back to false and the modal disappears.

## Acting as a user-flow consultant

When a change touches **any of the four conversion goals**, don't just implement what was asked — proactively consult on funnel impact. Specifically, ask yourself (and surface concerns to the user *before* implementing if any answer is no):

- **Does this nudge the user toward the next conversion step, or away?** A change that helps Spotify connection but accidentally makes Pro upgrade harder is a net loss.
- **Does the natural path still feel natural after this change?** Each step should be the obvious thing to do. The skip/decline option should feel like opting out, never the default.
- **Are other surfaces in the app still consistent with this change?** Run the `pro-funnel-auditor` subagent after implementation to catch drift. If a paywall is loosened or tightened, every surface that references that boundary needs to align.
- **Is there a sharing moment we're underusing?** Album-complete cards, rankings cards, and the public profile are all viral surfaces. When someone hits a milestone (e.g. first fully-rated album), is the share path obvious?
- **Does this respect the order of the funnel?** Don't ask a user to upgrade Pro before they've signed in; don't push Spotify before they've signed in; don't ask them to share before they have something worth sharing.

### How to format consultant notes

Every consultant concern must lead with the conversion goal it affects, in **bold ALL CAPS**, so the user can scan the funnel impact at a glance. The four labels:

- **LOGIN FUNNEL** — Google sign-in
- **SPOTIFY FUNNEL** — Spotify connection (free)
- **PRO FUNNEL** — Pro subscription
- **SHARING FUNNEL** — social-media share moments

Format every concern as a short bullet beginning with the impact, then a sentence or two of detail. Examples:

- *"**Major impact: this reduces PRO FUNNEL.** The Welcome tour says 'songs play with Pro' but doesn't make Pro feel desirable — it reads as a footnote, not a feature pitch."*
- *"**Minor impact on SHARING FUNNEL.** Album completion is currently the only share trigger. A user who's rated 8 of 13 songs has no obvious way to share progress."*
- *"**Cross-funnel risk (LOGIN + SPOTIFY).** Password-bypass users skip SpotifyIntro entirely, so they get a weaker Spotify push than Google-signed-in users."*

Use **Major impact** when a primary funnel step is meaningfully harder/easier; **Minor impact** for nudges and edge cases; **Cross-funnel risk** when the change affects two or more conversion goals at once.

Mention these considerations in your response *before* writing code, as a brief consultant note. The user is non-technical and explicitly relies on Claude to flag flow problems they might miss. Don't assume — surface the trade-off and let them decide.

## Design rules
- **Music lifecycle:** Any screen that plays music owns the full start-to-stop. Music begins when the screen opens (or a phase starts) and stops when the screen closes or unmounts. Never leave audio playing with no way to control it.
- **Play/pause always visible:** Whenever audio is playing or has played on the current screen, a play/pause button must be visible without scrolling — typically pinned in the header. This rule applies to every screen that uses Spotify playback: Matchup, DailyMatchup, and any future screens that call `playTrack`.

## Claude Design folder (reference only — not part of the app)
The top-level `Claude Design/` folder holds UI design handoffs produced by a separate AI design tool. It is **not part of the running app** — nothing in `src/` imports from it, and Vite never builds it.

- **Gitignored on purpose** — kept out of git so design experiments don't bloat the repo. Listed in `.gitignore`; never commit it.
- **Reference for future UI work** — the user pulls these in when redesigning a screen. Treat the JSX/HTML inside as inspiration to translate into real components, not files to copy verbatim.
- **Subfolder layout:**
  - `design_handoff_brackets/` — wireframes and prototype JSX for the Bracket flow (Landing/Matchup/Tree)
  - `design_handoff_home_and_album/` — wireframes and prototype JSX for Home and Album screens
- Each subfolder contains an `.html` mockup, a `.jsx` prototype, a `tweaks-panel.jsx`, and a `README.md` with notes from the design tool.

When the user references "the design" or "the wireframe" for a screen, look here first.

## Versioning & changelog
The app version lives in **`package.json`** under `"version"` and is exposed to
the bundle as `__APP_VERSION__` (injected by `vite.config.js`). It's displayed
in **Settings → bottom of the page** so users can tell which build they're on.

A running record of every shipped change lives in **`CHANGELOG.md`** at the
repo root. **Whenever you ship a user-facing change, you must:**

1. Bump `package.json` → `"version"` using a loose semver feel:
   - **Major** (`x.0.0`) — big rewrite, redesign, or breaking data change
   - **Minor** (`0.x.0`) — new feature, screen, or notable UX shift
   - **Patch** (`0.0.x`) — bug fix, copy tweak, small visual polish
2. Add a new section at the top of `CHANGELOG.md` for that version, dated today.
   Group changes under `### Added`, `### Changed`, `### Fixed`, or `### Removed`.
3. Keep entries plain-English and user-facing — what someone using the app
   would notice. Skip purely internal refactors unless they affect behaviour.
4. The version label in Settings updates automatically on the next build —
   no extra wiring needed.

If multiple changes ship together, batch them into one version. Don't bump
the version for in-progress local edits — only on a real ship to `main`.

## Stack
React 19 + Vite. All styling is **inline styles only** (no Tailwind classes in JSX).

Dev server:
```
cd "C:\Users\clayt\dev\eras-ranker"
npm run dev
```

Build & deploy:
```
npm run build   # outputs dist/
git add . && git commit -m "message" && git push   # Vercel auto-deploys on push to main
```

## File map
```
src/
  main.jsx                 — entry point; wraps <App> in <ErrorBoundary>; registers service worker
  App.jsx                  — root; 5 tabs: Home, Albums, Brackets, Rankings, Settings
                             Categories is now a section inside Settings (not its own tab)
                             Passes user/signIn/signOut to Settings; passes isPro ? spotify.albumArt : null to grid/songlist
                             First-time flow: Welcome → GoogleLoginPromo (if signed out) → SpotifyIntro (if signed in) → Home
                             Hand-rolled URL routing pre-empts the tab UI: /privacy → PrivacyPolicy,
                               /terms → Terms, /u/{uid} → ProfileView. Updates from popstate events.
                             Updated-terms gate: useTermsAcceptance(user) compares the user's stored
                               version to LEGAL_VERSION; on mismatch, renders UpdatedTermsModal in
                               place of the main app until the user re-accepts.
  firebase.js              — initialises Firebase app, exports auth, db, googleProvider
                             Explicitly sets browserLocalPersistence to prevent silent session-only fallback
  data/
    albums.js              — ALBUMS array + SONGS dict (albumId → song name array)
    categories.js          — DEFAULT_CATEGORIES (5) + EXTRA_CATEGORIES (8, Pro-only)
                             "Skip on shuffle?" uses id 'replay'; default weights sum to 100
    bridgeLyrics.js        — DO NOT edit by hand; regenerate: python parse_bridges.py
    snippetLyrics.js       — DO NOT edit by hand; regenerate: python parse_snippets.py
                             Best lyric snippet per song (bridge > chorus > verse 1)
                             Used as floating BG on shuffle screen + scroller on Lyrics screen
    lyricsAccess.js        — Developer kill switch for ALL displayed lyric text in the app.
                             Holds `LYRICS_DISPLAY_ENABLED` constant (currently `false` for
                             copyright compliance — no lyrics shown until proper licensing).
                             EVERY component that displays lyrics imports from here, NOT from
                             bridgeLyrics.js / snippetLyrics.js directly. When the flag is off,
                             getBridgeLyrics() and getSnippetLyrics() return null so all
                             `lyric && (...)` UI blocks gracefully render nothing.
                             Also exports hasBridge() / hasSnippet() — pure data checks that
                             bypass the gate (used for auto-skip logic, score weighting, and
                             the "Best Bridge" bracket eligibility filter).
                             To re-enable lyrics: flip the constant to `true` and redeploy.
    spotifyStartTimes.js   — Developer-controlled Spotify playback start positions (NOT user-facing)
                             Key: "albumId_songIndex", Value: milliseconds into the track
                             Songs not listed start from 0. Edit this file to set per-song start points.
    spotifyBridgeTimes.js  — DO NOT edit by hand; regenerate: python find_bridge_times.py
                             Bridge section start positions in ms, keyed by "albumId_songIndex"
                             Used by playTrack() when screen='bridge'
    legalVersion.js        — Single source of truth for the current legal-text version (YYYY-MM-DD).
                             Bump LEGAL_VERSION on material Privacy Policy / Terms changes; set
                             LEGAL_VERSION_CHANGES_NOTE to a short summary shown in the re-accept
                             modal. Imported by PrivacyPolicy.jsx, Terms.jsx, useUserStats.js,
                             useTermsAcceptance.js, and UpdatedTermsModal.jsx.
                             Also exports formatLegalDate() for the human-readable display date.
  hooks/
    useAuth.js             — Firebase Google sign-in via signInWithRedirect (NOT popup — redirect is
                             more reliable on mobile/Safari); exposes user, authLoading, signIn, signOut
    useRatings.js          — accepts user param; reads/writes localStorage + Firestore (ratings field)
    usePro.js              — accepts user param; reads/writes localStorage + Firestore (pro field)
    useManualOrder.js      — accepts user param; reads/writes localStorage + Firestore (manualOrder field)
    useAlbumModes.js       — accepts user param; reads/writes localStorage + Firestore (albumModes field)
    useSpotify.js          — Spotify Web Playback SDK integration (Pro-only)
                             PKCE OAuth flow; token storage in localStorage; SDK script loaded dynamically
                             Track URIs found via Spotify Search API + cached in localStorage 'eras_spotify_tracks'
                             Album art URLs cached in localStorage 'eras_spotify_album_art' (albumId → image URL)
                             On connect: proactively fetches art for all 12 albums via Search API
                             searchTrackUri() returns { uri, imageUrl } — art also captured as side effect of playTrack()
                             ALBUM ART MATCHING: searchTrackUri uses exact → prefix → loose album name matching
                               (exact = full cleaned name match; avoids picking acoustic/deluxe editions over originals)
                               If wrong art appears for an album, disconnect + reconnect Spotify to clear the cache
                             disconnect() clears BOTH the art cache and track URI cache so reconnecting re-fetches fresh
                             playTrack(albumId, songIndex, songName, albumName, screen)
                               screen='shuffle' → uses SPOTIFY_START_TIMES; screen='bridge' → uses SPOTIFY_BRIDGE_TIMES
                             Exposes: isConnected, isLoading, playerReady, isPlaying, currentSongName, albumArt,
                               error, connect, disconnect, playTrack, pause, resume, togglePlay
                             connect() redirects to Spotify OAuth; callback detected on app load via ?code=&state=eras_spotify
                             Requires VITE_SPOTIFY_CLIENT_ID env var; redirect URIs must be registered in Spotify dashboard
    useBrackets.js         — all bracket state: personal brackets, weekly community bracket, daily matchup
                             localStorage keys: 'eras_brackets', 'eras_weekly_bracket', 'eras_daily_bracket'
                             weeklyState synced to Firestore field 'weeklyBracket' on users/{uid}
                             FIRESTORE CONSTRAINT: rounds is an array-of-arrays → Firestore rejects nested arrays.
                               Fix: serialize rounds as JSON.stringify(rounds) before writing to Firestore;
                               parse back with JSON.parse when reading. See recordWeeklyVote + Firestore sync effect.
                             STALE CLOSURE: recordWeeklyVote ignores the roundIndex/matchupIndex params passed in;
                               reads w.currentRound / w.currentMatchupIndex from weeklyStateRef.current instead.
                               weeklyStateRef is updated every render: weeklyStateRef.current = weeklyState.
                             FIRESTORE SYNC GUARD: on login, Firestore weeklyBracket only overwrites local state
                               if Firestore has MORE votes than local (prevents stale cloud read from reverting votes).
    useSettings.js         — app-wide settings; localStorage 'eras_settings' + Firestore sync
                             DEFAULTS: { showCategoryBars: true, spotifyAutoplay: true }
                             Note: Spotify start time is NOT in settings — it's developer-set in spotifyStartTimes.js
    useTermsAcceptance.js  — Watches the signed-in user's termsAcceptedVersion via onSnapshot.
                             Returns { needsAcceptance, acceptTerms, loading }.
                             needsAcceptance true ⇒ App.jsx renders UpdatedTermsModal.
                             acceptTerms() writes LEGAL_VERSION + serverTimestamp to the user doc.
                             Grandfather rule: missing field reads as LEGAL_VERSION (no modal).
  components/
    ErrorBoundary.jsx      — top-level React error boundary; catches any unhandled crash and shows a
                             friendly "Something went wrong — Reload" screen instead of blank white page
    PrivacyPolicy.jsx      — Public legal page served at /privacy. Plain-English Privacy Policy,
                             routed by hand-rolled URL match in App.jsx. Effective date is derived
                             from LEGAL_VERSION in data/legalVersion.js.
    Terms.jsx              — Public legal page served at /terms. Plain-English Terms of Service.
                             Same routing pattern + LEGAL_VERSION source as PrivacyPolicy.jsx.
                             Governing law: Texas, Collin County. No binding arbitration; class-action
                             waiver in section 13.
    UpdatedTermsModal.jsx  — Full-screen pre-emptive overlay shown when useTermsAcceptance returns
                             needsAcceptance: true. Reads LEGAL_VERSION + LEGAL_VERSION_CHANGES_NOTE
                             from data/legalVersion.js. Has one button ("I agree, continue") that
                             calls the onAccept prop; inline links to /privacy and /terms open in a
                             new tab so the modal stays visible while users read the full text.
    FeedbackButton.jsx     — floating "send feedback" button visible across the main app for any
                             signed-in user. Bottom-right corner, opens a textarea modal.
                             Submissions land in Firestore `feedback` collection (write-only from
                             the client; developer reads via Firebase console). Captures: message,
                             screen label (passed in by App.jsx based on activeTab/selectedAlbumId),
                             uid, email, displayName, app version, user agent, current URL, timestamp.
                             Tied to identity (signed-in only) so we can follow up if needed.
                             Goes away naturally when the beta gate is removed at launch (or can be
                             gated behind a different flag at that point).
    AlbumGrid / AlbumCard  — album picker with score badges; AlbumCard accepts spotifyArtUrl — shows real
                             cover art image when provided, falls back to emoji/color otherwise
    AlbumModeModal.jsx     — bottom-sheet shown on first album visit; "Vibe Check" (auto-starts QuickScore)
                             or "Sort It Yourself"; choice saved via useAlbumModes
    VibeCheckIntro.jsx     — full-screen overlay shown ONCE on user's first Vibe Check
                             (gated by 'eras_vibecheck_intro_seen'). Teaches the Spotify
                             integration; uses "Play Bridge" as a Pro upsell hook.
                             CTAs adapt to user state: signed-out → "Sign in to unlock Pro";
                             signed-in non-Pro → "Unlock Pro"; Pro non-connected → "Connect Spotify".
                             Pro + Spotify-connected users skip this screen entirely.
    SpotifyBadge.jsx       — Spotify logo SVG in the three approved color variants
                             ('green' on white, 'black' on light, 'white' on dark/green).
                             Default size 22; pass size={24}+ for new code (CLAUDE.md min).
    SongList.jsx           — song list for one album; owns drag, QuickScore, AlbumCompleteCard state
                             receives spotify, spotifyAutoplay, spotifyAlbumArt, onGoToSpotifySettings props
                             spotifyAlbumArt passed to AlbumHero; spotify/spotifyAutoplay passed to QuickScore
    SongRow.jsx            — drag handle (⠿) + position # + title + score
    RatingPanel.jsx        — full star breakdown per category (currently unused in main flow)
    QuickScore.jsx         — full-screen rapid scoring overlay
                             Flow per song: ShuffleScreen (replay) → star questions
                             LyricScroller shown above stars on the Lyrics category question
                             ShuffleScreen: Play=5★, Skip=1★ for replay; lyrics float in BG
                             Bridge category auto-skipped for songs with no bridge lyrics
                             On Bridge category: shows bridge lyrics quote + "Play Bridge" button
                               (Spotify logo pill button, only visible when connected + playerReady)
                               Tapping "Play Bridge" calls playTrack(..., 'bridge') to seek to bridge timestamp
                               Bridge does NOT auto-seek — it is always manual via the button
                             SpotifyMiniPlayer rendered inline in place of song title when Spotify is connected
                               Falls back to song title text when not connected
                             Top bar: song counter (center) + Exit button (right); spacer on left
                             Below stars: matching pill buttons — "← Back" (fades when on first step) + "Skip →"
                             Back navigates to previous category (or previous song's last category)
                             Autoplays song on Spotify (shuffle timestamp) when songPos changes
                             Pauses Spotify on unmount
    SpotifyMiniPlayer.jsx  — compact playback bar; white background (Spotify branding compliant)
                             Accepts optional `style` prop to override outer container styles
                             Connected: Spotify logo + song name + "Powered by Spotify" + purple play/pause
                               + "Open in Spotify" ↗ link
                             Not connected: prompts user to connect (links to Settings)
                             Spotify branding rules enforced: green logo on white bg only, min 24px, no green on controls
                             Used inline in QuickScore at the song title position (maxWidth: 300 to match lyrics width)
    StarRating.jsx         — reusable star input; size='sm'|'md'|'lg'; readonly prop
    Rankings.jsx           — top songs / top albums leaderboard + RankingCard at bottom
    RankingCard.jsx        — shareable card button (Rankings tab); also exports drawCard()
    AlbumCompleteCard.jsx  — full-screen overlay shown once when album becomes fully ranked
    Categories.jsx         — Pro unlock + category toggles + weight sliders + custom creator
    ScoreBar.jsx           — visual score bar used in Rankings
    PaywallCard.jsx        — Pro upgrade prompt (used in Categories)
    Settings.jsx           — Sections: Account, Display, Spotify, Rating Categories, Data, Disclaimer
                             Rating Categories section renders the full Categories component inline
                             Account: shows avatar/name/email/sign-out when logged in; sign-in prompt when not
                             Display: category bars toggle
                             Spotify: Pro-gated connect/disconnect + autoplay toggle
                             Props: settings, updateSetting, spotify, isPro, unlockPro, user, signIn, signOut
```

## Key data patterns
- Rating key: `"${albumId}_${songIndex}"` → `{ catId: starValue (1–5), ... }`
- Composite score: weighted average of rated stars → 0–100 integer; `null` if nothing rated
- Song objects: `{ name, index }` — `index` is 0-based position in the album
- `getBridgeLyrics(albumId, songIndex)` → string or `null`
- `getSnippetLyrics(albumId, songIndex)` → string or `null` (broader coverage than bridge)

## Album IDs
`tv` `fe` `st` `rd` `89` `rp` `lv` `fl` `ev` `ml` `tp` `ls`

## Pro system
- `isPro` stored as `'eras_is_pro'` in localStorage; real billing runs through Lemon Squeezy
  (subscription) — see "Payment provider plan" below.
- **Pro upgrades require a signed-in user.** `unlockPro()` no-ops and returns `false` if no user.
  Reason: a paid upgrade must be tied to identity so it survives device wipes and follows the user
  to other devices, and Lemon Squeezy needs a customer record.
- **Cloud is the source of truth for `isPro`.** The Lemon Squeezy webhook (`api/lemon-webhook.js`)
  is the ONLY thing that writes `isPro: true` on the user doc for paying customers. The client is
  rule-blocked from writing `isPro` itself, so `localStorage.setItem('eras_is_pro','true')` does
  nothing — the next snapshot from Firestore overwrites it back to false. usePro listens via
  `onSnapshot` so a successful payment flips the UI to Pro within a second or two without a refresh.
- **Comped accounts (beta testers, developer accounts).** Set `isPro: true` manually on the user's
  `users/{uid}` doc from the Firebase console. Leave `proSource` blank (or set it to `'beta'` /
  `'comped'` / a name) so it's obvious in the console that this entry was NOT a real subscription.
  Webhook-granted accounts always have `proSource: 'lemonsqueezy'` AND a populated `subscriptionId`
  — either of those means "real paying customer, DO NOT REVOKE without being sure."
- **Sign-out revokes Pro locally.** On a real sign-out transition (had a user, now don't), usePro
  clears `eras_is_pro` and resets `isPro` state. Firestore still has the user's record, so signing
  back in instantly restores Pro via the snapshot listener. Detection uses a `prevUserRef` so the
  initial `null → null` render on app load doesn't trigger a false revocation.
- Pro UI surfaces (Settings ProModal, PaywallCard, VibeCheckIntro) keep "Unlock Pro" tappable; if
  no user, tapping it routes through a shared "Sign in to continue" step (Back arrow → returns).
- Extra category weights rescaled so all active categories always sum to 100
- Weight overrides stored per-category in `eras_category_weights`; reset clears that key
- Pro gates: extra categories, custom categories, Categories tab paywall UI, **in-app Spotify playback (autoplay + Play Bridge)**
- **Free for everyone:** all 5 default categories, default-category weight sliders, on/off toggles, weight reset banner, **Spotify connection (album art across the app)**

### Spotify Premium awareness
- `useSpotify` calls Spotify's `/me` endpoint after OAuth and on app load,
  caching the result in `localStorage['eras_spotify_product']` and exposing
  `spotifyProduct` (`'premium' | 'free' | 'open' | null`) and a derived
  `isPremium` boolean on the spotify object.
- The Web Playback SDK is **only** initialized for Premium accounts —
  free accounts would otherwise hit an `authentication_error` and end
  up disconnected, breaking album art for them. Album art works via
  Spotify's Search API for any account.
- Pro pitch surfaces (PaywallCard, VibeCheckIntro, Settings ProModal,
  AutoplayNudge) MUST hide playback-only perks when
  `spotify?.isConnected && !spotify?.isPremium` — otherwise we're
  selling a feature Pro alone can't unlock for that user. The same
  rule applies to any new Pro perk that depends on Spotify playback.
- Settings → Spotify shows "Album art only" status for non-Premium
  accounts and hides the autoplay/bridge/volume controls (they
  don't work without Premium).

## QuickScore flow
- Covers full viewport (`position: fixed, inset: 0, zIndex: 1000`)
- Per song: **ShuffleScreen first** (replay category, Play/Skip buttons + floating lyrics BG),
  then star questions for remaining categories in order
- On Lyrics category: `LyricScroller` appears above stars (scrollable, 110px box)
- On Bridge category: bridge lyrics shown as inline italic quote; "Play Bridge" Spotify button below lyrics
- Star labels (calibration phrases) defined in `STAR_LABELS` map inside QuickScore.jsx
- Completion: animated DoneFlash auto-closes after 2s
- Props: `songs`, `albumId`, `albumName`, `albumIcon`, `activeCategories`, `ratings`, `onRate`, `onClose`, `initialSongPos`,
  `spotify`, `spotifyAutoplay`, `onGoToSpotifySettings`
- Spotify shuffle start position comes from `SPOTIFY_START_TIMES` in `spotifyStartTimes.js`
- Spotify bridge start position comes from `SPOTIFY_BRIDGE_TIMES` in `spotifyBridgeTimes.js`
- Both are looked up inside `playTrack()` via the `screen` param — not passed as props

## Lyrics scripts (Python)
- `parse_bridges.py` → `src/data/bridgeLyrics.js` (bridge sections only)
- `parse_snippets.py` → `src/data/snippetLyrics.js` (best section per song)
- `find_bridge_times.py` → `src/data/spotifyBridgeTimes.js` (bridge start positions in ms)
  - Queries lrclib.net for synced LRC lyrics; fuzzy-matches bridge text to find timestamp
  - 0.3s sleep between requests; ~160 songs matched; 1 miss (fe_6 Breathe — no synced lyrics on lrclib)
- Source file: `taylor_swift_lyrics.txt` (Genius-sourced, sections labelled [Verse], [Chorus], [Bridge] etc.)
- Run scripts from the project root after editing the lyrics file

## Authentication & Firestore

### How it works
- **Sign-in method:** Google only via `signInWithRedirect` (redirect, not popup — more reliable on mobile and Safari with strict cookie settings)
- **Auth state:** `useAuth` hook listens with `onAuthStateChanged`; exposes `user` (Firebase user object or `null`), `authLoading` (true briefly on first load), `signIn`, `signOut`
- **Persistence:** `setPersistence(auth, browserLocalPersistence)` explicitly set so login survives tab/browser closes
- **UI:** Top-right of header — "Sign in" button (Google G logo) when logged out; purple avatar circle when logged in; tapping avatar shows dropdown with name, email, and Sign out. Same info also shown in Settings → Account section.

### Firestore data structure
All user data lives in a single Firestore document: `users/{uid}`

| Field | Contents |
|---|---|
| `ratings` | `{ "albumId_songIndex": { catId: starValue } }` |
| `pro` | `{ isPro, enabledExtras: [], customCategories: [], categoryWeights: {} }` |
| `manualOrder` | `{ albumId: [songIndex, ...] }` |
| `albumModes` | `{ albumId: 'score' \| 'manual' }` |
| `spotifyConnected` | `bool` — true when this user currently has Spotify linked |
| `spotifyLastConnectedAt` | server timestamp — set on each connect (not cleared on disconnect) |
| `lastActiveAt` | server timestamp — bumped each session start |
| `sessionCount` | integer — increments by 1 each session start |
| `totalRatings` | integer — count of unique songs rated (any category) |
| `albumsCompleted` | integer — count of fully-rated albums |
| `signedUpAt` | server timestamp — set ONCE on first session ever |
| `signedUpVia` | `'google'` |
| `signupSource` | string — value of `?ref=<source>` URL param at first visit |
| `referrer` | string — `document.referrer` at first visit |
| `termsAcceptedVersion` | string — date (YYYY-MM-DD) of the legal-text version this user accepted; written once by useUserStats on first session, then by UpdatedTermsModal on each re-acceptance |
| `termsAcceptedAt` | server timestamp — paired with termsAcceptedVersion; bumped on every acceptance write |
| `isPro` | bool — written ONLY by the Lemon Squeezy webhook or manually in Firebase console |
| `proSource` | `'lemonsqueezy'` for real subscriptions; blank or `'beta'` / `'comped'` for hand-granted Pro |
| `subscriptionId` | LS subscription numeric ID — present means "real paying customer" |
| `subscriptionStatus` | LS status string (`'active'`, `'cancelled'`, `'past_due'`, …) |
| `customerId` | LS customer numeric ID |
| `customerPortalUrl` | one-time portal URL the user uses to manage their subscription |
| `updatePaymentMethodUrl` | LS-issued URL for swapping the saved card |
| `currentPeriodEnd` | ISO timestamp when the current billing period ends / renews |
| `subscriptionEndsAt` | set when the user cancels — when access actually lapses |
| `subscriptionCancelledAt` | server timestamp — set when LS marks the sub cancelled |
| `paymentFailedAt` | server timestamp — set on first failed payment |
| `proUpdatedAt` | server timestamp — bumped on every webhook-driven update |
| `proLastEvent` | LS event_name from the most recent webhook write (audit trail) |
| `proPlan` | `'monthly'` \| `'annual'` — the plan the user is on |

### Sync behaviour
- App loads instantly from **localStorage** (no flicker)
- On login: each hook fetches the Firestore doc once
  - If Firestore has data → hydrates state from cloud (cloud wins)
  - If Firestore is empty → migrates localStorage data up to Firestore automatically
- Every write goes to **both localStorage and Firestore** — works offline, stays in sync
- On sign-out: app continues using whatever is in localStorage

### Firestore security rules
Set in Firebase console → Firestore → Rules. Users can only read/write their own document, BUT specific Pro/billing fields are server-only (Lemon Squeezy webhook → Firebase Admin SDK bypasses rules; the client cannot write them directly). The `profiles` collection is the public-share mirror — readable by anyone when the user has flipped their profile on, writable only by the owner. The `feedback` collection is write-only from any signed-in user (FeedbackButton); reads only via the Firebase console.

**Manually paste this into Firebase console → Firestore → Rules after any change here:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Fields the LS webhook owns. The client must NEVER be able to set these
    // — that would be a Pro-bypass (write isPro=true) or a cross-user
    // subscription hijack (overwrite subscriptionId to a victim's ID and
    // then call /api/cancel-subscription). The webhook uses the Firebase
    // Admin SDK which bypasses rules, so legitimate writes still work.
    function lockedBillingFields() {
      return [
        'isPro', 'proSource', 'subscriptionId', 'subscriptionStatus',
        'customerId', 'customerPortalUrl', 'updatePaymentMethodUrl',
        'currentPeriodEnd', 'subscriptionEndsAt', 'subscriptionCancelledAt',
        'paymentFailedAt', 'proUpdatedAt', 'proLastEvent', 'proPlan',
        'proUpgradedAt'
      ];
    }

    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;

      // Create: the owner can create their own doc, but cannot pre-seed any
      // billing field on creation (would let an attacker self-grant Pro on
      // first sign-in).
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && !request.resource.data.keys().hasAny(lockedBillingFields());

      // Update: the owner can change anything EXCEPT the billing fields.
      // hasAny on the diff catches both writes and deletes of those keys.
      allow update: if request.auth != null
                    && request.auth.uid == userId
                    && !request.resource.data.diff(resource.data)
                          .affectedKeys()
                          .hasAny(lockedBillingFields());

      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    match /profiles/{userId} {
      // Public read when the owner has turned their profile on. Owner can
      // always read their own doc (e.g. while it's still 'off' on first load).
      allow read: if (resource.data.visibility == 'unlisted')
                  || (request.auth != null && request.auth.uid == userId);
      // Only the owner can create or update; doc ID must match their uid.
      allow create, update: if request.auth != null
                            && request.auth.uid == userId
                            && request.resource.data.ownerUid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    match /feedback/{id} {
      // Any signed-in user can submit feedback. The uid field MUST match
      // the writer so submissions can't be spoofed under another user's
      // identity. Message length capped at 1500 chars to defend against
      // accidentally huge payloads.
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.message is string
                    && request.resource.data.message.size() > 0
                    && request.resource.data.message.size() <= 1500;
      allow read, update, delete: if false; // owner reads via Firebase console
    }
  }
}
```

### Public profile (anyone-with-link sharing)
A signed-in user can flip on a public profile under **Settings → Public profile**. When on, their album rankings (and an optional bio) are mirrored to a separate Firestore document and reachable at `/u/{uid}` by anyone with the link.

- **Collection:** `profiles/{uid}` — fields: `visibility` (`'off'` | `'unlisted'`), `bio`, `albumRankings`, `displayName`, `photoURL`, `ownerUid`, `updatedAt`.
- **Default:** `visibility: 'off'` for every new account. The doc isn't even created until the user first toggles the feature on.
- **Mirroring:** [src/hooks/useProfile.js](src/hooks/useProfile.js) auto-syncs `albumRankings` to the cloud doc whenever the user's ratings change AND the profile is on. Writes are debounced 1.5s so a rapid QuickScore session doesn't fan out into many writes.
- **Routing:** Hand-rolled URL match in [src/App.jsx](src/App.jsx) — `/u/{uid}` short-circuits the welcome tour and renders [src/components/ProfileView.jsx](src/components/ProfileView.jsx) directly. No router dependency.
- **Bio guardrails:** [src/utils/profanity.js](src/utils/profanity.js) — 140-char limit, profanity wordlist, URL/domain pattern rejection. Validated client-side on save; the cloud rule is purely auth/uid-based, so the filter is the only spam barrier today.
- **Visibility levels:** Only two — `'off'` (only the owner can read the doc) and `'unlisted'` (anyone can read). No "logged-in only" or "discoverable" tiers in v1. If a `loggedIn` tier is added later, update both the rule and `ProfileView`'s availability check.
- **Vanity handles:** Not built. URLs are uid-based for v1. A `/u/{handle}` upgrade is plotted in the original scope but parked.

### Delete account flow
Live under **Settings → Account → Delete my account**. Implemented entirely client-side in [src/components/DeleteAccountModal.jsx](src/components/DeleteAccountModal.jsx) — no Vercel function or Firebase Admin SDK required.

**Order of operations during deletion (matters for privacy):**
1. Cancel any active Lemon Squeezy subscription via `/api/cancel-subscription`. The endpoint verifies the caller's Firebase ID token AND cross-checks with Lemon Squeezy that the subscription's `user_email` matches the token's email — this defends against IDOR even if the Firestore rules ever drift. Idempotent: returns success when the user has no `subscriptionId`, when LS returns 404, etc.
2. Delete `profiles/{uid}` doc — kills the public link immediately. `ProfileView` already handles missing docs as "not available."
3. Delete `users/{uid}` doc — wipes ratings, brackets, Pro flag, profile mirror.
4. `deleteUser()` on the Firebase auth record — sign-out is automatic.
5. Wipe `eras_*` localStorage keys.

**Why this order:** auth must outlive the Firestore writes (the security rules require `request.auth.uid === userId` to delete the doc), and we purge auth last so a partial failure leaves orphan docs only — never a case where auth survives WITH active Firestore data, which would be a bigger privacy hole.

**Re-auth handling:** if `deleteUser()` throws `auth/requires-recent-login` (session > ~5 min old), the modal calls `reauthenticateWithPopup` and retries once. If the user closes the popup mid-reauth, we treat it as a cancellation and surface a friendly retry message — no data has been touched yet at that point.

**Pro subscription policy on delete:** cancel immediately, no proration, no refund. We do **not** auto-restore Pro on re-signup; if the same Google account creates a new `users/{uid}` doc later, they need to re-subscribe. Justification is in the UAT report — auto-linking billing records back to a re-created account contradicts the spirit of "delete my data."

**Partial-failure recovery:** if step 4 fails after steps 2–3 succeed, the user is in a "ghost" state (auth survives, Firestore wiped). On next sign-in, the missing `users/{uid}` doc is recreated empty (or migrated from localStorage on a different device). That's almost equivalent to a clean delete; the daily failure check (planned — see Notification System section) is intended to surface these orphan auth records for cleanup.

### Firebase project
- **Project ID:** `eras-8fd36`
- **Console:** https://console.firebase.google.com/project/eras-8fd36
- **Auth provider:** Google (enabled under Authentication → Sign-in method)
- **Config keys:** stored in `.env` as `VITE_FIREBASE_*` variables

## Service worker (`public/sw.js`)
- Cache name: `eras-ranker-v3` (bump version to force cache clear on all devices after major deploys)
- Navigation requests (`mode === 'navigate'`): **network first**, falls back to cached index.html only if offline
  — this ensures users always get the latest `index.html` after a Vercel deploy without needing hard refresh
- Static assets (same-origin JS/CSS/images): cache first, fall back to network
- Cross-origin requests (Firebase, Spotify, lrclib, etc.): not intercepted — go straight to network

## AlbumCompleteCard / RankingCard
- AlbumCompleteCard: shown once per session when album transitions incomplete → fully ranked
- RankingCard: 1080×1080 Canvas shareable card; unlock condition: at least one album fully ranked
- `drawCard(ctx, songs)` named export used by both

## Deployment & version control
- **GitHub:** private repo at `https://github.com/claytillman767/eras-ranker`
- **Vercel:** auto-deploys on every push to `main`; live at `https://eras-ranker.vercel.app`
- **Custom domain:** `https://erasranker.com` — already configured in Vercel and pointing to the same deployment as the `*.vercel.app` URL
- **Local path:** `C:\Users\clayt\dev\eras-ranker` (moved out of OneDrive to avoid git conflicts)
- **`.env`** contains (all gitignored, never commit):
  - `GENIUS_API_TOKEN` — Python lyrics scripts only, not needed at runtime
  - `VITE_FIREBASE_*` — Firebase config keys
  - `VITE_SPOTIFY_CLIENT_ID` — Spotify OAuth client ID
- **`.claude/settings.local.json`** is gitignored — do not commit it
- **Vercel build settings:** Framework = Vite, Build = `npm run build`, Output = `dist`, Root Directory = (blank/repo root)
- **Vercel environment variables:** must mirror all `VITE_*` values from `.env`. **Note:** the now-removed `VITE_BETA_PASSWORD` env var can be deleted from Vercel any time — nothing reads it anymore.

### Shipping flow — push, merge, deploy in one go
The user wants every finished change pushed live without waiting for a
"go ahead" on the merge. As soon as the work compiles cleanly and the
spec is met, take it the rest of the way.

**Do the shipping inline — do NOT delegate to a subagent.** A previous
shipper subagent silently failed to stage the actual code changes
(only the version bump and CHANGELOG made it into the merge), so the
user shipped two empty releases in a row before noticing. Lesson: keep
the staging step where you can see it. The steps are short — run them
in the main agent so you control exactly which files get committed.

The flow:

1. **Verify the build is clean** — `npm run build` from the repo root.
   If it errors, stop and fix.
2. **Bump the version** in `package.json` per the loose-semver feel
   above (patch / minor / major). Skip the bump for purely internal
   changes that don't affect users.
3. **Write a CHANGELOG entry** at the top of `CHANGELOG.md` under a
   new dated header, grouped under `### Added` / `### Changed` /
   `### Fixed` / `### Removed`. Plain-English, user-facing.
4. **Stage explicitly with `git add <path1> <path2> ...`** — list
   every file you changed by name. Do NOT use `git add -A`, `git
   add .`, or `git commit -a` — those have bitten us when the
   working tree had untracked files that weren't part of the change
   (or when a subagent's narrower staging missed files we WERE
   changing). Run `git status` after staging and confirm every
   expected file is in "Changes to be committed" before committing.
5. **Commit** with a message ending in the standard Co-Authored-By
   trailer (`Co-Authored-By: Claude Opus 4.7 (1M context)
   <noreply@anthropic.com>`).
6. **Push the feature branch** (`git push -u origin <branch>`).
7. **Merge to main and push**, depending on environment:
   - **Local mode** (Windows desktop, from a `.claude/worktrees/`
     worktree): `git checkout main && git pull && git merge --no-ff
     <branch> -m "Merge: <one-line summary>" && git push origin main`.
     Vercel auto-deploys on the push.
   - **Sandbox/web mode** (Claude Code on the web/mobile): the proxy
     blocks direct pushes to `main`, so stop after pushing the
     feature branch and open a PR with
     `mcp__github__create_pull_request`. The user merges it on
     GitHub and Vercel deploys after the merge.
8. **Verify the merge diff is non-trivial** — `git show --stat HEAD`
   on main should list every file you expected. If it shows only
   the version bump and CHANGELOG, you forgot to stage the actual
   code; the deploy will go out empty.

If a build fails or there's something genuinely uncertain about the
change, stop and ask — but the default is "ship it." Don't pause to
ask "do you want me to merge this?" — that question is already
answered yes. On web/mobile, "ship it" means "push the branch and
open the PR" — the PR merge is a one-tap action for the user on
GitHub.

**CLAUDE.md changes ship automatically — no questions asked.** Any
time CLAUDE.md is edited (status updates, new notes, marking items
done, fixing references, etc.) the change should be committed,
pushed, and merged to main as part of the same turn — no "want me
to ship this?" prompt. CLAUDE.md is docs-only, so:
- **Skip the version bump** (per the "purely internal changes" rule
  above)
- **Skip the CHANGELOG entry** — CHANGELOG is user-facing release
  notes; CLAUDE.md edits aren't user-visible
- Stage with `git add CLAUDE.md` (plus any other files in the same
  change)
- Commit message: short imperative like `"Update CLAUDE.md: <what
  changed>"`
- Then push the branch + merge to main exactly like any other ship

The reason: keeping CLAUDE.md in sync with reality across sessions
matters more than a confirmation step, and forgetting to ship a
CLAUDE.md edit means future Claude reads stale instructions. Default
is ship.

### Working on a second computer
1. Install Git and Node.js
2. `git clone https://github.com/claytillman767/eras-ranker`
3. `cd eras-ranker && npm install`
4. Create `.env` manually — paste in the Genius API token AND all `VITE_FIREBASE_*` keys (find them in Firebase console → Project settings → Your apps), plus `VITE_SPOTIFY_CLIENT_ID`
5. `npm run dev` to start

---

## Category Picks Pipeline
**Purpose:** for each song × each rating/bracket category, pick the single best moment so Spotify playback seeks to the right place AND the bracket builder knows which songs actually fit a category. Outputs two parallel datasets:

- **`SPOTIFY_CATEGORY_TIMES`** — millisecond start positions per song × category (used by `playTrack()`)
- **`CATEGORY_FIT_SCORES`** — 0–100 fitness scores per song × category (used by the bracket builder to filter eligible songs — e.g. exclude Anti-Hero from the "Most Romantic" bracket)

### Files
```
fetch_synced_lyrics.py             — Stage 1 script (run once per new song)
find_category_times.py             — Stage 2 script (resolves picks → ms / JS)
src/data/syncedLyricsFull.json     — full synced lyrics with section labels + per-line ms (Stage 1 output)
src/data/categoryTimesAudit.json   — every pick: line + score + reasoning + reject/override flags (SOURCE OF TRUTH)
src/data/spotifyCategoryTimes.js   — generated JS the app imports (DO NOT edit by hand)
src/dev/AuditReview.jsx            — dev-only review UI (see below)
```

### Stages
**Stage 1 — Fetch synced lyrics.** `python fetch_synced_lyrics.py` queries lrclib.net for every song and produces `syncedLyricsFull.json` — sections + line-by-line ms timestamps. Run when new songs are added (e.g. a new album drops).

**Stage 2 — Pick the best moment per category.** For each song × lyric-based category, Claude (in-conversation OR via API) picks the single line that best captures that quality and assigns a 0–100 fit score. Picks land in `categoryTimesAudit.json`. `find_category_times.py` then resolves picks → millisecond timestamps and writes `spotifyCategoryTimes.js`.

**Stage 3 — Audio-based categories (deferred, NOT BUILT).** "Best Vocal Performance", "Best Production", "Hype/Energy", "Catchiest Hook" need audio analysis. Default heuristic for now: use the bridge timestamp if available, else the first chorus.

### Categories
**Lyric-based (Stage 2 picks):**
- `most-romantic` `most-devastating` `cry-factor` `best-storytelling` `best-lyrics`

**Structural (auto-derived from section data — no Claude needed):**
- `best-opening-line` — first synced line of the song
- `best-closing-line` — last synced line
- `best-chorus` / `hook` — first `[Chorus]` section's `startMs`
- `bridge` — already in `SPOTIFY_BRIDGE_TIMES` (separate file)

### Dev UI: review and reject picks
With `npm run dev` running, visit `http://localhost:5173/?dev=audit`. **Only renders in dev mode** — never in the Vercel production build (gated on `import.meta.env.DEV` + dynamic import).

Per-pick controls:
- **✗ Reject** — flags the pick as bad. The regenerator outputs `null` for that song × category, so it's excluded from brackets and falls back to shuffle for playback.
- **✏️ Override** — opens a scrollable list of every synced line in the song; click to use that line instead of the auto-pick.
- **Save changes** — writes the updated audit JSON back to disk via a dev-only Vite middleware (`POST /__dev/audit/save`). The endpoint is registered with `apply: 'serve'` so it doesn't exist in production builds.

### Audit JSON schema
```json
{
  "rd_4": {
    "song": "All Too Well",
    "album": "Red (Taylor's Version)",
    "picks": {
      "most-romantic": {
        "line": "Autumn leaves falling down like pieces into place",
        "score": 60,
        "reasoning": "Has tender memories but the song is fundamentally about loss.",
        "rejected": false,
        "manualLine": null
      }
    },
    "resolved": { /* auto-filled by find_category_times.py with ms + section + flags */ }
  }
}
```
- `score: 0` is the convention for "this category genuinely doesn't apply" (paired with `line: null`)
- `rejected: true` → JS output gets `null` for this entry (developer-rejected)
- `manualLine: "..."` → overrides the auto-picked line; ms is resolved against this instead

### Re-runs and resumability
- `find_category_times.py` skips songs already in the audit (no rework, no API spend)
- `python find_category_times.py --summary` prints coverage at a glance
- **API key is optional** — without `ANTHROPIC_API_KEY`, the script just resolves cached picks and writes JS (skips uncached songs but doesn't error)
- To redo one song: delete that key from `categoryTimesAudit.json`, then re-pick (in-conversation or via API)
- To redo everything: delete `categoryTimesAudit.json`

### Adding picks (the in-conversation flow)
1. Tell Claude which song(s) to pick — e.g. "do album `tv`"
2. Claude reads the synced lyrics for those songs, makes picks (line + score + reasoning), and appends them to `categoryTimesAudit.json`
3. You open the dev UI to review, reject, or override
4. After Save, run `python find_category_times.py` to regenerate `spotifyCategoryTimes.js`

### Adding a new category later
1. Add the category id + prompt to `LYRIC_CATEGORIES` in `find_category_times.py`
2. Loop through the audit and add the new category's pick to each entry (in-conversation, via API, or by hand)
3. Re-run the script

---

## Future Enhancement Ideas
**DO NOT begin any of these unless the user explicitly instructs you to.**

### Easter Eggs (two remaining — Midnights already built)

#### The "Getaway Car" Escape  (albumId `rp`, songIndex 8)
**Trigger:** User finishes rating "Getaway Car" via QuickScore (the `onRate` callback fires for the last category of that song).  
**Effect:** A small vintage car emoji/icon (🚗) slides in from the left edge at the bottom of the screen, zips across, and exits off the right edge. It leaves a short trail of neon-colored dots ("exhaust") that fade out behind it. Implemented as a `position: fixed` overlay with a CSS `@keyframes` translate animation (~1.5 s). The car and trail auto-remove after the animation completes. Best placed as a lightweight `GetawayCarEgg.jsx` component, triggered from `QuickScore.jsx` when `albumId === 'rp'` and `songs[currentSongPos].name === 'Getaway Car'` and the last category is answered.

#### "The Manuscript" Fade  (albumId `tp`, last song index 30)
**Trigger:** User finishes rating the final song on The Tortured Poets Department (the `AlbumCompleteCard` fires for album `tp`), same as the Midnights egg pattern.  
**Effect:** Before the `AlbumCompleteCard` shows, a full-screen parchment-textured overlay fades in (`background: linear-gradient(135deg, #f5f0e8, #ede5d0)`). A line of text — *"The story isn't mine anymore..."* — types itself out character-by-character in a monospace/typewriter font (use `setInterval` over ~2 s to append chars to state). The overlay then slowly fades away (~1 s), and the normal completion card appears. Implement as `ManuscriptEgg.jsx`, wired into `SongList.jsx` alongside the Midnights egg (`albumId === 'tp'`).


### ~~User Accounts~~ ✅ BUILT
Google sign-in is live. Ratings, Pro settings, manual order, and album modes all sync to Firestore. See the **Authentication & Firestore** section above for full details.
Remaining future work in this area: real billing — see "Payment provider — Lemon Squeezy plan" below.

### Payment provider — Lemon Squeezy plan (deferred — DO NOT begin without explicit user instruction)

**Provider chosen:** Lemon Squeezy. We evaluated Stripe vs Lemon Squeezy and picked LS because it's a Merchant of Record (handles VAT, EU OSS, US state sales tax for us — Stripe is not), the ~0.7% fee premium is a fair trade for not maintaining tax registrations across 30+ jurisdictions as a one-person shop, and migrating LS → Stripe later is possible if we ever outgrow it.

**Decisions locked in:**
- **Launch as subscription** (NOT one-time → subscription later — that path forces every existing one-time customer to re-subscribe and loses 5–15% of them)
- **Price: $4.99 / month**
- **Annual option:** TBD (likely add later — common discount is ~2 months free, e.g. $49/yr)
- **Free trial:** TBD
- **Plan rename ("Pro" → something else):** TBD — user is considering it

**Phase 1 — Lemon Squeezy account setup** (~30 min, no code)
1. Sign up at lemonsqueezy.com → create a Store
2. Create a Product → Variant: $4.99/month subscription
3. Capture: API key, Store ID, Variant ID, and (after Phase 2) Webhook signing secret

**Phase 2 — Backend infrastructure** (~2 hours, the riskiest step)
The webhook is the only trusted "did they pay" source — never trust the browser.
1. Create Vercel serverless function at `/api/lemon-webhook.js`:
   - Verify LS HMAC-SHA256 signature against `LEMON_SQUEEZY_WEBHOOK_SECRET`
   - On `subscription_created` / `subscription_resumed` → set `users/{uid}.isPro = true`
   - On `subscription_cancelled` / `subscription_expired` / `payment_failed` (after grace) → set `users/{uid}.isPro = false`
   - Persist `subscriptionId`, `subscriptionStatus`, `customerId`, `currentPeriodEnd` on the user doc
   - Always return 200 OK (LS retries on non-200)
2. Wire up **Firebase Admin SDK** in the function. NOT the same as the client SDK. Generate service account JSON in Firebase console → Project Settings → Service Accounts. Base64-encode and store as `FIREBASE_SERVICE_ACCOUNT_B64` in Vercel env vars (one var, decode at function init time — safer than splitting into many vars).
3. Register the webhook URL `https://erasranker.com/api/lemon-webhook` in LS dashboard, copy signing secret to Vercel env vars.

**Env vars needed in Vercel** (all server-side, NO `VITE_` prefix unless noted):
- `LEMON_SQUEEZY_API_KEY` — server only, used by `/api/cancel-subscription` to call LS
  - **Expires 2028-10-10.** LS does not allow keyless or no-expiration tokens. Set a calendar reminder for **2028-09-01** to rotate before expiry; if the key lapses, account deletion stops cancelling subscriptions silently (auth gets wiped, sub keeps charging) until a new key is generated and added to Vercel.
- `LEMON_SQUEEZY_WEBHOOK_SECRET` — HMAC signing secret for verifying webhook payloads
- `FIREBASE_SERVICE_ACCOUNT_B64` — base64 of the service account JSON
- `VITE_LEMON_SQUEEZY_VARIANT_ID_MONTHLY` — frontend uses this to build the monthly checkout URL. **Despite the name, the VALUE must be the LS "checkout UUID" (e.g. `0c29fa1b-03ef-48dd-97a9-ab68c0f5c7b2`), NOT the numeric variant ID.** LS's checkout URLs are `/checkout/buy/{uuid}` — numeric IDs 404. Find the UUID in LS dashboard → Products → click product → Share (the "Checkout link" tab in the share panel reveals the full URL with UUID).
- `VITE_LEMON_SQUEEZY_VARIANT_ID_ANNUAL` — annual variant checkout UUID, same format as above. Test mode and Live mode have DIFFERENT UUIDs for the same variant — swap both env vars when flipping the store between modes.

**Note: `LEMON_SQUEEZY_STORE_ID` is NOT required.** All API calls (cancel subscription, etc.) work directly off subscription/customer IDs that come in the webhook payload. The store ID is only useful for admin scripts that query the LS API for "all subscriptions in store X" — not needed at runtime.

**Phase 3 — Frontend changes** (~1 hour)
- [src/hooks/usePro.js](src/hooks/usePro.js) — replace mock `unlockPro` body. Open the LS Checkout overlay (their `lemon.js` script) with `user.uid` and `user.email` passed as `checkout_data.custom`. **DO NOT set `isPro` locally on click — wait for the webhook** to write to Firestore. The frontend just opens the checkout; the webhook is the source of truth.
- [src/hooks/usePro.js](src/hooks/usePro.js) — switch the existing `getDoc` hydration to `onSnapshot` so when the webhook updates Firestore, the UI flips to Pro in real time without a refresh. Update the unsubscribe cleanup in the effect's return.
- [src/components/Settings.jsx](src/components/Settings.jsx) — in the Account section, when `isPro` is true add a "Manage subscription" button that opens the LS customer portal URL (cancel, update card, view invoices). LS gives one customer-portal URL per subscription — fetch it from the user's Firestore doc (the webhook should store it).
- [src/components/PaywallCard.jsx](src/components/PaywallCard.jsx) — update copy from "$4.99 — one time" to "$4.99 / month". Same in the [src/components/Settings.jsx](src/components/Settings.jsx) ProModal subtitle ("One-time unlock. No subscription, no recurring charges.").
- [src/components/VibeCheckIntro.jsx](src/components/VibeCheckIntro.jsx) — update Pro perk copy if needed.
- Remove the entire mock-unlock fallback path once real billing works.

**Phase 4 — Test mode** (~30 min)
LS has a full test mode with test cards. Run all of:
- New subscription → Pro flips on
- Cancel mid-period → Pro stays on until period end, then flips off
- Failed payment → grace period → Pro flips off
- Resubscribe → Pro flips back on
- Sign out / sign in across devices → Pro state syncs correctly (already tested without LS — verify still works with real subs)

**Phase 5 — Go live** (~30 min)
1. Switch LS store from test → live mode, swap env vars in Vercel to production keys
2. Make a real $4.99 purchase yourself, verify the entire flow end-to-end, then refund yourself in LS dashboard
3. Update CLAUDE.md — remove "mock — no payment wired" notes, mark this section as ✅ BUILT

**What's most likely to trip us up:**
- Firebase Admin SDK initialization in a Vercel serverless function. Service account JSON has to be base64-encoded into a single env var, decoded once at module top level (NOT per-request). Watch for cold-start init issues.
- LS webhook signature verification — easy to get HMAC payload format wrong on first try. Test with their dashboard's "Send test event" feature before relying on it.
- Race condition: user closes the LS checkout right after paying but before the webhook fires (webhooks can take a few seconds). The `onSnapshot` listener handles this — UI just flips to Pro a moment later — but worth visualizing for the user (a "processing your payment…" state).

**Total realistic effort:** about half a day of focused work, plus the time spent settling the trial / annual / rename decisions before Phase 1.

**Custom checkout domain (future enhancement, not required for launch).** Lemon Squeezy supports pointing checkout at `checkout.erasranker.com` instead of the default `erasranker.lemonsqueezy.com` via Settings → Domains. Slightly higher trust at the moment of payment because users see your domain on the card-entry screen. Setup is a CNAME record (added in Cloudflare DNS once Email Routing is set up). Skip for v1 — the LS-branded checkout works fine, and it can be flipped on any time later without code changes.

### ~~Song Previews in Rating Flow~~ ✅ BUILT via Spotify Web Playback SDK
Pro users can connect their Spotify Premium account (Settings → Spotify) to hear each song play
automatically while rating. See `useSpotify.js` and `SpotifyMiniPlayer.jsx`.

**Key technical notes:**
- Uses **Spotify Web Playback SDK** + PKCE OAuth — plays full songs on the user's own Spotify account
- Taylor Swift preview URLs are gone from the API, but full playback via SDK works fine
- Track URIs found at runtime via Spotify Search API, cached in localStorage `eras_spotify_tracks`
- Spotify **developer quota:** free tier supports up to 25 users. To go beyond 25 users, must apply
  for **Extended Quota Mode** at developer.spotify.com — requires app description, use case, screenshots
- **Spotify branding rules enforced in UI:** green logo only on white backgrounds, min 24px, Spotify
  green (#1DB954) reserved for logo only (not used on play/pause controls), "Open in Spotify" link
  provides required attribution link-back, "Powered by Spotify" attribution text shown

## Spotify start times (developer-controlled)
Per-song playback start positions are set in `src/data/spotifyStartTimes.js` — developer-only, not user-facing.

**Shuffle screen start** (`screen='shuffle'`): edit `spotifyStartTimes.js`  
**Bridge section start** (`screen='bridge'`): edit `spotifyBridgeTimes.js` or regenerate via `find_bridge_times.py`

Both files use key `"albumId_songIndex"`, value = milliseconds. Songs without an entry start at 0.

Example (`spotifyStartTimes.js`):
```js
export const SPOTIFY_START_TIMES = {
  fe_2: 28000,  // Cruel Summer — skip to 0:28
  tv_0: 15000,  // The 1 — skip 15s intro
};
```

Do **not** add a user-facing setting for either file. Both are intentionally developer-controlled.

**What's built:**
- OAuth connect/disconnect in Settings tab (Pro-gated)
- Autoplay in QuickScore — song plays on each new song (shuffle start position)
- "Play Bridge" button in QuickScore bridge category — manual seek to bridge timestamp
- Developer-controlled per-song start positions for both shuffle and bridge screens
- Album cover art shown in album grid and album hero for connected Pro users
- SpotifyMiniPlayer shown inline at song title position in QuickScore (maxWidth 300px, matches lyrics width)

**Remaining Spotify work:**
- Apply for Extended Quota Mode before user count exceeds 25
- Consider adding a progress bar to the mini player with a bridge marker pin
- Playlist creation — let Pro users export their top-rated songs as a Spotify playlist

### Synchronized Lyrics Display (future — needs licensing decision first)

Displaying time-synced lyrics (line-by-line highlighted as the song plays) is technically feasible using the existing Spotify integration. The playback position is already available from the SDK's `player_state_changed` event (`state.position` in ms).

**Why it's on hold:** Displaying lyrics in a commercial app requires a licensing agreement. Two options evaluated:

#### Option A — lrclib.net (free, currently used for bridge timestamps)
- Already integrated via `find_bridge_times.py` — returns LRC format with per-line timestamps
- Could be used client-side at runtime with no extra API key
- **Legal risk:** Community-sourced, no commercial license. Acceptable gray area at small scale but not defensible long-term for a commercial product.

#### Option B — Musixmatch (licensed, industry standard)
- Used by Spotify, Apple Music, Amazon Music, YouTube Music
- Returns time-synced lyrics via `track.subtitle.get` endpoint
- Requires **"Grow" plan at $199/month** — includes 2,000 lyrics calls/day
- **Call budget math:**
  - Without caching: ~133 full album rating sessions/day (15 songs × 133 = ~2k calls)
  - With localStorage caching: ~10 completely new users fully onboarded/day; returning users cost $0
  - Sustainable once Pro revenue covers the $199/month baseline
- **App Store certificate included** — but this covers mobile apps; confirm web app coverage before signing
- Requires a new `VITE_MUSIXMATCH_KEY` env var in `.env` and Vercel

**Recommendation:** Use lrclib at small scale, switch to Musixmatch when ready to monetize seriously. Do not build the UI until the licensing path is decided.

### Bracket Feature — Architecture Notes

#### Weekly bracket data model
- State shape: `{ weekNumber, categoryName, seed, status, currentRound, currentMatchupIndex, contestants, rounds, votes, winner }`
- `rounds` is an array of rounds; each round is an array of matchup objects `{ song1, song2, winner }`
- `votes` is `[{ roundIndex, matchupIndex, winnerId }]` — tracks which matchups have been voted on
- localStorage key: `eras_weekly_bracket`; Firestore field: `weeklyBracket` on `users/{uid}`
- **Firestore nested-array constraint:** `rounds` must be serialized as `JSON.stringify(rounds)` before writing to Firestore, and `JSON.parse`d after reading. This is handled in `recordWeeklyVote` (write) and the Firestore sync `useEffect` (read) in `useBrackets.js`.

#### Why the weekly bracket had a hard-to-find advancement bug
Firestore's `setDoc` throws **synchronously** when data contains nested arrays. The `.catch()` on the returned Promise only handles async rejections — it doesn't catch a sync throw. So if the user is logged in, the sync throw aborted `recordWeeklyVote` before `setWeeklyState` could run, causing the same matchup to reload. The fix wraps the `setDoc` call in `try/catch` and serializes `rounds` to avoid the error entirely.

### Bracket Feature — Remaining Work

#### Community bracket vote tallies (Firestore counters)
**Current state:** The "X% of Swifties agree" feedback shown after each bracket vote is simulated using a seeded deterministic random function (`getCommunityVotePercent` in `bracketCategories.js`). Every user sees the same percentages for the same matchup — there is no real aggregation.

**What needs to be built:**
- A shared Firestore collection (e.g. `bracketVotes/{weekNumber}_r{round}_m{matchup}`) with atomic counter increments for song1 and song2
- Security rules: allow increment writes but not reads-then-writes to prevent stuffing
- In `useBrackets.js`, replace the simulated percent with a real Firestore read after each vote
- The weekly bracket winner should be derived from the Firestore tallies, not the seeded random

**Do not build this until the bracket design is finalized** — schema and security rules are easy to add once the UX is stable.

#### Spotify playback in bracket matchup cards
**Current state:** The MatchupScreen (`src/components/brackets/MatchupScreen.jsx`) shows era-colored song cards with lyric snippets, but does not play audio. Placeholder comments mark where Spotify calls would go.

**What needs to be built:**
- Pass `spotify` prop from `Brackets.jsx` → `MatchupScreen.jsx`
- On each new matchup, call `spotify.playTrack(albumId, songIndex, songName, albumName, 'shuffle')` to auto-play the currently focused song (or both songs briefly)
- Show a `SpotifyMiniPlayer` inline in the matchup card for whichever song is highlighted
- For "Best Bridge" category, use `screen='bridge'` to seek to bridge timestamp
- Gate behind `isPro` check — non-Pro users see cards without audio

#### Bracket completion-rate tracking
**Current state:** `useBrackets.js` tracks bracket state (rounds, matchups, votes) but does not record bracket lifecycle events on the user's Firestore doc, so we can't tell how many users start a bracket vs. abandon mid-tournament.

**What needs to be built:**
- Add two integer counters to `users/{uid}`: `bracketsStarted` and `bracketsCompleted`
- In `useBrackets.js`, increment `bracketsStarted` (Firestore `increment(1)`) when a user begins a new personal or weekly bracket
- Increment `bracketsCompleted` when the final winner is set (i.e. the bracket transitions to a finished state)
- These pair with the existing per-user analytics fields (`totalRatings`, `albumsCompleted`) so we can spot drop-offs in the bracket flow without scanning every user's full state
- Same write pattern as `useUserStats` — silent failure on offline, no rules changes needed

### Notification System (engagement loop) — NOT BUILT

**Goal:** drive engagement during a new user's first week and re-engage lapsed users. Reuses existing per-user Firestore fields (`signedUpAt`, `lastActiveAt`, `sessionCount`, `totalRatings`, `albumsCompleted`).

**Channels (v1):** email + in-app banners. **Skip web push for v1** — iOS only supports it for installed PWAs, opt-in rates are low, not worth the build cost yet. Reconsider after launch if email isn't enough.

**First-week schedule:**

| When | Trigger | Message | Channel |
|---|---|---|---|
| Sign-up | Account created | Welcome + "pick your first album" | In-app banner |
| +1 day inactive | No session since signup | "Vibe check your first album in 2 minutes" | Email |
| +2 days, partial album | Started but didn't finish an album | "You're N songs from completing {album}" | Email |
| +3 days | Weekly bracket live | "This week's bracket — vote in 60 seconds" | Email + banner |
| Album completed | First full album rated | "Share your rankings card" | In-app moment + email follow-up |
| +7 days | One-week mark | "Here's how your top 10 looks vs other Swifties" | Email |
| +14 days inactive | Re-engagement | "Your rankings are waiting" | Email |

**What needs building:**
- Email service — Resend or Postmark (free tier covers early scale; ~$20/mo at growth). Simpler setup than SendGrid.
- Scheduler — daily job (Vercel Cron or Firebase scheduled function) reads each user doc and sends due emails.
- Two new Firestore fields per user: `notificationPrefs` (per-type opt-out) and `notificationsSent` (log of what was sent + when, prevents spam).
- Unsubscribe page — legally required, one-click off any list.
- In-app banner component above home tab; reads "next nudge" from user doc.

**Guardrails:**
- Cap at 1 email/day, max 3/week until user is regularly active
- Default opt-in for transactional + product updates, opt-out for marketing
- Easy unsubscribe link in every email footer
- Never email password-bypass beta users (no Firebase user record)
- Log open + click rates so dead messages can be killed

**Decisions still open before building:**
1. Web push in v1 or email only? (Recommended: email only.)
2. Email service + budget tier?
3. Draft email copy upfront or ship with placeholders?

**Smallest first step:** pick email service → add the two Firestore fields → ship the Day +1 inactive-user email. Everything else slots in after that.

### Daily developer health-check email (planned — NOT BUILT)

A separate, lower-stakes channel from the user-facing notifications above. Goal: send the developer (clay.tillman7@gmail.com) one email per day summarising anything that needs human attention, so silent failures stop being silent.

**Use cases to include from day one:**
- **Account-deletion partial failures.** When [DeleteAccountModal](src/components/DeleteAccountModal.jsx) gets past Firestore deletes (steps 2–3) but `deleteUser()` (step 4) fails, the user ends up with an orphan Firebase auth record and no Firestore data. We need to detect these and clean them up. Cheapest detection: each session start, check whether `users/{uid}` exists for the signed-in user — if missing AND `signedUpAt` was previously written, log a `deletionOrphan` flag somewhere the daily job can find. Daily email lists any uids in that state so the developer can manually delete the auth record from the Firebase console.
- **Webhook drift.** Once Lemon Squeezy is live: any user where `users/{uid}.isPro === true` but their LS subscription is `cancelled`/`expired`. Means the webhook missed an event.
- **Profanity filter false-positives or new patterns.** Bio attempts that were rejected but look benign — the developer reviews and adjusts the wordlist if a pattern keeps tripping real users up.
- **Spotify Extended Quota threshold.** Once user count crosses 20, the email warns that the 25-user free-tier ceiling is approaching.

**Implementation sketch (not built yet):**
- Vercel Cron job runs once daily, hits `/api/daily-health-check`.
- The endpoint scans Firestore for the conditions above and emails a single summary via Resend / Postmark (same provider as the user notification system — share the account).
- Empty days send a one-line "all clear" so silence ≠ "the cron is broken."

### Google Play Store launch plan (planned — NOT BUILT, DO NOT begin without explicit user instruction)

**Goal:** publish The Eras Ranker on the Google Play Store as an Android app, without rewriting the codebase. The existing PWA is the foundation; the Android "app" is a thin wrapper around `erasranker.com`.

**Approach chosen: Trusted Web Activity (TWA) wrapper.** Generated with Bubblewrap or PWABuilder. The Android binary is a one-screen shell that opens the live PWA fullscreen with no browser chrome. Every web deploy to Vercel updates the Android app instantly — no Play Store resubmission needed for code changes. This is the same approach Google uses for its own PWA-backed Play Store apps and works because the app is already a compliant PWA (manifest.json + service worker + HTTPS + responsive design).

**Why not React Native or a full rewrite:** ~2 months of work to rebuild what already exists, no real user-facing benefit, doubles ongoing maintenance. Only worth doing if the TWA wrapper proves unable to host Spotify playback (see decision #2 below).

#### Two big decisions that must be settled before any building starts

**Decision 1 — How to handle Pro subscriptions inside the Android app. PRO FUNNEL: major impact.**

Google Play requires that digital goods sold inside an Android app use **Google Play Billing**, and Google takes **15% (first $1M/yr per developer) to 30%** of every sale. This rule applies even though Lemon Squeezy is the back-end on web. You cannot just open a Lemon Squeezy checkout from inside the Android app for Pro upgrades — Google will reject the app.

Three real options, none of them locked in yet:
- **A. Dual billing (recommended).** Pro sold on web stays Lemon Squeezy (you keep ~95%). Pro sold inside the Android app uses Google Play Billing (you keep ~85%). The same Firebase user can buy on either side and Pro syncs across both. Adds ~1 week of dev work: a Google Play Developer API webhook into a new Vercel function, plus a billing-source flag on the Firestore user doc so cancellations are routed to the right provider.
- **B. View-only on Android.** No in-app Pro upgrade flow at all. Users who want Pro have to open `erasranker.com` in a browser. Google now permits this (after Epic v. Google and the EU DMA), but the UX is meaningfully worse and conversions will drop. Zero billing-tax exposure, zero Play Billing dev work.
- **C. Don't ship to Play Store yet.** Let users install the PWA directly from Chrome ("Add to Home Screen"). No Google cut, no review, but no Play Store discovery channel either.

Recommendation in the conversation was **Option A** for a paid product, but the user has not formally chosen. Settle this before Phase 2.

**Decision 2 — Does Spotify Web Playback SDK work inside the TWA wrapper?**

The SDK is built for desktop browsers, uses Widevine DRM, and requires Spotify Premium. Inside a TWA it runs through Chrome on Android, so it *should* work — but Spotify themselves recommend their native Android SDK for mobile apps, and DRM-protected playback in webview-style wrappers is the exact kind of thing that works on desktop and breaks on mobile.

This is the biggest unknown in the plan. The cheapest test is to stand up a one-hour PWABuilder TWA pointing at the live site, sideload it onto a real Android phone, and try the autoplay + Play Bridge buttons. The outcome dictates the fallback:
- **Works cleanly** → ship the wrapper as-is.
- **Works but flaky** → hide the autoplay/per-moment-seeking on Android only (degrade to album-art-only, same path as the existing non-Premium experience). PRO FUNNEL: minor impact — the non-playback Pro perks (extra categories, custom categories) survive.
- **Doesn't work at all** → switch the Android build to Spotify's native Android SDK (2–3 weeks of real work) OR ship Android as a free-tier-style experience and keep Pro playback web-only.

Do NOT commit to a launch date until this test has been run.

#### Phases (assumes TWA + Decision 1 Option A)

**Phase 0 — Pre-work that has to happen regardless (~2 weeks).** All cross-referenced to the "Pre-launch checklist" below:
- Privacy policy live at `erasranker.com/privacy` (already on pre-launch checklist).
- `privacy@erasranker.com` working via Cloudflare Email Routing (already on pre-launch checklist).
- BetaGate already removed.
- Real Lemon Squeezy billing wired up and verified on web (see "Payment provider — Lemon Squeezy plan" earlier in this file).
- Trivia facts fact-checked (already on pre-launch checklist).
- A once-over from a lawyer ($200-ish consult) on the "Taylor Swift" trademark angle. Apps that rank a celebrity's songs are usually fine, but Google has rejected fan apps occasionally. The app name "The Eras Ranker" is neutral; the question is the album list and emoji identifiers.

**Phase 1 — Build the Android wrapper (~3–5 days).**
- Generate the TWA wrapper with Bubblewrap (CLI, runs locally) or PWABuilder (web UI). Either outputs a signed `.aab` (Android App Bundle, the Play Store format).
- Host `assetlinks.json` at `https://erasranker.com/.well-known/assetlinks.json` so Chrome verifies the Android app owns the domain and shows the PWA fullscreen with no browser address bar.
- Test on real Android devices — at minimum one current phone, ideally one older. Specifically verify:
  - Google sign-in via `signInWithRedirect` (the redirect can open an external browser tab inside a wrapper and break the flow — known TWA gotcha; fix is to use `signInWithPopup` on Android, or detect the wrapper and adjust).
  - Spotify autoplay + Play Bridge (Decision 2 above).
  - Service worker caching after a Vercel deploy.
  - The hardware back button (default TWA behavior closes the whole app instead of going back one screen — fixable via the wrapper config).
  - Lemon Squeezy checkout overlay (must be replaced with Google Play Billing flow on Android per Decision 1).
  - Public profile sharing — the Android share sheet integration.

**Phase 2 — Wire up Google Play Billing if Decision 1 = Option A (~1 week).**
- New Vercel function `/api/google-play-webhook` that receives Real-Time Developer Notifications from Google Play (subscription state changes).
- Server-side receipt validation via the Google Play Developer API (service account credential added to Vercel env vars, base64-encoded like the Firebase Admin SDK key).
- Firestore: add `billingProvider: 'lemonsqueezy' | 'googleplay'` to the user doc. Drives which cancellation flow runs on account deletion. Update `DeleteAccountModal` accordingly — today it only knows about Lemon Squeezy.
- In `usePro.js`, detect when running inside the Android wrapper (look for a `?source=android` URL parameter the wrapper appends, or a custom user-agent string) and route Pro upgrades through Google Play Billing instead of the Lemon Squeezy checkout overlay. Same `onSnapshot` listener flips the UI to Pro once the webhook updates Firestore.

**Phase 3 — Play Store listing assets (~2–3 days, mostly design and copy).**
- High-res app icon, 512×512 PNG, NO transparency (Play Store rejects transparent icons).
- Feature graphic, 1024×500 PNG. Shown at the top of the store listing. Treat as marketing artwork.
- Screenshots — at least 2, ideally 4–6. Phone size minimum; Google encourages 7" and 10" tablet shots too.
- Short description, 80 chars max — shown in search results.
- Full description, up to 4000 chars — landing page copy.
- Content rating questionnaire (answered in Play Console).
- Data Safety form — declare every piece of data collected (Google account, ratings, Spotify connection, payment info via Play Billing, etc.) and where it goes. MUST match the privacy policy exactly — Google rejects on mismatches.
- Category: Music & Audio.

**Phase 4 — Closed test + production review (~2–3 weeks of mostly waiting).**
- Google Play Developer account: $25 one-time fee.
- **Mandatory closed test:** Google now requires new personal developer accounts to run a closed test with **at least 12 testers for 14 consecutive days** before being eligible to publish to production. Pull your tester list from the manually-comped Pro users in `users/{uid}` (the same people who currently have `proSource: 'beta'` or similar). This wait is non-negotiable — do not plan a launch date that assumes you can skip it.
- Submit for production review. First review usually 3–7 days. Common rejection reasons: privacy policy ↔ Data Safety mismatch, missing content rating, trademark concerns, undisclosed in-app purchases. Each rejection cycle adds another 3–7 days.

#### Realistic total timeline

About **7–8 weeks from kickoff to live in the Play Store** at a steady part-time pace, assuming no major Phase 1 testing surprises and one rejection cycle. Add ~1 week if Decision 1 = Option A (Play Billing integration). Add 2–3 weeks if Decision 2 forces a fallback to Spotify's native Android SDK.

#### Risks and unknowns to revisit before starting

1. **Spotify playback in the wrapper is the largest unknown.** Decision 2 above. One afternoon of testing settles it.
2. **The Play Billing tax is a real revenue hit on Android-originated Pro subs.** Decision 1 above. Pricing may need a second look — e.g. raising the Android-side price slightly to absorb the tax, or making the annual tier cheaper than monthly on Android specifically to push users toward the lower-fee bucket.
3. **Trademark review.** Probably fine, not guaranteed.
4. **14-day closed test wait is hard-locked** for new developer accounts.
5. **iOS / Apple App Store is a much bigger lift if pursued later.** Apple has historically been stricter on fan apps AND on billing — they don't allow the external-checkout workaround that Google now permits. The Android path does NOT translate cleanly to iOS; a separate plan will be needed.
6. **Account deletion on Android.** Google Play requires apps with sign-in to provide in-app account deletion (already built — see `DeleteAccountModal`) AND a web-accessible deletion path linked from the Play Store listing. Settings → Delete my account satisfies the in-app side; the Play Store listing will need a public URL like `erasranker.com/delete-account` that explains the flow and links to it.

#### Conversion-funnel implications

- **LOGIN FUNNEL:** Play Store install gives a small lift — users who installed an app are measurably more likely to sign in than users who hit a website. The Welcome → GoogleLoginPromo → SpotifyIntro flow stays unchanged.
- **SPOTIFY FUNNEL:** depends entirely on Decision 2. If playback works, no change. If it doesn't, the SpotifyIntro pitch needs an Android-specific variant ("album art everywhere" instead of "and hear your songs play").
- **PRO FUNNEL:** Decision 1 directly governs this. Option A preserves the funnel with a tax. Option B noticeably weakens it (every upgrade ask now requires leaving the app). Option C punts it entirely.
- **SHARING FUNNEL:** Android share sheet is generally better than the iOS web share sheet, so RankingCard / AlbumCompleteCard shares should perform at least as well, possibly better, than the web equivalent.

---

## Pre-launch checklist
**Must be done before the app is launched publicly. Do not skip.**

### Verify bracket "Did you know?" trivia facts
**Where:** `TRIVIA` array in `src/components/brackets/RoundTransition.jsx` (lines ~18–29), plus the default fallback fact below it.

**Why this matters:** The 10 trivia facts shown between bracket rounds were written from general knowledge during feature development and have **not been fact-checked**. Specific claims (Grammy wins/categories, chart-week counts, certification milestones, songwriting backstories) need verification against authoritative sources before they're shown to real users — a wrong fact in a commercial Taylor Swift app is both a credibility hit and, depending on the claim, a defamation/misinformation risk.

**What to do:**
- Verify each of the 10 facts against a reliable source (official Grammy site, Billboard, RIAA, Taylor's verified interviews, etc.)
- Fix or replace any that are inaccurate
- Verify the default fallback fact too ("over 200 million records worldwide")
- Consider expanding the list once verified — 10 facts is thin if a user plays many brackets

### ~~Set up `privacy@erasranker.com` via Cloudflare Email Routing~~ ✅ DONE
**Status:** Cloudflare account is active. DNS for `erasranker.com` was migrated from Vercel to Cloudflare (Vercel still hosts the site — only DNS moved). Email Routing is enabled with six receive-only addresses live, all forwarding to `clay.tillman7@gmail.com`:

- `privacy@erasranker.com`
- `support@erasranker.com`
- `legal@erasranker.com`
- `dmca@erasranker.com`
- `hello@erasranker.com`
- `noreply@erasranker.com`

**Configuration notes for future Claude sessions:**
- Cloudflare proxy status for every DNS record pointing to Vercel must stay set to **"DNS only" (grey cloud)**, NOT "Proxied" (orange cloud). Stacking Cloudflare's CDN on top of Vercel's CDN causes SSL handshake issues and bypasses Vercel's edge network. If a record gets accidentally flipped to Proxied later, toggle it back to grey.
- Catch-All rule is intentionally **disabled** (Drop). Emails to typo'd / undefined addresses bounce back to sender. Enabling catch-all with forwarding would flood the inbox with spam.
- Domain registration is still at Vercel — only the nameservers point to Cloudflare. Auto-renewal and ownership stay with Vercel.

**Still deferred (optional follow-up, ~30 min, free):**
- Sign up for Brevo (free SMTP relay, 300 emails/day) to enable replying *from* the `@erasranker.com` addresses instead of the personal Gmail. Today the addresses are receive-only — any reply Clay sends to a customer goes out from `clay.tillman7@gmail.com`, which reveals the personal address. Brevo + Gmail "Send mail as" fixes that.
- Do this when the personal-Gmail-on-reply starts to bother (or before any customer-facing reply situation, e.g. once Lemon Squeezy goes live and customer-support emails start arriving).

**Doesn't conflict with Resend.** When the user-facing notification system (transactional emails, see "Notification System" above) is wired with Resend, Resend will own a separate sending sub-address. They share the domain, not the address.

### Write and publish the privacy policy
**Why this matters:** GDPR, CCPA, Apple/Google store policies, Lemon Squeezy onboarding, Google OAuth verification, and every email service all require a real privacy policy URL. Cannot launch publicly without one.

**The plan: iubenda generator + ~5 hand-written paragraphs covering app-specific items.** ~$35/year, ~3.5 hours of work.

**What to do:**
1. Subscribe to iubenda.com.
2. Run their wizard with the data inventory documented in the v0.3.0 conversation (Google identity fields, ratings, brackets, Pro state, Spotify tokens stored locally, public profile data, launch waitlist, planned Lemon Squeezy fields).
3. Add 5 hand-written paragraphs in iubenda's custom-text fields:
   - Spotify integration (token stored locally only, never on our servers)
   - Public profile (anyone-with-link sharing, how to turn off)
   - Lyric data (sourced from public databases, not collected from users)
   - Pro subscription (Lemon Squeezy handles billing, we never see card data)
   - Account deletion (link directly to Settings → Delete my account)
4. List `privacy@erasranker.com` as the privacy contact (set up via the Cloudflare task above).
5. Wire the iubenda URL into the app at three touchpoints:
   - **Beta gate sign-in screen** — small grey text below the sign-in button: *"By signing in, you agree to our [Terms of Service] and [Privacy Policy]."*
   - **Settings → About** — link directly under the version number.
   - **Footer** — discreet link reachable from any screen.
6. Decide on Terms of Service in the same iubenda flow (recommended yes — minimal extra cost, and Lemon Squeezy will ask).
7. Set a 6-month calendar reminder to review the policy.

**Cookie banner:** not strictly needed today (Firebase Auth cookies are functional/essential), but required the moment any analytics or third-party tracking is added. iubenda's cookie banner module is ~$30/year — add at the same time as analytics.

**Decisions to lock in before drafting:**
- Business name (personal name, LLC, sole proprietorship?) — affects both the policy and Lemon Squeezy.
- Mailing address (PO Box is fine — GDPR requires a physical address, not just an email).
- Children's age cutoff — recommended 13+. Anything younger requires parental-consent flows.

### Upload a logo to the Lemon Squeezy storefront
**Why this matters:** the LS dashboard ships with an "E" placeholder logo today. The logo appears on the checkout page, on customer email receipts and invoices, and on the public storefront at `erasranker.lemonsqueezy.com`. A real logo is a small but visible trust signal — without one, the checkout page looks half-built.

**Where:** Lemon Squeezy dashboard → Settings → General → Logo → Choose. JPG / GIF / PNG, 1MB max. Recommended 512×512 PNG.

**Suggestion:** match the in-app brand (purple gradient `#a855f7 → #7c3aed` + a recognisable mark — could be one of the existing album emojis or a custom "ER" wordmark). Doesn't need a designer; a simple tile generated in Figma / Canva is plenty.
