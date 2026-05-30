# Bracket Picker — Feedback Ledger

Append-only record of Clay's corrections so a ruling made once is never re-litigated.
The `bracket-picker` subagent **reads this file at the start of every run** (Step 0,
before candidate surfacing) and **appends to it whenever Clay gives a correction.**

## Format (keep it terse — one line per ruling, no transcripts)
- `YYYY-MM-DD | <SONG — Album> | OUT|IN|MOVE|NOTE|SCORE | <≤12-word reason>`
- One line. No prose. The reason is a reminder, not an argument.
- `OUT` = never include in this category. `IN` = belongs here, don't drop it.
  `MOVE` = belongs in a different named category instead. `NOTE` = nuance to apply.
  `SCORE` = a criterion-level adjustment, e.g. `Theme=15` or `Emotional Weight up, ~70`.
- Scoring is by criteria (see the subagent's "Criteria scoring" section): each song gets a
  score per named criterion and the total is their weighted average. A `SCORE` ruling pins
  or nudges ONE criterion; the agent recomputes the total and re-ranks.
- Each category records two special lines under its heading: a `DIMS` line (its criteria +
  weights) and a `GUIDE` line (the one-sentence user-facing guidance shown to voters).
  Changing weights, the criteria set, or the guidance line is a category-level ruling —
  update the relevant line.
- If a later ruling reverses an earlier one, append the new line (don't delete history);
  the most recent line for a given song/criterion wins.

## How the agent uses this
1. **Read before ranking.** Load the relevant category section + the GLOBAL section.
   Apply every ruling silently — don't re-surface a song Clay already ruled OUT, and
   don't re-explain a call he's already made.
2. **Write after a correction.** When Clay corrects a pick ("X isn't a breakup song,"
   "score these wider," "stop bunching at 90"), append the ruling to the right section
   in one line, then confirm in one short sentence. Do this BEFORE re-running the list.
3. **Scope discipline.** A song ruling goes under its category heading and applies ONLY
   to that category. A style/methodology ruling goes under GLOBAL and applies to EVERY
   category. Never let a category-specific call leak into GLOBAL or vice-versa.
4. **Conflict with a rule?** If a ledger ruling contradicts a hard rule in the subagent
   spec (e.g. Clay says include a song that isn't in the lyrics file), flag it rather
   than silently breaking the rule.

---

## GLOBAL — methodology & style (applies to every category)
- 2026-05-25 | scoring | NOTE | Scores are by criteria; total = weighted avg. Don't over-tune; let Clay react.
- 2026-05-25 | wrong-target spite | NOTE | Keep famous off-theme spite IN as low BORDERLINE, don't banish to the "didn't make the cut" list.
- 2026-05-25 | app blurb | NOTE | Each song needs a neutral, copyright-safe user-facing blurb (situation in original words, no lyrics, no judgment adjectives). Ships to app; supporting lyric stays internal.
- 2026-05-25 | criterion scoping | NOTE | Quality/feeling/craft criteria must be scoped to the category theme, not the song overall — off-theme songs lose those points too, not just Theme.
- 2026-05-25 | propagate consequences | NOTE | Act on the FULL downstream effect of an instruction across all files (renumber → rename file + stub old + re-sequence calendar + fix refs), then summarize. Don't stop at the literal edit and ask. Only the Step 1 gate + genuine forks stop for Clay.
- 2026-05-25 | rerun default | NOTE | On a category RERUN, propose the REMATCH model first: keep 1–4 prior champions as anchors (reference past winner/margins for engagement), rotate the middle. Read results.json at Step 0. Sliced/era/deep-cuts/adjacent editions are secondary options.
- 2026-05-25 | overlap rule | NOTE | Overlap NEVER filters scoring — always show the honest full ranked list (hiding songs corrupts Clay's training feedback). Overlap only informs category TIMING/spacing on the calendar. Rematch anchors are a separate deliberate choice.

---

## Best Breakup Song (Wk 1) — "the feeling of a relationship ending"
- 2026-05-25 | DIMS | NOTE | Theme 50% + Emotional Weight 20% + Popularity 30%. (Theme = about a breakup; Emotional Weight = how deep the BREAKUP lands — off-theme emotion doesn't count, tracks down with Theme; Popularity = how well-known/singable.)
- 2026-05-25 | GUIDE | NOTE | "Which song best captures the feeling of a relationship ending — the one you'd put on when it's truly over?"
- 2026-05-25 | Mr. Perfectly Fine — Fearless (vault) | NOTE | Perfect fit but NOT in lyrics file; can't include until added.
- 2026-05-25 | I Knew You Were Trouble. — Red | MOVE | Clay seeds it above I Did Something Bad (editorial rank override).
- 2026-05-25 | Haunted — Speak Now | OUT | A plea not to be left, not a walk-away. Bottom/cut.
- 2026-05-25 | Forever & Always — Fearless | NOTE | Fresh heartbreak, leans Saddest; keep as low BORDERLINE only.
- 2026-05-25 | Bad Blood — 1989 | OUT | Friend betrayal, not a romantic breakup.
- 2026-05-25 | champagne problems — Evermore | OUT | Devastating/regretful breakup → Saddest, not defiant.
- 2026-05-25 | All Too Well — Red | OUT | The breakup is the wound; not walking away unbothered → Saddest.
- 2026-05-25 | thanK you aIMee — TTPD | SCORE | Theme=15 (not about a breakup; "fuck the haters" anthem).
- 2026-05-25 | White Horse — Fearless | SCORE | Theme=80 ("what could have been," not the act of breaking up).
- 2026-05-25 | All You Had To Do Was Stay — 1989 | SCORE | Theme=82 (post-breakup reaction to him wanting back, not the split itself).
- 2026-05-25 | You're Not Sorry — Fearless | SCORE | Theme=85 (still a breakup but "time has gone by," per "all this time I was wasting").
- 2026-05-25 | Dear John — Speak Now | NOTE | Supporting lyric = "Well, I stopped pickin' up and this song is to let you know why" (most theme-direct line).
- 2026-05-25 | Tell Me Why — Fearless | NOTE | Strong theme fit, low Popularity; KEEP IN — deliberate test of how hard fans punish unfamiliar songs.
- 2026-05-25 | Emotional Weight — scope | NOTE | Breakup-specific only: off-theme songs (thanK you aIMee, Mean, LWYMMD) lose their Emo Weight too, not just Theme.

---

## (future categories get their own heading here as they're built)
