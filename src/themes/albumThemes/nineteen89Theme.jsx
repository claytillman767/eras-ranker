// 1989 album theme — QuickScore overlay decoration.
//
// Five exports following the album-theme contract:
//   NINETEEN89_BACKGROUND    — backdrop gradient
//   NineteenEightyNineScene  — ambient (skyline + polaroids + seagulls + glitter)
//   WelcomeToNewYorkMoment   — signature moment for "Welcome to New York"
//   PolaroidComplete         — album-complete decoration (polaroid deal-in)
//   NINETEEN89_TEXT_TUNING   — per-theme label / calibration colors

export const NINETEEN89_BACKGROUND =
  'linear-gradient(180deg, #bae6fd 0%, #e0f2fe 35%, #fce7f3 70%, #fbcfe8 100%)';

export const NINETEEN89_TEXT_TUNING = {
  categoryLabel: '#0c4a6e',
  subCounter: 'rgba(15,23,42,0.55)',
  calibration: 'rgba(15,23,42,0.7)',
  calibrationActive: '#ec4899',
  songTitle: '#0f172a',
  // Star colors — sky-blue on cotton-candy, per design spec.
  starFilled: '#0ea5e9',
  starFilledStroke: '#0c4a6e',
  starEmptyStroke: 'rgba(15,23,42,0.35)',
  accent: '#7c3aed',
};

const NYC_SKYLINE_PATH =
  'M0 140 ' +
  'L0 88 L34 88 ' +
  'L34 74 L66 74 ' +
  'L66 60 L96 60 ' +
  'L96 50 L132 50 ' +
  'L132 78 L162 78 ' +
  'L162 42 L198 42 ' +
  'L198 30 L208 30 L208 22 L214 22 L214 14 L218 14 ' +
  'L218 4  L221 4  L221 14 L225 14 L225 22 L231 22 L231 30 L240 30 ' +
  'L240 76 L268 76 ' +
  'L268 58 L296 58 ' +
  'L296 50 L322 50 ' +
  'L322 36 L328 36 L328 26 L334 26 L334 18 L338 18 L338 12 L341 12 ' +
  'L342 6  L344 12 L347 12 L347 18 L351 18 L351 26 L357 26 L357 36 L363 36 ' +
  'L363 80 L392 80 ' +
  'L392 64 L420 64 ' +
  'L420 52 L446 52 ' +
  'L446 44 L454 44 L454 16 L457 16 L457 44 L470 44 L470 16 L473 16 L473 44 L482 44 ' +
  'L482 70 L508 70 ' +
  'L508 56 L536 56 ' +
  'L536 46 L568 46 ' +
  'L568 84 L600 84 ' +
  'L600 140 Z';

const NYC_WATER_TANKS = [
  { x: 78,  rooftopY: 60 },
  { x: 144, rooftopY: 78 },
  { x: 280, rooftopY: 58 },
  { x: 404, rooftopY: 64 },
  { x: 520, rooftopY: 56 },
];

const NINETEEN89_POLAROIDS = [
  { top:  '4%', left:  '4%', rot: -12, delay: '0s',   dur: 7, tint: '#fce7f3', scene: 'taxi'    },
  { top:  '6%', left: '78%', rot:  16, delay: '1.4s', dur: 8, tint: '#dbeafe', scene: 'bridge'  },
  { top: '32%', left: '-2%', rot:   8, delay: '2.6s', dur: 9, tint: '#fffbeb', scene: 'skyline' },
  { top: '30%', left: '86%', rot: -22, delay: '0.6s', dur: 7, tint: '#fce7f3', scene: 'statue'  },
  { top: '60%', left: '-3%', rot:  14, delay: '3.1s', dur: 8, tint: '#dbeafe', scene: 'subway'  },
  { top: '62%', left: '85%', rot: -10, delay: '1.9s', dur: 9, tint: '#fffbeb', scene: 'hotdog'  },
  { top: '88%', left: '10%', rot:   4, delay: '2.2s', dur: 7, tint: '#dbeafe', scene: 'cup'     },
  { top: '90%', left: '70%', rot: -16, delay: '0.9s', dur: 8, tint: '#fce7f3', scene: 'steam'   },
];

