// Red album theme — QuickScore overlay decoration.
//
// Five exports following the album-theme contract:
//   RED_BACKGROUND       — backdrop gradient
//   RedScene             — ambient (drifting leaves + scarf + typewriter chars)
//   AllTooWellMoment     — signature moment for "All Too Well"
//   RedScarfComplete     — album-complete decoration (leaf swirl)
//   RED_TEXT_TUNING      — per-theme label / calibration colors

export const RED_BACKGROUND =
  'linear-gradient(180deg, #4a0a14 0%, #7f1d1d 35%, #b91c1c 65%, #6b1d28 100%)';

export const RED_TEXT_TUNING = {
  categoryLabel: '#fecaca',
  subCounter: 'rgba(254,202,202,0.7)',
  calibration: 'rgba(255,237,213,0.85)',
  calibrationActive: '#fde68a',
  songTitle: '#fff7ed',
  // Star colors — gold-on-burgundy, per design spec.
  starFilled: '#fde68a',
  starFilledStroke: '#92400e',
  starEmptyStroke: 'rgba(254,202,202,0.7)',
  // Card top-3 accent
  accent: '#b91c1c',
};

const RED_LEAF_COLORS = [
  { fill: '#dc2626', stroke: '#7f1d1d' },
  { fill: '#b91c1c', stroke: '#450a0a' },
  { fill: '#ea580c', stroke: '#7c2d12' },
  { fill: '#f59e0b', stroke: '#78350f' },
  { fill: '#92400e', stroke: '#451a03' },
  { fill: '#fbbf24', stroke: '#92400e' },
];

const RED_LEAVES = [
  { left:  '4%', size: 22, delay: '0s',   dur: 14, drift:  18, rot: -10, spin: 6, color: 0 },
  { left: '11%', size: 16, delay: '3.2s', dur: 18, drift: -22, rot:  20, spin: 9, color: 2 },
  { left: '18%', size: 26, delay: '1.6s', dur: 12, drift:  14, rot:  -5, spin: 7, color: 1 },
  { left: '26%', size: 14, delay: '5.4s', dur: 16, drift: -10, rot:  30, spin: 5, color: 3 },
  { left: '33%', size: 20, delay: '2.1s', dur: 13, drift:  20, rot: -15, spin: 8, color: 4 },
  { left: '41%', size: 18, delay: '6.8s', dur: 17, drift: -16, rot:  10, spin: 6, color: 0 },
  { left: '49%', size: 24, delay: '0.7s', dur: 11, drift:  12, rot:  -8, spin: 7, color: 1 },
  { left: '57%', size: 14, delay: '4.5s', dur: 19, drift: -20, rot:  25, spin: 9, color: 5 },
  { left: '65%', size: 22, delay: '1.3s', dur: 13, drift:  16, rot: -12, spin: 6, color: 2 },
  { left: '73%', size: 18, delay: '7.2s', dur: 15, drift: -14, rot:  18, spin: 8, color: 4 },
  { left: '81%', size: 26, delay: '2.9s', dur: 12, drift:  22, rot:  -6, spin: 5, color: 0 },
  { left: '88%', size: 16, delay: '5.0s', dur: 18, drift: -18, rot:  22, spin: 9, color: 3 },
  { left: '94%', size: 20, delay: '0.4s', dur: 14, drift:  10, rot: -20, spin: 7, color: 1 },
  { left:  '8%', size: 18, delay: '8.0s', dur: 16, drift: -12, rot:  14, spin: 6, color: 4 },
];

const RED_TYPED_GLYPHS = [
  { top: '14%', left: '24%', char: ',',  delay: '0s'   },
  { top: '22%', left: '68%', char: '.',  delay: '1.4s' },
  { top: '36%', left: '14%', char: '_',  delay: '2.8s' },
  { top: '44%', left: '58%', char: '|',  delay: '0.7s' },
  { top: '52%', left: '82%', char: ':',  delay: '3.2s' },
  { top: '60%', left: '32%', char: '—',  delay: '1.9s' },
  { top: '68%', left: '76%', char: ',',  delay: '0.4s' },
  { top: '78%', left: '20%', char: '.',  delay: '2.5s' },
  { top: '84%', left: '50%', char: '_',  delay: '4.1s' },
];

