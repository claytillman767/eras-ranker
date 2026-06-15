// Custom-bracket full-bracket view ("See full bracket"). Restyled to the weekly
// arena look: navy arena background, era-tile nodes (getEra), gold accents for
// the live matchup / winner / final, and a gold "Vote Now" CTA. Layout + the
// bracket-fan connector math are unchanged — this is a color/skin pass.

import { useState, useEffect, useRef } from 'react';
import { FeedbackLauncher } from '../FeedbackButton';
import { getEra } from '../../constants/eraColors';
import { ArenaBg, GoldButton, GOLD_LT, fontUI } from './weekly/WeeklyParts';

const STYLE = `
@keyframes tree-live-pulse {
  0%, 100% { box-shadow: 0 0 0 2px #f5d97a, 0 0 0 4px rgba(245,217,122,0.20); }
  50%      { box-shadow: 0 0 0 2px #f5d97a, 0 0 0 7px rgba(245,217,122,0.05); }
}
`;

function getRoundLabel(roundIndex, totalRounds) {
  const remaining = totalRounds - roundIndex;
  if (remaining === 1) return 'Final';
  if (remaining === 2) return 'Semi-Final';
  return `Round ${roundIndex + 1}`;
}

function getRoundSubLabel(roundIndex, totalRounds) {
  const songsIn = Math.pow(2, totalRounds - roundIndex);
  const songsOut = songsIn / 2;
  if (songsOut < 1) return '';
  return `${songsIn} → ${songsOut}`;
}

function TreeNode({ song, status, highlight, small, width }) {
  // status: 'won' | 'lost' | 'pending' | 'live' | 'tbd'
  const era = song ? getEra(song.albumId) : null;
  const isLost = status === 'lost';
  const isTbd = status === 'tbd';
  const isLive = status === 'live';

  const w = width !== undefined ? width : (small ? 100 : 120);
  const h = small ? 30 : 36;
  const hasColor = era && !isTbd;

  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: hasColor
        ? `linear-gradient(140deg, ${era.tile}, ${era.deep})`
        : 'rgba(255,255,255,0.05)',
      border: isTbd ? '1px dashed rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.12)',
      display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px',
      opacity: isLost ? 0.4 : 1,
      position: 'relative',
      animation: isLive ? 'tree-live-pulse 1.4s ease-in-out infinite' : undefined,
      boxShadow: highlight && !isLive ? '0 0 0 2px #f5d97a' : undefined,
    }}>
      <span style={{
        width: small ? 14 : 16, height: small ? 14 : 16, flexShrink: 0,
        fontSize: small ? 11 : 13, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: hasColor ? 1 : 0.4,
      }}>{hasColor ? era.emoji : '·'}</span>
      <span style={{
        fontSize: small ? 10 : 11, fontWeight: 600,
        color: hasColor ? era.ink : 'rgba(255,255,255,0.4)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        textDecoration: isLost ? 'line-through' : 'none',
        flex: 1, lineHeight: 1.1,
      }}>
        {song ? song.name : '?'}
      </span>
      {isLive && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          width: 8, height: 8, borderRadius: 4,
          background: '#ef4444', border: '1.5px solid #16213e',
        }} />
      )}
    </div>
  );
}

function slotStatus(matchup, slot, isLive, totalRounds, roundIndex, isFutureRound) {
  if (isFutureRound || !matchup) return 'tbd';
  const slotSong = matchup[slot];
  if (!slotSong) return 'tbd';
  if (matchup.winner) {
    const winnerSelf =
      matchup.winner.albumId === slotSong.albumId &&
      matchup.winner.songIndex === slotSong.songIndex;
    return winnerSelf ? 'won' : 'lost';
  }
  return isLive ? 'live' : 'pending';
}

