# The Eras Ranker — UAT Report (v0.2.0)

*Re-review against the published app at https://erasranker.com on 2026-05-05.*
*Prior review: `UAT_REPORT.md` on branch `claude/review-claude-md-0P0Sh`.*

## TL;DR — three things to fix before UAT goes out

The previous report's top three launch blockers (pricing copy, hidden Play Bridge button, fake Welcome categories) are all resolved in the v0.2.0 build. New top three:

1. **Pro upgrade is still a mock — testers will think the whole app is free.** Tapping "Subscribe — $4.99/month" instantly grants Pro with no checkout screen. UAT testers won't report on the upgrade flow because there's no upgrade flow to report on. Either wire Lemon Squeezy test mode now (Phase 4 in CLAUDE.md) or put a one-line note in the UAT briefing: "Pro upgrade is mocked for testing — Pro features turn on instantly with no payment."

2. **Bracket trivia between rounds is unverified.** The 10 facts in `src/components/brackets/RoundTransition.jsx` were written from general knowledge during feature development. Specific Grammy claims, chart-week counts, and certification milestones can be wrong — and a wrong claim in a commercial Taylor Swift app is a credibility hit. Either fact-check them before testers see them or hide the trivia panel until they're verified.

3. **No delete-account flow.** Grep finds zero references to account deletion anywhere in `src/`. Right-to-be-forgotten is a legal requirement in EU/UK (GDPR Article 17) for any commercial product collecting personal data — and Firebase + Firestore stores user emails, photo URLs, and rating history. Not a UAT blocker, but a public-launch blocker.

Everything else in this report is polish or scope-managed future work.

---

## What changed since the prior UAT report

The v0.2.0 ship cleared a long list of issues. Confirmed fixes:

| Prior concern | Now |
|---|---|
| "$4.99 one-time" copy contradicting subscription plan | All copy now says "$4.99/month" with a monthly/annual plan picker (`PaywallCard.jsx`, `Settings.jsx` ProModal). |
| Lyrics gate hid the Play Bridge button | Play Bridge moved out of the lyrics conditional (`QuickScore.jsx:1082`) — visible whenever Spotify is connected. |
| Welcome slide 2 showed fake categories | Slide 2 sources `DEFAULT_CATEGORIES` directly (`Welcome.jsx:224`) — can't drift from real defaults. |
| Rankings empty state pointed to non-existent "Rate Songs" tab | Now says "go to the Albums tab" (`Rankings.jsx:76`). |
| `window.confirm()` clashing with app design | Replaced with reusable `ConfirmModal.jsx`. |
| No Spotify Premium warning before OAuth | Premium warning shown in `VibeCheckIntro.jsx:272`, `Settings.jsx:584`, `ConnectSpotifyPrompt.jsx:92`. |
| Bracket builder UI not finished | New `BracketBuilder.jsx` — two-step picker (category → scope → size). |
| No drag instruction in Sort It Yourself | One-time hint card in `SongList.jsx:358`. |
| No version label for testers' bug reports | `v{__APP_VERSION__}` shown at the bottom of Settings. |

A real public-profile feature has also shipped (`/u/{uid}` URLs, opt-in via Settings) — that wasn't asked for by the previous report and counts as net-new scope.

---

## Section 1 — User Experience: is the purpose and flow clear?

### What the app does well (still true)

- **Onboarding has had real care.** Welcome tour now uses the real category names; the rate-then-place animation on slide 4 makes the value proposition tangible in a way most ranking apps never bother with.
- **The Home tab adapts to user state** — first-timer, returner, power user — and the Continue card is a strong "where was I?" prompt.
- **Star calibration phrases inside QuickScore** are still the hidden gem. "1★ Filler words / 5★ Rewrites poetry" makes a 1-star feel fair, not insulting.
- **Bridge auto-skip** still handles the no-bridge edge case gracefully.
- **The two-mode choice (Vibe Check vs Sort It Yourself)** still respects how different fans think about ranking.
- **Public profile** is a thoughtful add — gating it behind an explicit toggle, with a profanity filter and a 140-char bio cap, takes the right tradeoff between sharing and spam control.
- **Beta gate "notify me at launch"** path is a small kindness and a free email-list builder.
- **Score badges, Spotify cover art, and the Rankings shareable card** all still feel polished.

