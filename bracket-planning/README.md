# Bracket Planning — The Eras Ranker

Editorial planning for the weekly community bracket. This folder is **content, not app
code** — nothing in `src/` imports from it. It exists so the 12-week launch calendar and
each category's song shortlist survive across chat sessions, and so the `bracket-picker`
subagent (`.claude/agents/bracket-picker.md`) has a spec to work from.

## How this folder is organized
- `README.md` (this file) — the 12-week calendar, the per-week status, and the Phase-2
  shelf. This is the WHAT/WHEN (which bracket runs which week).
- `categories/` — one file per category as it's built, named `<NN>-<slug>.md` (NN = week
  number). Each holds the ranked top-25 shortlist with verbatim supporting lyrics,
  BORDERLINE flags, and the "songs you'd expect that didn't make it" list. Clay cuts each
  25 → 16 and sets seeding.
- `results/results.json` — completed-bracket outcomes (winner, finalists, vote margins),
  read on a rerun so the agent can build rematch framing. Populated by an export from
  Firebase (manual at first; see the subagent's "Past bracket results" section). May not
  exist yet.
- `../.claude/agents/bracket-picker.md` — the bracket-picker subagent. This is the HOW,
  and the **single source of truth** for: the golden rule + hard rules for picking songs,
  the lyrics-file parsing notes (the messy-TTPD / ~193-songs details) + dedupe snippet,
  the ranking technique, the catalog-rotation strategy, and the seeding methodology. Those
  used to be duplicated here; they now live ONLY in the subagent so the two can't drift.
  If you need the rules or the strategy, read that file.
- `../.claude/agents/bracket-picker-memory/feedback-ledger.md` — the append-only record of
  Clay's corrections that the subagent reads at the start of every run and writes to on
  every correction.

## Process per category (summary — full spec in the subagent)
For each category the `bracket-picker` subagent: (1) proposes the theme scope + 3–5 scoring
**criteria** with weights + a one-line user guidance sentence in one go and stops for Clay's
approval, then (2) surfaces candidates, (3) scores the catalog on those criteria and returns
the **top 25** ranked by weighted total (per-criterion scores shown, a neutral app blurb per
song, an internal verbatim supporting lyric, BORDERLINE flags, plus a "songs people expect
that DON'T make the cut" list). **Clay reacts with criterion-level feedback, picks the final
16, and sets seeding.** Every correction is logged to the feedback ledger so it's never
re-litigated. One category per working session. Judging is grounded in
`../taylor_swift_lyrics.txt` (12 albums, ~193 real songs).

Exception: **Best Era** is an album bracket — only 12 albums exist, so it's seeded
directly with no 25→16 cut.

---

## Guiding principle — Launch (Weeks 1–12)
The launch runs as a **weekly event: one new bracket goes live per week.** All 12 are
planned up front so the UI/UX for each can be built ahead of the clock. The goal is
**building a core user base**, not showing lyrical depth. Every launch category must:

1. **Be legible from the title alone** — a casual fan gets it in under a second.
2. **Be stacked with famous songs** — contenders everyone knows, so nobody bounces off a
   bracket full of deep cuts.
3. **Start an argument** — a real fight at the top that makes people vote, disagree, share.
4. **Not depend on on-screen lyrics** — the app's lyric display is OFF for copyright
   reasons (`LYRICS_DISPLAY_ENABLED = false` in `src/data/lyricsAccess.js`), so any
   category that only works with lyrics shown is Phase 2, not launch.

Decision rule when in doubt: ship the bracket a fan would screenshot to a group chat;
shelve the one that needs a paragraph to explain.

---

## THE 12-WEEK CALENDAR
Sequencing logic: Weeks 1–4 wide-appeal + famous-song-stacked (conversion). Weeks 5–8 more
variety/depth. Weeks 9–12 reward the invested core, build to a finale. Moods alternate so
no two consecutive weeks repeat. Category-file numbering (`NN-slug.md`) matches the week.

| Wk | Category | Hook | Why here | Mood | Source | Status |
|----|----------|------|----------|------|--------|--------|
| 1 | Best Breakup Song | "For when it's truly over" | Instantly legible, radio-single-stacked, argument-starting — a strong onboarding vote | Heartbreak/spite | New | **Finalized top-25** |
| 2 | Best Chorus | "The part you scream at concerts" | Famous-song-stacked, high-energy, alternates mood away from Wk 1 | Joy/energy | Existing | Not started |
| 3 | Most Romantic Song | "The one you send without context" | Broad appeal, swoony, shareable | Love | Existing | Not started |
| 4 | Best Opening Line | "First impressions that never leave" | Quotable, starts arguments | Craft | Existing | Not started |
| 5 | Saddest Song | "The one you cry to" | The big emotional bracket; plainer reskin of "Most Devastating" placeholder | Heartbreak | Reskin | Not started |
| 6 | Best Lyric | "The line you've thought about getting tattooed" | Peak shareability, mid-run spike | Quotability | New | Not started |
| 7 | Best Bridge | "The 8-bar moment that breaks you every time" | Deep fan-favorite territory | Craft | Existing | Not started |
| 8 | Best Story | "A whole movie in four minutes" | Rewards invested fans, famous anchors + deep cuts | Narrative | New | Not started |
| 9 | Best Closing Line | "The last thing she says that wrecks you" | Craft callback, pairs with Wk 4 | Craft | Existing | Not started |
| 10 | Most Underrated Song | "The ones that deserved more" | Core-fan catnip, deep cuts shine | Discovery | Existing | Not started |
| 11 | *(open — wide-appeal pick, or pull a Phase-2 category forward)* | | Flex slot; alternate mood from neighbours | TBD | TBD | Open |
| 12 | Best Vocal Performance | "Where her voice does something impossible" | Finale-worthy "ultimate" debate | Craft | Existing | Not started |

### Calls to sanity-check
- **Wk 1 Best Breakup Song** opens the launch (moved up from Wk 3). Hook reworded from the
  old "driving away" framing to "for when it's truly over," matching the finalized category
  (it covers the whole feeling of an ending, not just the defiant exit).
- **Wk 5 Saddest Song** uses the plainer word over the "Most Devastating" placeholder
  copy. Same song pool, friendlier title. One-line swap if Clay prefers the original.
- **Wk 11 is open** — freed up when Best Breakup moved to Wk 1 and the rest shifted up.
  Fill with a wide-appeal pick or pull a Phase-2 category forward.
- **Wk 12 Best Vocal Performance** can't be judged from lyrics alone (rule 7). When built,
  separate lyric-supported cues (belted bridges, screamed climaxes the words point to)
  from true vocal judgment, which needs audio. Swap out if too messy.
- **Craft clusters late** (Wk 7 Bridge, Wk 9 Closing Line, Wk 12 Vocal) — intentional,
  rewards returning users. Movable if the back half feels heavy.

---

## CATALOG-ROTATION STRATEGY (summary — full version in the subagent)
The long-game plan for reusing categories ~6 months out without them feeling like leftovers.
Core idea: a bracket is (catalog × lens); the ~193 songs are a fixed pool and the lens (the
question a category asks) is what's renewable. Reruns change the QUESTION, not dig into a
category's weaker songs.
- **Default rerun = the rematch model** (Clay's pick): keep 1–4 prior champions as anchors,
  reference the previous run's winner and vote margins for narrative ("does it still hold
  up?"), rotate the rest of the field. Maximizes returning-user engagement.
- **Secondary mechanics:** era-locked slices, a bracket-of-champions event, deep-cuts
  editions, or an adjacent-category rename (Kiss-Off from Best Breakup's borderlines).
- **Overlap is a SCHEDULING input, never a scoring filter.** It never changes which songs a
  bracket shows or how they score (that would corrupt Clay's training feedback). It only
  helps space high-overlap brackets apart on the calendar.
Full reasoning, the rematch mechanics, and the results-file dependency live in the subagent
(`../.claude/agents/bracket-picker.md`, "Catalog-rotation strategy" + "Past bracket results").

---

## PHASE 2 — SHELVED CATEGORIES (revisit when the app is more advanced)
Good categories that need more from the product — most need on-screen lyrics
(`LYRICS_DISPLAY_ENABLED` flipped to `true` once licensing is sorted) or a more invested
user base. Keep, don't delete.

- **Most Hopeful** — "The sunrise after the song that wrecked you." Earned optimism
  (Daylight, clean, Begin Again, New Year's Day). Shelved: "hopeful" is abstract, not an
  instant hook. Pairs well opposite a Saddest/Devastating bracket once users care.
- **Best Spiral** — "Overthinking at 3 a.m., set to music." Inward anxiety (Anti-Hero,
  mirrorball, this is me trying, Down Bad). Shelved: title makes a casual fan decode it;
  only Anti-Hero is a household anchor. Needs lyrics on screen.
- **Most Yearning** — "Wanting what you can't have, out loud." One-sided/doomed longing
  (august, ivy, illicit affairs, Wildest Dreams). Shelved: best contenders skew deep-cut.
- **Best "I Was Wrong"** — "The apology she can't take back." Regret/self-blame (Back to
  December, Afterglow, champagne problems). Shelved: needs lyric nuance to separate from a
  Saddest bracket.
- **Best Kiss-Off** — folded into Best Breakup (Wk 1) for launch, but it's a strong Phase-2
  rerun in its own right: it's exactly where Best Breakup's borderline spite songs (Mean,
  Better Than Revenge, thanK you aIMee, Look What You Made Me Do, I Did Something Bad) lead.
- **Best Era** — "Pick the album that owns you." An ALBUM bracket (12 albums, no 25→16
  cut), structurally unlike every song week and doesn't use the bracket-picker subagent.
  Moved off Wk 1 to a backup slot — pull it in as a one-off event (e.g. an anniversary or
  a gap week) rather than a numbered launch week. Bracket shape if used: 12 albums, top 4
  seeds get byes, seeds 5–12 play a wildcard round into a clean 8-album quarterfinal.

---

## STATUS / NEXT STEPS
- Calendar: **Best Breakup Song is Week 1** (the launch opener); Best Chorus → Wk 2;
  everything else shifted up. **Wk 11 is the open slot.**
- Rotation strategy settled: rematch model is the default rerun mechanic (full spec in the
  subagent). Overlap is a scheduling input only, never a scoring filter.
- **Wk 1 Best Breakup Song finalized** → `categories/01-best-breakup-song.md` (scored top-25
  with criteria, weights, guidance line, app blurbs). Final 16 + seeding still Clay's call.
- Open decisions: (1) Best Breakup final 16 + seeding; (2) fill the Wk 11 slot.
- Best Era remains on the backup shelf (album bracket, doesn't use the subagent).
- **Future build-out:** a Firebase → `results/results.json` export so reruns can reference
  past results. Manual export first; automate later. Full instructions for Claude Code are
  in the subagent's "For Claude Code: the results export" section.

## Future idea — admin scoring UI (build once the process is solid)
Once the picking process has stabilized across a few categories, build a simple internal
admin tool (just for Clay + Claude, not public) to score weekly categories faster than
editing markdown. Core loop: see each song's per-criterion scores and weighted total →
adjust the criterion weights with sliders and watch totals + ranking re-sort live → view
the song's full lyrics inline while judging. Essentially a visual front-end over what the
bracket-picker subagent + feedback ledger do by hand today. Not a launch dependency —
nice-to-have for speeding up the weekly cadence later.
