import { useState, useEffect, useRef } from 'react';
import { ALL_ALBUMS } from '../../data/albums';
import { getEraColors } from '../../constants/eraColors';
import { getSnippetLyrics, getBridgeLyrics } from '../../data/lyricsAccess';
import { BRACKET_CATEGORIES } from '../../constants/bracketCategories';

const STYLE = `
@keyframes matchup-scale-in {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes matchup-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes matchup-pulse-dot {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}
@keyframes matchup-winner-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.02); }
  100% { transform: scale(1); }
}
@keyframes matchup-bar-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
/* Tactile press feedback on the tappable cards — snappy 100ms scale. */
.matchup-card-tappable:active { transform: scale(0.97); }
`;

function getLyric(categoryId, albumId, songIndex) {
  const cat = BRACKET_CATEGORIES.find(c => c.id === categoryId);
  if (cat?.lyricsContext === 'bridge') {
    return getBridgeLyrics(albumId, songIndex) || getSnippetLyrics(albumId, songIndex);
  }
  return getSnippetLyrics(albumId, songIndex);
}

// Eras whose primary text is light (white-ish) — used to flip contrast on bottom progress bars.
const LIGHT_TEXT_ERAS = new Set(['rp', 'ml']);

function MatchupCard({
  song,
  songLabel,
  categoryId,
  state,           // 'idle' | 'winner' | 'loser'
  percent,         // 0..100, used in 'winner'/'loser'
  onTap,           // (song) => void  — only wired when card is tappable
}) {
  const colors = getEraColors(song.albumId);
  const album = ALL_ALBUMS.find(a => a.id === song.albumId);
  const lyric = getLyric(categoryId, song.albumId, song.songIndex);

  const isWinner  = state === 'winner';
  const isLoser   = state === 'loser';

  const lightText = LIGHT_TEXT_ERAS.has(song.albumId);

  let boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
  if (isWinner)  boxShadow = '0 0 0 3px #f59e0b, 0 1px 2px rgba(0,0,0,0.06)';

  const tappable = !!onTap;

  return (
    <div
      onClick={() => { if (tappable) onTap(song); }}
      className={tappable ? 'matchup-card-tappable' : undefined}
      style={{
        flex: 1,
        borderRadius: 16,
        padding: '14px 12px',
        background: `linear-gradient(145deg, ${colors.primary}, ${colors.secondary})`,
        color: colors.text,
        border: '1px solid #e5e7eb',
        boxShadow,
        position: 'relative',
        minHeight: 230,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: tappable ? 'pointer' : 'default',
        opacity: isLoser ? 0.45 : 1,
        transition: 'opacity 0.35s ease, box-shadow 0.2s ease, transform 100ms ease-out',
        animation: isWinner ? 'matchup-winner-pop 0.2s ease-out' : 'matchup-fade-up 0.25s ease-out',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Top-right status badge */}
      {isWinner && (
        <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 18 }}>♛</div>
      )}

      {/* Top: meta + title + lyric */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, opacity: 0.75,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {songLabel} · {album?.name}
        </div>
        <div style={{
          fontSize: 19, fontWeight: 600, lineHeight: 1.2,
          marginBottom: 8,
        }}>
          {song.name}
        </div>
        {lyric && (
          <div style={{
            fontSize: 11, fontStyle: 'italic', lineHeight: 1.4,
            opacity: 0.85,
            borderLeft: `2px solid ${lightText ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)'}`,
            paddingLeft: 8,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            "{lyric.split('\n').slice(0, 2).join(' / ')}"
          </div>
        )}
      </div>

      {(isWinner || isLoser) && percent != null && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 24, fontWeight: 300, lineHeight: 1 }}>{percent}%</div>
          <div style={{
            height: 6, borderRadius: 3, marginTop: 4,
            background: lightText ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${percent}%`, height: '100%',
              background: lightText ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.5)',
              transformOrigin: 'left center',
              animation: 'matchup-bar-grow 600ms ease-out',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Matchup({
  song1,
  song2,
  categoryId,
  weekLabel,         // e.g., "Best Bridge · Wk 37"
  roundIndex,
  totalRounds,
  matchupIndex,
  matchupsInRound,
  onVote,            // (winnerSong) => void  — fires when matchup completes
  onClose,           // top-right ✕ — exits to Tree (parent decides)
  onSeeBracket,      // bottom-right link — opens Tree
  // OPEN QUESTION (README §1): community vote percentages need a real backend
  // counter. For now the parent passes a number (0..100) representing the % of
  // the community that voted for song1. When null, the result strip is muted.
  communityPercentSong1,
}) {
  // Reset whenever the matchup changes (parent rotates song1/song2 through the bracket).
  const matchupKey = `${song1.albumId}_${song1.songIndex}__${song2.albumId}_${song2.songIndex}`;

  const [phase, setPhase] = useState('ready'); // 'ready' | 'voted'
  const [pickedSong, setPickedSong] = useState(null);

  const phaseTimerRef = useRef(null);

  function clearTimers() {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  }

  // When the matchup itself swaps out, reset to the voting state.
  useEffect(() => {
    setPickedSong(null);
    setPhase('ready');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchupKey]);

  // After a vote, auto-advance once the result reveal has animated in.
  useEffect(() => {
    clearTimers();
    if (phase === 'voted') {
      phaseTimerRef.current = setTimeout(() => {
        if (pickedSong) onVote?.(pickedSong);
      }, 1200);
    }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, matchupKey]);

  // Clear any pending timer when the screen unmounts.
  useEffect(() => () => clearTimers(), []);

  function handleVote(song) {
    // Vote-lock rule: only tappable in the 'ready' phase.
    if (phase !== 'ready') return;
    setPickedSong(song);
    setPhase('voted');
  }

  function handleAdvanceNow() {
    clearTimers();
    if (pickedSong) onVote?.(pickedSong);
  }

  // Determine each card's visual state from the phase + pick.
  const pickedSong1 = pickedSong &&
    pickedSong.albumId === song1.albumId &&
    pickedSong.songIndex === song1.songIndex;

  const card1State =
    phase === 'voted' ? (pickedSong1 ? 'winner' : 'loser') : 'idle';

  const card2State =
    phase === 'voted' ? (pickedSong1 ? 'loser' : 'winner') : 'idle';

  // Result percentages — fall back to 50/50 when no community data is supplied.
  const pct1 = phase === 'voted'
    ? (communityPercentSong1 != null ? communityPercentSong1 : 50)
    : null;
  const pct2 = pct1 == null ? null : 100 - pct1;
  const userAgreementPct = pickedSong1 ? pct1 : pct2;

  return (
    <>
      <style>{STYLE}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#ffffff',
        maxWidth: 700, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#111827',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{weekLabel}</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 26, height: 26, borderRadius: 13,
              border: '1px solid #111827',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#111827', padding: 0, lineHeight: 1,
            }}
          >✕</button>
        </div>

        {/* Round dots + label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 16px 4px', flexShrink: 0,
        }}>
          {Array.from({ length: totalRounds }).map((_, i) => {
            const isCurrent = i === roundIndex;
            const isComplete = i < roundIndex;
            return (
              <span key={i} style={{
                width: 8, height: 8, borderRadius: 4,
                background: isComplete ? '#a855f7' : 'transparent',
                border: `2px solid ${isCurrent ? '#f59e0b' : (isComplete ? '#a855f7' : '#e5e7eb')}`,
                boxSizing: 'border-box',
              }} />
            );
          })}
          <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 6 }}>
            R{roundIndex + 1} · {matchupIndex + 1}/{matchupsInRound}
          </span>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, padding: '8px 16px 14px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0,
        }}>

          {/* The two cards */}
          <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0 }}>
            <MatchupCard
              song={song1}
              songLabel="Song 1"
              categoryId={categoryId}
              state={card1State}
              percent={pct1}
              onTap={phase === 'ready' ? handleVote : null}
            />
            <MatchupCard
              song={song2}
              songLabel="Song 2"
              categoryId={categoryId}
              state={card2State}
              percent={pct2}
              onTap={phase === 'ready' ? handleVote : null}
            />
          </div>

          {/* Phase-specific bottom strip */}
          <div style={{ marginTop: 12, flexShrink: 0 }}>
            {phase === 'ready' && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: '#f3e8ff',
                  color: '#7e22ce',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}>
                  Tap a card to vote ↑
                </div>
              </div>
            )}

            {phase === 'voted' && (
              communityPercentSong1 != null ? (
                // Real community data → keep the rich dashed-box reveal
                <div style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: '#f3e8ff', border: '1px dashed #a855f7',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{
                    fontSize: 14, color: '#7e22ce', fontWeight: 500, textAlign: 'center',
                  }}>
                    {userAgreementPct}% of Swifties agree with you ✦
                  </div>
                  <div style={{
                    fontSize: 11, color: '#6b7280', textAlign: 'center',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                  }}>
                    <span>Next matchup in 1.2s…</span>
                    <button
                      onClick={handleAdvanceNow}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: '#a855f7', fontSize: 11, fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >Next →</button>
                  </div>
                </div>
              ) : (
                // No community backend yet → quieter confirmation, no oversold box
                <div style={{ textAlign: 'center', padding: '4px 0' }}>
                  <div style={{
                    fontSize: 13, color: '#7e22ce', fontWeight: 600, marginBottom: 4,
                  }}>
                    Vote counted ✦
                  </div>
                  <div style={{
                    fontSize: 11, color: '#9ca3af',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                  }}>
                    <span>Next matchup in 1.2s</span>
                    <button
                      onClick={handleAdvanceNow}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: '#a855f7', fontSize: 11, fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >Next →</button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Footer nav */}
          <div style={{
            marginTop: 10, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: 11, color: '#6b7280', flexShrink: 0,
          }}>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 11, color: '#6b7280', cursor: 'pointer',
              }}
            >← Back</button>
            {onSeeBracket && (
              <button
                onClick={onSeeBracket}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: 11, color: '#6b7280', cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >See full bracket</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
