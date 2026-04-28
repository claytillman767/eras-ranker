# The Eras Ranker — Claude Context

## User
Not a developer. Use plain, simple language — no jargon.

## App intent
This is a **commercial product**, not a hobby or fan project. Treat every decision — licensing, architecture, legal risk, monetization, scalability — accordingly. Do not assume small scale or low stakes.

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
  App.jsx                  — root; 4 tabs: Albums, Rate songs, Rankings, Categories
                             imports useAuth; passes user to all data hooks;
                             login button (top-right): Google sign-in or avatar+dropdown
  firebase.js              — initialises Firebase app, exports auth, db, googleProvider
  data/
    albums.js              — ALBUMS array + SONGS dict (albumId → song name array)
    categories.js          — DEFAULT_CATEGORIES (5) + EXTRA_CATEGORIES (8, Pro-only)
                             "Skip on shuffle?" uses id 'replay'; default weights sum to 100
    bridgeLyrics.js        — DO NOT edit by hand; regenerate: python parse_bridges.py
    snippetLyrics.js       — DO NOT edit by hand; regenerate: python parse_snippets.py
                             Best lyric snippet per song (bridge > chorus > verse 1)
                             Used as floating BG on shuffle screen + scroller on Lyrics screen
    spotifyStartTimes.js   — Developer-controlled Spotify playback start positions (NOT user-facing)
                             Key: "albumId_songIndex", Value: milliseconds into the track
                             Songs not listed start from 0. Edit this file to set per-song start points.
  hooks/
    useAuth.js             — Firebase Google sign-in; exposes user, authLoading, signIn, signOut
    useRatings.js          — accepts user param; reads/writes localStorage + Firestore (ratings field)
    usePro.js              — accepts user param; reads/writes localStorage + Firestore (pro field)
    useManualOrder.js      — accepts user param; reads/writes localStorage + Firestore (manualOrder field)
    useAlbumModes.js       — accepts user param; reads/writes localStorage + Firestore (albumModes field)
  hooks/
    useSpotify.js          — Spotify Web Playback SDK integration (Pro-only)
                             PKCE OAuth flow; token storage in localStorage; SDK script loaded dynamically
                             Track URIs found via Spotify Search API + cached in localStorage 'eras_spotify_tracks'
                             Album art URLs cached in localStorage 'eras_spotify_album_art' (albumId → image URL)
                             On connect: proactively fetches art for all 12 albums via Search API
                             searchTrackUri() returns { uri, imageUrl } — art also captured as side effect of playTrack()
                             Exposes: isConnected, isLoading, playerReady, isPlaying, currentSongName, albumArt,
                               error, connect, disconnect, playTrack, pause, resume, togglePlay
                             connect() redirects to Spotify OAuth; callback detected on app load via ?code=&state=eras_spotify
                             Requires VITE_SPOTIFY_CLIENT_ID env var; redirect URIs must be registered in Spotify dashboard
    useSettings.js         — app-wide settings; localStorage 'eras_settings' + Firestore sync
                             DEFAULTS: { showCategoryBars: true, spotifyAutoplay: true }
                             Note: Spotify start time is NOT in settings — it's developer-set in spotifyStartTimes.js
  components/
    AlbumGrid / AlbumCard  — album picker with score badges; AlbumCard accepts spotifyArtUrl — shows real
                             cover art image when provided, falls back to emoji/color otherwise
    AlbumModeModal.jsx     — bottom-sheet shown on first album visit; "Vibe Check" (auto-starts QuickScore)
                             or "Sort It Yourself"; choice saved via useAlbumModes
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
                             SpotifyMiniPlayer shown between top bar and question content
                             Autoplays song on Spotify when songPos changes (if connected + playerReady + spotifyAutoplay)
                             Pauses Spotify on unmount
    SpotifyMiniPlayer.jsx  — compact bar inside QuickScore; white background (Spotify branding compliant)
                             Connected: logo + song name + purple play/pause + "Open in Spotify" ↗ link
                             Not connected: prompts user to connect (links to Settings)
                             Spotify branding rules enforced: green logo on white bg only, min 24px, no green on controls
    StarRating.jsx         — reusable star input; size='sm'|'md'|'lg'; readonly prop
    Rankings.jsx           — top songs / top albums leaderboard + RankingCard at bottom
    RankingCard.jsx        — shareable card button (Rankings tab); also exports drawCard()
    AlbumCompleteCard.jsx  — full-screen overlay shown once when album becomes fully ranked
    Categories.jsx         — Pro unlock + category toggles + weight sliders + custom creator
    ScoreBar.jsx           — visual score bar used in Rankings
    PaywallCard.jsx        — Pro upgrade prompt (used in Categories)
    Settings.jsx           — Display section (category bars toggle) + Spotify section (connect/disconnect, autoplay)
                             Spotify section is Pro-gated; shows paywall card for non-Pro users
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
- Extra category weights rescaled so all active categories always sum to 100
- Weight overrides stored per-category in `eras_category_weights`; reset clears that key
- Pro gates: extra/custom categories, weight sliders, Categories tab paywall UI, **Spotify integration**

## QuickScore flow
- Covers full viewport (`position: fixed, inset: 0, zIndex: 1000`)
- Per song: **ShuffleScreen first** (replay category, Play/Skip buttons + floating lyrics BG),
  then star questions for remaining categories in order
