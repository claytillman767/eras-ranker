// TEMPORARY dev-only preview harness for the redesigned weekly bracket.
// Reachable at /weekly-preview (a removable route in App.jsx). Lets us look at
// the new screens with REAL catalog songs before wiring them into the live
// Brackets tab. DELETE this file + its route when Phase A wiring lands.

import { useState, useMemo } from 'react';
import { generateBracket } from '../../../constants/bracketCategories';
import { computeCommunityBracket, crowdMatchTier } from '../../../constants/weeklySchedule';
import { ARENA_BG, GOLD_LT, fontUI } from './WeeklyParts';
import WeeklyVote from './WeeklyVote';
import WeeklyReveal, { WeeklyRevealHandoff } from './WeeklyReveal';
import WeeklyHome from './WeeklyHome';
import WeeklyLocked from './WeeklyLocked';
import WeeklyChampion from './WeeklyChampion';

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

function useSampleRound() {
  return useMemo(() => {
    const generated = generateBracket('most-devastating', 'all', 4242, 16);
    const contestants = generated.contestants;
    const r1 = generated.rounds[0]; // 8 matchups of { song1, song2 }

    // Reveal sample — hand-crafted varied winners + 2 rogues so all states show.
    const recipe = [
      { p: 67, win: 0, pick: 'left'  },
      { p: 41, win: 1, pick: 'right' },
      { p: 74, win: 0, pick: 'left'  },
      { p: 38, win: 1, pick: 'left'  }, // rogue
      { p: 59, win: 0, pick: 'left'  },
      { p: 45, win: 1, pick: 'right' },
      { p: 81, win: 0, pick: 'right' }, // rogue
      { p: 63, win: 0, pick: 'left'  },
    ];
    const matchups = r1.map((m, i) => ({
      song1: m.song1, song2: m.song2,
      song1Pct: recipe[i].p, song2Pct: 100 - recipe[i].p,
      winnerIndex: recipe[i].win, userPick: recipe[i].pick,
    }));
    const winners = matchups.map(m => (m.winnerIndex === 0 ? m.song1 : m.song2));
    const r2pairs = [];
    for (let i = 0; i < winners.length; i += 2) r2pairs.push({ song1: winners[i], song2: winners[i + 1] });
    const matched = matchups.filter(m => (m.winnerIndex === 0 ? 'left' : 'right') === m.userPick).length;

    // Champion sample — full resolved community bracket (4 rounds).
    const community = computeCommunityBracket(contestants, 4242);
    const finalM = community.rounds[community.rounds.length - 1][0];
    const championPct = Math.max(finalM.song1Pct, finalM.song2Pct);

    return { contestants, matchups, r2pairs, matched, community, champion: community.champion, championPct };
  }, []);
}

function VotePreview({ sample }) {
  const [idx, setIdx] = useState(0);
  const m = sample.matchups[idx];
  if (!m) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#fff', fontFamily: fontUI, textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 40 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Round complete — all 8 voted.</div>
        <button onClick={() => setIdx(0)} style={{ marginTop: 8, appearance: 'none', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', padding: '10px 18px', borderRadius: 999, fontWeight: 700, fontFamily: fontUI }}>Replay voting</button>
      </div>
    );
  }
  return (
    <WeeklyVote key={idx} leftSong={m.song1} rightSong={m.song2}
      categoryName="Most Devastating Song" roundNumber={1} matchupIndex={idx}
      totalMatchups={sample.matchups.length} liveCount={3914}
      onVote={() => setIdx(i => i + 1)} onSkip={() => setIdx(i => i + 1)} onClose={() => setIdx(0)} />
  );
}

function RevealPreview({ sample }) {
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);
  if (done) {
    return (
      <WeeklyRevealHandoff nextRoundNumber={2} pairs={sample.r2pairs} matched={sample.matched}
        roundMatchupCount={sample.matchups.length} footnote="~2 min · drops Friday if you don’t finish"
        onContinue={() => { setDone(false); setRunKey(k => k + 1); }} />
    );
  }
  return (
    <WeeklyReveal key={runKey} matchups={sample.matchups} roundNumber={1}
      weekLabel="Most Devastating · Week 73" totalVotes={12408}
      onComplete={() => setDone(true)} onClose={() => setRunKey(k => k + 1)} />
  );
}

