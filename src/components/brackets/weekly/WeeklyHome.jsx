// Weekly bracket — Home (hero state machine).
// The Brackets-tab landing for the weekly community bracket. The hero always
// shows the single most urgent action; below it sits the shared chrome
// (schedule strip + stat chips). Recreated from
// design_handoff_weekly_bracket/home.jsx against the real catalog.
//
// NOTE: the design mocked a bottom tab bar with a "DNA" tab — that is NOT
// shipped here. The real app already provides bottom navigation (Home, Albums,
// Brackets, Rankings, Settings), so this component renders ONLY the bracket
// content (optional wordmark header → hero → schedule → stats).
//
// `heroState` is one of: 'roundLive' | 'waiting' | 'resultsReady' | 'urgent'
// | 'finale'. A pure selector (weeklyHeroState) is exported for the wiring step.

import { getEra } from '../../../constants/eraColors';
import {
  SongTile, Eyebrow,
  ARENA_BG, GOLD, GOLD_LT, PURPLE, PURPLE_DEEP, PURPLE_LT, PURPLE_MD,
  fontUI, fontDisplay,
} from './WeeklyParts';

// Pure hero-state selector (used when wiring into the live tab).
//   isOver — champion revealed; open — current round still accepting votes;
//   votedAll — user voted every matchup in the open round; resultsPending —
//   a just-closed round the user hasn't revealed yet; hoursLeft — until the
//   open round closes; behind — user has unvoted matchups in the open round.
export function weeklyHeroState({ isOver, resultsPending, open, votedAll, behind, hoursLeft }) {
  if (isOver) return 'finale';
  if (open && behind && hoursLeft != null && hoursLeft < 6) return 'urgent';
  if (resultsPending) return 'resultsReady';
  if (open && votedAll) return 'waiting';
  return 'roundLive';
}

function CountdownChunk({ v, l }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: '#fff', borderRadius: 10, padding: '8px 10px', minWidth: 52,
    }}>
      <div style={{
        fontFamily: fontUI, fontWeight: 800, fontSize: 24,
        color: PURPLE_DEEP, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
      }}>{v}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#9333ea', letterSpacing: 0.6, marginTop: 3 }}>
        {l.toUpperCase()}
      </div>
    </div>
  );
}
const Colon = () => <div style={{ fontFamily: fontUI, fontWeight: 800, fontSize: 18, color: '#c4b5fd' }}>:</div>;

const pad2 = (n) => String(n ?? 0).padStart(2, '0');

function HeroCard({ children, variant }) {
  const styles = {
    purple: { background: `linear-gradient(150deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`, color: '#fff', boxShadow: '0 14px 32px rgba(124,58,237,0.32), 0 2px 6px rgba(0,0,0,0.05)' },
    waiting: { background: PURPLE_LT, color: PURPLE_DEEP, border: '1px dashed rgba(124,58,237,0.3)', boxShadow: '0 6px 18px rgba(168,85,247,0.1)' },
    arena: { background: ARENA_BG, color: '#fff', boxShadow: '0 14px 32px rgba(15,52,96,0.4)' },
    urgent: { background: 'linear-gradient(155deg, #fb923c 0%, #ea580c 60%, #c2410c 100%)', color: '#fff', boxShadow: '0 14px 32px rgba(234,88,12,0.4)' },
    finale: { background: ARENA_BG, color: '#fff', boxShadow: '0 16px 40px rgba(15,52,96,0.5), 0 0 0 2px rgba(212,175,55,0.25)' },
  }[variant];
  return <div style={{ position: 'relative', borderRadius: 24, padding: 22, overflow: 'hidden', ...styles }}>{children}</div>;
}

function FloatingTiles({ songs = [] }) {
  const positions = [
    { right: -14, top: 14, size: 44, rot: -10 },
    { right: 28, top: -8, size: 32, rot: 14 },
    { right: -8, top: 88, size: 28, rot: 20 },
    { right: 92, top: -14, size: 24, rot: -22 },
  ];
  return (
    <>
      {positions.map((p, i) => songs[i] && (
        <div key={i} style={{ position: 'absolute', right: p.right, top: p.top, transform: `rotate(${p.rot}deg)`, opacity: 0.92, pointerEvents: 'none' }}>
          <SongTile song={songs[i]} size={p.size} />
        </div>
      ))}
    </>
  );
}