const RED_LEAF_PATH =
  'M50 6 L58 24 L74 18 L66 36 L86 38 L70 50 L88 60 L66 60 L72 78 ' +
  'L58 70 L54 90 L46 90 L42 70 L28 78 L34 60 L12 60 L30 50 L14 38 ' +
  'L34 36 L26 18 L42 24 Z';

export function RedScene({ density = 1 } = {}) {
  const leaves = RED_LEAVES.slice(0, Math.max(4, Math.round(RED_LEAVES.length * density)));
  const glyphs = RED_TYPED_GLYPHS.slice(0, Math.max(3, Math.round(RED_TYPED_GLYPHS.length * density)));

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
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes qs-red-leaf-fall {
            0%   { transform: translateY(-12vh) translateX(0)
                              rotate(var(--qs-rot, 0deg)); opacity: 0; }
            8%   { opacity: 0.85; }
            92%  { opacity: 0.85; }
            100% { transform: translateY(115vh) translateX(var(--qs-drift, 0px))
                              rotate(calc(var(--qs-rot, 0deg) + 180deg));
                   opacity: 0; }
          }
          @keyframes qs-red-leaf-spin {
            0%, 100% { filter: brightness(1)    saturate(1); }
            50%      { filter: brightness(1.15) saturate(1.15); }
          }
          @keyframes qs-red-type-blink {
            0%, 100% { opacity: 0; transform: translateY(0); }
            12%      { opacity: 0.55; }
            50%      { opacity: 0.7; transform: translateY(-1px); }
            88%      { opacity: 0.5; }
          }
          @keyframes qs-red-vignette-pulse {
            0%, 100% { opacity: 0.45; }
            50%      { opacity: 0.6;  }
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)',
          animation: 'qs-red-vignette-pulse 7s ease-in-out infinite',
          opacity: 0.5,
        }}
      />

      <svg
        viewBox="0 0 240 360"
        style={{
          position: 'absolute',
          top: -40,
          left: -60,
          width: 220,
          height: 330,
          opacity: 0.32,
          transform: 'rotate(-22deg)',
          transformOrigin: 'top left',
        }}
      >
        <defs>
          <linearGradient id="qs-red-scarf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#fda4af" />
            <stop offset="50%"  stopColor="#9f1239" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>
          <pattern id="qs-red-stitch" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 7 Q 3.5 0, 7 7 T 14 7" fill="none" stroke="#fecaca" strokeWidth="1.2" opacity="0.45" />
            <path d="M0 12 Q 3.5 5, 7 12 T 14 12" fill="none" stroke="#7f1d1d" strokeWidth="1.2" opacity="0.5" />
          </pattern>
        </defs>
        <rect x="20" y="0" width="100" height="340" rx="14" fill="url(#qs-red-scarf)" />
        <rect x="20" y="0" width="100" height="340" rx="14" fill="url(#qs-red-stitch)" />
        <g stroke="#fecaca" strokeWidth="2" opacity="0.55" strokeLinecap="round">
          <line x1="28" y1="340" x2="28" y2="356" />
          <line x1="38" y1="340" x2="38" y2="358" />
          <line x1="48" y1="340" x2="48" y2="354" />
          <line x1="58" y1="340" x2="58" y2="360" />
          <line x1="68" y1="340" x2="68" y2="355" />
          <line x1="78" y1="340" x2="78" y2="358" />
          <line x1="88" y1="340" x2="88" y2="354" />
          <line x1="98" y1="340" x2="98" y2="357" />
          <line x1="108" y1="340" x2="108" y2="354" />
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(254,215,170,0.30) 0%, rgba(252,165,165,0.12) 40%, rgba(0,0,0,0) 70%)',
        }}
      />

      {leaves.map((l, i) => {
        const c = RED_LEAF_COLORS[l.color];
        return (
          <svg
            key={i}
            width={l.size}
            height={l.size}
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              top: '-12vh',
              left: l.left,
              opacity: 0.85,
              '--qs-rot': `${l.rot}deg`,
              '--qs-drift': `${l.drift}px`,
              animation: `qs-red-leaf-fall ${l.dur}s ${l.delay} linear infinite,
                          qs-red-leaf-spin ${l.spin}s ${l.delay} ease-in-out infinite`,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
            }}
          >
            <path d={RED_LEAF_PATH} fill={c.fill} stroke={c.stroke} strokeWidth="2" strokeLinejoin="round" />
            <line x1="50" y1="50" x2="50" y2="86" stroke={c.stroke} strokeWidth="1.5" opacity="0.7" />
          </svg>
        );
      })}

      {glyphs.map((g, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: g.top,
            left: g.left,
            color: '#fecaca',
            fontFamily: '"Courier New", "Courier", monospace',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.04em',
            opacity: 0.45,
            textShadow: '0 0 4px rgba(254,202,202,0.5)',
            animation: `qs-red-type-blink 4.5s ${g.delay} ease-in-out infinite`,
          }}
        >
          {g.char}
        </div>
      ))}
    </div>
  );
}