const HERO_STATES = ['roundLive', 'waiting', 'resultsReady', 'urgent', 'finale'];
function HomePreview({ sample }) {
  const [hs, setHs] = useState('roundLive');
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', gap: 5, padding: 8, flexWrap: 'wrap', background: 'rgba(10,10,20,0.85)' }}>
        {HERO_STATES.map(s => (
          <button key={s} onClick={() => setHs(s)} style={{ appearance: 'none', cursor: 'pointer', padding: '5px 9px', borderRadius: 8, fontSize: 10, fontWeight: 700, fontFamily: fontUI, border: 'none', background: hs === s ? GOLD_LT : 'rgba(255,255,255,0.1)', color: hs === s ? '#2a1d00' : '#fff' }}>{s}</button>
        ))}
      </div>
      <WeeklyHome
        heroState={hs} categoryName="Most Devastating Song" weekNumber={73} activeDay={hs === 'finale' ? 6 : hs === 'resultsReady' ? 2 : 0}
        roundNumber={hs === 'roundLive' || hs === 'waiting' ? 1 : 2} matchupsTotal={hs === 'urgent' ? 8 : 4} matchupsVoted={3}
        survivorsLabel={'The bracket is\nlive — your\npicks please.'} countdown={{ days: 1, hrs: 8, min: 42 }}
        liveCount={12408} streakWeeks={7} champion={sample.champion} championPct={sample.championPct}
        floatingSongs={sample.contestants.slice(0, 4)} onPrimary={() => {}} onShare={() => {}} />
    </div>
  );
}

function LockedPreview() {
  return <WeeklyLocked categoryName="Most Devastating Song" weekNumber={73} countdown={{ days: 1, hrs: 8, min: 42 }} nextDropLabel="Wednesday" onBack={() => {}} onBuildOwn={() => {}} onShare={() => {}} />;
}

function ChampionPreview({ sample }) {
  const [runKey, setRunKey] = useState(0);
  return (
    <WeeklyChampion key={runKey} weekNumber={73} categoryName="Most Devastating Song"
      rounds={sample.community.rounds}
      crowdMatch={{ pct: 87, tier: crowdMatchTier(87), matched: 13, total: 15 }} streakWeeks={8}
      onClose={() => setRunKey(k => k + 1)} onSeeBracket={() => {}} onShare={() => {}} />
  );
}

const SCREENS = [
  { id: 'vote', label: 'Vote' },
  { id: 'reveal', label: 'Reveal → Hand-off' },
  { id: 'home', label: 'Home' },
  { id: 'locked', label: 'Locked' },
  { id: 'champion', label: 'Champion' },
];

export default function WeeklyPreview() {
  const sample = useSampleRound();
  const [screen, setScreen] = useState('reveal');

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'radial-gradient(ellipse at top, #14142a 0%, #0a0a14 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 12px 48px', boxSizing: 'border-box', gap: 18,
    }}>
      <div style={{ textAlign: 'center', color: '#fff', fontFamily: fontUI }}>
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: GOLD_LT, fontWeight: 800 }}>Weekly Bracket · Phase A preview</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Dev-only · /weekly-preview · not wired into the live tab yet</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 420 }}>
        {SCREENS.map(s => (
          <button key={s.id} onClick={() => setScreen(s.id)} style={{
            appearance: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 999, fontFamily: fontUI, fontWeight: 700, fontSize: 13,
            border: screen === s.id ? 'none' : '1px solid rgba(255,255,255,0.2)',
            background: screen === s.id ? 'linear-gradient(180deg, #f5d97a, #d4af37)' : 'rgba(255,255,255,0.06)',
            color: screen === s.id ? '#2a1d00' : 'rgba(255,255,255,0.8)',
          }}>{s.label}</button>
        ))}
      </div>
      <Stage>
        {screen === 'vote' && <VotePreview sample={sample} />}
        {screen === 'reveal' && <RevealPreview sample={sample} />}
        {screen === 'home' && <HomePreview sample={sample} />}
        {screen === 'locked' && <LockedPreview />}
        {screen === 'champion' && <ChampionPreview sample={sample} />}
      </Stage>
    </div>
  );
}