export default function Tree({
  bracket,
  weekLabel,
  emoji,
  onClose,
  onOpenMatchup,
}) {
  const totalRounds = Math.log2(bracket.contestants.length);

  const liveRound = bracket.currentRound;
  const liveMatchupIdx = bracket.currentMatchupIndex;
  const liveMatchup = bracket.rounds[liveRound]?.[liveMatchupIdx] || null;
  const isComplete = bracket.status === 'complete';

  const [expandedRound, setExpandedRound] = useState(liveRound);
  useEffect(() => { setExpandedRound(liveRound); }, [liveRound]);

  const COL_W_EXPANDED = 200;
  const COL_W_COMPRESSED = 78;
  const COL_GAP = 14;
  const colWidth = (idx) => idx === expandedRound ? COL_W_EXPANDED : COL_W_COMPRESSED;

  const columns = [];
  for (let r = 0; r < totalRounds; r++) {
    const round = bracket.rounds[r];
    if (round) {
      columns.push({ round, isFuture: false, index: r });
    } else {
      const matchupCount = Math.pow(2, totalRounds - 1 - r);
      const empty = Array.from({ length: matchupCount }, () => ({ song1: null, song2: null, winner: null }));
      columns.push({ round: empty, isFuture: true, index: r });
    }
  }

  const scrollerRef = useRef(null);
  useEffect(() => {
    if (!scrollerRef.current) return;
    let leftOffset = 0;
    for (let i = 0; i < expandedRound; i++) leftOffset += COL_W_COMPRESSED + COL_GAP;
    scrollerRef.current.scrollTo({ left: Math.max(0, leftOffset - 16), behavior: 'smooth' });
  }, [expandedRound]);

  function computeRoundLayout(r) {
    const pairH = 62;
    let slotH = 72;
    let paddingTop = 0;
    for (let i = 0; i < r; i++) { paddingTop += slotH / 2; slotH *= 2; }
    return { interGap: slotH - pairH, paddingTop };
  }

  const showCTA = !isComplete && liveMatchup &&
    liveMatchup.song1 && liveMatchup.song2 && !liveMatchup.winner;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      maxWidth: 700, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      color: '#fff', fontFamily: fontUI,
    }}>
      <style>{STYLE}</style>
      <ArenaBg />

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 12px', flexShrink: 0,
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {emoji ? `${emoji} ` : ''}{weekLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <FeedbackLauncher variant="overlay" />
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 34, height: 34, borderRadius: 17,
                border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.08)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, color: '#fff', padding: 0, lineHeight: 1,
              }}
            >×</button>
          </div>
        </div>

        {/* "Your turn" CTA */}
        {showCTA && (
          <div style={{
            margin: '0 14px 8px', padding: '11px 14px', borderRadius: 14,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,217,122,0.3)',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: GOLD_LT, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                Your turn — {getRoundLabel(liveRound, totalRounds)} matchup {liveMatchupIdx + 1}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {liveMatchup.song1.name} vs {liveMatchup.song2.name}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <GoldButton size="sm" onClick={() => onOpenMatchup?.(liveRound, liveMatchupIdx)}>Vote Now</GoldButton>
            </div>
          </div>
        )}

        {/* Body — horizontally scrolling bracket fan */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div ref={scrollerRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '8px 16px 16px' }}>
            <div style={{
              display: 'flex', gap: COL_GAP,
              minWidth: COL_W_EXPANDED + (totalRounds - 1) * COL_W_COMPRESSED + (totalRounds - 1) * COL_GAP,
            }}>
              {columns.map(({ round, isFuture, index }) => {
                const isExpanded = index === expandedRound;
                const w = colWidth(index);
                return (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, width: w }}>
                    <button
                      onClick={() => setExpandedRound(index)}
                      title={isExpanded ? 'Currently showing full names' : 'Tap to expand this round'}
                      style={{
                        appearance: 'none', background: 'transparent', border: 'none', padding: 0, margin: 0,
                        fontFamily: 'inherit', fontSize: 9,
                        color: isExpanded ? '#fff' : 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        fontWeight: isExpanded ? 700 : 600, textAlign: 'left', cursor: 'pointer',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%',
                        borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.6)' : '1px dashed transparent',
                        paddingBottom: 2,
                      }}
                    >
                      {getRoundLabel(index, totalRounds)}
                      {getRoundSubLabel(index, totalRounds) && (
                        <span style={{ marginLeft: 6, opacity: 0.7 }}>· {getRoundSubLabel(index, totalRounds)}</span>
                      )}
                    </button>
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      gap: computeRoundLayout(index).interGap,
                      paddingTop: computeRoundLayout(index).paddingTop,
                    }}>
                      {round.map((m, mIdx) => {
                        const isLive = !isFuture && index === liveRound && mIdx === liveMatchupIdx &&
                          m.song1 && m.song2 && !m.winner;
                        const isLastRound = index === totalRounds - 1;
                        return (
                          <div
                            key={mIdx}
                            onClick={() => { if (isLive && onOpenMatchup) onOpenMatchup(index, mIdx); }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 2, cursor: isLive ? 'pointer' : 'default', position: 'relative' }}
                          >
                            <TreeNode song={m.song1} status={slotStatus(m, 'song1', isLive, totalRounds, index, isFuture)} highlight={isLive} small width={w} />
                            <TreeNode song={m.song2} status={slotStatus(m, 'song2', isLive, totalRounds, index, isFuture)} highlight={isLive} small width={w} />
                            {!isLastRound && (
                              <>
                                <div style={{ position: 'absolute', pointerEvents: 'none', right: -7, top: 15, width: 7, height: 1, background: 'rgba(255,255,255,0.2)' }} />
                                <div style={{ position: 'absolute', pointerEvents: 'none', right: -7, bottom: 15, width: 7, height: 1, background: 'rgba(255,255,255,0.2)' }} />
                                <div style={{ position: 'absolute', pointerEvents: 'none', right: -7, top: 15, bottom: 15, width: 1, background: 'rgba(255,255,255,0.2)' }} />
                                <div style={{ position: 'absolute', pointerEvents: 'none', right: -14, top: '50%', width: 7, height: 1, background: 'rgba(255,255,255,0.2)' }} />
                              </>
                            )}
                          </div>
                        );
                      })}
                      {index === totalRounds - 1 && !isComplete && (
                        <div style={{
                          marginTop: 12, padding: '8px 10px',
                          border: '1.5px dashed rgba(245,217,122,0.6)', borderRadius: 8,
                          textAlign: 'center', fontSize: isExpanded ? 11 : 10, fontStyle: 'italic',
                          color: GOLD_LT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          ♛ winner
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isComplete && (
            <div style={{
              padding: '11px 14px', flexShrink: 0, textAlign: 'center',
              background: 'rgba(212,175,55,0.12)', borderTop: '1px solid rgba(245,217,122,0.25)',
              fontSize: 12.5, color: GOLD_LT, fontWeight: 600,
            }}>
              ♛ Bracket complete — {bracket.winner?.name} crowned
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
