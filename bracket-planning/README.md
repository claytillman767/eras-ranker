# Bracket Planning — The Eras Ranker

Editorial planning for the weekly community bracket. This folder is **content, not
app code** — nothing in `src/` imports from it. It exists so the 12-week launch
calendar and each category's song shortlist are captured in one place a future chat
(or a bracket-song-picker skill) can pick up cold.

## How this folder is organized

- `README.md` (this file) — the 12-week calendar, the rules, and current status.
- `categories/` — one file per category as we build it. Each holds the ranked
  top-25 shortlist with verbatim supporting lyrics, BORDERLINE flags, and the
  "songs you'd expect that didn't make it" list. Clay cuts each 25 → 16 and sets
  seeding.

## Source of truth for judging

- Lyrics file: `../taylor_swift_lyrics.txt` (same file the app's parsers use).
- **12 albums, ~193 actual songs.** Raw `### ` count is 212, but that includes 4
  non-songs (liner notes, a prologue, a phone-call track) and 15 TTPD placeholder
  stubs whose real lyrics live in a second TTPD block at the end of the file.
- **Scope:** full catalog — main + deluxe + the full 31-track TTPD Anthology + The
  Life of a Showgirl. No "(From The Vault)" tagged tracks exist in this file, so
  everything present is eligible.

## Hard rules for picking songs (carry into every category)

1. Ground every pick in the lyrics file. Read the words; don't pick from memory.
2. Never include a song not in the file. If one comes to mind but can't be found,
   say so.
3. Never quote a lyric that isn't verbatim in the file.
4. Use each song's exact title and album as written in the file.
5. Consider the whole catalog — deep cuts and Anthology tracks, not just singles.
6. Don't force album variety at the expense of fit.
7. If a category can't be judged from lyrics alone (vocal, melody, catchiness),
   say so and separate lyric-based reasoning from general judgment.

## Process per category

Claude ranks the **top 25** best-fitting songs (fit score 0–100, one-sentence
lyrical reason, 1–2 line verbatim supporting lyric, BORDERLINE flag for mixed fits),
plus a short "songs people might EXPECT here that DON'T make the cut — and why" list.
**Clay picks the final 16 and sets the seeding.** One category per working session so
each goes deep.

Exception: **Best Era** is an album bracket — only 12 albums exist, so it's seeded
directly with no 25→16 cut.

---

## Guiding principle — Launch (Weeks 1–12)

The launch runs as a **weekly event: one new bracket goes live per week.** All 12 are
planned up front so the UI/UX for each can be built ahead of the clock. The goal is
**building a core user base**, not showing lyrical depth. Every launch category must:

1. **Be legible from the title alone** — a casual fan gets it in under a second.
2. **Be stacked with famous songs** — contenders everyone knows, so nobody bounces
   off a bracket full of deep cuts.
3. **Start an argument** — a real fight at the top that makes people vote, disagree,
   and share.
4. **Not depend on on-screen lyrics** — the app's lyric display is currently OFF for
   copyright reasons (`LYRICS_DISPLAY_ENABLED = false` in `src/data/lyricsAccess.js`),
   so any category that only works with lyrics shown is Phase 2, not launch.

Decision rule when in doubt: ship the bracket a fan would screenshot to a group chat;
shelve the one that needs a paragraph to explain.

---

## THE 12-WEEK CALENDAR

Sequencing logic: Weeks 1–4 wide-appeal + famous-song-stacked (conversion). Weeks 5–8
more variety/depth. Weeks 9–12 reward the invested core, build to a finale. Moods
alternate so no two consecutive weeks repeat.

| Wk | Category | Hook | Why here | Mood | Source | Status |
|----|----------|------|----------|------|--------|--------|
| 1 | Best Era | "Pick the album that owns you" | Onboarding vote, zero friction | Loyalty | New (album bracket) | Not started |
| 2 | Best Chorus | "The part you scream at concerts" | Famous-song-stacked, instant | Joy/energy | Existing | Not started |
| 3 | Best Breakup Song | "For when you're driving away and not looking back" | Defiant, radio singles, spite | Spite | New | Not started |
| 4 | Most Romantic Song | "The one you send without context" | Broad appeal, swoony, shareable | Love | Existing | Not started |
| 5 | Best Opening Line | "First impressions that never leave" | Quotable, starts arguments | Craft | Existing | Not started |
| 6 | Saddest Song | "The one you cry to" | The big emotional bracket; plainer reskin of "Most Devastating" placeholder | Heartbreak | Reskin | Not started |
| 7 | Best Lyric | "The line you've thought about getting tattooed" | Peak shareability, mid-run spike | Quotability | New | Not started |
| 8 | Best Bridge | "The 8-bar moment that breaks you every time" | Deep fan-favorite territory | Craft | Existing | Not started |
| 9 | Best Story | "A whole movie in four minutes" | Rewards invested fans, famous anchors + deep cuts | Narrative | New | Not started |
| 10 | Best Closing Line | "The last thing she says that wrecks you" | Craft callback, pairs with Wk 5 | Craft | Existing | Not started |
| 11 | Most Underrated Song | "The ones that deserved more" | Core-fan catnip, deep cuts shine | Discovery | Existing | Not started |
| 12 | Best Vocal Performance | "Where her voice does something impossible" | Finale-worthy "ultimate" debate | Craft | Existing | Not started |

### Calls to sanity-check
- **Wk 6 Saddest Song** uses the plainer word over the "Most Devastating" placeholder
  copy. Same song pool, friendlier title. One-line swap if Clay prefers the original.
- **Wk 12 Best Vocal Performance** can't be judged from lyrics alone (rule 7). When
  built, separate lyric-supported cues (belted bridges, screamed climaxes the words
  point to) from true vocal judgment, which needs audio. Swap out if too messy.
- **Craft clusters late** (Wk 8 Bridge, Wk 10 Closing Line, Wk 12 Vocal) — intentional,
  rewards returning users. Movable if the back half feels heavy.

### Relationship to the app's existing category system
The app already ships rating categories in `src/data/categories.js` (5 default + 8
Pro). Those are the per-song *rating* categories, a different system from these weekly
*bracket* themes. The weekly bracket's category + seed live in the `weeklyBracket`
Firestore state and `src/components/brackets/` — see CLAUDE.md "Bracket Feature". This
planning folder feeds the human decision of what each week's bracket contains; it does
not auto-wire into the app.

---

## PHASE 2 — SHELVED CATEGORIES (revisit when the app is more advanced)

Good categories that need more from the product — most need on-screen lyrics
(`LYRICS_DISPLAY_ENABLED` flipped to `true` once licensing is sorted) or a more
invested user base. Keep, don't delete.

- **Most Hopeful** — "The sunrise after the song that wrecked you." Earned optimism
  (Daylight, clean, Begin Again, New Year's Day). Shelved: "hopeful" is abstract, not
  an instant hook. Pairs well opposite a Saddest/Devastating bracket once users care.
- **Best Spiral** — "Overthinking at 3 a.m., set to music." Inward anxiety (Anti-Hero,
  mirrorball, this is me trying, Down Bad). Shelved: title makes a casual fan decode
  it; only Anti-Hero is a household anchor. Needs lyrics on screen.
- **Most Yearning** — "Wanting what you can't have, out loud." One-sided/doomed longing
  (august, ivy, illicit affairs, Wildest Dreams). Shelved: best contenders skew
  deep-cut. Great Phase 2 once the fanbase lives in folklore/evermore.
- **Best "I Was Wrong"** — "The apology she can't take back." Regret/self-blame (Back
  to December, Afterglow, champagne problems). Shelved: needs lyric nuance to separate
  from a Saddest bracket.

### Considered for launch but cut
- **Saddest Song** is IN (Wk 6) — it replaces the "Most Devastating Song" placeholder
  with the plainer word a casual fan actually votes on. If the original "Most
  Devastating" copy is preferred, it's a one-line swap.
- **Best Kiss-Off** folded into **Best Breakup Song** (Wk 3) — same spite energy, but
  "breakup" is more instantly legible. Revisit "Kiss-Off" as its own bracket in Phase 2
  if Best Breakup overperforms.

---

## STATUS / NEXT STEPS

- Calendar locked. No category shortlists built yet.
- Natural starting points: **Wk 1 (Best Era seeding)** and **Wk 3 (Best Breakup top-25)**.
- Each completed category gets its own file in `categories/`.

## Notes for a future session / bracket-song-picker skill

- A skill could automate the top-25 step: read `../taylor_swift_lyrics.txt`, take a
  category name + theme gist, output the ranked 25 with verbatim lyrics in the format
  above, and write it to `categories/<week>-<slug>.md`. The hard rules and the per-
  category process section above are the spec for that skill.
- Goal metric for launch = shares + repeat votes, not "best curation."
- Revisit the whole Phase 2 list once on-screen lyrics ship.
