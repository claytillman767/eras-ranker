import { useState, useEffect } from 'react';
import { getEraColors } from '../../constants/eraColors';
import { BRACKET_CATEGORIES } from '../../constants/bracketCategories';
import { ALBUMS } from '../../data/albums';

const TREE_STYLE = `
@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

// Bracket tree visualization for in-progress brackets with clickable matchups
function InteractiveBracketTree({ bracket, onMatchupClick, currentRoundIndex, currentMatchupIndex }) {
  const isRoundComplete = (round) => round.every(m => m.winner !== null);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {bracket.rounds.map((round, ri) => {
        const isCurrent = ri === currentRoundIndex;
        const isPast = ri < currentRoundIndex;
        const isFuture = ri > currentRoundIndex;

        const scale = isCurrent ? 1 : isFuture ? 0.65 : 0.8;
        const marginBottom = isCurrent ? 24 : 16;
        const gap = isCurrent ? 10 : 6;
        const fontSize = isCurrent ? 12 : 10;
        const padding = isCurrent ? '10px 12px' : '6px 8px';
        const labelFontSize = isCurrent ? 12 : 10;
        const opacity = isFuture ? 0.5 : 1;

        return (
          <div key={ri} style={{ marginBottom, opacity, transform: `scale(${scale})`, transformOrigin: 'top left', transition: 'all 0.2s ease' }}>
            <div style={{
              fontSize: labelFontSize,
              fontWeight: 700,
              color: isCurrent ? '#d4af37' : '#64748b',
              letterSpacing: '0.08em',
              marginBottom: isCurrent ? 10 : 6,
            }}>
              {ri === bracket.rounds.length - 1 ? 'FINAL' : `ROUND ${ri + 1}`}{isCurrent && ' ← CURRENT'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap }}>
              {round.map((m, mi) => {
                const isCurrentMatchup = isCurrent && mi === currentMatchupIndex;
                const canClick = isCurrent && isRoundComplete(bracket.rounds[ri - 1] || []);

                return (
                  <div
                    key={mi}
                    onClick={() => canClick && onMatchupClick(ri, mi)}
                    style={{
                      display: 'flex',
                      gap: isCurrent ? 8 : 4,
                      alignItems: 'center',
                      cursor: canClick ? 'pointer' : 'default',
                      opacity: isCurrentMatchup ? 1 : canClick ? 0.8 : 1,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (canClick) {
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                    onMouseLeave={e => {
                      if (canClick && !isCurrentMatchup) {
                        e.currentTarget.style.opacity = '0.8';
                      }
                    }}
                  >
                    {[m.song1, m.song2].map((song, si) => {
                      const isWinner = m.winner &&
                        m.winner.albumId === song.albumId &&
                        m.winner.songIndex === song.songIndex;
                      const isPlaceholder = !song.name;
                      const albumColors = getEraColors(song.albumId);

                      return (
                        <div
                          key={si}
                          style={{
                            flex: 1,
                            padding,
                            borderRadius: 8,
                            background: isWinner
                              ? `${albumColors.primary}33`
                              : isPlaceholder
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(255,255,255,0.04)',
                            border: isCurrentMatchup && !isWinner
                              ? `1.5px solid #a855f7`
                              : isWinner
                                ? `1.5px solid ${albumColors.primary}88`
                                : '1.5px solid rgba(255,255,255,0.08)',
                            fontSize,
                            fontWeight: isWinner ? 700 : 400,
                            color: isPlaceholder ? '#334155' : (isWinner ? '#f1f5f9' : '#64748b'),
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            boxShadow: isCurrentMatchup ? '0 0 12px rgba(168,85,247,0.3)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isWinner && '👑 '}{isPlaceholder ? '?' : song.name}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BracketTree({ bracket, onStartVoting, onClose }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => { setTimeout(() => setEntered(true), 50); }, []);

  const currentRoundIndex = bracket.currentRound;
  const currentMatchupIndex = bracket.currentMatchupIndex;
  const totalRounds = Math.log2(bracket.contestants.length);
  const cat = BRACKET_CATEGORIES.find(c => c.id === bracket.categoryId);

  // Vote progress
  const totalVotes = bracket.rounds.reduce((s, r) => s + r.length, 0);
  const castVotes = bracket.rounds.slice(0, currentRoundIndex).reduce((s, r) => s + r.length, 0) + currentMatchupIndex;

  return (
    <>
      <style>{TREE_STYLE}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0f172a',
        zIndex: 200,
        overflowY: 'auto',
        maxWidth: 700,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header with vote button */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          borderBottom: '1px solid rgba(212,175,55,0.2)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', letterSpacing: '0.1em', marginBottom: 4 }}>
              {cat?.name?.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {castVotes} / {totalVotes} votes · Round {currentRoundIndex + 1}/{totalRounds}
            </div>
          </div>
          <button
            onClick={onStartVoting}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              border: 'none',
              borderRadius: 12,
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Vote Now ›
          </button>
        </div>

        {/* Tree content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px',
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : 'translateY(12px)',
          transition: 'all 0.4s ease',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 16, letterSpacing: '0.05em' }}>
            BRACKET PROGRESS · TAP MATCHUP TO VOTE
          </div>
          <InteractiveBracketTree
            bracket={bracket}
            onMatchupClick={onStartVoting}
            currentRoundIndex={currentRoundIndex}
            currentMatchupIndex={currentMatchupIndex}
          />

          <button
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: 32,
              padding: '12px',
              background: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              color: '#64748b',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Back to Brackets
          </button>
        </div>
      </div>
    </>
  );
}
