// Pastel-romantic backdrop for the Lover album landing screen.
// Cotton-candy gradient + drifting pink/blue butterflies + heart confetti
// + a faint rainbow arc — translucent enough to read song rows clearly on top.

const BUTTERFLIES = [
  { left: '6%',  top: '10%', size: 30, hue: 'pink',     delay: '0s',   dur: 11 },
  { left: '78%', top: '18%', size: 24, hue: 'blue',     delay: '2.1s', dur: 13 },
  { left: '20%', top: '38%', size: 20, hue: 'lavender', delay: '4.3s', dur: 12 },
  { left: '86%', top: '50%', size: 26, hue: 'pink',     delay: '1.0s', dur: 14 },
  { left: '10%', top: '66%', size: 22, hue: 'blue',     delay: '3.6s', dur: 13 },
  { left: '70%', top: '76%', size: 28, hue: 'lavender', delay: '0.5s', dur: 12 },
];

const HEARTS = [
  { left: '16%', size: 12, color: '#fda4af', delay: '0s',   dur: 16 },
  { left: '40%', size: 10, color: '#c4b5fd', delay: '3.2s', dur: 18 },
  { left: '62%', size: 14, color: '#f9a8d4', delay: '1.8s', dur: 17 },
  { left: '84%', size: 10, color: '#a5b4fc', delay: '4.5s', dur: 19 },
  { left: '4%',  size: 12, color: '#fbcfe8', delay: '2.4s', dur: 18 },
];

const HUE_FILL = {
  pink:     '#f9a8d4',
  blue:     '#7dd3fc',
  lavender: '#c4b5fd',
};
const HUE_WING = {
  pink:     '#fbcfe8',
  blue:     '#bae6fd',
  lavender: '#ddd6fe',
};

export default function LoverAlbumScene() {
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
        @keyframes lv-bf-flap {
          0%, 100% { transform: scaleX(1); }
          50%      { transform: scaleX(0.55); }
        }
        @keyframes lv-bf-drift {
          0%   { transform: translate(0, 0)        rotate(0deg); }
          50%  { transform: translate(14px, -10px) rotate(6deg); }
          100% { transform: translate(0, 0)        rotate(0deg); }
        }
        @keyframes lv-heart-rise {
          0%   { transform: translateY(0)     scale(0.85); opacity: 0; }
          15%  { opacity: 0.75; }
          85%  { opacity: 0.75; }
          100% { transform: translateY(-95vh) scale(1);    opacity: 0; }
        }
      `}</style>

      {/* Faint rainbow arc — high up, very low opacity so it never fights the UI */}
      <div
        style={{
          position: 'absolute',
          top: '3%',
          left: '-6%',
          width: '112%',
          height: 90,
          opacity: 0.22,
        }}
      >
        <svg viewBox="0 0 600 90" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="lv-rainbow" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%"   stopColor="#fda4af" />
              <stop offset="22%"  stopColor="#fcd34d" />
              <stop offset="44%"  stopColor="#86efac" />
              <stop offset="66%"  stopColor="#7dd3fc" />
              <stop offset="88%"  stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#f9a8d4" />
            </linearGradient>
          </defs>
          <path
            d="M 0 80 Q 150 10, 300 50 T 600 80"
            fill="none"
            stroke="url(#lv-rainbow)"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Drifting butterflies — pink, blue, lavender per the album's primary motif */}
      {BUTTERFLIES.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.left,
            top: b.top,
            animation: `lv-bf-drift ${b.dur}s ${b.delay} ease-in-out infinite`,
          }}
        >
          <svg
            width={b.size}
            height={b.size}
            viewBox="0 0 32 32"
            style={{
              animation: `lv-bf-flap ${b.dur / 6}s ${b.delay} ease-in-out infinite`,
              transformOrigin: 'center',
              filter: 'drop-shadow(0 1px 2px rgba(244, 114, 182, 0.25))',
              opacity: 0.7,
            }}
          >
            <ellipse cx="16" cy="16" rx="0.9" ry="6.5" fill="#a3a3a3" />
            <path d="M 16 14 C 8  6, 2  8, 4  14 C 2  16, 6  18, 16 16 Z" fill={HUE_FILL[b.hue]} />
            <path d="M 16 14 C 24 6, 30 8, 28 14 C 30 16, 26 18, 16 16 Z" fill={HUE_FILL[b.hue]} />
            <path d="M 16 17 C 10 22, 5  23, 6  19 C 8  17, 12 17, 16 18 Z" fill={HUE_WING[b.hue]} />
            <path d="M 16 17 C 22 22, 27 23, 26 19 C 24 17, 20 17, 16 18 Z" fill={HUE_WING[b.hue]} />
          </svg>
        </div>
      ))}

      {/* Heart confetti drifting up from the bottom — matches the QuickScore Lover scene */}
      {HEARTS.map((h, i) => (
        <svg
          key={i}
          width={h.size}
          height={h.size}
          viewBox="0 0 24 24"
          style={{
            position: 'absolute',
            bottom: -16,
            left: h.left,
            opacity: 0,
            animation: `lv-heart-rise ${h.dur}s ${h.delay} linear infinite`,
            filter: 'drop-shadow(0 1px 2px rgba(244, 114, 182, 0.3))',
          }}
        >
          <path
            d="M12 21s-7-4.5-9.5-9.5C0.5 7 4 3 8 3c1.7 0 3.2 0.8 4 2 0.8-1.2 2.3-2 4-2 4 0 7.5 4 5.5 8.5C19 16.5 12 21 12 21z"
            fill={h.color}
          />
        </svg>
      ))}
    </div>
  );
}
