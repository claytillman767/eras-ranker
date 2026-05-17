import { useState, useEffect } from 'react';
import { useBrackets } from '../../hooks/useBrackets';
import { getCurrentWeekNumber, getWeeklyCategoryName, BRACKET_CATEGORIES } from '../../constants/bracketCategories';
import Landing from './Landing';
import Tree from './Tree';
import Matchup from './Matchup';
import RoundTransition from './RoundTransition';
import BracketResults from './BracketResults';
import WinnerReveal from './WinnerReveal';
import DailyMatchup from './DailyMatchup';
import BracketBuilder from './BracketBuilder';

export default function Brackets({ user, isPro }) {
  const {
    brackets, createBracket, recordWinner, getBracket,
    weeklyState, recordWeeklyVote,
    dailyState, recordDailyVote,
  } = useBrackets(user);

  // Screens: 'landing' | 'builder' | 'tree' | 'matchup' | 'transition' | 'results' | 'reveal' | 'daily'
  const [screen, setScreen] = useState('landing');
  const [activeBracketId, setActiveBracketId] = useState(null);
  const [activeMode, setActiveMode] = useState(null); // 'personal' | 'weekly'
  const [transitionRound, setTransitionRound] = useState(null);

  const weekNumber = getCurrentWeekNumber();
  const weeklyCategoryName = getWeeklyCategoryName(weekNumber);
  const personalInProgress = brackets.find(b => b.status === 'in-progress') || null;
  const recentlyCrowned = brackets.filter(b => b.status === 'complete').slice(-5).reverse();

  const isWeekly = activeMode === 'weekly';
  const activeBracket = isWeekly
    ? weeklyState
    : (activeBracketId ? getBracket(activeBracketId) : null);

  const weekLabel = isWeekly
    ? `${weeklyCategoryName} · Wk ${weekNumber + 1}`
    : (activeBracket
        ? (BRACKET_CATEGORIES.find(c => c.id === activeBracket.categoryId)?.name || 'Bracket')
        : '');

  // Auto-route off the matchup screen when the active bracket completes.
  useEffect(() => {
    if (screen !== 'matchup' || !activeBracket) return;
    if (activeBracket.status === 'complete') {
      setScreen(isWeekly ? 'reveal' : 'results');
    }
  }, [activeBracket?.status, screen, isWeekly]);

  function backToLanding() {
    setActiveBracketId(null);
    setActiveMode(null);
    setScreen('landing');
  }

  function openWeekly() {
    if (!weeklyState) return;
    if (weeklyState.status === 'complete') { setScreen('reveal'); return; }
    setActiveMode('weekly');
    setScreen('tree');
  }

  function continuePersonal() {
    if (!personalInProgress) return;
    setActiveBracketId(personalInProgress.id);
    setActiveMode('personal');
    setScreen(personalInProgress.status === 'complete' ? 'results' : 'matchup');
  }

  // Open the BracketBuilder picker (category → scope → size).
  function buildPersonal() {
    setScreen('builder');
  }

  // Called when the builder confirms — actually creates the bracket and
  // routes into the matchup flow.
  function handleBuilderStart(categoryId, scope, size) {
    const id = createBracket(categoryId, scope, size);
    if (id) {
      setActiveBracketId(id);
      setActiveMode('personal');
      setScreen('matchup');
    }
  }

  function openCrowned(bracketId) {
    setActiveBracketId(bracketId);
    setActiveMode('personal');
    setScreen('results');
  }

  function handleVote(winnerSong) {
    if (!activeBracket) return;
    if (isWeekly) {
      recordWeeklyVote(activeBracket.currentRound, activeBracket.currentMatchupIndex, winnerSong);
    } else {
      const ri = activeBracket.currentRound;
      const mi = activeBracket.currentMatchupIndex;
      recordWinner(activeBracket.id, ri, mi, winnerSong);
      // Synchronously check the about-to-be-updated state for round transition.
      const completed = activeBracket.rounds[ri];
      const wasLastInRound = mi === completed.length - 1;
      const isFinal = completed.length === 1;
      if (wasLastInRound && !isFinal) {
        setTransitionRound(ri);
        setScreen('transition');
      }
    }
  }

  // ── Routes ─────────────────────────────────────────────────────────────────

  if (screen === 'builder') {
    return (
      <BracketBuilder
        onClose={backToLanding}
        onStart={handleBuilderStart}
      />
    );
  }

  if (screen === 'matchup' && activeBracket) {
    const round = activeBracket.rounds[activeBracket.currentRound];
    const matchup = round?.[activeBracket.currentMatchupIndex];
    if (matchup?.song1 && matchup?.song2) {
      const totalRounds = Math.log2(activeBracket.contestants.length);
      return (
        <Matchup
          song1={matchup.song1}
          song2={matchup.song2}
          categoryId={activeBracket.categoryId || 'most-devastating'}
          weekLabel={weekLabel}
          roundIndex={activeBracket.currentRound}
          totalRounds={totalRounds}
          matchupIndex={activeBracket.currentMatchupIndex}
          matchupsInRound={round.length}
          onVote={handleVote}
          onClose={() => setScreen('tree')}
          onSeeBracket={() => setScreen('tree')}
        />
      );
    }
    // No current matchup (bracket just ran out of songs) — let the effect route.
    return null;
  }

  if (screen === 'tree' && activeBracket) {
    return (
      <Tree
        bracket={activeBracket}
        weekLabel={weekLabel}
        onClose={backToLanding}
        onOpenMatchup={() => setScreen('matchup')}
      />
    );
  }

  if (screen === 'transition' && activeBracket && transitionRound !== null) {
    return (
      <RoundTransition
        bracket={activeBracket}
        completedRoundIndex={transitionRound}
        onContinue={() => { setTransitionRound(null); setScreen('matchup'); }}
      />
    );
  }

  if (screen === 'results' && activeBracket) {
    return (
      <BracketResults
        bracket={activeBracket}
        onTryAnother={backToLanding}
        onClose={backToLanding}
      />
    );
  }

  if (screen === 'reveal') {
    return <WinnerReveal weeklyState={weeklyState} onClose={backToLanding} />;
  }

  if (screen === 'daily' && dailyState) {
    return (
      <DailyMatchup
        dailyState={dailyState}
        onVote={recordDailyVote}
        onClose={() => setScreen('landing')}
        onKeepGoing={() => { setScreen('landing'); buildPersonal(); }}
      />
    );
  }

  // Default: Landing
  return (
    <Landing
      weekNumber={weekNumber}
      weeklyState={weeklyState}
      weeklyCategoryName={weeklyCategoryName}
      dailyState={dailyState}
      personalInProgress={personalInProgress}
      recentlyCrowned={recentlyCrowned}
      onOpenWeekly={openWeekly}
      onContinuePersonal={continuePersonal}
      onBuildPersonal={buildPersonal}
      onOpenDaily={() => setScreen('daily')}
      onOpenCrowned={openCrowned}
    />
  );
}
