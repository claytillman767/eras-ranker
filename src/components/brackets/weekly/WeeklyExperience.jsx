// Weekly bracket — the live experience controller (Option A, paced multi-day).
// Full-screen overlay launched from the bracket Landing. Orchestrates the five
// redesigned screens against the schedule:
//
//   Home (hero) → Vote (open round) → Locked (you're in) → … Reveal (closed
//   round, matchup-by-matchup) → Hand-off → next round → … → Champion (Sunday).
//
// The community's survivors are DETERMINISTIC (computeCommunityBracket from the
// week seed) — votes don't change who advances; they only feed the user's
// personal pick ledger and Crowd Match. Round gating comes from weeklySchedule.
//
// Phase-A simplification: a user who skipped an open round just sees that
// round's community results (no "YOUR PICK" highlight) when it's revealed — we
// don't yet offer an interactive "vote a closed round for the record" catch-up
// (brief §7). The core loop (vote open round → reveal → next) is fully wired.

import { useMemo, useState, useEffect } from 'react';
import {
  computeCommunityBracket, crowdMatch, crowdMatchTier, songId,
  currentRoundIndex, isRoundOpen, isChampionRevealed, nextDrop,
  roundUnlockMs, championRevealMs, ROUND_UNLOCK_DAY, CHAMPION_DAY, TOTAL_ROUNDS, dayOffset,
} from '../../../constants/weeklySchedule';
import { getNow, subscribeDevClock } from '../../../constants/devClock';
import { ARENA_BG } from './WeeklyParts';
import WeeklyHome, { weeklyHeroState } from './WeeklyHome';
import WeeklyVote from './WeeklyVote';
import WeeklyReveal, { WeeklyRevealHandoff } from './WeeklyReveal';
import WeeklyLocked from './WeeklyLocked';
import WeeklyChampion from './WeeklyChampion';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function breakdown(ms) {
  const t = Math.max(0, ms);
  return { days: Math.floor(t / 86400000), hrs: Math.floor((t % 86400000) / 3600000), min: Math.floor((t % 3600000) / 60000) };
}
// Deterministic-but-alive participant count (no backend tally yet — Phase B).
function fakeLive(wk) {
  return (wk * 312 + Math.floor(Date.now() / 3600000) * 7) % 9000 + 4200;
}
const ROUND_LIVE_LABELS = [
  'Round 1 is live —\nvote your\nfavorites.',
  'Down to the\nelite 8 — your\npicks please.',
  'The final four.\nWho makes the\nfinal?',
  'The final two.\nOne deciding\nvote.',
];

