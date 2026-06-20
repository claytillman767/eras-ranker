# The Eras Ranker — Design System

> **Status: v1 framework — adopted 2026-06-20. This is the binding design
> reference for all new and updated UI.** Adapted from the design tool's
> "Eras Ranker — Brand Template v1". This tracked file is the **canonical
> copy**; the `Claude Design/` folder (gitignored) is the design-tool
> scratchpad. If you iterate on the look there, fold the decisions back
> into this file so the two never drift.

A song-ranking app for Swifties. The system pairs a steady lavender brand spine with an
expressive, full **era-color** layer — so every screen can take on the mood of whichever
album it's about. Editorial serif headlines, warm neutrals, and quiet little hidden hints
for the fans who look closely.

---

## How to use this document (read before any UI work)

- **Authority.** Every new screen, component, or visual change follows this system.
  When a design choice here conflicts with what an old screen happens to do, **this doc
  wins** for the new work.
- **Apply tokens as inline styles.** The app styles with **inline styles only** (no Tailwind
  classes in JSX — see CLAUDE.md → Stack). So these tokens are values you hard-code into
  `style={{ ... }}`, not CSS class names. The era palette already has a code home at
  [src/data/eraColors.js](src/data/eraColors.js) (`getEra()`, `ERA_TILES`) — use it rather
  than re-typing hex values.
- **Don't repaint untouched screens.** This is the target state; the live app is migrating
  toward it. Apply the system to anything you build or change, and improve neighbouring
  surfaces opportunistically — but don't trigger churn by reflowing screens nobody asked
  you to touch.
- **If something isn't specified here, propose an addition — don't silently invent.** See
  "Not yet specified" at the bottom. Add the decision to this doc in the same change so the
  next session inherits it.

---

## The feeling — *Editorial, era-aware, a little playful*

- **Lavender spine, era skin.** A single purple anchors the chrome — logo, tabs, primary
  actions. Content about an album borrows that album's era palette on top.
- **Serif headlines do the talking.** A high-contrast Didone for moments that matter; a
  clean grotesque for everything functional.
- **Hide a hint.** Swifties hunt for easter eggs. Tuck a quiet **13** or a lyric where the
  curious will find it — never where it gets in the way.

---

## Logo & app icon — *The note tile*

- Wordmark set in **Libre Caslon Text**; tile uses the brand accent gradient.
- **Do** — keep the tile on the accent gradient; pair the wordmark in the Didone display face.
- **Don't** — recolor the tile to an era color, stretch it, or set the wordmark in the sans.
- **Don't** — use real album artwork anywhere. Emoji + era color stand in by design (and by law).

---

## Color · brand spine — *One purple holds it together*

| Token | Hex | Use |
|---|---|---|
| Accent | `#7c3aed` | Chrome, primary actions |
| Accent deep | `#5b21b6` | Pressed states, display ink |
| Page wash | `#f1ecfb` | App background |
| Ink | `#211d34` | Primary text |
| Muted | `#8b85a3` | Secondary text |

The accent is tweakable per surface, but it stays a single hue across the chrome. Neutrals
are warmed slightly toward purple so white cards never feel clinical on the lavender wash.

### The era-color system

Twelve palettes — one per album. Each exposes a **gradient** (for full-bleed Era-Block
surfaces), a **primary** (accents, scores, progress fills) and a **deep** (text on tints).
Whenever a song or album appears, it wears its era. Code home: [src/data/eraColors.js](src/data/eraColors.js).

| Era | Year | Icon | Primary | Deep | Gradient |
|---|---|---|---|---|---|
| Taylor Swift | 2006 | 🎀 | `#16a89a` | `#0d6e64` | `#5eead4 → #0d9488` |
| Fearless | 2008 | ✨ | `#d99a1c` | `#92670c` | `#fde68a → #eab308` |
| Speak Now | 2010 | 💜 | `#8b5cf6` | `#6620d9` | `#c4b5fd → #7c3aed` |
| Red | 2012 | ❤️ | `#dc2626` | `#991b1b` | `#f87171 → #b91c1c` |
| 1989 | 2014 | 🌊 | `#1f9fe0` | `#0a6699` | `#7dd3fc → #0284c7` |
| Reputation | 2017 | 🐍 | `#3f3f46` | `#1c1c20` | `#52525b → #18181b` |
| Lover | 2019 | 🌈 | `#e0469a` | `#b21c6b` | `#f9a8d4 → #db2777` |
| Folklore | 2020 | 🌲 | `#5f6b66` | `#363f3a` | `#9aa5a0 → #475550` |
| Evermore | 2020 | 🍂 | `#c2671f` | `#8a3d0f` | `#fbbf6f → #b45309` |
| Midnights | 2022 | 🌙 | `#4f46e5` | `#312e81` | `#818cf8 → #3730a3` |
| TTPD | 2024 | 📖 | `#78716c` | `#44403c` | `#b8b1a6 → #44403c` |
| Showgirl | 2026 | 🎭 | `#ef7611` | `#bc4708` | `#fdba74 → #ea580c` |

