import { useState, useEffect, useRef } from 'react';
import { getBridgeLyrics, getSnippetLyrics, hasBridge } from '../data/lyricsAccess';
import SpotifyMiniPlayer from './SpotifyMiniPlayer';

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

// ── Big interactive stars ─────────────────────────────────────────────────────
// Gets a new `key` each question so hover state resets automatically.
function StarPicker({ currentRating, onRate, labels, flashLevel = 0, bejeweledLevel = 0, isNightTheme = false }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || currentRating;
  const activeLevel = hovered || currentRating;
  const isFlashing = flashLevel > 0;
  const isBejeweled = bejeweledLevel > 0;
  // Label colors split for the two themes — dark-grey + dark-purple read
  // perfectly on the light category backgrounds; on the deep-night
  // gradient those go invisible, so we swap to off-white + bright purple.
  const labelDefaultColor = isNightTheme ? '#e5e7eb' : '#374151';
  const labelActiveColor  = isNightTheme ? '#e9d5ff' : '#5b21b6';

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

      <div style={{ display: 'flex', gap: 4, position: 'relative' }}>
        {[1, 2, 3, 4, 5].map(star => {
          const active = star <= display;
          const isHoverTarget = hovered > 0 && star <= hovered;
          // Pulse stars 1..flashLevel during the post-pick hold. Stagger by
          // 60 ms each so the animation reads as a left-to-right sweep.
          const flashing = isFlashing && star <= flashLevel;
          // Gemstone celebration applies to the rated stars (1..bejeweledLevel)
          const gem = isBejeweled && star <= bejeweledLevel;
          return (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onRate(star)}
              disabled={isFlashing || isBejeweled}
              aria-label={`${star} star`}
              style={{
                background: 'none',
                border: 'none',
                cursor: (isFlashing || isBejeweled) ? 'default' : 'pointer',
                padding: '6px',
                lineHeight: 0,
                transition: 'transform 0.1s ease',
                transform: isHoverTarget ? 'scale(1.18)' : 'scale(1)',
                WebkitTapHighlightColor: 'transparent',
                animation: gem
                  ? `qs-bejeweled-pulse 0.9s ease-in-out infinite`
                  : (flashing
                      ? `qs-star-pulse 700ms ${star * 60}ms ease-out both`
                      : undefined),
                position: 'relative',
              }}
            >
              <svg
                width={52}
                height={52}
                viewBox="0 0 20 20"
                fill={active ? (hovered > 0 ? '#f59e0b' : '#a855f7') : '#e9d5ff'}
                style={{
                  display: 'block',
                  transition: 'fill 0.08s ease',
                  // Cycling rainbow fill + multi-color glow during the
                  // Bejeweled flash. Animation 'fill' overrides the inline
                  // fill prop while it's running.
                  animation: gem
                    ? `qs-bejeweled-shimmer 1.2s linear infinite, qs-bejeweled-glow 1.6s ease-in-out infinite`
                    : undefined,
                }}
              >
                <path d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27l-4.78 2.51.91-5.32L2.27 6.62l5.34-.78L10 1z" />
              </svg>

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
function ShuffleScreen({ song, albumName, albumIcon, lyrics, onPick, currentRating = 0, isNightTheme = false }) {
  const [animating, setAnimating] = useState(false);

  // Show the previous pick (if any) by fading the unpicked side. Mirrors
  // how YesNoPicker indicates a prior Yes/No choice.
  const prevPlay = currentRating === 5;
  const prevSkip = currentRating === 1;
  const hasPrev = prevPlay || prevSkip;

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
        // Night theme uses transparent so the parent NIGHT_BACKGROUND +
        // NightSky decoration show through; otherwise the original
        // soft white→lavender gradient.
        background: isNightTheme
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
  spotifyAutoplay = true,
  spotifyBridgeAutoplay = false,
  confirmExit = true,
  onGoToSpotifySettings,
  updateSetting,
}) {
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

  // Bejeweled celebration — when the user finishes rating "Bejeweled" on
  // Midnights, the stars turn into shimmering gemstones with heavy sparkle
  // for ~3 seconds before advancing. Tracks the picked rating so only the
  // active stars get the gem treatment.
  const [bejeweledLevel, setBejeweledLevel] = useState(0);

  const isSingleSong = songs.length === 1;

  // ── Spotify autoplay: start playing from shuffle timestamp on new song ───
  useEffect(() => {
    if (!spotify?.isConnected || !spotify?.playerReady || !spotifyAutoplay) return;
    const song = songs[songPos];
    if (!song) return;
    spotify.playTrack(albumId, song.index, song.name, albumName, 'shuffle');
  }, [songPos, spotify?.playerReady]); // eslint-disable-line react-hooks/exhaustive-deps


  // ── Bridge autoplay: seek to bridge timestamp when Bridge category appears ─
  // Gated on hasBridge (data-only) so the lyrics display kill switch can't
  // silently disable bridge playback. Previously this used showBridgeLyrics,
  // which is false whenever LYRICS_DISPLAY_ENABLED is off — meaning autoplay
  // never fired and the manual button was also hidden, leaving users stuck.
  useEffect(() => {
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
  }, [songPos, catPos]); // eslint-disable-line react-hooks/exhaustive-deps

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
    spotify?.playerReady;

  const isFirstStep = songPos === 0 && catPos === 0;

  function goBack() {
    if (isFirstStep) return;
    // If a hold-and-flash is in progress, cancel it before navigating back.
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
      setFlashLevel(0);
      setBejeweledLevel(0);
    }
    pendingRef.current = catPos > 0
      ? { catPos: catPos - 1 }
      : { songPos: songPos - 1, catPos: songsWithCats[songPos - 1].cats.length - 1 };
    setIsVisible(false);
  }

  function advance() {
    const nextCat = catPos + 1;
    let next;
    if (nextCat < currentSong.cats.length) {
      next = { catPos: nextCat };
    } else {
      const nextSong = songPos + 1;
      next = nextSong < songsWithCats.length
        ? { songPos: nextSong, catPos: 0 }
        : { done: true };
    }

    // ShuffleScreen already handles its own 720ms fade-out; update state directly
    if (currentCat?.id === 'replay') {
      if (next.done) { setDone(true); }
      else { if (next.songPos !== undefined) setSongPos(next.songPos); setCatPos(next.catPos ?? 0); }
      return;
    }

    pendingRef.current = next;
    setIsVisible(false);
  }

  function handleRate(val) {
    onRate(currentSong.index, currentCat.id, val);
    if (currentSong.name === 'Wood') setShowTrees(true);
    setFlashLevel(val);

    // Detect the moment the user finishes rating Bejeweled — i.e. the last
    // category of that song on Midnights. Triggers a longer, heavier
    // gemstone celebration before advancing to the next song.
    const isLastBejeweled =
      albumId === 'ml' &&
      currentSong?.name === 'Bejeweled' &&
      catPos === (currentSong?.cats.length - 1);
    if (isLastBejeweled) setBejeweledLevel(val);

    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    advanceTimeoutRef.current = setTimeout(() => {
      advanceTimeoutRef.current = null;
      setFlashLevel(0);
      setBejeweledLevel(0);
      advance();
    }, isLastBejeweled ? 3000 : 900);
  }

  // Called by ShuffleScreen after its own transition animation finishes (~720ms)
  function handleShufflePick(val) {
    onRate(currentSong.index, currentCat.id, val);
    advance();
  }

  // Night theme — applied while rating Midnights ('ml'). Replaces all
  // category backgrounds with a deep-night gradient and renders a moon +
  // twinkling stars decoration layer; text colors are lightened where
  // they'd otherwise be unreadable.
  const isNightTheme = albumId === 'ml';

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: isNightTheme
      ? NIGHT_BACKGROUND
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
    return (
      <div style={overlayStyle}>
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

      {/* Night-sky decoration — Midnights theme only */}
      {isNightTheme && <NightSky />}

      {showTrees && <FallingTrees onDone={() => setShowTrees(false)} />}

      {/* Progress bar */}
      <div style={{
        height: 4,
        background: isNightTheme ? 'rgba(168,85,247,0.18)' : '#f3e8ff',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        <div
          style={{
            height: '100%',
            background: '#a855f7',
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
        zIndex: 1,
      }}>
        <div style={{ width: 60 }} />
        <div style={{ fontSize: 12, color: isNightTheme ? '#cbd5e1' : '#9ca3af' }}>
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
            background: isNightTheme ? 'rgba(255,255,255,0.08)' : 'none',
            border: isNightTheme ? '0.5px solid rgba(255,255,255,0.18)' : '0.5px solid #e5e7eb',
            borderRadius: 8,
            padding: '5px 12px',
            cursor: 'pointer',
            fontSize: 13,
            color: isNightTheme ? '#e5e7eb' : '#6b7280',
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
          isNightTheme={isNightTheme}
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
            zIndex: 1,
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
          <div style={{ fontSize: 12, color: '#c4b5fd', marginBottom: 20, letterSpacing: '0.02em' }}>
            {albumIcon} {albumName}
          </div>

          {/* Song name / Spotify mini player */}
          {spotify?.isConnected ? (
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
              fontWeight: 700,
              color: isNightTheme ? '#f3f4f6' : '#111827',
              lineHeight: 1.3,
              marginBottom: currentCat?.id === 'lyrics' ? 16 : 32,
              maxWidth: 320,
              textShadow: isNightTheme ? '0 1px 8px rgba(0,0,0,0.4)' : 'none',
            }}>
              {currentSong?.name}
            </div>
          )}

          {/* Category label — on the deep-night background, the brand purple
              washes out, so we use a brighter lavender + light grey pair. */}
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: isNightTheme ? '#e9d5ff' : '#a855f7',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 4,
            textShadow: isNightTheme ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
          }}>
            {currentCat?.name}
          </div>
          <div style={{
            fontSize: 12,
            color: isNightTheme ? '#cbd5e1' : '#c4b5fd',
            marginBottom: currentCat?.id === 'lyrics' ? 14 : 32,
            textShadow: isNightTheme ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
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

          {/* Stars or Yes/No depending on category type */}
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
              bejeweledLevel={bejeweledLevel}
              isNightTheme={isNightTheme}
            />
          )}

          {/* Back + Skip buttons */}
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
              Skip →
            </button>
          </div>

          </div>
        </div>
      )}
        </div>
      )}

      {/* Bottom progress bar + label */}
      <div style={{ padding: '0 20px 20px', flexShrink: 0 }}>
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