function HeroRoundLive({ roundNumber, matchupsTotal, survivorsLabel, onPrimary, floatingSongs }) {
  return (
    <HeroCard variant="purple">
      <Eyebrow color="rgba(255,255,255,0.7)">Round {roundNumber} · Live now</Eyebrow>
      <div style={{ fontFamily: fontDisplay, fontSize: 36, lineHeight: 1.0, marginTop: 10, letterSpacing: -0.4 }}>
        {survivorsLabel}
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
        <span>🗳️ {matchupsTotal} matchup{matchupsTotal === 1 ? '' : 's'}</span><span>·</span><span>~2 min</span>
      </div>
      <div style={{ marginTop: 18 }}>
        <button onClick={onPrimary} style={{
          appearance: 'none', border: 'none', cursor: 'pointer', width: '100%',
          padding: '14px 18px', borderRadius: 14, background: '#fff', color: PURPLE_DEEP,
          fontFamily: fontUI, fontWeight: 800, fontSize: 16, boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        }}>Start Round {roundNumber} →</button>
      </div>
      <FloatingTiles songs={floatingSongs} />
    </HeroCard>
  );
}

function HeroWaiting({ countdown, nextDropLabel }) {
  return (
    <HeroCard variant="waiting">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fff', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔒</div>
        <Eyebrow color={PURPLE_DEEP}>You’re in</Eyebrow>
      </div>
      <div style={{ fontFamily: fontDisplay, fontSize: 32, lineHeight: 1.05, marginTop: 14, letterSpacing: -0.3, color: PURPLE_DEEP }}>
        Locked in. Results<br />drop {nextDropLabel}.
      </div>
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <CountdownChunk v={pad2(countdown.days)} l="days" /><Colon />
        <CountdownChunk v={pad2(countdown.hrs)} l="hrs" /><Colon />
        <CountdownChunk v={pad2(countdown.min)} l="min" />
      </div>
      <div style={{ marginTop: 16, fontSize: 13, color: '#7c3aedaa', lineHeight: 1.5 }}>
        We’ll ping you when results are ready. While you wait —
      </div>
    </HeroCard>
  );
}

function HeroResultsReady({ roundNumber, liveCount, nextRoundMatchups, dropLabel, onPrimary }) {
  return (
    <HeroCard variant="arena">
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 100% at 50% 0%, rgba(212,175,55,0.22), transparent 70%)', pointerEvents: 'none' }} />
      <Eyebrow color={GOLD_LT}>{dropLabel}</Eyebrow>
      <div style={{ fontFamily: fontDisplay, fontSize: 38, lineHeight: 1.0, marginTop: 10, letterSpacing: -0.4 }}>
        Round {roundNumber}<br />results are in.
      </div>
      <div style={{ marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
        See how you stacked up with <b style={{ color: GOLD_LT }}>{liveCount.toLocaleString()}</b> other Swifties — matchup by matchup.
      </div>
      <div style={{ marginTop: 20 }}>
        <button onClick={onPrimary} style={{
          appearance: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: '18px 28px', borderRadius: 999,
          background: `linear-gradient(180deg, ${GOLD_LT} 0%, ${GOLD} 100%)`, color: '#2a1d00', fontFamily: fontUI, fontWeight: 700, fontSize: 17,
          boxShadow: '0 8px 22px rgba(212,175,55,0.35), 0 2px 6px rgba(0,0,0,0.25)',
        }}>👀 Reveal Round {roundNumber} →</button>
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
        <span>then vote round {roundNumber + 1} · {nextRoundMatchups} matchup{nextRoundMatchups === 1 ? '' : 's'}</span>
      </div>
    </HeroCard>
  );
}

function HeroUrgent({ roundNumber, hoursLeft, matchupsVoted, matchupsTotal, onPrimary }) {
  const left = matchupsTotal - matchupsVoted;
  const pct = matchupsTotal ? Math.round((matchupsVoted / matchupsTotal) * 100) : 0;
  return (
    <HeroCard variant="urgent">
      <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ display: 'inline-flex', padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: '#fff' }}>
        ⚠️ ROUND {roundNumber} CLOSES SOON
      </div>
      <div style={{ fontFamily: fontDisplay, fontSize: 38, lineHeight: 1.0, marginTop: 14, letterSpacing: -0.4 }}>
        {hoursLeft} hour{hoursLeft === 1 ? '' : 's'} left to<br />lock your picks.
      </div>
      <div style={{ marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.45 }}>
        You’ve voted <b>{matchupsVoted} of {matchupsTotal}</b>. Get them in before the round closes or your votes won’t count toward the crowd.
      </div>
      <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#fff' }} />
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={onPrimary} style={{
          appearance: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: '14px 18px', borderRadius: 14,
          background: '#fff', color: '#c2410c', fontFamily: fontUI, fontWeight: 800, fontSize: 16, boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
        }}>Finish my picks → {left} left</button>
      </div>
    </HeroCard>
  );
}