export function NYCVignette({ kind, tint }) {
  const sky = `linear-gradient(180deg, ${tint} 0%, #fff 70%)`;
  const ink = '#1e293b';
  const accent = '#fbbf24';
  const wrap = {
    width: '100%', height: '100%',
    background: sky,
    position: 'relative',
    overflow: 'hidden',
  };
  switch (kind) {
    case 'taxi':
      return (
        <div style={wrap}>
          <svg viewBox="0 0 60 60" width="100%" height="100%">
            <rect x="0" y="42" width="60" height="18" fill="#94a3b8" opacity="0.55" />
            <rect x="10" y="30" width="40" height="14" rx="3" fill={accent} />
            <rect x="16" y="22" width="28" height="10" rx="2" fill={accent} />
            <rect x="27" y="19" width="6" height="3" rx="1" fill="#fde68a" />
            <rect x="19" y="24" width="9" height="6" fill="#0c4a6e" opacity="0.6" />
            <rect x="32" y="24" width="9" height="6" fill="#0c4a6e" opacity="0.6" />
            <circle cx="18" cy="45" r="4" fill={ink} />
            <circle cx="42" cy="45" r="4" fill={ink} />
          </svg>
        </div>
      );
    case 'bridge':
      return (
        <div style={wrap}>
          <svg viewBox="0 0 60 60" width="100%" height="100%">
            <rect x="0" y="40" width="60" height="20" fill="#475569" opacity="0.4" />
            <rect x="0" y="36" width="60" height="3" fill={ink} />
            <rect x="14" y="10" width="4" height="26" fill={ink} />
            <rect x="42" y="10" width="4" height="26" fill={ink} />
            <path d="M14 12 L8 16 M18 12 L24 16 M42 12 L36 16 M46 12 L52 16" stroke={ink} strokeWidth="1" fill="none" />
            <path d="M16 12 Q 30 30, 44 12" stroke={ink} strokeWidth="1.2" fill="none" />
            <path d="M16 14 Q 30 32, 44 14" stroke={ink} strokeWidth="0.8" fill="none" opacity="0.6" />
          </svg>
        </div>
      );
    case 'skyline':
      return (
        <div style={wrap}>
          <svg viewBox="0 0 60 60" width="100%" height="100%">
            <path d="M0 60 L0 32 L6 32 L6 26 L14 26 L14 18 L18 18 L18 14 L22 14 L22 6 L26 6 L26 14 L30 14 L30 22 L36 22 L36 16 L42 16 L42 26 L48 26 L48 30 L54 30 L54 24 L60 24 L60 60 Z" fill={ink} />
            <g fill={accent} opacity="0.85">
              <rect x="19" y="20" width="1" height="1" />
              <rect x="23" y="10" width="1" height="1" />
              <rect x="37" y="20" width="1" height="1" />
              <rect x="49" y="30" width="1" height="1" />
            </g>
          </svg>
        </div>
      );
    case 'statue':
      return (
        <div style={wrap}>
          <svg viewBox="0 0 60 60" width="100%" height="100%">
            <rect x="0" y="50" width="60" height="10" fill="#0ea5e9" opacity="0.4" />
            <rect x="22" y="44" width="16" height="8" fill="#475569" />
            <path d="M28 22 L26 44 L34 44 L32 22 Z" fill="#5eead4" />
            <circle cx="30" cy="19" r="3" fill="#5eead4" />
            <rect x="32" y="10" width="2" height="12" fill="#5eead4" transform="rotate(-20 33 16)" />
            <circle cx="38" cy="8" r="3" fill={accent} />
            <path d="M38 4 Q 39 1, 40 5 Q 41 2, 41 5" stroke={accent} strokeWidth="1.2" fill="none" />
          </svg>
        </div>
      );
    case 'subway':
      return (
        <div style={wrap}>
          <svg viewBox="0 0 60 60" width="100%" height="100%">
            <rect x="0" y="44" width="60" height="16" fill="#94a3b8" opacity="0.5" />
            <rect x="28" y="30" width="4" height="18" fill={ink} />
            <circle cx="30" cy="22" r="10" fill="#16a34a" />
            <circle cx="30" cy="22" r="10" fill="none" stroke={ink} strokeWidth="1" />
            <text x="30" y="27" textAnchor="middle" fontFamily="Helvetica, Arial" fontWeight="800" fontSize="12" fill="#fff">S</text>
          </svg>
        </div>
      );
    case 'hotdog':
      return (
        <div style={wrap}>
          <svg viewBox="0 0 60 60" width="100%" height="100%">
            <rect x="0" y="54" width="60" height="6" fill="#94a3b8" opacity="0.45" />
            <rect x="14" y="40" width="32" height="14" fill={ink} />
            <rect x="18" y="28" width="24" height="12" fill={ink} />
            <rect x="20" y="22" width="20" height="6"  fill={ink} />
            <rect x="23" y="14" width="14" height="8"  fill={ink} />
            <rect x="25" y="10" width="10" height="4"  fill={ink} />
            <rect x="29" y="2"  width="2"  height="8"  fill={ink} />
            <rect x="28" y="0"  width="4"  height="2"  fill={ink} />
            <g fill={accent} opacity="0.85">
              <rect x="20" y="44" width="1" height="1" />
              <rect x="24" y="44" width="1" height="1" />
              <rect x="28" y="44" width="1" height="1" />
              <rect x="36" y="44" width="1" height="1" />
              <rect x="22" y="32" width="1" height="1" />
              <rect x="30" y="32" width="1" height="1" />
              <rect x="36" y="32" width="1" height="1" />
              <rect x="27" y="17" width="1" height="1" />
              <rect x="32" y="17" width="1" height="1" />
            </g>
          </svg>
        </div>
      );
    case 'cup':
      return (
        <div style={wrap}>
          <svg viewBox="0 0 60 60" width="100%" height="100%">
            <rect x="0" y="50" width="60" height="10" fill="#94a3b8" opacity="0.4" />
            <path d="M22 12 Q 24 6, 22 0 M30 12 Q 32 6, 30 0 M38 12 Q 40 6, 38 0" stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M18 16 L 42 16 L 38 50 L 22 50 Z" fill="#0c4a6e" />
            <rect x="17" y="14" width="26" height="4" fill="#fff" stroke={ink} strokeWidth="0.8" />
            <path d="M20 24 L24 24 L24 28 L28 28 L28 22 L32 22 L32 28 L36 28 L36 24 L40 24" stroke="#fff" strokeWidth="1" fill="none" />
          </svg>
        </div>
      );
    case 'steam':
      return (
        <div style={wrap}>
          <svg viewBox="0 0 60 60" width="100%" height="100%">
            <rect x="0" y="42" width="60" height="18" fill="#1f2937" />
            <rect x="4"  y="50" width="6" height="2" fill="#fde68a" opacity="0.7" />
            <rect x="16" y="50" width="6" height="2" fill="#fde68a" opacity="0.7" />
            <rect x="40" y="50" width="6" height="2" fill="#fde68a" opacity="0.7" />
            <ellipse cx="30" cy="44" rx="10" ry="3" fill={ink} />
            <path d="M22 38 Q 18 28, 24 22 Q 28 14, 22 6" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d="M30 38 Q 34 28, 30 18 Q 26 10, 30 2" stroke="#cbd5e1" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M38 38 Q 42 30, 38 22 Q 34 14, 40 6" stroke="#e2e8f0" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>
      );
    default:
      return <div style={wrap} />;
  }
}

