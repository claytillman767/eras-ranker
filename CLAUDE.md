# The Eras Ranker — Claude Context

> **Spotify integration removed (v0.16.0, 2026-05-16).** Spotify closed Web
> API access to individual developers — Extended Quota Mode now requires a
> registered organization with ≥250k monthly active users, and development
> mode was cut to 5 manually-whitelisted users. Neither path can serve a
> one-person commercial product, so the entire integration (Web Playback
> SDK, OAuth, album art, autoplay, Play Bridge, the category-times pipeline)
> was deleted. **The full pre-removal code is preserved on GitHub at the
> annotated tag `spotify-integration-v0.15.2`** (commit `76fd0e0`) —
> `git checkout spotify-integration-v0.15.2` or browse it on GitHub if it's
> ever needed for reference. Album art across the app now falls back to the
> emoji + era-color tiles. Pro and the funnel were narrowed accordingly
> (see below). **Do not reintroduce Spotify** unless the product becomes a
> 250k-MAU registered org. If you see surviving Spotify copy anywhere, it's
> stale — flag/remove it.

## User
Not a developer. Use plain, simple language — no jargon.

## App intent
This is a **commercial product**, not a hobby or fan project. Treat every decision — licensing, architecture, legal risk, monetization, scalability — accordingly. Do not assume small scale or low stakes.

## Conversion goals — the three key activities

Every user-facing decision should be evaluated against these three conversion goals, in this order. Each step builds on the previous one — completing one makes the next one a natural offer.

1. **Account login (Google sign-in)** — the backbone. Required for cross-device sync, Pro billing, and identity. Pushed via the dedicated GoogleLoginPromo screen that appears right after the Welcome tour for anyone not yet signed in, with "Sign in with Google" as the primary CTA and "Not now" as the bypass.
2. **The unlock ($3.99 one-time — DECIDED)** — the revenue. The one-time unlock adds the 8 extra rating categories, custom categories, and build-your-own personal brackets. CSV export is FREE for everyone (data portability) — Settings → Data → Download CSV. The community weekly bracket is FREE forever (it feeds the engagement flywheel — never gate it). Pushed softly via the VibeCheckIntro on first Vibe Check and the PaywallCard in Categories. **The model is a ONE-TIME UNLOCK, not a subscription — see "## Revenue & launch model" below for the full decision, tier split, and 7-day launch plan. Do not propose a subscription or gate community bracket voting.**
3. **Sharing to social media** — viral growth. The shareable card unlocks once a user fully ranks at least one album (RankingCard / AlbumCompleteCard).

**Stance the app takes:** the natural path is *Login → Pro → Share*. Any other path is an "avoidance" — always allowed, but never framed as the obvious thing to do. Skip buttons exist, but they sit in secondary positioning (smaller, lower contrast, farther from the primary CTA).

**Canonical first-time flow:** Welcome tour → GoogleLoginPromo → Home. Anonymous users can browse the whole app; signing in is a soft ask, never forced.

## Revenue & launch model (DECIDED — 2026-05-18)

This SUPERSEDES the older "Payment provider — Lemon Squeezy plan" decisions further down (which assumed a subscription). Rationale also in auto-memory `project_monetization_strategy.md`.

**The decision:**
- **One-time unlock, NOT a subscription. $3.99 one time.** Reasons: bursty usage (rank albums over a weekend, then quiet), one-person shop avoiding ongoing-service obligation, terrible sub-$1 recurring economics. Post-Spotify Pro is too thin to sustain a recurring charge. **Do NOT re-propose a subscription.**
- **Tip jar = "buy me a coffee" only** — a goodwill/learning gesture, NOT a revenue strategy. Phase-1 revenue is ≈$0 by design.
- **The community weekly bracket stays FREE forever.** It is the engagement/data flywheel ("Fan's Picks"). Gating participation — even cheaply — strangles the thing that makes it valuable. Only *personal/custom* brackets are paid. (The daily matchup was cut entirely — not at launch.)
- **No pay-what-you-want slider** (floor-anchors to ~$3, contaminates the price signal, adds checkout friction). Flat price + an optional "add a coffee" top-up is the chosen shape.

**Free vs. $3.99 one-time unlock — the tier split:**

| Free forever | Behind the $3.99 unlock |
|---|---|
| All 5 default rating categories, Vibe Check | The 8 extra rating categories |
| Community weekly bracket | Custom categories |
| Rankings, basic shareable card, public profile, CSV export | Build-your-own personal brackets |
| "Buy me a coffee" tip jar | Premium era-themed share cards (planned) |

