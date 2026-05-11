import { useState, useEffect, useRef } from 'react';
import { getBridgeLyrics, getSnippetLyrics, hasBridge } from '../data/lyricsAccess';
import { DEFAULT_CATEGORIES } from '../data/categories';
import SpotifyMiniPlayer from './SpotifyMiniPlayer';
import AutoplayNudge, { hasSeenAutoplayNudge, markAutoplayNudgeSeen } from './AutoplayNudge';
import { getAlbumTheme } from '../themes/albumThemes';

// IDs of the 5 default categories. Used to enforce "every song is rated on
// the same baseline" — Skip is hidden on these so the score is comparable.
const DEFAULT_CAT_IDS = new Set(DEFAULT_CATEGORIES.map(c => c.id));

// Threshold for the soft autoplay Pro upsell. Anchored at 30 — the trigger
// fires the next time we transition between songs once totalRatings ≥ this,
// which lets a vibe-check session finish naturally and pushes the actual
// nudge into the 25–35-song window depending on how many songs are in flight.
const AUTOPLAY_NUDGE_THRESHOLD = 30;

// Calibration phrases for each category × star level (index 0 = ★1).
// Goal: make ★1–★2 feel like valid, honest ratings — not insults.
const STAR_LABELS = {
  lyrics: [
    'Filler words',
    'Gets the point across',
    'Some good lines',
    'Clever and quotable',
    'Rewrites poetry',
  ],
  music: [
    'Forgettable production',
    'Standard backdrop',
    'Solid production',
    'Really draws you in',
    "Can't get it out of your head",
  ],
  bridge: [
    "Doesn't land",
    'Just a transition',
    'Decent shift',
    'Changes the whole song',
    'Best part by far',
  ],
  nostalgia: [
    'No personal connection',
    'Vaguely familiar',
    'Takes you back a bit',
    'Tied to a real memory',
    'Instantly transported',
  ],
  replay: [
    'Likely to skip.',
    'Rarely comes back to it',
    'On rotation sometimes',
    'Hard to skip',
    'Stuck on repeat',
  ],
  hook: [
    "Doesn't stick",
    'Easy to forget',
    'Solid and singable',
    'Stuck in your head',
    'Legendary chorus',
  ],
  vocals: [
    'By the numbers',
    'Clean but flat',
    'Controlled and clear',
    'Emotionally charged',
    'Gives you chills',
  ],
  cry: [
    'Completely dry-eyed',
    'A little heavy',
    'Lump in your throat',
    'Eyes are watering',
    'Full ugly cry',
  ],
  romantic: [
    'No romantic pull',
    'Mildly sweet',
    'Genuinely romantic',
    'Makes your heart ache',
    'Peak swoon',
  ],
  hype: [
    'No energy',
    'Low-key only',
    'Gets you moving a little',
    'Hard to stay still',
    'Full dance mode',
  ],
  opening: [
    'Slow start',
    'Takes a minute to hook',
    'Decent opener',
    'Hooked immediately',
    'Iconic first line',
  ],
  vibe: [
    'Thin or generic',
    'Some atmosphere',
    'Consistent vibe',
    'Fully immersive',
    'Its own universe',
  ],
  storytelling: [
    'No clear narrative',
    'Impressions only',
    'Clear enough story',
    'Vivid and specific',
    'Cinematic',
  ],
};

// Distinct background gradient per category — lets the user immediately know
// which category they're rating just from the screen color.
const CAT_BACKGROUNDS = {
  lyrics:      'linear-gradient(160deg, #fdf4ff 0%, #f3e8ff 100%)', // lavender
  music:       'linear-gradient(160deg, #eff6ff 0%, #dbeafe 100%)', // blue
  bridge:      'linear-gradient(160deg, #f0fdfa 0%, #ccfbf1 100%)', // teal
  nostalgia:   'linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)', // amber
  hook:        'linear-gradient(160deg, #fff1f2 0%, #ffe4e6 100%)', // rose
  vocals:      'linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 100%)', // sky
  cry:         'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)', // slate
  romantic:    'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 100%)', // pink
  hype:        'linear-gradient(160deg, #fff7ed 0%, #fed7aa 100%)', // orange
  opening:     'linear-gradient(160deg, #f0fdf4 0%, #dcfce7 100%)', // green
  vibe:        'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)', // indigo
  storytelling:'linear-gradient(160deg, #fefce8 0%, #fef9c3 100%)', // yellow
};

// Deep-night gradient used as the QuickScore background while rating Midnights.
const NIGHT_BACKGROUND =
  'linear-gradient(180deg, #0b0b2e 0%, #1a1849 45%, #0d0d35 100%)';

// Cream-and-grain backdrop for Taylor Swift (Debut) — base gradient layered
// with two faint diagonal stripe patterns so the surface reads as warm guitar
// wood without overpowering the rating UI.
const DEBUT_BACKGROUND =
  // Subtle wood-grain stripes — alpha kept low so the cream stays warm.
  'repeating-linear-gradient(95deg, rgba(146, 89, 26, 0.05) 0px, rgba(146, 89, 26, 0.05) 1px, transparent 1px, transparent 6px), ' +
  'repeating-linear-gradient(95deg, rgba(146, 89, 26, 0.04) 0px, rgba(146, 89, 26, 0.04) 2px, transparent 2px, transparent 17px), ' +
  // Base cream gradient — the actual album color.
  'linear-gradient(180deg, #fdf6e3 0%, #faeeda 50%, #fff7e0 100%)';

// Enchanted-purple gradient for Speak Now — light at the top, drifting into
// deeper amethyst toward the bottom so the scene has somewhere for petals
// and candle-glow to feel "lit from within."
const SPEAKNOW_BACKGROUND =
  'linear-gradient(180deg, #f5f3ff 0%, #ddd6fe 55%, #c4b5fd 100%)';

// Golden-hour gradient used as the QuickScore background while rating Fearless.
// Soft cream at the top, mid-honey, and a softened amber at the bottom — keeps
// dark text legible up top and matches the album's late-afternoon-warmth mood.
const FEARLESS_BACKGROUND =
  'linear-gradient(180deg, #fff8e1 0%, #fde68a 55%, #fcd34d 100%)';

// Reputation — matte-black with a subtle grey gradient. Reads as the "after-hours,
// bad-reputation" album: stark, neon-friendly, ink-on-black aesthetic. Star labels
// and category text get neon-cyan accents (set in the per-theme tuning block).
const REPUTATION_BACKGROUND =
  'linear-gradient(180deg, #0a0a0a 0%, #1c1c1c 55%, #0a0a0a 100%)';

// Lover — cotton-candy pastel. Pink → peach → lavender, soft and bright.
const LOVER_BACKGROUND =
  'linear-gradient(180deg, #fce7f3 0%, #fbcfe8 50%, #e9d5ff 100%)';

// Folklore — misty grey-green with a faint film-grain feel. Backed by the
// fog wisps + pine needles in FolkloreScene.
const FOLKLORE_BACKGROUND =
  'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 55%, #94a3b8 100%)';

// Evermore — deep amber and burgundy. Sister-album to Folklore but autumn-toned.
const EVERMORE_BACKGROUND =
  'linear-gradient(180deg, #422006 0%, #7c2d12 50%, #92400e 100%)';

// The Tortured Poets Department — parchment cream fading to ink black.
// Visually splits the screen into "page" and "ink" halves. Title and labels
// switch to serif weights in the per-theme tuning block to lean literary.
const TPD_BACKGROUND =
  'linear-gradient(180deg, #f5f5f0 0%, #e7e5e4 60%, #1c1917 100%)';

// The Life of a Showgirl — rich magenta-and-gold cabaret. Spotlight + sequin
// glitter render on top via ShowgirlScene; album-complete pulls a red velvet
// curtain across the screen.
const SHOWGIRL_BACKGROUND =
  'linear-gradient(180deg, #831843 0%, #be185d 50%, #d97706 100%)';

// ── Night sky decoration (Midnights album theme) ─────────────────────────────
// Crescent moon in the upper-right corner + a sprinkle of twinkling stars.
// CSS-only — animation runs through @keyframes injected near the moon SVG so
// no React state churns during the rating flow.
// 18 twinkling stars + 3 fresh ones for ~17% more density, plus 4 of them
// flagged `constant: true` so they read as steady-lit anchor stars rather
// than blinking decoration.
const NIGHT_STARS = [
  { top: '8%',  left: '12%', size: 6, delay: '0s'   },
  { top: '14%', left: '32%', size: 4, delay: '1.4s' },
  { top: '6%',  left: '60%', size: 5, delay: '0.6s', constant: true },
  { top: '22%', left: '74%', size: 3, delay: '1.9s' },
  { top: '18%', left: '46%', size: 5, delay: '0.9s' },
  { top: '28%', left: '18%', size: 4, delay: '0.3s' },
  { top: '34%', left: '38%', size: 3, delay: '1.6s' },
  { top: '40%', left: '8%',  size: 5, delay: '0.7s', constant: true },
  { top: '44%', left: '88%', size: 4, delay: '1.2s' },
  { top: '55%', left: '20%', size: 3, delay: '2.1s' },
  { top: '60%', left: '56%', size: 5, delay: '0.4s' },
  { top: '64%', left: '82%', size: 4, delay: '1.7s', constant: true },
  { top: '72%', left: '14%', size: 3, delay: '0.8s' },
  { top: '78%', left: '40%', size: 5, delay: '1.3s' },
  { top: '84%', left: '70%', size: 4, delay: '0.2s' },
  { top: '90%', left: '24%', size: 3, delay: '1.0s' },
  { top: '92%', left: '54%', size: 4, delay: '1.8s' },
  { top: '88%', left: '88%', size: 5, delay: '0.5s' },
  // +3 new stars for added density
  { top: '12%', left: '88%', size: 4, delay: '1.5s' },
  { top: '50%', left: '42%', size: 3, delay: '0.6s', constant: true },
  { top: '70%', left: '62%', size: 4, delay: '1.1s' },
];