const NINETEEN89_GLITTER = [
  { top:  '6%', left: '32%', size: 3, color: '#ec4899', delay: '0s'   },
  { top: '12%', left: '88%', size: 4, color: '#0ea5e9', delay: '0.6s' },
  { top: '24%', left: '24%', size: 3, color: '#0ea5e9', delay: '1.4s' },
  { top: '30%', left: '56%', size: 4, color: '#ec4899', delay: '0.3s' },
  { top: '40%', left: '36%', size: 3, color: '#ec4899', delay: '1.9s' },
  { top: '46%', left: '90%', size: 4, color: '#0ea5e9', delay: '0.7s' },
  { top: '54%', left: '12%', size: 3, color: '#0ea5e9', delay: '2.1s' },
  { top: '62%', left: '50%', size: 4, color: '#ec4899', delay: '1.0s' },
  { top: '70%', left: '34%', size: 3, color: '#0ea5e9', delay: '0.4s' },
  { top: '76%', left: '74%', size: 4, color: '#ec4899', delay: '1.6s' },
  { top: '84%', left: '16%', size: 3, color: '#ec4899', delay: '0.9s' },
  { top: '88%', left: '54%', size: 4, color: '#0ea5e9', delay: '2.4s' },
];

const NINETEEN89_GULLS = [
  { top: '18%', delay: '0s',   dur: 22, scale: 1   },
  { top: '8%',  delay: '11s',  dur: 26, scale: 0.8 },
];

