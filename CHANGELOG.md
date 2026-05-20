# Changelog

All notable user-facing changes to The Eras Ranker are recorded here.

The version number is set in `package.json` and shown in the app under
**Settings → About**. Bump the version and add an entry below whenever a
shipped change affects what users see or do.

Versioning follows a loose [Semantic Versioning](https://semver.org/) idea:

- **Major** (`x.0.0`) — big rewrites, redesigns, or breaking data changes.
- **Minor** (`0.x.0`) — new features, screens, or notable UX shifts.
- **Patch** (`0.0.x`) — bug fixes, copy tweaks, small visual polish.

Newest entries go at the top.

---

## 0.20.3 — 2026-05-20

### Changed
- **Cleaner signed-out Settings page.** Before, signed-out Settings
  showed three "Sign in with Google" buttons in a row — one in
  Account, one in Membership, one in Public Profile. Now there is
  one consolidated sign-in card at the top that names the three
  things signing in unlocks (back up ratings, unlock the toolkit,
  share a public ranking page), and the three account-tied sections
  below it are hidden until you sign in. The page still has the
  Rating Categories, Preferences, Data, and footer below.

---

## 0.20.2 — 2026-05-20

### Changed
- **Cleaner welcome login prompt.** The footer line on the
  "Sign in with Google" screen used to mention the Pro perks; it now
  just says "You can sign in any time from Settings → Account." The
  Pro pitch still lives on the categories paywall, the first Vibe
  Check, and Settings — the welcome moment is just about signing in.

---

## 0.20.1 — 2026-05-19

### Changed
- **Pro perks now read the same on every upgrade screen.** Before, the
  same three perks were named slightly differently across the lock
  screen, the categories paywall, the settings modal, and the first
  Vibe Check pitch. Every surface now reads "8 extra rating categories
  / Custom categories / Custom brackets" with the same one-line
  descriptions underneath.
- **The first Vibe Check pitch now states the price up front.** It
  used to only show "$3.99" on the button itself; now the standard
  "A one-time $3.99 unlock — yours forever, no subscription." line
  sits right above the unlock button, matching every other upgrade
  screen.
- **The sign-in promo footer names the three Pro perks explicitly**
  instead of a vague "extra categories, custom categories + custom
  brackets" parenthetical.

---

## 0.20.0 — 2026-05-19

### Added
- **The "build your own bracket" lock screen now has an actual unlock
  button.** Before, tapping "build a bracket" without the unlock just
  gave you a "Back" button — no way forward. Now you see the same
  $3.99 one-time unlock pitch you'd see elsewhere, with a primary
  "Unlock — $3.99 one time" button, the three unlock perks listed
  explicitly, and a "Maybe later" link if you're not ready. If you
  aren't signed in yet, tapping the unlock button walks you through
  Google sign-in first, then drops you back at the unlock screen.

### Changed
- **Bracket lock screen now uses a proper branded icon tile** (purple
  gradient trophy) instead of an emoji, and reassures you that the
  weekly community bracket and daily matchup stay free.
- **Voting on a bracket matchup feels more tactile.** The two cards
  now scale-press 0.97 on tap, instant tap feedback (no 300ms iOS
  delay), and the "Tap a card to vote" prompt is a clearer purple
  pill instead of small italic text.
- **After you vote, the "Vote counted" confirmation is quieter** when
  there's no community-vote data to share yet — no more dashed
  purple box around a one-line message. (When the community-vote
  backend exists and we can show "X% of Swifties agree with you",
  the rich reveal returns.)

### Fixed
- **A stale `isQueued` reference in the matchup card** that did
  nothing in normal use but would have thrown if a "queued"
  state were ever introduced. Cleaned up.

---

## 0.19.1 — 2026-05-18

### Changed
- **Score breakdown now shows every active category**, not just the ones
  you rated. Any category you haven't rated yet appears in a "Not rated
  — doesn't count toward the score" section, so it's obvious what's
  contributing to the score and what isn't.
- **Category weight sliders go up to 100** (instead of 50) and now show
  your raw priority value (1–100) right next to the resulting "% of
  score" — both numbers update live as you drag.

### Fixed
- **Public profile now stays in sync as you rate.** A subtle bug caused
  the auto-sync timer to keep resetting on every render, so the profile
  often stuck on the snapshot from when you first turned it on. Renames
  and re-ratings now flow through to the shared link as intended.

---

## 0.19.0 — 2026-05-18

### Added
- **Tap any song to see how its score was built.** On the Rankings tab
  and on shared public profiles, tapping a song now expands a breakdown
  showing the stars given in each category, each category's weight, and
  the simple math that turns them into the 0–100 score. The scoring is
  no longer a mystery.

---

## 0.18.0 — 2026-05-18

### Changed
- **The Rankings tab is now your profile page.** It shows your photo and
  name up top, a Share control front and center, and your album and song
  rankings below — the same view anyone sees when you share your link.
- **Your public profile now includes your song rankings too**, not just
  albums. Visitors get a Songs / Albums toggle, with your top 25 songs
  shown first and a "Load more" button to see the rest.

### Added
- **Turn on and share your public profile right from the Rankings tab.**
  The on/off switch, shareable link, and bio editor now live in both the
  Rankings tab and Settings, so sharing is always one tap away. Signed-out
  users get a quick "Sign in to share" prompt.

---

## 0.17.1 — 2026-05-18

### Fixed
- **Shared profile links now open correctly.** Opening someone's public
  profile link (`/u/...`) in a fresh browser used to show a "404 — not
  found" error page instead of the profile. The same issue could show the
  error when opening the Privacy Policy or Terms pages by direct link.
  All of these now load properly.

---

## 0.17.0 — 2026-05-18

### Changed
- **Pro is now a one-time $3.99 unlock instead of a subscription.** Pay once
  and it's yours for good — no monthly or yearly charge, nothing to renew,
  and nothing to cancel.
- **Terms of Service and Privacy Policy updated** to match one-time billing.
  Signed-in users will be asked to re-accept on their next visit.

### Added
- **Brackets are here.** Vote in the free weekly community bracket and the
  daily matchup any time. Building your own custom bracket from any songs
  you choose is part of the Pro unlock.
- **"Buy me a coffee"** support link in Settings for anyone who wants to
  chip in — completely optional, no perks attached.

---

## 0.16.0 — 2026-05-16

### Removed
- **Spotify connection has been removed entirely.** Spotify ended the kind
  of API access this app relied on for independent developers, so the
  feature could no longer work for everyone. As a result:
  - Songs no longer play while you rate, and the "Play Bridge" / jump-to-a-
    moment buttons are gone.
  - Real album cover art is gone — every album now shows as its colored
    tile with an emoji, everywhere in the app (home, albums, rankings,
    brackets, the welcome tour, and shareable cards).
  - The Spotify section in Settings, the connect prompts, and the autoplay
    nudges have all been removed.

### Changed
- **Pro now includes the 8 extra rating categories and custom categories.**
  The two Spotify-only Pro perks (songs autoplaying, jumping to specific
  moments) no longer exist, so they've been removed from every place Pro is
  described. Pro pricing is unchanged ($4.99/mo or $46.71/yr).
- The first-time flow is now simply Welcome tour → sign-in prompt → Home.
- Bracket matchups are now read-and-vote (song title + a lyric line) with
  no audio.
- Privacy Policy and Terms updated to drop the Spotify sections. Because
  this changes what third parties are involved, signed-in users will be
  asked to re-accept the updated terms on their next visit.

---

## 0.15.2 — 2026-05-12

### Added
- Bracket screens (Daily Matchup and the full bracket Matchup) now show a
  "Powered by Spotify" attribution strip with the Spotify logo and an
  "Open in Spotify" link whenever Spotify is connected — so the link back
  to Spotify is always one tap away from the playing song.
- The Home album checklist now shows a small "↗" link beside each row that
  displays Spotify-sourced album art, opening that album on Spotify.

### Changed
- Spotify logos that were under the official 21px minimum (in the Daily
  Matchup card, Vibe Check intro, Album mode picker, and Play Bridge
  button) have been raised to the 24px standard. Two leftover inline logo
  copies were consolidated onto the shared Spotify badge component so the
  size rule is enforced from one place.
- "Connecting…" buttons across the Spotify connect flow now use a neutral
  gray loading state instead of a non-standard derived green shade, which
  matches Spotify's brand-color rule that reserves Spotify Green for the
  logo itself.
- The "Powered by Spotify" caption inside the Quick Score mini player is
  slightly larger (10px → 11px) and easier to read.
- The Spotify-white logo variant now renders as a clean white circle with
  cut-out waves on green buttons, instead of the semi-transparent ghost it
  used to render as.
- The Connect-Spotify nudge inside the Album mode picker now sits on a
  clean white panel instead of a green-tinted one — keeps the green
  Spotify logo from sitting on a green-ish background.

### Added
- **Re-accept Terms prompt for future Privacy Policy / Terms of Service
  updates.** When we materially change the Privacy Policy or Terms in
  the future, signed-in users will see a brief "We've updated our
  Terms" prompt on their next visit, with one tap to confirm. The
  prompt includes a short plain-English summary of what changed and
  inline links to read the full text in a new tab. Users who signed
  up before today are grandfathered in — no prompt for this initial
  rollout, since the terms haven't changed since they signed up.

---

## 0.15.0 — 2026-05-12

### Added
- **Privacy Policy and Terms of Service.** Two new public pages at
  `/privacy` and `/terms`, written in plain English. The Privacy Policy
  covers exactly what data the App collects, how it's used, who it's
  shared with (Google, Vercel, Lemon Squeezy, Spotify), your rights to
  access or delete your data, and how AI tools and analytics may be
  used. The Terms of Service cover who can use the App (13+), Pro
  subscription billing and cancellation, public-profile rules, and
  governing law.
- **Legal links in two places.** A small "By signing in, you agree to
  our Terms of Service and Privacy Policy" line on the Google sign-in
  screen, and Privacy Policy · Terms of Service links right under the
  version number at the bottom of Settings.

---

## 0.14.3 — 2026-05-12

### Fixed
- **Spotify no longer leaves a ghost "Eras Ranker" speaker on your
  account after you close the app.** Before this fix, the next time
  you reached for Spotify — Android Auto, CarPlay, the desktop app —
  Spotify Connect would briefly try to route playback to the dead
  in-browser player before giving up, so a song might start playing
  and then stop. The app now properly tells Spotify to remove the
  speaker when you close the tab.

---

## 0.14.2 — 2026-05-12

### Changed
- **Spotify Premium caveat tightened on every Pro-pitch surface that
  was leaking it.** Five places used to pitch autoplay (or "songs play
  while you rate") without mentioning that Spotify Premium is also
  required — which set up Pro subscribers on free Spotify for a
  bait-and-switch. The "You're Pro!" post-upgrade prompt, the
  AlbumModeModal connect-Spotify nudge, the Welcome tour Slide 2,
  and the GoogleLoginPromo footer all now either name the Premium
  requirement explicitly or no longer sell the playback perk in a
  context where Premium can't be confirmed.
- **Welcome tour Slide 2 pitch strengthened.** The Vibe Check card on
  Slide 2 used to mention only autoplay as a Pro perk. It now also
  mentions the per-moment seeking ("jump to any chorus, bridge, or
  line"), matching the broader pitch on every other Pro-pitch surface.

---

## 0.14.1 — 2026-05-12

### Changed
- **Pro pitch reframed around honest scoring.** The "skip to a moment"
  perk used to read like a feature ("Skip to any moment"). It now reads
  as a promise to the user: **"Really sit with each song — skip to the
  chorus, bridge, opening or closing line so the rating you give matches
  the song you actually heard."** Same wording everywhere Pro is pitched.
- **Spotify perks now lead the first-Vibe-Check pitch.** The "Hear it.
  Rate it." screen used to show the two non-Spotify perks (categories,
  custom scoring) first and the playback perks below. Order flipped —
  autoplay and "really sit with each song" are the headline now, since
  they're the perks the screen is actually selling.

### Removed
- **CSV export is no longer a Pro perk.** It was already a free feature
  in Settings → Data — we just shouldn't have been listing it on the
  paywall. Exporting your own ratings is something every user should be
  able to do without paying. The download itself is unchanged; only the
  Pro pitch copy has lost the mention.

---

## 0.14.0 — 2026-05-12

### Added
- **Skip to any moment (Pro).** A new row of "jump-to" pills appears under
  the song's mini player inside Vibe Check for Pro users on Spotify Premium.
  One tap skips straight to the song's opening line, chorus, or closing
  line — no more waiting for the part you want to hear while you rate.
  The existing Play Bridge button on the Bridge category stays exactly
  where it was.

### Changed
- **Pro pitch updated everywhere.** The paywall, the Vibe Check intro, and
  the Pro modal in Settings all now describe Pro's playback perk as
  "Skip to any moment" instead of the bridge-only framing it used before.
  The icon shifted from the bridge 🌉 to the skip-ahead ⏩.

### Fixed
- **Pro + free-Spotify gate tightened.** A Pro user signed into a free
  Spotify account no longer sees the mini player or autoplay-related
  controls light up inside Vibe Check — Pro alone can't deliver playback
  for free Spotify accounts, and the in-app behavior now matches what the
  paywall already promised.

---

## 0.13.1 — 2026-05-12

### Fixed
- **Red album shuffle screen no longer flashes white.** The "Play / Skip"
  question at the start of each song now lets the album's themed backdrop
  show through on Red, Reputation, Lover, Folklore, Evermore, The Tortured
  Poets Department, Life of a Showgirl, and 1989 — previously a generic
  white-to-lavender gradient was painted over the top. Dark-themed albums
  also get light-colored shuffle-screen text so the song title stays
  readable on the deep backdrop.

---

## 0.13.0 — 2026-05-12

### Removed
- **Beta gate is gone.** The full-screen password / Google-allowlist gate
  that previously fronted the app has been removed. New visitors now land
  directly on the Welcome tour, then the Google sign-in pitch, then the
  Spotify connect pitch, and finally Home. Anonymous browsing is allowed —
  signing in is a soft ask, never forced.

### Changed
- **Pro entitlement is now strictly cloud-controlled.** Real subscribers
  get Pro flipped on by the Lemon Squeezy webhook. Comped accounts (e.g.
  early testers) get Pro by having `isPro: true` set manually on their
  user record in the Firebase console. The app no longer carries a
  hardcoded list of email addresses anywhere in its public code.
- The webhook now stamps `proSource: 'lemonsqueezy'` on real subscribers
  so it's obvious in the console which Pro records came from a real
  payment versus a manual grant — useful when auditing or revoking.

### Fixed
- **Security: Pro can no longer be self-granted from the browser.** The
  Firestore rules now block clients from writing any of the Pro/billing
  fields directly. Previously a sufficiently determined user could have
  flipped `isPro` to true via the browser developer tools.
- **Security: subscription-cancel endpoint now verifies ownership.**
  `/api/cancel-subscription` cross-checks with Lemon Squeezy that the
  caller's verified email matches the subscription's email before
  cancelling, so a malicious user can't cancel someone else's
  subscription even if other layers fail.

---

## 0.12.0 — 2026-05-12

### Changed
- **Settings screen redesigned** for a more polished, professional feel.
  A proper "Settings" page title now anchors the screen, sections share
  consistent spacing, and the layout reads more like a modern app.
- The Spotify section now sits higher in the page, just after Public
  profile — closer to where you'd expect a connected service to live.
- The Display section has been renamed to **Preferences** and is the
  new home for "Show welcome tour again" (previously a small loose link
  that lived between Account and Membership).
- Inside Account, Sign out is now visually separated from the more
  serious actions ("Forget me on this device" and "Delete my account")
  by a "Danger zone" divider so they read as a distinct cluster.
- The footer (version number + fan-made disclaimer) is now one tidy
  card at the bottom instead of two competing styles.

### Removed
- The redundant Spotify Premium paragraph that floated below the
  Spotify card — the connect button and connected-state subtitles
  already cover Premium clearly.

---

## 0.11.3 — 2026-05-12

### Changed
- After a successful Pro purchase, the Lemon Squeezy "Thank you / View
  Order" screen no longer appears. The checkout window closes
  automatically and you land right back in the app, where the "You're
  Pro!" celebration and the Connect Spotify prompt take over within a
  couple of seconds.

---

## 0.11.2 — 2026-05-12

### Fixed
- The "🎉 You're Pro!" celebration prompt no longer appears the moment
  you tap Subscribe. It now waits until the payment is actually
  confirmed, so backing out of the credit-card screen no longer leaves
  the celebration prompt hanging around as if you'd paid.

---

## 0.11.1 — 2026-05-12

### Fixed
- The Unlock Pro button now reaches the Lemon Squeezy checkout instead of
  hitting a 404. The Lemon Squeezy checkout URL format uses a different
  path and ID style than the previous version used; this release matches
  what Lemon Squeezy actually expects.

---

## 0.11.0 — 2026-05-12

### Added
- **Membership section in Settings.** A new dedicated home for your Pro
  status, right below Account. Pro members see a status pill (Active,
  Cancelling, or Payment failed), their plan and price, the next renewal
  date, the perks they're using, and a one-tap link to manage the
  subscription. Free members see a quick comparison of monthly vs. annual,
  the full perk list, and an Unlock Pro button. Signed-out users get a
  short pitch and a Sign in with Google button.
- CSV export now appears in the perk list of the Vibe Check intro and the
  Pro upgrade modal alongside the existing categories and playback perks,
  so every Pro pitch surface tells the same story.

### Changed
- The "Manage subscription" link previously buried inside the Account card
  moved to the new Membership section. Account is now identity-only
  (avatar, email, sign out, forget me, delete account).

---

## 0.10.1 — 2026-05-10

### Fixed
- The Red and 1989 album themes listed under 0.10.0 didn't actually make it into the deploy — the new theme files were missing from the merge to `main`. This release fixes that: the autumn Red world, NYC 1989 world, All Too Well snowfall, Welcome to New York neon bloom, and the new "Your top 3" album-complete card are now live.

---

## 0.10.0 — 2026-05-10

### Added
- Red album: rating screen now plays inside an autumn ambient scene — burgundy backdrop, drifting maple leaves, faint typewriter-character flickers, and a knit-scarf silhouette. Stars turn gold-on-burgundy. Finishing All Too Well triggers a 6-second dark wash with snowflakes falling.
- 1989 album: rating screen now plays inside a NYC ambient scene — pale-sky-to-pink backdrop, Manhattan skyline silhouette across the bottom, eight floating polaroids (taxi, bridge, statue, skyline, subway, Empire State, coffee, manhole steam), drifting seagulls, and pink/cyan glitter. Stars turn sky-blue. Finishing Welcome to New York triggers a 3-second magenta+cyan neon bloom with a "WELCOME TO NEW YORK" wordmark burst.
- New "Your top 3 from {albumName}" album-complete card for Red and 1989. Shows album emoji, top-3 rank/title/score, and a "See full album scores ↗" pill. For Red, leaves blow through in front of the card; for 1989, polaroids deal in behind it.

### Changed
- The shuffle screen (Play/Skip question) now shows "Category 1 of N" so it's
  obvious you're partway through a multi-question rating, not a one-tap choice.
- The 5 default rating categories no longer have a "Skip" button — every song
  now gets rated on the same baseline so leaderboards and album scores are
  honest comparisons. (The Bridge category still auto-skips for songs that
  don't have a bridge.)
- On Pro extra and custom categories, the secondary "Skip →" pill has been
  renamed to "No opinion" so it can't be confused with the Play/Skip answer
  on the shuffle screen.
- All ambient and signature animations in the new themes respect the OS "reduce motion" preference (animations only run under `prefers-reduced-motion: no-preference`).

---

## 0.9.0 — 2026-05-10

### Added
- A small floating feedback button now appears in the bottom-right corner of
  every screen for signed-in users. Tap it to send a short note about a bug or
  idea — the app records which screen you were on and saves it to a private
  feedback collection that only the developer can read.

---

## 0.8.3 — 2026-05-10

### Changed
- Beta testers now have Pro unlocked automatically — anyone on the
  `BETA_EMAILS` allowlist gets all Pro features (autoplay, Play Bridge, extra
  categories, custom categories, CSV export) without paying. The override
  applies only while the beta is closed and goes away when the beta gate is
  removed at launch.

---

## 0.8.2 — 2026-05-10

### Changed
- **Beta access allowlist moved to code.** The beta tester email list now
  lives in `src/data/betaEmails.js` instead of the `VITE_BETA_EMAILS`
  environment variable. Adding or removing testers is now a code change
  and deploy instead of a Vercel dashboard trip. Password bypass
  (`VITE_BETA_PASSWORD`) unchanged.

---

## 0.8.1 — 2026-05-09

### Added
- **Custom Lover album landing screen.** Tapping Lover from the album
  grid now opens a fully themed page: cotton-candy gradient backdrop
  (pink → peach → lavender → powder blue), drifting pink/blue/lavender
  butterflies, soft heart confetti rising from the bottom, and a faint
  pastel rainbow arc across the top. The album hero, score number,
  progress bar, top-song chip, and the Vibe Check / Rank by score /
  Share rankings buttons all swap from the standard purple palette to
  Lover's rose-pink. Other albums are unchanged.

---

## 0.8.0 — 2026-05-07

### Added
- **Six new album themes — first rough draft.** Backgrounds and ambient
  effects now adapt for Reputation, Lover, Folklore, Evermore, The
  Tortured Poets Department, and The Life of a Showgirl. Highlights:
  - **Reputation:** matte-black backdrop with a snake silhouette
    slithering along the bottom and white ink-splatter pulses scattered
    across the screen. Neon-cyan category labels for sharp contrast.
  - **Lover:** cotton-candy gradient with a pastel rainbow ribbon
    arcing across the top and small floating hearts in pink, peach,
    and lavender drifting up.
  - **Folklore:** misty grey-green backdrop with slow fog wisps
    drifting horizontally and pine-needle silhouettes drifting down.
  - **Evermore:** deep amber-and-burgundy backdrop with autumn leaves
    falling in oranges, browns, and deep reds — the visual sister to
    Folklore but autumn-toned.
  - **The Tortured Poets Department:** parchment cream fading to ink
    black, with typewriter carets blinking at random spots and small
    ink drips fading in and out. Serif-weighted titles.
  - **The Life of a Showgirl:** rich magenta-and-gold cabaret backdrop
    with a spotlight cone sweeping back and forth and sequin glitter
    that catches the light. Bright gold category labels.
- **Five new song-signature moments** triggered when you finish rating
  the named song:
  - **Look What You Made Me Do (Reputation):** stars flicker like a
    broken neon sign, then snap to red.
  - **Cruel Summer (Lover):** stars heat-shimmer and bloom into a
    pink-orange sunset.
  - **August (Folklore):** a single bright golden sun-flare arcs
    across the top of the screen; stars warm to amber.
  - **Marjorie (Evermore):** stars dim and a soft white halo fades
    around each — a candlelight tribute.
  - **The Tortured Poets Department (TPD title track):** stars fade
    out one by one, then "the manuscript" appears in cursive ink.
- **Album-complete decorations** that play behind the completion card:
  - **Reputation:** a soft stage-light spot pulses behind the card.
  - **Lover:** the cursive *Lover* logotype briefly fades in.
  - **Folklore:** pine-needle snow rains down across the screen.
  - **Evermore:** a handwritten *evermore* fades in then back out.
  - **TPD:** a parchment overlay fades in with the line "The story
    isn't mine anymore..." in typewriter font.
  - **Showgirl:** a red velvet curtain slides closed across the screen
    as the card arrives.

### Notes
- This is a first rough draft. Visual polish is intentionally light;
  individual scenes (snake silhouette, ink blots, fog wisps, etc.) are
  basic CSS-only renders and will likely get refined in follow-ups
  based on feel-test feedback.

---

## 0.7.2 — 2026-05-07

### Changed
- **Cleaner copy on the post-login Spotify intro screen.** The pitch
  now reads "Connect Spotify and every album in the app will show
  the real album cover. A free Spotify account is enough for album
  art; Spotify Premium is required if you also want songs to play
  in-app." — drops the welcome-tour aside and the softer "only"
  wording so the value prop lands more directly.

---

## 0.7.1 — 2026-05-07

### Changed
- **Spotify integration tightened up to match Spotify's published rules.**
  A handful of small but real compliance issues were fixed so the app is
  ready to be pointed at real users without breaking Spotify's terms:
  - **"Album art from Spotify" + an "Open in Spotify" link now appear
    everywhere album covers do.** Previously this was only on the mini
    player and a couple of leaderboards. Now the album grid, the album
    detail header, and the welcome tour all show the attribution, and
    each cover in the grid (and detail page) has a small ↗ link that
    opens the album directly in Spotify.
  - **Album art + track URIs now refresh every 24 hours.** Spotify
    requires that cached metadata be refreshed at least once a day.
    Old entries are dropped quietly on app load and re-fetched the
    next time you open the relevant screen — no visible difference
    unless you'd been offline for a long stretch.
  - **Spotify green is now reserved for the Spotify logo itself.**
    The "Try it on the next song" button in the autoplay nudge and
    the in-app volume slider both used Spotify green, which Spotify
    reserves for their own branding. Both now use the app's purple
    instead. The actual "Connect Spotify" buttons remain green —
    that's the one branded button pattern Spotify allows.
  - **The two "Spotify Premium →" links in Settings are no longer
    Spotify-green.** Same reason — green is for the logo, not for
    arbitrary text links. They're now a neutral underlined grey.
  - **Spotify logo bumped to 24px everywhere.** The autoplay nudge
    button had a 20px logo, smaller than both Spotify's recommended
    floor and the project's own minimum. Default size lifted from 22
    to 24 across the app.

### Fixed
- **Spotify rate-limit handling.** API calls now respect the
  `Retry-After` header returned during rate-limited periods, retrying
  once after the suggested wait. The album-art prefetch on connect
  also paces itself between requests so it stops hammering Spotify
  with 13 simultaneous searches.

---

## 0.7.0 — 2026-05-07

### Added
- **Spotify Premium detection.** When you connect your Spotify
  account, the app now asks Spotify whether your account is Premium
  or free. The rest of the app adapts: free Spotify users get album
  art across the app and aren't pitched in-app autoplay (since Pro
  alone can't unlock it for them), while Premium users see the full
  Pro funnel that includes autoplay and "jump to the bridge."

### Changed
- **Pro pitch is honest about what each user actually gets.**
  - The first-Vibe-Check Pro screen, the Categories paywall, and the
    Settings Pro modal all hide the autoplay / jump-to-bridge perks
    when we know your Spotify account is free, so we never sell a
    feature you can't use.
  - The Settings → Spotify connected row now reads "Album art only —
    Spotify Premium is needed for in-app playback" for free Spotify
    accounts, with a link out to spotify.com/premium. The autoplay,
    bridge autoplay, and volume controls are hidden for those users
    (they don't do anything without Premium).
  - The post-login Spotify intro screen now spells it out: "A free
    Spotify account is enough for album art; Spotify Premium is only
    required if you also want songs to play in-app."

### Fixed
- **Free Spotify accounts no longer get force-disconnected.** The
  Web Playback SDK only works for Spotify Premium accounts, but the
  old code was kicking in the SDK for everyone, hitting an auth error
  on free accounts, and then disconnecting them entirely — so they
  lost their album art mid-fetch and saw an alarming error message.
  Now we detect Premium upfront and skip the doomed SDK init for
  free accounts; they stay connected for album art and the rest of
  the app adjusts gracefully.
- **30-song autoplay nudge no longer pops for free Spotify users.**
  The pop-up that says "want to try Pro autoplay on the next song?"
  was triggering for connected free-Spotify users — but Pro alone
  can't grant them autoplay, so the demo wouldn't actually do
  anything. The nudge now only fires for Premium accounts.

---

## 0.6.0 — 2026-05-07

### Changed
- **New onboarding order.** After the Welcome tour, users now see a
  dedicated "Sign in with Google" screen explaining that an account
  keeps their rankings on every device. Users who decline with "Not
  now" can keep using the app anonymously and sign in any time later
  from Settings. The Spotify "real album art" pitch now comes after
  Google sign-in (only for signed-in users) instead of before the
  Welcome tour.

### Added
- **GoogleLoginPromo screen.** Full-screen sign-in pitch with the
  Google branded button as the primary action and a smaller "Not now"
  bypass below it. Auto-skips when a Google account is already
  connected so it never reappears for returning users.

---

## 0.5.2 — 2026-05-07

### Changed
- **Welcome tour "Two ways to rank" cards are now tappable.** Tapping
  either the Vibe Check or Sort It Yourself preview card advances the
  tour, instead of forcing you down to the Next button at the bottom.
  These previews already mirror the buttons you'll tap in the album-mode
  picker, so they should behave like buttons.
- **Welcome tour album carousel is ~30% faster.** Each album now sits
  on screen for about 2.9 seconds instead of 3.8, so you reach the
  end of the rotation noticeably quicker without losing readability.

### Fixed
- **Welcome tour "Sort It Yourself" preview no longer overlaps rows.**
  The animated demo where "Cruel Summer" jumps to the top was sliding
  too far up — it ended up bumping into the song below it. The slide
  distance now respects the gap between rows, so the moved row lands
  cleanly in the top slot.
- **Star animation looks right when you re-rate a category.** If you
  previously gave a song 5 stars and you re-rate down to 3, only the
  first 3 stars now stay highlighted during the post-pick flash —
  instead of leaving the old stars 4 and 5 still purple alongside the
  new ones.

---

## 0.5.1 — 2026-05-07

### Fixed
- **Fearless Play/Skip screen showed a white bar over the gold backdrop.**
  The shuffle screen had its own opaque white→lavender gradient that
  wasn't aware of the Fearless theme, so the warm golden-hour
  background only peeked out at the top progress bar and the bottom
  status bar — the middle of the screen looked washed out. Fixed by
  letting the Fearless theme bleed through, same as Midnights, Debut,
  and Speak Now already did.

---

## 0.5.0 — 2026-05-07

### Added
- **Connect Spotify is free for everyone.** Connecting your Spotify
  account no longer requires Pro — it gives you real album cover art
  across the whole app (the album grid, your rankings, the welcome
  tour carousel). The in-app playback features (autoplay, jump to the
  bridge) remain Pro perks, but the connection itself is free.
- **New post-login Spotify intro screen.** Right after you sign in
  with Google for the first time, a single screen asks if you want
  to connect Spotify and explains that it pulls in real album art.
  Skip-able; you can always connect later from Settings.
- **Welcome tour now uses real album art when connected.** The slowly
  rotating carousel on slide 1 shows the real Spotify cover for any
  album whose art has been fetched, falling back to the emoji tile
  otherwise. Slide 2's Vibe Check card now has a dedicated purple
  "PRO" pill so the autoplay benefit reads as a feature, not a
  footnote.
- **Soft Pro upsell at ~30 songs rated.** Once a Spotify-connected
  free user has rated about 30 songs, a friendly bottom-sheet pops
  between songs offering a free taste of Pro autoplay. Tap "Try it
  on the next song" and the next song plays automatically for the
  rest of that session as a preview of what Pro feels like. Tap
  "Maybe later" and nothing changes. Either way, the prompt only
  appears once.
- **"Share rankings" button on every album page.** As soon as you've
  rated at least 2 songs on an album, a Share button appears below
  the action buttons so you can share your in-progress ranking card.
  No more waiting for full album completion to share.

### Changed
- **Settings → Spotify is now visible to everyone.** Free users see
  the Connect/Disconnect controls. The autoplay, bridge autoplay, and
  volume controls show with a small "PRO" badge and route taps to
  the upgrade modal — so the perk is visible, not hidden.
- **Pro pitch copy reworded everywhere it appears.** The PaywallCard,
  Settings ProModal, VibeCheckIntro, ConnectSpotifyPrompt, and
  AlbumModeModal all now describe Pro as "songs autoplay while you
  rate" plus "jump to the bridge", rather than implying connection
  itself is paid. The Spotify Premium footnote in VibeCheckIntro
  clarifies connection is free; Premium is only required for
  in-app playback.

---

## 0.4.1 — 2026-05-06

### Added
- **Fearless album theme.** Rating songs on Fearless now switches the
  whole screen to a soft golden-hour gradient with little gold glitter
  motes drifting slowly upward. The category label uses a warm amber so
  it reads richly against the honey-coloured backdrop.
- **Love Story horse moment.** When you finish rating Love Story, a
  small white horse gallops across the bottom of the screen leaving a
  soft fade trail — about a two-second cameo, then it's back to the
  normal flow.
- **Album-complete fireworks.** Finishing a full Fearless rating
  session pops a brief golden firework crackle behind the "All done!"
  card before it fades.

---

## 0.4.0 — 2026-05-06

### Added
- **Real subscription billing via Lemon Squeezy.** The "Subscribe — $4.99/month" /
  "$46.71/year" buttons now open a real Lemon Squeezy checkout overlay
  instead of granting Pro for free. Pay with a card, and Pro activates
  within a few seconds of the payment going through. Existing mock-Pro
  fallback is preserved for local dev.
- **"Manage subscription" link in Settings → Account.** Once you're Pro,
  a small purple-tinted row appears with a link to the Lemon Squeezy
  customer portal where you can update your card, view invoices, or
  cancel. Cancelled subscriptions show a "Cancels on {date}" line so you
  know exactly when access ends.
- **"Processing your payment…" banner.** A slim purple bar at the top of
  the app is shown for the few seconds between checkout completing and
  the webhook activating Pro. Clears automatically when Pro flips on, or
  after 90 seconds if something goes wrong.

### Changed
- **Pro state is now real-time.** When the Lemon Squeezy webhook updates
  your account, the UI flips to Pro within a second or two without
  needing a refresh. Subscription cancellations and payment changes
  flow through the same way.

---

## 0.3.0 — 2026-05-05

### Added
- **Delete my account.** New option in **Settings → Account** below
  "Forget me on this device." Walks through a clear three-step flow:
  what will be wiped (with a reminder to export your CSV first), a final
  "I understand" checkbox, and a goodbye screen once it's done. Removes
  your ratings, brackets, public profile, Pro subscription, and Firebase
  account in one go. Required for legal compliance (GDPR / CCPA) before
  the public launch.

## 0.2.1 — 2026-05-05

### Changed
- **Brackets tab hidden until phase 2.** The Brackets tab is no longer shown
  in the main navigation. The feature is still in development (community vote
  tallies, audio playback in matchups, and trivia fact-checking aren't ready
  yet) and will return in a later release. All underlying code is preserved
  — the tab can be flipped back on with a single flag in `src/App.jsx`.

---

## 0.2.0 — 2026-05-04

### Added
- **Public profile (anyone-with-link sharing).** New section under
  **Settings → Public profile** lets a signed-in user flip a switch and
  share their album rankings via a `/u/{uid}` URL. Default is **off** for
  every account; only people with the link can view a profile (no public
  listing or directory). Optional 140-char bio with a profanity filter and
  no links allowed. Backed by a new `profiles/{uid}` Firestore collection
  with public-read security rules — see CLAUDE.md for the rules to apply
  in the Firebase console.

### Notes
- Vanity handles (`/u/{your-name}`) are not in this release. The full plan
  for that and other follow-on profile work is captured in CLAUDE.md and
  the original scope discussion.

---

## 0.1.0 — 2026-05-04

First versioned release. Captures the state of the app since the beta gate
went up. Earlier work isn't itemised here — see the git log for full history.

### Added
- Versioning system with this changelog and a version label in **Settings → About**.
- Custom **ConfirmModal** component replacing OS-native `window.confirm()` dialogs
  (used by "Rank by score" and "Clear bracket data" prompts).
- **Spinner** loading indicator in the Connect-Spotify buttons and the Spotify
  mini-player while the connection is establishing.
- **× dismiss button** on the Daily Matchup prompt — hides the card for the
  rest of the day (resets at midnight).
- **VibeCheckIntro** screen: full Pro feature list in one box with a footnote
  spelling out the Spotify Premium requirement.
- **Forget me on this device** option in the Account section — clears the
  local copy without touching the cloud record.

### Changed
- "★ Score Album" button renamed to **★ Vibe Check** for consistency with the
  rest of the flow.
- Song rows no longer show abbreviated category labels by default. Tap a row
  to expand it; categories now display full names with `N/5` for stars,
  `Y`/`N` for custom yes/no categories, and a Play / Skip pill for
  "Skip on shuffle?".
- **Rankings → Songs** view no longer caps at 20 — every rated song is shown.
- Account section "Sign out" button is now neutral rather than red, with a
  subtitle clarifying that cloud data is preserved.