### Confusing or rough spots (current build)

| Severity | Where | What's confusing |
|---|---|---|
| 🔴 High | "Subscribe" button | Tapping it grants Pro instantly with no checkout. Testers will assume the app is fully free. (Top-3.) |
| 🔴 High | Brackets → "Did you know?" trivia | Unverified facts; one wrong claim shown to thousands of users. (Top-3.) |
| 🔴 High | Settings → Account | No delete-account button. (Top-3.) |
| 🟠 Medium | Welcome tour | Still no mention of brackets — a top-level tab the new user has no concept of. |
| 🟠 Medium | Bracket matchup cards | No audio playback even for Pro users — `MatchupScreen.jsx` doesn't take a `spotify` prop. Free users get no upsell on the card either. |
| 🟠 Medium | Bracket community percentages | Still simulated by a seeded random function (`getCommunityVotePercent`). Power users will spot that the same answer wins every time. |
| 🟠 Medium | "Score Album" vs "Vibe Check" | Album header button still says "★ Vibe Check" (`SongList.jsx:314`) but the welcome tour, modals, and tooltips also use "Vibe Check" — naming has *converged* since the prior report, but the modal copy "Sort it yourself" alongside "Vibe Check" still pairs an action verb with a noun. Worth a polish pass. |
| 🟠 Medium | Today's pick on Home | Still no dismiss × ([Home.jsx:407](src/components/Home.jsx:407)). The bracket Landing daily matchup *does* have a dismiss button — the inconsistency suggests a missed sweep. |
| 🟠 Medium | Spotify SDK load | No `<script>` `onerror` handler and no timeout (`useSpotify.js:296`). If the SDK fails to load, the user sits on "Connecting…" forever. |
| 🟠 Medium | Spotify album art | `<img>` rendered with no `onError` fallback (`AlbumCard.jsx:34`). Cached URLs expire ~weekly; returning users may see broken images. |
| 🟠 Medium | CSV export | Free for everyone in Settings (`Settings.jsx:683`), but `PaywallCard.jsx:51` still lists "Export your full rankings list" as a Pro feature. |
| 🟠 Medium | Album mode lock-in | Once a user picks Vibe Check or Sort It Yourself for an album, there's no obvious switch. Still requires clearing data. |
| 🟡 Low | Pro perks in `VibeCheckIntro` | Still highlights only "Play Bridge" — Pro has five perks (Spotify autoplay, album art, extra categories, custom categories, bridge jump). Understates value at the user's first big moment. |
| 🟡 Low | "Why this score?" | No explainer anywhere a 0–100 number appears. New users still have to guess what the math is. |
| 🟡 Low | Category bar abbreviations | "Nostlg," "Hook," "Brdg," "Skip" — still no tooltip on tap-and-hold. |
| 🟡 Low | "Other" album row | Still a single half-width card with no subtitle ("Soundtracks, features, standalone singles"). |
| 🟡 Low | Sign-in via redirect | Still no error state if Google sign-in fails after the redirect bounce. |
| 🟡 Low | Bracket dismiss inconsistency | Bracket Landing dismisses for the day; Home daily pick doesn't dismiss at all. Pick one pattern. |

### First-time-user mental model gaps

- "Why does this app exist?" — answered by the Welcome tour. ✅
- "What does a 'rating' actually become?" — answered by the 0–100 score, but **no in-app explainer of how it's calculated**. Still a gap.
- "What's the difference between Vibe Check and Sort It Yourself?" — answered briefly on slide 3 + on the album mode modal. ✅
- "**What's a 'bracket'?**" — still NOT answered anywhere in onboarding. The Brackets tab has its own landing now, but a brand-new user doesn't get pushed there. Add a one-line subtitle on the Brackets tab ("Tournament-style: vote between two songs at a time") or a fifth slide in the welcome tour.
- "What does Pro actually unlock?" — answered well in three places (VibeCheckIntro, Settings ProModal, PaywallCard). ✅
- "**What does the public profile do?**" — new feature; needs a one-line "Anyone with the link can see your rankings" hint inline near the toggle in Settings. (May already be there — verify the copy is unambiguous.)

---

## Section 2 — Pro funnel: effective without being pushy?

### How Pro is currently surfaced