function HeroFinale({ weekNumber, champion, championPct, runnerUpName, runnerUpPct, onPrimary, onShare }) {
  const champEra = getEra(champion.albumId);
  return (
    <HeroCard variant="finale">
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 60% at 50% 25%, rgba(212,175,55,0.28), transparent 70%), radial-gradient(40% 30% at 50% 0%, rgba(245,217,122,0.5), transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 22 }).map((_, i) => {
          const x = (i * 37) % 100, y = (i * 53) % 80;
          const palette = ['#f5d97a', '#a855f7', '#fff', '#fb923c', '#ec4899'];
          return <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${5 + y}%`, width: 6, height: 6, borderRadius: 1, background: palette[i % palette.length], transform: `rotate(${i * 23}deg)`, opacity: 0.7 }} />;
        })}
      </div>
      <div style={{ position: 'relative' }}>
        <Eyebrow color={GOLD_LT}>Sunday · Week {weekNumber} Champion</Eyebrow>
        <div style={{ fontFamily: fontDisplay, fontSize: 36, lineHeight: 1.0, marginTop: 10, letterSpacing: -0.4 }}>
          👑 “{champion.name}”<br />
          <span style={{ color: GOLD_LT, fontStyle: 'italic' }}>takes the crown.</span>
        </div>
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <SongTile song={champion} size={48} glow />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: fontUI, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{champion.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3, marginTop: 2 }}>
              {champEra.name} · won with {championPct}% in the Final
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button onClick={onPrimary} style={{ flex: 1, appearance: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px', borderRadius: 12, background: `linear-gradient(180deg, ${GOLD_LT}, ${GOLD})`, color: '#2a1d00', fontFamily: fontUI, fontWeight: 800, fontSize: 14 }}>See the bracket</button>
          <button onClick={onShare} style={{ flex: 1, appearance: 'none', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: fontUI, fontWeight: 700, fontSize: 14 }}>Share 🔗</button>
        </div>
      </div>
    </HeroCard>
  );
}

function ScheduleStrip({ activeDay, categoryName }) {
  const days = [
    { d: 'M', label: 'R1 vote' }, { d: 'T', label: '' }, { d: 'W', label: 'R1 → R2' },
    { d: 'T', label: '' }, { d: 'F', label: 'R2 → R3' }, { d: 'S', label: 'R3 → Final' }, { d: 'S', label: '👑' },
  ];
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '12px 14px', boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 6px 18px rgba(124,58,237,0.06)', border: '1px solid rgba(168,85,247,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE_DEEP, letterSpacing: 1.2, textTransform: 'uppercase' }}>This week</div>
        <div style={{ fontSize: 11, color: '#9333ea99', fontWeight: 600 }}>{categoryName}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
        {days.map((day, i) => {
          const active = i === activeDay, past = i < activeDay;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? PURPLE_DEEP : past ? PURPLE_MD : '#f5f3ff',
                color: active ? '#fff' : past ? PURPLE_DEEP : '#9ca0b8',
                fontFamily: fontUI, fontSize: 12, fontWeight: 800, boxShadow: active ? `0 4px 10px ${PURPLE_DEEP}55` : 'none',
              }}>{day.d}</div>
              <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.4, color: active ? PURPLE_DEEP : past ? '#a78bd8' : '#c4c4d3', height: 10, textAlign: 'center' }}>{day.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatChips({ streakWeeks, liveCount }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ flex: 1, padding: '12px 14px', borderRadius: 16, background: '#fff', border: '1px solid rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 22 }}>🔥</div>
        <div>
          <div style={{ fontFamily: fontUI, fontSize: 18, fontWeight: 800, color: PURPLE_DEEP, lineHeight: 1 }}>{streakWeeks} wk{streakWeeks === 1 ? '' : 's'}</div>
          <div style={{ fontSize: 10, color: '#9ca0b8', fontWeight: 600, marginTop: 2, letterSpacing: 0.3 }}>streak</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '12px 14px', borderRadius: 16, background: '#fff', border: '1px solid rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: '#22c55e', boxShadow: '0 0 6px #22c55e88' }} />
        <div>
          <div style={{ fontFamily: fontUI, fontSize: 18, fontWeight: 800, color: PURPLE_DEEP, lineHeight: 1 }}>{liveCount.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: '#9ca0b8', fontWeight: 600, marginTop: 2, letterSpacing: 0.3 }}>Swifties voted</div>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyHome({
  heroState = 'roundLive',
  categoryName = 'Best Bridge',
  weekNumber = 14,
  activeDay = 0,
  roundNumber = 1,
  matchupsTotal = 8,
  matchupsVoted = 0,
  nextRoundMatchups = 4,
  survivorsLabel = 'The bracket is\nlive — your\npicks please.',
  countdown = { days: 1, hrs: 8, min: 42 },
  nextDropLabel = 'Wednesday',
  resultsDropLabel = 'Wednesday · 7:00 PM',
  hoursLeft = 4,
  liveCount = 12408,
  streakWeeks = 7,
  champion,
  championPct = 61,
  runnerUpName = '',
  floatingSongs = [],
  onPrimary,
  onShare,
  onBack,
  showHeader = true,
}) {
  let hero;
  if (heroState === 'waiting') {
    hero = <HeroWaiting countdown={countdown} nextDropLabel={nextDropLabel} />;
  } else if (heroState === 'resultsReady') {
    hero = <HeroResultsReady roundNumber={roundNumber} liveCount={liveCount} nextRoundMatchups={nextRoundMatchups} dropLabel={resultsDropLabel} onPrimary={onPrimary} />;
  } else if (heroState === 'urgent') {
    hero = <HeroUrgent roundNumber={roundNumber} hoursLeft={hoursLeft} matchupsVoted={matchupsVoted} matchupsTotal={matchupsTotal} onPrimary={onPrimary} />;
  } else if (heroState === 'finale' && champion) {
    hero = <HeroFinale weekNumber={weekNumber} champion={champion} championPct={championPct} runnerUpName={runnerUpName} onPrimary={onPrimary} onShare={onShare} />;
  } else {
    hero = <HeroRoundLive roundNumber={roundNumber} matchupsTotal={matchupsTotal} survivorsLabel={survivorsLabel} onPrimary={onPrimary} floatingSongs={floatingSongs} />;
  }

  return (
    <div style={{
      position: 'relative', width: '100%', minHeight: '100%',
      background: 'linear-gradient(180deg, #faf7ff 0%, #f3e8ff 100%)',
      fontFamily: fontUI, overflow: 'hidden',
    }}>
      {showHeader && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '52px 20px 12px' }}>
          {onBack && (
            <button onClick={onBack} aria-label="Back" style={{
              appearance: 'none', cursor: 'pointer', flexShrink: 0,
              width: 34, height: 34, borderRadius: 17,
              background: '#fff', border: '1px solid rgba(124,58,237,0.2)', color: PURPLE_DEEP,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700,
              boxShadow: '0 2px 6px rgba(124,58,237,0.12)',
            }}>‹</button>
          )}
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(150deg, ${PURPLE}, ${PURPLE_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>♪</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, color: PURPLE_DEEP, letterSpacing: -0.3 }}>Eras Ranker</div>
        </div>
      )}
      <div style={{ padding: showHeader ? '0 16px 28px' : '20px 16px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {hero}
        <ScheduleStrip activeDay={activeDay} categoryName={categoryName} />
        <StatChips streakWeeks={streakWeeks} liveCount={liveCount} />
      </div>
    </div>
  );
}