- On Lyrics category: `LyricScroller` appears above stars (scrollable, 110px box)
- On Bridge category: bridge lyrics shown as inline italic quote above stars
- Star labels (calibration phrases) defined in `STAR_LABELS` map inside QuickScore.jsx
- Completion: animated DoneFlash auto-closes after 2s
- Props: `songs`, `albumId`, `albumName`, `albumIcon`, `activeCategories`, `ratings`, `onRate`, `onClose`, `initialSongPos`,
  `spotify`, `spotifyAutoplay`, `onGoToSpotifySettings`
- Spotify start position comes from `SPOTIFY_START_TIMES` in `spotifyStartTimes.js` — looked up inside `playTrack`, not passed as a prop

## Lyrics scripts (Python)
- `parse_bridges.py` → `src/data/bridgeLyrics.js` (bridge sections only)
- `parse_snippets.py` → `src/data/snippetLyrics.js` (best section per song)
- Source file: `taylor_swift_lyrics.txt` (Genius-sourced, sections labelled [Verse], [Chorus], [Bridge] etc.)
- Run either script from the project root after editing the lyrics file

## Authentication & Firestore

### How it works
- **Sign-in method:** Google only (popup via `signInWithPopup`)
- **Auth state:** `useAuth` hook listens with `onAuthStateChanged`; exposes `user` (Firebase user object or `null`), `authLoading` (true briefly on first load), `signIn`, `signOut`
- **UI:** Top-right of header — "Sign in" button (Google G logo) when logged out; purple avatar circle when logged in; tapping avatar shows a dropdown with name, email, and Sign out

### Firestore data structure
All user data lives in a single Firestore document: `users/{uid}`

| Field | Contents |
|---|---|
| `ratings` | `{ "albumId_songIndex": { catId: starValue } }` |
| `pro` | `{ isPro, enabledExtras: [], customCategories: [], categoryWeights: {} }` |
| `manualOrder` | `{ albumId: [songIndex, ...] }` |
| `albumModes` | `{ albumId: 'score' \| 'manual' }` |

### Sync behaviour
- App loads instantly from **localStorage** (no flicker)
- On login: each hook fetches the Firestore doc once
  - If Firestore has data → hydrates state from cloud (cloud wins)
  - If Firestore is empty → migrates localStorage data up to Firestore automatically
- Every write goes to **both localStorage and Firestore** — works offline, stays in sync
- On sign-out: app continues using whatever is in localStorage

### Firestore security rules
Set in Firebase console → Firestore → Rules. Users can only read/write their own document:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase project
- **Project ID:** `eras-8fd36`
- **Console:** https://console.firebase.google.com/project/eras-8fd36
- **Auth provider:** Google (enabled under Authentication → Sign-in method)
- **Config keys:** stored in `.env` as `VITE_FIREBASE_*` variables

## AlbumCompleteCard / RankingCard
- AlbumCompleteCard: shown once per session when album transitions incomplete → fully ranked
- RankingCard: 1080×1080 Canvas shareable card; unlock condition: at least one album fully ranked
- `drawCard(ctx, songs)` named export used by both

## Deployment & version control
- **GitHub:** private repo at `https://github.com/claytillman767/eras-ranker`
- **Vercel:** auto-deploys on every push to `main`; live at `https://eras-ranker.vercel.app`
- **Local path:** `C:\Users\clayt\dev\eras-ranker` (moved out of OneDrive to avoid git conflicts)
- **`.env`** contains `GENIUS_API_TOKEN` (Python lyrics scripts only), all `VITE_FIREBASE_*` keys, and `VITE_SPOTIFY_CLIENT_ID` (loaded by Vite at build time); gitignored, never commit it
- **`.claude/settings.local.json`** is gitignored — do not commit it
- **Vercel build settings:** Framework = Vite, Build = `npm run build`, Output = `dist`, Root Directory = (blank/repo root)

### Working on a second computer
1. Install Git and Node.js
2. `git clone https://github.com/claytillman767/eras-ranker`
3. `cd eras-ranker && npm install`
4. Create `.env` manually — paste in the Genius API token AND all `VITE_FIREBASE_*` keys (find them in Firebase console → Project settings → Your apps)
5. `npm run dev` to start

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
Per-song playback start positions are set in `src/data/spotifyStartTimes.js` — this is a developer-only file, not exposed to users. The key is `"albumId_songIndex"` and the value is milliseconds. `playTrack` in `useSpotify.js` looks up the key automatically; songs without an entry start at 0.

Example:
```js
export const SPOTIFY_START_TIMES = {
  fe_2: 28000,  // Cruel Summer — skip to 0:28
  tv_0: 15000,  // The 1 — skip 15s intro
};
```

Do **not** add a user-facing setting for this. It is intentionally developer-controlled.

**What's built:**
- OAuth connect/disconnect in Settings tab (Pro-gated)
- Autoplay in QuickScore with play/pause mini player
- Developer-controlled per-song start positions (`spotifyStartTimes.js`)
- Album cover art shown in album grid and album hero for connected Pro users

**Remaining Spotify work:**
- Apply for Extended Quota Mode before user count exceeds 25
- Consider adding a progress bar to the mini player
- Playlist creation — let Pro users export their top-rated songs as a Spotify playlist