| Surface | Style | Pushy? |
|---|---|---|
| **VibeCheckIntro** (first vibe check ever) | Full-screen, mostly educational. CTA adapts to user state. Premium footnote now visible. | Soft, well-paced. |
| **Home tab** | No Pro prompt. Album art (a Pro perk) silently absent for free users. | Very soft. |
| **Album cards** | Same — silent. | Very soft. |
| **Settings → Spotify** | PRO badge, Connect opens upgrade modal, Premium requirement explained. | Soft. |
| **Settings → Rating Categories** | Editor surfaces extras + paywall card. | Soft, opt-in. |
| **PaywallCard** | Bottom of Categories editor. Feature list + monthly/annual plan picker. | Soft. |
| **Bracket Spotify playback** | Audio not built for Pro or free; no upsell card. | Missed conversion (still). |

**Verdict on tone:** still healthy and not pushy. The remaining issue is *under-selling*, not over-selling.

### Where the funnel still leaks

1. **The mock unlock undercuts UAT testing.** As above — testers will report "Pro feels free" because it is free. Either flip to LS test mode now or warn testers explicitly in the briefing.

2. **No social proof.** Pro modals are pure feature lists. Adding "Used by [X] Swifties" once the user count is non-trivial is a known conversion lift. Skip until you have data.

3. **No post-upgrade Spotify hand-off.** After tapping Subscribe, the user is dropped back where they were. They still have to navigate to Settings → Spotify → Connect Spotify. Auto-prompt them with "You're Pro! Want to connect Spotify now?" immediately on success.

4. **The free Categories editor still has no Pro preview.** Free users can adjust default category weights but can't see the impact of the 8 extra Pro categories. A "show me what Vocal Performance ratings would look like for one song" preview would let users feel the gap they're missing.

5. **Brackets are still an unused upsell point.** A free user opening a matchup card hears no audio. There's no copy explaining why or offering Pro. Even a small dismissable banner — "Connect Spotify with Pro to hear both songs" — would work.

6. **VibeCheckIntro still highlights only Play Bridge.** Pro has more perks; rotate or stack them.

### Pro funnel scorecard

| | Score | Δ from prior |
|---|---|---|
| Clarity of what Pro unlocks | 8/10 | – |
| Honest, non-pushy tone | 9/10 | – |
| Strategic placement at intent moments | 7/10 | – |
| Pricing copy accuracy vs. launch plan | **9/10** | **+7 (was 2/10)** |
| Post-upgrade activation flow | 5/10 | – |
| Friction-removal at gates | 7/10 | +1 (Premium warning shipped) |

---

## Section 3 — Confusing-to-user findings (consolidated checklist)

Items still open at v0.2.0. Resolved items dropped.

### Onboarding (BetaGate → Welcome → first album)

- [ ] Welcome tour has no bracket education.
- [ ] After dismissing Welcome, the user lands on Home with the Continue card but no spotlight on what to do.
- [ ] Beta gate "Notify me at launch" copy still doesn't surface a one-line "Why am I seeing this?" expander.

### Album → Vibe Check (the core loop)

- [ ] Album mode modal: still no way to switch modes after the initial choice without clearing data.
- [ ] "Play Bridge" still only appears once per song with no progress indicator showing where the bridge sits in the song.
- [ ] The auto-skip "song has no bridge" screen is functional but users still can't tell which songs have bridges in advance.
- [ ] The 11th-bridge-play autoplay nudge still has fixed copy with no "ask me again later" path if the user says "no."
- [ ] Exit confirmation buttons in QuickScore are small for thumbs.

### Album → Sort It Yourself

- [ ] Drag hint shipped — good. Still no on-screen indication that long-press anywhere on the row works (vs. only on the ⠿ handle).
- [ ] Action bar still requires tap-to-select to surface up/down buttons.

### Brackets

- [ ] Trivia facts unverified.
- [ ] Community vote percentages are simulated.
- [ ] No empty-state for users who try to start a bracket without enough rated songs in the chosen scope.
- [ ] No Spotify audio in matchup cards.
- [ ] No Pro upsell on matchup cards.
- [ ] Closing a matchup mid-vote still sends the user to the bracket tree, not back to bracket home.

### Spotify connection

