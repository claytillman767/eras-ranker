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
  hooks/
    useAuth.js             — Firebase Google sign-in; exposes user, authLoading, signIn, signOut
    useRatings.js          — accepts user param; reads/writes localStorage + Firestore (ratings field)
    usePro.js              — accepts user param; reads/writes localStorage + Firestore (pro field)
    useManualOrder.js      — accepts user param; reads/writes localStorage + Firestore (manualOrder field)
    useAlbumModes.js       — accepts user param; reads/writes localStorage + Firestore (albumModes field)
  components/
    AlbumGrid / AlbumCard  — album picker with score badges
    AlbumModeModal.jsx     — bottom-sheet shown on first album visit; "Vibe Check" (auto-starts QuickScore)
                             or "Sort It Yourself"; choice saved via useAlbumModes
    SongList.jsx           — song list for one album; owns drag, QuickScore, AlbumCompleteCard state
    SongRow.jsx            — drag handle (⠿) + position # + title + score
    RatingPanel.jsx        — full star breakdown per category (currently unused in main flow)
    QuickScore.jsx         — full-screen rapid scoring overlay
                             Flow per song: ShuffleScreen (replay) → star questions
                             LyricScroller shown above stars on the Lyrics category question
                             ShuffleScreen: Play=5★, Skip=1★ for replay; lyrics float in BG
                             Bridge category auto-skipped for songs with no bridge lyrics
    StarRating.jsx         — reusable star input; size='sm'|'md'|'lg'; readonly prop
    Rankings.jsx           — top songs / top albums leaderboard + RankingCard at bottom
    RankingCard.jsx        — shareable card button (Rankings tab); also exports drawCard()
    AlbumCompleteCard.jsx  — full-screen overlay shown once when album becomes fully ranked
    Categories.jsx         — Pro unlock + category toggles + weight sliders + custom creator
    ScoreBar.jsx           — visual score bar used in Rankings
    PaywallCard.jsx        — Pro upgrade prompt (used in Categories)
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
- Pro gates: extra/custom categories, weight sliders, Categories tab paywall UI

## QuickScore flow
- Covers full viewport (`position: fixed, inset: 0, zIndex: 1000`)
- Per song: **ShuffleScreen first** (replay category, Play/Skip buttons + floating lyrics BG),
  then star questions for remaining categories in order
- On Lyrics category: `LyricScroller` appears above stars (scrollable, 110px box)
- On Bridge category: bridge lyrics shown as inline italic quote above stars
- Star labels (calibration phrases) defined in `STAR_LABELS` map inside QuickScore.jsx
- Completion: animated DoneFlash auto-closes after 2s
- Props: `songs`, `albumId`, `albumName`, `albumIcon`, `activeCategories`, `ratings`, `onRate`, `onClose`, `initialSongPos`

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
- **`.env`** contains `GENIUS_API_TOKEN` (Python lyrics scripts only) and all `VITE_FIREBASE_*` keys (loaded by Vite at build time); gitignored, never commit it
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

### Song Previews in Rating Flow (Pro-only)
A small play/pause player with a progress bar appears inside the rating flow for Pro users — "hear it, then rate it." Player should be visible on every rating screen for the current song, autoplay by default, with a toggle in the Categories tab to turn autoplay off.

**Research already done — read before starting:**
- **Spotify:** Removed preview URLs from Taylor Swift's entire catalog. Confirmed via API check — 0/193 songs return a preview URL. Do not pursue Spotify.
- **Deezer:** Has a preview API but terms restrict usage to "strictly private, family-scope" apps. Legal gray area — not recommended.
- **Feed.fm (check first):** Enterprise API at https://www.feed.fm — offers fully licensed clips from major label catalogs with custom timestamp selection. Custom pricing (contact for quote). Most legitimate path forward if the app grows to the point where licensing spend makes sense. Verify Taylor Swift catalog availability before committing.
