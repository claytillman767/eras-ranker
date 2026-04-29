import { useState } from 'react';
import { useBrackets } from '../../hooks/useBrackets';
import BracketHome from './BracketHome';
import MatchupScreen from './MatchupScreen';
import RoundTransition from './RoundTransition';
import BracketResults from './BracketResults';
import WeeklyBracket from './WeeklyBracket';
import WinnerReveal from './WinnerReveal';
import DailyMatchup from './DailyMatchup';

export default function Brackets({ user, spotify, isPro }) {
  const {
    brackets,
    createBracket,
    recordWinner,
    deleteBracket,
    getBracket,
    weekNumber,
    weeklyState,
    recordWeeklyVote,
    dailyState,
    recordDailyVote,
  } = useBrackets(user);

  const [screen, setScreen] = useState('home');
  const [activeBracketId, setActiveBracketId] = useState(null);
  const [transitionRound, setTransitionRound] = useState(null);
  const [dailyOpen, setDailyOpen] = useState(false);

  function handleStartBracket(categoryId) {
    const id = createBracket(categoryId, 'all');
    if (id) {
      setActiveBracketId(id);
      setScreen('matchup');
    }
  }

  function handleContinueBracket(bracketId) {
    const b = getBracket(bracketId);
    if (!b) return;
    setActiveBracketId(bracketId);
    setScreen(b.status === 'complete' ? 'results' : 'matchup');
  }

  function handleOpenWeekly() {
    if (!weeklyState) return;
    setScreen(weeklyState.status === 'complete' ? 'reveal' : 'weekly');
  }

  function handleOpenResults(bracketId) {
    setActiveBracketId(bracketId);
    setScreen('results');
  }

  function handleMatchupPick(roundIndex, matchupIndex, winner) {
    if (!activeBracketId) return;
    recordWinner(activeBracketId, roundIndex, matchupIndex, winner);

    const updated = getBracket(activeBracketId);
    if (!updated) return;

    const completedRound = updated.rounds[roundIndex];
    const allDone = completedRound && completedRound.every(m => m.winner !== null);
    const isFinal = completedRound && completedRound.length === 1;

    if (updated.status === 'complete') {
      setScreen('results');
    } else if (allDone && !isFinal) {
      setTransitionRound(roundIndex);
      setScreen('transition');
    }
  }

  function handleWeeklyVote(roundIndex, matchupIndex, winner) {
    recordWeeklyVote(roundIndex, matchupIndex, winner);
    if (weeklyState && weeklyState.status === 'complete') {
      setTimeout(() => setScreen('reveal'), 800);
    }
  }

  const activeBracket = activeBracketId ? getBracket(activeBracketId) : null;

  // ── Screens ──────────────────────────────────────────────────────────────────

  if (screen === 'matchup' && activeBracket) {
    return (
      <MatchupScreen
        bracket={activeBracket}
        categoryId={activeBracket.categoryId}
        onPick={handleMatchupPick}
        onBack={() => setScreen('home')}
        onExit={() => setScreen('home')}
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
        onTryAnother={() => setScreen('home')}
        onClose={() => setScreen('home')}
      />
    );
  }

  if (screen === 'weekly' && weeklyState) {
    return (
      <WeeklyBracket
        weeklyState={weeklyState}
        onVote={handleWeeklyVote}
        onClose={() => setScreen('home')}
      />
    );
  }

  if (screen === 'reveal') {
    return (
      <WinnerReveal
        weeklyState={weeklyState}
        onClose={() => setScreen('home')}
      />
    );
  }

  // ── Home (default) ───────────────────────────────────────────────────────────
  return (
    <div>
      {dailyState && !dailyState.done && (
        <div style={{ marginBottom: 16 }}>
          {dailyOpen ? (
            <DailyMatchup
              dailyState={dailyState}
              onVote={recordDailyVote}
              onClose={() => setDailyOpen(false)}
              onKeepGoing={() => { setDailyOpen(false); handleStartBracket('most-devastating'); }}
              spotify={isPro ? spotify : null}
            />
          ) : (
            <div
              onClick={() => setDailyOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: '1.5px solid rgba(212,175,55,0.4)',
                borderRadius: 14,
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 24 }}>☀️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>Daily Matchup</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Quick vote · 3 matchups · Tap to play</div>
              </div>
              <div style={{ fontSize: 20, color: '#64748b' }}>›</div>
            </div>
          )}
        </div>
      )}

      <BracketHome
        brackets={brackets}
        onStartBracket={handleStartBracket}
        onContinueBracket={handleContinueBracket}
        onOpenWeekly={handleOpenWeekly}
        onOpenResults={handleOpenResults}
      />
    </div>
  );
}
