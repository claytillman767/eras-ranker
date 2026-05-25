import { useState, useEffect } from 'react';
import { useBrackets } from '../../hooks/useBrackets';
import { getCurrentWeekNumber, getWeeklyCategoryName, BRACKET_CATEGORIES } from '../../constants/bracketCategories';
import { SignInRequiredStep } from '../Settings';
import Landing from './Landing';
import Tree from './Tree';
import Matchup from './Matchup';
import RoundTransition from './RoundTransition';
import BracketResults from './BracketResults';
import WinnerReveal from './WinnerReveal';
import DailyMatchup from './DailyMatchup';
import BracketBuilder from './BracketBuilder';

export default function Brackets({ user, isPro, unlockPro, signIn }) {
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
  // Building your OWN bracket is part of the one-time unlock. Community
  // weekly + daily brackets stay free (they feed the engagement flywheel).
  function buildPersonal() {
    if (!isPro) { setScreen('locked'); return; }
    setScreen('builder');
  }

  // Called when the builder confirms — actually creates the bracket and
  // routes into the matchup flow.
  function handleBuilderStart(categoryId, scope, size) {
    if (!isPro) { setScreen('locked'); return; }
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

  if (screen === 'locked') {
    return (
      <BracketLocked
        onClose={backToLanding}
        user={user}
        signIn={signIn}
        unlockPro={unlockPro}
      />
    );
  }

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

// Shown when a non-unlocked user tries to BUILD their own bracket.
// Community weekly + daily brackets are never gated — only the
// build-your-own flow lives behind the one-time unlock.
//
// Mirrors PaywallCard's pattern: the primary CTA is always tappable.
// When no user is signed in, tapping it swaps the screen to a
// SignInRequiredStep instead of gating up-front, so the user can
// commit to the unlock before discovering they need to sign in.
function BracketLocked({ onClose, user, signIn, unlockPro }) {
  const [step, setStep] = useState('features');

  const perks = [
    { label: '8 extra rating categories', desc: 'Hook, Vocals, Cry Factor, and more' },
    { label: 'Custom categories',         desc: 'Add your own scoring dimensions' },
    { label: 'Custom brackets',           desc: 'Build your own song tournaments' },
  ];

  function handleUnlock() {
    if (!user) {
      setStep('signin');
      return;
    }
    unlockPro();
  }

  return (
    <>
      <style>{`
        @keyframes bracket-locked-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bracket-locked-cta {
          transition: transform 100ms ease-out, box-shadow 150ms ease-out;
        }
        .bracket-locked-cta:active { transform: scale(0.97); }
      `}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 28px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflowY: 'auto',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 360,
          animation: 'bracket-locked-fade-in 0.3s ease-out',
        }}>
          {step === 'features' ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {/* Branded icon tile (SVG, not emoji) */}
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.25)',
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>

              {/* Title */}
              <div style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 8,
                textAlign: 'center',
              }}>
                Build your own brackets
              </div>

              {/* Subhead */}
              <div style={{
                fontSize: 14,
                color: 'var(--text-2)',
                lineHeight: 1.5,
                textAlign: 'center',
                marginBottom: 20,
              }}>
                Make a custom tournament from any songs you like.
                A one-time $3.99 unlock — yours forever, no subscription.
              </div>

              {/* Perks */}
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                width: '100%',
              }}>
                {perks.map(perk => (
                  <li key={perk.label} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      background: 'var(--accent-soft)',
                      color: 'var(--brand-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 1,
                    }}>✓</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>{perk.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{perk.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Primary CTA */}
              <button
                onClick={handleUnlock}
                className="bracket-locked-cta"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 0',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  marginBottom: 10,
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)',
                }}
              >
                Unlock — $3.99 one time
              </button>

              {/* Secondary action — Back demoted to a text link */}
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px 16px',
                  color: 'var(--text-2)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                Maybe later
              </button>

              {/* Reassurance footer */}
              <div style={{
                fontSize: 12,
                color: 'var(--text-3)',
                marginTop: 16,
                textAlign: 'center',
                lineHeight: 1.5,
              }}>
                Weekly community bracket and daily matchup<br />
                stay free, always.
              </div>
            </div>
          ) : (
            <SignInRequiredStep
              onBack={() => setStep('features')}
              signIn={signIn}
            />
          )}
        </div>
      </div>
    </>
  );
}
