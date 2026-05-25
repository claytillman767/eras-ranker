import { useState, useEffect, useRef } from 'react';
import { getEraColors } from '../../constants/eraColors';

const STYLE = `
@keyframes tree-live-pulse {
  0%, 100% { box-shadow: 0 0 0 2px #f59e0b, 0 0 0 4px rgba(245,158,11,0.18); }
  50%      { box-shadow: 0 0 0 2px #f59e0b, 0 0 0 7px rgba(245,158,11,0.05); }
}
`;

function getRoundLabel(roundIndex, totalRounds) {
  const remaining = totalRounds - roundIndex;
  if (remaining === 1) return 'Final';
  if (remaining === 2) return 'Semi-Final';
  return `Round ${roundIndex + 1}`;
}

// "R1 · 16 → 8" sub-label for the column header.
function getRoundSubLabel(roundIndex, totalRounds) {
  const songsIn  = Math.pow(2, totalRounds - roundIndex);
  const songsOut = songsIn / 2;
  if (songsOut < 1) return '';
  return `${songsIn} → ${songsOut}`;
}

function TreeNode({ song, status, highlight, small, width }) {
  // status: 'won' | 'lost' | 'pending' | 'live' | 'tbd'
  // 'pending' = song is here but matchup not yet played → show in color
  // 'tbd'     = slot not yet filled (no song)           → show gray placeholder
  const colors = song ? getEraColors(song.albumId) : null;
  const isLost = status === 'lost';
  const isTbd  = status === 'tbd';
  const isLive = status === 'live';

  const w = width !== undefined ? width : (small ? 100 : 120);
  const h = small ? 30 : 36;

  const hasColor = colors && !isTbd;

  let background = 'var(--surface)';
  if (hasColor) {
    background = `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;
  } else if (isTbd) {
    background = 'var(--surface-2)';
  }

  return (
    <div style={{
      width: w,
      height: h,
      borderRadius: 8,
      background,
      border: isTbd ? '1px dashed var(--control-off)' : '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '0 8px',
      opacity: isLost ? 0.4 : 1,
      position: 'relative',
      animation: isLive ? 'tree-live-pulse 1.4s ease-in-out infinite' : undefined,
      boxShadow: highlight && !isLive ? '0 0 0 2px #f59e0b' : undefined,
    }}>
      {hasColor ? (
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
          background: 'var(--surface-3)',
          border: '1px dashed var(--control-off)',
          flexShrink: 0,
        }} />
      )}
      <span style={{
        fontSize: small ? 10 : 11,
        fontWeight: 500,
        color: hasColor ? colors.text : 'var(--text-3)',
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

  const liveRound = bracket.currentRound;
  const liveMatchupIdx = bracket.currentMatchupIndex;
  const liveMatchup = bracket.rounds[liveRound]?.[liveMatchupIdx] || null;
  const isComplete = bracket.status === 'complete';

  // Which round is currently "expanded" in the tree view (wider, full song
  // names visible). Defaults to the live round; clicking a round header
  // overrides. Snaps back to the new live round when the bracket advances.
  const [expandedRound, setExpandedRound] = useState(liveRound);
  useEffect(() => {
    setExpandedRound(liveRound);
  }, [liveRound]);

  const COL_W_EXPANDED = 200;
  const COL_W_COMPRESSED = 78;
  const COL_GAP = 14;
  const colWidth = (idx) => idx === expandedRound ? COL_W_EXPANDED : COL_W_COMPRESSED;

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

  // Auto-scroll the tree viewport so the expanded column is visible.
  const scrollerRef = useRef(null);
  useEffect(() => {
    if (!scrollerRef.current) return;
    let leftOffset = 0;
    for (let i = 0; i < expandedRound; i++) {
      leftOffset += COL_W_COMPRESSED + COL_GAP;
    }
    scrollerRef.current.scrollTo({
      left: Math.max(0, leftOffset - 16),
      behavior: 'smooth',
    });
  }, [expandedRound]);

  // Derive spacing so each round's pairs are vertically centered between the two
  // source pairs from the previous round — gives a proper bracket fan.
  // nodeH=30 (small), intraGap=2, pairH=62, baseGap=10 → slotH doubles each round.
  function computeRoundLayout(r) {
    const pairH = 62; // nodeH*2 + intraGap = 30*2 + 2
    let slotH = 72;   // pairH + baseGap = 62 + 10
    let paddingTop = 0;
    for (let i = 0; i < r; i++) {
      paddingTop += slotH / 2;
      slotH *= 2;
    }
    return { interGap: slotH - pairH, paddingTop };
  }

  const showCTA = !isComplete && liveMatchup &&
    liveMatchup.song1 && liveMatchup.song2 && !liveMatchup.winner;

  return (
    <>
      <style>{STYLE}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--bg)',
        maxWidth: 700, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: 'var(--text)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{weekLabel}</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 26, height: 26, borderRadius: 13,
              border: '1px solid var(--text)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: 'var(--text)', padding: 0, lineHeight: 1,
            }}
          >✕</button>
        </div>

        {/* "Your turn" CTA — pinned at the top */}
        {showCTA && (
          <div style={{
            borderBottom: '1px solid var(--border)',
            padding: '10px 14px',
            background: 'var(--surface)',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 4,
              background: 'var(--brand)',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                Your turn — {getRoundLabel(liveRound, totalRounds)} matchup {liveMatchupIdx + 1}
              </div>
              <div style={{
                fontSize: 11, color: 'var(--text-2)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {liveMatchup.song1.name} vs {liveMatchup.song2.name}
              </div>
            </div>
            <button
              onClick={() => onOpenMatchup?.(liveRound, liveMatchupIdx)}
              style={{
                padding: '8px 16px', borderRadius: 16,
                background: 'var(--brand)', color: '#ffffff',
                border: 'none', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', flexShrink: 0,
              }}
            >Vote Now</button>
          </div>
        )}

        {/* Body */}
        <div style={{
          flex: 1, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>

            <div
              ref={scrollerRef}
              style={{
                flex: 1, overflowX: 'auto', overflowY: 'auto',
                padding: '8px 16px 16px',
              }}
            >
              <div style={{
                display: 'flex', gap: COL_GAP,
                minWidth:
                  COL_W_EXPANDED +
                  (totalRounds - 1) * COL_W_COMPRESSED +
                  (totalRounds - 1) * COL_GAP,
              }}>
                {columns.map(({ round, isFuture, index }) => {
                  const isExpanded = index === expandedRound;
                  const w = colWidth(index);
                  return (
                    <div key={index} style={{
                      display: 'flex', flexDirection: 'column', gap: 8,
                      flexShrink: 0,
                      width: w,
                    }}>
                      <button
                        onClick={() => setExpandedRound(index)}
                        title={isExpanded ? 'Currently showing full names' : 'Tap to expand this round'}
                        style={{
                          appearance: 'none',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          margin: 0,
                          fontFamily: 'inherit',
                          fontSize: 9,
                          color: isExpanded ? 'var(--text)' : 'var(--text-3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontWeight: isExpanded ? 700 : 600,
                          textAlign: 'left',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%',
                          borderBottom: isExpanded
                            ? '1px solid var(--text)'
                            : '1px dashed transparent',
                          paddingBottom: 2,
                        }}
                      >
                        {getRoundLabel(index, totalRounds)}
                        {getRoundSubLabel(index, totalRounds) && (
                          <span style={{ marginLeft: 6, opacity: 0.7 }}>
                            · {getRoundSubLabel(index, totalRounds)}
                          </span>
                        )}
                      </button>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: computeRoundLayout(index).interGap,
                        paddingTop: computeRoundLayout(index).paddingTop,
                      }}>
                        {round.map((m, mIdx) => {
                          const isLive = !isFuture &&
                            index === liveRound && mIdx === liveMatchupIdx &&
                            m.song1 && m.song2 && !m.winner;
                          const isLastRound = index === totalRounds - 1;
                          return (
                            <div
                              key={mIdx}
                              onClick={() => {
                                if (isLive && onOpenMatchup) onOpenMatchup(index, mIdx);
                              }}
                              style={{
                                display: 'flex', flexDirection: 'column', gap: 2,
                                cursor: isLive ? 'pointer' : 'default',
                                position: 'relative',
                              }}
                            >
                              <TreeNode
                                song={m.song1}
                                status={slotStatus(m, 'song1', isLive, totalRounds, index, isFuture)}
                                highlight={isLive}
                                small
                                width={w}
                              />
                              <TreeNode
                                song={m.song2}
                                status={slotStatus(m, 'song2', isLive, totalRounds, index, isFuture)}
                                highlight={isLive}
                                small
                                width={w}
                              />
                              {/* Bracket connector lines into the next round */}
                              {!isLastRound && (
                                <>
                                  {/* Horizontal stub from upper box (centered on its row) */}
                                  <div style={{
                                    position: 'absolute', pointerEvents: 'none',
                                    right: -7, top: 15,
                                    width: 7, height: 1,
                                    background: 'var(--control-off)',
                                  }} />
                                  {/* Horizontal stub from lower box */}
                                  <div style={{
                                    position: 'absolute', pointerEvents: 'none',
                                    right: -7, bottom: 15,
                                    width: 7, height: 1,
                                    background: 'var(--control-off)',
                                  }} />
                                  {/* Vertical line connecting the two stubs */}
                                  <div style={{
                                    position: 'absolute', pointerEvents: 'none',
                                    right: -7, top: 15, bottom: 15,
                                    width: 1,
                                    background: 'var(--control-off)',
                                  }} />
                                  {/* Horizontal line from midpoint extending to next column */}
                                  <div style={{
                                    position: 'absolute', pointerEvents: 'none',
                                    right: -14, top: '50%',
                                    width: 7, height: 1,
                                    background: 'var(--control-off)',
                                  }} />
                                </>
                              )}
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
                            fontSize: isExpanded ? 11 : 10,
                            fontStyle: 'italic',
                            color: '#b45309',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
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
              borderTop: '1px solid var(--border)',
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