function NightSky() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-night-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50%      { opacity: 1;    transform: scale(1.1); }
        }
        @keyframes qs-night-moon-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(252, 211, 77, 0.35)); }
          50%      { filter: drop-shadow(0 0 14px rgba(252, 211, 77, 0.55)); }
        }
      `}</style>

      {/* Crescent moon — upper right */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        style={{
          position: 'absolute',
          top: 36,
          right: 28,
          animation: 'qs-night-moon-glow 4s ease-in-out infinite',
        }}
      >
        <defs>
          <radialGradient id="qs-moon-grad" cx="0.4" cy="0.4" r="0.7">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="60%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>
        <path
          d="M44 12 a 22 22 0 1 0 8 38 a 17 17 0 1 1 -8 -38 z"
          fill="url(#qs-moon-grad)"
        />
      </svg>

      {/* Twinkling stars (and a handful of constant-lit ones for steady glow) */}
      {NIGHT_STARS.map((s, i) => (
        <svg
          key={i}
          width={s.size * 2}
          height={s.size * 2}
          viewBox="0 0 24 24"
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            opacity: s.constant ? 0.85 : 0.3,
            animation: s.constant ? undefined : `qs-night-twinkle 3s ${s.delay} ease-in-out infinite`,
            filter: s.constant ? 'drop-shadow(0 0 4px rgba(255,255,255,0.45))' : undefined,
          }}
        >
          <path
            fill="#ffffff"
            d="M12 2l1.6 6L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"
          />
        </svg>
      ))}
    </div>
  );
}

// ── Taylor Swift (Debut) ambient scene ───────────────────────────────────────
// Gentle, low-opacity decoration over the cream guitar-wood backdrop:
//  • Faint stadium silhouette across the bottom (high-school football vibe)
//  • A few drifting boots
//  • Two carved-into-wood hearts: "Taylor + Travis" and "87 ♥ 89" — the
//    second nods to Travis's jersey number and the 1989 album year
//  • Tiny blue glitter dots that twinkle
// All elements are CSS animation only — no React state, no per-frame re-renders.

const DEBUT_BOOTS = [
  { top: '12%', left: '8%',  delay: '0s'   },
  { top: '32%', left: '85%', delay: '1.8s' },
  { top: '60%', left: '6%',  delay: '0.9s' },
];

// Hearts use one of two text styles: 'name' for "Taylor + Travis" and
// 'numbers' for the jersey-style "87 ♥ 89". Each heart is sized to fit
// its longer text so nothing gets clipped.
const DEBUT_HEARTS = [
  { top: '18%', left: '66%', delay: '0.4s', rotate: -7, kind: 'name'    },
  { top: '54%', left: '8%',  delay: '1.2s', rotate: 5,  kind: 'numbers' },
];

const DEBUT_GLITTER = [
  { top: '6%',  left: '24%', size: 4, delay: '0s'   },
  { top: '11%', left: '54%', size: 3, delay: '0.6s' },
  { top: '17%', left: '88%', size: 4, delay: '1.4s' },
  { top: '24%', left: '40%', size: 3, delay: '0.3s' },
  { top: '30%', left: '64%', size: 4, delay: '1.9s' },
  { top: '38%', left: '20%', size: 3, delay: '0.7s' },
  { top: '42%', left: '52%', size: 4, delay: '1.1s' },
  { top: '48%', left: '78%', size: 3, delay: '0.2s' },
  { top: '52%', left: '38%', size: 3, delay: '1.6s' },
  { top: '58%', left: '70%', size: 4, delay: '0.5s' },
  { top: '64%', left: '50%', size: 3, delay: '1.3s' },
  { top: '70%', left: '20%', size: 4, delay: '0.8s' },
  { top: '74%', left: '88%', size: 3, delay: '2.0s' },
  { top: '80%', left: '36%', size: 3, delay: '1.5s' },
  { top: '85%', left: '64%', size: 4, delay: '0.4s' },
];

function DebutScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-debut-drift {
          0%, 100% { transform: translateY(0)    rotate(var(--qs-rot, 0deg)); }
          50%      { transform: translateY(-12px) rotate(var(--qs-rot, 0deg)); }
        }
        @keyframes qs-debut-glint {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }
      `}</style>

      {/* Stadium silhouette — sits along the bottom, low opacity so it
          reads as memory rather than illustration. */}
      <svg
        viewBox="0 0 600 80"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 80,
          opacity: 0.18,
        }}
      >
        {/* Light poles */}
        <rect x="40"  y="8"  width="2" height="72" fill="#3f2f1a" />
        <rect x="22"  y="6"  width="38" height="6"  fill="#3f2f1a" rx="1" />
        <rect x="240" y="4"  width="2" height="76" fill="#3f2f1a" />
        <rect x="222" y="2"  width="38" height="6"  fill="#3f2f1a" rx="1" />
        <rect x="440" y="10" width="2" height="70" fill="#3f2f1a" />
        <rect x="422" y="8"  width="38" height="6"  fill="#3f2f1a" rx="1" />
        {/* Bleachers — sloped lines */}
        <path d="M0 78 L120 56 L240 60 L360 50 L480 58 L600 52 L600 80 L0 80 Z" fill="#3f2f1a" />
      </svg>

      {/* Drifting boots */}
      {DEBUT_BOOTS.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: b.top,
            left: b.left,
            fontSize: 30,
            opacity: 0.32,
            animation: `qs-debut-drift 6s ${b.delay} ease-in-out infinite`,
          }}
        >
          🥾
        </div>
      ))}

      {/* Carved-in-wood hearts — styled like notches whittled into a
          guitar's body. Warm wood tones rather than marker red, with a
          highlight + shadow stroke pair to read as a chiseled groove. */}
      {DEBUT_HEARTS.map((h, i) => {
        const isName = h.kind === 'name';
        const w = isName ? 124 : 96;
        return (
          <svg
            key={i}
            width={w}
            height={Math.round(w * 0.78)}
            viewBox="0 0 160 130"
            style={{
              position: 'absolute',
              top: h.top,
              left: h.left,
              opacity: 0.7,
              // Pass per-instance rotation through a CSS variable so the
              // drift keyframe can preserve it instead of zeroing it.
              '--qs-rot': `${h.rotate}deg`,
              animation: `qs-debut-drift 7s ${h.delay} ease-in-out infinite`,
            }}
          >
            {/* Carved heart — darker walnut interior, cream highlight on
                the upper-left edge to suggest a chiseled bevel. */}
            <path
              d="M80 116 C 24 84, 12 54, 22 32 C 34 8, 64 8, 80 38 C 96 8, 126 8, 138 32 C 148 54, 136 84, 80 116 Z"
              fill="#5a3413"
              stroke="#3b1f08"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Cream highlight stroke along the inside upper edge */}
            <path
              d="M30 36 C 38 18, 60 14, 76 36"
              fill="none"
              stroke="#fde68a"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.55"
            />
            {/* Inscribed text. For the numbers heart the small heart glyph
                sits between the two jersey numbers. */}
            {isName ? (
              <text
                x="80"
                y="74"
                textAnchor="middle"
                fontFamily="'Brush Script MT', 'Snell Roundhand', cursive"
                fontSize="26"
                fontWeight="700"
                fill="#fef3c7"
                style={{ paintOrder: 'stroke', stroke: '#3b1f08', strokeWidth: 2 }}
              >
                Taylor + Travis
              </text>
            ) : (
              <text
                x="80"
                y="74"
                textAnchor="middle"
                fontFamily="'Brush Script MT', 'Snell Roundhand', cursive"
                fontSize="32"
                fontWeight="700"
                fill="#fef3c7"
                style={{ paintOrder: 'stroke', stroke: '#3b1f08', strokeWidth: 2 }}
              >
                87 ♥ 89
              </text>
            )}
          </svg>
        );
      })}

      {/* Tiny blue glitter dots */}
      {DEBUT_GLITTER.map((g, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: g.top,
            left: g.left,
            width: g.size,
            height: g.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #93c5fd 0%, #3b82f6 100%)',
            boxShadow: '0 0 4px rgba(59,130,246,0.6)',
            opacity: 0.5,
            animation: `qs-debut-glint 2.6s ${g.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Speak Now ambient scene ──────────────────────────────────────────────────
// Floating violet petals (sway + rotate), warm candelabra glow points
// pulsing at irregular intervals, and a sparse layer of pale glitter.

const SPEAKNOW_PETALS = [
  { top: '6%',  left: '14%', size: 22, delay: '0s',   rotate: -18, dur: 5500 },
  { top: '12%', left: '78%', size: 18, delay: '1.2s', rotate: 22,  dur: 6200 },
  { top: '24%', left: '46%', size: 16, delay: '2.5s', rotate: -8,  dur: 5800 },
  { top: '36%', left: '8%',  size: 20, delay: '0.8s', rotate: 14,  dur: 6500 },
  { top: '48%', left: '88%', size: 16, delay: '1.9s', rotate: -24, dur: 5300 },
  { top: '58%', left: '28%', size: 22, delay: '0.4s', rotate: 8,   dur: 6100 },
  { top: '70%', left: '62%', size: 18, delay: '2.2s', rotate: -14, dur: 5900 },
  { top: '82%', left: '12%', size: 16, delay: '1.5s', rotate: 26,  dur: 6300 },
  { top: '88%', left: '74%', size: 20, delay: '0.7s', rotate: -10, dur: 5700 },
];

const SPEAKNOW_CANDLES = [
  { top: '22%', left: '22%', delay: '0s'   },
  { top: '40%', left: '70%', delay: '1.6s' },
  { top: '58%', left: '14%', delay: '0.9s' },
  { top: '74%', left: '82%', delay: '2.4s' },
  { top: '14%', left: '52%', delay: '3.1s' },
];

const SPEAKNOW_GLITTER = [
  { top: '8%',  left: '38%', size: 3, delay: '0s'   },
  { top: '16%', left: '62%', size: 2, delay: '0.7s' },
  { top: '28%', left: '84%', size: 3, delay: '1.4s' },
  { top: '34%', left: '32%', size: 2, delay: '0.3s' },
  { top: '44%', left: '54%', size: 3, delay: '1.9s' },
  { top: '52%', left: '78%', size: 2, delay: '0.6s' },
  { top: '62%', left: '40%', size: 3, delay: '2.1s' },
  { top: '70%', left: '20%', size: 2, delay: '1.0s' },
  { top: '78%', left: '52%', size: 3, delay: '0.4s' },
  { top: '86%', left: '36%', size: 2, delay: '1.6s' },
];

function SpeakNowScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-speaknow-petal-sway {
          0%, 100% { transform: translateY(0)    rotate(var(--qs-rot, 0deg)); }
          50%      { transform: translateY(-14px) rotate(calc(var(--qs-rot, 0deg) + 22deg)); }
        }
        @keyframes qs-speaknow-candle-pulse {
          0%, 100% { opacity: 0.18; transform: scale(0.9); }
          50%      { opacity: 0.7;  transform: scale(1.15); }
        }
        @keyframes qs-speaknow-glint {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%      { opacity: 0.95; transform: scale(1.15); }
        }
      `}</style>

      {/* Floating violet petals */}
      {SPEAKNOW_PETALS.map((p, i) => (
        <svg
          key={i}
          width={p.size}
          height={p.size * 1.45}
          viewBox="0 0 24 36"
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            opacity: 0.55,
            '--qs-rot': `${p.rotate}deg`,
            animation: `qs-speaknow-petal-sway ${p.dur}ms ${p.delay} ease-in-out infinite`,
          }}
        >
          <defs>
            <linearGradient id={`qs-petal-${i}`} x1="0" y1="0" x2="0.7" y2="1">
              <stop offset="0%"  stopColor="#ddd6fe" />
              <stop offset="55%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          {/* Tear-drop petal silhouette */}
          <path
            d="M12 1 Q 22 11, 19 22 Q 15 32, 12 35 Q 9 32, 5 22 Q 2 11, 12 1 Z"
            fill={`url(#qs-petal-${i})`}
          />
          {/* Highlight ridge along the inside of the petal */}
          <path
            d="M12 4 Q 16 10, 14 18"
            fill="none"
            stroke="#ede9fe"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      ))}

      {/* Candelabra glow points — soft warm radial pulses */}
      {SPEAKNOW_CANDLES.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: c.top,
            left: c.left,
            width: 56,
            height: 56,
            marginLeft: -28,
            marginTop: -28,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(254, 215, 170, 0.55) 0%, rgba(252, 211, 77, 0.25) 50%, rgba(252, 211, 77, 0) 75%)',
            animation: `qs-speaknow-candle-pulse 4s ${c.delay} ease-in-out infinite`,
          }}
        />
      ))}

      {/* Pale lavender glitter dots */}
      {SPEAKNOW_GLITTER.map((g, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: g.top,
            left: g.left,
            width: g.size,
            height: g.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffffff 0%, #c4b5fd 100%)',
            boxShadow: '0 0 4px rgba(196, 181, 253, 0.7)',
            opacity: 0.5,
            animation: `qs-speaknow-glint 2.8s ${g.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Fearless ambient scene ────────────────────────────────────────────────────
// Drifting golden-glitter motes that float slowly upward across the backdrop.
// CSS-only — each mote has its own size, drift, and timing so the field reads
// as ambient sparkle rather than a column of dots.
const FEARLESS_GLITTER = [
  { left: '4%',  size: 4, delay: '0s',   dur: 11, drift:  10 },
  { left: '11%', size: 3, delay: '2.6s', dur: 13, drift:  -8 },
  { left: '17%', size: 5, delay: '0.8s', dur: 10, drift:  14 },
  { left: '24%', size: 3, delay: '4.1s', dur: 12, drift: -12 },
  { left: '30%', size: 4, delay: '1.5s', dur: 11, drift:   8 },
  { left: '36%', size: 3, delay: '3.2s', dur: 14, drift: -10 },
  { left: '42%', size: 5, delay: '0.4s', dur: 10, drift:  12 },
  { left: '49%', size: 4, delay: '2.0s', dur: 13, drift:  -6 },
  { left: '55%', size: 3, delay: '4.7s', dur: 11, drift:  10 },
  { left: '61%', size: 4, delay: '1.1s', dur: 12, drift: -14 },
  { left: '67%', size: 5, delay: '3.6s', dur: 10, drift:   8 },
  { left: '73%', size: 3, delay: '0.6s', dur: 14, drift:  -8 },
  { left: '79%', size: 4, delay: '2.3s', dur: 11, drift:  12 },
  { left: '85%', size: 3, delay: '4.0s', dur: 13, drift: -10 },
  { left: '91%', size: 5, delay: '1.8s', dur: 10, drift:   6 },
  { left: '8%',  size: 3, delay: '3.4s', dur: 12, drift:  -8 },
  { left: '20%', size: 4, delay: '0.9s', dur: 11, drift:  10 },
  { left: '33%', size: 3, delay: '4.5s', dur: 13, drift: -12 },
  { left: '46%', size: 4, delay: '2.7s', dur: 10, drift:   6 },
  { left: '58%', size: 3, delay: '5.2s', dur: 12, drift: -10 },
  { left: '70%', size: 4, delay: '1.4s', dur: 11, drift:   8 },
  { left: '82%', size: 3, delay: '3.8s', dur: 14, drift:  -6 },
];

function FearlessScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-fearless-float {
          0%   { transform: translateY(0)       translateX(0); opacity: 0; }
          10%  { opacity: 0.95; }
          88%  { opacity: 0.95; }
          100% { transform: translateY(-115vh) translateX(var(--qs-drift, 0px)); opacity: 0; }
        }
        @keyframes qs-fearless-twinkle {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.55); }
        }
      `}</style>

      {FEARLESS_GLITTER.map((g, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: -10,
            left: g.left,
            width: g.size,
            height: g.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fffbeb 0%, #fde68a 45%, #d97706 100%)',
            boxShadow: '0 0 6px rgba(251,191,36,0.85), 0 0 12px rgba(252,211,77,0.5)',
            // Per-mote drift target read by qs-fearless-float so each particle
            // arcs slightly differently as it rises.
            '--qs-drift': `${g.drift}px`,
            animation: `qs-fearless-float ${g.dur}s ${g.delay} linear infinite, qs-fearless-twinkle 1.6s ${g.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Love Story horse ─────────────────────────────────────────────────────────
// Triggered when the user finishes rating "Love Story". A small white horse
// with a soft trail gallops across the bottom of the screen for ~2 s, then
// the celebration timer in QuickScore unmounts it.
function LoveStoryHorse() {
  // Render the horse silhouette plus three ghost copies behind it. The whole
  // wrapper translates from off-screen-left to off-screen-right; ghosts get
  // decreasing opacity so the row reads as a fade trail behind the runner.
  const horseSvg = (
    <svg width="62" height="42" viewBox="0 0 70 48" style={{ display: 'block' }}>
      {/* Body */}
      <ellipse cx="32" cy="26" rx="22" ry="9" fill="#ffffff" />
      {/* Neck */}
      <path d="M 48 22 L 56 12 L 60 10 L 62 14 L 54 24 Z" fill="#ffffff" />
      {/* Head */}
      <ellipse cx="60" cy="11" rx="6" ry="4" fill="#ffffff" transform="rotate(-15 60 11)" />
      {/* Ears */}
      <path d="M 57 7 L 59 2 L 61 7 Z" fill="#ffffff" />
      {/* Mane */}
      <path d="M 48 18 Q 50 14, 53 12 L 55 16 Q 52 18, 50 20 Z" fill="#ffffff" />
      {/* Front leg pair */}
      <rect x="44" y="30" width="3" height="14" fill="#ffffff" />
      <rect x="49" y="30" width="3" height="14" fill="#ffffff" transform="rotate(-18 50.5 37)" />
      {/* Back leg pair */}
      <rect x="14" y="30" width="3" height="14" fill="#ffffff" />
      <rect x="19" y="30" width="3" height="14" fill="#ffffff" transform="rotate(18 20.5 37)" />
      {/* Tail */}
      <path d="M 10 24 Q 2 22, 0 30 Q 4 30, 10 28 Z" fill="#ffffff" />
    </svg>
  );

  return (
    <>
      <style>{`
        @keyframes qs-horse-gallop {
          0%   { transform: translateX(-220px); }
          100% { transform: translateX(calc(100vw + 120px)); }
        }
        @keyframes qs-horse-bob {
          0%, 100% { transform: translateY(0); }
          25%      { transform: translateY(-3px); }
          50%      { transform: translateY(0); }
          75%      { transform: translateY(-3px); }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          bottom: '8vh',
          pointerEvents: 'none',
          zIndex: 5,
          // 2s matches the celebration timer in detectCelebration so the
          // wrapper unmounts just as the horse exits screen-right.
          animation: 'qs-horse-gallop 2s ease-out forwards',
          // Soft drop-shadow so the white horse reads against any pixel of
          // the golden-hour backdrop, including the lightest cream up top.
          filter: 'drop-shadow(0 4px 6px rgba(146, 64, 14, 0.35))',
        }}
      >
        {/* Trail ghosts behind the horse — fade with distance */}
        <div style={{ position: 'absolute', left: -120, top: 0, opacity: 0.12 }}>{horseSvg}</div>
        <div style={{ position: 'absolute', left: -80,  top: 0, opacity: 0.22 }}>{horseSvg}</div>
        <div style={{ position: 'absolute', left: -40,  top: 0, opacity: 0.42 }}>{horseSvg}</div>
        {/* Lead horse — bobbing while the wrapper translates */}
        <div style={{ position: 'relative', animation: 'qs-horse-bob 0.4s ease-in-out infinite' }}>
          {horseSvg}
        </div>
      </div>
    </>
  );
}

// ── Fearless album-complete fireworks ─────────────────────────────────────────
// Brief golden firework crackle rendered behind DoneFlash when finishing a
// full Fearless QuickScore session. Five staggered bursts; total runtime fits
// inside the 2-second DoneFlash auto-close window.
const FIREWORK_BURSTS = [
  { x: '22%', y: '22%', delay:    0 },
  { x: '72%', y: '20%', delay:  220 },
  { x: '46%', y: '38%', delay:  440 },
  { x: '18%', y: '52%', delay:  660 },
  { x: '80%', y: '50%', delay:  880 },
];

const FIREWORK_PARTICLE_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const FIREWORK_COLORS = ['#fef9c3', '#fde68a', '#fbbf24', '#f59e0b'];

function FearlessFireworks() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-firework-burst {
          0%   { opacity: 0; transform: translate(0, 0) scale(0.4); }
          18%  { opacity: 1; }
          100% { opacity: 0; transform: var(--qs-fw-drift) scale(0.5); }
        }
        @keyframes qs-firework-flash {
          0%   { opacity: 0;   transform: scale(0.3); }
          25%  { opacity: 0.9; transform: scale(1.6); }
          100% { opacity: 0;   transform: scale(2.2); }
        }
      `}</style>

      {FIREWORK_BURSTS.map((burst, bi) => (
        <div
          key={bi}
          style={{
            position: 'absolute',
            top: burst.y,
            left: burst.x,
            width: 0,
            height: 0,
          }}
        >
          {/* Center flash — bright halo at burst origin */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: -20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(254,243,199,0.95) 0%, rgba(252,211,77,0.45) 55%, transparent 80%)',
              animation: `qs-firework-flash 0.7s ${burst.delay}ms ease-out forwards`,
            }}
          />
          {/* Particles radiating outward in 12 directions */}
          {FIREWORK_PARTICLE_ANGLES.map((angle, ai) => {
            const distance = 58 + (ai % 3) * 14;
            const dx = Math.cos((angle * Math.PI) / 180) * distance;
            const dy = Math.sin((angle * Math.PI) / 180) * distance;
            const color = FIREWORK_COLORS[ai % FIREWORK_COLORS.length];
            return (
              <div
                key={ai}
                style={{
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 4px ${color}`,
                  '--qs-fw-drift': `translate(${dx}px, ${dy}px)`,
                  animation: `qs-firework-burst 1s ${burst.delay}ms ease-out forwards`,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Reputation ambient scene ─────────────────────────────────────────────────
// Snake silhouette slithers across the bottom edge on a long loop, with a
// few white ink-splatter pulses scattered around the screen.
const REP_INK_BLOTS = [
  { top: '12%', left: '14%', size: 28, delay:  '0s'   },
  { top: '22%', left: '78%', size: 36, delay:  '4.2s' },
  { top: '38%', left: '46%', size: 24, delay:  '2.1s' },
  { top: '54%', left: '24%', size: 32, delay:  '6.0s' },
  { top: '64%', left: '88%', size: 26, delay:  '1.4s' },
  { top: '78%', left: '52%', size: 30, delay:  '3.7s' },
];

function ReputationScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-rep-snake {
          0%   { transform: translateX(-260px) translateY(0);   opacity: 0; }
          5%   { opacity: 0.55; }
          50%  { transform: translateX(50vw)   translateY(-2px); opacity: 0.55; }
          95%  { opacity: 0.55; }
          100% { transform: translateX(calc(100vw + 80px)) translateY(0); opacity: 0; }
        }
        @keyframes qs-rep-ink-pulse {
          0%, 100% { opacity: 0;    transform: scale(0.85); }
          40%      { opacity: 0.18; transform: scale(1.05); }
          60%      { opacity: 0.18; transform: scale(1.05); }
        }
      `}</style>

      {/* Ink splatter pulses — white blots that fade in/out at random
          intervals. Low max-opacity so they read as paper-stain texture
          on the matte-black backdrop, not loud decoration. */}
      {REP_INK_BLOTS.map((b, i) => (
        <svg
          key={i}
          width={b.size}
          height={b.size}
          viewBox="0 0 60 60"
          style={{
            position: 'absolute',
            top: b.top,
            left: b.left,
            opacity: 0,
            animation: `qs-rep-ink-pulse 8s ${b.delay} ease-in-out infinite`,
          }}
        >
          <path
            fill="#ffffff"
            d="M30 8 C 38 6, 46 14, 44 22 C 52 22, 56 30, 50 38 C 56 44, 50 52, 42 50 C 40 56, 30 56, 26 50 C 18 54, 10 48, 14 40 C 6 38, 6 28, 14 26 C 12 18, 22 12, 30 8 Z"
          />
        </svg>
      ))}

      {/* Snake — slithers along the bottom on a 14s loop. Shape is a
          stylized side-profile silhouette with subtle scale shading. */}
      <div
        style={{
          position: 'absolute',
          bottom: '6vh',
          left: 0,
          width: 220,
          height: 38,
          animation: 'qs-rep-snake 14s 2s linear infinite',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
        }}
      >
        <svg viewBox="0 0 220 38" style={{ display: 'block', width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="qs-rep-snake-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"  stopColor="#1f2937" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>
          {/* S-curve body */}
          <path
            d="M 4 22 Q 30 4, 56 22 T 110 22 T 168 22 Q 192 22, 200 14 L 212 14 L 214 18 L 204 20 Q 196 22, 188 24 Q 162 30, 140 24 Q 108 16, 80 26 Q 50 36, 24 28 Q 12 24, 4 22 Z"
            fill="url(#qs-rep-snake-grad)"
            stroke="#000"
            strokeWidth="0.6"
          />
          {/* Eye dot */}
          <circle cx="208" cy="16" r="1" fill="#fef3c7" />
          {/* Forked tongue */}
          <path d="M 214 17 L 218 16 M 214 17 L 218 18" stroke="#dc2626" strokeWidth="0.7" />
        </svg>
      </div>
    </div>
  );
}

// ── Lover ambient scene ──────────────────────────────────────────────────────
// Rainbow ribbon arcs across the top, gentle hearts drift up from the bottom.
const LOVER_HEARTS = [
  { left: '6%',  size: 18, color: '#f9a8d4', delay: '0s',   dur: 12, drift:  10 },
  { left: '14%', size: 14, color: '#fda4af', delay: '2.4s', dur: 14, drift: -10 },
  { left: '22%', size: 16, color: '#c4b5fd', delay: '0.9s', dur: 13, drift:   8 },
  { left: '32%', size: 12, color: '#fbcfe8', delay: '3.6s', dur: 15, drift:  -8 },
  { left: '40%', size: 18, color: '#f9a8d4', delay: '1.5s', dur: 12, drift:  12 },
  { left: '48%', size: 14, color: '#a5b4fc', delay: '4.2s', dur: 14, drift: -12 },
  { left: '56%', size: 16, color: '#fda4af', delay: '0.6s', dur: 13, drift:   8 },
  { left: '64%', size: 12, color: '#fbcfe8', delay: '2.9s', dur: 15, drift: -10 },
  { left: '72%', size: 18, color: '#c4b5fd', delay: '1.2s', dur: 12, drift:  10 },
  { left: '80%', size: 14, color: '#f9a8d4', delay: '3.3s', dur: 14, drift:  -8 },
  { left: '88%', size: 16, color: '#fda4af', delay: '0.4s', dur: 13, drift:  12 },
  { left: '96%', size: 12, color: '#a5b4fc', delay: '2.0s', dur: 15, drift: -14 },
];

function LoverScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-lover-heart-float {
          0%   { transform: translateY(0)        translateX(0); opacity: 0; }
          12%  { opacity: 0.85; }
          90%  { opacity: 0.85; }
          100% { transform: translateY(-110vh)   translateX(var(--qs-drift, 0px)); opacity: 0; }
        }
        @keyframes qs-lover-ribbon-sway {
          0%, 100% { transform: translateX(-2%) rotate(-1deg); }
          50%      { transform: translateX(2%)  rotate(1deg);  }
        }
      `}</style>

      {/* Pastel rainbow ribbon arcing slowly across the top */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '-5%',
          width: '110%',
          height: 60,
          opacity: 0.55,
          animation: 'qs-lover-ribbon-sway 9s ease-in-out infinite',
        }}
      >
        <svg viewBox="0 0 600 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="qs-lover-rainbow" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%"   stopColor="#fda4af" />
              <stop offset="22%"  stopColor="#fcd34d" />
              <stop offset="44%"  stopColor="#86efac" />
              <stop offset="66%"  stopColor="#7dd3fc" />
              <stop offset="88%"  stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#f9a8d4" />
            </linearGradient>
          </defs>
          <path
            d="M 0 50 Q 150 0, 300 30 T 600 50"
            fill="none"
            stroke="url(#qs-lover-rainbow)"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Floating hearts drifting up */}
      {LOVER_HEARTS.map((h, i) => (
        <svg
          key={i}
          width={h.size}
          height={h.size}
          viewBox="0 0 24 24"
          style={{
            position: 'absolute',
            bottom: -20,
            left: h.left,
            opacity: 0,
            '--qs-drift': `${h.drift}px`,
            animation: `qs-lover-heart-float ${h.dur}s ${h.delay} linear infinite`,
            filter: 'drop-shadow(0 1px 3px rgba(244, 114, 182, 0.35))',
          }}
        >
          <path
            fill={h.color}
            d="M12 21s-7.5-4.5-7.5-11A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 7.5 4c0 6.5-7.5 11-7.5 11z"
          />
        </svg>
      ))}
    </div>
  );
}