- [ ] No SDK-load timeout. If the script never fires `onSpotifyWebPlaybackSDKReady`, the connection sits on "Connecting…" forever.
- [ ] No `script.onerror` handler. Network failures fail silently.
- [ ] No `<img onError>` fallback for expired album art URLs.
- [ ] Disconnect → reconnect re-fetches all 12 albums; users on slow connections briefly see partial artwork.

### Public profile (new)

- [ ] Bio profanity filter is wordlist-based — easy to bypass with leetspeak. Acceptable for v1, but a "report this profile" link is missing.
- [ ] Profile URLs are uid-based (long random string). No vanity handle path.
- [ ] No way for the owner to preview what their public profile looks like to others without opening an incognito tab.

### Rankings

- [ ] Top 20 limit on songs view but no indicator that more exist beyond the cutoff.
- [ ] No filter (by album, by category) on songs leaderboard.

### Settings

- [ ] **No delete-account button** (Top-3).
- [ ] CSV export is shown to all users but listed as a Pro feature in the paywall — pick one and enforce.
- [ ] Sign-out vs. "forget me on this device" distinction still not explicit.

### Cross-cutting

- [ ] No global loading state for slow Firestore writes.
- [ ] No error state for Firestore writes that silently fail (offline, quota exceeded).
- [ ] No "rating history / undo" for users who tap a star by accident.

---

## Section 4 — User wants (what testers will ask for)

Same shape as the prior report; trimmed to items still relevant.

### "How does the score actually work?"
Still no in-app explainer. A small (i) icon next to any 0–100 number that opens a sheet ("Each song's score is the weighted average of your category ratings, scaled 0–100.") would close this.

### "Can I share my rankings?"
You have a 1080×1080 share image and a public profile URL. Power users will still want a per-album share image and a "share my Top 5" image at scoring milestones.

### "Can I rank just one album?"
Supported, but discoverability is OK rather than great.

### "Can I see how my rankings compare to others?"
Brackets is partly this. The "Most Loved Songs (community)" leaderboard the prior report flagged is still an open opportunity.

### "Can I delete my account?"
**No.** Critical for legal compliance.

### "Can it work offline?"
Mostly yes (localStorage). Still no user-facing feedback when Firestore writes silently fail.

### "Does it run on my old phone / desktop?"
Test matrix needed for UAT — at minimum: iOS Safari, Chrome Android, desktop Chrome, desktop Safari. Inline styles are widely compatible but the gradient + backdrop-filter combos may render differently.

### "Can I undo a rating?"
Still no rating history. Most users won't ask, but a few will.

---

## Section 5 — Pre-launch enhancements (priority order)

### Tier 1 — Must do before public launch

1. **Wire Lemon Squeezy test mode** so testers can exercise the real upgrade flow, OR put a clear "Pro is mocked" line in the UAT briefing.
2. **Fact-check the 10 bracket trivia entries** and the fallback fact in `RoundTransition.jsx`.
3. **Build a delete-account flow** in Settings → Account. Server-side: delete the `users/{uid}` doc, the `profiles/{uid}` doc, and `auth.deleteUser()`. Local: clear all `eras_*` localStorage keys.
4. **Add an SDK-load timeout + error fallback** for Spotify (10–15s timeout → user-facing "Spotify is taking too long — try again or rate without sound").
5. **Add `onError` fallback on Spotify album art `<img>` tags** — fall back to the emoji/color tile.
6. **Reconcile CSV export Pro/free split** — pick one and enforce.

### Tier 2 — High value polish

7. **Auto-prompt Spotify connect immediately after a successful Pro upgrade.**
8. **Add bracket education to onboarding** — fifth slide in the Welcome tour or a one-line subtitle on the Brackets tab.
9. **Add a Pro upsell on bracket matchup cards** for free users.
10. **Add a "Why this score?" sheet** anywhere a 0–100 number appears.
11. **Add a small dismissible × on the Today's Pick card** in Home (already exists in the bracket Landing — copy that pattern).
12. **Add a per-album sort-mode switcher** so users can move from Vibe Check to Sort It Yourself without clearing data.
13. **Wire bracket Spotify playback** for Pro users in `MatchupScreen.jsx`.
14. **Add real bracket community vote tallies** (Firestore counters, atomic increment writes).