**Eras DNA / Taste Profile** is the planned headline Phase-2 paid feature. Hard constraint: ZERO ongoing per-user cost (a one-time purchase funds it) — 100% client-side from already-loaded ratings, NO AI/LLM (templated copy keyed to computed buckets), no extra DB reads, Canvas share card. Baseline = a hand-curated, blended "fan consensus" (0–100/song, refreshed 1–2×/yr, labelled as the app's OWN number — NOT Spotify/Billboard branded). Community bracket votes "seed-and-grow" into that baseline over time. NOT in the 7-day launch.

**7-day WEB launch plan (web only — NOT Google Play):**
The Lemon Squeezy billing backend already EXISTS (`api/lemon-webhook.js`, `api/cancel-subscription.js`, `lib/firebase-admin.js`, `lib/lemon-squeezy.js`, `usePro.js` with a live `onSnapshot`) but is shaped for a *subscription*. Launch work is reshaping it to one-time + tiering + repricing, NOT greenfield billing.

1. Webhook: handle `order_created` (grant) + `order_refunded` (revoke); keep existing subscription handling intact (additive, reversible).
2. Reprice every Pro surface to "$3.99 — one-time": `PaywallCard.jsx` (drop the Monthly/Annual PlanPicker), `VibeCheckIntro.jsx`, Settings membership/ProModal. Then run the `pro-funnel-auditor` subagent.
3. Gate personal-bracket creation (`createBracket` in `Brackets.jsx`/`BracketBuilder.jsx`) behind `isPro`; leave the weekly community bracket untouched.
4. Tip-jar surface (external "buy me a coffee" link is simplest; gate behind a config constant so it hides when unset).
5. Legal: privacy policy + terms must cover Lemon Squeezy as payment processor → MATERIAL change → bump `LEGAL_VERSION` + re-accept modal fires.

**Lemon Squeezy — DONE (configured 2026-05-18, LIVE mode).** Set up directly
in production (no test mode — user accepted the risk since the live site has
no real users yet). One-time $3.99 product created. Checkout UUID
`62bcc9ae-0138-42f8-97fe-2c096e666543` → goes in env `VITE_LEMON_SQUEEZY_UNLOCK_UUID`.
Reused the existing webhook (`erasranker.com/api/lemon-webhook`) with
`order_created` + `order_refunded` enabled; the signing secret was **rotated**
(the old one leaked in a setup screenshot) → the new value goes in env
`LEMON_SQUEEZY_WEBHOOK_SECRET`. API key captured → env `LEMON_SQUEEZY_API_KEY`.

**§11 advance-email decision — RESOLVED (Option B, 2026-05-18).** The
subscription→one-time legal change is material, but the 14-day advance email
to signed-in users is **intentionally skipped for THIS change** because there
are **zero existing signed-in users on the prior terms** — nobody is owed
notice. The in-app re-accept modal + the useUserStats grandfather write are
sufficient (new post-deploy users just accept the current version on signup;
no spurious modal). This is a per-change call for a pre-launch product — it
does NOT relax the general rule: future material changes with a real user
base still owe the §11 email.

**Brackets-in-launch — RESOLVED (2026-05-18): brackets are ON.**
`BRACKETS_ENABLED = true`. Community weekly voting is FREE; building
your own personal bracket is gated behind the unlock (BracketLocked screen
in Brackets.jsx). The unlock now advertises THREE perks (8 extra rating
categories, custom categories, custom brackets) — perk copy was updated +
re-audited for consistency across PaywallCard, Settings ProModal +
MembershipSection, VibeCheckIntro, GoogleLoginPromo.

**Env vars — DONE (2026-05-18).** All three set in Vercel
(`VITE_LEMON_SQUEEZY_UNLOCK_UUID`, `LEMON_SQUEEZY_WEBHOOK_SECRET` rotated,
`LEMON_SQUEEZY_API_KEY`); `FIREBASE_SERVICE_ACCOUNT_B64` confirmed present.
`VITE_*` is baked at build → a deploy is still required for it to take
effect. Old `VITE_LEMON_SQUEEZY_VARIANT_ID_MONTHLY/_ANNUAL` are now dead
and can be deleted after the new code deploys.

**SHIPPED — v0.17.0, 2026-05-18.** The user reviewed the Terms/Privacy
locally and approved them on their own review, **explicitly waiving the
earlier lawyer-review hold**. Merged to main (merge `ca909f0`, release
`6d488ab`) and deployed via Vercel. `package.json` → 0.17.0, CHANGELOG
updated. The one-time $3.99 model, brackets, tip jar, and the rewritten
legal text are LIVE on erasranker.com.

**PENDING TODOs (post-v0.17.0 — none block the live site; it is already shipped):**
1. **[Operator] Verify the money flow in production.** Do one real $3.99
   purchase + self-refund: confirm checkout → webhook → Firestore → the UI
   flips to unlocked within a second or two, then refund in the Lemon
   Squeezy dashboard and confirm access is removed. This is the ONLY part
   not yet proven in production. If it fails, check in order: LS webhook
   delivery log → Vercel logs for `/api/lemon-webhook` → the signing secret
   matches the rotated value → `FIREBASE_SERVICE_ACCOUNT_B64` is set.
2. **[Operator] Delete dead Vercel env vars**
   `VITE_LEMON_SQUEEZY_VARIANT_ID_MONTHLY` and `_ANNUAL` — nothing reads
   them anymore.
3. **[DONE — v0.20.0, 2026-05-19] BracketLocked now has a real unlock
   CTA.** Shipped: branded SVG icon (purple-gradient trophy tile, no more
   🏆 emoji), three perks listed explicitly with descriptions, primary
   "Unlock — $3.99 one time" button, "Maybe later" demoted to a text link,
   and sign-in-first routing for signed-out users (mirrors PaywallCard's
   pattern). `unlockPro`/`signIn` are plumbed App.jsx → `Brackets` →
   `BracketLocked`. Same release also gave the bracket matchup card
   tactile polish: press-scale 0.97 with 100ms ease-out, `touch-action:
   manipulation` to kill the 300ms iOS tap delay, "Tap a card to vote"
   upgraded from italic text to a centered purple pill, and the post-vote
   confirmation is quieter (no oversized dashed box) when the
   community-vote backend hasn't been built yet. **Follow-up v0.20.1
   unified Pro perk copy across every upgrade surface** (PaywallCard,
   BracketLocked, Settings ProModal, MembershipSection, VibeCheckIntro,
   GoogleLoginPromo) — same three perks named identically, same price
   line "A one-time $3.99 unlock — yours forever, no subscription.", same
   CTA wording.
4. **[Dev — future, only on explicit instruction] Phase 2 not started:**
   Eras DNA / Taste Profile (the headline ~$6.99 paid feature) + the
   community "Fan's Picks" baseline — see the "Eras DNA" notes above.
5. **§11 advance-email stays waived** for this change (Option B — no prior
   users). No action; recorded so it is not re-flagged as an open gap.

---

## When you change Pro benefits

Inconsistent Pro copy across screens is a credibility hit on a paid product, so any change that adds, removes, renames, reprices, or shifts the scope of a Pro perk needs a cross-surface audit before it ships.

**After implementing a Pro change, invoke the `pro-funnel-auditor` subagent** to verify copy consistency across every Pro-mentioning surface. The subagent owns the canonical file list and the Pro boundary rules — it will return a prioritized fix list, then the main agent makes the edits.

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

When a change touches **any of the three conversion goals**, don't just implement what was asked — proactively consult on funnel impact. Specifically, ask yourself (and surface concerns to the user *before* implementing if any answer is no):

- **Does this nudge the user toward the next conversion step, or away?** A change that helps sign-in but accidentally makes Pro upgrade harder is a net loss.
- **Does the natural path still feel natural after this change?** Each step should be the obvious thing to do. The skip/decline option should feel like opting out, never the default.
- **Are other surfaces in the app still consistent with this change?** Run the `pro-funnel-auditor` subagent after implementation to catch drift. If a paywall is loosened or tightened, every surface that references that boundary needs to align.
- **Is there a sharing moment we're underusing?** Album-complete cards, rankings cards, and the public profile are all viral surfaces. When someone hits a milestone (e.g. first fully-rated album), is the share path obvious?
- **Does this respect the order of the funnel?** Don't ask a user to upgrade Pro before they've signed in; don't ask them to share before they have something worth sharing.

### How to format consultant notes

Every consultant concern must lead with the conversion goal it affects, in **bold ALL CAPS**, so the user can scan the funnel impact at a glance. The three labels:

- **LOGIN FUNNEL** — Google sign-in
- **PRO FUNNEL** — Pro subscription
- **SHARING FUNNEL** — social-media share moments

Format every concern as a short bullet beginning with the impact, then a sentence or two of detail. Examples:

- *"**Major impact: this reduces PRO FUNNEL.** The Welcome tour mentions Pro but doesn't make it feel desirable — it reads as a footnote, not a feature pitch."*
- *"**Minor impact on SHARING FUNNEL.** Album completion is currently the only share trigger. A user who's rated 8 of 13 songs has no obvious way to share progress."*
- *"**Cross-funnel risk (LOGIN + PRO).** A user who taps Unlock Pro before signing in hits a sign-in wall mid-decision, which can lose the upgrade."*

Use **Major impact** when a primary funnel step is meaningfully harder/easier; **Minor impact** for nudges and edge cases; **Cross-funnel risk** when the change affects two or more conversion goals at once.

Mention these considerations in your response *before* writing code, as a brief consultant note. The user is non-technical and explicitly relies on Claude to flag flow problems they might miss. Don't assume — surface the trade-off and let them decide.

## Bracket planning — the `bracket-picker` subagent (content, not app code)
The weekly community bracket has a dedicated editorial subagent. **When Clay wants to
build, score, or rerun a bracket category — or talk about "the bracket calendar,"
"weekly bracket categories," "which songs go in week N," seeding, or rotation — use the
`bracket-picker` subagent at [.claude/agents/bracket-picker.md](.claude/agents/bracket-picker.md).**
That file is the single source of truth for the picking rules, the per-category process
(scope + criteria + user guidance gate → candidate surfacing → criteria scoring → top-25),
the lyrics-file parsing notes, the rotation/rematch strategy, and seeding. Read it first;
if anything elsewhere disagrees with it, it wins.

It is **editorial only — it NEVER touches `src/` or any app code.** It reads/writes only
the planning files and the lyrics source.

Companion files (all under the repo, none built by Vite, nothing in `src/` imports them):
- [.claude/agents/bracket-picker.md](.claude/agents/bracket-picker.md) — the subagent spec (the HOW).
- `.claude/agents/bracket-picker-memory/feedback-ledger.md` — append-only record of Clay's
  corrections; the subagent reads it at the start of every run and writes to it on every
  correction. This is how it improves over time.
- `bracket-planning/README.md` — the 12-week launch calendar + per-week status (the WHAT/WHEN).
- `bracket-planning/categories/<NN>-<slug>.md` — the finalized top-25 per category as each is built.
- `bracket-planning/results/results.json` — completed-bracket outcomes (winner, margins),
  read on a rerun for rematch framing. Populated by a Firebase export that is a documented
  FUTURE build-out (manual first) — see the subagent's "For Claude Code: the results export"
  section. May not exist yet.

Judging is grounded in `taylor_swift_lyrics.txt`. To invoke: ask for a category by name or
week (e.g. "build the Best Breakup bracket" / "do week 2"), and the subagent runs its process.

## Design system — DESIGN_SYSTEM.md is the source of truth

All UI work follows **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** at the repo root — the binding
design framework (lavender brand spine + a per-album era-color layer, Didone display /
grotesque body type, the Editorial-base / Era-Block "rule of one", voice, and the rule of
13). **Read it before building or changing any screen, component, or visual detail**, and
apply its tokens as inline-style values (the app uses inline styles only — no CSS classes).
The era palette has a code home at `src/data/eraColors.js` (`getEra()`, `ERA_TILES`) — use
it rather than re-typing hex values.

- **It's the target state, not a description of today.** The live app is migrating toward
  it. Apply it to anything you build or change; don't repaint untouched screens just to
  conform — that's its own kind of churn.
- **If a needed value isn't specified** (a spacing step, a shadow, a radius), pick a
  sensible one, use it consistently, and record the decision in DESIGN_SYSTEM.md's "Not yet
  specified" section in the same change — that's how the system grows without drifting.
- **Canonical copy is the tracked `DESIGN_SYSTEM.md`.** The gitignored `Claude Design/`
  brand-template file is the design-tool scratchpad; if the look evolves there, fold the
  decisions back into DESIGN_SYSTEM.md so the two never diverge.
- Changing the design language itself (a token, a type rule, the color rhythm) is a
  material design change — update DESIGN_SYSTEM.md and bump its "v" + date at the top as
  part of the same ship.

## Claude Design folder (reference only — not part of the app)
The top-level `Claude Design/` folder holds UI design handoffs produced by a separate AI design tool. It is **not part of the running app** — nothing in `src/` imports from it, and Vite never builds it. The brand-template file in here is the design-tool scratchpad; its **committed, canonical home is [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** (see the section above).

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
                             Passes user/signIn/signOut to Settings
                             First-time flow: Welcome → GoogleLoginPromo (if signed out) → Home
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
    useBrackets.js         — all bracket state: personal brackets + the weekly community bracket
                             localStorage keys: 'eras_brackets', 'eras_weekly_bracket'
                             (The daily matchup was removed entirely in v0.23.0 — not shipping at launch.)
                             weeklyState synced to Firestore field 'weeklyBracket' on users/{uid}
                             WEEKLY (redesigned v0.22.0): state is { weekNumber, categoryId, categoryName,
                               seed, contestants, personalVotes, revealsSeen } — NO rounds/votes/winner. The
                               community's 4-round outcome is DERIVED on the fly from (contestants, seed) via
                               computeCommunityBracket() in weeklySchedule.js; votes don't advance the bracket,
                               they only fill personalVotes (feeds Crowd Match). All fields are Firestore-safe
                               (no nested arrays) so the old JSON.stringify(rounds) workaround is GONE.
                               recordWeeklyVote(round, matchup, winner) logs a personal pick (uses the params);
                               markWeeklyRevealSeen(round) records watched reveals. SYNC GUARD on login: cloud
                               overwrites local only if it has ≥ as many personalVotes (no stale-revert).
                             PERSONAL brackets still use recordWinner + the rounds/currentRound model (unchanged).
    useSettings.js         — app-wide settings; localStorage 'eras_settings' + Firestore sync
                             DEFAULTS: { showCategoryBars: true, confirmQuickScoreExit: true }
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
    AlbumGrid / AlbumCard  — album picker with score badges; AlbumCard renders the
                             emoji + era-color tile (no album art images)
    AlbumModeModal.jsx     — bottom-sheet shown on first album visit; "Vibe Check" (auto-starts QuickScore)
                             or "Sort It Yourself"; choice saved via useAlbumModes
    VibeCheckIntro.jsx     — full-screen overlay shown ONCE on user's first Vibe Check
                             (gated by 'eras_vibecheck_intro_seen'). Introduces the Vibe
                             Check rating flow and shows the Pro perk list as the upsell.
                             CTAs adapt to user state: signed-out / non-Pro → "Unlock Pro"
                             (tapping without sign-in routes through a "Sign in" step);
                             Pro → just "Maybe later". No Spotify content.
    SongList.jsx           — song list for one album; owns drag, QuickScore, AlbumCompleteCard state
    SongRow.jsx            — drag handle (⠿) + position # + title + score
    RatingPanel.jsx        — full star breakdown per category (currently unused in main flow)
    QuickScore.jsx         — full-screen rapid scoring overlay
                             Flow per song: ShuffleScreen (replay) → star questions
                             LyricScroller shown above stars on the Lyrics category question
                             ShuffleScreen: Play=5★, Skip=1★ for replay; lyrics float in BG
                             Bridge category auto-skipped for songs with no bridge lyrics
                             On Bridge category: shows bridge lyrics quote (text only, no playback)
                             Song title shown as plain text at the top of each question
                             Top bar: song counter (center) + Exit button (right); spacer on left
                             Below stars: matching pill buttons — "← Back" (fades when on first step) + "Skip →"
                             Back navigates to previous category (or previous song's last category)
    StarRating.jsx         — reusable star input; size='sm'|'md'|'lg'; readonly prop
    Rankings.jsx           — profile page: user photo + display name + Share control
                             at the top, then top songs and top albums sections,
                             RankingCard at the bottom. Same view a visitor sees on
                             /u/{uid}. (v0.18.0 turned this tab from a leaderboard
                             into a profile page; tap-a-song reveals the score
                             breakdown, v0.19.0.)
    RankingCard.jsx        — shareable card button (Rankings tab); also exports drawCard()
    AlbumCompleteCard.jsx  — full-screen overlay shown once when album becomes fully ranked
    Categories.jsx         — Pro unlock + category toggles + weight sliders + custom creator
    ScoreBar.jsx           — visual score bar used in Rankings
    PaywallCard.jsx        — Pro upgrade prompt (used in Categories)
    Settings.jsx           — Sections: Membership, Public profile, Rating Categories,
                             Preferences, Data, Disclaimer
                             Rating Categories section renders the Categories editor inline
                             Membership: Pro status / plan picker / Unlock Pro / Manage subscription
                             Account info: avatar/name/email/sign-out when logged in
                             Props: settings, updateSetting, isPro, unlockPro, user, signIn, signOut
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
- Pro UI surfaces (Settings ProModal, PaywallCard, VibeCheckIntro, BracketLocked) keep "Unlock Pro"
  tappable; if no user, tapping it routes through a shared "Sign in to continue" step
  (Back arrow → returns). The same three-perk list and price line ship on every surface — when
  changing any of them, run the `pro-funnel-auditor` subagent to catch drift before shipping.
- Extra category weights rescaled so all active categories always sum to 100
- Weight overrides stored per-category in `eras_category_weights`; reset clears that key
- Pro gates: extra categories, custom categories, Categories tab paywall UI
- **Free for everyone:** all 5 default categories, default-category weight sliders, on/off toggles, weight reset banner, CSV export

## QuickScore flow
- Covers full viewport (`position: fixed, inset: 0, zIndex: 1000`)
- Per song: **ShuffleScreen first** (replay category, Play/Skip buttons + floating lyrics BG),
  then star questions for remaining categories in order
- On Lyrics category: `LyricScroller` appears above stars (scrollable, 110px box)
- On Bridge category: bridge lyrics shown as an inline italic quote (text only — no playback)
- Star labels (calibration phrases) defined in `STAR_LABELS` map inside QuickScore.jsx
- Completion: animated DoneFlash auto-closes after 2s
- Props: `songs`, `albumId`, `albumName`, `albumIcon`, `activeCategories`, `ratings`, `onRate`, `onClose`, `initialSongPos`, `isPro`, `confirmExit`, `getCompositeScore`

## Lyrics scripts (Python)
- `parse_bridges.py` → `src/data/bridgeLyrics.js` (bridge sections only)
- `parse_snippets.py` → `src/data/snippetLyrics.js` (best section per song)
- Source file: `taylor_swift_lyrics.txt` (Genius-sourced, sections labelled [Verse], [Chorus], [Bridge] etc.)
- Run scripts from the project root after editing the lyrics file
- (The synced-lyrics / category-times scripts — `find_bridge_times.py`,
  `find_category_times.py`, `fetch_synced_lyrics.py` — were deleted with the
  Spotify integration. `bridgeLyrics.js` / `snippetLyrics.js` remain: they
  feed the text-only lyrics display and the "Best Bridge" bracket filter.)

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
| `spotifyConnected` / `spotifyLastConnectedAt` | DEPRECATED — written by the removed Spotify integration. No longer set on new sessions; safe to ignore. Old docs may still carry stale values. |
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
- Cache name: `eras-ranker-v4` (bump version to force cache clear on all devices after major deploys)
- Navigation requests (`mode === 'navigate'`): **network first**, falls back to cached index.html only if offline
  — this ensures users always get the latest `index.html` after a Vercel deploy without needing hard refresh
- Static assets (same-origin JS/CSS/images): cache first, fall back to network
- Cross-origin requests (Firebase, Google APIs, etc.): not intercepted — go straight to network

## AlbumCompleteCard / RankingCard
- AlbumCompleteCard: shown once per session when album transitions incomplete → fully ranked
- RankingCard: 1080×1080 Canvas shareable card; unlock condition: at least one album fully ranked
- `drawCard(ctx, songs)` named export used by both

## Deployment & version control
- **GitHub:** private repo at `https://github.com/claytillman767/eras-ranker`
- **Vercel:** auto-deploys on every push to `main`; live at `https://eras-ranker.vercel.app`
- **Custom domain:** `https://erasranker.com` — already configured in Vercel and pointing to the same deployment as the `*.vercel.app` URL
- **Local path — TWO PCs, detect which one you're on.** Clay works on this repo from
  two different Windows machines, each with a different clone location and Windows
  username. Both are clones of the same `claytillman767/eras-ranker` remote tracking
  `main` — only the local folder path differs. NEVER hardcode one path; detect which
  machine the current session is on and use that root.

  | PC | Windows user | Repo root |
  |----|--------------|-----------|
  | Desktop (dev box) | `clayt` | `C:\Users\clayt\dev\eras-ranker` (kept out of OneDrive to avoid git conflicts) |
  | Laptop / other | `Clay` | `C:\Users\Clay\Documents\GitHub\eras-ranker` |

  **How to tell which PC you're on:** use the root that actually resolves. With the
  Filesystem connector, `list_allowed_directories` returns the active repo root —
  use whatever it reports. In a Claude Code terminal, the working directory (or
  `%USERNAME%` / `$env:USERNAME` → `clayt` vs `Clay`) tells you. Rule of thumb: if
  `C:\Users\clayt\...` doesn't exist you're on the laptop (`C:\Users\Clay\Documents\GitHub\...`),
  and vice-versa. Every relative path inside the repo (`src/`, `bracket-planning/`,
  `taylor_swift_lyrics.txt`, etc.) is identical on both — only the root prefix changes.
  The `cd` line in the "## Stack" dev-server snippet shows the desktop path as an
  example; swap in the laptop root when on that machine.
- **`.env`** contains (all gitignored, never commit):
  - `GENIUS_API_TOKEN` — Python lyrics scripts only, not needed at runtime
  - `VITE_FIREBASE_*` — Firebase config keys
- **`.claude/settings.local.json`** is gitignored — do not commit it
- **Vercel build settings:** Framework = Vite, Build = `npm run build`, Output = `dist`, Root Directory = (blank/repo root)
- **Vercel environment variables:** must mirror all `VITE_*` values from `.env`. **Note:** the now-removed `VITE_BETA_PASSWORD` and `VITE_SPOTIFY_CLIENT_ID` env vars can be deleted from Vercel any time — nothing reads them anymore (Spotify integration removed in v0.16.0).

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
9. **Delete the branch once it's merged** — the moment a feature
   branch is in `main`, delete it both places so branches don't pile
   up: `git branch -d <branch>` (local) and `git push origin --delete
   <branch>` (remote). Skip this in sandbox/web mode — the user
   deletes the branch when they merge the PR on GitHub (the "Delete
   branch" button right there). A branch left undeleted after merge is
   the #1 cause of clutter; see "### Branch hygiene" below.

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

### Branch hygiene — keep only `main` plus live work
Branches should be deleted as soon as they merge (step 9 above). They
still accumulate over time because **Claude Code web/cloud sessions
auto-create `claude/*` branches** that nobody cleans up, and because
older sessions didn't delete after merging. If Clay ever says "the
branches are messy" or asks for a branch review/cleanup, this is the
drill — it's a safe, repeatable chore, not a research project.

**First, separate shipped work from real pending work.** A branch that
is already merged into `main` contains nothing new — it's pure clutter,
safe to delete without reading it. Only *unmerged* branches can hold
work worth recovering, and even those are usually stale (the app moves
fast; QuickScore alone was fully rewritten between v0.8 and v0.32).

```bash
git fetch --all --prune
# Already in main → safe to delete, no review needed:
git branch -r --merged origin/main | grep -v 'origin/HEAD' | grep -v 'origin/main$'
# NOT in main → the only branches worth actually looking at:
git branch -r --no-merged origin/main | grep -v 'origin/HEAD'
```

For each *unmerged* branch, don't trust the name — check whether its
work already landed in `main` by another path (features get redesigned
past recognition, or re-shipped from a fresh branch). Compare the real
diff against today's files before assuming there's anything to save:
`git log origin/main..origin/<branch>` and
`git diff $(git merge-base origin/main origin/<branch>)..origin/<branch>`.

**Full prune (delete every branch except `main`)** — what Clay means by
"full tidy":
```bash
# Local: delete all but main
git branch --format='%(refname:short)' | grep -v '^main$' | xargs -r git branch -D
# Remote: delete all but main — build the list, THEN push once
git branch -r | grep -v -- '->' | grep -vE '^\s*origin/main$' \
  | sed -E 's#^\s*origin/##' | grep -vE '^(origin|HEAD)$' \
  | xargs -r git push origin --delete
```
**Gotcha (learned the hard way):** `git push origin --delete` is
all-or-nothing — one bad ref aborts the whole push and deletes nothing.
The usual bad ref is the remote `HEAD` pointer sneaking in as a bare
`origin`, which is why the remote command above explicitly strips
`'->'`, `origin`, and `HEAD` before pushing. Always eyeball the list
before the push; confirm with `git branch -a` after.

Deleting branches never touches code on `main` — the live app is
unaffected. Treat a full prune as low-stakes, but since it's an
outward-facing action, do the safe split first and tell Clay which
branches (if any) hold unmerged work before wiping everything.

The reason: keeping CLAUDE.md in sync with reality across sessions
matters more than a confirmation step, and forgetting to ship a
CLAUDE.md edit means future Claude reads stale instructions. Default
is ship.

### Working on a second computer
1. Install Git and Node.js
2. `git clone https://github.com/claytillman767/eras-ranker`
3. `cd eras-ranker && npm install`
4. Create `.env` manually — paste in the Genius API token AND all `VITE_FIREBASE_*` keys (find them in Firebase console → Project settings → Your apps)
5. `npm run dev` to start

---

## Category Picks Pipeline — REMOVED (v0.16.0)

This whole pipeline (`fetch_synced_lyrics.py`, `find_category_times.py`,
`syncedLyricsFull.json`, `categoryTimesAudit.json`, `spotifyCategoryTimes.js`,
`src/dev/AuditReview.jsx`, and the dev-only audit Vite middleware) existed to
feed Spotify per-moment playback. It also exported a `CATEGORY_FIT_SCORES`
dataset intended for future bracket-eligibility filtering, but that was never
wired to a live consumer. All of it was deleted with the Spotify integration.
The full code is preserved at the git tag `spotify-integration-v0.15.2` if a
category-fit-score feature is ever revived without Spotify.

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


### Phantom-slider preview when rebalancing category weights — NOT BUILT

**Where:** the weight sliders in the Categories editor (rendered from
[src/components/Categories.jsx](src/components/Categories.jsx), reachable via
**Settings → Rating Categories → Edit categories & weights**). All active
category weights are forced to sum to 100, so when the user drags one
slider, the other sliders silently auto-rebalance under the hood. Today
that auto-rebalance is invisible during the drag — the other sliders only
snap to their new positions after the user releases. From the user's
perspective it can look like nothing else is happening.

**The idea:** while a slider is being dragged, render *phantom* thumbs on
every other active-category slider at their projected new positions, in a
lighter purple than the real thumbs. The phantoms move live as the user
drags. On release (mouseup / touchend), the dragged slider commits, the
phantoms vanish, and the other sliders snap to the position the phantoms
were just showing — so the rebalance reads as "the preview I was watching
just became real," not "everything jumped at once."

**Why it matters:** the rebalance is the most useful and least obvious
thing the weight editor does — surfacing it during the drag turns an
invisible mechanic into an "oh, that's clever" moment, and helps users
trust that the score system is doing what they expect.

**Implementation sketch (not built yet):**
- On `pointerdown` on a slider, capture the snapshot of all current
  weights. Render the live drag as `localWeight` (component state),
  while the *real* `categoryWeights` stays unchanged.
- Compute the projected rebalance on every drag frame (using the same
  rescale function that runs today on `setCategoryWeight`) and pass the
  result down so each non-dragged slider can render a phantom thumb at
  the projected value.
- Style: phantom track uses the same purple at ~30–40% opacity, phantom
  thumb is an outlined circle (or fill at #c4b5fd) — clearly secondary
  to the real thumb. Respect `prefers-reduced-motion`: when reduced
  motion is on, skip the phantom animation and just snap on release.
- On `pointerup` / `touchend` / `pointercancel`, call `setCategoryWeight`
  with the final dragged value (which triggers the existing rebalance),
  clear `localWeight`, and remove the phantoms.

**Edge cases to handle:** dragging a slider all the way to 0 or 100 (other
sliders absorb / disappear), dragging while a category is also being
toggled off in the same session (phantoms must reflect the new active
set), keyboard adjustment via arrow keys (probably skip phantoms there —
no drag gesture to anchor them to).


### Shareable custom brackets — NOT BUILT

**Where:** custom personal brackets are built and run from
[src/components/brackets/Brackets.jsx](src/components/brackets/Brackets.jsx) +
`BracketBuilder.jsx`, with state in
[src/hooks/useBrackets.js](src/hooks/useBrackets.js) (currently local +
Firestore field `brackets` on `users/{uid}` — strictly per-user). Creating a
custom bracket is gated behind the $3.99 unlock (BracketLocked screen).

**The idea:** once a Pro user builds a custom bracket, give them a
"Share this bracket" link. Anyone who opens the link — Pro, free,
signed-out — can play through and vote on that exact bracket. Their picks
flow back to the bracket's creator as a "your friends' results" view.
Tournament play, not just spectating: each visitor runs their own copy of
the bracket end-to-end.

**Why it matters — SHARING FUNNEL: major positive.** Today brackets only
live on the device of the person who built them. Letting them be shared
turns a single-player feature into a viral one: every Pro creator is a
potential top-of-funnel for new users who land on a friend's bracket.
This also pairs naturally with the existing public profile feature — a
bracket link could live on the creator's `/u/{uid}` page.

**The trade-off the user already accepted:** non-Pro and signed-out users
get to *play* a custom bracket without paying. Creation is still
Pro-gated, and the participant is engaging with the app at a meaningful
level (clicking through a multi-round tournament) — net positive for
top-of-funnel. Do not gate participation, even cheaply.

**Implementation sketch (not built yet):**
- New Firestore collection `sharedBrackets/{shortId}` holding the
  bracket definition (categories, contestants, rounds, creator uid,
  display name, createdAt). Generate `shortId` as a 6–8 char base62
  slug — short enough to share casually.
- New route `/b/{shortId}` (hand-rolled in App.jsx like `/u/{uid}`).
  Loads the bracket from `sharedBrackets`, runs it through the existing
  bracket-playback UI, and stores the visitor's picks locally
  (localStorage key keyed on the shortId so a returning visitor sees
  their previous picks).
- Aggregation: a `sharedBracketResults/{shortId}/votes/{voteId}` subcollection
  with one doc per visitor pick. Anonymous writes allowed (rule
  similar to feedback). Creator sees an aggregated "X friends played,
  here's the consensus winner" panel in their bracket view.
- Sharing UX: a "Share this bracket" button next to a completed
  personal bracket → Web Share API (or copy-link fallback) with the
  `erasranker.com/b/{shortId}` URL.
- Visitor onboarding: when a signed-out visitor finishes a shared
  bracket, surface a soft "build your own — sign in to make one" CTA
  on the results screen.

**Open questions before building:**
1. Should the creator see *which* friends played, or just aggregate
   results? (Lean aggregate-only for v1 — sidesteps identity / spam.)
2. Rate limiting on `sharedBrackets` creation per uid to avoid abuse?
3. Anonymous vote stuffing — a single visitor playing the bracket 50
   times to skew the consensus. Possible mitigations: localStorage
   token tied to votes; rule that requires a `clientId` field present
   on each vote and rejects duplicate `(shortId, clientId, matchupId)`
   combos. Not perfect, but raises the cost of stuffing.
4. Pricing impact on PRO FUNNEL: does letting free users play a
   custom bracket reduce upgrade intent? Hypothesis: no — playing
   someone else's bracket teases the feature; the "I want to make my
   own" upgrade ask gets stronger after the visitor finishes.


### ~~User Accounts~~ ✅ BUILT
Google sign-in is live. Ratings, Pro settings, manual order, and album modes all sync to Firestore. See the **Authentication & Firestore** section above for full details.
Remaining future work in this area: real billing — see "Payment provider — Lemon Squeezy plan" below.

### Payment provider — Lemon Squeezy (SUPERSEDED by "## Revenue & launch model" above)

**STATUS (2026-05-18): the billing backend is BUILT** — the "deferred / DO NOT begin" framing this section used to carry is stale. It is subscription-shaped and being converted to a **one-time $3.99 unlock** per the Revenue & launch model section near the top of this file. The infra detail below (HMAC verification, Firebase Admin SDK wiring, env vars, test-mode steps) is still accurate and useful — but ignore the subscription / $4.99 *decisions*; the model is now a one-time unlock.

**Provider chosen:** Lemon Squeezy. We evaluated Stripe vs Lemon Squeezy and picked LS because it's a Merchant of Record (handles VAT, EU OSS, US state sales tax for us — Stripe is not), the ~0.7% fee premium is a fair trade for not maintaining tax registrations across 30+ jurisdictions as a one-person shop, and migrating LS → Stripe later is possible if we ever outgrow it.

**Decisions (UPDATED 2026-05-18 — "## Revenue & launch model" above is authoritative):**
- ~~Launch as subscription~~ → **REVERSED. One-time unlock, $3.99.** The old subscription rationale assumed the richer Spotify-era Pro, which no longer exists.
- Annual / free-trial / plan-rename — not applicable to a one-time unlock.
- Provider is still Lemon Squeezy (the Merchant-of-Record reasoning above still holds for one-time orders).

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

### ~~Song Previews in Rating Flow~~ — REMOVED (v0.16.0)
Built on the Spotify Web Playback SDK, then removed when Spotify closed Web
API access to individual developers. Code preserved at git tag
`spotify-integration-v0.15.2`. There is no in-app song playback anymore;
do not pitch it. Reviving it would require Spotify reopening developer
access (it hasn't) or a different audio provider entirely.

### ~~Synchronized Lyrics Display~~ — moot for now
This idea depended on reading playback position from the Spotify SDK, which
no longer exists. The licensing concern (lrclib = no commercial license,
Musixmatch = $199/mo) is unchanged, but there is no player to sync against,
so this is parked indefinitely unless a new audio provider is added.

### Bracket Feature — Architecture Notes

#### Weekly bracket data model (redesigned v0.22.0 — paced multi-day Option A)
- State shape: `{ weekNumber, categoryId, categoryName, seed, contestants, personalVotes, revealsSeen }`
  - `contestants` — 16 songs in round-1 order. `personalVotes` — `{ "${round}_${matchup}": "albumId_songIndex" }`, every pick the user casts. `revealsSeen` — `{ [roundIndex]: true }`.
- The COMMUNITY's 4-round outcome is **not stored** — it's recomputed deterministically from `(contestants, seed)` via `computeCommunityBracket()` in `src/constants/weeklySchedule.js`. Votes never change who advances (Option A: everyone sees the same survivors); they only feed the personal ledger + Crowd Match (`crowdMatch()`).
- Round gating (which round is open/closed, countdowns, the Mon→Sun cadence) lives in `weeklySchedule.js`: `ROUND_UNLOCK_DAY`, `currentRoundIndex`, `isRoundOpen`, `isChampionRevealed`, `nextDrop`. The unlock interval is a config dial (tighten to daily later).
- UI: `src/components/brackets/weekly/WeeklyExperience.jsx` is a full-screen overlay (launched from the bracket Landing) that runs a 5-screen state machine — `WeeklyHome` (hero), `WeeklyVote`, `WeeklyReveal` (+ hand-off), `WeeklyLocked`, `WeeklyChampion` (animated replay + a Canvas `drawWeeklyChampionCard` 1080×1080 share image). Shared primitives: `WeeklyParts.jsx`; era tiles via `getEra()`/`ERA_TILES` in `eraColors.js`.
- localStorage key: `eras_weekly_bracket`; Firestore field: `weeklyBracket`. All fields are Firestore-safe (no nested arrays).
- `WinnerReveal.jsx` and `WeeklyBracket.jsx` are now **dead/unused** (the old one-sitting flow); personal brackets are unchanged. The daily matchup (`DailyMatchup.jsx`, `eras_daily_bracket`, `recordDailyVote`) was removed entirely in v0.23.0 — not shipping at launch.

#### The old weekly "advancement bug" — no longer applicable
The pre-redesign model stored `rounds` (an array-of-arrays) and `JSON.stringify`-serialized it to dodge Firestore's nested-array rejection; a synchronous `setDoc` throw could abort `recordWeeklyVote` and reload the same matchup. The redesigned model stores no nested arrays at all, so that class of bug can't recur. (Kept for history.)

### Bracket Feature — Remaining Work

#### Community bracket vote tallies (Firestore counters) — the Phase B go-live blocker
**Current state:** The redesigned weekly bracket (v0.22.0) derives its community split + survivors deterministically from the week seed via `communityPercent()` / `computeCommunityBracket()` in `weeklySchedule.js` (the winning side varies per matchup but is the SAME for every user). The legacy `getCommunityVotePercent` in `bracketCategories.js` is now unused (it backed the removed daily matchup + the dead `WeeklyBracket.jsx` — safe to delete in a later cleanup). Either way there is **no real aggregation** — so until this is built, every user sees the same outcome. This is the real blocker before the weekly bracket can go live for a real audience.

**What needs to be built:**
- A shared Firestore collection (e.g. `bracketVotes/{weekNumber}_r{round}_m{matchup}`) with atomic counter increments for song1 and song2
- Security rules: allow increment writes but not reads-then-writes to prevent stuffing
- In `useBrackets.js`, replace the simulated percent with a real Firestore read after each vote
- The weekly bracket winner should be derived from the Firestore tallies, not the seeded random

**Do not build this until the bracket design is finalized** — schema and security rules are easy to add once the UX is stable.

#### ~~Spotify playback in bracket matchup cards~~ — moot (Spotify removed v0.16.0)
The matchup cards are now text-only (era colors + lyric snippets) by design.
There is no audio anywhere in the app. Skip this idea unless a non-Spotify
audio provider is ever added.

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

**Implementation sketch (not built yet):**
- Vercel Cron job runs once daily, hits `/api/daily-health-check`.
- The endpoint scans Firestore for the conditions above and emails a single summary via Resend / Postmark (same provider as the user notification system — share the account).
- Empty days send a one-line "all clear" so silence ≠ "the cron is broken."

### Google Play Store launch plan (planned — NOT BUILT, DO NOT begin without explicit user instruction)

**Goal:** publish The Eras Ranker on the Google Play Store as an Android app, without rewriting the codebase. The existing PWA is the foundation; the Android "app" is a thin wrapper around `erasranker.com`.

**Approach chosen: Trusted Web Activity (TWA) wrapper.** Generated with Bubblewrap or PWABuilder. The Android binary is a one-screen shell that opens the live PWA fullscreen with no browser chrome. Every web deploy to Vercel updates the Android app instantly — no Play Store resubmission needed for code changes. This is the same approach Google uses for its own PWA-backed Play Store apps and works because the app is already a compliant PWA (manifest.json + service worker + HTTPS + responsive design).

**Why not React Native or a full rewrite:** ~2 months of work to rebuild what already exists, no real user-facing benefit, doubles ongoing maintenance. (The old "only worth it if the TWA can't host Spotify playback" caveat is moot — there is no Spotify playback anymore.)

#### One big decision that must be settled before any building starts

**Decision 1 — How to handle Pro subscriptions inside the Android app. PRO FUNNEL: major impact.**

Google Play requires that digital goods sold inside an Android app use **Google Play Billing**, and Google takes **15% (first $1M/yr per developer) to 30%** of every sale. This rule applies even though Lemon Squeezy is the back-end on web. You cannot just open a Lemon Squeezy checkout from inside the Android app for Pro upgrades — Google will reject the app.

Three real options, none of them locked in yet:
- **A. Dual billing (recommended).** Pro sold on web stays Lemon Squeezy (you keep ~95%). Pro sold inside the Android app uses Google Play Billing (you keep ~85%). The same Firebase user can buy on either side and Pro syncs across both. Adds ~1 week of dev work: a Google Play Developer API webhook into a new Vercel function, plus a billing-source flag on the Firestore user doc so cancellations are routed to the right provider.
- **B. View-only on Android.** No in-app Pro upgrade flow at all. Users who want Pro have to open `erasranker.com` in a browser. Google now permits this (after Epic v. Google and the EU DMA), but the UX is meaningfully worse and conversions will drop. Zero billing-tax exposure, zero Play Billing dev work.
- **C. Don't ship to Play Store yet.** Let users install the PWA directly from Chrome ("Add to Home Screen"). No Google cut, no review, but no Play Store discovery channel either.

Recommendation in the conversation was **Option A** for a paid product, but the user has not formally chosen. Settle this before Phase 2.

**~~Decision 2 — Does Spotify Web Playback SDK work inside the TWA wrapper?~~ — RESOLVED MOOT (Spotify removed v0.16.0).** There is no Spotify playback to test in the wrapper anymore. This was previously called the biggest unknown in the Android plan; it no longer exists, which simplifies the launch (no audio/DRM-in-webview risk). Everything below that referenced "Spotify playback in the wrapper," "autoplay + Play Bridge testing," or a "fallback to Spotify's native Android SDK" can be ignored.

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
- Data Safety form — declare every piece of data collected (Google account, ratings, payment info via Play Billing, etc.) and where it goes. MUST match the privacy policy exactly — Google rejects on mismatches.
- Category: Music & Audio.

**Phase 4 — Closed test + production review (~2–3 weeks of mostly waiting).**
- Google Play Developer account: $25 one-time fee.
- **Mandatory closed test:** Google now requires new personal developer accounts to run a closed test with **at least 12 testers for 14 consecutive days** before being eligible to publish to production. Pull your tester list from the manually-comped Pro users in `users/{uid}` (the same people who currently have `proSource: 'beta'` or similar). This wait is non-negotiable — do not plan a launch date that assumes you can skip it.
- Submit for production review. First review usually 3–7 days. Common rejection reasons: privacy policy ↔ Data Safety mismatch, missing content rating, trademark concerns, undisclosed in-app purchases. Each rejection cycle adds another 3–7 days.

#### Realistic total timeline

About **7–8 weeks from kickoff to live in the Play Store** at a steady part-time pace, assuming no major Phase 1 testing surprises and one rejection cycle. Add ~1 week if Decision 1 = Option A (Play Billing integration). (The old "+2–3 weeks if Spotify playback needs a native Android SDK fallback" risk is gone — Spotify removed in v0.16.0.)

#### Risks and unknowns to revisit before starting

1. ~~**Spotify playback in the wrapper.**~~ No longer a risk — Spotify removed in v0.16.0. This used to be the single biggest unknown in the Android plan; its removal is a net simplification.
2. **The Play Billing tax is a real revenue hit on Android-originated Pro subs.** Decision 1 above. Pricing may need a second look — e.g. raising the Android-side price slightly to absorb the tax, or making the annual tier cheaper than monthly on Android specifically to push users toward the lower-fee bucket.
3. **Trademark review.** Probably fine, not guaranteed.
4. **14-day closed test wait is hard-locked** for new developer accounts.
5. **iOS / Apple App Store is a much bigger lift if pursued later.** Apple has historically been stricter on fan apps AND on billing — they don't allow the external-checkout workaround that Google now permits. The Android path does NOT translate cleanly to iOS; a separate plan will be needed.
6. **Account deletion on Android.** Google Play requires apps with sign-in to provide in-app account deletion (already built — see `DeleteAccountModal`) AND a web-accessible deletion path linked from the Play Store listing. Settings → Delete my account satisfies the in-app side; the Play Store listing will need a public URL like `erasranker.com/delete-account` that explains the flow and links to it.

#### Conversion-funnel implications

- **LOGIN FUNNEL:** Play Store install gives a small lift — users who installed an app are measurably more likely to sign in than users who hit a website. The Welcome → GoogleLoginPromo → Home flow stays unchanged.
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
2. Run their wizard with the current data inventory (Google identity fields, ratings, brackets, Pro state, public profile data, launch waitlist, planned Lemon Squeezy fields). NOTE: the v0.3.0 inventory listed "Spotify tokens stored locally" — that no longer applies, Spotify was removed in v0.16.0; do not include it.
3. Add hand-written paragraphs in iubenda's custom-text fields:
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
