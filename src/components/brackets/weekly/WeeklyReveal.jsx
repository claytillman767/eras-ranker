// Weekly bracket — Results Reveal (the centerpiece).
// Reveals a round's community results matchup-by-matchup with suspense, then
// hands off into the next round. Recreated from
// design_handoff_weekly_bracket/reveal.jsx against the real catalog.
//
// MUST-PRESERVE animation rules (see handoff README §1):
//   • Vote bars fill 1% at a time in discrete integer steps (30ms tick).
//   • In "racing" BOTH bars step together up to the loser's final %.
//   • In "breaking" the loser freezes; only the winner keeps stepping.
//   • VoteBar's width transition is 60ms linear so each 1% tick is visible.
//
// A matchup item: { song1, song2, song1Pct, song2Pct, winnerIndex, userPick }
//   song1/song2 — { name, albumId, songIndex }
//   song1Pct/song2Pct — integers summing to 100 (community split)
//   winnerIndex — 0 (song1/left) or 1 (song2/right) advanced
//   userPick — 'left' | 'right' | null  (what this user voted; null = didn't)

import { useRef, useState, useEffect } from 'react';
import { FeedbackLauncher } from '../../FeedbackButton';
import { getEra } from '../../../constants/eraColors';
import {
  ArenaBg, Eyebrow, SongRow, SongTile, VoteBar,
  GOLD, GOLD_LT, fontUI, fontDisplay,
} from './WeeklyParts';

const TICK_MS = 30;
const HOLD_HIGHLIGHTED = 28; // ~840ms — read your pick
const HOLD_SETTLED     = 70; // ~2.1s  — savor the result
const HOLD_ADVANCING   = 22; // ~660ms — winner slides up, loser fades
const HOLD_INCOMING    = 20; // ~600ms — next matchup slides in

// ── Shared frame chrome ──────────────────────────────────────────────────────
function RevealFrame({ children, matchupIndex, totalMatchups, tally, roundNumber, advancingRibbon, onClose }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onClose} style={{
            appearance: 'none', cursor: 'pointer', color: '#fff',
            width: 36, height: 36, borderRadius: 18,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600,
          }}>×</button>
          <FeedbackLauncher variant="overlay" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Eyebrow color={GOLD_LT}>Round {roundNumber} · Results</Eyebrow>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            Matchup {matchupIndex} of {totalMatchups}
          </div>
        </div>
        <div style={{
          padding: '6px 10px', borderRadius: 999,
          background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
          fontSize: 11, fontWeight: 700, color: GOLD_LT, letterSpacing: 0.4,
          minHeight: 14, opacity: tally ? 1 : 0, transition: 'opacity .3s',
        }}>👑 {tally || '—'}</div>
      </div>

      {advancingRibbon}

      <div style={{ position: 'relative', zIndex: 2, padding: '24px 20px 0', height: 'calc(100% - 130px)' }}>
        {children}
      </div>
    </div>
  );
}

// ── One side of the matchup card ─────────────────────────────────────────────
function MatchupSide({ side, song, userPick, isWinner, settled, pct, advancingOut }) {
  const isUser = userPick === side;
  const era = getEra(song.albumId);
  const loserDim = settled && !isWinner;

  return (
    <div style={{
      position: 'relative',
      background: isUser
        ? `linear-gradient(160deg, ${era.tile}22 0%, rgba(255,255,255,0.04) 80%)`
        : 'rgba(255,255,255,0.04)',
      border: isUser ? `1.5px solid ${era.tile}` : '1px solid rgba(255,255,255,0.08)',
      borderRadius: 18, padding: '14px 16px',
      opacity: advancingOut && !isWinner ? 0 : loserDim ? 0.55 : 1,
      transform: advancingOut
        ? (isWinner ? 'translateY(-32px) scale(0.85)' : 'translateY(36px)')
        : 'translateY(0) scale(1)',
      transition: 'opacity .6s, transform .6s cubic-bezier(.4,0,.2,1), border .4s, background .4s',
      boxShadow: isUser ? `0 0 0 4px ${era.tile}1a, 0 6px 18px ${era.tile}33` : 'none',
    }}>
      <div style={{ position: 'absolute', top: -10, left: 14, display: 'flex', gap: 6 }}>
        {isUser && (
          <div style={{
            padding: '4px 9px', borderRadius: 999,
            background: era.tile, color: era.ink,
            fontSize: 10, fontWeight: 800, letterSpacing: 0.6,
            boxShadow: `0 4px 10px ${era.tile}66`,
          }}>YOUR PICK</div>
        )}
        {isWinner && settled && (
          <div style={{
            padding: '4px 9px', borderRadius: 999,
            background: `linear-gradient(180deg, ${GOLD_LT}, ${GOLD})`,
            color: '#2a1d00', fontSize: 10, fontWeight: 800, letterSpacing: 0.6,
            boxShadow: '0 4px 10px rgba(212,175,55,0.5)',
          }}>👑 ADVANCES</div>
        )}
      </div>

      <SongRow song={song} size="md" />

      {settled && (
        <div style={{
          position: 'absolute', right: 14, top: 14,
          fontFamily: fontDisplay, fontWeight: 400, fontSize: 28,
          color: isWinner ? GOLD_LT : 'rgba(255,255,255,0.5)', lineHeight: 1,
        }}>{pct}%</div>
      )}
    </div>
  );
}

