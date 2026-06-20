# The Eras Ranker — Claude Design Prompts

> Generated 2026-06-20 from a multi-agent gap analysis of the app against [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
> Goal: paste these into claude.ai/design to bring every screen up to the brand framework and make the app launch-ready.

## How to use this

1. **Paste the Master Brand Prompt (section 0) into Claude Design first** — it establishes the whole design system (colors, type, components, the color rhythm, voice).
2. Then paste any **per-screen prompt** to design or refine that screen. Each one is self-contained (it repeats a short brand block), so you can work in any order.
3. Read **"Decisions for you"** before generating the screens it lists — those are the few spots where the new design would clash with something already shipped, so you pick the direction.
4. Each prompt sits in its own copy block — grab the whole block and paste.

---

## 0. Master brand prompt — paste this first

```
# Brand Setup — The Eras Ranker

Use this once to establish the design system. Everything you generate after this should obey it unless I explicitly override it for a single screen.

## What we're building
**The Eras Ranker** is a song-ranking app for Taylor Swift fans ("Swifties"). People rate songs, build rankings, vote in a weekly community bracket, and share results. It's a real commercial product, mobile-first.

## Hard constraints (never break these)
- **Mobile-first.** Design for a ~390px-wide phone screen first. Everything must work one-handed, thumb-reachable, no horizontal scroll. Desktop is a graceful widening, never the primary canvas.
- **Inline-style / soft-rounded aesthetic.** Output should read as hand-set inline styles: soft shadows, generously rounded corners, no hard edges, no dense "enterprise dashboard" chrome.
- **NEVER use real album artwork or any artist/photo imagery.** This is a legal and design rule. Albums and songs are represented ONLY by an **emoji + an era color tile**. If you'd normally reach for a cover image, use the era's emoji on its color instead.
- **No lyric text in designs.** Don't build features that depend on showing song lyrics.

## The feeling — *Editorial, era-aware, a little playful*
Think a tasteful music magazine that happens to know all the inside jokes. A calm lavender "spine" holds the whole app together, and content about a specific album borrows that album's color world on top. High-contrast serif headlines do the talking; a clean grotesque handles everything functional. Warm, fan-forward, never corporate. And tuck a quiet hint for the fans who look closely.

Three words to keep in mind on every screen: **editorial, era-aware, a little playful.**

---

## Color — the brand spine (one purple holds it together)

A single purple anchors all the chrome — logo, tabs, primary buttons, links. Neutrals are warmed slightly toward purple so white cards never feel clinical on the lavender wash.

| Token | Hex | Use |
|---|---|---|
| **Accent** | `#7c3aed` | Chrome, primary actions, links, active states |
| **Accent deep** | `#5b21b6` | Pressed states, display serif ink, gradient ends |
| **Page wash** | `#f1ecfb` | App background (the lavender everything sits on) |
| **Ink** | `#211d34` | Primary text |
| **Muted** | `#8b85a3` | Secondary text, captions, placeholders |

White (`#ffffff`) cards float on the Page wash. Keep the accent a single hue across all chrome — don't drift it screen to screen.

## Color — the 12-era system (every album wears its own world)

Twelve palettes, one per album. Whenever a specific song or album appears, it wears its era. Each era gives you:
- a **Primary** — accents, scores, progress fills, the emoji tile in Editorial mode
- a **Deep** — text laid on a pale tint of that era, and the dark end of gradients
- a **Gradient** — for full-bleed "Era Block" moments

| Era | Year | Icon | Primary | Deep | Gradient (light → dark) |
|---|---|---|---|---|---|
| Taylor Swift (Debut) | 2006 | 🎀 | `#16a89a` | `#0d6e64` | `#5eead4 → #0d9488` |
| Fearless | 2008 | ✨ | `#d99a1c` | `#92670c` | `#fde68a → #eab308` |
| Speak Now | 2010 | 💜 | `#8b5cf6` | `#6620d9` | `#c4b5fd → #7c3aed` |
| Red | 2012 | ❤️ | `#dc2626` | `#991b1b` | `#f87171 → #b91c1c` |
| 1989 | 2014 | 🌊 | `#1f9fe0` | `#0a6699` | `#7dd3fc → #0284c7` |
| Reputation | 2017 | 🐍 | `#3f3f46` | `#1c1c20` | `#52525b → #18181b` |
| Lover | 2019 | 🌈 | `#e0469a` | `#b21c6b` | `#f9a8d4 → #db2777` |
| Folklore | 2020 | 🌲 | `#5f6b66` | `#363f3a` | `#9aa5a0 → #475550` |
| Evermore | 2020 | 🍂 | `#c2671f` | `#8a3d0f` | `#fbbf6f → #b45309` |
| Midnights | 2022 | 🌙 | `#4f46e5` | `#312e81` | `#818cf8 → #3730a3` |
| TTPD (The Tortured Poets Department) | 2024 | 📖 | `#78716c` | `#44403c` | `#b8b1a6 → #44403c` |
| The Life of a Showgirl | 2026 | 🎭 | `#ef7611` | `#bc4708` | `#fdba74 → #ea580c` |

*(These are the canonical brand values. The app's working tile code carries minor hue variations on a few eras — match this table for design; treat the code as the technical fallback.)*

---

## Typography — *Didone display, grotesque body*

**Display face · Libre Caslon Text** — a high-contrast serif for moments that matter (heroes, headlines, big numerals, winner reveals). Acceptable swaps if Libre Caslon Text is unavailable: Bodoni Moda, DM Serif Display.

| Role | Size |
|---|---|
| Hero | 64 |
| Headline | 33 |
| Title | 22 |

**UI & body face · Hanken Grotesk** — a clean grotesque for everything functional (body copy, labels, buttons, captions).

| Role | Size | Notes |
|---|---|---|
| Body | 15 | default reading text |
| Label | 13 | buttons, list rows, chips |
| Eyebrow | 11 | UPPERCASE, `.16em` letter-spacing — section kickers |
| Tiny | 9.5 | fine print, timestamps |

Rule of thumb: if it's a *statement* (a hero, a score, a name, a result), set it in the serif. If it's a *function* (a button, a field, a row, a hint), set it in the grotesque.

---

## Components — *Soft cards, round everything*

- **Buttons.**
  - *Primary* — filled `Accent` (`#7c3aed`), white label, soft drop shadow, fully or near-fully rounded.
  - *Soft* — an accent-wash fill (a pale lavender tint of the accent) with `Accent deep` (`#5b21b6`) text. Used for secondary actions.
  - Pressed state uses `Accent deep`.
- **Pills & chips** — *fully rounded* (pill-shaped). Selected chip = filled accent with light text; unselected = outlined or muted-fill.
- **Progress & countdown** — a **thin, rounded** bar with a fill that runs **`Accent` → `Accent deep`** (or the active era's `Primary → Deep` on era surfaces). Countdowns render as small white cards with the serif numerals.
- **Cards** — white, soft-rounded corners, soft shadow, sitting on the lavender Page wash.
- **The era album tile — two skins:**
  - *Editorial tile* — a **white card** with the era color used only on the small emoji tile, the score, and the progress fill. Calm. This is the default everywhere.
  - *Era Block tile* — the **full era gradient** background with light text. A "moment," used sparingly (see rhythm below).
- **Motion** — tappable cards press-scale to `0.97` over ~100ms ease-out, with `touch-action: manipulation` to kill the iOS tap delay. Respect `prefers-reduced-motion` (skip non-essential animation).

---

## The color rhythm — *Editorial base, era moments*

This is the most important rule in the whole system. **Color punctuates; it never wallpapers.**

- **Default · Editorial Lavender — calm by default.** The app lives here: white cards on the lavender wash, era color used only as accents (emoji tile, score, progress fill). Every high-frequency, content-dense surface stays editorial — album grids, song lists, settings, forms, anything long-scrolling.
- **Moment · Era Block — drama where it counts.** The full era gradient with light text, reserved for the hero/spotlight/reveal of a screen: the album you're actively ranking, a bracket matchup card, a winner or results reveal, a celebratory empty state or milestone.

**✓ Use an Era Block for:** the hero of a screen · the era being actively ranked · a bracket matchup card · a winner / results reveal · a celebratory milestone or empty state.

**✗ Keep it editorial for:** album grids & song lists · settings & forms · anything with more than two colored blocks competing · long scrolling content.

**The rule of one.** At most **one (occasionally two)** Era Blocks visible at a time. If a third block wants to be colored, the screen is too loud — pull it back to accents.

**Contrast is non-negotiable.** On pale eras (Fearless, 1989, Showgirl) lay the era's **Deep** color as the text on the tint. On dark eras (Reputation, Folklore, Midnights, TTPD) use **white** text. Always check the text legibility before shipping a block.

---

## Voice & tone — *Talk like a Swiftie, not a dashboard*

Playful, fan-forward, warm, never corporate. Numbers stay friendly. Hints, not spoilers.

| Trait | Say this | Not this |
|---|---|---|
| Playful, fan-forward | "Locked in. Results drop Wednesday." · "Fully ranked 👑" · "it had to be you" | "Submission recorded." |
| Warm, never corporate | "We'll ping you when round 1 results are ready." | "Notification scheduled." |
| Friendly numbers | "12,408 Swifties voted" · "7-wk streak" · "110 of 219 rated" | "Total participants: 12,408" |
| Hints, not spoilers | a wink that rewards the curious without blocking anyone | over-explaining the easter egg |

Empty states, loading states, and errors all get this voice too — a quiet empty grid says something like "Nothing ranked yet — pick an album to start," not "No data."

---

## Hidden hints — *The rule of 13*

Taylor's number, 13, is the house easter egg. Tuck a quiet **13** or a small lyric-flavored wink somewhere discoverable but never in the way (e.g. tapping the logo tile thirteen times triggers a soft lavender sparkle burst). Keep eggs of this flavor — discoverable, harmless, delightful. One known egg per release; let fans trade the secret.

---

## Accessibility baseline
- Tap targets at least ~44px.
- Body text legible at the sizes above on a phone; never rely on color alone to carry meaning (pair it with a label or icon).
- Maintain readable contrast per the era contrast rule.
- Honor `prefers-reduced-motion`.

When something isn't specified here, pick a sensible value, use it consistently, and tell me what you chose. Lean on a simple 4px spacing rhythm (4 / 8 / 12 / 16 / 24 / 32) unless a screen needs otherwise.
```

---

## Per-screen prompts

### 1. App shell & global navigation — lavender brand spine, branded nav, polished chrome states

**What changes & why:**
- The whole app background changes from plain white to soft lavender (#f1ecfb) with white cards/header floating on top — so the chrome finally looks like the brand instead of clinical white-on-white.
- All purple accents unify on the single brand purple (#7c3aed) — active tab, the sign-in button, the avatar ring — replacing the lighter mismatched purple used today.
- Real brand fonts load for the first time: an elegant serif for the 'The Eras Ranker' wordmark (now sitting in a purple-gradient logo tile) and a clean modern font for everything else.
- The logo tile gets the hidden 13-tap sparkle easter egg, a fan-delight touch the brand calls for.
- The 5 tabs become a proper branded navigation bar with bigger, easier-to-tap targets and a clear active state that screen readers can announce.
- Polished missing states: a warm, on-brand empty state with a 'Browse albums' button, a small loading spinner instead of a blank gap in the header, and a friendlier crash screen — all in the Swiftie voice.
- Accessibility basics added across the chrome: keyboard focus outlines and ~44px tap targets.

**⚠️ Decide first:**
- Tab bar position is unsettled. The framework only requires the tabs carry the lavender brand spine — it does NOT say top vs bottom. Today the tabs are a text strip at the TOP, yet the layout reserves 80px of empty space at the BOTTOM (as if a bottom bar was once planned). You need to decide: keep tabs at the top (and remove the orphaned bottom space), or move to a fixed bottom navigation bar (more app-like on mobile). The prompt asks for a branded bar but leaves the position to you — tell the design tool which you want.
- A few launch-readiness rules (keyboard focus style, ~44px minimum tap targets, screen-reader 'selected tab' labels) are not yet written into DESIGN_SYSTEM.md — its 'Not yet specified' section leaves them open. The prompt picks sensible values (2px purple focus ring, 44px targets, aria-current on the active tab). If you're happy with these, they should be added to DESIGN_SYSTEM.md so every future screen reuses the same choices.

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## Screen: App shell & global navigation
Design the persistent chrome that wraps every screen: the **top header** (logo tile + wordmark, auth control), the **5-tab global navigation** (Home, Albums, Brackets, Rankings, Settings), and the global **loading / error / empty** states. This is the most-seen surface in the app — it must embody the lavender brand spine. It touches the **LOGIN funnel** (the sign-in control is the entry point) so keep that CTA visible and inviting, never the weakest element.

**Current state (what to fix):** the shell is all cool-grey system-sans on a pure-white page. No lavender wash, no serif, wordmark is a tiny plain label with no logo tile, tabs are a thin grey text-underline strip, and loading/empty/error states are bare. Repaint it to the framework below.

**Target — Editorial Lavender base, one Era-Block moment max:**
The whole shell lives in Editorial Lavender. **Page background = `#f1ecfb`** (the wash); **header and cards = white (`#ffffff`)** sitting on that wash so chrome reads as floating panels, not white-on-white. Center the app in a `max-width: ~700px` column; on wider viewports the lavender wash fills the gutters. Do **not** paint a full Era Block into the shell itself — the shell is calm chrome; Era-Block moments belong to the screens it wraps.

**Top header (white bar on the wash):**
- Left: a small soft-rounded **logo note-tile** filled with the **accent gradient (`#7c3aed → #5b21b6`)**, beside the wordmark **"The Eras Ranker" set in Libre Caslon Text at ~Title 22, color Ink `#211d34`**. This is the one place serif identity lives in the chrome. Never set the wordmark in the sans; never recolor the tile to an era color.
- **Easter egg:** tapping the logo tile **13 times** fires a quiet lavender sparkle burst (respect `prefers-reduced-motion` — skip the animation). This is the house rule-of-13 hint.
- Right: the auth control. Signed-out → a **soft button** (lavender-wash fill `#f1ecfb`, deep-accent `#5b21b6` text) reading **"Sign in"** with the Google G glyph, label **≥13px** so the LOGIN CTA isn't the tiniest control. Signed-in → a circular avatar with a **`#7c3aed` ring**; tapping opens a dropdown card (name, email, "Sign out"). While auth is resolving, show a small **16px spinner** in the slot (role="status", aria-label="Loading"), never a blank gap.

**Global navigation (5 tabs):** a branded nav bar carrying the lavender spine. Each tab = emoji/icon + Label-13 text. **Active tab uses accent `#7c3aed`** (color + a rounded indicator); inactive = Muted `#8b85a3`. Make active state legible beyond color alone (heavier weight + indicator) for color-blind users.

## Specific changes
1. **Wash + cards:** page `#f1ecfb`, header/cards `#ffffff` — restore card-on-wash separation.
2. **One accent purple:** all chrome accents (active tab, avatar ring, sign-in, focus) use **`#7c3aed`**, pressed states **`#5b21b6`** — drop the lighter `#a855f7`.
3. **Warm the text:** primary text Ink `#211d34`, secondary Muted `#8b85a3` (not cool greys).
4. **Load the faces:** Libre Caslon Text (display) + Hanken Grotesk (UI/body) with a system fallback so there's no flash of invisible text.
5. **Wordmark → serif + logo tile** with the 13-tap sparkle egg.
6. **Tabs:** branded bar, `#7c3aed` active, **~44px tap targets**, `aria-current="page"` on the active tab and tab semantics so screen readers announce the selected tab.
7. **Sign-in CTA:** soft-button styling, ≥13px label, keep the Google glyph.

## Launch-readiness
- **Empty state** (a tab with nothing yet): a friendly emoji, on-voice line, and a real **primary button** that routes to Albums — e.g. *"Nothing ranked yet. Pick an album and let's find out who's really #1 👑"* → **"Browse albums"**. Editorial styling, not an Era Block.
- **Loading:** reuse the 16px accessible spinner in the auth slot and anywhere the shell waits.
- **Error / crash screen:** Libre Caslon headline, warm reassurance, and a **primary button** (filled `#7c3aed`, soft shadow) — e.g. headline *"Well, this is awkward."* / body *"Something glitched on our end. Let's try that again."* / button **"Reload"**. Use a gentle emoji, not an alarm.
- **Mobile-first & responsive:** designed for ~390px; the centered column floats on lavender on wider screens.
- **Accessibility:** every interactive control (sign-in, avatar, dropdown, tabs, reload) gets a visible **focus-visible ring (2px `#7c3aed`, 2px offset)**. On any era tint, use the era's `deep` text on pale eras and white on dark eras (note: shell chrome itself stays editorial — this rule guards any era-colored accent you introduce).
- **Tap-press feedback:** scale 0.97 / 100ms ease-out + `touch-action: manipulation` on tappable chrome; respect `prefers-reduced-motion`.
```

---

### 2. Onboarding & Login Funnel — Welcome tour + Google sign-in promo (LOGIN funnel)

**What changes & why:**
- The two intro screens currently open in the plain phone system font — the prompt switches them to the brand's serif headlines (Libre Caslon Text) and clean body font (Hanken Grotesk), which is the single biggest first-impression upgrade.
- The sign-in screen's hero becomes one bold purple 'moment' with a serif headline, instead of two flat grey tiles, so the most important screen for getting people signed in finally feels designed.
- The 'Sign in with Google' button gets real feedback: a loading state ('Taking you to Google…'), a guard so it can't be double-tapped, and a friendly retry message if it fails — so nobody gets stuck on conversion goal #1.
- Everything moves onto the brand's lavender background, and the off-brand amber/pink/fuchsia sparkle colors are re-tuned to the purple palette.
- Accessibility fixes: the legal/footer text is darkened so it's actually readable, small dots and links get bigger tap zones, buttons get a visible keyboard outline, and heavy animations pause for people who prefer reduced motion.
- Copy is rewritten in the warm, Swiftie voice (e.g. 'Take your rankings everywhere.') instead of dry product-description language, while keeping the cross-device benefit crystal clear.

**⚠️ Decide first:**
- Brand accent hue mismatch (app-wide decision): the live app's main purple is the lighter #a855f7 (the --brand token in src/index.css), but the framework's primary accent is the deeper #7c3aed. The prompt designs to the framework (#7c3aed). You must decide whether to (a) retune the global --brand token toward #7c3aed app-wide, or (b) officially record #a855f7 as the accepted live value in DESIGN_SYSTEM.md. Do not let only these two screens use #7c3aed — that would split the purple across the app.
- Page-background color (app-wide decision): the live app background is pure white (--bg: #ffffff), but the framework calls for a lavender wash (#f1ecfb). The prompt designs on lavender. Decide whether to shift the global background to lavender or formally keep white as an override — again an app-wide call, not a per-screen one.
- Returning signed-in users: the login-promo screen auto-skips for anyone already signed in. There's a small reliability risk that this could fire more than once. Worth confirming we want a 'fires exactly once' guard added when this is built (low-risk, just flagging).

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## The screens

Design TWO full-screen mobile overlays (~390px) that play back-to-back as the app's first run: **(1) the Welcome tour** — a swipeable carousel of intro slides that pitches the app, then **(2) the Google login promo** — the dedicated sign-in ask shown right after. Both serve the **LOGIN funnel** (Google sign-in is conversion goal #1). The flow is Welcome tour → Login promo → Home; signing in is a *soft* ask, never forced, with a clearly secondary "skip/not now" path.

**Current state (what to replace):** both screens already exist but render in the default OS sans font with a near-white background, the login hero is two flat grey emoji tiles, and there are no loading/error states. We are bringing them up to the brand framework.

## Target design

**Both screens** sit on the **lavender Editorial base** (`#f1ecfb` wash). Set a soft gentle top-to-bottom gradient from a slightly lighter lavender to the page wash — keep it lavender, no cool-blue end. Use **Libre Caslon Text** for every headline/slide title and any big numeral, **Hanken Grotesk** for body, labels, and buttons. Load both via Google Fonts.

**Welcome tour (screen 1):** a horizontally swipeable carousel, 3–5 slides, each a white soft-rounded card (radius 14) floating on the lavender wash. Each slide pairs a Libre Caslon **Title (22)** headline with a Hanken Grotesk body line and a small illustrative element built from **emoji + era-color tiles** (e.g. a mini album tile using an era `primary`/gradient, a tiny ranking row, a progress bar). At most **one Era Block** per slide. Bottom of the screen: a row of progress dots (active dot is an elongated accent pill), a **primary accent "Next" button** (filled `#7c3aed`, soft shadow, white label) and a **"Skip" text link** in muted in the top corner — clearly secondary. Final slide's button reads "Let's go" and advances to screen 2. Settle ONE button radius and ONE card radius and use them everywhere.

**Google login promo (screen 2):** This is the LOGIN-defining screen — elevate its **hero into the single Era-Block moment**. Build a centered hero that shows the cross-device sync idea (a phone + laptop motif) sitting inside ONE accent-gradient block (`#7c3aed → #5b21b6`) with a Libre Caslon **Headline (33)** in white on top — e.g. "Take your rankings everywhere." Keep the emoji tiles, no real device photos. Below the hero, an **Editorial white card** holds: a one-line Hanken Grotesk benefit, the **primary CTA = the Google-branded "Sign in with Google" button** (white surface, real Google G logo, full-width, soft shadow — the most prominent control), then a clearly smaller, lower-contrast **"Not now" soft button**, then the legal consent line and the "sign in any time" footer note.

## Specific changes (directives)

1. **Typography:** Set all slide titles and the login headline in Libre Caslon Text (Title 22 / Headline 33). Set subtitles, body, labels, and buttons in Hanken Grotesk. Load both fonts.
2. **Hero as a moment:** Give the login screen exactly ONE accent-gradient Era-Block hero with the headline in serif white on top. Keep the Welcome slides Editorial (white cards), one Era Block max per slide.
3. **Loading state on sign-in (launch-blocking):** On tapping "Sign in with Google," disable the button, show a quiet spinner, and swap the label to a warm line like **"Taking you to Google…"** so the redirect handoff has feedback. Guard against double-taps (fire once).
4. **Error state:** If sign-in fails, show an inline friendly retry message under the button (e.g. **"Hmm, that didn't go through. Try again?"**) and re-enable the button — never a dead end.
5. **Decorative palette:** Any sparkle/shimmer/confetti decoration must use the brand spine (accent `#7c3aed` + soft lavenders), with at most one warm accent — no off-system amber/pink/fuchsia.

## Launch-readiness

- **States:** design the sign-in button's **default / pressed / loading / disabled / error** states, plus a returning-user "already signed in, continuing…" flash.
- **Mobile-first:** target ~390px; everything stacks vertically, full-width buttons, comfortable thumb reach. Content max-width ~480px, centered.
- **Contrast (non-negotiable):** body/legal/footer text must clear WCAG AA (4.5:1) — darken muted greys until the legal consent line is comfortably readable at small sizes. On any era tint, follow the rule: pale eras use their `deep` text, dark eras use white.
- **Focus + tap targets:** every button, dot, and link gets a visible keyboard focus ring (2px accent outline, offset). Progress dots stay visually small but get a ≥44×44px invisible hit area; "Skip" and "Not now" get full ≥44px tap targets.
- **Motion:** entrance pops and any twinkle/carousel auto-advance must honor `prefers-reduced-motion` — degrade to a static frame / instant appearance.

## Voice — write the copy in the warm Swiftie tone

Replace flat utility copy with fan-forward lines that still make the sync benefit obvious:
- Login headline: **"Take your rankings everywhere."**
- Login body: **"Sign in so your ratings, brackets, and your hard-won top 10 follow you to every screen — phone, tablet, laptop. No account? Your picks only live on this one browser."**
- Loading: **"Taking you to Google…"** · Error: **"Hmm, that didn't go through. Try again?"**
- Welcome slide voice examples: **"Rank every era, your way."** · **"Vibe-check an album in 2 minutes."** · **"Bracket battles, every week — free forever."**

Keep emoji + era-color tiles only (no album art), mobile-first, soft-rounded inline-style aesthetic throughout.
```

---

### 3. Home tab — progress dashboard, redesigned to the Eras Ranker framework

**What changes & why:**
- The Home tab currently renders in the phone's default system font. The redesign loads the brand's real fonts — an editorial serif (Libre Caslon Text) for the big numbers and headings, a clean sans (Hanken Grotesk) for everything else — so it finally looks like the brand.
- The big progress percentage becomes the screen's one 'moment': a full era-colored hero block (in the colors of whatever album you're working on, or brand purple on day one) instead of a thin grey number on white.
- All the purple progress bars get corrected to the official brand purple gradient, and album tiles get their real, recognizable era colors instead of the washed-out near-white pastels they use today.
- Brand-new users get a warm welcome hero and a single clear 'Begin' button instead of a clinical '0%', and we add proper loading skeletons and a friendly error message.
- Taps that today are plain text ('Try', 'See all', each album row) become real buttons that keyboard users can reach, with bigger tap targets and a focus outline — basic accessibility for launch.
- The microcopy gets warmer and more Swiftie — e.g. 'Save your rankings so they follow you everywhere' instead of 'Your ratings aren't backed up', plus a hidden 13 wink for the fans.

**⚠️ Decide first:**
- Era tile colors: the binding DESIGN_SYSTEM.md table and the actual color file in the code (src/constants/eraColors.js) disagree on several eras (e.g. Speak Now, Red, 1989). The prompt uses the CODE values (the bright ERA_TILES the bracket screens already use) so Home matches what's already shipped. If you'd rather Home match the doc's published table instead, say so and I'll switch the hexes.
- Fonts (Libre Caslon Text + Hanken Grotesk) are not actually loaded anywhere in the app yet — there's no font link in the code. The design prompt assumes they exist. To make the real app match the design, those two web fonts will need to be loaded globally as a small follow-up code change; flagging so it isn't a surprise.
- The hero becomes the one full-color 'Era Block' moment and the daily-pick strip drops to a plain white/lavender card to honor the 'one bold block per screen' rule. If you prefer the daily strip to keep its purple wash, tell me and I'll allow a second, quieter accent surface.

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## Screen: HOME tab (the first thing the app opens to)

A progress-first dashboard. Purpose: show how far the user is through rating Taylor's catalog and give them the single most obvious next tap. It serves the **LOGIN funnel** (a soft "save your ratings" nudge for signed-out users) and feeds the **SHARING funnel** indirectly (completing albums unlocks share cards elsewhere). Top to bottom it has: an optional signed-out backup nudge, a **catalog-progress hero**, a **Continue card**, an optional **daily-pick strip**, and an **album checklist**.

Design **three states**: (A) first-run / empty (0 songs rated), (B) returning user mid-progress, (C) loading skeleton. Plus an error fallback line.

### Target layout & where color lives
Everything sits on the **lavender page wash `#f1ecfb`** as **white soft-rounded editorial cards** (radius ~14–16, soft shadow). Era color appears ONLY as emoji tiles, score numerals, and progress fills — except for **exactly ONE Era-Block moment**: the hero.

**1. Hero (the ONE Era Block).** Make the catalog-progress hero a full-bleed era-gradient block (radius ~18), light text, the single saturated moment on the tab.
- Returning user: wear the gradient of the era the user is currently working through. First-run: use the **brand accent→deep gradient `#7c3aed → #5b21b6`** (a welcome block, not a bare "0%").
- Eyebrow "CATALOG PROGRESS" (Eyebrow 11, UPPERCASE, `.16em` tracking, Hanken Grotesk, on-block tint).
- The big percent in **Libre Caslon Text at ~64px, normal/medium weight** (NOT a 200 hairline) with the "%" in the same face, smaller. Below it Body 15 friendly count: "110 of 219 rated."
- A thin rounded progress bar with **accent→deep gradient `#7c3aed → #5b21b6`** fill.
- Returning users get fully-rounded pills below: "🔥 7-wk streak", "48% to go." First-run hides the pills and instead the block carries a warm welcome line + points down at the first-song CTA.
- **Contrast:** light text on dark eras (Reputation, Folklore, Midnights), each era's `deep` text on pale eras (Fearless, 1989). Verify the on-block value.

**2. Continue card** (white editorial). Era emoji tile (era color, ~56px, radius 10) + Eyebrow "CONTINUE" + song title (Title-ish, Hanken Grotesk 15 medium) + "{album} · next: {category}" muted. A real round **play button (≥44px)**, filled accent, soft shadow. First-run swaps this for a "Rate your first song" card with a ✨ tile and a filled-accent **Begin** button.

**3. Daily-pick strip** (white or faint lavender-wash card). 🎯 + "Today's pick: {song}" + album name + a real **"Try" button** (≥44px tap area), not a text span.

**4. Album checklist** (white editorial list). Header row: Eyebrow "ALBUMS" + a real **"See all 12" button**. Each row = era emoji tile (40px, radius 8, **era color**) + album name (Body) + score/progress (era `primary` or accent) + a thin **era-color** progress bar. Completed albums get a checkmark badge — use the era's `ink`/`deep` for the badge so it stays legible on pale eras.

### Specific changes (apply all)
- **Fonts:** set everything in **Hanken Grotesk**; all headings/heroes/big numerals in **Libre Caslon Text**.
- **Hero numeral:** Libre Caslon Text ~64px normal weight (drop the 84px/weight-200 hairline).
- **All progress fills:** accent→deep `#7c3aed → #5b21b6` (kill the old `#a855f7 → #7e22ce` and flat `#a855f7aa`); album-row bars may instead use that album's era `primary`.
- **Era tiles:** the emoji tile must wear a **recognizable era color** (saturated era `primary` or era tile color), NOT a near-white pastel. Use these era tile/deep/ink values: Taylor Swift `#8fb0d6/#3c5980/ink#102338` · Fearless `#e8bd45/#8a6610/ink#3a2900` · Speak Now `#9258d6/#56268a/ink#fff` · Red `#d83a3f/#6b0f12/ink#ffe1e3` · 1989 `#5cc0ef/#0b6ea0/ink#06304a` · Reputation `#44464a/#1a1a1d/ink#e8eaec` · Lover `#f48bc4/#b03578/ink#4a0a31` · Folklore `#828995/#3a414c/ink#f7f8fa` · Evermore `#c66a2a/#6e3410/ink#ffeede` · Midnights `#3f5a8e/#182a48/ink#e4e8ff` · TTPD `#b3a89a/#57514a/ink#2a241d` · Showgirl `#b13bb6/#5e0f63/ink#ffe6ff`.
- **Eyebrows:** all uppercase eyebrows track to `.16em` (unify the inconsistent 0.1/0.08/0.06em).
- **Background:** lavender wash `#f1ecfb` behind white cards; warm ink `#211d34`, muted `#8b85a3`.

### Launch-readiness
- **Empty/first-run state:** the welcome Era Block + a single clear "Begin" CTA; no clinical "0%."
- **Loading state:** lavender skeleton blocks (rounded, faint shimmer) for hero + cards.
- **Error state:** if data can't load, a calm one-liner card: "Hmm — we couldn't load your rankings. Pull to refresh."
- **Mobile-first** ~390px single column, comfortable 16px gutters.
- **Accessibility:** every tappable element is a real focusable `<button>` with a visible focus ring (2px `#7c3aed`) and ≥44px tap height — convert the "Try", "See all", and album rows from div/span onClick into buttons. `touch-action: manipulation`, press-scale 0.97/100ms, respect `prefers-reduced-motion`.
- **Voice — use lines like:** hero first-run "Let's find your forever favorites." · backup nudge "Save your rankings so they follow you everywhere." (warmer than "aren't backed up") · daily pick "Today's wildcard: {song} — give it a vibe." · completed album "Fully ranked 👑." · pills "7-wk streak", "48% to go." Tuck a quiet **13** somewhere for the fans.

Honor hard constraints: emoji + era color tiles only (no real album art), mobile-first, the inline-style soft-rounded look.
```

---

### 4. Albums grid, hero & mode sheet — launch-ready redesign

**What changes & why:**
- Load the two brand fonts (an elegant serif for headlines/scores, a clean sans for everything else) and use the serif on the big moments — the grid title, the album name, and the score. Right now the screens use the plain system font.
- Put the Albums grid on the soft lavender app background and set the brand purple to the exact framework shade (#7c3aed) so the white cards read as cards on a wash, matching every other screen.
- Add a warm first-run state for brand-new users (a friendly one-liner instead of a bare 0/12) plus a quick loading skeleton, so the very first screen a new user sees feels inviting, not empty.
- Make the album mode sheet wear its album's era color (a small gradient emoji tile at the top) so it stops feeling disconnected from the colorful hero shown one tap later.
- Fix accessibility: the tiny 'Back' buttons need full-size tap areas, every tappable thing needs a visible keyboard focus outline, and text on the colored tiles must stay readable (dark text on pale eras, white on dark eras).
- Add the standard tactile press animation to the album tiles and the two ranking-mode cards so the grid feels alive on tap, matching the rest of the app.
- Standardize the small uppercase 'eyebrow' labels (section headers, stat labels) to one consistent letter-spacing so they read as a deliberate brand element.

**⚠️ Decide first:**
- The Albums screens reportedly already shipped as v0.29.0. This prompt assumes the framework now wins over the older 'Claude Design/design_handoff_albums_redesign' handoff — please confirm you want these screens re-polished to the new framework rather than left as shipped. (Two earlier-rejected handoff ideas — per-category QuickScore color and a DOM-based share card — are intentionally NOT reintroduced here.)
- APP-WIDE TOKEN DECISION: two framework gaps here can't be fixed for Albums alone without changing the whole app's look. (1) The live brand fill/border is #a855f7 but the framework accent is #7c3aed; (2) the grid sits on pure white but the framework wants the #f1ecfb lavender wash, and the neutral text colors are cool grey rather than the framework's warmed purple-grey. Adopting these shifts EVERY screen's chrome and background, not just Albums. Do you want to make that global token change now (recommended for consistency) or keep Albums matching today's app and defer the global retune?

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## What to design

Three connected mobile screens for **The Eras Ranker** (~390px wide, inline-style soft-rounded look):

1. **Albums grid** — the home of all 12 Taylor Swift albums; the main "pick an era to rank" launchpad. This is the **LOGIN→PRO funnel entry** — a new user's first real screen, so the empty/first-run state matters.
2. **Album hero** — the top of a single album's page (its one earned Era-Block moment).
3. **Album mode sheet** — a bottom sheet shown on first visit to an album, asking "How do you want to rank this?" with two choices: **Vibe Check** (quick rapid scoring, recommended) and **Sort It Yourself** (manual drag-order).

Each album is identified ONLY by an **emoji + era-color tile** — never real artwork. Use these 12 eras (`tile → deep` gradient, `ink` = text color laid on the tile):
🎀 Debut `#8fb0d6→#3c5980` ink `#102338` · ✨ Fearless `#e8bd45→#8a6610` ink `#3a2900` · 💜 Speak Now `#9258d6→#56268a` ink `#fff` · ❤️ Red `#d83a3f→#6b0f12` ink `#ffe1e3` · 🌊 1989 `#5cc0ef→#0b6ea0` ink `#06304a` · 🐍 Reputation `#44464a→#1a1a1d` ink `#e8eaec` · 🌈 Lover `#f48bc4→#b03578` ink `#4a0a31` · 🌲 Folklore `#828995→#3a414c` ink `#f7f8fa` · 🍂 Evermore `#c66a2a→#6e3410` ink `#ffeede` · 🌙 Midnights `#3f5a8e→#182a48` ink `#e4e8ff` · 📖 TTPD `#b3a89a→#57514a` ink `#2a241d` · 🎭 Showgirl `#b13bb6→#5e0f63` ink `#ffe6ff`.

## Layout & where Era Blocks are earned

**Albums grid (Editorial — NO Era Blocks):** page sits on the `#f1ecfb` wash. Serif display title "Albums" (Headline ~30 Libre Caslon Text). A warm one-line intro in Hanken Grotesk Muted. A **stat strip** as a white card: two numerals (eras ranked / songs scored) in the display serif, labels as eyebrows (11px, UPPERCASE, `.16em` tracking, Muted). Then a 2-column grid of **album tiles**: each a white rounded card carrying the emoji on a small era-gradient tile, the album name in Hanken Grotesk, a thin accent→deep progress bar, and a score badge in era `primary` (or a "NEW" pill if unrated). The grid stays calm — era color appears ONLY as the emoji tile, the score, and the progress fill. No full-gradient cards here (rule of one — a 12-tile gradient wall is exactly what Editorial forbids).

**Album hero (this screen's ONE Era Block):** full-bleed era `tile→deep` gradient panel. A small "Back" pill, an eyebrow (era year/label, 11px `.16em`), the album name in the display serif (~30, mapped to the Headline tier — do NOT paste a literal 64 here), and a large composite score in the display serif (light weight). A thin progress bar (rated/total) and friendly count copy. Use the era `ink` color for all text on the gradient so contrast holds. This is the single saturated moment; everything below it on the album page returns to Editorial white cards.

**Album mode sheet (Editorial, with a light era touch):** a rounded bottom sheet that slides up over a dim scrim. Top: the album's emoji on a **small era-gradient tile** (so the sheet wears the era it's about), then a Title-tier serif header "How do you want to rank this album?". Two option cards: **Vibe Check** (recommended — give it the accent-purple treatment: `#7c3aed` border + lavender-wash fill + deep text) and **Sort It Yourself** (neutral outlined card). Keep BOTH option cards purple/neutral chrome — they're actions, not era moments — so the rule of one isn't broken; only the album-identity tile wears the era.

## Specific changes to make

- **Typography:** load Libre Caslon Text + Hanken Grotesk. Apply the serif to the grid title, the hero album name, the hero big score, and the sheet header (scaled to each spot — serif FACE, not a literal 64px). Everything functional (rows, buttons, labels, intro, counts) uses Hanken Grotesk.
- **Color spine:** primary accent is `#7c3aed` (not `#a855f7`); the grid page sits on `#f1ecfb` so white cards/tiles read as cards on a wash, not floating on pure white.
- **Eyebrows:** every eyebrow-style label (the section header, stat labels, hero year/label) uses 11px, UPPERCASE, `.16em` tracking — make eyebrows a deliberate, consistent system element.
- **Mode sheet era touch:** add the small era-gradient emoji tile at the top so the single-album sheet stops feeling era-disconnected from the hero one tap later.
- **Warm neutrals:** Ink `#211d34` for primary text, Muted `#8b85a3` for secondary — warmed toward purple, never clinical cool grey.

## Launch-readiness (required)

- **First-run / empty state (grid):** when nothing is scored yet, lead with a warm one-liner instead of a flat "0/12". Voice example: *"Pick an era to start — your first Vibe Check takes about two minutes."* Show the tiles as "NEW" without it feeling barren.
- **Loading:** a brief greyed skeleton for the stat numerals and tiles while scores hydrate, so numbers don't pop in jarringly.
- **Error:** if album data can't load, a gentle inline message in-voice (e.g. *"We couldn't pull your rankings just now — pull to refresh."*) — never a raw error.
- **Mobile-first & responsive:** designed at ~390px; the 2-col grid reflows cleanly; the hero gradient and sheet are full-width with safe-area padding.
- **Accessibility:** min 44px tap targets on the hero "Back" pill, the sheet "Back" control, and both option cards (they're currently far too small). Add a visible keyboard **focus ring** (2px `#7c3aed`) on tiles, option cards, and back controls. Verify text contrast on every era tint — `deep`/`ink` on pale eras (Fearless, 1989), white on dark eras (Reputation, Folklore, Midnights).
- **Motion:** tappable tiles + option cards get press-scale 0.97 / 100ms ease-out + `touch-action: manipulation`; wrap in a `prefers-reduced-motion` guard.
- **Voice copy examples:** completed album badge *"Fully ranked 👑"*; progress count *"110 of 219 rated"*; sheet recommended tag *"Most folks start here"*; Vibe Check subtitle *"Tap through fast — about two minutes."*

**Hard constraints:** emoji + era color tiles only (NO real album art), mobile-first, soft-rounded inline-style aesthetic, no lyric text anywhere.
```

---

### 5. Redesign: Album detail / song-list screen

**What changes & why:**
- Every album finally looks like itself: the song scores, progress bars, and accents take on the opened album's era color instead of one generic purple (today only Lover gets special treatment).
- Big numbers get the elegant serif look the design system calls for — the album score and each song's score render in the display serif font, while everything functional stays in the clean sans.
- The little score bars in the expanded breakdown become readable — they'll show how high a rating is by how long the bar is, instead of fading to a barely-visible tint.
- Buttons and the drag handle get bigger, easier-to-tap targets, and the song rows become properly keyboard- and screen-reader-friendly for launch.
- The screen now has all its missing states: a warm first-run prompt for an album you haven't scored, a loading placeholder, an error retry card, and a celebratory 'fully ranked' moment.
- Copy gets the Swiftie voice — e.g. 'Tap to give it a score', 'Share my ranking · 7 of 13' — instead of flat dashboard labels.
- Two fonts (Libre Caslon Text + Hanken Grotesk) must be added to the app first — they aren't loaded today, and the serif look depends on them.

**⚠️ Decide first:**
- Brand purple mismatch — a one-time global decision: the live app's accent purple is #a855f7, but the design framework's official Accent is #7c3aed (deeper). They're close but not identical. Decide which is the real brand purple, then we apply it everywhere at once rather than guessing per screen.
- RatingPanel.jsx is dead code — it's the old full-star scoring panel, not used anywhere in the app today, and it depends on showing lyric text (which is turned off). Decide: delete it, or keep it for a future redesign? Don't want to spend polish on it until you confirm it has a future.
- The album hero already correctly uses the era-color system and serves as this screen's one 'Era Block' moment — the redesign keeps it. Flagging so you know we're intentionally NOT changing the hero's approach, only refining the editorial list beneath it.

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## The screen
The **Album detail / song-list screen** — one album opened from the grid. Top to bottom: a full-bleed **album hero**, a stack of **action buttons** (Vibe Check / Rank by score / Share), then the **song list** (one row per song, drag-to-reorder, tap a row to expand a per-category score breakdown). It's the workhorse rating surface. Funnel role: **SHARING** (the "Share my ranking" button is the in-album viral trigger) with a soft **PRO** edge via the score breakdown.

## Era color — for THIS album
Every visible accent on this screen wears the open album's era. Pull one era palette and reuse it: `tile` (bright primary), `deep` (dark gradient end), `ink` (text laid on the tile). For the **12 eras** use these: Taylor Swift `#8fb0d6`/`#3c5980`/ink`#102338` · Fearless `#e8bd45`/`#8a6610`/`#3a2900` · Speak Now `#9258d6`/`#56268a`/`#ffffff` · Red `#d83a3f`/`#6b0f12`/`#ffe1e3` · 1989 `#5cc0ef`/`#0b6ea0`/`#06304a` · Reputation `#44464a`/`#1a1a1d`/`#e8eaec` · Lover `#f48bc4`/`#b03578`/`#4a0a31` · Folklore `#828995`/`#3a414c`/`#f7f8fa` · Evermore `#c66a2a`/`#6e3410`/`#ffeede` · Midnights `#3f5a8e`/`#182a48`/`#e4e8ff` · TTPD `#b3a89a`/`#57514a`/`#2a241d` · Showgirl `#b13bb6`/`#5e0f63`/`#ffe6ff`. Design the screen with TWO eras shown so the contrast rule is visible: one pale (1989) and one dark (Reputation or Midnights).

## Target layout
1. **Hero = the ONE Era Block.** Full-width era gradient (`tile → deep`), light/dark text via the era `ink`, with: a soft back pill, a fully-rounded mode chip ("🎧 Vibe Check" or "✋ Sort it yourself"), an uppercase eyebrow (`2014 · 13 songs`), the album name in **Libre Caslon Text** (Headline ~33), a big thin **Didone album score numeral** (Hero-scale, ~46–64), a thin rounded progress bar, and a "Your #1" chip. This is the only saturated block — everything below is editorial.
2. **Action buttons (editorial, on the lavender wash).** Primary **Vibe Check** button = filled accent (era `tile`) + soft shadow, Hanken Grotesk ~15. Below it, two **soft buttons** ("Rank by score", "Share my ranking") = lavender-wash fill + era `deep` text. The two soft buttons must share ONE radius and ONE vertical padding — make them visibly the same component.
3. **Song list (editorial white cards).** Eyebrow header. Each row = white card with: a drag handle, a thin rank numeral, the song title (Hanken Grotesk ~15), and the composite score on the right rendered in the **Libre Caslon Didone** face tinted with the era `tile`. Tapping a row expands a per-category breakdown (label + a thin progress bar + N/5). Unrated rows show a warm "tap to score" nudge.

## Specific changes to make
- **Score numerals → Didone.** Render the per-row composite score and the album-score numeral in **Libre Caslon Text** (display face). Titles/labels/buttons stay **Hanken Grotesk**. (Both fonts must be loaded — see note below.)
- **Era-tint every accent, drop the generic purple.** The row score, the rank-emphasis, the selected-row accent border, and the per-category bar fill all use the era `tile` (and `deep` for pressed). Replace the current one-off Lover-only rose special-case with this general era-driven accent so EVERY album reads as its own era — not generic purple. Chrome (tab bar, app logo) stays the single brand purple `#7c3aed`.
- **Fix the breakdown bars.** Show magnitude by **bar width**, not by transparency. Use a solid era `tile` fill at full opacity; never a near-invisible pale fill. The track stays a light neutral.
- **Tap targets + focus.** Make the drag handle a ≥44px-tall hit area (can stay visually narrow). Bump Up/Down/Score and the share/rank buttons to ~40–44px min-height. The tappable song-row content must be a real focusable button (keyboard Enter/Space) with a visible focus ring, and the drag handle needs an accessible label like "Reorder {song}". Add `touch-action: manipulation` to tappable controls.
- **Spacing on the 4px grid** (4 / 8 / 12 / 16 / 24). Snap stray 6/7/14/18 values to the scale.

## Launch-readiness (show every state)
- **Empty / first-run (score mode):** a never-scored album needs a warm framing card, same quality as the drag hint — e.g. eyebrow "READY WHEN YOU ARE", line "13 songs, zero opinions yet. Let's fix that." with the Vibe Check button as the obvious next tap. Keep it editorial; do NOT spend the Era Block here.
- **Loading:** a quiet skeleton (gray rounded placeholders for ~3 rows) while scores hydrate.
- **Error:** a small inline "Couldn't load your ratings — tap to retry" card, never a blank screen.
- **Completion moment:** when the last song gets rated, THAT is where a celebratory Era-Block reveal is earned (a "Fully ranked 👑" flourish) — show it as a separate moment, not inline in the list.

## Mobile, accessibility, voice
- Mobile-first ~390px; rows and buttons go full width; nothing relies on hover.
- Contrast is non-negotiable: pale-era text uses the era `deep`; dark-era text uses white. Show both in the mockup. Secondary text must clear WCAG AA.
- **Brand-voice copy** (use these): section eyebrow "THE TRACKLIST" (not bare "Songs"); unrated → "not rated yet"; row nudge "Tap to give it a score →"; share label "Share my ranking · 7 of 13"; Vibe Check continue "Keep going · 6 left". Warm, fan-forward, friendly numbers.
- Honor hard constraints: **emoji + era color tiles only, never real album art**; no lyric text anywhere; inline-style soft-rounded look throughout.

**Note for the builder:** Libre Caslon Text + Hanken Grotesk are not yet loaded in the app — wire both up globally first, then apply the type roles above.
```

---

### 6. Redesign — QuickScore (Vibe Check) rating flow

**What changes & why:**
- Recolor the whole flow to the true brand purple (#7c3aed) and accent-deep gradients, dropping the washed-out light mauve that's used today, so the rating screens match the rest of the app.
- On the rating question screen, make the album's era color the single accent — stars, progress bar, and the % label all read in one era voice instead of clashing era-background-plus-brand-purple controls.
- Load the real brand fonts (the Libre Caslon serif for headline moments, Hanken Grotesk for everything else) — right now the flow uses plain system fonts because no fonts are loaded at all.
- Polish the Pro intro (VibeCheckIntro): a proper serif 'Vibe Check' title and small branded purple icon tiles instead of plain emoji, keeping the exact $3.99 perk copy.
- Clean up leftover empty space where song lyrics used to appear (lyrics are turned off for copyright), so titles and stars sit centered and intentional.
- Make the completion screen one warm, shareable 'Your top 3' moment for every album, in the friendly Swiftie voice ('Fully ranked 👑') rather than a flat 'All done!'.
- Launch hardening: readable text contrast on every colored background, keyboard focus rings, big tap targets on the stars, gentle press animations, and a lavender (not stark white) fallback background.

**⚠️ Decide first:**
- The live era hex values in src/constants/eraColors.js differ from the DESIGN_SYSTEM.md era table for two albums: the framework lists Speak Now's accent as violet but Showgirl as orange, while the shipped code has Showgirl as magenta (#b13bb6) and Speak Now primary as #7c3aed (the same as the brand accent). The prompt tells the design tool to pull era colors from the live getEra()/ERA_TILES code (the runtime source of truth), but you should decide whether the framework table or the code is correct so the two stop disagreeing — most relevant for Showgirl (orange vs magenta) and for Speak Now, whose era purple is identical to the brand chrome purple and could blur the 'era vs chrome' distinction on a Speak Now rating screen.
- The existing Albums-redesign handoff (Claude Design/design_handoff_albums_redesign/er-quickscore.jsx) specifies a lyric-free QuickScore, which agrees with this prompt — but it predates the v1 framework, so it does not include the new fonts, the #7c3aed recolor, or the era-single-accent rule. I've treated the framework as newer/authoritative and folded the handoff's lyric-free intent in. Confirm you're fine letting the framework win over that older handoff where they differ (styling/fonts/color), keeping only its lyric-free layout idea.

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

**Design these screens: the QuickScore (a.k.a. Vibe Check) rating flow** — a full-screen overlay (covers the whole viewport) that walks a user one song at a time through star-rating questions for one album. It is the core engagement loop. Indirectly it feeds the **SHARING funnel** (completing an album unlocks the share card) and the **PRO funnel** (the intro upsells the $3.99 unlock). Design the full sequence:

1. **VibeCheckIntro** — one-time welcome overlay shown before the user's first-ever Vibe Check; also the Pro upsell.
2. **Question screen** — the repeating heart of the flow: one song, one rating category, a row of 5 stars, a back/skip control, and a thin progress bar.
3. **Completion moment** — shown when the album finishes ranking ("All done" / a "Your top 3" reveal).

**Current state (what to fix):** the flow uses a too-light mauve purple instead of the brand accent, loads no real web fonts (system fonts only), falls back to clinical pure white, sometimes stacks brand-purple controls on top of a saturated era background (two competing hues), reserves dead vertical space where lyrics used to show, and the Pro intro leans on plain emoji + system type.

**Target design — concrete directives:**

- **Color spine.** Every purple in the flow is the framework **Accent `#7c3aed`**; gradients run accent→**deep `#5b21b6`** (e.g. the bottom progress bar, the intro CTA, the completion check tile). Drop the light mauve `#a855f7` entirely.
- **Editorial base vs the one Era-Block moment.** The **question screen IS the earned Era-Block moment** — full era gradient backdrop for the album being rated (one Era Block, rule of one respected). On that era backdrop, drive *every* accent from that ONE era so nothing competes: the filled stars, the thin bottom progress bar, and the "% complete" label all use the album's era color, NOT brand purple. Use the era's bright `tile` value for fills and the `deep` value where text sits on a pale tint. Pale eras (Fearless 🌟, 1989 🌊) → use the era `deep` for text on the tint; dark eras (Reputation 🐍, Folklore 🌲, Midnights 🌙) → white text. This is era-based color, NOT per-category color — do not tint by rating category.
- **VibeCheckIntro** is its own focused moment: white Editorial card centered on the lavender wash, with the title **"Vibe Check"** set in the Libre Caslon Text display face (Title/Headline size). Replace the 🎧 emoji hero and the 📊 / ✏️ / 🏆 emoji perk icons with small **branded purple-gradient rounded SVG tiles** (matching the BracketLocked treatment — a rounded square, accent→deep fill, a simple white glyph). Keep the canonical three Pro perks and the price line "A one-time $3.99 unlock — yours forever, no subscription." exactly. Primary CTA = filled-accent button (`#7c3aed`→`#5b21b6`); "Maybe later" demoted to a quiet text link below it.
- **Completion moment.** Unify into one shareable beat for every album: a "Your top 3 from {album}" reveal with the heading in the Didone display face, era-tinted accents, set ON the era gradient (the earned moment). Warm the copy — "Fully ranked 👑" / "it had to be you" — not "All done!".
- **Remove lyric dead space.** Lyrics are turned off; there is no floating-lyric layer, no scroller box, and no extra category-specific spacing. Center the song title and stars cleanly with even vertical rhythm.
- **Background warmth.** For any non-era category screen, the fallback background is the lavender **Page wash `#f1ecfb`**, never pure white.

**Layout (mobile-first ~390px):** top bar = song counter centered, "Exit" chip on the right; below it the album emoji+color tile and song title (title in Hanken Grotesk, large/medium weight); the category prompt (Eyebrow style, uppercase); a centered row of 5 large stars with generous tap targets (≥44px); calibration label under the stars; a row of two soft pills "← Back" and "Skip / No opinion"; a thin rounded progress bar pinned to the bottom with a "% complete" label.

**Launch-readiness — required:**
- **Empty/loading/error:** data is already loaded synchronously, so no spinner is needed on entry — if anything resolves slowly, show a brief lavender-wash placeholder, never an unstyled flash. Show a graceful state if a song or album has no data.
- **Accessibility:** add a visible keyboard **focus ring** (2px accent outline) on stars, Back/Skip pills, and Exit. Star semantics = `aria-label` like "3 of 5 stars" with selected state announced; group the 5 stars as a labelled radiogroup named by the category. **Contrast (non-negotiable):** all small secondary text (album-context line, sub-counter, calibration labels, the "N★" prefix) must clear WCAG AA 4.5:1 against its actual backdrop — replace pale `#c4b5fd` lavender and pastel-on-pastel text with the era `deep` value (or `#7c3aed` on light) so it's readable.
- **Motion:** Back/Skip pills, Exit chip, and the star buttons get press-scale **0.97 / 100ms ease-out** + `touch-action: manipulation`; respect `prefers-reduced-motion`.
- **Brand-voice copy examples:** counter "Song 4 of 13"; category prompt "HOW'S THE CHORUS?"; Skip pill "No strong feelings"; completion "Fully ranked 👑 — here's your top 3"; intro CTA "Unlock everything — $3.99".

**Hard constraints:** emoji + era color tiles only (NO real album art, ever); mobile-first; soft-rounded inline-style aesthetic; no lyric text anywhere.
```

---

### 7. Album Scenes & Easter Eggs — era-true polish + reduced-motion + a11y

**What changes & why:**
- Midnights egg currently glows generic brand-purple instead of its own indigo — recolor the clock glow, smoke, and label to the Midnights blue-violet family so it actually looks like Midnights.
- The Midnights 12:00 is set in plain Georgia; switch it to the app's serif display font (Libre Caslon Text) so the big moment looks on-brand, not like a placeholder.
- None of these animated scenes respect 'reduce motion' device settings — add the guard so users who disable motion see a calm static version instead of endless drifting/twinkling/smoke (the Red and 1989 scenes already do this; the others don't).
- The full-screen Midnights celebration can only be closed by tapping or waiting ~4 seconds — add an Escape-key exit and a small 'tap to continue' hint so keyboard users and anyone can dismiss it on purpose.
- The 1989 'Welcome to New York' white headline sits over a pale sky and leans on a glow that fades out — guarantee it stays readable with the era's darker blue text or a subtle backing.
- Nudge 1989 and Lover off the generic Tailwind/pastel colors onto the official era palettes (1989's true blue, Lover's rosier pink) so each album reads as itself.

**⚠️ Decide first:**
- Lover scene color: the shipped 'cotton-candy' wrapper gradient is paler/cooler than the framework's rosier Lover gradient (#f9a8d4 → #db2777). The prompt asks the design tool to lean toward the era palette while allowing the soft tint as a sanctioned variant. Decide whether you want the Lover landing to stay dreamy-pale or move to the fuller era rose — and if you keep it soft, note it as an approved exception in DESIGN_SYSTEM.md so it doesn't read as drift later.
- Code-vs-framework palette drift: the 1989 primary in the code (src/constants/eraColors.js, ERA_COLORS['89'] = #0ea5e9) doesn't match the binding framework blue (#1f9fe0 / #0284c7). The design prompt targets the framework blue, but to fully fix this the source palette file should be aligned too — a small code change beyond this design pass. Confirm you want that follow-up.

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## The screens
Design four **decorative album overlays** that play during/after ranking. They serve NO funnel directly — they are delight payoffs that earn shares later. All four are full-bleed atmospheric layers; they already sit on top of host screens (the song list or the QuickScore rating flow), so they own only the *ambience*, never data/buttons. These are legitimate **Era-Block moments** — saturation is earned here. Keep each as ONE era moment; don't stack a second competing block.

**1) Midnights easter egg (reveal).** Full-screen celebration shown once when a fan finishes ranking every Midnights song. Today: a near-black indigo sky with a glowing serif **12:00** clock, a blinking colon, an italic "lavender haze" label, twinkling stars, and lavender smoke rising from the bottom.

**2) Lover album scene (ambient).** A soft cotton-candy backdrop behind the Lover song list: drifting butterflies, rising heart confetti, a faint rainbow arc — translucent so song rows stay readable.

**3) Red theme & 4) 1989 theme (in-rating ambience).** Backdrops behind the rapid-rating flow: Red = falling autumn leaves on burgundy; 1989 = a city skyline + polaroids + glitter on a pale sky-to-pink gradient.

## Target design — concrete changes

**A. Make every era wear its OWN palette (not generic brand-purple).** Use the era table, not brand hexes:
- **Midnights** glow/smoke/label must read INDIGO, not lavender. Re-key the clock glow, the rising smoke, and the "lavender haze" label to the Midnights family: glow `#818cf8`, mid `#4f46e5`, deep `#3730a3` / `#312e81`; tile reference `#3f5a8e → #182a48`, on-text `#e4e8ff`. Keep the dark indigo ground (`#1a0550 → #05010e`) and the strong light-on-dark contrast.
- **1989** accent/star/glitter blues should be the era blue `#1f9fe0` / `#0284c7` (gradient `#7dd3fc → #0284c7`), not Tailwind sky `#0ea5e9`; calibration accent stays the era's pink moment but pulled toward `#db2777`. 
- **Lover** scene + its wrapper gradient should track the era rose: primary `#e0469a`, deep `#b21c6b`, gradient `#f9a8d4 → #db2777`, tile `#f48bc4 → #b03578`, on-text `#4a0a31`. (A softer cotton-candy ambient tint is acceptable as a sanctioned scene variant — but the rainbow/hearts/butterflies should pull from this rosier era family, not random pastels.)
- **Red** stays in its lane: gradient `#f87171 → #b91c1c`, deep `#991b1b`.

**B. Typography on-brand.** The Midnights **12:00** numerals must be the **display Didone (Libre Caslon Text)** — not Georgia. The "lavender haze" label and any small text are **Hanken Grotesk** (italic is fine). This is a "moment," so the big numeral earns the serif display face.

**C. Respect reduced motion (the big one).** EVERY animated keyframe must be wrapped in `@media (prefers-reduced-motion: no-preference)`. Under reduced motion: Midnights shows a static 12:00 + label + still starfield (no smoke/blink/glow loops); Lover shows butterflies/hearts/rainbow placed but NOT looping; Red/1989 show their static backdrop without falling/glittering loops. Match the sibling pattern the Red & 1989 themes already use.

**D. Make the Midnights reveal dismissible by intent.** It is a blocking full-screen overlay. Add an Escape-key handler that dismisses it, plus a quiet, low-contrast "tap to continue" hint so the dismiss path is discoverable. Keep the existing ~4s auto-dismiss as a safety net.

**E. Contrast on pale eras.** For the 1989 "Welcome to New York" headline that sits over the pale top of the sky gradient: do NOT rely on neon glow alone. Either use the era **deep** `#0a6699` for the text, or guarantee a subtle dark scrim/plate behind white text so it stays legible at every animation frame (the glow bloom fades out, so white-on-pale must survive without it).

## Launch-readiness
- **States:** these are pure decorative overlays — no empty/loading/error states of their own (the host screen owns data). Just confirm graceful absence: if an era has no scene, render nothing (no broken layer).
- **Mobile-first ~390px:** all sizing uses clamp/viewport units so the moment fills small screens cleanly; nothing clipped or overflowing.
- **Accessibility:** decorative layers are `aria-hidden`; the dismissable Midnights overlay gets the Escape path + visible hint above; any tap target ≥44px; respect reduced motion per (C).
- **Tap-press feedback** on the dismiss affordance: scale 0.97 / 100ms ease-out, `touch-action: manipulation`.

## Brand-voice copy (use these)
- Midnights label: keep "lavender haze" (lowercase, the lyric wink) + dismiss hint "tap to keep going".
- A whisper-line option under the clock: "Meet me at midnight 🌙".
- If any scene shows a completion line, write it like a Swiftie: "Midnights, fully ranked 👑" — never "Album complete."

## Hard constraints
Emoji + era-color tiles only — NO real album artwork. Mobile-first. Inline-style soft-rounded look. No lyric text rendered as a feature. Keep the hidden-hint spirit (a quiet **13** or lyric wink rewards the curious, never blocks anyone).
```

---

### 8. Brackets: Landing + Personal/Custom Builder — redesign to the Eras Ranker framework

**What changes & why:**
- Swap the dark navy + gold 'arena' look on the Brackets screens for the app's real lavender-and-purple style, so Brackets finally matches the rest of the app.
- Load and use the two brand fonts (Libre Caslon serif for big headlines/numbers, Hanken Grotesk for everything else) — right now these screens fall back to plain system fonts.
- Make the weekly bracket banner the one bold 'era color' moment: big serif category name and a real countdown shown as little white cards, instead of dashed amber pills.
- Pick one set of album colors so the same album never shows up as two different colors across the bracket screens.
- Add the missing states: no more blank top-of-tab on first load, a friendly 'no brackets yet' message, and a visible 'card saved' confirmation when someone shares their result.
- Stop showing any made-up 'X Swifties voted' numbers anywhere live — real vote counts don't exist yet, so use neutral 'voting's open' wording.
- Fix accessibility: make the small delete/close/remove buttons big enough to tap (44px), make the builder usable by keyboard, and warm up the builder wording to sound like a Swiftie, not a dashboard.

**⚠️ Decide first:**
- FRAMEWORK CONFLICT — the navy + gold 'arena' theme. Every bracket screen currently uses a dark navy background (#1a1a2e→#0f3460) with gold buttons (#d4af37 / #fbbf24). This is a whole third color world that your DESIGN_SYSTEM never defines (the system is lavender spine + per-era color skins). The prompt tells the design tool to re-skin Brackets to the lavender spine and swap gold for purple. Decide: (A) go ahead and retire the navy/gold arena look (my recommendation — it brings Brackets in line with the rest of the app), OR (B) you actually like the casino/arena vibe and want to KEEP it as an official 'arena' sub-theme — in which case we should add it to DESIGN_SYSTEM as a named exception rather than override it. I assumed (A); tell me if you want (B).
- ERA-PALETTE SOURCE OF TRUTH — there are currently TWO different sets of era colors in the code (one for editorial tiles, one for the arena tiles), and NEITHER matches the 12-era color table in DESIGN_SYSTEM (e.g. Taylor Swift's debut is teal #16a89a in the framework but blue in both code versions). The prompt says 'use one canonical era palette.' You need to pick which wins: (A) update the code colors to match the DESIGN_SYSTEM table, or (B) update the DESIGN_SYSTEM table to match the colors already shipping. This is a small decision but it affects every album tile app-wide, so flagging it before anyone redraws tiles to the 'wrong' set.
- HANDOFF vs SHIPPED — the older custom-bracket-builder handoff lists lyric-based themes (Best Bridge, Best Opening Line, Best Closing Line). Your shipped builder already dropped those on purpose because lyric display is off, and added non-lyric themes instead. I told the design tool to KEEP the shipped non-lyric themes (newer/better wins). No action needed unless you actually want the lyric themes back — but that would conflict with lyrics being turned off.
- PRE-LAUNCH CONTENT (not a design issue) — the 'Did you know?' trivia facts shown between bracket rounds are still UNVERIFIED (a known item on your pre-launch checklist). I did not have the design tool touch or invent any facts. You still need to fact-check those 10 facts (plus the '200 million records' fallback) against authoritative sources before public launch — it's a credibility/accuracy risk on a commercial Taylor Swift app.

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## What to design

Two related mobile screens for the **Brackets** tab of The Eras Ranker:

1. **Brackets Landing** — the tab's home. Top = the FREE community **weekly bracket** hero (this week's category + a countdown to the next results drop). Below = the user's **My Brackets** list (personal tournaments, newest/in-progress first) and a **"Build your own"** entry. Serves the **PRO funnel** — building a personal bracket is gated behind a one-time $3.99 unlock, so signed-out / non-Pro users see a **locked** state on that entry instead of the builder.

2. **Custom Bracket Builder** — a full-screen overlay (a Pro feature) with a 3-step stepper: **① Pick a category → ② Bracket size → ③ Pick your songs**, then a **"Bracket ready" start-confirmation** overlay listing round-1 matchups. Plus a **BracketLocked** screen (shown to non-Pro users who tap "Build your own"): a single Era-Block-style unlock card naming the three Pro perks (8 extra rating categories · custom categories · custom brackets) with a "Unlock — $3.99 one time" primary button and a demoted "Maybe later" text link.

## Where the design is today vs. the target

Today these screens use a **navy + gold "arena"** look (dark `#1a1a2e→#0f3460` background, gold `#d4af37` CTAs) and the system font stack — **neither is in our framework**. Retarget everything to the lavender Editorial spine with the real type faces.

**Layout & rhythm (target):**
- The whole Brackets tab lives in **Editorial Lavender**: page wash `#f1ecfb`, white soft-rounded cards (radius ~14–16px), Ink text, Muted secondary text. Pills/chips fully rounded.
- **The weekly hero is the ONE earned Era-Block moment** on the Landing — paint it as a full era gradient (use the era of this week's category, light or deep text per contrast rule), with the category name in **Libre Caslon Text Headline (~33)**, and render the countdown as **small white cards with serif (Didone) numerals** — not dashed amber pills. Everything else on the Landing stays editorial (white cards, accent purple, era color only on the emoji tiles).
- **My Brackets rows** = white Editorial cards: a small era emoji tile (gradient + emoji, no art), bracket name in Title/Body, a thin accent→deep progress bar for in-progress brackets, friendly status copy. Completed brackets show a winner emoji tile + "Fully ranked 👑"-style line.
- The **Builder** is a white full-screen overlay on the wash: header (back/close · centered Title · feedback icon), a 3-segment stepper (Category · Size · Songs), scrollable body, sticky bottom CTA bar. Editorial throughout — primary CTAs are the filled-accent gradient button, NOT gold.
- The **"Bracket ready" confirmation** and the **BracketLocked** unlock card are the only places a single Era-Block-style saturated moment is allowed; keep the rule of one.

## Specific changes (directives)

- **Replace the navy/gold arena theme entirely** on these screens with the lavender spine. Swap every gold (`#d4af37`, `#fbbf24`) CTA/accent for the accent→accent-deep purple. No navy background anywhere.
- **Set the real type:** display headlines, the "Bracket ready" reveal, and big numerals (bracket-size numbers, countdown) in **Libre Caslon Text**; all body/labels/buttons in **Hanken Grotesk**. Do not use heavy 800-weight sans for display moments — let the serif's contrast carry them.
- **One canonical era palette.** Drive every emoji tile, score, and gradient from a single era-color source (the framework's 12-era table). Don't show the same album as two different colors across tiles.
- **Builder Step 1 themes:** keep the **non-lyric** theme presets (e.g. Best Workout, Best Hype, Best Summer, Most Devastating, Best Vocal, Most Underrated) — do NOT design lyric-based themes (Best Bridge / Best Opening Line), since lyric text is off. The "Write your own" card is the encouraged path (gradient card, pencil icon, 60-char input).
- **Builder Step 2/3:** size cards (4/8/16/32, default 16) show "{rounds} rounds · ~{mins}" meta; Step 3 has a picked/size counter, accent→deep progress bar, "Fill remaining"/"Fill all randomly" buttons, collapsible per-album song sections with checkboxes, and a "Start bracket" CTA enabled only at exactly the chosen size.

## Launch-readiness (build these states)

- **Empty / loading:** the weekly hero must NOT render blank on first load — show a calm editorial placeholder card ("This week's bracket is warming up…"). My Brackets empty state: a friendly invite to build the first one. Builder search-no-match: centered 🔍 empty state.
- **Honesty:** show NO invented participant counts ("N Swifties voted") — real community tallies don't exist yet. Use a neutral "Voting's open" / "Results drop [day]" line instead.
- **Error / feedback:** the results share-card download must give visible confirmation ("Saved your card ✨") and a retry if it fails — don't dead-end the SHARING moment silently.
- **Accessibility:** all interactive controls ≥ **44×44px** tap target (today the delete/remove/close ✕ buttons and emoji-picker are 30–38px — fix these first). Make the song-pick rows, theme rows, bracket cards and the name input keyboard-operable (real buttons or role + tabIndex + Enter/Space) with an `aria-label` on the name input and `aria-checked` on song checkboxes. Add a visible focus ring (2px accent outline + offset). Ensure contrast: avoid 9px functional text; on era tints use the era `deep` color on pale eras and white on dark eras.
- **Mobile-first & inline-style aesthetic:** 390px base width, soft-rounded cards, press-scale 0.97/100ms on tappable cards, `touch-action: manipulation`, respect `prefers-reduced-motion`.

## Brand-voice copy (use lines like these)

- Weekly hero: **"This week: [category]. Vote before Wednesday."** · countdown label **"Results drop in"**
- My Brackets empty: **"No brackets yet — build the showdown only you could dream up."**
- Builder size helper (warm, not dashboard): **"Songs go head-to-head 'til one's left standing. Bigger bracket, more rounds, more drama — change it anytime."**
- Start confirmation: **"Bracket's set. Let the games begin."**
- BracketLocked: **"Build your own showdown."** primary **"Unlock — $3.99 one time"**, demoted link **"Maybe later"**.

Hard constraints: emoji + era-color tiles only (no real album art), no lyric text, mobile-first, inline-style soft-rounded look.
```

---

### 9. Weekly Community Bracket Experience

**What changes & why:**
- Fonts get fixed everywhere: the weekly screens currently fall back to plain Georgia and system fonts because the brand fonts were never actually loaded — they'll now use the real editorial serif (Libre Caslon) for headlines and Hanken Grotesk for everything else.
- Readability and accessibility are brought up to launch standard: faint grey-on-navy text is darkened, every button gets a visible keyboard focus ring, the tiny 'skip' and close/back buttons are enlarged to a comfortable tap size, and screen-reader labels are added to icon-only buttons.
- Missing states are added: a warm loading screen, an empty/late-data fallback, and an error-with-retry card replace the current blank-screen-when-nothing-loads behavior.
- The 'Share my week' button finally gives feedback — a friendly confirmation appears after the card is created (and it opens the phone's native share sheet where possible), instead of silently downloading a file.
- Motion is made gentler for people who prefer reduced motion: the suspenseful animations and looping confetti can be skipped while still showing the result.
- The look is reconciled to the brand: calm lavender 'editorial' styling for the home and waiting screens, with the dramatic dark 'arena' look reserved for the live voting, reveal, and champion moments — so the saturation feels earned, not constant.
- Phone layout is hardened so the celebratory champion screen doesn't overlap itself on small phones, and bottom buttons clear the iPhone home bar.

**⚠️ Decide first:**
- The dark navy 'arena' background and its GOLD accent are central to the weekly bracket's event feel (locked in the redesign brief), but the DESIGN_SYSTEM doc does NOT list gold — or the 'urgent' orange used on the behind-and-open hero — as official colors. The prompt keeps them as the earned Era-Block moment, but you should decide: add 'arena gold' and 'urgent orange' to DESIGN_SYSTEM as named tokens (recommended, so they stop being undocumented one-offs), or have the designer replace gold with the purple accent on the arena screens. I recommend documenting them.
- The shipped weekly screens use a slightly different lavender (#f3e8ff / a #faf7ff→#f3e8ff gradient) than the framework's page wash (#f1ecfb). Minor, but decide whether to standardize the Home wash to #f1ecfb or formally bless the bracket's softer lavender variant in DESIGN_SYSTEM.
- The 'Instrument Serif' font named in the current code is not the framework face (Libre Caslon Text) and isn't loaded either. The prompt switches to Libre Caslon to match the brand. If you specifically want to keep Instrument Serif as the weekly display font, say so — but it would need to actually be loaded and recorded as an approved alternate in DESIGN_SYSTEM.

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## The screens

Design the **Weekly Community Bracket experience** — a full-screen overlay that runs a five-state flow for the FREE, shared, multi-day community tournament (16 songs → 4 rounds, one shared category per week; everyone votes the same bracket). This is a viral **engagement + SHARING** surface (the champion screen produces a 1080×1080 share card; it is NOT a Pro funnel — the weekly bracket is free forever). Build these five states:

1. **Home / hero** — a state machine showing the single most urgent action: round-live ("Round 2 is live — vote now"), voted-and-waiting ("You're in 🔒 Results drop Wednesday" + countdown), results-ready, behind-but-open (urgent), behind-and-closed (gentle catch-up), and finale. Secondary row: weekly streak + "12,408 Swifties voted." A schedule strip (Mon→Sun cadence).
2. **Vote** — one matchup at a time, two stacked era-gradient song cards split by a serif "vs", a quiet "skip" control, round/matchup eyebrow + progress stepper.
3. **Reveal** — matchup-by-matchup results with suspense: user's pick highlighted, community vote bar fills live, "✓ with the crowd" / "👀 you went rogue", a running Crowd Match tally, survivors advance, hand off to next round.
4. **Locked / waiting** — lock icon + countdown to the next drop, plus soft non-pushy CTAs ("Build your own bracket", "Share your bracket so far").
5. **Champion** — celebratory crowned winner with an animated bracket replay and a "Share my week" action that generates a square share card (champion + Crowd Match % + streak).

## Current state vs target

Today's screens use a dark navy "arena" gradient with a gold accent (intentional event treatment — keep it for Vote / Reveal / Champion). But fonts are wrong/unloaded (rendering as Georgia + system-ui), there are no focus/empty/loading states, contrast and tap targets fail in places, and the share action gives no feedback. Bring it to the framework while preserving the arena drama.

**Target — apply the rhythm:** The Home and Locked screens live in **Editorial Lavender** (white cards on the `#f1ecfb` wash; era color only as emoji tiles, the streak number, and the thin accent→deep progress bar). The arena (deep navy gradient + gold) is the earned **Era-Block moment** for the live Vote / Reveal / Champion screens — that is your rule-of-one drama. The single biggest matchup card and the crowned champion tile are full era-gradient blocks; everything else stays restrained.

## Specific changes (directives)

- **Type:** set every display headline in **Libre Caslon Text** (Hero/Headline/Title) and all UI/body in **Hanken Grotesk**. Snap the bespoke 30–38px hero sizes toward the named steps (Headline 33 / Title 22); keep eyebrows at 11px / .16em uppercase. Use Libre Caslon for big numerals (Crowd Match %, vote percentages, the "vs").
- **Contrast:** raise all small secondary text on the navy arena to ≥ ~0.65 white alpha (the week label, ticker copy, hand-off footnote, and champion replay label currently sit at 0.40–0.45 and fail). On era-tinted cards use the era's `deep` text for pale eras (Fearless, 1989) and white for dark eras (Reputation, Folklore, Midnights).
- **Focus:** every button and tappable card gets a visible focus ring — gold outline (2px, 2px offset) on the dark arena screens, accent outline on the light Home/Locked screens.
- **Tap targets:** the "skip" control and all close/back icon buttons must be ≥ 44×44 (give the skip real padding but keep it visually quiet via low opacity, not tiny size). Icon-only controls (× close, ‹ back) each need an accessible name ("Close" / "Back").
- **Motion:** tappable cards press-scale to 0.97 / 100ms ease-out with `touch-action: manipulation`. Provide a **reduced-motion** path: skip the reveal bar-fill suspense (jump to settled), show the champion in its final crowned state with no looping replay, and drop confetti.
- **Mobile + safe-area:** layouts must hold on a 320–360px-wide / ~568px-tall phone (the champion replay tiles must not overlap the title block — cap arena height with vh or shrink tiles on short screens). Anything pinned to the bottom uses `calc(... + env(safe-area-inset-bottom))`.

## Launch-readiness states (build these, don't skip)

- **Loading:** a warm arena loading state ("Loading this week's bracket…" with a small spinner) instead of a blank screen while data arrives.
- **Empty / late-data:** a designed fallback if a round has no matchups yet, not a blank flash.
- **Error:** a gentle "Couldn't load the bracket — tap to retry" card.
- **Share confirmation (SHARING FUNNEL):** after the share card generates, show a brief warm confirmation pill ("Saved your week — share it anywhere ✨") and prefer the native share sheet where supported. No silent no-op.

## Voice — write copy in these exact moments (Swiftie, warm, never corporate)

- Voted, waiting: *"You're in 🔒 Results drop Wednesday."*
- Behind, round open (urgent): *"⏰ 4 hours left — lock your Round 1 picks before they count."*
- Behind, round closed (gentle): *"You picked Cruel Summer — the crowd advanced August. Curious how the rest shook out?"*
- Reveal match: *"✓ You're with the crowd"* / *"👀 You went rogue"*; tally *"3 of 4 so far."*
- Crowd Match tiers: *"In lockstep with the Swifties" (90%+) · "Mostly with the crowd" (~70%) · "Marching to your own beat" (~50%)."*
- Champion: *"👑 [Song] is this week's champion."* Locked screen: *"Come back Friday — the final four are waiting."*

**Hard constraints:** emoji + era-color tiles only (NO real album art, NO lyric text), mobile-first vertical layout, inline-style soft-rounded look, fully-rounded pills/buttons. Hide one quiet **13** somewhere for the fans.
```

---

### 10. Redesign — Rankings tab, public profile (/u/{uid}) & the shareable cards

**What changes & why:**
- The visitor (/u/{uid}) and owner (Rankings tab) views use one shared list, so the redesign keeps them looking identical — but now your name sits at the top in the elegant serif display face, like the headline of your own page.
- Right now every song and album shows the same flat purple no matter which album it's from. The new design lets each song 'wear its era' — a Red song reads crimson, a 1989 song reads sky-blue — on the little emoji tile, the score bar, and the score number.
- The shareable cards (the thing people actually post) currently all look like the same dark-purple card. The single-album cards will now take on that album's era colors, making each one distinct and on-brand, while keeping the Eras Ranker logo consistent. The 'all 12 albums' mosaic card stays purple.
- The 'album fully ranked' celebration had a loading spinner that could spin forever and a bug where the spin animation wasn't even defined. The redesign adds a real loading state, an error/retry message, and tints the celebration in the album's era colors.
- The whole group moves off the clinical white background onto the warm lavender wash, and the share/profile controls get warmer, more Swiftie-voiced wording instead of dry form labels.
- Launch polish is baked in: empty/loading/error states, readable text on every era color (dark text on pale eras, white on dark eras), bigger tap targets, a visible keyboard focus ring, and consistent button rounding.

**⚠️ Decide first:**
- BRAND PURPLE — pick one. The framework's spine purple is #7c3aed, but the live app's --brand variable is #a855f7 (a lighter purple) used for avatar rings and accents everywhere. The design prompt asks the tool to use #7c3aed per the framework. You need to decide app-wide: either migrate --brand to #7c3aed, or keep #a855f7 as canonical and record that deviation in DESIGN_SYSTEM.md. This is a global token decision, not a per-screen one — flagging so it isn't silently changed.
- PAGE WASH / NEUTRALS — global token change. Warming the background from white (#ffffff) to the lavender wash (#f1ecfb) and nudging text colors toward the warm ink/muted values is a system-wide change in index.css that touches EVERY screen, not just these three. Confirm you want the whole app warmed (recommended for consistency) versus only this group.
- PUBLIC PROFILE SONG BREAKDOWNS — product decision. On your own Rankings tab, tapping a song shows the 'how this score was built' breakdown. On a public profile, that breakdown may not appear (the data the public page mirrors might not include the per-category detail). Decide: should visitors see the score breakdown too (fuller, but exposes more of your rating detail), or should public profiles intentionally hide it? Either is fine — but it affects whether the 'identical owner/visitor view' promise fully holds for the Songs list. This needs a code check on the profile-mirroring before building.
- FOCUS RING + RADIUS SCALE — the framework explicitly leaves keyboard-focus styling and exact corner radii 'unspecified, propose before inventing.' The prompt proposes a 2px accent focus ring and a radius scale (pill 999 / button 12 / card 14–16). Approve these so they can be recorded in DESIGN_SYSTEM.md as the standard.

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## The screens & their job
Design **three connected surfaces** (one shared visual system) for The Eras Ranker:
1. **Rankings tab** — the signed-in owner's profile page (identity header → share/public-profile control → a Songs|Albums leaderboard → a "save a share image" card button).
2. **Public profile** at `/u/{uid}` — the read-only visitor view. It MUST look visually identical to the Rankings tab leaderboard (same shared list component), plus a bio block and a "rank your own" footer CTA.
3. **The share cards** — square 1080×1080 images rendered to a canvas/preview: a single-album **Spotlight card**, a **Mosaic card** (all 12 eras), and the **Album Complete** celebration overlay that previews the Spotlight card.

These serve the **SHARING funnel** (the cards and public profile are the app's most-seen viral artifact) and the **LOGIN funnel** (signed-out users see a sign-in nudge instead of the share controls).

## Today vs. target
Today these screens are clinical: white-on-white, all-sans, and one flat brand purple used everywhere regardless of which album/era a song belongs to. The share cards all look the *same* dark-purple card no matter the album. The target moves to the Editorial-Lavender system with era color earning its place, and ONE serif/Era-Block moment per surface.

## Layout & components — build these
**Era data:** every album has an emoji + 3 era values — a bright `tile` color, a `deep` color, an on-tile `ink` text color (e.g. Red tile `#d83a3f`/ink `#ffe1e3`; 1989 tile `#5cc0ef`/ink `#06304a`; Fearless tile `#e8bd45`/ink `#3a2900`; Reputation tile `#44464a`/ink `#e8eaec`). Use these — never invent hex.

- **Identity header (Rankings + ProfileView, identical):** circular avatar (or initial on lavender-wash, ringed in accent `#7c3aed`), then the display name in the **serif display face at Title ~22** (this is the page's hero — the "moment that matters"), with an **Eyebrow** label below: `ALBUM & SONG RANKINGS` at 11px uppercase, `.16em` tracking, in Muted.
- **Songs|Albums leaderboard:** white Editorial card rows on the lavender wash. Each row = rank badge → **era emoji tile** (emoji on the era's `tile` color, ~28–36px rounded square) → name (Body) + sub-line (era name) → thin rounded **ScoreBar** → score numeral. **Tint the ScoreBar fill and the score number with the song's era `deep` color** so a Red song reads crimson and a 1989 song reads sky-blue — not uniform purple. Give SONG rows an era tile too (today only album rows have one). Tapping a song row expands a "How this score is built" panel: its Eyebrow header at the correct 11px/.16em, and render the resulting 0–100 score in the serif display face as the payoff number.
- **Public-profile control card (Rankings + Settings):** white Editorial card with the on/off toggle, the shareable link + Copy button, and the bio editor. Warm the labels (see voice). When signed-OUT, show a single soft lavender-wash nudge card (not a saturated block) inviting sign-in.
- **Share cards (canvas):** the **single-album Spotlight + Manual cards** are the textbook Era-Block moment — drive the card background gradient, glow, and accent ink from THAT album's era (`tile`→`deep` gradient, era `ink` for text). Keep the lavender brand lockup (serif "The Eras Ranker" wordmark + a small note-tile mark + "✦ fully ranked" badge) constant as the spine. The **Mosaic card** (spans all 12 eras) stays brand-purple. Bring the legacy top-10 fallback card up to this same lockup system.
- **Album Complete overlay:** tint the overlay glow + the "fully ranked ✦" accent with the completed album's era; album name in the serif display face. This is the single Era-Block on that screen.

## Specific changes (directives)
- Set profile display name in the serif display face (Title ~22) in BOTH Rankings and the public profile; keep the eyebrow sans 11px/.16em.
- Warm the page from white toward the lavender wash `#f1ecfb`; secondary text toward Muted `#8b85a3`, ink toward `#211d34`. Avatar ring + chrome accent = `#7c3aed`.
- Per-era color on every song/album row (emoji tile + ScoreBar + score), pulled from era `tile`/`deep`/`ink`.
- Era-skinned Spotlight/Manual/Album-Complete cards; brand-purple Mosaic.
- Reconcile button corner radii to one scale (pill = 999, button = 12, card = 14–16).
- Demote secondary gradient CTAs to flat lavender-wash so only ONE gradient moment shows per screen.

## Launch-readiness (REQUIRED)
- **States:** show empty ("No songs rated yet — head to Albums to start ✨"), loading (animated spinner — define a real `@keyframes spin`, never a dead spinner), and a card **error** state ("Couldn't build your card — tap to try again" with a retry) instead of an endless loader. The public profile needs a friendly unavailable state ("This profile isn't available — the link may be turned off").
- **Contrast on era tints is non-negotiable:** pale eras use their `deep`/`ink` (dark text); dark eras use white. Always lay the era's own `ink` value on its tile.
- **Mobile-first ~390px:** long song names ellipsis-truncate; ScoreBar shrinks gracefully at ~320px. Cap content width consistently.
- **Accessibility:** propose a single visible focus ring (e.g. 2px accent outline, 2px offset) applied to all buttons/rows; tap targets ≥44px; press-scale 0.97/100ms with `touch-action: manipulation`; respect `prefers-reduced-motion`.
- **Voice copy examples:** share button → "Show off your eras"; profile link label → "Your shareable link"; bio placeholder → "A line about your taste — no links."; on-state confirm → "You're live — anyone with the link can see this."; completion → "Fully ranked 👑".

## Hard constraints
Emoji + era color ONLY — no real album art, ever. No lyric text. Mobile-first. Inline-style soft-rounded look (round everything; soft shadows). One purple holds all chrome; era color punctuates, never wallpapers.
```

---

### 11. Settings & Pro funnel — Editorial Lavender redesign (PRO + LOGIN funnels)

**What changes & why:**
- The whole Settings area gets the real brand look for the first time: the lavender page background, the two brand fonts (a serif for headlines, a clean sans for everything else), and the correct brand purple instead of the too-light one in use today.
- The three places that sell the $3.99 unlock (the pop-up, the membership card, and the paywall in Categories) will finally look identical — same icon, same title, same perk tiles, same gradient button. Right now the paywall one looks half-built next to the others.
- The category editor's plain browser sliders and checkboxes get replaced with on-brand rounded controls that match the toggle switches already used elsewhere in Settings.
- Locked Pro rows for free users stop being dimmed into illegibility — they stay readable with a clear lock badge, so the teaser entices instead of frustrating.
- Adds the missing 'empty / loading / error' states (e.g. a friendly line when there are no custom categories yet, a save-failed message instead of silent failure).
- Makes everything keyboard- and screen-reader-friendly and bumps small tap targets up to a comfortable thumb size for phones.
- Warms up a handful of robotic lines into the playful Swiftie voice the brand calls for.

**⚠️ Decide first:**
- Pro hero gradient choice: the framework lets exactly ONE 'moment' on the Settings/Pro surfaces earn a full era gradient. I picked the Speak Now purple gradient (#c4b5fd → #7c3aed) because it reads as the brand purple amplified and isn't tied to a specific album's content. If you'd rather the Pro hero stay fully editorial (white card, no gradient) — keeping Settings 100% calm — say so and I'll drop the gradient moment.
- Brand purple shift (#a855f7 → #7c3aed) is a global token change: it will subtly re-tint primary buttons, toggles, sliders and links across the ENTIRE app, not just Settings. The design prompt assumes you want the framework color everywhere. Confirm you're OK repainting app-wide rather than scoping the new purple to just these screens.
- The framework's 'progress bar = accent→deep gradient' spec is written for progress/countdown bars, not value-input sliders. I've applied that look to the Categories weight sliders for consistency, but note CLAUDE.md describes a future 'phantom-slider preview' enhancement for those exact sliders — if you plan to build that, the redesigned slider should be coordinated with it (don't let the design tool invent that behavior now).

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## What to design

The **Settings screen and its Pro-unlock surfaces** for The Eras Ranker. This serves the **PRO funnel** (the $3.99 one-time unlock — the app's only revenue) and the **LOGIN funnel** (Google sign-in). Design these connected pieces as one consistent set:

1. **Settings shell** — a scrolling page of sections on the lavender wash: Membership, Public profile, Rating Categories, Preferences, Data, Disclaimer/Account. Page title "Settings".
2. **Pro unlock surfaces** — three places that pitch the same $3.99 unlock and MUST look identical in treatment: the **ProModal** (full-screen sheet from Settings), the **MembershipSection** card (inline in Settings), and the **PaywallCard** (shown in the Categories editor). All advertise the SAME three perks at the SAME price.
3. **Categories editor** — toggle the 5 free + 8 Pro rating categories on/off, drag weight sliders (weights always sum to 100), create custom categories. Free users see locked teasers for the Pro rows.
4. **Two modals** — a generic Confirm modal and a destructive Delete-account modal.

The one-time unlock advertises exactly three perks at one price. Use this copy verbatim everywhere it appears: **"8 extra rating categories"**, **"Custom categories"**, **"Custom brackets"**, and the price line **"A one-time $3.99 unlock — yours forever, no subscription."** with CTA **"Unlock — $3.99 one time"**.

## Current state (what to fix)
Today the page is pure white on white (no lavender wash), nothing uses the brand fonts (generic system sans everywhere), the brand purple is a too-light `#a855f7`, native browser sliders/checkboxes clash with a bespoke toggle pill used elsewhere, and the three Pro surfaces are visually inconsistent — the ProModal has a ⭐ icon + bold title + gradient button with a soft purple shadow, while the PaywallCard has a plain small header and a flat shadowless button.

## Target design — concrete

**Base = Editorial Lavender.** Page background is the wash `#f1ecfb`. Every section is a white soft-rounded card (radius ~14–16, a faint warm border, a soft shadow) floating on the wash so cards read as cards. Section headers use small UPPERCASE eyebrow labels (Hanken Grotesk 11, .16em). The page title "Settings" uses the **Libre Caslon Text** display face (Title/Headline size). No Era Blocks anywhere in Settings — it is dense, utilitarian, calm.

**The ONE earned Era-Block moment:** the **Pro unlock hero** (top of the ProModal and the MembershipSection card for a not-yet-Pro user) may use a single full-gradient panel as the celebratory pitch — pick the **Speak Now** era gradient (`#c4b5fd → #7c3aed`, white text — it reads as the brand purple amplified). Title set in the Didone display face ("Unlock Pro"), the price line and three perks below. Everywhere else in Settings stays editorial. Rule of one: only this hero gets the gradient; the inline MembershipSection list and the Categories PaywallCard stay white-card editorial with the accent as accent.

**Pro perk rows:** emoji on a soft-rounded square tile (radius ~10) filled with the lavender accent-wash, then perk label (Hanken 14/600) + one-line description (muted). Keep the tile shape identical across all three surfaces.

**Buttons:** ALL primary unlock CTAs use ONE treatment — filled accent→deep gradient (`#7c3aed → #5b21b6`) + soft purple shadow + white text, radius ~12, full width, generous tap height (~48px). The destructive Delete button uses the same shape in red. Soft/secondary actions ("Maybe later", "Manage subscription") are lavender-wash fill with deep-purple text, demoted lower-contrast. Press-scale 0.97/100ms + `touch-action: manipulation` on every button and tappable row.

**Categories editor controls:** replace native sliders with a thin rounded bar carrying an accent→deep gradient fill and a comfortably large round thumb; show the live "weight · N% of score" readout. Replace native checkboxes with the same custom toggle pill used in Preferences (rounded track + sliding knob, accent track when on). Locked Pro rows for free users: do NOT blanket-dim to 45% (it makes text unreadable) — keep the row legible and lay a clear lock badge/overlay with a real lock affordance over it.

## Specific changes (directives)
- Apply **Hanken Grotesk** to all body/UI and **Libre Caslon Text** to the load-bearing headings: "Settings", "Unlock Pro", "Rating Categories", and both modal titles ("Delete your account?", confirm titles).
- Repaint the page background to the wash `#f1ecfb`; keep cards white so they separate by tone, not just borders.
- Move the brand accent to `#7c3aed` (deep `#5b21b6`) across CTAs, links, toggle-on tracks, slider fills, and selection — replace the lighter `#a855f7`.
- Unify the three Pro surfaces: same ⭐/display-face title, same three perk tiles, same gradient+shadow CTA. The PaywallCard must match the ProModal (today it is the weakest — plain header, flat button).
- Make the Categories sliders rounded accent→deep bars and swap the on/off checkboxes for the toggle pill.
- Warm a few utilitarian lines in the Swiftie voice (see below).

## Launch-readiness (required)
- **States:** Empty — "No custom categories yet" becomes a warm one-line nudge to make one (e.g. *"No custom categories yet — make one that's so uniquely you."*). Provide a **loading** skeleton for the Settings sections and a visible **error** toast/inline message if a category or setting fails to save (today failures are silent). Celebratory empty/success states may earn a touch of era color.
- **Mobile-first ~390px:** single column, cards full-width with ~16px gutters, comfortable vertical rhythm (4/8/12/16/24/32). Nothing relies on hover.
- **Accessibility:** all toggles get `role="switch"` + `aria-checked` + keyboard (Enter/Space) operability; the ProModal, PaywallCard overlay, and the custom-category bottom-sheet get `role="dialog"` + `aria-modal`. Define and show a visible focus ring (a 2px accent outline) on every interactive element. Decorative emoji are `aria-hidden`. **Contrast:** keep all text above AA; on the Speak Now gradient hero use white text (dark enough end); if any pale-era tint is ever used, switch to that era's `deep` text.
- **Tap targets:** every back arrow, slider thumb, toggle, chip, and text-only tap row reaches ~44×44px minimum.

## Brand voice — use warm Swiftie copy, e.g.
- Pro hero subtitle: *"Yours forever. One $3.99 unlock, no subscription, no encores required."*
- Pro-unlocked banner: *"You're all access. 👑"* (instead of "✓ Pro unlocked")
- Custom-weights banner: *"You've made the scoring your own."* (instead of "Weights customised")
- Weights helper: *"Drag to set what matters most — everything rebalances to 100% on its own."*
- Empty custom categories: *"No custom categories yet — make one that's so uniquely you."*

## Hard constraints
Emoji + era color tiles only — NEVER real album artwork. No lyric text. Mobile-first. Inline-style soft-rounded aesthetic (no utility-class look). One purple holds the chrome; era color appears only as accents in Settings, and only the single Pro hero earns a full gradient.
```

---

### 12. Legal pages, terms modal & feedback — Editorial-Lavender redesign

**What changes & why:**
- The two legal pages (Privacy, Terms) move off flat clinical white onto the app's soft lavender background, with the text living inside a clean white card — so they feel like part of the app, not a bare legal dump.
- Page headlines and modal titles switch to the brand's serif display font (with Georgia as a safe fallback), giving the trust pages a more editorial, premium feel instead of generic phone-default text.
- Both pop-up boxes (the 'we updated our terms' box and the feedback box) get matching purple buttons and a single tasteful purple background, replacing today's mismatched pink/blue gradients.
- The 'we updated our terms' box swaps its bare scroll emoji for a small branded purple tile, so the header looks finished rather than improvised.
- Accessibility fixes: a visible purple outline when you tab to a field or button (today there's none), bigger tap targets on the little feedback icon, and a gentle press animation — important on phones and for a paid product.
- All the small states are spelled out — sending, sent (with the playful 'filed in the vault' moment), and a friendly error line — plus the warmer Swiftie-voice wording throughout.

**⚠️ Decide first:**
- Web fonts are an APP-WIDE decision, not a legal-pages-only change. The brand serif (Libre Caslon Text) and body font (Hanken Grotesk) aren't loaded anywhere in the app yet. To truly match the framework you'd load them once for the whole app (one Google Fonts line). If you'd rather not touch the whole app right now, the design will fall back the headlines to Georgia (the editorial serif already used in your share cards) so they still read premium. Your call: load the real brand fonts app-wide, or use the Georgia fallback for now?
- The lavender page background is also an app-wide token. Today the app's background token is plain white (#ffffff); the framework target is the lavender wash (#f1ecfb). The cleanest fix changes that one background value everywhere, which gently re-tints every screen. The safe interim (what this prompt assumes) only re-tints the two legal pages by wrapping their text in a white card on a lavender backdrop, leaving the rest of the app untouched. Your call: flip the whole-app background to lavender now, or keep the change scoped to just these legal pages for now?

```
**Brand: The Eras Ranker** — a Taylor Swift song-ranking app. Editorial, era-aware, a little playful. Mobile-first (~390px), inline-style soft-rounded aesthetic. NEVER use real album artwork — albums/songs are an emoji + era color tile only. No lyric text in designs.

**Spine tokens:** Accent `#7c3aed` · Accent deep `#5b21b6` · Page wash `#f1ecfb` (app background) · Ink `#211d34` (text) · Muted `#8b85a3` (secondary text). One purple holds all chrome.

**Type:** Display = **Libre Caslon Text** (serif — Hero 64 / Headline 33 / Title 22; use for statements, heroes, big numerals). Body/UI = **Hanken Grotesk** (Body 15 / Label 13 / Eyebrow 11 UPPERCASE .16em / Tiny 9.5; use for functions, buttons, rows).

**Rhythm rule:** live in **Editorial Lavender** (white cards on the lavender wash, era color only as emoji tile / score / progress accents). Reserve full-gradient **Era Blocks** for *moments* — the hero, the matchup card, a reveal. **Rule of one:** at most one (rarely two) Era Blocks on screen at once. **Contrast:** pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore, Midnights) use white.

**Components:** primary button = filled accent + soft shadow; soft button = lavender-wash fill + deep text; pills/chips fully rounded; progress = thin rounded bar, accent→deep gradient. Tap-press scale 0.97/100ms.

**Voice:** talk like a Swiftie, not a dashboard — "Locked in. Results drop Wednesday." not "Submission recorded."

*(See the master brand prompt for the full 12-era color table and the rule-of-13 hidden hint.)*

---

## Screens to design (4 surfaces, one shared visual language)

These are the app's housekeeping / trust surfaces. They serve **no funnel directly**, but they protect the LOGIN and PRO funnels by reading as a polished, trustworthy commercial product — a clinical-white "ToS wall" undermines a paid app. Keep them calm and editorial; spend almost no era color here. Design all four as a **390px-wide mobile frame**; include desktop reflow notes where they differ.

1. **Privacy Policy page** (`/privacy`) — full-page, long-form scrolling legal text.
2. **Terms of Service page** (`/terms`) — same template as Privacy, different copy.
3. **Updated-Terms modal** — a blocking app-root overlay shown when a signed-in user must re-accept changed legal text. One action.
4. **Feedback modal + launcher** — a chat-bubble launcher icon (header + dark-overlay variants) that opens a "Send feedback" modal with a textarea, Cancel, and Send.

### Current state (brief)
All four hardcode the OS system-sans for every text element, the legal pages sit on flat clinical white (`#ffffff`), the feedback Send button uses a 135° pink gradient + pink shadow, the Updated-Terms modal backdrop is a pink→blue gradient with a bare 📜 emoji, and there are **no focus rings, no press feedback, and a sub-44px tap target** on the launcher.

### Target design

**Legal pages (Privacy + Terms):** Page sits on the **lavender wash `#f1ecfb`**. The long-form text lives inside **one soft-rounded white card** (max-width ~720px, generous padding, `line-height 1.6`) centered on the wash — an editorial white card on lavender, never edge-to-edge white. At the top of the card: a fully-rounded **soft back-pill** (lavender-wash fill `#f1ecfb`, deep-accent `#5b21b6` text, small "← Back" — replaces today's bare text link), then the **H1 in the display serif (Libre Caslon Text, Title ~28–33, Ink)**, then a muted "Effective [date]" meta line in Hanken Grotesk Label. Body copy = Hanken Grotesk Body 15, Ink; section headings = Hanken Grotesk semibold Title-ish; inline links in accent `#7c3aed` underlined. Optionally keep the back-pill reachable on long scroll (sticky top-left). Footer keeps its quiet privacy/terms text links.

**Updated-Terms modal:** Backdrop = a **single-hue lavender wash** (`linear-gradient(180deg, accent-grad-a, page wash)`) — NOT pink→blue. Centered white card (radius ~16, soft shadow). Replace the bare 📜 with a **small accent-gradient rounded tile** (the brand "note tile": `#7c3aed → #5b21b6`, white glyph) as the header mark. Title in display serif ("We've updated our Terms"). A lavender-wash "What changed" callout card (deep-accent eyebrow label, Ink body). One **primary button** full-width — filled accent gradient `180deg #7c3aed → #5b21b6`, white text, soft purple shadow `0 4px 14px rgba(124,58,237,0.30)` — matching the feedback Send button exactly. Quiet footer note with the "delete your account" escape link.

**Feedback modal:** Dark scrim, centered white card (radius 16). Title in display serif ("Send feedback"), Label-size subline. Textarea: soft-rounded, lavender-tinted border, Hanken body. Cancel = soft/outlined button; Send = **the same** filled accent gradient + purple shadow as the Updated-Terms primary (unify direction to 180° and key the shadow to purple `rgba(124,58,237,0.30)`). Disabled Send fill must use a token, not a hardcoded `#c4b5fd`, so it works in dark mode. The success state stays playful: a paper-airplane flies off and a Swiftie line lands.

**Feedback launcher:** chat-bubble icon, two skins — `header` (white fill, hairline border, accent-deep stroke) and `overlay` (translucent white on dark arena). Visible icon stays ~16–18px but the **tap target grows to ~44×44px** (padding/hit-slop). Add `touch-action: manipulation`.

### Specific changes (directives)
- Set **all four H1s / modal titles in Libre Caslon Text** (display serif). Keep body text in Hanken Grotesk. (Webfonts are an app-wide load — see Conflicts; until loaded, fall back the serif to Georgia, the app's de-facto editorial serif.)
- Move legal pages off `#ffffff` onto the **`#f1ecfb` wash with a white content card**.
- **Unify both modals' primary button** (180° `#7c3aed→#5b21b6`, purple-keyed shadow); tokenize the disabled feedback fill.
- Recolor the Updated-Terms backdrop to a **lavender single-hue wash**; swap 📜 for an **accent-gradient note tile**.
- Convert the legal back link to a **soft back-pill**.

### Launch-readiness (required in the design)
- **States:** Feedback — show `idle` / `sending` (button "Sending…", disabled) / `sent` (airplane + Swiftie line) / `error` ("Couldn't send. Check your connection and try again."). Updated-Terms — show `default` and `saving` ("Saving…", button disabled). Legal pages — long-content baseline (no empty/error needed; they're static). The feedback modal is **signed-in only** (anonymous = not shown), so no signed-out feedback state is needed.
- **Accessibility:** add a **visible focus ring** (2px accent `#7c3aed` ring / box-shadow) on the textarea (replacing the removed outline), both modal buttons, the legal back-pill, and links. Tap targets ≥44px. Text-on-tint contrast — if any era tint appears, pale eras use their `deep` text, dark eras use white (mostly N/A here; these surfaces stay editorial). Respect `prefers-reduced-motion` (skip airplane/press-scale).
- **Motion:** press-scale 0.97 / 100ms ease-out + `touch-action: manipulation` on launcher and both modal buttons.
- **Mobile-first:** all four full-width with comfortable padding at 390px; modals cap ~420–440px and center on desktop; legal card centers at ~720px max on desktop.

### Brand-voice copy (use these)
- Feedback prompt: *"Bug, idea, anything — I read every one."*
- Feedback success: *"Filed in the vault ✨ — locked in like a vault track. Thanks for sending it."*
- Feedback error: *"That one didn't send. Check your signal and try again."*
- Updated-Terms title: *"We've tidied up the fine print"* (subline: *"A quick read, then you're back to ranking."*)
- Legal back-pill: *"← Back to the app"*

### Hard constraints
Emoji + era-color tiles only (NO real album art). Mobile-first. Inline-style soft-rounded aesthetic — soft-rounded cards, fully-rounded pills/buttons, soft shadows. No lyric text anywhere.
```

---

## Decisions for you

These are the spots where the new design would change something you already shipped, or where intent was ambiguous. Pick a direction before generating those screens.

**App shell & global navigation — lavender brand spine, branded nav, polished chrome states**
- Tab bar position is unsettled. The framework only requires the tabs carry the lavender brand spine — it does NOT say top vs bottom. Today the tabs are a text strip at the TOP, yet the layout reserves 80px of empty space at the BOTTOM (as if a bottom bar was once planned). You need to decide: keep tabs at the top (and remove the orphaned bottom space), or move to a fixed bottom navigation bar (more app-like on mobile). The prompt asks for a branded bar but leaves the position to you — tell the design tool which you want.
- A few launch-readiness rules (keyboard focus style, ~44px minimum tap targets, screen-reader 'selected tab' labels) are not yet written into DESIGN_SYSTEM.md — its 'Not yet specified' section leaves them open. The prompt picks sensible values (2px purple focus ring, 44px targets, aria-current on the active tab). If you're happy with these, they should be added to DESIGN_SYSTEM.md so every future screen reuses the same choices.

**Onboarding & Login Funnel — Welcome tour + Google sign-in promo (LOGIN funnel)**
- Brand accent hue mismatch (app-wide decision): the live app's main purple is the lighter #a855f7 (the --brand token in src/index.css), but the framework's primary accent is the deeper #7c3aed. The prompt designs to the framework (#7c3aed). You must decide whether to (a) retune the global --brand token toward #7c3aed app-wide, or (b) officially record #a855f7 as the accepted live value in DESIGN_SYSTEM.md. Do not let only these two screens use #7c3aed — that would split the purple across the app.
- Page-background color (app-wide decision): the live app background is pure white (--bg: #ffffff), but the framework calls for a lavender wash (#f1ecfb). The prompt designs on lavender. Decide whether to shift the global background to lavender or formally keep white as an override — again an app-wide call, not a per-screen one.
- Returning signed-in users: the login-promo screen auto-skips for anyone already signed in. There's a small reliability risk that this could fire more than once. Worth confirming we want a 'fires exactly once' guard added when this is built (low-risk, just flagging).

**Home tab — progress dashboard, redesigned to the Eras Ranker framework**
- Era tile colors: the binding DESIGN_SYSTEM.md table and the actual color file in the code (src/constants/eraColors.js) disagree on several eras (e.g. Speak Now, Red, 1989). The prompt uses the CODE values (the bright ERA_TILES the bracket screens already use) so Home matches what's already shipped. If you'd rather Home match the doc's published table instead, say so and I'll switch the hexes.
- Fonts (Libre Caslon Text + Hanken Grotesk) are not actually loaded anywhere in the app yet — there's no font link in the code. The design prompt assumes they exist. To make the real app match the design, those two web fonts will need to be loaded globally as a small follow-up code change; flagging so it isn't a surprise.
- The hero becomes the one full-color 'Era Block' moment and the daily-pick strip drops to a plain white/lavender card to honor the 'one bold block per screen' rule. If you prefer the daily strip to keep its purple wash, tell me and I'll allow a second, quieter accent surface.

**Albums grid, hero & mode sheet — launch-ready redesign**
- The Albums screens reportedly already shipped as v0.29.0. This prompt assumes the framework now wins over the older 'Claude Design/design_handoff_albums_redesign' handoff — please confirm you want these screens re-polished to the new framework rather than left as shipped. (Two earlier-rejected handoff ideas — per-category QuickScore color and a DOM-based share card — are intentionally NOT reintroduced here.)
- APP-WIDE TOKEN DECISION: two framework gaps here can't be fixed for Albums alone without changing the whole app's look. (1) The live brand fill/border is #a855f7 but the framework accent is #7c3aed; (2) the grid sits on pure white but the framework wants the #f1ecfb lavender wash, and the neutral text colors are cool grey rather than the framework's warmed purple-grey. Adopting these shifts EVERY screen's chrome and background, not just Albums. Do you want to make that global token change now (recommended for consistency) or keep Albums matching today's app and defer the global retune?

**Redesign: Album detail / song-list screen**
- Brand purple mismatch — a one-time global decision: the live app's accent purple is #a855f7, but the design framework's official Accent is #7c3aed (deeper). They're close but not identical. Decide which is the real brand purple, then we apply it everywhere at once rather than guessing per screen.
- RatingPanel.jsx is dead code — it's the old full-star scoring panel, not used anywhere in the app today, and it depends on showing lyric text (which is turned off). Decide: delete it, or keep it for a future redesign? Don't want to spend polish on it until you confirm it has a future.
- The album hero already correctly uses the era-color system and serves as this screen's one 'Era Block' moment — the redesign keeps it. Flagging so you know we're intentionally NOT changing the hero's approach, only refining the editorial list beneath it.

**Redesign — QuickScore (Vibe Check) rating flow**
- The live era hex values in src/constants/eraColors.js differ from the DESIGN_SYSTEM.md era table for two albums: the framework lists Speak Now's accent as violet but Showgirl as orange, while the shipped code has Showgirl as magenta (#b13bb6) and Speak Now primary as #7c3aed (the same as the brand accent). The prompt tells the design tool to pull era colors from the live getEra()/ERA_TILES code (the runtime source of truth), but you should decide whether the framework table or the code is correct so the two stop disagreeing — most relevant for Showgirl (orange vs magenta) and for Speak Now, whose era purple is identical to the brand chrome purple and could blur the 'era vs chrome' distinction on a Speak Now rating screen.
- The existing Albums-redesign handoff (Claude Design/design_handoff_albums_redesign/er-quickscore.jsx) specifies a lyric-free QuickScore, which agrees with this prompt — but it predates the v1 framework, so it does not include the new fonts, the #7c3aed recolor, or the era-single-accent rule. I've treated the framework as newer/authoritative and folded the handoff's lyric-free intent in. Confirm you're fine letting the framework win over that older handoff where they differ (styling/fonts/color), keeping only its lyric-free layout idea.

**Album Scenes & Easter Eggs — era-true polish + reduced-motion + a11y**
- Lover scene color: the shipped 'cotton-candy' wrapper gradient is paler/cooler than the framework's rosier Lover gradient (#f9a8d4 → #db2777). The prompt asks the design tool to lean toward the era palette while allowing the soft tint as a sanctioned variant. Decide whether you want the Lover landing to stay dreamy-pale or move to the fuller era rose — and if you keep it soft, note it as an approved exception in DESIGN_SYSTEM.md so it doesn't read as drift later.
- Code-vs-framework palette drift: the 1989 primary in the code (src/constants/eraColors.js, ERA_COLORS['89'] = #0ea5e9) doesn't match the binding framework blue (#1f9fe0 / #0284c7). The design prompt targets the framework blue, but to fully fix this the source palette file should be aligned too — a small code change beyond this design pass. Confirm you want that follow-up.

**Brackets: Landing + Personal/Custom Builder — redesign to the Eras Ranker framework**
- FRAMEWORK CONFLICT — the navy + gold 'arena' theme. Every bracket screen currently uses a dark navy background (#1a1a2e→#0f3460) with gold buttons (#d4af37 / #fbbf24). This is a whole third color world that your DESIGN_SYSTEM never defines (the system is lavender spine + per-era color skins). The prompt tells the design tool to re-skin Brackets to the lavender spine and swap gold for purple. Decide: (A) go ahead and retire the navy/gold arena look (my recommendation — it brings Brackets in line with the rest of the app), OR (B) you actually like the casino/arena vibe and want to KEEP it as an official 'arena' sub-theme — in which case we should add it to DESIGN_SYSTEM as a named exception rather than override it. I assumed (A); tell me if you want (B).
- ERA-PALETTE SOURCE OF TRUTH — there are currently TWO different sets of era colors in the code (one for editorial tiles, one for the arena tiles), and NEITHER matches the 12-era color table in DESIGN_SYSTEM (e.g. Taylor Swift's debut is teal #16a89a in the framework but blue in both code versions). The prompt says 'use one canonical era palette.' You need to pick which wins: (A) update the code colors to match the DESIGN_SYSTEM table, or (B) update the DESIGN_SYSTEM table to match the colors already shipping. This is a small decision but it affects every album tile app-wide, so flagging it before anyone redraws tiles to the 'wrong' set.
- HANDOFF vs SHIPPED — the older custom-bracket-builder handoff lists lyric-based themes (Best Bridge, Best Opening Line, Best Closing Line). Your shipped builder already dropped those on purpose because lyric display is off, and added non-lyric themes instead. I told the design tool to KEEP the shipped non-lyric themes (newer/better wins). No action needed unless you actually want the lyric themes back — but that would conflict with lyrics being turned off.
- PRE-LAUNCH CONTENT (not a design issue) — the 'Did you know?' trivia facts shown between bracket rounds are still UNVERIFIED (a known item on your pre-launch checklist). I did not have the design tool touch or invent any facts. You still need to fact-check those 10 facts (plus the '200 million records' fallback) against authoritative sources before public launch — it's a credibility/accuracy risk on a commercial Taylor Swift app.

**Weekly Community Bracket Experience**
- The dark navy 'arena' background and its GOLD accent are central to the weekly bracket's event feel (locked in the redesign brief), but the DESIGN_SYSTEM doc does NOT list gold — or the 'urgent' orange used on the behind-and-open hero — as official colors. The prompt keeps them as the earned Era-Block moment, but you should decide: add 'arena gold' and 'urgent orange' to DESIGN_SYSTEM as named tokens (recommended, so they stop being undocumented one-offs), or have the designer replace gold with the purple accent on the arena screens. I recommend documenting them.
- The shipped weekly screens use a slightly different lavender (#f3e8ff / a #faf7ff→#f3e8ff gradient) than the framework's page wash (#f1ecfb). Minor, but decide whether to standardize the Home wash to #f1ecfb or formally bless the bracket's softer lavender variant in DESIGN_SYSTEM.
- The 'Instrument Serif' font named in the current code is not the framework face (Libre Caslon Text) and isn't loaded either. The prompt switches to Libre Caslon to match the brand. If you specifically want to keep Instrument Serif as the weekly display font, say so — but it would need to actually be loaded and recorded as an approved alternate in DESIGN_SYSTEM.

**Redesign — Rankings tab, public profile (/u/{uid}) & the shareable cards**
- BRAND PURPLE — pick one. The framework's spine purple is #7c3aed, but the live app's --brand variable is #a855f7 (a lighter purple) used for avatar rings and accents everywhere. The design prompt asks the tool to use #7c3aed per the framework. You need to decide app-wide: either migrate --brand to #7c3aed, or keep #a855f7 as canonical and record that deviation in DESIGN_SYSTEM.md. This is a global token decision, not a per-screen one — flagging so it isn't silently changed.
- PAGE WASH / NEUTRALS — global token change. Warming the background from white (#ffffff) to the lavender wash (#f1ecfb) and nudging text colors toward the warm ink/muted values is a system-wide change in index.css that touches EVERY screen, not just these three. Confirm you want the whole app warmed (recommended for consistency) versus only this group.
- PUBLIC PROFILE SONG BREAKDOWNS — product decision. On your own Rankings tab, tapping a song shows the 'how this score was built' breakdown. On a public profile, that breakdown may not appear (the data the public page mirrors might not include the per-category detail). Decide: should visitors see the score breakdown too (fuller, but exposes more of your rating detail), or should public profiles intentionally hide it? Either is fine — but it affects whether the 'identical owner/visitor view' promise fully holds for the Songs list. This needs a code check on the profile-mirroring before building.
- FOCUS RING + RADIUS SCALE — the framework explicitly leaves keyboard-focus styling and exact corner radii 'unspecified, propose before inventing.' The prompt proposes a 2px accent focus ring and a radius scale (pill 999 / button 12 / card 14–16). Approve these so they can be recorded in DESIGN_SYSTEM.md as the standard.

**Settings & Pro funnel — Editorial Lavender redesign (PRO + LOGIN funnels)**
- Pro hero gradient choice: the framework lets exactly ONE 'moment' on the Settings/Pro surfaces earn a full era gradient. I picked the Speak Now purple gradient (#c4b5fd → #7c3aed) because it reads as the brand purple amplified and isn't tied to a specific album's content. If you'd rather the Pro hero stay fully editorial (white card, no gradient) — keeping Settings 100% calm — say so and I'll drop the gradient moment.
- Brand purple shift (#a855f7 → #7c3aed) is a global token change: it will subtly re-tint primary buttons, toggles, sliders and links across the ENTIRE app, not just Settings. The design prompt assumes you want the framework color everywhere. Confirm you're OK repainting app-wide rather than scoping the new purple to just these screens.
- The framework's 'progress bar = accent→deep gradient' spec is written for progress/countdown bars, not value-input sliders. I've applied that look to the Categories weight sliders for consistency, but note CLAUDE.md describes a future 'phantom-slider preview' enhancement for those exact sliders — if you plan to build that, the redesigned slider should be coordinated with it (don't let the design tool invent that behavior now).

**Legal pages, terms modal & feedback — Editorial-Lavender redesign**
- Web fonts are an APP-WIDE decision, not a legal-pages-only change. The brand serif (Libre Caslon Text) and body font (Hanken Grotesk) aren't loaded anywhere in the app yet. To truly match the framework you'd load them once for the whole app (one Google Fonts line). If you'd rather not touch the whole app right now, the design will fall back the headlines to Georgia (the editorial serif already used in your share cards) so they still read premium. Your call: load the real brand fonts app-wide, or use the Georgia fallback for now?
- The lavender page background is also an app-wide token. Today the app's background token is plain white (#ffffff); the framework target is the lavender wash (#f1ecfb). The cleanest fix changes that one background value everywhere, which gently re-tints every screen. The safe interim (what this prompt assumes) only re-tints the two legal pages by wrapping their text in a white card on a lavender backdrop, leaving the rest of the app untouched. Your call: flip the whole-app background to lavender now, or keep the change scoped to just these legal pages for now?

---

## Coverage check

**Overall**

The 12 groups map cleanly onto nearly every file in `src/components/**` and `src/App.jsx` — almost no component is wholly unrepresented. The serious gap is not missing files but missing **scope inside the groups that do exist**: dark mode is a fully shipped, user-toggleable theme that a light-only framework doesn't cover, and group 7 drastically undercounts the per-album QuickScore environments (it names 2 of ~12). A handful of small global components (loading spinner, payment-processing banner, dev card preview) also have no home in any group.

**Coverage gaps**

- **Dark mode is shipped app-wide but not represented anywhere.** `src/index.css` defines a complete `:root[data-theme="dark"]` token palette; `src/hooks/useSettings.js` has `theme: 'light' | 'dark'` (synced to Firestore); `index.html` has a no-flash bootstrap; `src/components/Settings.jsx` exposes a "Dark mode" toggle. Every one of the 12 groups needs a dark variant, yet the groups read light-only. **This is the biggest gap.**
- **Per-album themed QuickScore environments are undercounted.** Group 7 names only `LoverAlbumScene.jsx`, `MidnightsEasterEgg.jsx`, and `themes/albumThemes/*`. In reality `src/components/QuickScore.jsx` defines ~12 full ambient scenes — `DebutScene`, `SpeakNowScene`, `FearlessScene`, `ReputationScene`, `LoverScene`, `FolkloreScene`, `EvermoreScene`, `TPDScene`, `ShowgirlScene`, plus the Midnights night theme — each with per-album background gradients, signature moments (e.g. `AllTooWellMoment`), album-complete decorations (`RedScarfComplete`), and `*_TEXT_TUNING` color sets. The registry is `src/themes/albumThemes/index.js`; the rest live inline in QuickScore. This is a large, brand-heavy surface that ~one bullet in group 7 can't cover.
- **`Spinner.jsx`** — global loading spinner. Not in any group.
- **`ProcessingBanner.jsx`** — fixed top "Processing your payment — Pro will activate in a moment" banner rendered at the App root during a Pro upgrade. A Pro-funnel surface, but not listed under group 11 (Settings & Pro) or group 1 (app shell).
- **`src/dev/CardPreview.jsx`** — the `/?dev=cards` share-card preview harness. Dev-only, so reasonably excluded, but worth an explicit "out of scope" note since it draws all three share cards.
- **`src/context/FeedbackScreen.jsx`** — provider/context behind the feedback launcher. No UI of its own, so legitimately not its own prompt, but group 12 should note the launcher has two variants.
- **`WeeklyBracket.jsx` / `WinnerReveal.jsx`** (in `src/components/brackets/`) — CLAUDE.md flags these as dead/unused (like `RatingPanel.jsx`). List them alongside RatingPanel as confirmed dead code so a prompt isn't written for them.

**Missing states or variants**

- **Dark variant of every screen** — the single largest missing variant axis (see above).
- **Signed-out vs signed-in header** — `App.jsx` renders three header states: `authLoading` (a 32×32 placeholder), signed-out ("Sign in" Google button), and signed-in (avatar pill "Hello, {name}" + dropdown). The avatar dropdown and the auth-loading placeholder are distinct states group 1 should call out explicitly.
- **The "rate" tab empty state** — when the rate tab is active but no album is selected, App.jsx renders a bare "Go to Albums and tap one to start rating." message. Belongs to group 5 but is easy to miss.
- **Pro upgrade in-flight state** — the `ProcessingBanner` + the window between checkout and webhook (group 11 / PRO FUNNEL).
- **Offline behavior is silent** — `useRatings.js` and others swallow Firestore failures and fall back to localStorage with no user-facing offline indicator. Worth a deliberate "no offline UI by design" confirmation rather than leaving it ambiguous.
- **PWA install** — `index.html`/`manifest.json` make it installable, but there is no in-app install prompt. If the framework wants one, it's a net-new component.
- **Loading/empty/error states generally** — the framework should specify where loading spinners, empty-state messages, and the `ErrorBoundary` fallback screen sit in the token system, especially in dark mode.

**Recommended additions**

- **Add a dedicated "Dark mode" prompt (or a dark-variant requirement appended to all 12 groups).** Decide scope: ship dark across the whole app, or descope it for launch. Either way the framework must address it — it currently ships and contradicts the white/lavender background decision. The dark tokens already live in `src/index.css`.
- **Expand group 7** from "2 scenes + themes folder" to "all ~12 per-album QuickScore themed environments," and reconcile each scene's hardcoded palette against the DESIGN_SYSTEM era table — the same era-palette disagreement, multiplied per album.
- **Add `ProcessingBanner.jsx` to group 11** (Pro-funnel "payment processing" state) and **`Spinner.jsx` to group 1** (global loading primitive) so they get token treatment.
- **Confirm dev/dead-code scope:** explicitly mark `src/dev/CardPreview.jsx`, `WeeklyBracket.jsx`, and `WinnerReveal.jsx` as out of scope alongside the already-flagged `RatingPanel.jsx`.
- **Confirm offline + PWA-install scope:** decide whether to add an offline indicator and/or an "Add to Home Screen" prompt, or document that neither exists by design.
- **Have group 1 enumerate the three header auth states** (loading placeholder, signed-out Sign-in button, signed-in avatar + dropdown) and the "rate" tab empty state under group 5.

