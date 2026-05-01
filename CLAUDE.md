# The Eras Ranker — Claude Context

## User
Not a developer. Use plain, simple language — no jargon.

## App intent
This is a **commercial product**, not a hobby or fan project. Treat every decision — licensing, architecture, legal risk, monetization, scalability — accordingly. Do not assume small scale or low stakes.

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
                             ALL hooks must be declared before the beta gate early return (Rules of Hooks)
                             Beta gate check: if 'eras_beta_unlocked' not in localStorage, renders BetaGate
                             Passes user/signIn/signOut to Settings; passes isPro ? spotify.albumArt : null to grid/songlist
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
  components/
    ErrorBoundary.jsx      — top-level React error boundary; catches any unhandled crash and shows a
                             friendly "Something went wrong — Reload" screen instead of blank white page
    BetaGate.jsx           — full-screen access gate rendered by App when beta is not unlocked
                             Two paths: Google sign-in (checked against VITE_BETA_EMAILS allowlist) or
                             dev bypass password (VITE_BETA_PASSWORD); on pass, sets localStorage 'eras_beta_unlocked'
                             Shows spinner while authLoading or while a signed-in user is being verified
                             If email is not on the allowlist: shows rejection message + signs user out
                             VITE_BETA_EMAILS empty = any Google account allowed through
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
- `isPro` stored as `'eras_is_pro'` in localStorage; `unlockPro()` is a mock — no payment wired
- **Pro upgrades require a signed-in user.** `unlockPro()` no-ops and returns `false` if no user.
  Reason: a paid upgrade must be tied to identity so it survives device wipes and follows the user
  to other devices, and Stripe will need a customer record once real billing is wired up.
- **Cloud is the source of truth for `isPro`.** On sign-in, usePro fetches the Firestore doc and
  forces local `isPro` to match `users/{uid}.isPro`. This protects against localStorage tampering
  (`localStorage.setItem('eras_is_pro','true')`) — the next sign-in will reset it. Unlike other
  hooks, usePro does NOT migrate localStorage up to Firestore: a local-only Pro flag is treated as
  stale or tampered, never as truth.
- **Sign-out revokes Pro locally.** On a real sign-out transition (had a user, now don't), usePro
  clears `eras_is_pro` and resets `isPro` state. Firestore still has the user's record, so signing
  back in instantly restores Pro via the hydration branch. Detection uses a `prevUserRef` so the
  initial `null → null` render on app load doesn't trigger a false revocation.
- Pro UI surfaces (Settings ProModal, PaywallCard, VibeCheckIntro) keep "Unlock Pro" tappable; if
  no user, tapping it routes through a shared "Sign in to continue" step (Back arrow → returns).
- Extra category weights rescaled so all active categories always sum to 100
- Weight overrides stored per-category in `eras_category_weights`; reset clears that key
- Pro gates: extra categories, custom categories, Categories tab paywall UI, **Spotify integration**
- **Free for everyone:** all 5 default categories, default-category weight sliders, on/off toggles, weight reset banner

## Beta gate
- Controlled by two env vars (set in `.env` locally and in Vercel environment settings):
  - `VITE_BETA_EMAILS` — comma-separated list of allowed Google emails; empty = any signed-in Google account
  - `VITE_BETA_PASSWORD` — dev bypass password; if unset, the password field is hidden
- Gate state stored in localStorage key `'eras_beta_unlocked'`; once set, user never sees gate again on that device
- Gate is a full-screen overlay — app content is never visible behind it
- Google sign-in through the gate also logs the user into the app (same Firebase auth action)
- **Important:** all data hooks in App.jsx must remain declared BEFORE the `if (!betaUnlocked)` return

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
| `signedUpVia` | `'google'` (password-bypass users have no Firebase user, so no field) |
| `signupSource` | string — value of `?ref=<source>` URL param at first visit |
| `referrer` | string — `document.referrer` at first visit |
| `proUpgradedAt` | server timestamp — set when `unlockPro()` fires (mock today, Stripe later) |

### Sync behaviour
- App loads instantly from **localStorage** (no flicker)
- On login: each hook fetches the Firestore doc once
  - If Firestore has data → hydrates state from cloud (cloud wins)
  - If Firestore is empty → migrates localStorage data up to Firestore automatically
- Every write goes to **both localStorage and Firestore** — works offline, stays in sync
- On sign-out: app continues using whatever is in localStorage

### Firestore security rules
Set in Firebase console → Firestore → Rules. Users can only read/write their own document. The `launchWaitlist` collection is write-only from the client (BetaGate creates one doc when a rejected user opts in to be notified at launch); reads happen only via the Firebase console.
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /launchWaitlist/{email} {
      // Authenticated user can create/update only their own waitlist record
      // (doc ID must match their auth email).
      allow create, update: if request.auth != null
                            && email == request.auth.token.email
                            && request.resource.data.email == request.auth.token.email;
      allow read, delete: if false; // owner reads via Firebase console
    }
  }
}
```

### Beta gate rejection → launch waitlist
When a Google sign-in succeeds but the email isn't on `VITE_BETA_EMAILS`, BetaGate (instead of immediately signing the user out) shows a "we'll email you at launch" opt-in. Clicking it writes `{ email, name, photoURL, requestedAt }` to `launchWaitlist/{email}` in Firestore, then signs the user out. Owner views the list at Firebase console → Firestore → `launchWaitlist` collection.

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
  - `VITE_BETA_EMAILS` — comma-separated allowed emails for beta gate (empty = any Google account)
  - `VITE_BETA_PASSWORD` — dev bypass password for beta gate
- **`.claude/settings.local.json`** is gitignored — do not commit it
- **Vercel build settings:** Framework = Vite, Build = `npm run build`, Output = `dist`, Root Directory = (blank/repo root)
- **Vercel environment variables:** must mirror all `VITE_*` values from `.env` — including `VITE_BETA_EMAILS` and `VITE_BETA_PASSWORD`

### Working on a second computer
1. Install Git and Node.js
2. `git clone https://github.com/claytillman767/eras-ranker`
3. `cd eras-ranker && npm install`
4. Create `.env` manually — paste in the Genius API token AND all `VITE_FIREBASE_*` keys (find them in Firebase console → Project settings → Your apps), plus `VITE_SPOTIFY_CLIENT_ID`, `VITE_BETA_EMAILS`, `VITE_BETA_PASSWORD`
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
Remaining future work in this area: Stripe integration to move Pro status from a localStorage flag to a trusted Firestore field.

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
