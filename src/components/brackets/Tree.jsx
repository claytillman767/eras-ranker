import { useState, useEffect, useRef } from 'react';
import { getEraColors } from '../../constants/eraColors';

const VIEW_KEY = 'eras_bracket_tree_view';

const STYLE = `
@keyframes tree-live-pulse {
  0%, 100% { box-shadow: 0 0 0 2px #f59e0b, 0 0 0 4px rgba(245,158,11,0.18); }
  50%      { box-shadow: 0 0 0 2px #f59e0b, 0 0 0 7px rgba(245,158,11,0.05); }
}
`;

// Sports-broadcast vocabulary: Final, Semis, QF, otherwise R{n}.
function getRoundLabel(roundIndex, totalRounds) {
  const remaining = totalRounds - roundIndex;
  if (remaining === 1) return 'Final';
  if (remaining === 2) return 'Semis';
  if (remaining === 3) return 'QF';
  return `R${roundIndex + 1}`;
}

// "R1 · 16 → 8" sub-label for the column header.
function getRoundSubLabel(roundIndex, totalRounds) {
  const songsIn  = Math.pow(2, totalRounds - roundIndex);
  const songsOut = songsIn / 2;
  if (songsOut < 1) return '';
  return `${songsIn} → ${songsOut}`;
}

