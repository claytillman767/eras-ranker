import { useState } from 'react';
import { useBrackets } from '../../hooks/useBrackets';
import BracketHome from './BracketHome';
import MatchupScreen from './MatchupScreen';
import RoundTransition from './RoundTransition';
import BracketResults from './BracketResults';
import WeeklyBracket from './WeeklyBracket';
import WinnerReveal from './WinnerReveal';
import DailyMatchup from './DailyMatchup';

// Screens: 'home' | 'matchup' | 'transition' | 'results' | 'weekly' | 'reveal' | 'daily'

export default function Brackets({ user }) {
  const {
    brackets,
    createBracket,
    recordWinner,
    deleteBracket,
    getBracket,
    weekNumber,
    weeklyState,
    getOrInitWeekly,
    recordWeeklyVote,
    dailyState,
    getOrInitDaily,
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
    if (b.status === 'complete') {
      setActiveBracketId(bracketId);
      setScreen('results');
    } else {
      setActiveBracketId(bracketId);
      setScreen('matchup');
    }
  }

  function handleOpenWeekly() {
    getOrInitWeekly();
    const w = weeklyState;
    // If completed, show reveal; otherwise vote
    if (w && w.status === 'complete') {
      setScreen('reveal');
    } else {
      setScreen('weekly');
    }
  }

  function handleOpenResults(bracketId) {
    setActiveBracketId(bracketId);
    setScreen('results');
  }

  function handleMatchupPick(roundIndex, matchupIndex, winner) {
    if (!activeBracketId) return;
    recordWinner(activeBracketId, roundIndex, matchupIndex, winner);

    // Re-fetch bracket to check new state
    const updated = getBracket(activeBracketId);
    if (!updated) return;

    // Check if we just finished a round (but not the whole bracket)
    const completedRound = updated.rounds[roundIndex];
    const allDone = completedRound && completedRound.every(m => m.winner !== null);
    const isLastMatchup = completedRound && completedRound.length === 1;

    if (updated.status === 'complete') {
      setScreen('results');
    } else if (allDone && !isLastMatchup) {
      setTransitionRound(roundIndex);
      setScreen('transition');
    }
    // otherwise stay on matchup screen — it will auto-advance to next matchup
  }

  function handleTransitionContinue() {
    setTransitionRound(null);
    setScreen('matchup');
  }

  function handleWeeklyVote(roundIndex, matchupIndex, winner) {
    recordWeeklyVote(roundIndex, matchupIndex, winner);
    // Check if the weekly bracket just completed
    const w = weeklyState;
    if (w && w.status === 'complete') {
      setTimeout(() => setScreen('reveal'), 800);
    }
  }

  function handleDailyVote(matchupIndex, winner) {
    recordDailyVote(matchupIndex, winner);
  }

  const activeBracket = activeBracketId ? getBracket(activeBracketId) : null;
  // Get current weekly state (initializing if needed)
  const currentWeekly = weeklyState;

  // ── Render ──────────────────────────────────────────────────────────────────

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
        onContinue={handleTransitionContinue}
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

  if (screen === 'weekly') {
    const w = currentWeekly || getOrInitWeekly();
    return (
      <WeeklyBracket
        weeklyState={w}
        onVote={handleWeeklyVote}
        onClose={() => setScreen('home')}
      />
    );
  }

  if (screen === 'reveal') {
    return (
      <WinnerReveal
        weeklyState={currentWeekly}
        onClose={() => setScreen('home')}
      />
    );
  }

  // ── Home screen (default) ───────────────────────────────────────────────────
  const daily = dailyState || getOrInitDaily();

  return (
    <div>
      {/* Daily matchup floater — shows at top if today's daily not done */}
      {daily && !daily.done && (
        <div style={{ marginBottom: 16 }}>
          {dailyOpen ? (
            <DailyMatchup
              dailyState={daily}
              onVote={handleDailyVote}
              onClose={() => setDailyOpen(false)}
              onKeepGoing={() => {
                setDailyOpen(false);
                handleStartBracket('most-devastating');
              }}
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
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
                  Daily Matchup
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Quick vote — 3 matchups · Tap to play
                </div>
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
