// TEMPORARY dev-only preview harness for the redesigned weekly bracket.
// Reachable at /weekly-preview (a removable route in App.jsx). Lets us look at
// the new screens with REAL catalog songs before wiring them into the live
// Brackets tab. DELETE this file + its route when Phase A wiring lands.

import { useState, useMemo } from 'react';
import { generateBracket } from '../../../constants/bracketCategories';
import { ARENA_BG, GOLD_LT, fontUI } from './WeeklyParts';
import WeeklyVote from './WeeklyVote';
import WeeklyReveal, { WeeklyRevealHandoff } from './WeeklyReveal';

// A phone-sized stage so the full-bleed screens read like the design canvas.
function Stage({ children }) {
  return (
    <div style={{
      width: 390, height: 844, position: 'relative',
      borderRadius: 28, overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
      border: '8px solid #0a0a14', background: ARENA_BG,
    }}>{children}</div>
  );
}

// Build a deterministic 16-song round-1 set, then craft community results with
// varied winning sides + one rogue user pick so every reveal state shows.
function useSampleRound() {
  return useMemo(() => {
    const generated = generateBracket('most-devastating', 'all', 4242, 16);
    const r1 = generated.rounds[0]; // 8 matchups of { song1, song2 }
    // [song1Pct, winnerIndex, userPickSide] — mix of sides, ~6 matches / 2 rogue
    const recipe = [
      { p: 67, win: 0, pick: 'left'  }, // match
      { p: 41, win: 1, pick: 'right' }, // match (right wins)
      { p: 74, win: 0, pick: 'left'  }, // match
      { p: 38, win: 1, pick: 'left'  }, // ROGUE (right won, picked left)
      { p: 59, win: 0, pick: 'left'  }, // match
      { p: 45, win: 1, pick: 'right' }, // match
      { p: 81, win: 0, pick: 'right' }, // ROGUE (left won, picked right)
      { p: 63, win: 0, pick: 'left'  }, // match
    ];
    const matchups = r1.map((m, i) => {
      const r = recipe[i];
      return {
        song1: m.song1, song2: m.song2,
        song1Pct: r.p, song2Pct: 100 - r.p,
        winnerIndex: r.win,
        userPick: r.pick,
      };
    });
    const winners = matchups.map(m => (m.winnerIndex === 0 ? m.song1 : m.song2));
    const r2pairs = [];
    for (let i = 0; i < winners.length; i += 2) {
      r2pairs.push({ song1: winners[i], song2: winners[i + 1] });
    }
    const matched = matchups.filter(m => (m.winnerIndex === 0 ? 'left' : 'right') === m.userPick).length;
    return { matchups, r2pairs, matched };
  }, []);
}

function VotePreview({ sample }) {
  const [idx, setIdx] = useState(0);
  const m = sample.matchups[idx];
  if (!m) {
    return (
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14, color: '#fff',
        fontFamily: fontUI, textAlign: 'center', padding: 24,
      }}>
        <div style={{ fontSize: 40 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Round complete — all 8 voted.</div>
        <button onClick={() => setIdx(0)} style={{
          marginTop: 8, appearance: 'none', border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer',
          padding: '10px 18px', borderRadius: 999, fontWeight: 700, fontFamily: fontUI,
        }}>Replay voting</button>
      </div>
    );
  }
  return (
    <WeeklyVote
      key={idx}
      leftSong={m.song1} rightSong={m.song2}
      categoryName="Most Devastating Song"
      roundNumber={1}
      matchupIndex={idx}
      totalMatchups={sample.matchups.length}
      liveCount={3914}
      onVote={() => setIdx(i => i + 1)}
      onSkip={() => setIdx(i => i + 1)}
      onClose={() => setIdx(0)}
    />
  );
}

function RevealPreview({ sample }) {
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);
  if (done) {
    return (
      <WeeklyRevealHandoff
        nextRoundNumber={2}
        pairs={sample.r2pairs}
        matched={sample.matched}
        roundMatchupCount={sample.matchups.length}
        footnote="~2 min · drops Friday if you don’t finish"
        onContinue={() => { setDone(false); setRunKey(k => k + 1); }}
      />
    );
  }
  return (
    <WeeklyReveal
      key={runKey}
      matchups={sample.matchups}
      roundNumber={1}
      weekLabel="Most Devastating · Week 73"
      totalVotes={12408}
      onComplete={() => setDone(true)}
      onClose={() => setRunKey(k => k + 1)}
    />
  );
}

export default function WeeklyPreview() {
  const sample = useSampleRound();
  const [screen, setScreen] = useState('reveal'); // 'vote' | 'reveal'

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setScreen(id)} style={{
      appearance: 'none', cursor: 'pointer',
      padding: '8px 16px', borderRadius: 999, fontFamily: fontUI, fontWeight: 700, fontSize: 13,
      border: screen === id ? 'none' : '1px solid rgba(255,255,255,0.2)',
      background: screen === id ? `linear-gradient(180deg, #f5d97a, #d4af37)` : 'rgba(255,255,255,0.06)',
      color: screen === id ? '#2a1d00' : 'rgba(255,255,255,0.8)',
    }}>{label}</button>
  );

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'radial-gradient(ellipse at top, #14142a 0%, #0a0a14 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 12px 48px', boxSizing: 'border-box', gap: 18,
    }}>
      <div style={{ textAlign: 'center', color: '#fff', fontFamily: fontUI }}>
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: GOLD_LT, fontWeight: 800 }}>
          Weekly Bracket · Phase A preview
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          Dev-only · /weekly-preview · not wired into the live tab yet
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <TabBtn id="vote" label="Vote" />
        <TabBtn id="reveal" label="Reveal → Hand-off" />
      </div>
      <Stage>
        {screen === 'vote' ? <VotePreview sample={sample} /> : <RevealPreview sample={sample} />}
      </Stage>
    </div>
  );
}
