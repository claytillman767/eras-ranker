import { useState, useRef, useEffect } from 'react';
import { ALBUMS } from '../data/albums';
import { DEFAULT_CATEGORIES } from '../data/categories';

// Full-screen 5-slide welcome tour for new users.
// Skippable from any slide; tappable dots; basic touch swipe support.
// Shown once per device — App.jsx controls when it renders via the
// 'eras_welcome_seen' localStorage flag (cleared by "Show welcome tour again"
// in Settings → Account, or by the dev "UAT as new user" toggle).
//
// Slide order:
//   1. Welcome (intro / fanned albums)
//   2. Two ways to rank (overview)
//   3. Vibe Check (star rating mechanics)
//   4. Sort It Yourself (drag-reorder mechanics)
//   5. Your rankings grow (animated rate-then-place demo)
export default function Welcome({ onClose, spotifyAlbumArt }) {
  const [step, setStep] = useState(0);
  const touchStartX = useRef(null);

  const TOTAL = 5;
  const isLast = step === TOTAL - 1;

  function next() {
    if (step < TOTAL - 1) setStep(step + 1);
    else onClose();
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -50) next();
    else if (dx > 50) back();
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        // Soft pink/lavender wash behind the white slide content — sets the
        // "celebratory" tone without competing with the album art / sparkles.
        background: 'linear-gradient(180deg, #fdf4ff 0%, #ffffff 45%, #faf5ff 100%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Sparkle/twinkle layer — drifts behind everything else. CSS-only,
          so cheap to render. Twelve sparkles at preset positions cycle
          through a slow opacity + scale pulse. */}
      <SparkleLayer />

      {/* Global keyframes used by individual slides */}
      <style>{`
        @keyframes welcome-slide-in {
          0%   { opacity: 0; transform: translateY(8px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0)  scale(1);    }
        }
        @keyframes welcome-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1.1);  }
        }
        @keyframes welcome-shimmer {
          0%   { background-position: -200% 50%; }
          100% { background-position: 200% 50%;  }
        }
        @keyframes welcome-card-pop {
          0%   { transform: translateY(20px) scale(0.96); opacity: 0; }
          60%  { transform: translateY(-2px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        @keyframes welcome-star-pulse {
          0%   { transform: scale(1);    filter: drop-shadow(0 0 0 rgba(168,85,247,0)); }
          30%  { transform: scale(1.18); filter: drop-shadow(0 0 8px rgba(168,85,247,0.65)); }
          100% { transform: scale(1);    filter: drop-shadow(0 0 0 rgba(168,85,247,0)); }
        }
      `}</style>

      {/* Top bar — Skip link */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', position: 'relative', zIndex: 2 }}>
        <button
          onClick={onClose}
          aria-label="Skip welcome"
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '6px 10px',
          }}
        >
          Skip
        </button>
      </div>

      {/* Slide content — keyed on step so the entrance animation re-fires
          per slide */}
      <div
        key={step}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          maxWidth: 480,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2,
          animation: 'welcome-slide-in 0.45s cubic-bezier(0.2, 0.7, 0.3, 1) both',
        }}
      >
        {step === 0 && <SlideWelcome spotifyAlbumArt={spotifyAlbumArt} />}
        {step === 1 && <SlideModes />}
        {step === 2 && <SlideVibeCheck />}
        {step === 3 && <SlideManual />}
        {step === 4 && <SlideRankings />}
      </div>

      {/* Bottom — dots + nav */}
      <div style={{
        padding: '20px 24px 32px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === step ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? '#a855f7' : '#e5e7eb',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'width 0.2s, background 0.2s',
              }}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              onClick={back}
              style={{
                flex: 1,
                padding: '13px',
                background: '#ffffff',
                border: '0.5px solid #d1d5db',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                color: '#4b5563',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            style={{
              flex: step > 0 ? 2 : 1,
              padding: '13px',
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
            }}
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sparkle decoration ────────────────────────────────────────────────────────
// Small star/diamond glyphs scattered across the screen at preset positions.
// Each twinkles on its own delay + duration so they feel alive but never
// distract. CSS-only — no React state, no re-renders.
const SPARKLE_POSITIONS = [
  // Top edge
  { top: '4%',  left: '8%',  size: 14, color: '#fcd34d', delay: '0s'   },
  { top: '5%',  left: '32%', size: 9,  color: '#f472b6', delay: '1.0s', dur: '2.6s' },
  { top: '7%',  left: '58%', size: 8,  color: '#a855f7', delay: '0.4s' },
  { top: '12%', left: '85%', size: 11, color: '#a855f7', delay: '0.6s' },
  // Upper third
  { top: '20%', left: '7%',  size: 8,  color: '#f472b6', delay: '1.2s' },
  { top: '22%', left: '46%', size: 7,  color: '#fcd34d', delay: '1.7s', dur: '4s' },
  { top: '24%', left: '74%', size: 9,  color: '#fcd34d', delay: '0.2s' },
  { top: '32%', left: '92%', size: 12, color: '#fcd34d', delay: '1.8s' },
  // Mid
  { top: '38%', left: '20%', size: 7,  color: '#a855f7', delay: '0.7s' },
  { top: '40%', left: '50%', size: 7,  color: '#a855f7', delay: '2.0s' },
  { top: '45%', left: '78%', size: 8,  color: '#f472b6', delay: '1.3s', dur: '2.8s' },
  { top: '47%', left: '4%',  size: 9,  color: '#a855f7', delay: '0.9s' },
  // Lower-mid
  { top: '52%', left: '88%', size: 14, color: '#f472b6', delay: '0.3s' },
  { top: '56%', left: '32%', size: 8,  color: '#fcd34d', delay: '1.5s' },
  { top: '60%', left: '48%', size: 6,  color: '#f472b6', delay: '1.4s' },
  // Lower
  { top: '68%', left: '10%', size: 11, color: '#fcd34d', delay: '1.5s' },
  { top: '70%', left: '60%', size: 9,  color: '#a855f7', delay: '0.5s', dur: '3.6s' },
  { top: '72%', left: '90%', size: 8,  color: '#a855f7', delay: '0.4s' },
  // Bottom
  { top: '80%', left: '15%', size: 10, color: '#f472b6', delay: '1.1s' },
  { top: '82%', left: '42%', size: 7,  color: '#fcd34d', delay: '0.6s' },
  { top: '84%', left: '70%', size: 9,  color: '#f472b6', delay: '1.9s', dur: '2.5s' },
  { top: '88%', left: '82%', size: 13, color: '#fcd34d', delay: '0.7s' },
  // Bottom edge
  { top: '93%', left: '24%', size: 8,  color: '#a855f7', delay: '0.3s' },
  { top: '94%', left: '88%', size: 7,  color: '#f472b6', delay: '1.6s' },
];

function SparkleLayer() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {SPARKLE_POSITIONS.map((s, i) => (
        <svg
          key={i}
          width={s.size}
          height={s.size}
          viewBox="0 0 24 24"
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            color: s.color,
            opacity: 0.25,
            animation: `welcome-twinkle ${s.dur || '3.2s'} ${s.delay} ease-in-out infinite`,
          }}
        >
          <path
            fill="currentColor"
            d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"
          />
        </svg>
      ))}
    </div>
  );
}

