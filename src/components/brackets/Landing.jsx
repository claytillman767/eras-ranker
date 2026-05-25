import { useState, useEffect } from 'react';
import { getEraColors } from '../../constants/eraColors';
import { ALL_ALBUMS } from '../../data/albums';
import { BRACKET_CATEGORIES } from '../../constants/bracketCategories';
import { computeCommunityBracket, currentRoundIndex, isChampionRevealed, TOTAL_ROUNDS } from '../../constants/weeklySchedule';

const STYLE = `
@keyframes landing-pulse-dot {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}
@keyframes landing-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;


// Sunday 8pm CT (≈ Monday 02:00 UTC for CST). Approximation matches BracketHome.
function getNextSundayReveal() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const reveal = new Date(now);
  reveal.setUTCDate(now.getUTCDate() + daysUntilSunday);
  reveal.setUTCHours(2, 0, 0, 0);
  return reveal.getTime();
}

function CountdownTimer({ targetMs }) {
  const [remaining, setRemaining] = useState(Math.max(0, targetMs - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, targetMs - Date.now())), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (remaining === 0) return <span>Results live</span>;

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {days > 0 && `${days}d `}{String(hours).padStart(2, '0')}h {String(mins).padStart(2, '0')}m
    </span>
  );
}

function EraSwatch({ albumId, size = 14 }) {
  const c = getEraColors(albumId);
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
      border: '1px solid rgba(0,0,0,0.1)',
      flexShrink: 0,
    }} />
  );
}

// All songs still alive in a bracket: winners of completed matchups + both
// contestants of any matchup not yet decided.
function aliveContestants(bracket) {
  const alive = [];
  const lastRound = bracket.rounds[bracket.rounds.length - 1] || [];
  for (const m of lastRound) {
    if (m.winner) {
      alive.push(m.winner);
    } else {
      if (m.song1) alive.push(m.song1);
      if (m.song2) alive.push(m.song2);
    }
  }
  return alive;
}

// OPEN QUESTION (README §1): real participant counts need a backend rollup.
// Until then we synthesize a deterministic-ish number from the week + hour so
// the hero feels alive without lying about the source. Replace once the API
// exists.
function fakeParticipantCount(weekNumber) {
  const base = (weekNumber * 312 + Math.floor(Date.now() / 3600000) * 7) % 3000 + 1200;
  return base;
}

export default function Landing({
  // Data — driven from useBrackets in the parent
  weekNumber,
  weeklyState,
  weeklyCategoryName,
  personalInProgress,    // single in-progress personal bracket, or null
  recentlyCrowned,       // array of recently completed brackets (most-recent first)

  // Callbacks
  onOpenWeekly,
  onContinuePersonal,
  onBuildPersonal,
  onOpenCrowned,
}) {
  const revealMs = getNextSundayReveal();
  const participants = fakeParticipantCount(weekNumber ?? 0);

  // Weekly hero — derived from the redesigned shape (contestants + seed). The
  // community's 4-round outcome is recomputed from the seed; the current round
  // comes from the Mon→Sun schedule. We peek the first matchup of the open round.
  const weeklyReady = !!(weeklyState && weeklyState.contestants && weeklyState.personalVotes);
  const weeklyCommunity = weeklyReady ? computeCommunityBracket(weeklyState.contestants, weeklyState.seed) : null;
  const weeklyCurRound = weeklyReady ? Math.min(currentRoundIndex(Date.now(), weeklyState.weekNumber), TOTAL_ROUNDS - 1) : 0;
  const weeklyComplete = weeklyReady ? isChampionRevealed(Date.now(), weeklyState.weekNumber) : false;
  const weeklyRoundMatchups = weeklyCommunity ? weeklyCommunity.rounds[weeklyCurRound] : null;
  const weeklyMatchup = weeklyRoundMatchups ? weeklyRoundMatchups[0] : null;
  const weeklyMatchupsInRound = weeklyRoundMatchups ? weeklyRoundMatchups.length : 0;

  // Personal in-progress card — preview the alive contestants
  const personalCat = personalInProgress
    ? BRACKET_CATEGORIES.find(c => c.id === personalInProgress.categoryId)
    : null;
  const personalAlive = personalInProgress ? aliveContestants(personalInProgress) : [];
  const personalSwatchPreview = personalAlive.slice(0, 6);
  const personalSwatchOverflow = Math.max(0, personalAlive.length - 6);

  // Personal progress count
  const personalDoneCount = personalInProgress
    ? personalInProgress.rounds.reduce(
        (sum, round) => sum + round.filter(m => m.winner).length, 0
      )
    : 0;
  const personalTotal = personalInProgress
    ? personalInProgress.contestants.length - 1
    : 0;

  return (
    <>
      <style>{STYLE}</style>
      <div style={{
        animation: 'landing-fade-in 0.3s ease-out',
        paddingBottom: 24,
      }}>

        {/* ── Weekly Hero ───────────────────────────────────────────────── */}
        {weeklyState && (
          <div style={{
            margin: '12px 0',
            borderRadius: 14,
            padding: 16,
            background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Live label row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 3,
                background: '#ef4444',
                animation: 'landing-pulse-dot 1.2s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#fbbf24',
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                {weeklyComplete ? 'This week · winner crowned' : 'This week · live'}
              </span>
            </div>

            {/* Title */}
            <div style={{
              fontSize: 24, fontWeight: 600, lineHeight: 1.15, marginBottom: 4,
            }}>
              {weeklyCategoryName}
            </div>
            <div style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 14 }}>
              {weeklyState.contestants.length} songs · everyone votes the same bracket
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px dashed rgba(251,191,36,0.4)',
                borderRadius: 8,
                padding: '6px 8px',
              }}>
                <div style={{
                  fontSize: 9, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 2,
                }}>Voting</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fde68a' }}>
                  <CountdownTimer targetMs={revealMs} />
                </div>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px dashed rgba(251,191,36,0.4)',
                borderRadius: 8,
                padding: '6px 8px',
              }}>
                <div style={{
                  fontSize: 9, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 2,
                }}>Swifties in</div>
                <div style={{
                  fontSize: 14, fontWeight: 500, color: '#fde68a',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {participants.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Round / matchup peek */}
            {!weeklyComplete && weeklyMatchup && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 12,
              }}>
                <span style={{
                  fontSize: 10, color: '#cbd5e1',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  Round {weeklyCurRound + 1} of {TOTAL_ROUNDS} · {weeklyMatchupsInRound} matchups
                </span>
                <span style={{
                  flex: 1, height: 1,
                  background: 'rgba(251,191,36,0.3)',
                }} />
                {weeklyMatchup.song1 && weeklyMatchup.song2 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  }}>
                    <EraSwatch albumId={weeklyMatchup.song1.albumId} size={20} />
                    <span style={{ fontSize: 9, color: '#94a3b8' }}>vs</span>
                    <EraSwatch albumId={weeklyMatchup.song2.albumId} size={20} />
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={onOpenWeekly}
              style={{
                width: '100%',
                padding: '11px 0',
                borderRadius: 22,
                border: 'none',
                background: '#fbbf24',
                color: '#1a1a2e',
                fontSize: 14, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {weeklyComplete ? 'See winner →' : "See This Week's Bracket →"}
            </button>
          </div>
        )}

        {/* ── My Bracket ─────────────────────────────────────────────────── */}
        <div style={{
          marginBottom: 12,
          borderRadius: 12,
          padding: '12px 14px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}>
          {personalInProgress ? (
            <>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: 4,
              }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>
                  My Bracket
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--text-3)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>In progress</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 10 }}>
                {personalCat?.name ? `${personalCat.name} · ` : ''}
                {personalDoneCount} of {personalTotal} matchups completed
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12,
              }}>
                {personalSwatchPreview.map((song, i) => (
                  <EraSwatch key={i} albumId={song.albumId} size={14} />
                ))}
                {personalSwatchOverflow > 0 && (
                  <span style={{
                    fontSize: 10, color: 'var(--text-3)', marginLeft: 4,
                  }}>+ {personalSwatchOverflow}</span>
                )}
              </div>
              <button
                onClick={onContinuePersonal}
                style={{
                  width: '100%',
                  padding: '9px 0',
                  borderRadius: 18,
                  border: 'none',
                  background: 'var(--brand)',
                  color: '#ffffff',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >Continue →</button>
            </>
          ) : (
            // Empty state — invite the user to build their first bracket
            <>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: 4,
              }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>
                  Build your own bracket
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 12 }}>
                Pick 8 or 16 of your favorites and run a head-to-head.
              </div>
              <button
                onClick={onBuildPersonal}
                style={{
                  width: '100%',
                  padding: '9px 0',
                  borderRadius: 18,
                  border: 'none',
                  background: 'var(--brand)',
                  color: '#ffffff',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >Start →</button>
            </>
          )}
        </div>

        {/* ── Recently Crowned ───────────────────────────────────────────── */}
        {/* OPEN QUESTION (README §5): "Recently crowned" should source from the
            community's archived weekly winners — that history isn't stored yet
            (useBrackets only tracks the current week). Until the archive
            exists, fall back to the user's own completed personal brackets so
            the strip isn't always empty. */}
        {recentlyCrowned && recentlyCrowned.length > 0 && (
          <div>
            <div style={{
              fontSize: 10, color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              fontWeight: 600,
              marginBottom: 8,
            }}>
              Recently crowned
            </div>
            <div style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 4,
            }}>
              {recentlyCrowned.map((b, i) => {
                const cat = BRACKET_CATEGORIES.find(c => c.id === b.categoryId);
                const winnerColors = b.winner ? getEraColors(b.winner.albumId) : null;
                const album = b.winner ? ALL_ALBUMS.find(a => a.id === b.winner.albumId) : null;
                return (
                  <div
                    key={b.id || i}
                    onClick={() => onOpenCrowned?.(b.id)}
                    style={{
                      flexShrink: 0,
                      width: 84,
                      cursor: onOpenCrowned ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: 8,
                      background: winnerColors
                        ? `linear-gradient(135deg, ${winnerColors.primary}, ${winnerColors.secondary})`
                        : 'var(--surface-3)',
                      border: '1px dashed var(--text-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                      marginBottom: 4,
                    }}>{album?.icon || '♛'}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-3)' }}>
                      {cat?.name ?? 'Bracket'}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 500, color: 'var(--text)',
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {b.winner?.name ?? '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
