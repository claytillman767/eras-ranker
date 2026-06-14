import { useState, useEffect } from 'react';
import { getEraColors } from '../../constants/eraColors';
import { ALL_ALBUMS } from '../../data/albums';
import { BRACKET_CATEGORIES } from '../../constants/bracketCategories';
import { computeCommunityBracket, currentRoundIndex, isChampionRevealed, TOTAL_ROUNDS } from '../../constants/weeklySchedule';
import { getNow } from '../../constants/devClock';

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
  const [remaining, setRemaining] = useState(Math.max(0, targetMs - getNow()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, targetMs - getNow())), 1000);
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
  personalBrackets,      // all personal brackets, in-progress first then complete
  maxBrackets,           // soft cap (MAX_PERSONAL_BRACKETS)
  atBracketLimit,        // true when the user is at the cap

  // Callbacks
  onOpenWeekly,
  onOpenPersonal,
  onDeletePersonal,
  onBuildPersonal,
}) {
  const revealMs = getNextSundayReveal();
  // Participant count kept around in case a future hero variant wants to show it,
  // but the "Swifties in" pill was removed (feedback: replace with bracket
  // progress so the hero is a soft reminder of current status).
  // eslint-disable-next-line no-unused-vars
  const participants = fakeParticipantCount(weekNumber ?? 0);

  // Weekly hero — derived from the redesigned shape (contestants + seed). The
  // community's 4-round outcome is recomputed from the seed; the current round
  // comes from the Mon→Sun schedule. We peek the first matchup of the open round.
  const weeklyReady = !!(weeklyState && weeklyState.contestants && weeklyState.personalVotes);
  const weeklyCommunity = weeklyReady ? computeCommunityBracket(weeklyState.contestants, weeklyState.seed) : null;
  const weeklyCurRound = weeklyReady ? Math.min(currentRoundIndex(getNow(), weeklyState.weekNumber), TOTAL_ROUNDS - 1) : 0;
  const weeklyComplete = weeklyReady ? isChampionRevealed(getNow(), weeklyState.weekNumber) : false;
  const weeklyRoundMatchups = weeklyCommunity ? weeklyCommunity.rounds[weeklyCurRound] : null;
  const weeklyMatchup = weeklyRoundMatchups ? weeklyRoundMatchups[0] : null;
  const weeklyMatchupsInRound = weeklyRoundMatchups ? weeklyRoundMatchups.length : 0;

  // Has the user voted in every matchup of the current open round? Drives the
  // CTA label — if they still owe votes, the button reads "Vote Now"; if they
  // already locked in, "See Bracket"; once the week is over, "See Results".
  // (Feedback: skip the two-tap "See Bracket → Vote Now" sequence.)
  const currentRoundVotedKeys = weeklyRoundMatchups
    ? weeklyRoundMatchups.map((_, idx) => `${weeklyCurRound}_${idx}`)
    : [];
  const userVotedFullRound = weeklyReady
    && currentRoundVotedKeys.length > 0
    && currentRoundVotedKeys.every(k => weeklyState.personalVotes && weeklyState.personalVotes[k]);
  const ctaLabel = weeklyComplete
    ? 'See Results →'
    : userVotedFullRound
      ? 'See Bracket →'
      : 'Vote Now →';

  const hasBrackets = personalBrackets && personalBrackets.length > 0;

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

            {/* Stat pills — the second pill ("Swifties in") was replaced with
                a quiet bracket-progress reminder per feedback. The first pill
                stays as the voting countdown. */}
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
                }}>Bracket status</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fde68a' }}>
                  {weeklyComplete
                    ? 'Crowned'
                    : `Round ${weeklyCurRound + 1} of ${TOTAL_ROUNDS}`}
                </div>
              </div>
            </div>

            {/* Matchup peek — kept as a quiet "what's next" visual cue. The
                round count is now in the pill above, so this row drops the
                round text and just teases the first matchup. */}
            {!weeklyComplete && weeklyMatchup && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 12,
              }}>
                <span style={{
                  fontSize: 10, color: '#cbd5e1',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {weeklyMatchupsInRound} matchup{weeklyMatchupsInRound === 1 ? '' : 's'} this round
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
              {ctaLabel}
            </button>
          </div>
        )}

        {/* ── My Brackets ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            margin: '0 2px 8px',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
              My Brackets
            </div>
            {hasBrackets && (
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                {personalBrackets.length} of {maxBrackets}
              </div>
            )}
          </div>

          {hasBrackets ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {personalBrackets.map(b => (
                <BracketCard
                  key={b.id}
                  bracket={b}
                  onOpen={() => onOpenPersonal(b.id)}
                  onDelete={() => onDeletePersonal(b.id)}
                />
              ))}
              <NewBracketButton onClick={onBuildPersonal} atLimit={atBracketLimit} maxBrackets={maxBrackets} />
            </div>
          ) : (
            // Empty state — invite the user to build their first bracket
            <div style={{
              borderRadius: 12,
              padding: '14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                Build your own bracket
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>
                Pick 8, 16, or 32 of your favorites and run a head-to-head tournament.
              </div>
              <NewBracketButton onClick={onBuildPersonal} atLimit={false} maxBrackets={maxBrackets} label="Start a bracket →" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── My Brackets list helpers ────────────────────────────────────────────────

function bracketDisplayName(b) {
  return b.customCategoryName
    || BRACKET_CATEGORIES.find(c => c.id === b.categoryId)?.name
    || 'Bracket';
}

// One row in the My Brackets list. Tapping the card opens it; the trash button
// stops propagation and asks the parent to confirm a delete.
function BracketCard({ bracket, onOpen, onDelete }) {
  const isComplete = bracket.status === 'complete';
  const name = bracketDisplayName(bracket);

  // Tile: completed brackets show the champion's era color + album icon;
  // in-progress brackets use the brand gradient + a bracket glyph.
  const champColors = isComplete && bracket.winner ? getEraColors(bracket.winner.albumId) : null;
  const champAlbum = isComplete && bracket.winner ? ALL_ALBUMS.find(a => a.id === bracket.winner.albumId) : null;

  // Progress (shown for in-progress brackets only).
  const done = bracket.rounds.reduce((sum, round) => sum + round.filter(m => m.winner).length, 0);
  const total = bracket.contestants.length - 1;
  const totalRounds = Math.round(Math.log2(bracket.contestants.length));
  const currentRound = Math.min((bracket.currentRound ?? 0) + 1, totalRounds);
  const alive = isComplete ? [] : aliveContestants(bracket);
  const alivePreview = alive.slice(0, 6);
  const aliveOverflow = Math.max(0, alive.length - 6);

  return (
    <div
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        borderRadius: 12, padding: '11px 12px', cursor: 'pointer',
        background: 'var(--surface)', border: '1px solid var(--border)',
      }}
    >
      {/* Tile */}
      <div style={{
        width: 44, height: 44, borderRadius: 11, flexShrink: 0,
        background: champColors
          ? `linear-gradient(135deg, ${champColors.primary}, ${champColors.secondary})`
          : 'linear-gradient(135deg, var(--brand), var(--brand-2))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {isComplete ? (champAlbum?.icon || '♛') : <BracketGlyph />}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14.5, fontWeight: 600, color: 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        {isComplete ? (
          <div style={{
            fontSize: 12, color: 'var(--text-2)', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>🏆 {bracket.winner?.name || 'Champion crowned'}</div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              Round {currentRound} of {totalRounds} · {done} of {total} done
            </div>
            {alivePreview.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 5 }}>
                {alivePreview.map((s, i) => <EraSwatch key={i} albumId={s.albumId} size={12} />)}
                {aliveOverflow > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 3 }}>+{aliveOverflow}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label={`Delete ${name}`}
        style={{
          flexShrink: 0, width: 34, height: 34, borderRadius: 9,
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: 'var(--text-3)', appearance: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <TrashGlyph />
      </button>
    </div>
  );
}

// The persistent "create a bracket" affordance under the list. At the cap it
// becomes a non-tappable hint instead of a button.
function NewBracketButton({ onClick, atLimit, maxBrackets, label = '＋ New bracket' }) {
  if (atLimit) {
    return (
      <div style={{
        borderRadius: 12, border: '1px dashed var(--border)',
        background: 'var(--surface-2)', padding: '11px 12px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>
          Bracket limit reached ({maxBrackets})
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          Delete one to make a new bracket.
        </div>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '12px', borderRadius: 12, cursor: 'pointer',
        border: '1px dashed var(--brand)', background: 'var(--accent-soft)',
        color: 'var(--brand-text)', fontSize: 14, fontWeight: 600,
        fontFamily: 'inherit', appearance: 'none',
      }}
    >{label}</button>
  );
}

function BracketGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5v4a2 2 0 0 0 2 2h4" />
      <path d="M5 19v-4a2 2 0 0 1 2-2h4" />
      <path d="M11 11h3a2 2 0 0 0 2-2V6" />
      <path d="M16 9h3" />
    </svg>
  );
}

function TrashGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
