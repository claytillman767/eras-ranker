import { useState, useEffect, useRef } from 'react';
import { getEraColors } from '../../constants/eraColors';
import { getCurrentWeekNumber, getWeeklyCategoryName } from '../../constants/bracketCategories';
import { ALBUMS } from '../../data/albums';

const REVEAL_STYLE = `
@keyframes spotlight {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes letter-pop {
  0% { opacity: 0; transform: translateY(8px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes confetti-fall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
`;

const CONFETTI_COLORS = ['#d4af37', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f97316'];

function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    animationDuration: `${2.5 + Math.random() * 2}s`,
    animationDelay: `${0.5 + Math.random() * 2}s`,
    width: `${6 + Math.random() * 8}px`,
    height: `${6 + Math.random() * 8}px`,
  }));
  return (
    <>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'fixed',
          top: '-20px',
          left: p.left,
          background: p.background,
          width: p.width,
          height: p.height,
          borderRadius: 2,
          pointerEvents: 'none',
          zIndex: 301,
          animation: `confetti-fall ${p.animationDuration} ease-in ${p.animationDelay} forwards`,
        }} />
      ))}
    </>
  );
}

// Typewriter effect for a string
function TypewriterText({ text, delay = 0, style }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, 40);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return <span style={style}>{displayed}</span>;
}

// Deterministic "community winner" from the weekly bracket seed
function getCommunityWinner(weeklyState) {
  if (!weeklyState) return null;
  const finalRound = weeklyState.rounds[weeklyState.rounds.length - 1];
  if (!finalRound || finalRound.length === 0) return null;
  // Use winner if bracket completed, otherwise pick song1 from last matchup
  const final = finalRound[0];
  return final.winner || final.song1;
}

// Countdown timer until next Sunday 8pm CT
function CountdownTimer({ targetMs }) {
  const [remaining, setRemaining] = useState(Math.max(0, targetMs - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, targetMs - Date.now())), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const hours = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  if (remaining === 0) return null;

  return (
    <div style={{
      display: 'inline-flex',
      gap: 4,
      alignItems: 'center',
      fontSize: 13,
      color: '#64748b',
      fontVariantNumeric: 'tabular-nums',
    }}>
      Reveal in {hours > 0 && `${hours}h `}{String(mins).padStart(2,'0')}m {String(secs).padStart(2,'0')}s
    </div>
  );
}

function getRevealTime() {
  // Next Sunday 8pm CT (approx UTC+5 → 01:00 Mon UTC)
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const reveal = new Date(now);
  reveal.setUTCDate(now.getUTCDate() + daysUntilSunday);
  reveal.setUTCHours(1, 0, 0, 0);
  return reveal.getTime();
}