const RED_SNOWFLAKES = Array.from({ length: 28 }, (_, i) => ({
  left:    `${(i * 13.37) % 100}%`,
  size:    10 + ((i * 5) % 13),
  delay:   `${((i * 0.21) % 6).toFixed(2)}s`,
  dur:     5 + ((i * 7) % 4),
  drift:   ((i % 7) - 3) * 22,
  spinDur: 3 + (i % 5),
  op:      0.7 + ((i % 3) * 0.1),
}));

function Snowflake({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="-10 -10 20 20" aria-hidden="true">
      <g stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none">
        {[0, 60, 120].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <line x1="0" y1="-8" x2="0" y2="8" />
          </g>
        ))}
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <line x1="0" y1="-8" x2="-2.2" y2="-5.4" />
            <line x1="0" y1="-8" x2="2.2"  y2="-5.4" />
          </g>
        ))}
        <circle cx="0" cy="0" r="1.1" fill="#fff" stroke="none" />
      </g>
    </svg>
  );
}

export function AllTooWellMoment() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 15,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes qs-red-atw-darken {
            0%   { background-color: rgba(0,0,0,0);     }
            22%  { background-color: rgba(6,3,8,0.78);  }
            78%  { background-color: rgba(6,3,8,0.78);  }
            100% { background-color: rgba(0,0,0,0);     }
          }
          @keyframes qs-red-atw-snow-fall {
            0%   { transform: translate(0, -12vh) rotate(0deg);
                   opacity: 0; }
            10%  { opacity: var(--qs-op, 0.85); }
            90%  { opacity: var(--qs-op, 0.85); }
            100% { transform: translate(var(--qs-drift, 0px), 110vh) rotate(540deg);
                   opacity: 0; }
          }
          @keyframes qs-red-atw-snow-spin {
            0%, 100% { filter: drop-shadow(0 0 2px rgba(255,255,255,0.4)); }
            50%      { filter: drop-shadow(0 0 6px rgba(255,255,255,0.8)); }
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(6,3,8,0.55)',
          animation: 'qs-red-atw-darken 6s ease-in-out forwards',
        }}
      />

      {RED_SNOWFLAKES.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: f.left,
            '--qs-drift': `${f.drift}px`,
            '--qs-op':    f.op,
            animation:
              `qs-red-atw-snow-fall ${f.dur}s ${f.delay} linear infinite, ` +
              `qs-red-atw-snow-spin ${f.spinDur}s ${f.delay} ease-in-out infinite`,
            opacity: 0,
          }}
        >
          <Snowflake size={f.size} />
        </div>
      ))}
    </div>
  );
}