export default function WeeklyExperience({
  weeklyState, recordWeeklyVote, markWeeklyRevealSeen,
  onClose, onBuildOwn,
}) {
  const [screen, setScreen] = useState('home'); // home | vote | reveal | locked | champion
  const [voteIdx, setVoteIdx] = useState(0);
  const [revealRound, setRevealRound] = useState(0);
  const [revealDone, setRevealDone] = useState(false);
  const [nowTick, setNowTick] = useState(getNow());

  // Tick once a minute so countdowns + round unlocks update live without churn,
  // and update immediately when the admin time-travel panel changes the clock.
  useEffect(() => {
    const tick = () => setNowTick(getNow());
    const id = setInterval(tick, 30000);
    const unsub = subscribeDevClock(tick);
    return () => { clearInterval(id); unsub(); };
  }, []);

  const wk = weeklyState?.weekNumber ?? 0;
  const community = useMemo(
    () => (weeklyState ? computeCommunityBracket(weeklyState.contestants, weeklyState.seed) : null),
    [weeklyState]
  );

  if (!weeklyState || !community) return null;

  const now = nowTick;
  const personalVotes = weeklyState.personalVotes || {};
  const revealsSeen = weeklyState.revealsSeen || {};
  const rounds = community.rounds;
  const curRound = Math.min(currentRoundIndex(now, wk), TOTAL_ROUNDS - 1);
  const over = isChampionRevealed(now, wk);
  const categoryName = weeklyState.categoryName;
  const weekLabel = `${categoryName} · Week ${wk + 1}`;

  const votedCount = (r) => Object.keys(personalVotes).filter(k => k.startsWith(`${r}_`)).length;
  const votedAll = (r) => votedCount(r) >= (rounds[r]?.length || 0);
  const matchedInRound = (r) => (rounds[r] || []).reduce((n, m, mi) => {
    const pick = personalVotes[`${r}_${mi}`];
    return n + (pick && pick === songId(m.winner) ? 1 : 0);
  }, 0);

  // First closed round (0..curRound-1) whose reveal hasn't been watched.
  let pendingReveal = null;
  for (let r = 0; r < curRound; r++) {
    if (!revealsSeen[r]) { pendingReveal = r; break; }
  }

  const roundCloseMs = curRound + 1 < TOTAL_ROUNDS ? roundUnlockMs(wk, curRound + 1) : championRevealMs(wk);
  const hoursLeft = Math.max(0, Math.floor((roundCloseMs - now) / 3600000));
  const open = isRoundOpen(curRound, now, wk);
  const behind = open && !votedAll(curRound);

  const heroState = weeklyHeroState({
    isOver: over,
    resultsPending: !over && pendingReveal !== null,
    open,
    votedAll: votedAll(curRound),
    behind,
    hoursLeft,
  });

  // ── navigation helpers ──
  function enterVote() {
    const len = rounds[curRound]?.length || 0;
    let first = 0;
    while (first < len && personalVotes[`${curRound}_${first}`]) first++;
    if (first >= len) { setScreen('locked'); return; }
    setVoteIdx(first);
    setScreen('vote');
  }
  function enterReveal(r) {
    setRevealRound(r);
    setRevealDone(false);
    setScreen('reveal');
  }
  function heroPrimary() {
    if (heroState === 'finale') setScreen('champion');
    else if (heroState === 'resultsReady') enterReveal(pendingReveal ?? 0);
    else if (heroState === 'waiting') setScreen('locked');
    else enterVote(); // roundLive | urgent
  }

  // ── HOME ──
  if (screen === 'home') {
    const heroRound = heroState === 'resultsReady' ? (pendingReveal ?? 0) : curRound;
    const champ = community.champion;
    const finalM = rounds[rounds.length - 1]?.[0];
    const championPct = finalM ? Math.max(finalM.song1Pct, finalM.song2Pct) : 0;
    return (
      <Overlay>
        <WeeklyHome
          heroState={heroState}
          categoryName={categoryName}
          weekNumber={wk + 1}
          activeDay={dayOffset(now, wk)}
          roundNumber={heroRound + 1}
          matchupsTotal={rounds[curRound]?.length || 0}
          matchupsVoted={votedCount(curRound)}
          nextRoundMatchups={rounds[heroRound + 1]?.length || 0}
          survivorsLabel={ROUND_LIVE_LABELS[curRound] || ROUND_LIVE_LABELS[0]}
          countdown={breakdown(roundCloseMs - now)}
          nextDropLabel={nextDropDayLabel(now, wk)}
          resultsDropLabel={DAY_NAMES[ROUND_UNLOCK_DAY[curRound]] || 'Today'}
          hoursLeft={hoursLeft}
          liveCount={fakeLive(wk)}
          streakWeeks={0}
          champion={champ}
          championPct={championPct}
          floatingSongs={weeklyState.contestants.slice(0, 4)}
          onPrimary={heroPrimary}
          onShare={() => setScreen('champion')}
          onBack={onClose}
        />
      </Overlay>
    );
  }

  // ── VOTE ──
  if (screen === 'vote') {
    const matchups = rounds[curRound] || [];
    const m = matchups[voteIdx];
    if (!m) { setScreen('home'); return null; }
    return (
      <Overlay>
        <WeeklyVote
          key={`${curRound}_${voteIdx}`}
          leftSong={m.song1} rightSong={m.song2}
          categoryName={categoryName}
          roundNumber={curRound + 1}
          matchupIndex={voteIdx}
          totalMatchups={matchups.length}
          liveCount={fakeLive(wk)}
          onVote={(winner) => {
            recordWeeklyVote(curRound, voteIdx, winner);
            // Find the next still-unvoted matchup (treat the one just cast as voted).
            const voted = new Set(
              Object.keys(personalVotes).filter(k => k.startsWith(`${curRound}_`)).map(k => Number(k.split('_')[1]))
            );
            voted.add(voteIdx);
            let next = null;
            for (let j = 0; j < matchups.length; j++) { if (!voted.has(j)) { next = j; break; } }
            if (next === null) setScreen('locked');
            else setVoteIdx(next);
          }}
          onSkip={() => {
            let next = null;
            for (let j = voteIdx + 1; j < matchups.length; j++) {
              if (!personalVotes[`${curRound}_${j}`]) { next = j; break; }
            }
            if (next === null) setScreen('home');
            else setVoteIdx(next);
          }}
          onClose={() => setScreen('home')}
        />
      </Overlay>
    );
  }

  // ── REVEAL (+ hand-off) ──
  if (screen === 'reveal') {
    const r = revealRound;
    const roundM = rounds[r] || [];
    if (revealDone) {
      const nextPairs = (rounds[r + 1] || []).map(m => ({ song1: m.song1, song2: m.song2 }));
      return (
        <Overlay>
          <WeeklyRevealHandoff
            nextRoundNumber={r + 2}
            pairs={nextPairs}
            matched={matchedInRound(r)}
            roundMatchupCount={roundM.length}
            footnote={`~2 min · drops ${nextDropDayLabel(now, wk)} if you don’t finish`}
            onContinue={() => {
              // Another earlier reveal still pending? show it next.
              let nextPending = null;
              for (let rr = 0; rr < curRound; rr++) {
                if (rr !== r && !revealsSeen[rr]) { nextPending = rr; break; }
              }
              if (nextPending !== null) { enterReveal(nextPending); return; }
              if (isRoundOpen(curRound, now, wk) && !votedAll(curRound)) enterVote();
              else setScreen('home');
            }}
          />
        </Overlay>
      );
    }
    const matchups = roundM.map((m, mi) => {
      const pick = personalVotes[`${r}_${mi}`];
      const userPick = pick === songId(m.song1) ? 'left' : pick === songId(m.song2) ? 'right' : null;
      return { song1: m.song1, song2: m.song2, song1Pct: m.song1Pct, song2Pct: m.song2Pct, winnerIndex: m.winnerIndex, userPick };
    });
    return (
      <Overlay>
        <WeeklyReveal
          key={`reveal_${r}`}
          matchups={matchups}
          roundNumber={r + 1}
          weekLabel={weekLabel}
          totalVotes={fakeLive(wk)}
          onComplete={() => { markWeeklyRevealSeen(r); setRevealDone(true); }}
          onClose={() => { markWeeklyRevealSeen(r); setScreen('home'); }}
        />
      </Overlay>
    );
  }

  // ── LOCKED / waiting ──
  if (screen === 'locked') {
    return (
      <Overlay>
        <WeeklyLocked
          categoryName={categoryName}
          weekNumber={wk + 1}
          countdown={breakdown(roundCloseMs - now)}
          nextDropLabel={nextDropDayLabel(now, wk)}
          showShare={false}
          onBack={() => setScreen('home')}
          onBuildOwn={() => { onClose(); onBuildOwn && onBuildOwn(); }}
        />
      </Overlay>
    );
  }

  // ── CHAMPION ──
  if (screen === 'champion') {
    const cm = crowdMatch(personalVotes, rounds);
    return (
      <Overlay>
        <WeeklyChampion
          weekNumber={wk + 1}
          categoryName={categoryName}
          rounds={rounds}
          crowdMatch={{ pct: cm.pct, tier: crowdMatchTier(cm.pct), matched: cm.matched, total: cm.total }}
          streakWeeks={0}
          onClose={() => setScreen('home')}
          onSeeBracket={() => setScreen('home')}
          onShare={() => {}}
        />
      </Overlay>
    );
  }

  return null;
}

// Day name for the next drop the user is waiting on.
function nextDropDayLabel(now, wk) {
  const nd = nextDrop(now, wk);
  if (!nd) return 'Sunday';
  if (nd.isChampion) return DAY_NAMES[CHAMPION_DAY];
  return DAY_NAMES[ROUND_UNLOCK_DAY[nd.roundIndex]] || 'soon';
}

// Full-screen immersive overlay (covers the app header + tabs, like QuickScore).
function Overlay({ children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: ARENA_BG, overflowY: 'auto' }}>
      {children}
    </div>
  );
}