export function NineteenEightyNineScene({ density = 1 } = {}) {
  const polaroids = NINETEEN89_POLAROIDS.slice(0, Math.max(3, Math.round(NINETEEN89_POLAROIDS.length * density)));
  const glitter = NINETEEN89_GLITTER.slice(0, Math.max(4, Math.round(NINETEEN89_GLITTER.length * density)));

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
          @keyframes qs-89-sway {
            0%, 100% { transform: translateY(0)    rotate(var(--qs-rot, 0deg)); }
            50%      { transform: translateY(-10px) rotate(calc(var(--qs-rot, 0deg) + 4deg)); }
          }
          @keyframes qs-89-glint {
            0%, 100% { opacity: 0.35; transform: scale(0.85); }
            50%      { opacity: 0.95; transform: scale(1.2);  }
          }
          @keyframes qs-89-gull-fly {
            0%   { transform: translateX(-15vw) translateY(0); }
            50%  { transform: translateX(50vw)  translateY(-10px); }
            100% { transform: translateX(115vw) translateY(0); }
          }
          @keyframes qs-89-gull-flap {
            0%, 100% { transform: scaleY(1);   }
            50%      { transform: scaleY(0.7); }
          }
          @keyframes qs-89-skyline-haze {
            0%, 100% { opacity: 0.32; }
            50%      { opacity: 0.42; }
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 90,
          background:
            'radial-gradient(ellipse at 30% 0%, rgba(236,72,153,0.22) 0%, rgba(236,72,153,0) 70%), ' +
            'radial-gradient(ellipse at 80% 0%, rgba(14,165,233,0.22) 0%, rgba(14,165,233,0) 70%)',
        }}
      />

      {polaroids.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            width: 56,
            height: 70,
            background: '#fffdf7',
            padding: 5,
            paddingBottom: 14,
            boxShadow: '0 4px 12px rgba(15,23,42,0.18), 0 1px 3px rgba(15,23,42,0.12)',
            opacity: 0.85,
            '--qs-rot': `${p.rot}deg`,
            transform: `rotate(${p.rot}deg)`,
            animation: `qs-89-sway ${p.dur}s ${p.delay} ease-in-out infinite`,
          }}
        >
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <NYCVignette kind={p.scene} tint={p.tint} />
          </div>
        </div>
      ))}

      {NINETEEN89_GULLS.map((g, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: g.top,
            left: 0,
            opacity: 0.45,
            animation: `qs-89-gull-fly ${g.dur}s ${g.delay} linear infinite`,
            transform: `scale(${g.scale})`,
          }}
        >
          <div style={{ animation: `qs-89-gull-flap 0.9s ease-in-out infinite` }}>
            <svg width="36" height="14" viewBox="0 0 36 14">
              <path
                d="M2 10 Q 8 2, 14 8 Q 18 5, 22 8 Q 28 2, 34 10"
                fill="none"
                stroke="#475569"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      ))}

      {glitter.map((g, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: g.top,
            left: g.left,
            width: g.size,
            height: g.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, #fff 0%, ${g.color} 100%)`,
            boxShadow: `0 0 6px ${g.color}aa`,
            opacity: 0.5,
            animation: `qs-89-glint 2.6s ${g.delay} ease-in-out infinite`,
          }}
        />
      ))}

      <svg
        viewBox="0 0 600 140"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 168,
          opacity: 0.34,
          animation: 'qs-89-skyline-haze 6s ease-in-out infinite',
        }}
      >
        <path d={NYC_SKYLINE_PATH} fill="#1e293b" />
        <g fill="#1e293b">
          {NYC_WATER_TANKS.map((t, i) => (
            <g key={i} transform={`translate(${t.x} ${t.rooftopY - 9})`}>
              <rect x="0" y="6" width="1" height="3" />
              <rect x="7" y="6" width="1" height="3" />
              <rect x="-1" y="2" width="10" height="5" />
              <path d="M-1 2 L4 -2 L9 2 Z" />
            </g>
          ))}
        </g>
        <g fill="#fde68a" opacity="0.8">
          <rect x="74"  y="42" width="2" height="2" />
          <rect x="80"  y="46" width="2" height="2" />
          <rect x="172" y="32" width="2" height="2" />
          <rect x="178" y="40" width="2" height="2" />
          <rect x="266" y="40" width="2" height="2" />
          <rect x="278" y="44" width="2" height="2" />
          <rect x="394" y="38" width="2" height="2" />
          <rect x="412" y="44" width="2" height="2" />
          <rect x="466" y="34" width="2" height="2" />
          <rect x="572" y="42" width="2" height="2" />
        </g>
      </svg>
    </div>
  );
}