export function RedScarfComplete() {
  const LEAVES = [
    { x:-15, y: 20, size: 36, rot:-180, dur: 2.0, delay: 0.00, color: '#dc2626' },
    { x:-12, y: 55, size: 28, rot: 220, dur: 2.2, delay: 0.05, color: '#f59e0b' },
    { x: -8, y: 80, size: 44, rot:-260, dur: 1.9, delay: 0.10, color: '#b45309' },
    { x:  5, y: 10, size: 24, rot: 300, dur: 2.4, delay: 0.15, color: '#92400e' },
    { x: 18, y: 35, size: 38, rot:-200, dur: 2.0, delay: 0.18, color: '#dc2626' },
    { x: 22, y: 65, size: 30, rot: 240, dur: 2.1, delay: 0.22, color: '#ea580c' },
    { x: 30, y: 90, size: 34, rot:-180, dur: 2.0, delay: 0.28, color: '#fbbf24' },
    { x: 38, y: 15, size: 26, rot: 260, dur: 2.3, delay: 0.32, color: '#7f1d1d' },
    { x: 45, y: 50, size: 48, rot:-220, dur: 1.8, delay: 0.35, color: '#dc2626' },
    { x: 52, y: 78, size: 32, rot: 200, dur: 2.2, delay: 0.40, color: '#f59e0b' },
    { x: 58, y: 25, size: 30, rot:-300, dur: 2.0, delay: 0.45, color: '#b45309' },
    { x: 65, y: 60, size: 40, rot: 220, dur: 2.1, delay: 0.50, color: '#dc2626' },
    { x: 72, y: 88, size: 28, rot:-180, dur: 2.0, delay: 0.55, color: '#92400e' },
    { x: 78, y: 18, size: 36, rot: 260, dur: 2.2, delay: 0.60, color: '#ea580c' },
    { x: 84, y: 42, size: 26, rot:-220, dur: 1.9, delay: 0.65, color: '#fbbf24' },
    { x: 90, y: 70, size: 42, rot: 240, dur: 2.0, delay: 0.70, color: '#dc2626' },
    { x: 95, y: 30, size: 32, rot:-200, dur: 2.1, delay: 0.75, color: '#f59e0b' },
    { x:100, y: 55, size: 30, rot: 280, dur: 2.0, delay: 0.80, color: '#b45309' },
    { x:108, y: 85, size: 38, rot:-260, dur: 1.8, delay: 0.85, color: '#dc2626' },
    { x: 12, y: 95, size: 22, rot: 320, dur: 2.4, delay: 0.30, color: '#7f1d1d' },
    { x: 50, y:  5, size: 22, rot:-340, dur: 2.4, delay: 0.20, color: '#fbbf24' },
    { x: 80, y:  0, size: 34, rot: 200, dur: 2.0, delay: 0.55, color: '#ea580c' },
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes qs-red-leaf-blow {
            0%   { transform: translate(0vw, 0vh) rotate(0deg) scale(0.6);
                   opacity: 0; }
            12%  { opacity: 1; }
            55%  { opacity: 1; transform: translate(60vw, 25vh) rotate(calc(var(--qs-rot) * 0.55)) scale(1); }
            85%  { opacity: 0.85; }
            100% { transform: translate(130vw, 55vh) rotate(var(--qs-rot)) scale(0.9);
                   opacity: 0; }
          }
        }
      `}</style>

      {LEAVES.map((l, i) => (
        <svg
          key={i}
          width={l.size}
          height={l.size}
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            top: `${l.y}%`,
            left: `${l.x}%`,
            '--qs-rot': `${l.rot}deg`,
            animation: `qs-red-leaf-blow ${l.dur}s ${l.delay}s cubic-bezier(.3,.6,.5,1) forwards`,
            opacity: 0,
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
          }}
        >
          <path
            d="M50 8 L62 28 L82 22 L72 44 L92 50 L72 60 L82 80 L62 76 L56 96 L50 80 L44 96 L38 76 L18 80 L28 60 L8 50 L28 44 L18 22 L38 28 Z"
            fill={l.color}
          />
          <path d="M50 12 L50 88" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" fill="none" />
        </svg>
      ))}
    </div>
  );
}
