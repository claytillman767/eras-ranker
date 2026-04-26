import { useEffect, useState } from 'react';

// ── Static particle data (defined outside component to avoid re-renders) ─────

// Lavender smoke particles rising from the bottom edge
const SMOKE = [
  { left: '3%',  w: 62, h: 62, delay: '0s',    dur: '3.2s', op: 0.28 },
  { left: '11%', w: 46, h: 46, delay: '0.45s', dur: '2.8s', op: 0.22 },
  { left: '21%', w: 74, h: 74, delay: '0.15s', dur: '3.5s', op: 0.32 },
  { left: '30%', w: 52, h: 52, delay: '0.7s',  dur: '3.0s', op: 0.25 },
  { left: '40%', w: 82, h: 82, delay: '0.05s', dur: '3.8s', op: 0.36 },
  { left: '49%', w: 58, h: 58, delay: '0.55s', dur: '2.9s', op: 0.27 },
  { left: '59%', w: 70, h: 70, delay: '0.25s', dur: '3.3s', op: 0.30 },
  { left: '68%', w: 48, h: 48, delay: '0.8s',  dur: '2.7s', op: 0.24 },
  { left: '77%', w: 76, h: 76, delay: '0.1s',  dur: '3.6s', op: 0.33 },
  { left: '86%', w: 54, h: 54, delay: '0.6s',  dur: '3.1s', op: 0.26 },
  { left: '93%', w: 44, h: 44, delay: '0.35s', dur: '2.6s', op: 0.20 },
  // Second wave — staggered so smoke keeps flowing throughout
  { left: '7%',  w: 58, h: 58, delay: '1.6s',  dur: '3.2s', op: 0.22 },
  { left: '35%', w: 66, h: 66, delay: '1.2s',  dur: '2.8s', op: 0.26 },
  { left: '55%', w: 72, h: 72, delay: '1.9s',  dur: '3.5s', op: 0.30 },
  { left: '74%', w: 60, h: 60, delay: '1.7s',  dur: '3.0s', op: 0.24 },
  { left: '89%', w: 50, h: 50, delay: '1.4s',  dur: '2.9s', op: 0.20 },
];

// Tiny star dots scattered across the upper half of the overlay
const STARS = [
  { top: '7%',  left: '6%',  size: 2.5 }, { top: '12%', left: '22%', size: 1.5 },
  { top: '5%',  left: '44%', size: 3   }, { top: '10%', left: '63%', size: 1.5 },
  { top: '6%',  left: '81%', size: 2   }, { top: '18%', left: '14%', size: 1.5 },
  { top: '21%', left: '35%', size: 1   }, { top: '16%', left: '54%', size: 2   },
  { top: '24%', left: '76%', size: 1.5 }, { top: '29%', left: '90%', size: 1   },
  { top: '33%', left: '4%',  size: 1.5 }, { top: '38%', left: '27%', size: 1   },
  { top: '36%', left: '68%', size: 2   }, { top: '43%', left: '87%', size: 1.5 },
  { top: '50%', left: '11%', size: 1   }, { top: '47%', left: '48%', size: 1.5 },
  { top: '54%', left: '74%', size: 1   }, { top: '15%', left: '98%', size: 2   },
  { top: '3%',  left: '30%', size: 1.5 }, { top: '28%', left: '50%', size: 1   },
];

// ── Component ─────────────────────────────────────────────────────────────────

// Full-screen Easter egg shown once when the user finishes ranking all Midnights songs.
// Auto-dismisses after ~4 seconds; clicking anywhere also closes it early.
export default function MidnightsEasterEgg({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const startLeave = setTimeout(() => setLeaving(true), 3400);
    const finish     = setTimeout(onDone, 4200);
    return () => { clearTimeout(startLeave); clearTimeout(finish); };
  }, [onDone]);

  return (
    <>
      <style>{`
        @keyframes mn-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes mn-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes mn-smoke {
          0%   { transform: translateY(0)      scale(1);   opacity: 0; }
          18%  { opacity: var(--op); }
          78%  { opacity: var(--op); }
          100% { transform: translateY(-280px) scale(2.1); opacity: 0; }
        }
        @keyframes mn-clock-glow {
          0%, 100% { text-shadow: 0 0 18px #c084fc, 0 0 40px #a855f7; }
          50%      { text-shadow: 0 0 40px #d8b4fe, 0 0 80px #a855f7, 0 0 110px #7c3aed; }
        }
        @keyframes mn-colon-blink {
          0%, 48%  { opacity: 1;    }
          50%, 98% { opacity: 0.06; }
          100%     { opacity: 1;    }
        }
        @keyframes mn-label-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 0.75; transform: translateY(0); }
        }
        @keyframes mn-star-twinkle {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.5); }
        }
      `}</style>

      {/* Full-screen overlay — tap anywhere to skip */}
      <div
        role="presentation"
        onClick={onDone}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          background: 'radial-gradient(ellipse at 50% 38%, #1a0550 0%, #05010e 68%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'default',
          animation: leaving ? 'mn-out 0.8s ease forwards' : 'mn-in 0.6s ease forwards',
        }}
      >
        {/* ── Star field ─────────────────────────────────────────────────── */}
        {STARS.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: '#e9d5ff',
              animation: `mn-star-twinkle ${1.4 + (i % 5) * 0.38}s ${(i * 0.28) % 1.4}s ease-in-out infinite`,
            }}
          />
        ))}

        {/* ── Clock display ───────────────────────────────────────────────── */}
        <div style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontSize: 'clamp(72px, 22vw, 112px)',
          fontWeight: 300,
          color: '#ede9fe',
          letterSpacing: '0.04em',
          lineHeight: 1,
          userSelect: 'none',
          animation: 'mn-clock-glow 1.6s ease-in-out infinite',
        }}>
          12<span style={{ animation: 'mn-colon-blink 1s step-start infinite' }}>:</span>00
        </div>

        {/* ── "lavender haze" label ────────────────────────────────────────── */}
        <div style={{
          color: '#c084fc',
          fontSize: 'clamp(11px, 3.5vw, 16px)',
          fontStyle: 'italic',
          letterSpacing: '0.28em',
          marginTop: 20,
          opacity: 0,
          animation: 'mn-label-in 0.9s 0.55s ease forwards',
        }}>
          lavender haze
        </div>

        {/* ── Smoke layer ─────────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 290,
          pointerEvents: 'none',
        }}>
          {SMOKE.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: -24,
                left: p.left,
                width: p.w,
                height: p.h,
                borderRadius: '50%',
                background: `radial-gradient(circle,
                  rgba(192, 132, 252, ${(p.op * 1.5).toFixed(2)}) 0%,
                  rgba(168,  85, 247, ${p.op.toFixed(2)})          40%,
                  transparent 70%)`,
                filter: 'blur(11px)',
                '--op': p.op,
                animation: `mn-smoke ${p.dur} ${p.delay} ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
