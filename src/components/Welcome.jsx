import { useState, useRef } from 'react';
import { ALBUMS } from '../data/albums';

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
function SlideRating() {
  const cats = [
    { name: 'Replay Value', stars: 5 },
    { name: 'Lyrics',       stars: 4 },
    { name: 'Vocals',       stars: 5 },
    { name: 'Production',   stars: 5 },
    { name: 'Bridge',       stars: 5 },
  ];
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
          desc="We play a snippet of each song. Tap fast — Play it again, or Skip."
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
function SlideRankings() {
  const top = [
    { rank: 1, song: 'All Too Well',  album: 'Red',      score: 96 },
    { rank: 2, song: 'August',        album: 'Folklore', score: 94 },
    { rank: 3, song: 'Cruel Summer',  album: '1989',     score: 92 },
  ];
  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 28,
        boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
      }}>
        {top.map((t, i) => (
          <div
            key={t.rank}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderBottom: i < top.length - 1 ? '0.5px solid #f3f4f6' : 'none',
            }}
          >
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#a855f7',
              width: 22,
              textAlign: 'center',
            }}>
              {t.rank}
            </div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.song}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.album}</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 16,
            }}>
              {t.score}
            </div>
          </div>
        ))}
      </div>
      <div style={titleStyle}>Your rankings grow as you rate</div>
      <div style={subtitleStyle}>
        Finish an album to unlock a shareable card. Sign in to keep your ratings on every device.
      </div>
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