### Tier 3 — Nice-to-have / future

15. Profile vanity handles (`/u/{handle}`).
16. "Report this profile" link with a Firestore writeable `profileReports` collection.
17. Era / decade / mood filters on Rankings.
18. Community song/album leaderboards.
19. Per-album share image at completion.
20. Rating history with undo.
21. Notification system (deferred per CLAUDE.md).
22. Synchronized lyrics display (gated on licensing decision).
23. Spotify playlist export.

---

## Section 6 — Recommended UAT script (give this to testers)

Same structured approach as the prior report. Updated for v0.2.0:

1. **Sign-in (3 min)** — sign in with Google, sign out, sign back in. Note any errors.
2. **First album (5 min)** — Albums → Folklore → Vibe Check, rate at least 8 songs. Try the Back button mid-rating.
3. **Switch modes (2 min)** — Reputation → Sort It Yourself, drag at least 3 songs. Try "Rank by score" after rating 2.
4. **Continue card (1 min)** — Home → Continue → rate 2 more songs.
5. **Daily prompt (1 min)** — rate today's pick from Home.
6. **Categories (3 min)** — Settings → Edit Categories. Adjust weights. Toggle a Pro category (paywall).
7. **Pro upgrade (3 min)** — Tap Subscribe. **Note:** mock unlock is instant. Verify Spotify section unlocks, extra categories appear, custom category creator appears.
8. **Spotify (3 min)** — Connect Spotify (Premium required). Re-enter Vibe Check; verify a song plays. Try "Play Bridge."
9. **Brackets (3 min)** — Open Brackets, use the new builder to start a personal bracket on "Most Romantic" scoped to one album. Vote through. Vote in the weekly bracket too.
10. **Public profile (2 min)** — Settings → Public profile → toggle on, set a bio, copy the URL, open it in an incognito tab.
11. **Rankings (1 min)** — view top songs and top albums, tap the share card.
12. **Sign out and back in (1 min)** — confirm ratings, mode choices, Pro state, and profile setting all return.

Ask testers specifically:

- Was anything confusing?
- Did anything feel slow or broken?
- Where did you almost give up?
- What did you wish the app did?
- Would you pay $4.99/month for the Pro features?
- Did the public profile feel useful, or off-putting?

---

## Appendix — Files referenced

- `src/App.jsx` — root, tabs, beta gate, welcome gate, profile route
- `src/components/Welcome.jsx` — 4-slide onboarding (categories now sourced from real defaults; still no bracket slide)
- `src/components/Home.jsx` — Home tab (Today's Pick still has no dismiss × at line 407)
- `src/components/QuickScore.jsx` — rating overlay (Play Bridge now independent of lyrics gate, line 1082)
- `src/components/SongList.jsx` — drag hint shipped (line 358); "Vibe Check" button at line 314
- `src/components/Rankings.jsx` — empty-state copy fixed (line 76)
- `src/components/Settings.jsx` — ProModal copy now subscription (line 805); CSV at line 683 (free); no delete-account button
- `src/components/PaywallCard.jsx` — monthly/annual plan picker; CSV listed as Pro perk (line 51) but not enforced
- `src/components/ConfirmModal.jsx` — replaces native `window.confirm()`
- `src/components/AlbumCard.jsx` — Spotify art `<img>` has no `onError` fallback (line 34)
- `src/components/VibeCheckIntro.jsx` — Premium footnote shipped (line 272)
- `src/components/ConnectSpotifyPrompt.jsx` — Premium requirement noted (line 92)
- `src/components/brackets/BracketBuilder.jsx` — new two-step picker
- `src/components/brackets/MatchupScreen.jsx` — still no `spotify` prop / playback
- `src/components/brackets/RoundTransition.jsx` — unverified TRIVIA array (lines 18–29)
- `src/components/brackets/Landing.jsx` — daily matchup has dismiss button (line 197) — Home doesn't
- `src/hooks/useSpotify.js` — SDK script append at line 296; no timeout / no `onerror`
- `src/constants/bracketCategories.js` — `getCommunityVotePercent` still simulated (line 222)
- `CLAUDE.md` — product context; trivia fact-check is already on the pre-launch list
- `CHANGELOG.md` — v0.2.0 entry covers most of the resolved items above