// ── Slide 1 — Welcome ─────────────────────────────────────────────────────────
// A slow carousel that rotates through every album, with the album name
// shown beneath the icon — so it's immediately clear that the colored
// tiles users see throughout the app each represent one Taylor Swift era.
function SlideWelcome({ spotifyAlbumArt }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(i => (i + 1) % ALBUMS.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  const prevAlbum = ALBUMS[(idx - 1 + ALBUMS.length) % ALBUMS.length];
  const currAlbum = ALBUMS[idx];
  const nextAlbum = ALBUMS[(idx + 1) % ALBUMS.length];

  // Pull a real cover image from Spotify when available — otherwise fall
  // back to the colored emoji tile.
  const artFor = id => spotifyAlbumArt?.[id] ?? null;

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <style>{`
        @keyframes welcome-carousel-side {
          0%   { opacity: 0; }
          100% { opacity: 0.45; }
        }
        @keyframes welcome-carousel-center {
          0%   { transform: scale(0.86); opacity: 0; }
          60%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes welcome-carousel-name {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        position: 'relative',
        width: 280,
        height: 130,
        margin: '0 auto 12px',
      }}>
        <CarouselSide album={prevAlbum} side="left" artUrl={artFor(prevAlbum.id)} />
        <CarouselCenter album={currAlbum} artUrl={artFor(currAlbum.id)} />
        <CarouselSide album={nextAlbum} side="right" artUrl={artFor(nextAlbum.id)} />
      </div>

      {/* Album name caption — fades + nudges up on each rotation so it's
          clearly tied to the icon above */}
      <div
        key={`name-${currAlbum.id}`}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#7c3aed',
          letterSpacing: '0.04em',
          marginBottom: 24,
          minHeight: 18,
          padding: '0 16px',
          animation: 'welcome-carousel-name 0.5s ease-out both',
        }}
      >
        {currAlbum.name}
      </div>

      <div style={shimmerTitleStyle}>Welcome to The Eras Ranker ✨</div>
      <div style={subtitleStyle}>Rank every Taylor Swift song, your way.</div>
    </div>
  );
}

function CarouselCenter({ album, artUrl }) {
  return (
    <div
      key={`c-${album.id}`}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        margin: 'auto',
        width: 108,
        height: 108,
        background: album.color,
        borderRadius: 18,
        boxShadow: '0 8px 22px rgba(0,0,0,0.16)',
        border: '3px solid #ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 54,
        zIndex: 2,
        overflow: 'hidden',
        animation: 'welcome-carousel-center 0.6s cubic-bezier(0.2, 0.8, 0.3, 1.1) both',
      }}
    >
      {artUrl ? (
        <img
          src={artUrl}
          alt={album.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        album.icon
      )}
    </div>
  );
}

function CarouselSide({ album, side, artUrl }) {
  return (
    <div
      key={`${side}-${album.id}`}
      style={{
        position: 'absolute',
        [side]: 0,
        top: '50%',
        marginTop: -34,
        width: 68,
        height: 68,
        background: album.color,
        borderRadius: 12,
        boxShadow: '0 3px 10px rgba(0,0,0,0.10)',
        border: '2px solid #ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 30,
        opacity: 0.45,
        zIndex: 1,
        overflow: 'hidden',
        animation: 'welcome-carousel-side 0.55s ease-out both',
      }}
    >
      {artUrl ? (
        <img
          src={artUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        album.icon
      )}
    </div>
  );
}

// ── Slide 2 — Two ways to rank ────────────────────────────────────────────────
function SlideModes() {
  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 28,
      }}>
        <ModeCard
          icon="🎧"
          title="Vibe Check"
          desc="Tap through quick questions to score each song."
          // Pro upsell line gets its own visual weight — purple pill + line so
          // the user can scan that there's a paid version of this experience
          // without re-reading the description.
          proLine="Songs autoplay through Spotify while you rate."
          delay="0s"
        />
        <ModeCard
          icon="✋"
          title="Sort It Yourself"
          desc="Drag songs into your perfect order, top to bottom."
          delay="0.1s"
        />
      </div>
      <div style={shimmerTitleStyle}>Two ways to rank</div>
      <div style={subtitleStyle}>Pick whichever feels right for each album.</div>
    </div>
  );
}

function ModeCard({ icon, title, desc, proLine, delay = '0s' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
      background: '#fafafa',
      border: '0.5px solid #e5e7eb',
      borderRadius: 14,
      textAlign: 'left',
      animation: `welcome-card-pop 0.5s ${delay} cubic-bezier(0.2, 0.8, 0.3, 1.1) both`,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: '#f3e8ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
          {desc}
        </div>
        {proLine && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
            fontSize: 12,
            color: '#7c3aed',
            lineHeight: 1.4,
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              padding: '2px 7px',
              borderRadius: 99,
              flexShrink: 0,
            }}>
              PRO
            </span>
            <span style={{ fontWeight: 500 }}>{proLine}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Slide 3 — Vibe Check (rating mechanics) ──────────────────────────────────
// Sources category names from DEFAULT_CATEGORIES so the demo never drifts
// from what the user actually sees in the rating flow. Per-category demo
// star counts are keyed by category id; any default not listed falls back
// to 5 stars (a reasonable choice for "Cruel Summer", the demo song).
const DEMO_STARS = {
  lyrics: 5,
  music: 5,
  bridge: 5,
  nostalgia: 4,
  replay: 5,
};

function SlideVibeCheck() {
  const cats = DEFAULT_CATEGORIES.map(c => ({
    name: c.name,
    stars: DEMO_STARS[c.id] ?? 5,
  }));
  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 28,
        boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
        textAlign: 'left',
        animation: 'welcome-card-pop 0.5s 0.05s cubic-bezier(0.2, 0.8, 0.3, 1.1) both',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Cruel Summer</div>
          <div style={{
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            padding: '4px 11px',
            borderRadius: 20,
            boxShadow: '0 4px 12px rgba(168,85,247,0.35)',
          }}>96</div>
        </div>
        {cats.map(c => (
          <div key={c.name} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '5px 0',
          }}>
            <div style={{ fontSize: 13, color: '#4b5563' }}>{c.name}</div>
            <div style={{ fontSize: 14, color: '#fbbf24', letterSpacing: 1 }}>
              {'★'.repeat(c.stars)}
              <span style={{ color: '#e5e7eb' }}>{'★'.repeat(5 - c.stars)}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={shimmerTitleStyle}>Vibe Check</div>
      <div style={subtitleStyle}>
        Tap stars across a few quick categories and we give you a 0–100 score for that song.
      </div>
    </div>
  );
}

// ── Slide 4 — Sort It Yourself (drag mechanics) ──────────────────────────────
// Loops a small drag illustration: row #3 lifts, slides to the top, lands
// at #1 with a soft purple flash that mirrors the real drop-flash on the
// album song list.
function SlideManual() {
  const [phase, setPhase] = useState(0);
  // 0 = rest, 1 = lift, 2 = travel to top + others slide down, 3 = flash, 4 = hold

  useEffect(() => {
    const timers = [];
    function runLoop() {
      setPhase(0);
      timers.push(setTimeout(() => setPhase(1), 700));   // lift
      timers.push(setTimeout(() => setPhase(2), 1300));  // travel
      timers.push(setTimeout(() => setPhase(3), 2200));  // flash
      timers.push(setTimeout(() => setPhase(4), 3100));  // hold
      timers.push(setTimeout(runLoop, 5000));            // restart
    }
    runLoop();
    return () => timers.forEach(clearTimeout);
  }, []);

  // Songs (always the same demo titles). After the move, song id 'mv'
  // sits at the top.
  const ROW_HEIGHT = 50;

  // Position offset (vertical pixels) for each row at each phase.
  // mv = the moving row (originally bottom)
  // a, b = the other rows that get pushed down
  function offsetFor(row) {
    if (row === 'mv') {
      if (phase >= 2) return -ROW_HEIGHT * 2; // top slot
      return 0;
    }
    // For 'a' and 'b', they shift down by one slot once mv moves
    if (phase >= 2) {
      return ROW_HEIGHT;
    }
    return 0;
  }

  function lift(row) {
    return row === 'mv' && phase === 1
      ? 'translateY(-8px) scale(1.03)'
      : `translateY(${offsetFor(row)}px) scale(1)`;
  }

  // Drop-flash on the moving row when it lands
  const flashing = phase === 3;

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <style>{`
        @keyframes welcome-drop-flash {
          0%   { box-shadow: 0 0 0 2px rgba(168,85,247,0.55), 0 4px 14px rgba(168,85,247,0.25); }
          100% { box-shadow: 0 0 0 0 rgba(168,85,247,0),    0 0 0 rgba(168,85,247,0); }
        }
      `}</style>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 320,
        height: ROW_HEIGHT * 3 + 12,
        margin: '0 auto 28px',
      }}>
        {/* Each row is absolutely positioned at its rest spot, then
            translated for lift/move via inline transform */}
        <DragRow
          songName="All Too Well"
          slot={0}
          rowHeight={ROW_HEIGHT}
          transform={lift('a')}
          dimmed={false}
        />
        <DragRow
          songName="August"
          slot={1}
          rowHeight={ROW_HEIGHT}
          transform={lift('b')}
          dimmed={false}
        />
        <DragRow
          songName="Cruel Summer"
          slot={2}
          rowHeight={ROW_HEIGHT}
          transform={lift('mv')}
          dimmed={phase >= 1 && phase < 4}
          isMoving={phase >= 1 && phase < 4}
          flashing={flashing}
        />
      </div>

      <div style={shimmerTitleStyle}>Sort It Yourself</div>
      <div style={subtitleStyle}>
        Drag any song by the ⠿ handle to put it exactly where you want.
      </div>
    </div>
  );
}

function DragRow({ songName, slot, rowHeight, transform, dimmed, isMoving, flashing }) {
  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: slot * (rowHeight + 6),
      height: rowHeight,
      transform,
      transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
      zIndex: isMoving ? 5 : 1,
    }}>
      <div style={{
        height: '100%',
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: isMoving
          ? '0 8px 22px rgba(168,85,247,0.22)'
          : '0 2px 6px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        animation: flashing ? 'welcome-drop-flash 0.9s ease-out' : undefined,
        transition: 'box-shadow 0.3s ease',
      }}>
        {/* Drag handle */}
        <div style={{
          width: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: dimmed ? '#a855f7' : '#c4b5fd',
          fontSize: 16,
          borderRight: '0.5px solid #f3f4f6',
          transition: 'color 0.3s ease',
        }}>
          ⠿
        </div>
        <div style={{ flex: 1, padding: '0 12px', textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#111827' }}>
          {songName}
        </div>
      </div>
    </div>
  );
}

// ── Slide 5 — Your rankings grow ──────────────────────────────────────────────
// Loops a short animation: a Nostalgia rating card for "marjorie" gets
// 5 stars, fades into the leaderboard, and marjorie drops in as #1 with
// a score of 98 — pushing All Too Well, August, and Cruel Summer down a
// rank (Cruel Summer falls off the visible top three). Mirrors the real
// post-rating placement the user gets in their album list.
function SlideRankings() {
  // 0 = rating card pre-tap
  // 1 = stars filled & pulsing (rating "happened")
  // 2 = rating fades out, leaderboard fades in (marjorie not yet placed)
  // 3 = marjorie drops into #1, cruel summer falls off
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [];
    function runLoop() {
      setPhase(0);
      timers.push(setTimeout(() => setPhase(1), 500));    // stars fill + pulse
      timers.push(setTimeout(() => setPhase(2), 1500));   // start cross-fade
      timers.push(setTimeout(() => setPhase(3), 2000));   // marjorie inserts
      timers.push(setTimeout(runLoop, 5500));             // restart loop
    }
    runLoop();
    return () => timers.forEach(clearTimeout);
  }, []);

  const showRating = phase < 2;
  const marjorieIn = phase >= 3;

  function rankFor(id) {
    if (marjorieIn) return { mj: 1, atw: 2, aug: 3, cs: 4 }[id];
    return { atw: 1, aug: 2, cs: 3 }[id];
  }

  const rows = [
    { id: 'mj',  song: 'marjorie',     album: 'Evermore', score: 98 },
    { id: 'atw', song: 'All Too Well', album: 'Red',      score: 96 },
    { id: 'aug', song: 'August',       album: 'Folklore', score: 94 },
    { id: 'cs',  song: 'Cruel Summer', album: '1989',     score: 92 },
  ];

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <div style={{ position: 'relative', minHeight: 230, marginBottom: 28 }}>
        {/* Rating card — fades up and out as the leaderboard takes over */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: showRating ? 1 : 0,
          transform: showRating ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          pointerEvents: 'none',
        }}>
          <RatingDemoCard starsFilled={phase >= 1} />
        </div>

        {/* Leaderboard — cross-fades in over the rating card */}
        <div style={{
          opacity: showRating ? 0 : 1,
          transition: 'opacity 0.35s ease 0.1s',
          pointerEvents: 'none',
        }}>
          <LeaderboardDemo rows={rows} marjorieIn={marjorieIn} rankFor={rankFor} />
        </div>
      </div>

      <div style={shimmerTitleStyle}>Your rankings grow as you rate</div>
      <div style={subtitleStyle}>
        Finish an album to unlock a shareable card. Sign in to keep your ratings on every device.
      </div>
    </div>
  );
}

// Rating card mock — visually echoes the real QuickScore rating screen
// for the Nostalgia category, with all 5 stars filling at once and the
// same staggered pulse animation users see when they actually rate.
function RatingDemoCard({ starsFilled }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '0.5px solid #e5e7eb',
      borderRadius: 14,
      padding: '20px 18px',
      boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
    }}>
      <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '0.05em' }}>
        🍂 Evermore
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
        marjorie
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', letterSpacing: '0.1em' }}>
        NOSTALGIA
      </div>
      <div style={{ fontSize: 11, color: '#c4b5fd' }}>Category 5 of 5</div>

      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <div
            key={star}
            style={{
              padding: 4,
              animation: starsFilled
                ? `welcome-star-pulse 700ms ${star * 60}ms ease-out both`
                : undefined,
            }}
          >
            <svg
              width={32}
              height={32}
              viewBox="0 0 20 20"
              fill={starsFilled ? '#a855f7' : '#e9d5ff'}
              style={{ display: 'block', transition: 'fill 0.18s ease' }}
            >
              <path d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27l-4.78 2.51.91-5.32L2.27 6.62l5.34-.78L10 1z" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardDemo({ rows, marjorieIn, rankFor }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '0.5px solid #e5e7eb',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
    }}>
      {rows.map(r => {
        const isMj = r.id === 'mj';
        const isCs = r.id === 'cs';
        const visible = isMj ? marjorieIn : (isCs ? !marjorieIn : true);
        const rank = rankFor(r.id);

        return (
          <div
            key={r.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: visible ? '12px 14px' : '0 14px',
              maxHeight: visible ? 80 : 0,
              opacity: visible ? 1 : 0,
              overflow: 'hidden',
              borderBottom: '0.5px solid #f3f4f6',
              transition: 'max-height 0.55s ease, padding 0.55s ease, opacity 0.35s ease, background 0.4s ease',
              background: isMj && marjorieIn ? '#faf5ff' : '#ffffff',
            }}
          >
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#a855f7',
              width: 22,
              textAlign: 'center',
            }}>
              {rank}
            </div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.song}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.album}</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 16,
            }}>
              {r.score}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Shared text styles ────────────────────────────────────────────────────────
// Slide titles use a shimmering purple→pink→purple gradient that drifts
// horizontally to give the welcome tour a celebratory feel without
// changing the typography.
const shimmerTitleStyle = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 10,
  background: 'linear-gradient(90deg, #7c3aed 0%, #d946ef 30%, #a855f7 50%, #d946ef 70%, #7c3aed 100%)',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
  animation: 'welcome-shimmer 4s ease-in-out infinite',
};

const subtitleStyle = {
  fontSize: 14,
  color: '#6b7280',
  lineHeight: 1.6,
  maxWidth: 320,
  margin: '0 auto',
};