// ── Matchup body — songs + vote bar + feedback badge ─────────────────────────
function RevealMatchup({
  leftSong, rightSong, userPick,
  leftPct, rightPct, winnerSide,
  phase, barLeft, barRight,
  weekLabel, totalVotes,
}) {
  const settled = phase === 'settled' || phase === 'advancing';
  const advancingOut = phase === 'advancing';
  const matched = userPick && userPick === winnerSide;

  const tickerCopy =
    phase === 'highlighted' ? 'tallying…' :
    phase === 'racing'      ? '🏃 neck and neck…' :
    phase === 'breaking'    ? '🔥 someone’s pulling ahead' :
                              `${totalVotes.toLocaleString()} votes`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
        <Eyebrow color="rgba(255,255,255,0.4)">{weekLabel}</Eyebrow>
      </div>

      <MatchupSide side="left" song={leftSong} userPick={userPick}
        isWinner={winnerSide === 'left'} settled={settled} pct={leftPct} advancingOut={advancingOut} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, margin: '-2px 0',
        opacity: advancingOut ? 0 : 1, transition: 'opacity .4s',
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ fontFamily: fontDisplay, fontStyle: 'italic', fontSize: 22, color: GOLD_LT, letterSpacing: 1 }}>vs</div>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
      </div>

      <MatchupSide side="right" song={rightSong} userPick={userPick}
        isWinner={winnerSide === 'right'} settled={settled} pct={rightPct} advancingOut={advancingOut} />

      {/* Community vote bar */}
      <div style={{ marginTop: 16, opacity: advancingOut ? 0 : 1, transition: 'opacity .4s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Eyebrow color="rgba(255,255,255,0.55)">Community Vote</Eyebrow>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{tickerCopy}</div>
        </div>
        <VoteBar
          leftSong={leftSong} rightSong={rightSong}
          leftPct={barLeft} rightPct={barRight}
          settled={settled} leftWon={winnerSide === 'left'}
        />
      </div>

      {/* Crowd-match feedback badge — only if the user voted this matchup */}
      {settled && userPick && (
        <div style={{
          marginTop: 16, display: 'flex', justifyContent: 'center',
          opacity: advancingOut ? 0 : 1, transition: 'opacity .3s',
        }}>
          <div style={{
            padding: '12px 18px', borderRadius: 999,
            background: matched
              ? 'linear-gradient(180deg, rgba(212,175,55,0.22), rgba(212,175,55,0.1))'
              : 'rgba(168,85,247,0.16)',
            border: matched ? `1px solid ${GOLD}66` : '1px solid rgba(168,85,247,0.35)',
            fontSize: 14, fontWeight: 700,
            color: matched ? GOLD_LT : '#d8b4fe',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: matched ? '0 8px 22px rgba(212,175,55,0.22)' : '0 8px 22px rgba(168,85,247,0.2)',
          }}>
            {matched ? '✓ you’re with the crowd' : '👀 you went rogue'}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Advancing ribbon — winner moving up during transition ────────────────────
function AdvancingRibbon({ winnerSong, show }) {
  if (!winnerSong) return null;
  return (
    <div style={{
      position: 'relative', zIndex: 3, padding: '14px 20px 0',
      display: 'flex', justifyContent: 'center',
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(-8px)',
      transition: 'opacity .5s, transform .5s cubic-bezier(.4,0,.2,1)',
      pointerEvents: 'none', height: show ? 'auto' : 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 12px 6px 6px', borderRadius: 999,
        background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)',
        boxShadow: '0 6px 18px rgba(212,175,55,0.18)',
      }}>
        <SongTile song={winnerSong} size={26} />
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_LT, letterSpacing: 0.5 }}>
          {winnerSong.name.toUpperCase()} <span style={{ opacity: 0.6 }}>· ADVANCES</span>
        </div>
      </div>
    </div>
  );
}

// ── LIVE animated reveal — walks the round's matchups once, then onComplete ──
export default function WeeklyReveal({
  matchups = [],
  roundNumber = 1,
  weekLabel = 'Best Bridge · Week 14',
  totalVotes = 12408,
  onComplete,
  onClose,
}) {
  const stateRef = useRef({ mIdx: 0, phase: 'highlighted', barLeft: 0, barRight: 0, held: 0 });
  const completedRef = useRef(false);
  const [, force] = useState(0);

  useEffect(() => {
    if (!matchups.length) {
      if (!completedRef.current) { completedRef.current = true; onComplete && onComplete(); }
      return;
    }
    const id = setInterval(() => {
      const s = stateRef.current;
      const m = matchups[s.mIdx];
      if (!m) return;
      const winnerSide = m.winnerIndex === 0 ? 'left' : 'right';
      const leftPct = m.song1Pct, rightPct = m.song2Pct;
      const loserPct = Math.min(leftPct, rightPct);
      const winnerPct = Math.max(leftPct, rightPct);
      const isLast = s.mIdx >= matchups.length - 1;

      if (s.phase === 'highlighted') {
        s.held++;
        if (s.held >= HOLD_HIGHLIGHTED) { s.phase = 'racing'; s.held = 0; }
      } else if (s.phase === 'racing') {
        if (s.barLeft < loserPct) {
          s.barLeft = Math.min(loserPct, s.barLeft + 1);
          s.barRight = Math.min(loserPct, s.barRight + 1);
        } else {
          s.phase = 'breaking';
        }
      } else if (s.phase === 'breaking') {
        if (winnerSide === 'left' && s.barLeft < winnerPct) {
          s.barLeft = Math.min(winnerPct, s.barLeft + 1);
        } else if (winnerSide === 'right' && s.barRight < winnerPct) {
          s.barRight = Math.min(winnerPct, s.barRight + 1);
        } else {
          s.phase = 'settled'; s.held = 0;
        }
      } else if (s.phase === 'settled') {
        s.held++;
        if (s.held >= HOLD_SETTLED) { s.phase = 'advancing'; s.held = 0; }
      } else if (s.phase === 'advancing') {
        s.held++;
        if (s.held >= HOLD_ADVANCING) {
          if (isLast) {
            clearInterval(id);
            if (!completedRef.current) { completedRef.current = true; onComplete && onComplete(); }
            return;
          }
          s.phase = 'incoming'; s.held = 0;
          s.barLeft = 0; s.barRight = 0;
        }
      } else if (s.phase === 'incoming') {
        s.held++;
        if (s.held >= HOLD_INCOMING) {
          s.phase = 'highlighted'; s.held = 0;
          s.mIdx = s.mIdx + 1;
        }
      }

      force(n => n + 1);
    }, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchups.length]);

  if (!matchups.length) {
    return <RevealFrame roundNumber={roundNumber} matchupIndex={0} totalMatchups={0} tally="" onClose={onClose} />;
  }

  const s = stateRef.current;
  const current = matchups[s.mIdx];
  const next = matchups[s.mIdx + 1];
  const winnerSide = current.winnerIndex === 0 ? 'left' : 'right';
  const winnerSong = winnerSide === 'left' ? current.song1 : current.song2;

  const incoming = s.phase === 'incoming';
  const advancing = s.phase === 'advancing';
  const settledOrLater = ['settled', 'advancing', 'incoming'].includes(s.phase);

  // Running Crowd Match tally over matchups revealed so far (settled counts).
  const revealedCount = settledOrLater ? s.mIdx + 1 : s.mIdx;
  let matched = 0, voted = 0;
  for (let i = 0; i < revealedCount && i < matchups.length; i++) {
    const mm = matchups[i];
    if (!mm.userPick) continue;
    voted++;
    const w = mm.winnerIndex === 0 ? 'left' : 'right';
    if (mm.userPick === w) matched++;
  }
  const tally = voted > 0 ? `${matched} of ${voted} so far` : '';

  const shownIdx = incoming && next ? s.mIdx + 2 : s.mIdx + 1;

  return (
    <RevealFrame
      roundNumber={roundNumber}
      matchupIndex={shownIdx}
      totalMatchups={matchups.length}
      tally={tally}
      onClose={onClose}
      advancingRibbon={<AdvancingRibbon winnerSong={winnerSong} show={advancing} />}
    >
      <div style={{ position: 'relative' }}>
        {!incoming && (
          <RevealMatchup
            leftSong={current.song1} rightSong={current.song2}
            userPick={current.userPick}
            leftPct={current.song1Pct} rightPct={current.song2Pct}
            winnerSide={winnerSide}
            barLeft={s.barLeft} barRight={s.barRight}
            phase={s.phase}
            weekLabel={weekLabel} totalVotes={totalVotes}
          />
        )}
        {incoming && next && (
          <div key={`in-${s.mIdx}`} style={{ animation: 'weeklySlideInRight .6s cubic-bezier(.4,0,.2,1) both' }}>
            <RevealMatchup
              leftSong={next.song1} rightSong={next.song2}
              userPick={next.userPick}
              leftPct={next.song1Pct} rightPct={next.song2Pct}
              winnerSide={next.winnerIndex === 0 ? 'left' : 'right'}
              barLeft={0} barRight={0}
              phase="highlighted"
              weekLabel={weekLabel} totalVotes={totalVotes}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes weeklySlideInRight {
          from { opacity: 0; transform: translateX(40%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </RevealFrame>
  );
}

// ── Hand-off — round complete, hands the user into the next round ────────────
// Shows the next round's survivor pairings + the Crowd Match tally for the
// round just revealed, then a CTA into voting.
function BracketRow({ song }) {
  const era = getEra(song.albumId);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <SongTile song={song} size={28} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: fontUI, fontWeight: 700, fontSize: 13, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: -0.1, lineHeight: 1.15,
        }}>{song.name}</div>
        <div style={{
          fontFamily: fontUI, fontSize: 9.5, fontWeight: 600,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{era.name}</div>
      </div>
    </div>
  );
}

function BracketPairCard({ pair, matchupNum }) {
  return (
    <div style={{
      position: 'relative',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 22, flexShrink: 0,
        fontFamily: fontDisplay, fontSize: 22, color: 'rgba(255,255,255,0.35)',
        textAlign: 'center', lineHeight: 1,
      }}>{matchupNum}</div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <BracketRow song={pair.song1} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 36 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ fontFamily: fontDisplay, fontStyle: 'italic', fontSize: 12, color: 'rgba(245,217,122,0.6)' }}>vs</div>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <BracketRow song={pair.song2} />
      </div>
      <div style={{
        width: 14, height: 56, flexShrink: 0,
        borderTop: '1px solid rgba(212,175,55,0.35)',
        borderRight: '1px solid rgba(212,175,55,0.35)',
        borderBottom: '1px solid rgba(212,175,55,0.35)',
        borderTopRightRadius: 6, borderBottomRightRadius: 6,
      }} />
    </div>
  );
}

export function WeeklyRevealHandoff({
  nextRoundNumber = 2,
  pairs = [],
  matched = 0,
  roundMatchupCount = 8,
  headline,
  ctaLabel,
  footnote,
  onContinue,
}) {
  const survivors = pairs.length * 2;
  const head = headline || `Down to the ${survivors <= 2 ? 'final two' : survivors <= 4 ? 'final 4' : `elite ${survivors}`}.`;
  const cta = ctaLabel || `Vote Round ${nextRoundNumber} → ${pairs.length} matchup${pairs.length === 1 ? '' : 's'}`;
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      color: '#fff', fontFamily: fontUI, overflow: 'hidden',
    }}>
      <ArenaBg />
      <div style={{
        position: 'relative', zIndex: 2, padding: '64px 22px 24px', height: '100%',
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow color={GOLD_LT}>Round {nextRoundNumber - 1} · Complete</Eyebrow>
          <div style={{
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.3)',
            fontSize: 11, fontWeight: 700, color: GOLD_LT, letterSpacing: 0.4,
          }}>👑 {matched} of {roundMatchupCount}</div>
        </div>

        <div style={{ fontFamily: fontDisplay, fontSize: 30, lineHeight: 1.08, marginTop: 12, letterSpacing: -0.4 }}>
          {head}<br />
          <span style={{ color: GOLD_LT, fontStyle: 'italic' }}>Here’s your round {nextRoundNumber}.</span>
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {pairs.map((pair, i) => (
            <BracketPairCard key={i} pair={pair} matchupNum={i + 1} />
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <button onClick={onContinue} style={{
            appearance: 'none', border: 'none', cursor: 'pointer', width: '100%',
            padding: '18px 28px', borderRadius: 999,
            background: `linear-gradient(180deg, ${GOLD_LT} 0%, ${GOLD} 100%)`,
            color: '#2a1d00', fontFamily: fontUI, fontWeight: 700, fontSize: 17, letterSpacing: 0.1,
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 8px 22px rgba(212,175,55,0.35), 0 2px 6px rgba(0,0,0,0.25)',
          }}>{cta}</button>
          {footnote && (
            <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>{footnote}</div>
          )}
        </div>
      </div>
    </div>
  );
}