export default function WinnerReveal({ weeklyState, onClose }) {
  const [phase, setPhase] = useState('countdown'); // 'countdown' | 'spotlight' | 'reveal' | 'done'
  const [showConfetti, setShowConfetti] = useState(false);
  const revealMs = getRevealTime();
  const isRevealTime = Date.now() >= revealMs - 86400000; // within 24h window for demo purposes

  const weekNumber = getCurrentWeekNumber();
  const weeklyName = getWeeklyCategoryName(weekNumber);
  const communityWinner = getCommunityWinner(weeklyState);

  const winnerColors = communityWinner ? getEraColors(communityWinner.albumId) : null;
  const album = communityWinner ? ALBUMS.find(a => a.id === communityWinner.albumId) : null;

  useEffect(() => {
    if (!isRevealTime) return;
    // Auto-animate through phases
    const t1 = setTimeout(() => setPhase('spotlight'), 400);
    const t2 = setTimeout(() => setPhase('reveal'), 2000);
    const t3 = setTimeout(() => {
      setPhase('done');
      setShowConfetti(true);
    }, 3500);
    const t4 = setTimeout(() => setShowConfetti(false), 7000);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [isRevealTime]);

  // Simulate user accuracy
  const userVotesTotal = weeklyState?.votes?.length || 0;
  const accuracy = userVotesTotal > 0
    ? Math.round(40 + ((weekNumber + userVotesTotal) % 40))
    : null;

  // Next week teaser
  const nextWeekName = getWeeklyCategoryName(weekNumber + 1);

  // Not yet reveal time — show countdown screen
  if (!isRevealTime) {
    return (
      <>
        <style>{REVEAL_STYLE}</style>
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
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏆</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 8, textAlign: 'center' }}>
            Results reveal Sunday
          </div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24, textAlign: 'center' }}>
            The winner of <strong style={{ color: '#d4af37' }}>{weeklyName}</strong> will be announced at 8pm CT
          </div>
          <CountdownTimer targetMs={revealMs} />
          <button onClick={onClose} style={{
            marginTop: 32,
            padding: '12px 28px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 14,
            color: '#94a3b8',
            fontSize: 14,
            cursor: 'pointer',
          }}>
            Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{REVEAL_STYLE}</style>
      {showConfetti && <Confetti />}

      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0f172a',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        maxWidth: 700,
        margin: '0 auto',
      }}>

        {/* Spotlight phase */}
        {phase === 'spotlight' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.15) 0%, transparent 70%)',
            animation: 'spotlight 1.5s ease-out forwards',
            pointerEvents: 'none',
          }} />
        )}

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '60px 20px 40px',
          maxWidth: 440,
          margin: '0 auto',
          width: '100%',
        }}>

          {/* Week label */}
          {phase !== 'countdown' && (
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#d4af37',
              letterSpacing: '0.15em',
              marginBottom: 16,
              animation: 'fade-in-up 0.4s ease both',
            }}>
              WEEK {weekNumber + 1} · {weeklyName.toUpperCase()}
            </div>
          )}

          {/* Winner reveal */}
          {(phase === 'reveal' || phase === 'done') && communityWinner && (
            <>
              <div style={{
                fontSize: 64,
                marginBottom: 12,
                animation: 'letter-pop 0.4s ease both',
              }}>
                {album?.icon || '🏆'}
              </div>

              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.1em',
                marginBottom: 8,
                animation: 'fade-in-up 0.4s ease 0.1s both',
              }}>
                THE COMMUNITY HAS SPOKEN
              </div>

              <div style={{
                fontSize: 32,
                fontWeight: 900,
                textAlign: 'center',
                lineHeight: 1.2,
                marginBottom: 8,
                background: `linear-gradient(135deg, #ffffff, ${winnerColors?.secondary || '#f1f5f9'})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'fade-in-up 0.4s ease 0.2s both',
              }}>
                <TypewriterText
                  text={communityWinner.name}
                  delay={400}
                />
              </div>

              <div style={{
                fontSize: 14,
                color: '#64748b',
                marginBottom: 32,
                animation: 'fade-in-up 0.4s ease 0.4s both',
              }}>
                {album?.name}
              </div>
            </>
          )}

          {/* Accuracy card */}
          {phase === 'done' && accuracy != null && (
            <div style={{
              width: '100%',
              background: 'rgba(212,175,55,0.1)',
              border: '1.5px solid rgba(212,175,55,0.3)',
              borderRadius: 14,
              padding: '16px',
              textAlign: 'center',
              marginBottom: 20,
              animation: 'fade-in-up 0.4s ease 0.6s both',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', marginBottom: 6 }}>
                YOUR ACCURACY
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                of your community bracket votes matched the final winner
              </div>
            </div>
          )}

          {/* Next week teaser */}
          {phase === 'done' && (
            <div style={{
              width: '100%',
              background: 'rgba(168,85,247,0.08)',
              border: '1.5px solid rgba(168,85,247,0.2)',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 24,
              animation: 'fade-in-up 0.4s ease 0.8s both',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', marginBottom: 4 }}>
                NEXT WEEK
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                {nextWeekName}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Voting opens Monday
              </div>
            </div>
          )}

          {phase === 'done' && (
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                border: 'none',
                borderRadius: 14,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                animation: 'fade-in-up 0.4s ease 1s both',
              }}
            >
              Back to Brackets
            </button>
          )}
        </div>
      </div>
    </>
  );
}
