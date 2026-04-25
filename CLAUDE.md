# The Eras Ranker — Claude Context

## User
Not a developer. Use plain, simple language — no jargon.

## Stack
React 19 + Vite. All styling is **inline styles only** (no Tailwind classes in JSX).

Dev server:
```
cd "C:\Users\clayt\OneDrive\Desktop\eras-ranker"
npm run dev
```

Build for sharing:
```
npm run build   # outputs dist/ → drag to netlify.com/drop
```

## File map
```
src/
  App.jsx                  — root; 4 tabs: Albums, Rate songs, Rankings, Categories
  data/
    albums.js              — ALBUMS array + SONGS dict (albumId → song name array)
    categories.js          — DEFAULT_CATEGORIES (5) + EXTRA_CATEGORIES (8, Pro-only)
                             "Skip on shuffle?" uses id 'replay'; default weights sum to 100
    bridgeLyrics.js        — DO NOT edit by hand; regenerate: python parse_bridges.py
    snippetLyrics.js       — DO NOT edit by hand; regenerate: python parse_snippets.py
                             Best lyric snippet per song (bridge > chorus > verse 1)
                             Used as floating BG on shuffle screen + scroller on Lyrics screen
  hooks/
    useRatings.js          — localStorage 'eras_ratings'; getCompositeScore returns 0–100 or null
    usePro.js              — isPro, extra/custom categories, per-category weight overrides
                             localStorage keys: eras_is_pro, eras_enabled_extras,
                             eras_custom_categories, eras_category_weights
    useManualOrder.js      — per-album manual order; getManualOrder, moveUp, moveDown, reorder, setOrder
  components/
    AlbumGrid / AlbumCard  — album picker with score badges
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

## AlbumCompleteCard / RankingCard
- AlbumCompleteCard: shown once per session when album transitions incomplete → fully ranked
- RankingCard: 1080×1080 Canvas shareable card; unlock condition: at least one album fully ranked
- `drawCard(ctx, songs)` named export used by both

---

## Future Enhancement Ideas
**DO NOT begin any of these unless the user explicitly instructs you to.**

### User Accounts (Email + Google Sign-In)
Add login/signup with Firebase Authentication (email/password + Google OAuth). On first login, migrate existing localStorage data into the user's Firestore document. Swap the three data hooks (`useRatings`, `usePro`, `useManualOrder`) to read/write Firestore instead of localStorage so ratings and settings follow the user across devices. Pro status moves from a localStorage flag to a trusted database field (Stripe integration still a separate step). Estimated effort: 1–2 weeks part-time.

### Song Previews in Rating Flow (Pro-only)
A small play/pause player with a progress bar appears inside the rating flow for Pro users — "hear it, then rate it." Player should be visible on every rating screen for the current song, autoplay by default, with a toggle in the Categories tab to turn autoplay off.

**Research already done — read before starting:**
- **Spotify:** Removed preview URLs from Taylor Swift's entire catalog. Confirmed via API check — 0/193 songs return a preview URL. Do not pursue Spotify.
- **Deezer:** Has a preview API but terms restrict usage to "strictly private, family-scope" apps. Legal gray area — not recommended.
- **Feed.fm (check first):** Enterprise API at https://www.feed.fm — offers fully licensed clips from major label catalogs with custom timestamp selection. Custom pricing (contact for quote). Most legitimate path forward if the app grows to the point where licensing spend makes sense. Verify Taylor Swift catalog availability before committing.
