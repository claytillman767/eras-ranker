import { useState, useEffect } from 'react';
import { BRACKET_CATEGORIES, getCurrentWeekNumber, getWeeklyCategoryName } from '../../constants/bracketCategories';

// Inject sparkle keyframes once
const SPARKLE_STYLE = `
@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 12px rgba(212,175,55,0.4); }
  50% { box-shadow: 0 0 28px rgba(212,175,55,0.9); }
}
@keyframes slide-in {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

function SparkleField() {
  const positions = [
    { top: '12%', left: '8%', delay: '0s', size: 14 },
    { top: '25%', left: '88%', delay: '0.4s', size: 10 },
    { top: '60%', left: '5%', delay: '0.8s', size: 12 },
    { top: '75%', left: '92%', delay: '1.2s', size: 8 },
    { top: '40%', left: '95%', delay: '0.6s', size: 11 },
    { top: '80%', left: '15%', delay: '1.5s', size: 9 },
  ];
  return (
    <>
      {positions.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            fontSize: p.size,
            animation: `sparkle 2.4s ease-in-out ${p.delay} infinite`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >✦</div>
      ))}
    </>
  );
}

function CountdownTimer({ targetMs }) {
  const [remaining, setRemaining] = useState(Math.max(0, targetMs - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, targetMs - Date.now())), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  if (remaining === 0) return <span style={{ color: '#fbbf24', fontWeight: 700 }}>Results are live!</span>;

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', color: '#fde68a' }}>
      {days > 0 && `${days}d `}{String(hours).padStart(2, '0')}h {String(mins).padStart(2, '0')}m {String(secs).padStart(2, '0')}s
    </span>
  );
}

// Calculate next Sunday 8pm CT (UTC-5 or UTC-6)
function getNextSundayReveal() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const reveal = new Date(now);
  reveal.setUTCDate(now.getUTCDate() + daysUntilSunday);
  reveal.setUTCHours(2, 0, 0, 0); // 8pm CT = 2am UTC next day (CST) — approx
  return reveal.getTime();
}

export default function BracketHome({ brackets, onStartBracket, onContinueBracket, onOpenWeekly, onOpenResults }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => { setTimeout(() => setEntered(true), 50); }, []);

  const weekNumber = getCurrentWeekNumber();
  const weeklyName = getWeeklyCategoryName(weekNumber);
  const revealMs = getNextSundayReveal();

  // Simulate a vote count (grows with week number + time-of-day)
  const fakeVoteCount = (weekNumber * 312 + Math.floor(Date.now() / 3600000) * 7) % 3000 + 1200;

  const inProgress = brackets.filter(b => b.status === 'in-progress');
  const completed = brackets.filter(b => b.status === 'complete');

  // Recently crowned: last 3 completed brackets
  const recentWinners = completed.slice(-3).reverse();

  const availableCategories = BRACKET_CATEGORIES.filter(c => !c.isWeekly);

  return (
    <>
      <style>{SPARKLE_STYLE}</style>
      <div style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'none' : 'translateY(12px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        paddingBottom: 24,
      }}>

        {/* ── Weekly Hero ── */}
        <div style={{
          position: 'relative',
          margin: '16px 0 20px',
          borderRadius: 18,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
          padding: '24px 20px',
          minHeight: 180,
        }}>
          <SparkleField />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#d4af37',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              Week {weekNumber + 1} · Community Bracket
            </div>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: 8,
            }}>
              {weeklyName}
            </div>
            <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 4 }}>
              {fakeVoteCount.toLocaleString()} Swifties have voted
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>
              Reveal in: <CountdownTimer targetMs={revealMs} />
            </div>
            <button
              onClick={onOpenWeekly}
              style={{
                background: 'linear-gradient(90deg, #d4af37, #f5d97a)',
                color: '#1a1000',
                border: 'none',
                borderRadius: 24,
                padding: '11px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                animation: 'pulse-glow 2s ease-in-out infinite',
                letterSpacing: '0.02em',
              }}
            >
              Cast Your Vote →
            </button>
          </div>
        </div>

        {/* ── In-Progress Brackets ── */}
        {inProgress.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 10 }}>
              Your Active Brackets
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {inProgress.map(b => {
                const cat = BRACKET_CATEGORIES.find(c => c.id === b.categoryId);
                const totalMatchups = b.rounds[b.currentRound]?.length || 1;
                const done = b.rounds[b.currentRound]?.filter(m => m.winner).length || 0;
                const roundNum = b.currentRound + 1;
                const totalRounds = Math.log2(b.contestants.length);
                return (
                  <div
                    key={b.id}
                    onClick={() => onContinueBracket(b.id)}
                    style={{
                      minWidth: 180,
                      background: 'var(--surface-2)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 14,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-text)', marginBottom: 4 }}>
                      Round {roundNum} of {totalRounds}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6, lineHeight: 1.3 }}>
                      {cat?.name || b.categoryId}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                      {totalMatchups - done} matchup{totalMatchups - done !== 1 ? 's' : ''} left
                    </div>
                    <div style={{
                      marginTop: 8,
                      height: 4,
                      background: 'var(--border)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(done / totalMatchups) * 100}%`,
                        height: '100%',
                        background: 'var(--brand)',
                        borderRadius: 2,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Start a New Bracket ── */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 10 }}>
            Start a New Bracket
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {availableCategories.map((cat, i) => (
              <div
                key={cat.id}
                onClick={() => onStartBracket(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  animation: `slide-in 0.3s ease ${i * 0.05}s both`,
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--brand)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(168,85,247,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--accent-soft), var(--accent-soft-2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}>
                  {['🎵', '💔', '📖', '💌', '🎤', '💎', '🎶', '📝'][availableCategories.indexOf(cat)] || '🏆'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                    {cat.description}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>
                  ~{cat.estimatedMinutes}m
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recently Crowned ── */}
        {recentWinners.length > 0 && (
          <section>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 10 }}>
              Recently Crowned 👑
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentWinners.map(b => {
                const cat = BRACKET_CATEGORIES.find(c => c.id === b.categoryId);
                return (
                  <div
                    key={b.id}
                    onClick={() => onOpenResults(b.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                      border: '1.5px solid #fcd34d',
                      borderRadius: 12,
                      padding: '12px 14px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 22 }}>🏆</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                        {b.winner?.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#78350f' }}>
                        {cat?.name} · Tap to see bracket
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {brackets.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '32px 16px',
            background: 'var(--surface-2)',
            borderRadius: 14,
            border: '1.5px dashed var(--border)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>
              No brackets yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              Pick a category above to start your first bracket
            </div>
          </div>
        )}
      </div>
    </>
  );
}
