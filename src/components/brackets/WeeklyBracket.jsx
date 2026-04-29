import { useState, useEffect } from 'react';
import { getCommunityVotePercent, getCurrentWeekNumber, getWeeklyCategoryName } from '../../constants/bracketCategories';
import MatchupScreen from './MatchupScreen';
import RoundTransition from './RoundTransition';

// WeeklyBracket wraps MatchupScreen with the community flavor:
// — Branded header showing the week + countdown
// — After each vote, shows community agree/disagree percentage
// — Tracks progress across the week's matchups

export default function WeeklyBracket({ weeklyState, onVote, onClose }) {
  const [showTransition, setShowTransition] = useState(false);
  const [transitionRound, setTransitionRound] = useState(null);
  const [lastCommunityPercent, setLastCommunityPercent] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  if (!weeklyState) return null;

  const weekNumber = getCurrentWeekNumber();
  const weeklyName = getWeeklyCategoryName(weekNumber);

  if (weeklyState.status === 'complete') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0f172a',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        maxWidth: 700,
        margin: '0 auto',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗳️</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 8, textAlign: 'center' }}>
          You've voted!
        </div>
        <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32, maxWidth: 280 }}>
          Your votes are in for this week's <strong style={{ color: '#d4af37' }}>{weeklyName}</strong> bracket.
          Check back Sunday for the community results.
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            border: 'none',
            borderRadius: 16,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Back to Brackets
        </button>
      </div>
    );
  }

  // Show round transition between rounds
  if (showTransition && transitionRound !== null) {
    return (
      <RoundTransition
        bracket={weeklyState}
        completedRoundIndex={transitionRound}
        onContinue={() => setShowTransition(false)}
      />
    );
  }

  function handlePick(roundIndex, matchupIndex, winner) {
    // Calculate community percent before recording vote
    const pct = getCommunityVotePercent(weekNumber, matchupIndex, true);
    setLastCommunityPercent(pct);

    onVote(roundIndex, matchupIndex, winner);

    // Check if round just completed
    const round = weeklyState.rounds[roundIndex];
    const allDone = round.every((m, mi) =>
      mi === matchupIndex ? true : m.winner !== null
    );

    if (allDone && round.length > 1) {
      // More rounds ahead — show transition
      setTimeout(() => {
        setTransitionRound(roundIndex);
        setShowTransition(true);
      }, 1200);
    }
  }

  // Vote tally
  const totalVotes = weeklyState.rounds.reduce((s, r) => s + r.length, 0);
  const castVotes = weeklyState.votes.length;

  return (
    <div>
      {/* Weekly header injected above matchup */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 210,
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        borderBottom: '1px solid rgba(212,175,55,0.3)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 700,
        margin: '0 auto',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', letterSpacing: '0.1em' }}>
            WEEK {weekNumber + 1} · COMMUNITY BRACKET
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
            {weeklyName}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {castVotes} / {totalVotes} voted
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer',
          }}>
            Exit ✕
          </button>
        </div>
      </div>

      <div style={{ paddingTop: 60 }}>
        <MatchupScreen
          bracket={weeklyState}
          categoryId="most-devastating"
          onPick={handlePick}
          onBack={onClose}
          onExit={onClose}
          communityPercent={lastCommunityPercent}
          showCommunityFeedback={true}
        />
      </div>
    </div>
  );
}