// ── Folklore ambient scene ───────────────────────────────────────────────────
// Misty fog wisps drifting horizontally + occasional pine-needle silhouettes
// drifting downward. The animation engine here also powers Evermore's leaves
// (palette swap only) — sister-album visual family.
const FOLKLORE_FOG = [
  { top: '10%', left: '-30%', size: 280, delay:  '0s',   dur: 26, opacity: 0.45 },
  { top: '34%', left: '-50%', size: 360, delay:  '6s',   dur: 32, opacity: 0.35 },
  { top: '58%', left: '-30%', size: 240, delay:  '11s',  dur: 24, opacity: 0.40 },
  { top: '78%', left: '-40%', size: 320, delay:  '3s',   dur: 30, opacity: 0.32 },
];

const FOLKLORE_NEEDLES = [
  { left: '8%',  delay: '0s',   dur: 14, drift:   6, rot: 12 },
  { left: '22%', delay: '4s',   dur: 18, drift:  -8, rot: -6 },
  { left: '34%', delay: '1.5s', dur: 16, drift:   4, rot: 18 },
  { left: '48%', delay: '6s',   dur: 15, drift:  -6, rot: -10 },
  { left: '60%', delay: '2.5s', dur: 17, drift:   8, rot: 8 },
  { left: '74%', delay: '5s',   dur: 14, drift:  -4, rot: -14 },
  { left: '88%', delay: '0.8s', dur: 16, drift:  10, rot: 6 },
];

function FolkloreScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-fog-drift {
          0%   { transform: translateX(0); }
          100% { transform: translateX(160vw); }
        }
        @keyframes qs-needle-fall {
          0%   { transform: translateY(-30px) translateX(0)   rotate(var(--qs-rot, 0deg)); opacity: 0; }
          12%  { opacity: 0.7; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(110vh) translateX(var(--qs-drift, 0px)) rotate(calc(var(--qs-rot, 0deg) + 90deg)); opacity: 0; }
        }
      `}</style>

      {/* Slow-moving fog wisps */}
      {FOLKLORE_FOG.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: f.top,
            left: f.left,
            width: f.size,
            height: f.size * 0.55,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
            opacity: f.opacity,
            animation: `qs-fog-drift ${f.dur}s ${f.delay} linear infinite`,
            filter: 'blur(8px)',
          }}
        />
      ))}

      {/* Pine-needle silhouettes drifting down */}
      {FOLKLORE_NEEDLES.map((n, i) => (
        <svg
          key={i}
          width={14}
          height={20}
          viewBox="0 0 14 20"
          style={{
            position: 'absolute',
            top: -30,
            left: n.left,
            opacity: 0,
            '--qs-drift': `${n.drift}px`,
            '--qs-rot': `${n.rot}deg`,
            animation: `qs-needle-fall ${n.dur}s ${n.delay} linear infinite`,
          }}
        >
          <path
            d="M 7 0 L 7 18 M 7 4 L 3 7 M 7 4 L 11 7 M 7 8 L 3 11 M 7 8 L 11 11 M 7 12 L 3 15 M 7 12 L 11 15"
            stroke="#3f6212"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ))}
    </div>
  );
}

// ── Evermore ambient scene ───────────────────────────────────────────────────
// Sister to Folklore — same drift engine, autumn palette. Falling leaves in
// orange/brown/deep-red tones.
const EVERMORE_LEAVES = [
  { left: '6%',  delay: '0s',   dur: 18, drift:   8, rot: 14, color: '#c2410c' },
  { left: '16%', delay: '4s',   dur: 22, drift: -10, rot: -8, color: '#7c2d12' },
  { left: '28%', delay: '1.8s', dur: 20, drift:   6, rot: 22, color: '#92400e' },
  { left: '40%', delay: '7s',   dur: 19, drift:  -6, rot: -16, color: '#dc2626' },
  { left: '52%', delay: '3s',   dur: 21, drift:  10, rot: 12, color: '#9a3412' },
  { left: '64%', delay: '5.5s', dur: 18, drift:  -8, rot: -10, color: '#b45309' },
  { left: '76%', delay: '2.2s', dur: 22, drift:  12, rot: 18, color: '#7c2d12' },
  { left: '88%', delay: '6.5s', dur: 20, drift:  -4, rot: -20, color: '#c2410c' },
  { left: '12%', delay: '8s',   dur: 19, drift:   6, rot: 8,  color: '#dc2626' },
  { left: '70%', delay: '1s',   dur: 21, drift:  -8, rot: 14, color: '#92400e' },
];

function EvermoreScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-leaf-fall {
          0%   { transform: translateY(-40px) translateX(0)   rotate(var(--qs-rot, 0deg)); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.8; }
          100% { transform: translateY(110vh) translateX(var(--qs-drift, 0px)) rotate(calc(var(--qs-rot, 0deg) + 180deg)); opacity: 0; }
        }
      `}</style>

      {EVERMORE_LEAVES.map((l, i) => (
        <svg
          key={i}
          width={18}
          height={22}
          viewBox="0 0 18 22"
          style={{
            position: 'absolute',
            top: -40,
            left: l.left,
            opacity: 0,
            '--qs-drift': `${l.drift}px`,
            '--qs-rot': `${l.rot}deg`,
            animation: `qs-leaf-fall ${l.dur}s ${l.delay} linear infinite`,
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
          }}
        >
          <path
            d="M 9 1 C 14 4, 17 11, 9 21 C 1 11, 4 4, 9 1 Z"
            fill={l.color}
          />
          <path d="M 9 3 L 9 19" stroke="#451a03" strokeWidth="0.8" />
        </svg>
      ))}
    </div>
  );
}

// ── Tortured Poets Department ambient scene ──────────────────────────────────
// Typewriter caret blinks at random spots; ink-blot drips fade in and out.
const TPD_CARETS = [
  { top: '14%', left: '20%', delay: '0s'   },
  { top: '28%', left: '64%', delay: '1.4s' },
  { top: '42%', left: '36%', delay: '2.8s' },
  { top: '58%', left: '78%', delay: '0.6s' },
  { top: '70%', left: '24%', delay: '2.0s' },
  { top: '86%', left: '54%', delay: '1.0s' },
];

const TPD_INK_DROPS = [
  { top: '18%', left: '78%', size: 22, delay: '0s'   },
  { top: '36%', left: '14%', size: 30, delay: '3.4s' },
  { top: '52%', left: '52%', size: 18, delay: '1.6s' },
  { top: '74%', left: '12%', size: 26, delay: '5s'   },
  { top: '88%', left: '74%', size: 20, delay: '2.4s' },
];

function TPDScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-tpd-caret-blink {
          0%, 49%   { opacity: 0.85; }
          50%, 100% { opacity: 0; }
        }
        @keyframes qs-tpd-ink-drip {
          0%, 100% { opacity: 0;    transform: scaleY(1); }
          30%      { opacity: 0.4;  transform: scaleY(1.05); }
          60%      { opacity: 0.4;  transform: scaleY(1.05); }
        }
      `}</style>

      {/* Blinking typewriter carets */}
      {TPD_CARETS.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: c.top,
            left: c.left,
            width: 2,
            height: 16,
            background: '#1c1917',
            opacity: 0,
            animation: `qs-tpd-caret-blink 1s ${c.delay} steps(1, end) infinite`,
          }}
        />
      ))}

      {/* Ink drips — small dark splatters that fade in/out */}
      {TPD_INK_DROPS.map((d, i) => (
        <svg
          key={i}
          width={d.size}
          height={d.size * 1.2}
          viewBox="0 0 22 26"
          style={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            opacity: 0,
            transformOrigin: 'top center',
            animation: `qs-tpd-ink-drip 7s ${d.delay} ease-in-out infinite`,
          }}
        >
          <path
            fill="#1c1917"
            d="M 11 2 C 16 4, 19 10, 17 16 C 15 22, 7 22, 5 16 C 3 10, 6 4, 11 2 Z M 11 19 L 11 24"
          />
        </svg>
      ))}
    </div>
  );
}

// ── The Life of a Showgirl ambient scene ─────────────────────────────────────
// Spotlight cone sweeping back and forth, sequin glitter dots that catch
// the light. The cabaret backdrop is rich on its own; the scene mostly adds
// motion so the screen feels alive.
const SHOWGIRL_SEQUINS = [
  { top: '10%', left: '14%', size: 5, delay: '0s'   },
  { top: '18%', left: '64%', size: 4, delay: '1.4s' },
  { top: '24%', left: '42%', size: 6, delay: '0.6s' },
  { top: '32%', left: '88%', size: 4, delay: '2.0s' },
  { top: '40%', left: '20%', size: 5, delay: '0.9s' },
  { top: '48%', left: '54%', size: 4, delay: '1.6s' },
  { top: '56%', left: '76%', size: 6, delay: '0.3s' },
  { top: '64%', left: '32%', size: 4, delay: '2.2s' },
  { top: '72%', left: '60%', size: 5, delay: '1.0s' },
  { top: '80%', left: '12%', size: 4, delay: '0.5s' },
  { top: '86%', left: '82%', size: 6, delay: '1.8s' },
  { top: '92%', left: '44%', size: 4, delay: '2.6s' },
];

function ShowgirlScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes qs-showgirl-spotlight {
          0%, 100% { transform: translateX(-30%) rotate(-6deg); opacity: 0.35; }
          50%      { transform: translateX(30%)  rotate(6deg);  opacity: 0.5;  }
        }
        @keyframes qs-showgirl-sequin {
          0%, 100% { opacity: 0.35; transform: scale(0.85); filter: brightness(1); }
          50%      { opacity: 1;    transform: scale(1.2);  filter: brightness(1.6); }
        }
      `}</style>

      {/* Spotlight cone — translucent yellow wedge that sweeps left-right */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          marginLeft: -180,
          width: 360,
          height: '120%',
          background: 'linear-gradient(180deg, rgba(254, 240, 138, 0.45) 0%, rgba(253, 224, 71, 0.18) 60%, transparent 100%)',
          clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
          animation: 'qs-showgirl-spotlight 7s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />

      {/* Sequin dots that catch the light */}
      {SHOWGIRL_SEQUINS.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fffbeb 0%, #fcd34d 50%, #b45309 100%)',
            boxShadow: '0 0 6px rgba(251,191,36,0.85)',
            animation: `qs-showgirl-sequin 1.8s ${s.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Look What You Made Me Do — broken neon sign ──────────────────────────────
// Triggered when finishing rating LWYMMD on Reputation. Stars 1..celLevel
// flicker like a busted neon tube, then snap to a steady red for the final hold.
// Rendered as an absolute overlay above the StarPicker; the StarPicker also
// applies broken-neon styling to its own stars (see isBrokenNeon flag).
function BrokenNeonOverlay() {
  return (
    <>
      <style>{`
        @keyframes qs-rep-neon-flicker {
          0%, 100% { opacity: 0; }
          5%       { opacity: 0.6; }
          7%       { opacity: 0.1; }
          12%      { opacity: 0.7; }
          14%      { opacity: 0;   }
          24%      { opacity: 0.55; }
          27%      { opacity: 0.05; }
          40%      { opacity: 0.65; }
          43%      { opacity: 0;   }
          60%      { opacity: 0.6; }
          70%      { opacity: 0.0; }
          85%      { opacity: 0.5; }
        }
      `}</style>
      {/* Cyan haze flicker behind the rated stars — sells the broken-tube
          vibe without modifying StarPicker too invasively. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -20,
          background: 'radial-gradient(circle at center, rgba(103, 232, 249, 0.55) 0%, rgba(103, 232, 249, 0) 65%)',
          animation: 'qs-rep-neon-flicker 2s linear forwards',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </>
  );
}

// ── Cruel Summer — heat shimmer + sunset bloom ───────────────────────────────
function HeatShimmerOverlay() {
  return (
    <>
      <style>{`
        @keyframes qs-cs-shimmer {
          0%   { opacity: 0;   transform: scaleY(1); }
          25%  { opacity: 0.7; }
          70%  { opacity: 0.7; }
          100% { opacity: 0;   transform: scaleY(1.2); }
        }
        @keyframes qs-cs-bloom {
          0%   { opacity: 0;   transform: scale(0.6); }
          40%  { opacity: 0.85; }
          80%  { opacity: 0.7;  transform: scale(1.4); }
          100% { opacity: 0;    transform: scale(1.6); }
        }
      `}</style>
      {/* Sunset radial bloom — pink → orange */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -40,
          background: 'radial-gradient(circle at center, rgba(251, 113, 133, 0.7) 0%, rgba(251, 146, 60, 0.5) 45%, rgba(251, 113, 133, 0) 80%)',
          animation: 'qs-cs-bloom 2.5s ease-out forwards',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Wavy heat haze — vertical band that wobbles. CSS-only approximation
          using a repeating gradient + scaleY pulse — not a literal water-ripple
          effect, but reads as heat distortion against the cotton-candy backdrop. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -20,
          background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.0) 0px, rgba(255,255,255,0.18) 3px, rgba(255,255,255,0.0) 6px)',
          animation: 'qs-cs-shimmer 2.5s ease-in-out forwards',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </>
  );
}

// ── August — sun-flare arc ───────────────────────────────────────────────────
function SunFlareOverlay() {
  return (
    <>
      <style>{`
        @keyframes qs-aug-sun-arc {
          0%   { transform: translateX(-30vw) translateY(20px); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(30vw)  translateY(-20px); opacity: 0; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '12%',
          left: '50%',
          marginLeft: -36,
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fef3c7 0%, #fcd34d 40%, #f59e0b 70%, rgba(245,158,11,0) 100%)',
          boxShadow: '0 0 60px rgba(252, 211, 77, 0.85), 0 0 120px rgba(252, 211, 77, 0.5)',
          animation: 'qs-aug-sun-arc 3s ease-in-out forwards',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </>
  );
}

// ── Marjorie — candle halos around stars ─────────────────────────────────────
function CandleHaloOverlay() {
  return (
    <>
      <style>{`
        @keyframes qs-marj-halo-fade {
          0%   { opacity: 0;   transform: scale(0.5); }
          50%  { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0.6; transform: scale(1.05); }
        }
      `}</style>
      {/* The halos themselves render in the StarPicker per-star (isCandleHalo).
          This wrapper just provides the keyframes. */}
    </>
  );
}

// ── The Manuscript signature — cursive ink fade ──────────────────────────────
function ManuscriptSignatureOverlay() {
  return (
    <>
      <style>{`
        @keyframes qs-tpd-manuscript-text {
          0%   { opacity: 0;   transform: translateY(8px); }
          25%  { opacity: 1;   transform: translateY(0); }
          85%  { opacity: 1;   transform: translateY(0); }
          100% { opacity: 0;   transform: translateY(-4px); }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '38%',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 26,
          fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
          fontStyle: 'italic',
          color: '#1c1917',
          letterSpacing: '0.02em',
          animation: 'qs-tpd-manuscript-text 3s ease-in-out forwards',
          pointerEvents: 'none',
          zIndex: 2,
          textShadow: '0 1px 0 rgba(245,245,240,0.6)',
        }}
      >
        the manuscript
      </div>
    </>
  );
}

// ── Album-complete: Showgirl curtain reveal ──────────────────────────────────
// Two red velvet panels slide in from the edges and meet center as the
// completion card arrives. Lives behind DoneFlash so the card pops against it.
function ShowgirlCurtain() {
  return (
    <>
      <style>{`
        @keyframes qs-curtain-left {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        @keyframes qs-curtain-right {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(0); }
        }
      `}</style>
      {/* Left panel */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: 'repeating-linear-gradient(95deg, #7f1d1d 0px, #7f1d1d 8px, #991b1b 8px, #991b1b 16px, #7f1d1d 16px, #7f1d1d 24px, #b91c1c 24px, #b91c1c 32px)',
          boxShadow: 'inset -20px 0 40px rgba(0,0,0,0.6)',
          animation: 'qs-curtain-left 1.4s cubic-bezier(0.7, 0, 0.2, 1) forwards',
          zIndex: 0,
        }}
      />
      {/* Right panel */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: 'repeating-linear-gradient(85deg, #7f1d1d 0px, #7f1d1d 8px, #991b1b 8px, #991b1b 16px, #7f1d1d 16px, #7f1d1d 24px, #b91c1c 24px, #b91c1c 32px)',
          boxShadow: 'inset 20px 0 40px rgba(0,0,0,0.6)',
          animation: 'qs-curtain-right 1.4s cubic-bezier(0.7, 0, 0.2, 1) forwards',
          zIndex: 0,
        }}
      />
    </>
  );
}

// ── Album-complete: Evermore handwritten word ────────────────────────────────
function EvermoreCompleteWord() {
  return (
    <>
      <style>{`
        @keyframes qs-ev-word-fade {
          0%   { opacity: 0;   transform: scale(0.96); }
          25%  { opacity: 0.9; transform: scale(1); }
          75%  { opacity: 0.9; transform: scale(1); }
          100% { opacity: 0;   transform: scale(1.02); }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '42%',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 38,
          fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
          fontStyle: 'italic',
          color: '#fef3c7',
          letterSpacing: '0.06em',
          animation: 'qs-ev-word-fade 2.8s ease-in-out forwards',
          pointerEvents: 'none',
          zIndex: 2,
          textShadow: '0 2px 8px rgba(0,0,0,0.55)',
        }}
      >
        evermore
      </div>
    </>
  );
}

// ── Album-complete: Lover cursive logotype ───────────────────────────────────
function LoverCompleteLogo() {
  return (
    <>
      <style>{`
        @keyframes qs-lv-logo-fade {
          0%   { opacity: 0;   transform: translateY(8px); }
          25%  { opacity: 0.9; transform: translateY(0); }
          75%  { opacity: 0.9; transform: translateY(0); }
          100% { opacity: 0;   transform: translateY(-4px); }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 56,
          fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
          fontStyle: 'italic',
          background: 'linear-gradient(90deg, #ec4899, #f472b6, #c084fc)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          letterSpacing: '0.04em',
          animation: 'qs-lv-logo-fade 2.8s ease-in-out forwards',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        Lover
      </div>
    </>
  );
}

// ── Album-complete: TPD parchment manuscript fade ────────────────────────────
// Already partially planned in CLAUDE.md ("The Manuscript" easter egg). This
// is the inline QuickScore version: a parchment overlay that types out a
// short line, fades, and lets DoneFlash come through.
function TPDManuscriptComplete() {
  return (
    <>
      <style>{`
        @keyframes qs-tpd-parchment-in {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes qs-tpd-text-type {
          0%   { opacity: 0; }
          30%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #f5f0e8 0%, #ede5d0 100%)',
          opacity: 0,
          animation: 'qs-tpd-parchment-in 2.6s ease-in-out forwards',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '44%',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 18,
          fontFamily: "'Courier New', 'Courier', monospace",
          color: '#1c1917',
          letterSpacing: '0.04em',
          opacity: 0,
          animation: 'qs-tpd-text-type 2.6s ease-in-out forwards',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        The story isn't mine anymore...
      </div>
    </>
  );
}

// ── Album-complete: Reputation stage-light spot ──────────────────────────────
function ReputationStageLight() {
  return (
    <>
      <style>{`
        @keyframes qs-rep-stage-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.8; transform: scale(1.08); }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 520,
          height: 520,
          marginTop: -260,
          marginLeft: -260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0) 70%)',
          animation: 'qs-rep-stage-pulse 2.6s ease-in-out infinite',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

// ── Album-complete: Folklore pine-needle snow ────────────────────────────────
// Reuses the FolkloreScene needle visual but at much higher density and
// with shorter durations so it reads as a snowfall finale rather than ambient.
const FOLKLORE_SNOW_NEEDLES = [
  { left: '4%',  delay: '0s',   dur: 2.6, drift:   8,  rot: 14 },
  { left: '12%', delay: '0.2s', dur: 2.4, drift:  -6,  rot: -8 },
  { left: '20%', delay: '0.4s', dur: 2.8, drift:   4,  rot: 18 },
  { left: '28%', delay: '0.1s', dur: 2.5, drift: -10,  rot: -12 },
  { left: '36%', delay: '0.6s', dur: 2.6, drift:   6,  rot: 8 },
  { left: '44%', delay: '0.3s', dur: 2.7, drift:  -4,  rot: -16 },
  { left: '52%', delay: '0.5s', dur: 2.5, drift:  10,  rot: 12 },
  { left: '60%', delay: '0.0s', dur: 2.6, drift:  -6,  rot: -10 },
  { left: '68%', delay: '0.4s', dur: 2.8, drift:   4,  rot: 14 },
  { left: '76%', delay: '0.2s', dur: 2.5, drift:  -8,  rot: -6 },
  { left: '84%', delay: '0.6s', dur: 2.7, drift:   6,  rot: 16 },
  { left: '92%', delay: '0.3s', dur: 2.4, drift:  -4,  rot: -14 },
];

function FolkloreCompleteSnow() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {FOLKLORE_SNOW_NEEDLES.map((n, i) => (
        <svg
          key={i}
          width={14}
          height={20}
          viewBox="0 0 14 20"
          style={{
            position: 'absolute',
            top: -30,
            left: n.left,
            opacity: 0,
            '--qs-drift': `${n.drift}px`,
            '--qs-rot': `${n.rot}deg`,
            animation: `qs-needle-fall ${n.dur}s ${n.delay}s linear forwards`,
          }}
        >
          <path
            d="M 7 0 L 7 18 M 7 4 L 3 7 M 7 4 L 11 7 M 7 8 L 3 11 M 7 8 L 11 11 M 7 12 L 3 15 M 7 12 L 11 15"
            stroke="#3f6212"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ))}
    </div>
  );
}

// ── Album-signature celebrations ──────────────────────────────────────────────
// Maps (albumId, songName) → a celebration that runs after the user finishes
// rating that song's last category. Returns null when no celebration applies.
// Keep this small and album-scoped so the rating flow never freezes on songs
// the user expects to fly through.
function detectCelebration(albumId, songName) {
  if (albumId === 'ml' && songName === 'Bejeweled') {
    return { type: 'bejeweled', durationMs: 3000 };
  }
  if (albumId === 'tv' && songName === 'Tim McGraw') {
    return { type: 'polaroid-sepia', durationMs: 2500 };
  }
  if (albumId === 'tv' && songName === 'Picture to Burn') {
    return { type: 'polaroid-burn', durationMs: 3500 };
  }
  if (albumId === 'st' && songName === 'Enchanted') {
    return { type: 'waltz', durationMs: 3500 };
  }
  if (albumId === 'fe' && songName === 'Love Story') {
    return { type: 'horse-gallop', durationMs: 2000 };
  }
  if (albumId === 'rp' && songName === 'Look What You Made Me Do') {
    return { type: 'broken-neon', durationMs: 3000 };
  }
  if (albumId === 'lv' && songName === 'Cruel Summer') {
    return { type: 'heat-shimmer', durationMs: 2500 };
  }
  if (albumId === 'fl' && songName === 'August') {
    return { type: 'sun-flare', durationMs: 3000 };
  }
  if (albumId === 'ev' && songName === 'Marjorie') {
    return { type: 'candle-halo', durationMs: 3000 };
  }
  // TPD title track — matches both "The Tortured Poets Department" and any
  // close-enough spelling so a tracklist tweak doesn't silently kill the egg.
  if (albumId === 'tp' && /tortured poets department/i.test(songName ?? '')) {
    return { type: 'manuscript-fade', durationMs: 3000 };
  }
  // Red — All Too Well: dark wash + snowfall (matches the song's wintry tone).
  if (albumId === 'rd' && songName === 'All Too Well') {
    return { type: 'red-leaf-fall', durationMs: 6000 };
  }
  // 1989 — Welcome to New York: neon bloom + wordmark burst.
  if (albumId === '89' && songName === 'Welcome to New York') {
    return { type: '89-neon-bloom', durationMs: 3000 };
  }
  return null;
}

// Sparkle particles that drift outward from each gemstone during the
// Bejeweled celebration. Drift offsets aim in 6 directions so the
// effect feels omnidirectional; durations and delays are mixed so
// they don't pulse in unison.
const BEJEWELED_SPARKS = [
  { dx:  34, dy: -28, color: '#fde68a', dur: 1100, delay:  0   },
  { dx: -32, dy: -34, color: '#f9a8d4', dur: 1300, delay: 120  },
  { dx:  40, dy:  16, color: '#c4b5fd', dur: 1000, delay: 260  },
  { dx: -40, dy:  10, color: '#93c5fd', dur: 1200, delay: 380  },
  { dx:  10, dy:  38, color: '#6ee7b7', dur: 1100, delay: 540  },
  { dx: -10, dy: -42, color: '#fca5a5', dur: 1250, delay: 700  },
];

// Slight rotation per polaroid so the row reads like photos stuck on
// a corkboard rather than a perfectly-aligned grid.
const POLAROID_TILTS = [-6, 4, -2, 5, -4];

// Flames that erupt from the bottom of each polaroid during the Picture
// to Burn celebration. Four flames per polaroid, offset along the bottom
// edge with mixed durations + flicker speeds so they don't pulse in sync.
const POLAROID_FLAMES = [
  { dx: -10, dur:  900, delay:   0, flicker: 220 },
  { dx:  -2, dur: 1100, delay: 130, flicker: 280 },
  { dx:   8, dur:  950, delay: 240, flicker: 200 },
  { dx:  16, dur: 1050, delay: 380, flicker: 260 },
];

// Glowing embers that drift up + outward from each burning polaroid.
const POLAROID_EMBERS = [
  { dx:   8, dy: -34, color: '#fbbf24', dur: 1300, delay:  60 },
  { dx: -10, dy: -42, color: '#f97316', dur: 1500, delay: 220 },
  { dx:  16, dy: -50, color: '#fde047', dur: 1400, delay: 380 },
  { dx: -16, dy: -30, color: '#dc2626', dur: 1200, delay: 540 },
  { dx:   4, dy: -56, color: '#f59e0b', dur: 1600, delay: 700 },
];

// Parchment-page wisps that drift up behind the picked stars during the
// Enchanted waltz. Three wisps spaced across the row, each on its own
// timing + tilt pair so they don't move in sync.
const WALTZ_PARCHMENTS = [
  { left: 18, tx: -6, r1: -10, r2:  4, r3: 14, dur: 2200, delay:    0 },
  { left: 50, tx:  4, r1:   6, r2: -3, r3:  9, dur: 2400, delay:  500 },
  { left: 82, tx: -2, r1:  -4, r2:  8, r3: -2, dur: 2300, delay: 1000 },
];

// ── Big interactive stars ─────────────────────────────────────────────────────
// Gets a new `key` each question so hover state resets automatically.
function StarPicker({ currentRating, onRate, labels, flashLevel = 0, celebration = null, isNightTheme = false, isDarkTheme = false, textTuning = null }) {
  const [hovered, setHovered] = useState(0);
  const isFlashing = flashLevel > 0;
  // While the post-pick flash is running, the new pick (flashLevel) wins
  // over the previous rating still sitting in `currentRating`. Without this,
  // re-rating from 5★ down to 3★ would leave stars 4 + 5 looking selected
  // for the duration of the hold animation, even though the user just
  // picked 3 — the new 1–3 stars flash, but the stale 4–5 stay filled.
  const display     = hovered || (isFlashing ? flashLevel : currentRating);
  const activeLevel = hovered || (isFlashing ? flashLevel : currentRating);
  const celType = celebration?.type ?? null;
  const celLevel = celebration?.level ?? 0;
  const isBejeweled = celType === 'bejeweled';
  const isPolaroidSepia = celType === 'polaroid-sepia';
  const isPolaroidBurn  = celType === 'polaroid-burn';
  const isPolaroid = isPolaroidSepia || isPolaroidBurn;
  const isWaltz = celType === 'waltz';
  // New album-signature celebrations — keep these as flag pairs alongside the
  // existing pattern so the per-star fill / animation can be conditional in
  // the star render below.
  const isBrokenNeon     = celType === 'broken-neon';
  const isHeatShimmer    = celType === 'heat-shimmer';
  const isSunFlare       = celType === 'sun-flare';
  const isCandleHalo     = celType === 'candle-halo';
  const isManuscriptFade = celType === 'manuscript-fade';
  // Album-theme celebrations — Red All Too Well frosts cool-blue, 1989
  // Welcome to New York duotone-warms pink/blue. CSS filter applied to
  // each picked star's <svg> while the celebration runs.
  const isRedLeafFall    = celType === 'red-leaf-fall';
  const isNeonBloom      = celType === '89-neon-bloom';
  // True when any dark-bg theme is active — Midnights, Reputation, Evermore,
  // Showgirl. These all need the lighter label palette so the under-star
  // calibration text remains readable.
  const useDarkLabels = isNightTheme || isDarkTheme;
  // textTuning (when provided by a registry-driven album theme) overrides
  // the default light/dark label palette so per-album backdrops can dial
  // in calibration colors that read on top of the gradient.
  const labelDefaultColor = textTuning?.calibration
    || (useDarkLabels ? '#e5e7eb' : '#374151');
  const labelActiveColor  = textTuning?.calibrationActive
    || (useDarkLabels ? '#e9d5ff' : '#5b21b6');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Bejeweled celebration keyframes — only injected while the
          gem-flash is active so the rest of the rating flow stays light. */}
      {isBejeweled && (
        <style>{`
          @keyframes qs-bejeweled-shimmer {
            0%   { fill: #fbbf24; }
            16%  { fill: #f472b6; }
            33%  { fill: #c084fc; }
            50%  { fill: #60a5fa; }
            66%  { fill: #34d399; }
            83%  { fill: #f87171; }
            100% { fill: #fbbf24; }
          }
          @keyframes qs-bejeweled-glow {
            0%, 100% { filter: drop-shadow(0 0 8px rgba(252,211,77,0.8)) drop-shadow(0 0 14px rgba(244,114,182,0.5)); }
            50%      { filter: drop-shadow(0 0 14px rgba(192,132,252,0.85)) drop-shadow(0 0 22px rgba(96,165,250,0.6)); }
          }
          @keyframes qs-bejeweled-pulse {
            0%, 100% { transform: scale(1)    rotate(0deg);   }
            25%      { transform: scale(1.18) rotate(-4deg);  }
            75%      { transform: scale(1.18) rotate(4deg);   }
          }
          @keyframes qs-bejeweled-spark-drift {
            0%   { opacity: 0; transform: translate(0, 0) scale(0.4); }
            25%  { opacity: 1; }
            100% { opacity: 0; transform: var(--qs-drift) scale(1.2); }
          }
        `}</style>
      )}

      {/* Enchanted waltz keyframes — 3/4 tempo pulse on the picked stars
          plus a parchment-page-flip wisp drifting up behind them. */}
      {isWaltz && (
        <style>{`
          @keyframes qs-waltz-pulse {
            0%   { transform: scale(1); }
            10%  { transform: scale(1.20); }   /* downbeat — strong */
            33%  { transform: scale(1); }
            43%  { transform: scale(1.08); }   /* light beat 2 */
            66%  { transform: scale(1); }
            76%  { transform: scale(1.08); }   /* light beat 3 */
            100% { transform: scale(1); }
          }
          @keyframes qs-waltz-glow {
            0%, 100% { filter: drop-shadow(0 0 4px rgba(196, 181, 253, 0.5)); }
            50%      { filter: drop-shadow(0 0 14px rgba(196, 181, 253, 0.85)); }
          }
          @keyframes qs-waltz-parchment {
            0%   { opacity: 0;   transform: translate(var(--qs-tx, 0px), 30px) rotate(var(--qs-r1, -8deg)); }
            18%  { opacity: 0.7; }
            55%  { opacity: 0.7; transform: translate(var(--qs-tx, 0px), -8px) rotate(var(--qs-r2, 6deg)); }
            100% { opacity: 0;   transform: translate(var(--qs-tx, 0px), -48px) rotate(var(--qs-r3, 12deg)); }
          }
        `}</style>
      )}

      {/* Polaroid celebration keyframes — sepia fade for Tim McGraw, and a
          flames + char + ember sequence for Picture to Burn. */}
      {isPolaroid && (
        <style>{`
          @keyframes qs-polaroid-sepia {
            0%   { filter: sepia(0)    saturate(1)   brightness(1); transform: rotate(var(--qs-tilt, 0deg)) translateY(0); }
            20%  { filter: sepia(0.85) saturate(0.7) brightness(0.95); transform: rotate(var(--qs-tilt, 0deg)) translateY(-2px); }
            70%  { filter: sepia(0.85) saturate(0.7) brightness(0.95); transform: rotate(var(--qs-tilt, 0deg)) translateY(-2px); }
            100% { filter: sepia(0)    saturate(1)   brightness(1); transform: rotate(var(--qs-tilt, 0deg)) translateY(0); }
          }
          @keyframes qs-polaroid-burn-img {
            0%   { filter: sepia(0.6) saturate(1)    brightness(1); }
            25%  { filter: sepia(1)   saturate(1.4)  brightness(1) hue-rotate(-15deg); }
            55%  { filter: sepia(1)   saturate(2)    brightness(0.6) hue-rotate(-25deg); }
            80%  { filter: sepia(1)   saturate(0.4)  brightness(0.18) hue-rotate(-30deg); }
            100% { filter: sepia(1)   saturate(0)    brightness(0); opacity: 0; }
          }
          @keyframes qs-polaroid-burn-frame {
            0%   { background: #ffffff; border-color: #d6d3d1; transform: rotate(var(--qs-tilt, 0deg)) translateY(0); }
            40%  { background: #fde68a; border-color: #b45309; transform: rotate(calc(var(--qs-tilt, 0deg) - 1deg)) translateY(-1px); }
            70%  { background: #92400e; border-color: #1c0a02; transform: rotate(calc(var(--qs-tilt, 0deg) + 2deg)) translateY(2px); }
            100% { background: #1c0a02; border-color: #1c0a02; opacity: 0.2; transform: rotate(calc(var(--qs-tilt, 0deg) - 4deg)) translateY(8px) scale(0.92); }
          }
          @keyframes qs-flame-rise {
            0%   { opacity: 0;   transform: translateY(8px)  scaleY(0.4); }
            15%  { opacity: 0.95; }
            70%  { opacity: 1;    transform: translateY(-2px) scaleY(1.1); }
            100% { opacity: 0;   transform: translateY(-14px) scaleY(0.6); }
          }
          @keyframes qs-flame-flicker {
            0%, 100% { transform: translateX(0)  scaleX(1); }
            50%      { transform: translateX(2px) scaleX(0.85); }
          }
          @keyframes qs-ember-rise {
            0%   { opacity: 0; transform: translate(0, 0) scale(0.6); }
            20%  { opacity: 1; }
            100% { opacity: 0; transform: var(--qs-drift) scale(0.4); }
          }
        `}</style>
      )}

      {/* New album-signature keyframes — broken-neon flicker (Reputation),
          heat-shimmer warming (Lover), sun-warm amber (Folklore),
          candle-halo dim (Evermore), manuscript-fade (TPD). */}
      {(isBrokenNeon || isHeatShimmer || isSunFlare || isCandleHalo || isManuscriptFade) && (
        <style>{`
          @keyframes qs-broken-neon-flicker {
            0%   { opacity: 1;   filter: drop-shadow(0 0 6px #67e8f9); }
            10%  { opacity: 0.2; }
            14%  { opacity: 1;   }
            22%  { opacity: 0.3; }
            32%  { opacity: 1;   }
            45%  { opacity: 0.1; }
            55%  { opacity: 1;   }
            70%  { opacity: 1;   filter: drop-shadow(0 0 8px #dc2626); }
            100% { opacity: 1;   filter: drop-shadow(0 0 10px #dc2626); }
          }
          @keyframes qs-heat-warm {
            0%   { filter: hue-rotate(0deg)   saturate(1); }
            50%  { filter: hue-rotate(-30deg) saturate(1.6); }
            100% { filter: hue-rotate(-15deg) saturate(1.4); }
          }
          @keyframes qs-sun-warm {
            0%   { filter: brightness(1)    saturate(1); }
            40%  { filter: brightness(1.25) saturate(1.6); }
            100% { filter: brightness(1.15) saturate(1.4); }
          }
          @keyframes qs-candle-glow {
            0%   { filter: brightness(0.55) drop-shadow(0 0 0 rgba(255,255,255,0)); }
            40%  { filter: brightness(0.7)  drop-shadow(0 0 8px rgba(255,255,255,0.55)); }
            100% { filter: brightness(0.7)  drop-shadow(0 0 14px rgba(255,255,255,0.7)); }
          }
          @keyframes qs-manuscript-fade {
            0%   { opacity: 1; }
            60%  { opacity: 0.15; }
            100% { opacity: 0; }
          }
        `}</style>
      )}

      {/* Album-theme celebration keyframes — Red All Too Well frosts cool-blue,
          1989 Welcome to New York duotone-warms pink/blue. Filter applied to
          the picked stars only. Reduced-motion users get a static fallback. */}
      {(isRedLeafFall || isNeonBloom) && (
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            @keyframes qs-red-leaf-star-frost {
              0%, 100% { filter: none; }
              50%      { filter: brightness(0.6) hue-rotate(200deg) saturate(0.8); }
            }
            @keyframes qs-89-neon-star-warm {
              0%, 100% { filter: none; }
              50%      { filter: hue-rotate(40deg) saturate(1.6) brightness(1.05); }
            }
          }
        `}</style>
      )}

      <div style={{ display: 'flex', gap: 4, position: 'relative' }}>
        {/* Parchment-page wisps — drift up behind the picked stars during
            the Enchanted waltz, evoking the album's handwritten lyric pages. */}
        {isWaltz && (
          <>
            {WALTZ_PARCHMENTS.map((p, i) => (
              <div
                key={`wisp-${i}`}
                style={{
                  position: 'absolute',
                  bottom: -8,
                  left: `${p.left}%`,
                  width: 56,
                  height: 70,
                  marginLeft: -28,
                  borderRadius: '2px 4px 3px 5px / 4px 2px 5px 3px',
                  background: 'linear-gradient(160deg, rgba(254, 243, 199, 0.85) 0%, rgba(252, 231, 168, 0.7) 60%, rgba(180, 130, 80, 0.55) 100%)',
                  boxShadow: '0 4px 14px rgba(91, 33, 182, 0.18)',
                  pointerEvents: 'none',
                  zIndex: 0,
                  '--qs-tx': `${p.tx}px`,
                  '--qs-r1': `${p.r1}deg`,
                  '--qs-r2': `${p.r2}deg`,
                  '--qs-r3': `${p.r3}deg`,
                  animation: `qs-waltz-parchment ${p.dur}ms ${p.delay}ms ease-in-out infinite`,
                }}
              />
            ))}
          </>
        )}
        {[1, 2, 3, 4, 5].map(star => {
          const active = star <= display;
          const isHoverTarget = hovered > 0 && star <= hovered;
          // Pulse stars 1..flashLevel during the post-pick hold. Stagger by
          // 60 ms each so the animation reads as a left-to-right sweep.
          const flashing = isFlashing && star <= flashLevel;
          // Album celebrations apply to the rated stars (1..celLevel)
          const gem      = isBejeweled && star <= celLevel;
          const polaroid = isPolaroid  && star <= celLevel;
          const waltz    = isWaltz     && star <= celLevel;
          // New album-signature celebrations (Reputation/Lover/Folklore/Evermore/TPD)
          const broken     = isBrokenNeon     && star <= celLevel;
          const heat       = isHeatShimmer    && star <= celLevel;
          const sun        = isSunFlare       && star <= celLevel;
          const candle     = isCandleHalo     && star <= celLevel;
          const manuscript = isManuscriptFade && star <= celLevel;
          const redLeaf    = isRedLeafFall    && star <= celLevel;
          const neon       = isNeonBloom      && star <= celLevel;
          // Tilt each polaroid like a stuck-on-the-fridge photo
          const tilt = POLAROID_TILTS[star - 1];
          // Disabled while any celebration is running
          const celebrating =
            isFlashing || isBejeweled || isPolaroid || isWaltz ||
            isBrokenNeon || isHeatShimmer || isSunFlare || isCandleHalo || isManuscriptFade ||
            isRedLeafFall || isNeonBloom;
          return (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onRate(star)}
              disabled={celebrating}
              aria-label={`${star} star`}
              style={{
                background: 'none',
                border: 'none',
                cursor: celebrating ? 'default' : 'pointer',
                padding: '6px',
                lineHeight: 0,
                transition: 'transform 0.1s ease',
                transform: isHoverTarget ? 'scale(1.18)' : 'scale(1)',
                WebkitTapHighlightColor: 'transparent',
                animation: gem
                  ? `qs-bejeweled-pulse 0.9s ease-in-out infinite`
                  : waltz
                    ? `qs-waltz-pulse 1700ms ${star * 70}ms ease-in-out infinite`
                    : broken
                      ? `qs-broken-neon-flicker 2.5s ${star * 60}ms ease-out both, qs-star-pulse 700ms ${star * 60}ms ease-out both`
                      : heat
                        ? `qs-heat-warm 2s ${star * 50}ms ease-in-out forwards`
                        : sun
                          ? `qs-sun-warm 2s ${star * 60}ms ease-in-out forwards`
                          : candle
                            ? `qs-candle-glow 2.5s ${star * 180}ms ease-in-out forwards`
                            : manuscript
                              ? `qs-manuscript-fade 2.5s ${star * 100}ms ease-out forwards`
                              : redLeaf
                                ? `qs-red-leaf-star-frost 6s ${star * 60}ms ease-in-out forwards`
                                : neon
                                  ? `qs-89-neon-star-warm 3s ${star * 60}ms ease-in-out forwards`
                                  : flashing
                                    ? `qs-star-pulse 700ms ${star * 60}ms ease-out both`
                                    : undefined,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {polaroid ? (
                /* Polaroid frame replaces the star — used for both the
                   sepia (Tim McGraw) and burning (Picture to Burn)
                   celebrations on Debut. The animation diverges below. */
                <div
                  style={{
                    width: 52,
                    height: 62,
                    background: '#ffffff',
                    border: '1.5px solid #d6d3d1',
                    borderRadius: 2,
                    padding: '4px 4px 14px',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
                    transform: `rotate(${tilt}deg)`,
                    '--qs-tilt': `${tilt}deg`,
                    animation: isPolaroidSepia
                      ? `qs-polaroid-sepia 2500ms ${star * 80}ms ease forwards`
                      : `qs-polaroid-burn-frame 3500ms ${star * 100}ms ease forwards`,
                  }}
                >
                  {/* Photo area — looks like a faded snapshot */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #fde68a 0%, #d6a96b 50%, #a16207 100%)',
                      animation: isPolaroidBurn
                        ? `qs-polaroid-burn-img 3500ms ${star * 100}ms ease forwards`
                        : undefined,
                    }}
                  />
                </div>
              ) : (
                <svg
                  width={52}
                  height={52}
                  viewBox="0 0 20 20"
                  fill={active
                    ? (hovered > 0
                        ? '#f59e0b'
                        : (textTuning?.starFilled ?? '#a855f7'))
                    : (textTuning?.starFilled
                        ? 'transparent'
                        : '#a78bfa')}
                  style={{
                    display: 'block',
                    transition: 'fill 0.08s ease',
                    // Cycling rainbow fill + multi-color glow during the
                    // Bejeweled flash. Animation 'fill' overrides the inline
                    // fill prop while it's running.
                    animation: gem
                      ? `qs-bejeweled-shimmer 1.2s linear infinite, qs-bejeweled-glow 1.6s ease-in-out infinite`
                      : waltz
                        ? `qs-waltz-glow 1700ms ${star * 70}ms ease-in-out infinite`
                        : undefined,
                  }}
                >
                  {/* Empty stars get a thin deeper-purple outline so they
                      read as clearly tappable on any backdrop — without it,
                      pale-purple cream / lavender backgrounds wash them out.
                      Registry themes (Red, 1989) supply their own stroke. */}
                  <path
                    d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27l-4.78 2.51.91-5.32L2.27 6.62l5.34-.78L10 1z"
                    stroke={active
                      ? (textTuning?.starFilledStroke ?? 'none')
                      : (textTuning?.starEmptyStroke ?? '#7c3aed')}
                    strokeWidth={active
                      ? (textTuning?.starFilledStroke ? 1.4 : 0)
                      : (textTuning?.starEmptyStroke ? 1.4 : 0.5)}
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* Sparkle particles — 6 per gem, drifting outward in
                  different directions, each on its own delay. */}
              {gem && (
                <>
                  {BEJEWELED_SPARKS.map((spark, i) => (
                    <svg
                      key={i}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginLeft: -7,
                        marginTop: -7,
                        pointerEvents: 'none',
                        '--qs-drift': `translate(${spark.dx}px, ${spark.dy}px)`,
                        animation: `qs-bejeweled-spark-drift ${spark.dur}ms ${spark.delay}ms ease-out infinite`,
                      }}
                    >
                      <path
                        fill={spark.color}
                        d="M12 2l1.6 6L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"
                      />
                    </svg>
                  ))}
                </>
              )}

              {/* Flames — Picture to Burn celebration only. Four flames
                  start small at the bottom, rise + flicker, then fade. */}
              {polaroid && isPolaroidBurn && (
                <>
                  {POLAROID_FLAMES.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        bottom: -4,
                        left: `calc(50% + ${f.dx}px)`,
                        marginLeft: -8,
                        width: 16,
                        height: 22,
                        pointerEvents: 'none',
                        animation: `qs-flame-rise ${f.dur}ms ${f.delay + star * 100}ms ease-out infinite, qs-flame-flicker ${f.flicker}ms ease-in-out infinite`,
                        transformOrigin: 'bottom center',
                      }}
                    >
                      <svg viewBox="0 0 16 22" style={{ display: 'block' }}>
                        <path
                          d="M8 0 C 5 5, 2 8, 2 12 C 2 18, 5 21, 8 21 C 11 21, 14 18, 14 12 C 14 8, 11 5, 8 0 Z"
                          fill="url(#qs-flame-grad)"
                        />
                        <defs>
                          <linearGradient id="qs-flame-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"  stopColor="#fde047" />
                            <stop offset="40%" stopColor="#fb923c" />
                            <stop offset="100%" stopColor="#dc2626" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  ))}
                  {POLAROID_EMBERS.map((e, i) => (
                    <div
                      key={`e${i}`}
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        left: '50%',
                        width: 4,
                        height: 4,
                        marginLeft: -2,
                        borderRadius: '50%',
                        background: e.color,
                        boxShadow: `0 0 4px ${e.color}`,
                        pointerEvents: 'none',
                        '--qs-drift': `translate(${e.dx}px, ${e.dy}px)`,
                        animation: `qs-ember-rise ${e.dur}ms ${e.delay + star * 90}ms ease-out infinite`,
                      }}
                    />
                  ))}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Label list — always visible so mobile users can see descriptions without hovering.
          Before any pick (or hover), every label renders solid and dark for
          readability. As soon as the user hovers or picks a star, unselected
          rows fade back to the muted grey so the chosen label stands out. */}
      {labels && (
        <div style={{
          marginTop: 18,
          width: '100%',
          maxWidth: 272,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}>
          {labels.map((label, i) => {
            const starNum = i + 1;
            const hasPick = activeLevel > 0;
            const isActive = starNum === activeLevel;
            const isFaded = hasPick && !isActive;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: isFaded ? 0.35 : 1,
                  transition: 'opacity 0.15s ease',
                }}
              >
                <span style={{
                  fontSize: 10,
                  color: '#a855f7',
                  minWidth: 42,
                  letterSpacing: 1,
                  fontWeight: 700,
                }}>
                  {starNum}★
                </span>
                <span style={{
                  fontSize: 12,
                  color: isActive ? labelActiveColor : labelDefaultColor,
                  fontWeight: isActive ? 600 : 500,
                  transition: 'color 0.15s ease, font-weight 0.15s ease',
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Completion flash — animates in, holds briefly, fades out, then auto-closes ─
// ── Themed All-done card — used by Red/1989 album-themes ─────────────────────
// White card with the "Your top 3 from {albumName}" heading + 3 hairline-
// divided rows + a CTA pill. zIndex 20 so it sits above ambient/Layer 5b but
// below Red's leaf-blow Layer 5a (zIndex 30). Tappable anywhere to close.
function ThemedAllDoneCard({ albumIcon, albumName, topSongs, accent, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        cursor: 'pointer',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: '24px 22px 22px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          width: 300,
          maxWidth: '100%',
          cursor: 'default',
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 10 }}>{albumIcon}</div>
        <div style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#0f172a',
          lineHeight: 1.2,
          marginBottom: 18,
          textWrap: 'balance',
        }}>
          Your top 3 from {albumName}
        </div>

        {/* Top 3 — hairline-separated rows. If fewer than 3 songs are rated,
            show only what's available rather than padding placeholders. */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          marginBottom: 18,
          borderTop: topSongs.length > 0 ? '1px solid #e2e8f0' : 'none',
        }}>
          {topSongs.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 4px',
                borderBottom: '1px solid #e2e8f0',
                textAlign: 'left',
              }}
            >
              <div style={{
                fontSize: 16, fontWeight: 700,
                color: accent,
                width: 14, flex: '0 0 auto',
              }}>{i + 1}</div>
              <div style={{
                flex: 1, minWidth: 0,
                fontSize: 15, fontWeight: 700, color: '#0f172a',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{s.name}</div>
              <div style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: accent }}>{s.score}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 1 }}>/100</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '11px 18px',
            background: '#7c3aed',
            color: '#fff',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            display: 'inline-block',
          }}
        >
          See full album scores ↗
        </button>
      </div>
    </div>
  );
}

function DoneFlash({ albumIcon, albumName, songName, isSingleSong, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes qs-check-pop {
          0%   { transform: scale(0.2) rotate(-10deg); opacity: 0; }
          55%  { transform: scale(1.25) rotate(4deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
        }
        @keyframes qs-label-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes qs-overlay-out {
          0%, 55% { opacity: 1; }
          100%    { opacity: 0; }
        }
      `}</style>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: 32,
          animation: 'qs-overlay-out 2s ease forwards',
        }}
      >
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'qs-check-pop 0.45s cubic-bezier(0.17, 0.89, 0.32, 1.28) forwards',
          boxShadow: '0 4px 24px rgba(168,85,247,0.35)',
        }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{
          textAlign: 'center',
          animation: 'qs-label-in 0.35s 0.3s ease both',
          opacity: 0,
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            {isSingleSong ? 'Scored!' : 'All done!'}
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            {isSingleSong ? songName : `${albumIcon} ${albumName}`}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Lyric scroller — scrollable lyrics box above the stars on the Lyrics screen ─
function LyricScroller({ lyrics }) {
  const lines = lyrics
    ? lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 1)
    : [];

  if (!lines.length) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: 300,
      maxHeight: 110,
      overflowY: 'auto',
      marginBottom: 20,
      textAlign: 'center',
      WebkitOverflowScrolling: 'touch',
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontSize: 13,
          color: '#4c1d95',
          fontStyle: 'italic',
          lineHeight: 1.85,
        }}>
          {line}
        </div>
      ))}
    </div>
  );
}

// ── Falling trees easter egg — triggered when rating "Wood" ──────────────────
const TREE_POSITIONS = [4, 12, 21, 30, 39, 48, 57, 66, 74, 83, 91];

function FallingTrees({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <>
      <style>{`
        @keyframes tree-fall {
          0%   { transform: translateY(-80px) rotate(-8deg); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(12deg); opacity: 0; }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        {TREE_POSITIONS.map((left, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: `${left}%`,
              fontSize: 28 + (i % 3) * 6,
              animation: `tree-fall ${1.8 + (i % 5) * 0.28}s ${i * 0.18}s ease-in both`,
              userSelect: 'none',
            }}
          >
            🌲
          </div>
        ))}
      </div>
    </>
  );
}

// ── Shared scatter positions for floating lyrics background ──────────────────
const SPOTS = [
  { top: '6%',  left: '3%',  right: undefined, maxWidth: '42%', size: 15 },
  { top: '12%', left: undefined, right: '3%',  maxWidth: '40%', size: 16 },
  { top: '20%', left: '7%',  right: undefined, maxWidth: '44%', size: 17 },
  { top: '30%', left: undefined, right: '5%',  maxWidth: '38%', size: 15 },
  { top: '52%', left: '2%',  right: undefined, maxWidth: '43%', size: 16 },
  { top: '62%', left: undefined, right: '4%',  maxWidth: '40%', size: 15 },
  { top: '71%', left: '9%',  right: undefined, maxWidth: '44%', size: 17 },
  { top: '80%', left: undefined, right: '4%',  maxWidth: '38%', size: 16 },
  { top: '87%', left: '5%',  right: undefined, maxWidth: '44%', size: 15 },
  { top: '93%', left: undefined, right: '8%',  maxWidth: '40%', size: 16 },
];

// Floating lyrics scattered across the background — used on every screen.
// animating=true triggers the pulse-out transition instead of the fade-in.
function FloatingLyrics({ lyrics, animating = false }) {
  if (window.innerWidth < 768) return null;

  const lines = lyrics
    ? lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 2).slice(0, 10)
    : [];

  if (!lines.length) return null;

  return (
    <>
      <style>{`
        @keyframes lyric-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 0.32; transform: translateY(0); }
        }
        @keyframes lyric-pulse {
          0%   { opacity: 0.32; transform: translateY(0); }
          45%  { opacity: 0.65; transform: translateY(-4px); }
          100% { opacity: 0;    transform: translateY(-8px); }
        }
      `}</style>
      {lines.map((line, i) => {
        const spot = SPOTS[i];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: spot.top,
              left: spot.left,
              right: spot.right,
              maxWidth: spot.maxWidth,
              fontSize: spot.size,
              color: '#7c3aed',
              fontStyle: 'italic',
              lineHeight: 1.5,
              pointerEvents: 'none',
              userSelect: 'none',
              animation: animating
                ? `lyric-pulse 0.72s ${i * 0.04}s ease both`
                : `lyric-in 1s ${i * 0.14}s ease both`,
            }}
          >
            {line}
          </div>
        );
      })}
    </>
  );
}

// ── No-bridge notice — shown when a song has no bridge section ───────────────
function NoBridgeScreen({ songName, onContinue }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 36px',
      textAlign: 'center',
      gap: 0,
    }}>
      {/* Icon */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: '#f3e8ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        fontSize: 28,
      }}>
        🎵
      </div>

      {/* Message */}
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: 12, maxWidth: 300 }}>
        {songName} has no bridge.
      </div>
      <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, maxWidth: 280, marginBottom: 40 }}>
        Bridge score has been combined with Lyric category score.
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        style={{
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          border: 'none',
          borderRadius: 14,
          padding: '14px 40px',
          fontSize: 15,
          fontWeight: 600,
          color: '#ffffff',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Continue →
      </button>
    </div>
  );
}

// ── Shuffle screen — Play/Skip question with song lyrics floating in background ─
// Lyrics fade in softly, then pulse up and out when the user picks an answer,
// creating a bridge into the detailed rating questions.
function ShuffleScreen({ song, albumName, albumIcon, lyrics, onPick, currentRating = 0, categoryNumber = 1, totalCategories = 1, isNightTheme = false, isDebutTheme = false, isSpeakNowTheme = false, isFearlessTheme = false }) {
  const [animating, setAnimating] = useState(false);

  // Show the previous pick (if any) by fading the unpicked side. Mirrors
  // how YesNoPicker indicates a prior Yes/No choice.
  const prevPlay = currentRating === 5;
  const prevSkip = currentRating === 1;
  const hasPrev = prevPlay || prevSkip;
  // Themed albums all want the parent backdrop to bleed through; only
  // the un-themed default keeps the original soft white→lavender gradient.
  const useThemeBackdrop = isNightTheme || isDebutTheme || isSpeakNowTheme || isFearlessTheme;

  function handlePick(val) {
    if (animating) return;
    setAnimating(true);
    // Let the transition animation finish before handing control back to the parent
    setTimeout(() => onPick(val), 720);
  }

  return (
    <>
      <style>{`
        @keyframes shuffle-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes shuffle-btn-pop {
          0%   { transform: scale(1); }
          35%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // Themed albums use transparent so the parent backdrop +
        // ambient scene show through; otherwise the original soft
        // white→lavender gradient still ships.
        background: useThemeBackdrop
          ? 'transparent'
          : 'linear-gradient(180deg, #ffffff 0%, #fdf8ff 100%)',
        animation: animating ? 'shuffle-fade-out 0.72s ease forwards' : 'none',
      }}>
        {/* Floating lyrics in background */}
        <FloatingLyrics lyrics={lyrics} animating={animating} />

        {/* Center content */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Album context */}
          <div style={{ fontSize: 12, color: '#c4b5fd', marginBottom: 18, letterSpacing: '0.02em' }}>
            {albumIcon} {albumName}
          </div>

          {/* Song name */}
          <div style={{
            fontSize: 24,
            fontWeight: 700,
            color: isNightTheme ? '#f3f4f6' : '#111827',
            lineHeight: 1.3,
            marginBottom: 14,
            maxWidth: 300,
            textShadow: isNightTheme ? '0 1px 8px rgba(0,0,0,0.4)' : 'none',
          }}>
            {song.name}
          </div>

          {/* Category counter — mirrors the label on the star screens so the
              user sees this is question 1 of N, not a standalone choice. */}
          <div style={{
            fontSize: 12,
            color: isNightTheme ? '#cbd5e1' : '#c4b5fd',
            marginBottom: 18,
            textShadow: isNightTheme ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
          }}>
            Category {categoryNumber} of {totalCategories}
          </div>

          {/* Question */}
          <div style={{ fontSize: 15, color: isNightTheme ? '#cbd5e1' : '#9ca3af', marginBottom: 52 }}>
            If this came on shuffle right now...
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 20 }}>
            {/* ▶ Play — dims when the user previously picked Skip */}
            <button
              onClick={() => handlePick(5)}
              disabled={animating}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                border: 'none',
                borderRadius: 22,
                padding: '24px 30px',
                cursor: animating ? 'default' : 'pointer',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 600,
                minWidth: 114,
                boxShadow: prevPlay
                  ? '0 0 0 3px rgba(168,85,247,0.35), 0 4px 24px rgba(168,85,247,0.5)'
                  : '0 4px 24px rgba(168,85,247,0.4)',
                opacity: hasPrev && !prevPlay ? 0.45 : 1,
                transition: 'opacity 0.15s ease, box-shadow 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
                animation: animating ? 'shuffle-btn-pop 0.3s ease' : 'none',
              }}
            >
              {/* Standard play triangle */}
              <svg width={46} height={46} viewBox="0 0 24 24" fill="none">
                <polygon points="6,3 21,12 6,21" fill="white" />
              </svg>
              Play
            </button>

            {/* ⏭ Skip — dims when the user previously picked Play */}
            <button
              onClick={() => handlePick(1)}
              disabled={animating}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                background: '#f9fafb',
                border: prevSkip ? '1.5px solid #a855f7' : '1.5px solid #e5e7eb',
                borderRadius: 22,
                padding: '24px 30px',
                cursor: animating ? 'default' : 'pointer',
                color: prevSkip ? '#5b21b6' : '#6b7280',
                fontSize: 15,
                fontWeight: 600,
                minWidth: 114,
                opacity: hasPrev && !prevSkip ? 0.45 : 1,
                boxShadow: prevSkip ? '0 0 0 3px rgba(168,85,247,0.18)' : 'none',
                transition: 'opacity 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
                animation: animating ? 'shuffle-btn-pop 0.3s ease' : 'none',
              }}
            >
              {/* Skip-forward: two chevrons + a bar */}
              <svg width={46} height={46} viewBox="0 0 24 24" fill="none">
                <polygon points="4,5 11,12 4,19" fill="#9ca3af" />
                <polygon points="11,5 18,12 11,19" fill="#d1d5db" />
                <rect x="19.5" y="5" width="2" height="14" rx="1" fill="#9ca3af" />
              </svg>
              Skip
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Yes/No binary picker — used for custom categories with type 'yesno' ──────
function YesNoPicker({ currentRating, onRate }) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <button
        onClick={() => onRate(5)}
        style={{
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          border: 'none',
          borderRadius: 16,
          padding: '20px 44px',
          fontSize: 17,
          fontWeight: 700,
          color: '#ffffff',
          cursor: 'pointer',
          opacity: currentRating === 1 ? 0.5 : 1,
          boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
          WebkitTapHighlightColor: 'transparent',
          transition: 'opacity 0.15s ease',
        }}
      >
        Yes
      </button>
      <button
        onClick={() => onRate(1)}
        style={{
          background: '#f9fafb',
          border: '1.5px solid #e5e7eb',
          borderRadius: 16,
          padding: '20px 44px',
          fontSize: 17,
          fontWeight: 700,
          color: '#6b7280',
          cursor: 'pointer',
          opacity: currentRating === 5 ? 0.5 : 1,
          WebkitTapHighlightColor: 'transparent',
          transition: 'opacity 0.15s ease',
        }}
      >
        No
      </button>
    </div>
  );
}

// ── Main QuickScore overlay ───────────────────────────────────────────────────
// songs         — displaySongs array [{name, index}] from SongList
// albumId       — used to look up bridge lyrics and ratings
// albumName/Icon— display info
// activeCategories — [{id, name, weight}]
// ratings       — raw ratings object from useRatings
// onRate(songIndex, catId, val) — saves a rating
// onClose       — dismisses the overlay
// spotify            — object from useSpotify (optional; omit to disable Spotify features)
// spotifyAutoplay    — boolean; when true, song plays automatically on each advance
// spotifyBridgeAutoplay — boolean; when true, bridge plays automatically when Bridge category appears
// confirmExit        — boolean; when true, shows confirmation dialog before closing
// onGoToSpotifySettings — callback to navigate the user to the Settings tab
// updateSetting      — updateSetting function from useSettings (for bridge autoplay suggestion)
const BRIDGE_PLAY_COUNT_KEY = 'eras_bridge_play_count';
const BRIDGE_AUTOPLAY_NUDGE_KEY = 'eras_bridge_autoplay_nudged';

export default function QuickScore({
  songs,
  albumId,
  albumName,
  albumIcon,
  activeCategories,
  ratings,
  onRate,
  onClose,
  initialSongPos = 0,
  spotify,
  // Pro-only playback gate — autoplay, mini player, and Play Bridge button all
  // depend on this. Free users with Spotify connected still get album art
  // through useSpotify, but the rating screen treats them like any other
  // non-playback user.
  isPro = false,
  spotifyAutoplay = true,
  spotifyBridgeAutoplay = false,
  confirmExit = true,
  onGoToSpotifySettings,
  updateSetting,
  // Optional — used by the registry-driven All-done card to compute live
  // top-3 from the latest ratings. Falls back to whatever score is on
  // songs[i] when not provided.
  getCompositeScore,
}) {
  // Set true for the rest of the session when the user taps "Try it" on the
  // 30-song Pro upsell. Acts as a one-session bypass on the isPro gate so
  // the next songs autoplay as a free taste of the Pro experience.
  const [demoAutoplay, setDemoAutoplay] = useState(false);
  // The 30-song upsell modal — set to a deferred-advance object when we want
  // to interrupt the song-to-song transition with the nudge.
  const [pendingNudgeAdvance, setPendingNudgeAdvance] = useState(null);

  const playbackEnabled = isPro || demoAutoplay;
  const [songPos, setSongPos] = useState(initialSongPos);
  const [catPos, setCatPos] = useState(0);
  const [done, setDone] = useState(false);
  const [showTrees, setShowTrees] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showBridgeSuggestion, setShowBridgeSuggestion] = useState(false);
  const [bridgeSuggestionToggle, setBridgeSuggestionToggle] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const pendingRef = useRef(null);

  // Hold-and-flash after a rating: keep the picked stars visible for ~900 ms
  // and run a brief pulse animation on the active stars before advancing to
  // the next category. Without this, the list jumps so fast the user can't
  // confirm what they picked.
  const [flashLevel, setFlashLevel] = useState(0);
  const advanceTimeoutRef = useRef(null);

  // Album-signature celebration — a longer, fancier moment that fires
  // after the user finishes rating a specific song on a themed album.
  // Shape: { type: 'bejeweled' | 'polaroid' | ..., level: 1..5 } | null
  // level is the picked star value so the celebration can target only the
  // rated stars. detectCelebration() below decides which (if any) applies.
  const [celebration, setCelebration] = useState(null);

  const isSingleSong = songs.length === 1;

  // ── Spotify autoplay: start playing from shuffle timestamp on new song ───
  // Gated on playbackEnabled so free users (who can connect Spotify for album
  // art) don't get autoplay unless they're Pro or in a one-time "Try it" demo.
  useEffect(() => {
    if (!playbackEnabled) return;
    if (!spotify?.isConnected || !spotify?.playerReady || !spotifyAutoplay) return;
    const song = songs[songPos];
    if (!song) return;
    spotify.playTrack(albumId, song.index, song.name, albumName, 'shuffle');
  }, [songPos, spotify?.playerReady, playbackEnabled]); // eslint-disable-line react-hooks/exhaustive-deps


  // ── Bridge autoplay: seek to bridge timestamp when Bridge category appears ─
  // Gated on hasBridge (data-only) so the lyrics display kill switch can't
  // silently disable bridge playback. Previously this used showBridgeLyrics,
  // which is false whenever LYRICS_DISPLAY_ENABLED is off — meaning autoplay
  // never fired and the manual button was also hidden, leaving users stuck.
  useEffect(() => {
    if (!playbackEnabled) return;
    if (
      currentCat?.id === 'bridge' &&
      spotifyBridgeAutoplay &&
      spotify?.isConnected &&
      spotify?.playerReady &&
      currentSong &&
      hasBridge(albumId, currentSong.index)
    ) {
      spotify.playTrack(albumId, currentSong.index, currentSong.name, albumName, 'bridge');
    }
  }, [songPos, catPos, playbackEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pause when QuickScore closes ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      spotify?.pause?.();
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fade transition: after content fades out, commit pending state, fade back in ─
  useEffect(() => {
    if (!isVisible && pendingRef.current) {
      const t = setTimeout(() => {
        const next = pendingRef.current;
        pendingRef.current = null;
        if (next.done) {
          setDone(true);
        } else {
          if (next.songPos !== undefined) setSongPos(next.songPos);
          setCatPos(next.catPos ?? 0);
        }
        setIsVisible(true);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  // Pre-compute effective categories per song.
  // • Bridge is skipped for songs without bridge lyrics.
  // • Replay (Skip on shuffle?) is always sorted to the front when present.
  const songsWithCats = songs.map(song => {
    let cats = activeCategories.map(cat =>
      cat.id === 'bridge' && !hasBridge(albumId, song.index)
        ? { ...cat, noBridge: true }
        : cat
    );
    const replayIdx = cats.findIndex(c => c.id === 'replay');
    if (replayIdx > 0) {
      cats = [cats[replayIdx], ...cats.slice(0, replayIdx), ...cats.slice(replayIdx + 1)];
    }
    return { ...song, cats };
  });

  const totalSteps = songsWithCats.reduce((acc, s) => acc + s.cats.length, 0);
  const completedSteps =
    songsWithCats.slice(0, songPos).reduce((acc, s) => acc + s.cats.length, 0) + catPos;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const currentSong = songsWithCats[songPos];
  const currentCat = currentSong?.cats[catPos];

  const currentRating =
    currentSong && currentCat
      ? ratings[`${albumId}_${currentSong.index}`]?.[currentCat.id] || 0
      : 0;

  // Bridge lyrics — shown inline when rating the bridge category.
  const bridgeLyrics = currentSong
    ? getBridgeLyrics(albumId, currentSong.index)
    : null;

  // Snippet lyrics — best available section (bridge > chorus > verse 1) for the
  // shuffle screen background. Covers nearly every song, not just ones with bridges.
  const snippetLyrics = currentSong
    ? getSnippetLyrics(albumId, currentSong.index)
    : null;

  // Whether the current question is the bridge category
  const showBridgeLyrics = currentCat?.id === 'bridge' && bridgeLyrics;

  // Whether to show the Play Bridge button. Computed from data-only checks
  // (hasBridge, spotify state) so the lyrics display kill switch can hide
  // the on-screen lyrics without also hiding the seek-to-bridge feature.
  // Always shown when the song actually has a bridge and Spotify is ready —
  // even if bridge-autoplay is on, the user can use this to replay the
  // bridge or rescue a missed autoplay.
  const songHasBridge = currentSong
    ? hasBridge(albumId, currentSong.index)
    : false;
  const showPlayBridge =
    currentCat?.id === 'bridge' &&
    songHasBridge &&
    spotify?.isConnected &&
    spotify?.playerReady &&
    playbackEnabled;

  const isFirstStep = songPos === 0 && catPos === 0;

  function goBack() {
    if (isFirstStep) return;
    // If a hold-and-flash is in progress, cancel it before navigating back.
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
      setFlashLevel(0);
      setCelebration(null);
    }
    pendingRef.current = catPos > 0
      ? { catPos: catPos - 1 }
      : { songPos: songPos - 1, catPos: songsWithCats[songPos - 1].cats.length - 1 };
    setIsVisible(false);
  }

  // Performs the actual transition — ShuffleScreen has its own fade timing,
  // every other category uses the cross-fade helper below.
  function performAdvance(next) {
    if (currentCat?.id === 'replay') {
      if (next.done) { setDone(true); }
      else { if (next.songPos !== undefined) setSongPos(next.songPos); setCatPos(next.catPos ?? 0); }
      return;
    }
    pendingRef.current = next;
    setIsVisible(false);
  }

  function advance() {
    const nextCat = catPos + 1;
    let next;
    let isNextSong = false;
    if (nextCat < currentSong.cats.length) {
      next = { catPos: nextCat };
    } else {
      const nextSong = songPos + 1;
      if (nextSong < songsWithCats.length) {
        next = { songPos: nextSong, catPos: 0 };
        isNextSong = true;
      } else {
        next = { done: true };
      }
    }

    // Soft Pro upsell: only fires between songs (not between categories,
    // not on the very last song), only for Spotify-connected Premium-but-
    // not-Pro users who haven't seen the prompt yet, once they've crossed
    // the threshold. Non-Premium Spotify users are excluded — Pro alone
    // can't unlock autoplay for them, so the upsell would be misleading.
    // Counting Object.keys(ratings).length matches how useUserStats tracks
    // unique songs rated.
    if (
      isNextSong &&
      !isPro &&
      !demoAutoplay &&
      spotify?.isConnected &&
      spotify?.isPremium &&
      !hasSeenAutoplayNudge() &&
      Object.keys(ratings).length >= AUTOPLAY_NUDGE_THRESHOLD
    ) {
      setPendingNudgeAdvance(next);
      return;
    }

    performAdvance(next);
  }

  function handleTryAutoplay() {
    markAutoplayNudgeSeen();
    setDemoAutoplay(true);
    const next = pendingNudgeAdvance;
    setPendingNudgeAdvance(null);
    if (next) performAdvance(next);
  }

  function handleNudgeLater() {
    markAutoplayNudgeSeen();
    const next = pendingNudgeAdvance;
    setPendingNudgeAdvance(null);
    if (next) performAdvance(next);
  }

  function handleRate(val) {
    onRate(currentSong.index, currentCat.id, val);
    if (currentSong.name === 'Wood') setShowTrees(true);
    setFlashLevel(val);

    // After the user finishes rating the song's last category, check
    // whether this song earns an album-signature celebration moment.
    const isLastCategory = catPos === (currentSong?.cats.length - 1);
    const cel = isLastCategory
      ? detectCelebration(albumId, currentSong?.name)
      : null;
    if (cel) setCelebration({ type: cel.type, level: val });

    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    advanceTimeoutRef.current = setTimeout(() => {
      advanceTimeoutRef.current = null;
      setFlashLevel(0);
      setCelebration(null);
      advance();
    }, cel ? cel.durationMs : 900);
  }

  // Called by ShuffleScreen after its own transition animation finishes (~720ms)
  function handleShufflePick(val) {
    onRate(currentSong.index, currentCat.id, val);
    advance();
  }

  // Album themes — replace category backgrounds with an album-specific
  // backdrop and render an ambient decoration layer.
  const isNightTheme      = albumId === 'ml';   // Midnights — dark sky
  const isDebutTheme      = albumId === 'tv';   // Taylor Swift (Debut) — cream + memorabilia
  const isSpeakNowTheme   = albumId === 'st';   // Speak Now — enchanted purple
  const isFearlessTheme   = albumId === 'fe';   // Fearless — golden hour + glitter motes
  const isReputationTheme = albumId === 'rp';   // Reputation — matte-black + snake + ink
  const isLoverTheme      = albumId === 'lv';   // Lover — cotton-candy + rainbow + hearts
  const isFolkloreTheme   = albumId === 'fl';   // Folklore — misty grey-green + fog + pines
  const isEvermoreTheme   = albumId === 'ev';   // Evermore — amber + autumn leaves
  const isTPDTheme        = albumId === 'tp';   // Tortured Poets — parchment + ink
  const isShowgirlTheme   = albumId === 'ls';   // Life of a Showgirl — cabaret + spotlight

  // Per-album theme bundle (Red, 1989) — pulled from the registry so the
  // 5-layer system (backdrop, ambient, signature, complete, text tuning)
  // is reused without per-theme branching here. New themes plug in by
  // registering in src/themes/albumThemes/.
  const albumTheme = getAlbumTheme(albumId);
  const isRedTheme  = albumId === 'rd';
  const is1989Theme = albumId === '89';
  const isRegistryTheme = !!albumTheme;

  // True for any theme whose backdrop runs dark (light text required). Used
  // to swap progress-bar bg, exit-button styling, and song-title colors.
  const isDarkTheme = isNightTheme || isReputationTheme || isEvermoreTheme || isShowgirlTheme || isRedTheme;

  const albumBackground = albumTheme
    ? albumTheme.background
    : isNightTheme
      ? NIGHT_BACKGROUND
      : isDebutTheme
        ? DEBUT_BACKGROUND
        : isSpeakNowTheme
          ? SPEAKNOW_BACKGROUND
          : isFearlessTheme
            ? FEARLESS_BACKGROUND
            : isReputationTheme
              ? REPUTATION_BACKGROUND
              : isLoverTheme
                ? LOVER_BACKGROUND
                : isFolkloreTheme
                  ? FOLKLORE_BACKGROUND
                  : isEvermoreTheme
                    ? EVERMORE_BACKGROUND
                    : isTPDTheme
                      ? TPD_BACKGROUND
                      : isShowgirlTheme
                        ? SHOWGIRL_BACKGROUND
                        : null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: albumBackground
      ? albumBackground
      : (currentCat && currentCat.id !== 'replay'
          ? (CAT_BACKGROUNDS[currentCat.id] ?? '#ffffff')
          : '#ffffff'),
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'background 0.3s ease',
  };

  if (done) {
    // Registry-driven themes (Red, 1989) get the new top-3 All-done card
    // instead of the legacy DoneFlash. Single-song re-rates skip the
    // album-complete card entirely (still shows DoneFlash) since "your top 3"
    // doesn't make sense for a one-song session.
    if (isRegistryTheme && !isSingleSong) {
      const ThemeScene = albumTheme.Scene;
      const ThemeComplete = albumTheme.CompleteMoment;
      // Compute top 3 from the latest live ratings — passing through
      // getCompositeScore so a song the user just rated lands in the list.
      const scored = songs
        .map(s => ({
          name: s.name,
          score: getCompositeScore
            ? getCompositeScore(albumId, s.index, activeCategories)
            : s.score,
        }))
        .filter(s => s.score !== null && s.score !== undefined)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return (
        <div style={overlayStyle}>
          {/* Layer 2 — keep the world alive on the complete screen */}
          {ThemeScene && <ThemeScene />}
          {/* Layer 5 — complete decoration. zIndex set inside the component
              (Red sits at 30 in front of the card; 1989 at 5 behind it). */}
          {ThemeComplete && <ThemeComplete />}
          {/* All-done card — z-index 20 — sits above ambient + 1989 polaroids
              but below Red leaves blowing through. */}
          <ThemedAllDoneCard
            albumIcon={albumIcon}
            albumName={albumName}
            topSongs={scored}
            accent={albumTheme.textTuning?.accent ?? '#7c3aed'}
            onClose={onClose}
          />
        </div>
      );
    }

    return (
      <div style={overlayStyle}>
        {/* Album-complete decorations — only on full album sessions, not
            single-song re-rates. Each renders behind DoneFlash so the card
            still pops cleanly in the foreground. */}
        {!isSingleSong && (
          <>
            {isFearlessTheme   && <FearlessFireworks />}
            {isReputationTheme && <ReputationStageLight />}
            {isLoverTheme      && <LoverCompleteLogo />}
            {isFolkloreTheme   && <FolkloreCompleteSnow />}
            {isEvermoreTheme   && <EvermoreCompleteWord />}
            {isTPDTheme        && <TPDManuscriptComplete />}
            {isShowgirlTheme   && <ShowgirlCurtain />}
          </>
        )}
        <DoneFlash
          albumIcon={albumIcon}
          albumName={albumName}
          songName={songs[0]?.name}
          isSingleSong={isSingleSong}
          onClose={onClose}
        />
      </div>
    );
  }

  const isShuffleQuestion = currentCat?.id === 'replay';
  const isNoBridgeNotice = currentCat?.noBridge === true;

  return (
    <div style={overlayStyle}>
      {/* Keyframes — pulse animation applied to picked stars during the
          900 ms hold after a rating, so the user can see what they chose. */}
      <style>{`
        @keyframes qs-star-pulse {
          0%   { transform: scale(1);    filter: drop-shadow(0 0 0 rgba(168,85,247,0)); }
          30%  { transform: scale(1.18); filter: drop-shadow(0 0 8px rgba(168,85,247,0.65)); }
          100% { transform: scale(1);    filter: drop-shadow(0 0 0 rgba(168,85,247,0)); }
        }
      `}</style>

      {/* Album-specific ambient scenes */}
      {isNightTheme && <NightSky />}
      {isDebutTheme && <DebutScene />}
      {isSpeakNowTheme && <SpeakNowScene />}
      {isFearlessTheme && <FearlessScene />}
      {isReputationTheme && <ReputationScene />}
      {isLoverTheme && <LoverScene />}
      {isFolkloreTheme && <FolkloreScene />}
      {isEvermoreTheme && <EvermoreScene />}
      {isTPDTheme && <TPDScene />}
      {isShowgirlTheme && <ShowgirlScene />}

      {/* Layer 2 — registry-driven ambient scene (Red, 1989). zIndex 1
          inside the component, pointer-events: none. */}
      {isRegistryTheme && albumTheme.Scene && <albumTheme.Scene />}

      {/* Layer 4 — registry-driven signature moment. Fires when the
          celebration type matches the theme's signatureKey. */}
      {isRegistryTheme &&
        albumTheme.SignatureMoment &&
        celebration?.type === albumTheme.signatureKey && <albumTheme.SignatureMoment />}

      {showTrees && <FallingTrees onDone={() => setShowTrees(false)} />}

      {/* Song-signature celebration moments — render once per song's last
          category, alongside the StarPicker. Each unmounts when QuickScore
          clears the celebration after detectCelebration's durationMs. */}
      {celebration?.type === 'horse-gallop'    && <LoveStoryHorse />}
      {celebration?.type === 'sun-flare'       && <SunFlareOverlay />}
      {/* Broken-neon, heat-shimmer, candle-halo, and manuscript-fade overlays
          live alongside the star area; they're rendered inside the question
          column further down so they wrap the picked stars correctly. */}

      {/* Progress bar */}
      <div style={{
        height: 4,
        background: isDarkTheme ? 'rgba(168,85,247,0.18)' : '#f3e8ff',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>
        <div
          style={{
            height: '100%',
            background: isReputationTheme ? '#67e8f9' : isShowgirlTheme ? '#fbbf24' : '#a855f7',
            width: `${progress}%`,
            transition: 'width 0.25s ease',
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>

      {/* Top bar — back + song counter + exit */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ width: 60 }} />
        <div style={{ fontSize: 12, color: isDarkTheme ? '#cbd5e1' : '#9ca3af' }}>
          {isSingleSong ? '\u00a0' : `Song ${songPos + 1} of ${songs.length}`}
        </div>
        <button
          onClick={() => {
            if (confirmExit && completedSteps > 0) {
              setShowExitConfirm(true);
            } else {
              onClose();
            }
          }}
          style={{
            background: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'none',
            border: isDarkTheme ? '0.5px solid rgba(255,255,255,0.18)' : '0.5px solid #e5e7eb',
            borderRadius: 8,
            padding: '5px 12px',
            cursor: 'pointer',
            fontSize: 13,
            color: isDarkTheme ? '#e5e7eb' : '#6b7280',
          }}
        >
          ✕ Exit
        </button>
      </div>

      {isShuffleQuestion ? (
        <ShuffleScreen
          key={`${songPos}-shuffle`}
          song={currentSong}
          albumName={albumName}
          albumIcon={albumIcon}
          lyrics={snippetLyrics}
          onPick={handleShufflePick}
          currentRating={currentRating}
          categoryNumber={catPos + 1}
          totalCategories={currentSong?.cats.length ?? 1}
          isNightTheme={isNightTheme}
          isDebutTheme={isDebutTheme}
          isSpeakNowTheme={isSpeakNowTheme}
          isFearlessTheme={isFearlessTheme}
        />
      ) : (
        /* ── Fading wrapper — covers both NoBridgeScreen and star questions ── */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.15s ease',
            pointerEvents: isVisible ? 'auto' : 'none',
            position: 'relative',
            zIndex: 10,
          }}
        >

      {/* ── No-bridge notice ── */}
      {isNoBridgeNotice ? (
        <NoBridgeScreen
          key={`${songPos}-nobridge`}
          songName={currentSong.name}
          onContinue={advance}
        />
      ) : (
        /* ── Normal star-rating question ── */
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 28px 20px',
            gap: 0,
            textAlign: 'center',
          }}
        >
          {/* Floating lyrics background */}
          <FloatingLyrics key={`${songPos}-lyrics`} lyrics={snippetLyrics} />

          {/* Center content sits above the floating lyrics */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

          {/* Album context */}
          <div style={{
            fontSize: 12,
            color: albumTheme?.textTuning?.subCounter
              || (isDarkTheme ? '#fde68a' : '#c4b5fd'),
            marginBottom: 20,
            letterSpacing: '0.02em',
            textShadow: isDarkTheme ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
          }}>
            {albumIcon} {albumName}
          </div>

          {/* Song name / Spotify mini player. Free Spotify-connected users get
              album art across the app, but the inline mini player implies
              playback control — gated on playbackEnabled so they see the plain
              song title here instead of a non-functional player. */}
          {spotify?.isConnected && playbackEnabled ? (
            <SpotifyMiniPlayer
              isConnected={!!spotify?.isConnected}
              playerReady={!!spotify?.playerReady}
              isPlaying={!!spotify?.isPlaying}
              songName={currentSong?.name}
              trackUri={spotify?.currentTrackUri}
              onTogglePlay={spotify?.togglePlay}
              onGoToSettings={onGoToSpotifySettings}
              style={{ margin: `0 0 ${currentCat?.id === 'lyrics' ? 16 : 32}px`, width: '100%', maxWidth: 300 }}
            />
          ) : (
            <div style={{
              fontSize: 22,
              fontWeight: isTPDTheme ? 800 : 700,
              color: albumTheme?.textTuning?.songTitle
                || (isReputationTheme
                  ? '#ffffff'
                  : isEvermoreTheme
                    ? '#fef3c7'
                    : isShowgirlTheme
                      ? '#fffbeb'
                      : isDarkTheme
                        ? '#f3f4f6'
                        : '#111827'),
              lineHeight: 1.3,
              marginBottom: currentCat?.id === 'lyrics' ? 16 : 32,
              maxWidth: 320,
              textShadow: isDarkTheme ? '0 1px 8px rgba(0,0,0,0.45)' : 'none',
              fontFamily: isTPDTheme
                ? "'Georgia', 'Garamond', serif"
                : 'inherit',
            }}>
              {currentSong?.name}
            </div>
          )}

          {/* Category label — colors per theme.
              Night (Midnights): brand purple washes out → lavender + light grey.
              Debut: cream backdrop wants a deeper, dusty rose-mauve so the
              label reads warmly against the wood-grain warmth.
              Speak Now: light-purple backdrop demands a deep amethyst with a
              serif italic feel to echo the album's handwritten lyric booklet.
              Fearless: warm amber (#b45309) reads richly against the
              golden-hour gradient. */}
          <div style={{
            fontSize: isSpeakNowTheme ? 13 : 12,
            fontWeight: isLoverTheme || isTPDTheme ? 800 : 700,
            color: albumTheme?.textTuning?.categoryLabel
              || (isNightTheme
                ? '#e9d5ff'
                : isDebutTheme
                  ? '#9d3c5b'
                  : isSpeakNowTheme
                    ? '#5b21b6'
                    : isFearlessTheme
                      ? '#b45309'
                      : isReputationTheme
                        ? '#67e8f9'   // neon cyan on matte black
                        : isLoverTheme
                          ? '#7c3aed' // bold purple on cotton candy
                          : isFolkloreTheme
                            ? '#1e293b' // deep slate on misty grey-green
                            : isEvermoreTheme
                              ? '#fbbf24' // warm gold on burgundy
                              : isTPDTheme
                                ? '#1c1917' // bold black on parchment
                                : isShowgirlTheme
                                  ? '#fbbf24' // bright gold on magenta
                                  : '#a855f7'),
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 4,
            textShadow: isNightTheme || isReputationTheme || isShowgirlTheme
              ? '0 1px 4px rgba(0,0,0,0.5)'
              : 'none',
            fontFamily: isSpeakNowTheme || isTPDTheme
              ? "'Georgia', 'Garamond', serif"
              : 'inherit',
            fontStyle: isSpeakNowTheme ? 'italic' : 'normal',
          }}>
            {currentCat?.name}
          </div>
          <div style={{
            fontSize: 12,
            color: albumTheme?.textTuning?.subCounter
              || (isNightTheme
                ? '#cbd5e1'
                : isDebutTheme
                  ? '#78716c'
                  : isSpeakNowTheme
                    ? '#7c3aed'
                    : isFearlessTheme
                      ? '#92400e'
                      : isReputationTheme
                        ? '#9ca3af'
                        : isLoverTheme
                          ? '#6d28d9'
                          : isFolkloreTheme
                            ? '#475569'
                            : isEvermoreTheme
                              ? '#fde68a'
                              : isTPDTheme
                                ? '#44403c'
                                : isShowgirlTheme
                                  ? '#fde68a'
                                  : '#c4b5fd'),
            marginBottom: currentCat?.id === 'lyrics' ? 14 : 32,
            textShadow: isDarkTheme ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
            fontFamily: isSpeakNowTheme || isTPDTheme
              ? "'Georgia', 'Garamond', serif"
              : 'inherit',
            fontStyle: isSpeakNowTheme ? 'italic' : 'normal',
          }}>
            Category {catPos + 1} of {currentSong?.cats.length}
          </div>

          {/* Lyric scroller — shown when rating the Lyrics category */}
          {currentCat?.id === 'lyrics' && snippetLyrics && (
            <LyricScroller key={`${songPos}`} lyrics={snippetLyrics} />
          )}

          {/* Bridge lyrics quote — gated on the lyrics display kill switch.
              Rendered independently of the Play Bridge button below so the
              button still appears when on-screen lyrics are disabled. */}
          {showBridgeLyrics && (
            <div style={{
              fontSize: 12,
              color: '#a78bfa',
              fontStyle: 'italic',
              marginBottom: showPlayBridge ? 14 : 28,
              maxWidth: 300,
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
            }}>
              "{bridgeLyrics}"
            </div>
          )}

          {/* Play Bridge button — visible whenever Spotify is connected on
              the bridge category. Independent of LYRICS_DISPLAY_ENABLED so
              hiding lyric text never hides the seek-to-bridge feature. */}
          {showPlayBridge && (
            <button
              onClick={() => {
                spotify.playTrack(albumId, currentSong.index, currentSong.name, albumName, 'bridge');
                const prev = Number(localStorage.getItem(BRIDGE_PLAY_COUNT_KEY) || 0);
                const next = prev + 1;
                localStorage.setItem(BRIDGE_PLAY_COUNT_KEY, String(next));
                const alreadyNudged = localStorage.getItem(BRIDGE_AUTOPLAY_NUDGE_KEY) === 'true';
                if (next === 11 && !alreadyNudged) {
                  localStorage.setItem(BRIDGE_AUTOPLAY_NUDGE_KEY, 'true');
                  setShowBridgeSuggestion(true);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 24,
                fontSize: 13,
                fontWeight: 600,
                color: '#111827',
                cursor: 'pointer',
                marginBottom: 28,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              {/* Spotify logo — green on white per branding guidelines */}
              <svg width="20" height="20" viewBox="0 0 24 24" aria-label="Spotify" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="12" fill="#1DB954" />
                <path d="M17.25 16.31c-.19.31-.6.41-.91.22-2.49-1.52-5.63-1.87-9.33-1.02-.35.08-.7-.13-.79-.48-.08-.35.13-.7.48-.79 4.05-.93 7.52-.53 10.33 1.16.31.19.41.6.22.91zm1.26-2.81c-.24.38-.75.5-1.13.27-2.85-1.75-7.19-2.26-10.56-1.24-.43.13-.88-.11-1.01-.54-.13-.43.11-.88.54-1.01 3.86-1.17 8.66-.6 11.89 1.4.38.23.5.75.27 1.12zm.11-2.93c-3.42-2.03-9.07-2.21-12.33-1.22-.51.16-1.06-.13-1.22-.64-.16-.51.13-1.06.64-1.22C9.12 6.33 15.3 6.54 19.21 8.9c.46.27.61.86.34 1.32-.27.46-.86.61-1.32.34z" fill="white" />
              </svg>
              Play Bridge
            </button>
          )}

          {/* Stars or Yes/No depending on category type. Wrapped in a
              positioned div so song-signature celebration overlays can
              anchor around the stars themselves rather than the whole
              question column. */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', minHeight: 60 }}>
            {celebration?.type === 'broken-neon'     && <BrokenNeonOverlay />}
            {celebration?.type === 'heat-shimmer'    && <HeatShimmerOverlay />}
            {celebration?.type === 'candle-halo'     && <CandleHaloOverlay />}
            {celebration?.type === 'manuscript-fade' && <ManuscriptSignatureOverlay />}
            {currentCat?.type === 'yesno' ? (
              <YesNoPicker
                key={`${songPos}-${catPos}`}
                currentRating={currentRating}
                onRate={handleRate}
              />
            ) : (
              <StarPicker
                key={`${songPos}-${catPos}`}
                currentRating={currentRating}
                onRate={handleRate}
                labels={STAR_LABELS[currentCat?.id] ?? null}
                flashLevel={flashLevel}
                celebration={celebration}
                isNightTheme={isNightTheme}
                isDarkTheme={isDarkTheme}
                textTuning={albumTheme?.textTuning}
              />
            )}
          </div>

          {/* Back + (No opinion) buttons.
              "No opinion" is hidden on the 5 default categories so every song
              is rated on the same baseline; it's available on Pro extras and
              custom categories where the user opted in to depth. */}
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <button
              onClick={goBack}
              disabled={isFirstStep}
              style={{
                padding: '9px 22px',
                borderRadius: 22,
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                fontSize: 13,
                fontWeight: 500,
                color: '#6b7280',
                cursor: isFirstStep ? 'default' : 'pointer',
                opacity: isFirstStep ? 0.3 : 1,
              }}
            >
              ← Back
            </button>
            {!DEFAULT_CAT_IDS.has(currentCat?.id) && (
              <button
                onClick={advance}
                style={{
                  padding: '9px 22px',
                  borderRadius: 22,
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
              >
                No opinion
              </button>
            )}
          </div>

          </div>
        </div>
      )}
        </div>
      )}

      {/* Bottom progress bar + label */}
      <div style={{ padding: '0 20px 20px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>{Math.round(progress)}% complete</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {songs.length - songPos} {songs.length - songPos === 1 ? 'song' : 'songs'} left on {albumName}
          </span>
        </div>
        <div style={{ height: 8, background: '#f3e8ff', borderRadius: 99 }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
            width: `${progress}%`,
            borderRadius: 99,
            transition: 'width 0.25s ease',
          }} />
        </div>
      </div>

      {/* ── Exit confirmation dialog ── */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 32px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '24px',
            width: '100%',
            maxWidth: 320,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Stop rating?
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
              Your ratings so far are saved. You can pick up where you left off any time.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: 10,
                  border: '0.5px solid #e5e7eb',
                  background: '#ffffff',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
              >
                Keep rating
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#111827',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 30-song Pro upsell — pops between songs once eligibility is met ── */}
      {pendingNudgeAdvance && (
        <AutoplayNudge
          onTryIt={handleTryAutoplay}
          onLater={handleNudgeLater}
        />
      )}

      {/* ── Bridge autoplay suggestion (shown on 11th manual bridge play) ── */}
      {showBridgeSuggestion && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px 20px 0 0',
            padding: '24px 24px 40px',
            width: '100%',
            maxWidth: 480,
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
              You love the bridge!
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
              You've played bridge sections 10+ times. Want the bridge to start playing automatically when you reach that category?
            </div>

            {/* Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f9fafb',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
            }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Auto-play bridge</span>
              <div
                onClick={() => setBridgeSuggestionToggle(v => !v)}
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 13,
                  background: bridgeSuggestionToggle ? '#a855f7' : '#d1d5db',
                  position: 'relative',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 3,
                  left: bridgeSuggestionToggle ? 21 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>

            <button
              onClick={() => {
                if (updateSetting) updateSetting('spotifyBridgeAutoplay', bridgeSuggestionToggle);
                setShowBridgeSuggestion(false);
              }}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save preference
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
