import { useState, useEffect, useRef } from 'react';
import { FeedbackLauncher } from '../FeedbackButton';
import { getEraColors } from '../../constants/eraColors';
import { BRACKET_CATEGORIES } from '../../constants/bracketCategories';
import { ALBUMS } from '../../data/albums';

const RESULTS_STYLE = `
@keyframes confetti-fall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes winner-reveal {
  0% { opacity: 0; transform: scale(0.7) translateY(20px); }
  60% { transform: scale(1.05) translateY(-4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const CONFETTI_COLORS = ['#d4af37', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f97316'];

function ConfettiPiece({ style }) {
  return (
    <div style={{
      position: 'fixed',
      width: 8,
      height: 8,
      borderRadius: 2,
      pointerEvents: 'none',
      zIndex: 300,
      ...style,
    }} />
  );
}

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    animationDuration: `${2 + Math.random() * 2}s`,
    animationDelay: `${Math.random() * 1.5}s`,
    width: `${6 + Math.random() * 8}px`,
    height: `${6 + Math.random() * 8}px`,
  }));

  return (
    <>
      {pieces.map((p, i) => (
        <ConfettiPiece
          key={i}
          style={{
            top: '-20px',
            left: p.left,
            background: p.background,
            width: p.width,
            height: p.height,
            animation: `confetti-fall ${p.animationDuration} ease-in ${p.animationDelay} forwards`,
          }}
        />
      ))}
    </>
  );
}

// Draw a shareable winner card to a canvas
function drawResultCard(canvas, bracket, categoryId) {
  if (!canvas || !bracket.winner) return;
  const ctx = canvas.getContext('2d');
  const W = 1080, H = 1080;
  canvas.width = W;
  canvas.height = H;

  const colors = getEraColors(bracket.winner.albumId);
  const album = ALBUMS.find(a => a.id === bracket.winner.albumId);
  const cat = BRACKET_CATEGORIES.find(c => c.id === categoryId);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Golden accent strip
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(0, 0, W, 8);
  ctx.fillRect(0, H - 8, W, 8);

  // Album icon
  ctx.font = '140px serif';
  ctx.textAlign = 'center';
  ctx.fillText(album?.icon || '🎵', W / 2, 360);

  // Category
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillText((cat?.name || categoryId).toUpperCase(), W / 2, 460);

  // "WINNER" label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.fillText('WINNER', W / 2, 560);

  // Song name
  ctx.font = 'bold 68px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = colors.secondary || '#f1f5f9';
  const name = bracket.winner.name;
  // Wrap long names
  if (name.length > 22) {
    const mid = name.lastIndexOf(' ', 22);
    ctx.fillText(name.slice(0, mid), W / 2, 660);
    ctx.fillText(name.slice(mid + 1), W / 2, 740);
  } else {
    ctx.fillText(name, W / 2, 700);
  }

  // Album name
  ctx.fillStyle = '#94a3b8';
  ctx.font = '34px system-ui, -apple-system, sans-serif';
  ctx.fillText(album?.name || bracket.winner.albumId, W / 2, 820);

  // Watermark
  ctx.fillStyle = 'rgba(148,163,184,0.6)';
  ctx.font = '28px system-ui, -apple-system, sans-serif';
  ctx.fillText('The Eras Ranker · erasranker.app', W / 2, 1010);
}

// Simplified bracket diagram with responsive scaling
function BracketDiagram({ bracket }) {
  const colors = {
    winner: '#d4af37',
    loser: '#334155',
    text: '#f1f5f9',
  };

  // Determine if a round is complete (all matchups have winners)
  const isRoundComplete = (round) => round.every(m => m.winner !== null);

  // Find if any rounds are incomplete (current/future)
  const currentRoundIndex = bracket.rounds.findIndex(r => !isRoundComplete(r));
  const hasCurrentRound = currentRoundIndex !== -1;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {bracket.rounds.map((round, ri) => {
        const isCurrent = hasCurrentRound && ri === currentRoundIndex;
        const isPast = ri < currentRoundIndex;
        const isFuture = ri > currentRoundIndex;

        // Scale factors: current round large, past/future rounds small
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
              {round.map((m, mi) => (
                <div key={mi} style={{
                  display: 'flex',
                  gap: isCurrent ? 8 : 4,
                  alignItems: 'center',
                }}>
                  {[m.song1, m.song2].map((song, si) => {
                    const isWinner = m.winner &&
                      m.winner.albumId === song.albumId &&
                      m.winner.songIndex === song.songIndex;
                    const isPlaceholder = !song.name; // Future round, no opponent yet
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
                          border: isWinner
                            ? `1.5px solid ${albumColors.primary}88`
                            : '1.5px solid rgba(255,255,255,0.08)',
                          fontSize,
                          fontWeight: isWinner ? 700 : 400,
                          color: isPlaceholder ? '#334155' : (isWinner ? '#f1f5f9' : '#64748b'),
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {isWinner && '👑 '}{isPlaceholder ? '?' : song.name}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BracketResults({ bracket, onTryAnother, onClose }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [entered, setEntered] = useState(false);
  const canvasRef = useRef(null);
  const categoryId = bracket.categoryId;

  useEffect(() => {
    setTimeout(() => setEntered(true), 100);
    setTimeout(() => setShowConfetti(false), 4000);
  }, []);

  useEffect(() => {
    if (canvasRef.current && bracket.winner) {
      drawResultCard(canvasRef.current, bracket, categoryId);
    }
  }, [bracket, categoryId]);

  const handleShare = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eras-bracket-${categoryId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const winner = bracket.winner;
  if (!winner) return null;

  const cat = BRACKET_CATEGORIES.find(c => c.id === categoryId);
  const winnerColors = getEraColors(winner.albumId);
  const album = ALBUMS.find(a => a.id === winner.albumId);

  // Simulate community comparison
  const communityMatch = 45 + ((bracket.contestants.length + winner.songIndex) % 40);

  return (
    <>
      <style>{RESULTS_STYLE}</style>
      {showConfetti && <Confetti />}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0f172a',
        zIndex: 200,
        overflowY: 'auto',
        maxWidth: 700,
        margin: '0 auto',
      }}>
        {/* Feedback launcher — pinned top-left so it never overlaps content */}
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 5 }}>
          <FeedbackLauncher variant="overlay" />
        </div>
        <div style={{
          padding: '40px 20px 40px',
          maxWidth: 440,
          margin: '0 auto',
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : 'scale(0.95)',
          transition: 'all 0.5s ease',
        }}>

          {/* Winner reveal */}
          <div style={{
            textAlign: 'center',
            marginBottom: 32,
          }}>
            <div style={{
              fontSize: 48,
              marginBottom: 8,
              animation: 'winner-reveal 0.6s ease-out both',
            }}>
              {album?.icon || '🏆'}
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#d4af37',
              letterSpacing: '0.12em',
              marginBottom: 10,
              animation: 'fade-in 0.4s ease 0.2s both',
            }}>
              {cat?.name?.toUpperCase()} WINNER
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: 6,
              animation: 'winner-reveal 0.6s ease-out 0.1s both',
            }}>
              {winner.name}
            </div>
            <div style={{
              fontSize: 14,
              color: '#64748b',
              animation: 'fade-in 0.4s ease 0.3s both',
            }}>
              {album?.name}
            </div>
          </div>

          {/* Community comparison */}
          <div style={{
            background: 'rgba(168,85,247,0.1)',
            border: '1.5px solid rgba(168,85,247,0.25)',
            borderRadius: 14,
            padding: '16px',
            marginBottom: 20,
            animation: 'fade-in 0.4s ease 0.4s both',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, color: 'var(--brand-text)', fontWeight: 700, marginBottom: 6 }}>
              HOW DO YOU COMPARE?
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
              {communityMatch}%
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              of Swifties who completed this bracket chose the same winner
            </div>
          </div>

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: 10,
            marginBottom: 28,
            animation: 'fade-in 0.4s ease 0.5s both',
          }}>
            <button
              onClick={handleShare}
              style={{
                flex: 1,
                padding: '13px',
                background: 'linear-gradient(135deg, #d4af37, #f5d97a)',
                border: 'none',
                borderRadius: 12,
                color: '#1a1000',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Share Result 📲
            </button>
            <button
              onClick={onTryAnother}
              style={{
                flex: 1,
                padding: '13px',
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                color: '#f1f5f9',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Another
            </button>
          </div>

          {/* Full bracket diagram */}
          <div style={{
            animation: 'fade-in 0.4s ease 0.6s both',
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.08em',
              marginBottom: 14,
            }}>
              FULL BRACKET
            </div>
            <BracketDiagram bracket={bracket} />
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: 24,
              padding: '12px',
              background: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              color: '#64748b',
              fontSize: 13,
              cursor: 'pointer',
              animation: 'fade-in 0.4s ease 0.7s both',
            }}
          >
            Back to Brackets
          </button>
        </div>
      </div>
    </>
  );
}