function TreeNode({ song, status, highlight, small }) {
  // status: 'won' | 'lost' | 'pending' | 'live' | 'tbd'
  const colors = song ? getEraColors(song.albumId) : null;
  const isLost    = status === 'lost';
  const isPending = status === 'pending' || status === 'tbd';
  const isLive    = status === 'live';

  const w = small ? 100 : 120;
  const h = small ? 30 : 36;

  let background = '#ffffff';
  if (colors && !isPending) {
    background = `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;
  } else if (isPending) {
    background = '#f9fafb';
  }

  return (
    <div style={{
      width: w,
      height: h,
      borderRadius: 8,
      background,
      border: isPending ? '1px dashed #d1d5db' : '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '0 8px',
      opacity: isLost ? 0.4 : 1,
      position: 'relative',
      animation: isLive ? 'tree-live-pulse 1.4s ease-in-out infinite' : undefined,
      boxShadow: highlight && !isLive ? '0 0 0 2px #f59e0b' : undefined,
    }}>
      {colors && !isPending ? (
        <span style={{
          width: small ? 10 : 12,
          height: small ? 10 : 12,
          borderRadius: '50%',
          background: colors.primary,
          border: '1px solid rgba(0,0,0,0.15)',
          flexShrink: 0,
        }} />
      ) : (
        <span style={{
          width: small ? 10 : 12,
          height: small ? 10 : 12,
          borderRadius: '50%',
          background: '#f3f4f6',
          border: '1px dashed #d1d5db',
          flexShrink: 0,
        }} />
      )}
      <span style={{
        fontSize: small ? 10 : 11,
        fontWeight: 500,
        color: colors && !isPending ? colors.text : '#9ca3af',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textDecoration: isLost ? 'line-through' : 'none',
        flex: 1,
        lineHeight: 1.1,
      }}>
        {song ? song.name : '?'}
      </span>
      {isLive && (
        <span style={{
          position: 'absolute',
          top: -4,
          right: -4,
          width: 8,
          height: 8,
          borderRadius: 4,
          background: '#ef4444',
          border: '1.5px solid #ffffff',
        }} />
      )}
    </div>
  );
}

// Returns the visual status of one slot (song1 or song2) within a matchup,
// given that matchup's winner and whether this matchup is the live one.
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
  weekLabel,             // header title, e.g., "Best Bridge · Wk 37"
  onClose,
  onOpenMatchup,         // (roundIndex, matchupIndex) => void — opens Matchup
}) {
  const totalRounds = Math.log2(bracket.contestants.length);

  const [view, setView] = useState(() => {
    return localStorage.getItem(VIEW_KEY) === 'stacked' ? 'stacked' : 'tree';
  });

  function chooseView(next) {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
  }

  const liveRound = bracket.currentRound;
  const liveMatchupIdx = bracket.currentMatchupIndex;
  const liveMatchup = bracket.rounds[liveRound]?.[liveMatchupIdx] || null;
  const isComplete = bracket.status === 'complete';

  // Build a column per round — fill in placeholders for future rounds.
  const columns = [];
  for (let r = 0; r < totalRounds; r++) {
    const round = bracket.rounds[r];
    if (round) {
      columns.push({ round, isFuture: false, index: r });
    } else {
      const matchupCount = Math.pow(2, totalRounds - 1 - r);
      const empty = Array.from({ length: matchupCount }, () => ({
        song1: null, song2: null, winner: null,
      }));
      columns.push({ round: empty, isFuture: true, index: r });
    }
  }

  // Auto-scroll the tree viewport so the live matchup is visible on first paint.
  const scrollerRef = useRef(null);
  useEffect(() => {
    if (view !== 'tree' || !scrollerRef.current) return;
    // Roughly: each column is ~140px wide. Scroll so the current round sits
    // on the right side of the visible area.
    const colWidth = 140;
    const targetLeft = Math.max(0, (liveRound - 1) * colWidth);
    scrollerRef.current.scrollLeft = targetLeft;
  }, [view, liveRound]);

  // Spacing between matchups widens as the rounds advance (classic bracket fan).
  function pairGapForRound(r) {
    return [10, 32, 76, 168][Math.min(r, 3)] ?? 10 + r * 22;
  }
  function paddingTopForRound(r) {
    return [0, 16, 48, 112][Math.min(r, 3)] ?? r * 28;
  }

  const showCTA = !isComplete && liveMatchup &&
    liveMatchup.song1 && liveMatchup.song2 && !liveMatchup.winner;

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

        {/* View toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 16px 6px', flexShrink: 0,
        }}>
          <button
            onClick={() => chooseView('tree')}
            style={{
              padding: '4px 12px', borderRadius: 14,
              fontSize: 12, fontWeight: 500,
              background: view === 'tree' ? '#111827' : '#ffffff',
              color: view === 'tree' ? '#ffffff' : '#4b5563',
              border: view === 'tree' ? '1px solid #111827' : '1px solid #e5e7eb',
              cursor: 'pointer',
            }}
          >Tree</button>
          <button
            onClick={() => chooseView('stacked')}
            style={{
              padding: '4px 12px', borderRadius: 14,
              fontSize: 12, fontWeight: 500,
              background: view === 'stacked' ? '#111827' : '#ffffff',
              color: view === 'stacked' ? '#ffffff' : '#4b5563',
              border: view === 'stacked' ? '1px solid #111827' : '1px solid #e5e7eb',
              cursor: 'pointer',
            }}
          >Stacked</button>
          <span style={{ flex: 1 }} />
          {view === 'tree' && (
            <span style={{ fontSize: 10, color: '#9ca3af' }}>swipe →</span>
          )}
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>

          {view === 'tree' ? (
            <div
              ref={scrollerRef}
              style={{
                flex: 1, overflowX: 'auto', overflowY: 'auto',
                padding: '8px 16px 16px',
              }}
            >
              <div style={{
                display: 'flex', gap: 16,
                minWidth: totalRounds * 140,
              }}>
                {columns.map(({ round, isFuture, index }) => (
                  <div key={index} style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    flexShrink: 0,
                  }}>
                    <div style={{
                      fontSize: 9,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: 600,
                    }}>
                      {getRoundLabel(index, totalRounds)}
                      {getRoundSubLabel(index, totalRounds) && (
                        <span style={{ marginLeft: 6, opacity: 0.7 }}>
                          · {getRoundSubLabel(index, totalRounds)}
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: pairGapForRound(index),
                      paddingTop: paddingTopForRound(index),
                    }}>
                      {round.map((m, mIdx) => {
                        const isLive = !isFuture &&
                          index === liveRound && mIdx === liveMatchupIdx &&
                          m.song1 && m.song2 && !m.winner;
                        return (
                          <div
                            key={mIdx}
                            onClick={() => {
                              if (isLive && onOpenMatchup) onOpenMatchup(index, mIdx);
                            }}
                            style={{
                              display: 'flex', flexDirection: 'column', gap: 2,
                              cursor: isLive ? 'pointer' : 'default',
                            }}
                          >
                            <TreeNode
                              song={m.song1}
                              status={slotStatus(m, 'song1', isLive, totalRounds, index, isFuture)}
                              highlight={isLive}
                              small
                            />
                            <TreeNode
                              song={m.song2}
                              status={slotStatus(m, 'song2', isLive, totalRounds, index, isFuture)}
                              highlight={isLive}
                              small
                            />
                          </div>
                        );
                      })}
                      {/* Final-column trophy slot when bracket isn't complete */}
                      {index === totalRounds - 1 && !isComplete && (
                        <div style={{
                          marginTop: 12,
                          padding: '8px 10px',
                          border: '1.5px dashed #f59e0b',
                          borderRadius: 8,
                          textAlign: 'center',
                          fontSize: 11,
                          fontStyle: 'italic',
                          color: '#b45309',
                        }}>
                          ♛ winner
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // ── Stacked view ───────────────────────────────────────────────
            <div style={{
              flex: 1, overflowY: 'auto', padding: '8px 16px 16px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {columns.map(({ round, isFuture, index }) => (
                <div key={index}>
                  <div style={{
                    fontSize: 9, color: '#9ca3af',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    fontWeight: 600, marginBottom: 6,
                  }}>
                    {getRoundLabel(index, totalRounds)}
                    {getRoundSubLabel(index, totalRounds) && (
                      <span style={{ marginLeft: 6, opacity: 0.7 }}>
                        · {getRoundSubLabel(index, totalRounds)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {round.map((m, mIdx) => {
                      const isLive = !isFuture &&
                        index === liveRound && mIdx === liveMatchupIdx &&
                        m.song1 && m.song2 && !m.winner;
                      return (
                        <div
                          key={mIdx}
                          onClick={() => {
                            if (isLive && onOpenMatchup) onOpenMatchup(index, mIdx);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 10px',
                            borderRadius: 10,
                            background: isLive ? '#fffbeb' : '#ffffff',
                            border: isLive ? '1.5px solid #f59e0b' : '1px solid #e5e7eb',
                            cursor: isLive ? 'pointer' : 'default',
                          }}
                        >
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <TreeNode
                              song={m.song1}
                              status={slotStatus(m, 'song1', isLive, totalRounds, index, isFuture)}
                              highlight={isLive}
                            />
                            <TreeNode
                              song={m.song2}
                              status={slotStatus(m, 'song2', isLive, totalRounds, index, isFuture)}
                              highlight={isLive}
                            />
                          </div>
                          {isLive && (
                            <div style={{
                              padding: '4px 10px', borderRadius: 12,
                              background: '#a855f7', color: '#ffffff',
                              fontSize: 11, fontWeight: 500, flexShrink: 0,
                            }}>Vote</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pinned "Your turn" CTA */}
          {showCTA && (
            <div style={{
              borderTop: '1px solid #e5e7eb',
              padding: '10px 14px',
              background: '#ffffff',
              display: 'flex', alignItems: 'center', gap: 10,
              flexShrink: 0,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 4,
                background: '#a855f7',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                  Your turn — {getRoundLabel(liveRound, totalRounds)} matchup {liveMatchupIdx + 1}
                </div>
                <div style={{
                  fontSize: 11, color: '#6b7280',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {liveMatchup.song1.name} vs {liveMatchup.song2.name}
                </div>
              </div>
              <button
                onClick={() => onOpenMatchup?.(liveRound, liveMatchupIdx)}
                style={{
                  padding: '6px 14px', borderRadius: 14,
                  background: '#a855f7', color: '#ffffff',
                  border: 'none', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', flexShrink: 0,
                }}
              >Vote →</button>
            </div>
          )}

          {isComplete && (
            <div style={{
              borderTop: '1px solid #e5e7eb',
              padding: '10px 14px',
              background: '#fffbeb',
              fontSize: 12, color: '#78350f', textAlign: 'center',
              flexShrink: 0,
            }}>
              ♛ Bracket complete — {bracket.winner?.name} crowned
            </div>
          )}
        </div>
      </div>
    </>
  );
}