---

## Typography — *Didone display, grotesque body*

**Display · Libre Caslon Text** *(tweakable: Bodoni Moda, DM Serif)*

| Role | Size |
|---|---|
| Hero | 64 |
| Headline | 33 |
| Title | 22 |

**UI & body · Hanken Grotesk**

| Role | Size |
|---|---|
| Body | 15 |
| Label | 13 |
| Eyebrow | 11 (uppercase, `.16em` tracking) |
| Tiny | 9.5 |

---

## Components — *Soft cards, round everything*

- **Buttons** — primary (filled accent, soft shadow), soft (accent-wash fill, deep text).
- **Pills & chips** — fully rounded; selected chip is filled accent, others are outlined/muted.
- **Progress & countdown** — thin rounded bar with an accent→deep gradient fill; countdown
  blocks as small white cards with Didone numerals.
- **Era album tile** — comes in two skins:
  - *Editorial* — white card, era color on the emoji tile, score, and progress fill.
  - *Era Block* — full era gradient, light text, used as a moment.

---

## The color rhythm · chosen direction — *Editorial base, era moments*

The app lives in **Editorial Lavender** — calm white cards on the lavender wash, era color
used as accents. **Era Blocks** (full era gradient, light text) are reserved for **moments**:
a celebratory or single-focus surface that earns the saturation. Color punctuates; it never
wallpapers. *(The prototype keeps Editorial & Era Blocks as toggles for reference, but
Hybrid is the spec.)*

- **Default · Editorial — calm by default.** White cards, lavender wash, era color as the
  emoji tile, score, and progress fill. Every high-frequency, content-dense surface stays
  here — dashboards, grids, lists, settings.
- **Moment · Era Block — drama where it counts.** The full era gradient with light text —
  saved for the hero, the spotlight, the reveal. One or two per screen, never a wall of them.

### When a surface earns an Era Block

| | |
|---|---|
| **✓ Use it for** | The hero of a screen · the era you're actively ranking · a bracket matchup card · a winner / results reveal · a celebratory empty-state or milestone. |
| **✗ Keep editorial for** | Album grids & song lists · settings & forms · anything with >2 colored blocks competing · long scrolling content. |
| **The rule of one** | At most **one or two** Era Blocks visible at a time. If a third wants color, the screen is too loud — pull it back to accents. |
| **Contrast is non-negotiable** | Pale eras (Fearless, 1989) use their `deep` text on tint; dark eras (Reputation, Folklore) use white. Always check the `on` value before shipping a block. |

---

## Voice — *Talk like a Swiftie, not a dashboard*

| Trait | Example |
|---|---|
| Playful, fan-forward | "Locked in. Results drop Wednesday." · "it had to be you" · "Fully ranked 👑" |
| Warm, never corporate | "We'll ping you when round 1 results are ready." not "Notification scheduled." |
| Numbers stay friendly | "12,408 Swifties voted" · "7-wk streak" · "110 of 219 rated" |
| Hints, not spoilers | A hidden **13**, a lyric fragment, a wink — rewards the curious without blocking anyone. |

---

## Hidden hints — *The rule of 13*

Taylor's number is the house easter egg. In the prototype, tapping the logo tile thirteen
times sets off a quiet lavender sparkle burst. Keep eggs of this flavor — discoverable,
harmless, delightful. One known egg per release; let the community trade the secret.

---

## Not yet specified (propose before inventing)

These aren't pinned down yet. When a build needs one, pick a sensible value, **use it
consistently**, and add the decision to this section in the same change — that's how the
system grows without drifting. A few that already have a de-facto pattern in the code worth
matching:

- **Spacing scale** — no formal scale defined. Lean on a simple 4px-based rhythm (4 / 8 / 12 / 16 / 24 / 32) until one is set.
- **Corner radii** — "round everything" is the rule, but exact radii per element (cards vs pills vs buttons) aren't fixed. Pills/chips are fully rounded; cards are soft-rounded.
- **Shadows** — "soft shadow" on buttons/cards isn't a defined token yet.
- **Motion** — observed pattern from the bracket matchup card: **press-scale 0.97, 100ms ease-out**, plus `touch-action: manipulation` to kill the iOS tap delay. Reuse this for tappable cards. Respect `prefers-reduced-motion`.
- **Focus / accessible states** — keyboard focus styling not specified.
- **Breakpoints** — the app is mobile-first; no formal breakpoint set documented.
