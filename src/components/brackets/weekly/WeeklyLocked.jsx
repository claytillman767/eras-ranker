// Weekly bracket — Locked / Waiting screen.
// Shown between rounds: the user has voted everything available and the
// community is still voting, so we show a countdown to the next drop plus
// soft secondary CTAs. Recreated from design_handoff_weekly_bracket/locked.jsx.
//
// The "Build your own bracket" card is a PRO-funnel entry point ($3.99 unlock):
// it routes to the existing bracket builder / BracketLocked flow, which owns
// the canonical price + perk copy. We intentionally DON'T repeat the price here
// (one source of truth → no cross-surface drift).

import {
  ArenaBg, Eyebrow, GOLD_LT, fontUI, fontDisplay,
} from './WeeklyParts';

const pad2 = (n) => String(n ?? 0).padStart(2, '0');

export default function WeeklyLocked({
  categoryName = 'Best Bridge',
  weekNumber = 14,
  countdown = { days: 1, hrs: 8, min: 42 },
  nextDropLabel = 'Wednesday',
  subtitle,
  onBack,
  onBuildOwn,
  onShare,
  showShare = true,
}) {
  const sub = subtitle || 'The community’s still voting — results drop in';
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      color: '#fff', fontFamily: fontUI, overflow: 'hidden',
    }}>
      <ArenaBg />

      {/* top chrome */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '60px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer', color: '#fff',
          width: 36, height: 36, borderRadius: 18,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700,
        }}>‹</button>
        <Eyebrow color={GOLD_LT}>{categoryName} · Week {weekNumber}</Eyebrow>
        <div style={{ width: 36 }} />
      </div>

      {/* big lock */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: 36, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          position: 'relative', width: 120, height: 120, borderRadius: 30,
          background: 'linear-gradient(150deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04))',
          border: '1px solid rgba(212,175,55,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56,
          boxShadow: '0 12px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>
          🔒
          <div style={{ position: 'absolute', inset: -16, borderRadius: 38, border: '1px dashed rgba(212,175,55,0.25)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: -32, borderRadius: 50, border: '1px dashed rgba(212,175,55,0.12)', pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, padding: '28px 28px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: fontDisplay, fontSize: 32, lineHeight: 1.1, letterSpacing: -0.3 }}>
          You’re in.<br />
          <span style={{ color: GOLD_LT, fontStyle: 'italic' }}>Come back {nextDropLabel}.</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{sub}</div>

        {/* countdown */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[[pad2(countdown.days), 'DAYS'], [pad2(countdown.hrs), 'HRS'], [pad2(countdown.min), 'MIN']].map(([v, l]) => (
            <div key={l} style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 64 }}>
              <div style={{ fontFamily: fontUI, fontWeight: 800, fontSize: 28, color: GOLD_LT, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* secondary CTAs */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 38, zIndex: 2, padding: '0 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <button onClick={onBuildOwn} style={{
          appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
          padding: '14px 16px', borderRadius: 16,
          background: 'rgba(168,85,247,0.14)', border: '1px solid rgba(168,85,247,0.3)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 26 }}>🛠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fontUI, fontWeight: 700, fontSize: 14, color: '#fff' }}>Build your own bracket</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Pick your own 16 songs and category</div>
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>›</div>
        </button>

        {showShare && (
          <button onClick={onShare} style={{
            appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            padding: '14px 16px', borderRadius: 16,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ fontSize: 26 }}>🔗</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fontUI, fontWeight: 700, fontSize: 14, color: '#fff' }}>Share your bracket so far</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Your picks · brag a little</div>
            </div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>›</div>
          </button>
        )}
      </div>
    </div>
  );
}