export function WelcomeToNewYorkMoment() {
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
          @keyframes qs-89-neon-bloom {
            0%   { opacity: 0;    transform: scale(0.9); }
            25%  { opacity: 1;    transform: scale(1);   }
            75%  { opacity: 1;    transform: scale(1.05);}
            100% { opacity: 0;    transform: scale(1.15);}
          }
          @keyframes qs-89-windows-on {
            0%, 100% { opacity: 0;   }
            25%, 75% { opacity: 0.9; }
          }
          @keyframes qs-89-typed-city {
            0%   { opacity: 0; transform: scale(0.7); }
            18%  { opacity: 1; transform: scale(1.08); }
            28%  { transform: scale(1); }
            85%  { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1); }
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '70%',
          background:
            'radial-gradient(ellipse at 25% 10%, rgba(236,72,153,0.85) 0%, rgba(236,72,153,0) 55%), ' +
            'radial-gradient(ellipse at 75% 10%, rgba(14,165,233,0.85)  0%, rgba(14,165,233,0)  55%), ' +
            'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 70%)',
          mixBlendMode: 'screen',
          animation: 'qs-89-neon-bloom 3s ease-in-out forwards',
        }}
      />

      <svg
        viewBox="0 0 600 140"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 90,
          animation: 'qs-89-windows-on 3s ease-in-out forwards',
        }}
      >
        <g fill="#fde68a">
          {Array.from({ length: 60 }).map((_, i) => {
            const x = 30 + (i * 9.3) % 560;
            const y = 30 + ((i * 7) % 40);
            return <rect key={i} x={x} y={y} width="2" height="2" />;
          })}
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          top: '14%',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: '0.2em',
          color: '#fff',
          textShadow:
            '0 0 4px #fff, 0 0 10px #f9a8d4, 0 0 24px #ec4899, ' +
            '0 0 38px #ec4899, 0 0 60px rgba(14,165,233,0.6)',
          animation: 'qs-89-typed-city 3s ease-in-out forwards',
        }}
      >
        WELCOME TO NEW YORK
      </div>
    </div>
  );
}

export function PolaroidComplete() {
  const stack = [
    { from: '-120%', to: '-25%',  rot: -14, delay: '0s',   scene: 'taxi'    },
    { from:  '120%', to:  '25%',  rot:  10, delay: '0.15s',scene: 'bridge'  },
    { from: '-110%', to:  '-8%',  rot:   6, delay: '0.3s', scene: 'statue'  },
    { from:  '110%', to:   '8%',  rot: -10, delay: '0.45s',scene: 'skyline' },
    { from:    '0%', to:   '0%',  rot:   2, delay: '0.6s', scene: 'subway'  },
  ];
  const tints = ['#fce7f3', '#dbeafe', '#fffbeb', '#fce7f3', '#dbeafe'];
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes qs-89-polaroid-deal {
            0%   { transform: translate(var(--qs-from), -10vh) rotate(0deg);
                   opacity: 0; }
            60%  { opacity: 1; }
            100% { transform: translate(var(--qs-to),    50vh) rotate(var(--qs-rot, 0deg));
                   opacity: 1; }
          }
        }
      `}</style>
      {stack.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            marginLeft: -56,
            width: 112,
            height: 140,
            background: '#fffdf7',
            padding: 8,
            paddingBottom: 26,
            boxShadow: '0 8px 24px rgba(15,23,42,0.25), 0 2px 6px rgba(15,23,42,0.18)',
            '--qs-from': p.from,
            '--qs-to':   p.to,
            '--qs-rot':  `${p.rot}deg`,
            animation: `qs-89-polaroid-deal 1.6s ${p.delay} cubic-bezier(.2,.8,.4,1) forwards`,
            opacity: 0,
            transform: `translate(${p.to}, 50vh) rotate(${p.rot}deg)`,
          }}
        >
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <NYCVignette kind={p.scene} tint={tints[i]} />
          </div>
        </div>
      ))}
    </div>
  );
}
