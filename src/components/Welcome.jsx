import { useState, useRef, useEffect } from 'react';
import { ALBUMS } from '../data/albums';
import { DEFAULT_CATEGORIES } from '../data/categories';

// Full-screen 4-slide welcome tour for new users.
// Skippable from any slide; tappable dots; basic touch swipe support.
// Shown once per device — App.jsx controls when it renders via the
// 'eras_welcome_seen' localStorage flag (cleared by "Show welcome tour again"
// in Settings → Account).
export default function Welcome({ onClose }) {
  const [step, setStep] = useState(0);
  const touchStartX = useRef(null);

  const TOTAL = 4;
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
        background: '#ffffff',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Top bar — Skip link */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px' }}>
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

      {/* Slide content */}
      <div style={{
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
      }}>
        {step === 0 && <SlideWelcome />}
        {step === 1 && <SlideRating />}
        {step === 2 && <SlideModes />}
        {step === 3 && <SlideRankings />}
      </div>

      {/* Bottom — dots + nav */}
      <div style={{
        padding: '20px 24px 32px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
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

// ── Slide 1 — Welcome ─────────────────────────────────────────────────────────
function SlideWelcome() {
  const heroIds = ['ml', 'fl', 'rd', '89', 'lv'];
  const heroAlbums = heroIds
    .map(id => ALBUMS.find(a => a.id === id))
    .filter(Boolean);

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      {/* Fanned album cards */}
      <div style={{
        position: 'relative',
        width: 240,
        height: 160,
        margin: '0 auto 36px',
      }}>
        {heroAlbums.map((album, i) => {
          const offset = i - 2; // -2 .. 2
          return (
            <div
              key={album.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: 20,
                width: 96,
                height: 96,
                marginLeft: -48,
                transform: `translateX(${offset * 36}px) rotate(${offset * 8}deg)`,
                background: album.color,
                borderRadius: 14,
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 44,
                border: '3px solid #ffffff',
              }}
            >
              {album.icon}
            </div>
          );
        })}
      </div>
      <div style={titleStyle}>Welcome to The Eras Ranker</div>
      <div style={subtitleStyle}>Rank every Taylor Swift song, your way.</div>
    </div>
  );
}

// ── Slide 2 — How rating works ────────────────────────────────────────────────
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

function SlideRating() {
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
      <div style={titleStyle}>How it works</div>
      <div style={subtitleStyle}>
        Tap stars across a few quick categories. We turn that into a 0–100 score for every song.
      </div>
    </div>
  );
}

// ── Slide 3 — Two ways to rank an album ───────────────────────────────────────
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
          desc="Tap through quick questions to score each song. With Pro, songs play while you rate."
        />
        <ModeCard
          icon="✋"
          title="Sort It Yourself"
          desc="Drag songs into your perfect order, top to bottom."
        />
      </div>
      <div style={titleStyle}>Two ways to rank an album</div>
      <div style={subtitleStyle}>Pick whichever feels right for each album.</div>
    </div>
  );
}

function ModeCard({ icon, title, desc }) {
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
      </div>
    </div>
  );
}

// ── Slide 4 — Your rankings grow ──────────────────────────────────────────────
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

  // Rank for each row depends on whether marjorie has been placed yet.
  // Before: All Too Well #1, August #2, Cruel Summer #3.
  // After:  marjorie #1, All Too Well #2, August #3, Cruel Summer falls off.
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
      <style>{`
        @keyframes welcome-star-pulse {
          0%   { transform: scale(1);    filter: drop-shadow(0 0 0 rgba(168,85,247,0)); }
          30%  { transform: scale(1.18); filter: drop-shadow(0 0 8px rgba(168,85,247,0.65)); }
          100% { transform: scale(1);    filter: drop-shadow(0 0 0 rgba(168,85,247,0)); }
        }
      `}</style>

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

      <div style={titleStyle}>Your rankings grow as you rate</div>
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

// Leaderboard mock — Cruel Summer is rendered as the 4th row but only
// visible until marjorie arrives. Marjorie occupies the top slot but is
// height/opacity-hidden until phase 3, then animates in. Other songs
// reflow naturally because the heights cancel out (Marjorie grows while
// Cruel Summer shrinks by the same amount).
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
const titleStyle = {
  fontSize: 22,
  fontWeight: 700,
  color: '#111827',
  marginBottom: 10,
};
const subtitleStyle = {
  fontSize: 14,
  color: '#6b7280',
  lineHeight: 1.6,
  maxWidth: 320,
  margin: '0 auto',
};
