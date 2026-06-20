// Custom-bracket results — the champion reveal. Restyled to the weekly arena
// look: navy arena, gold champion eyebrow, big era tile, display-serif winner
// name, gold pill share button, and the full bracket recap.
//
// NOTE: a personal bracket has no other voters, so the old "X% of Swifties
// chose the same winner" stat (which was fabricated) is GONE. We show the real,
// honest runner-up the champion beat in the final instead.

import { useState, useEffect, useRef } from 'react';
import { FeedbackLauncher } from '../FeedbackButton';
import { getEra, getEraColors } from '../../constants/eraColors';
import { BRACKET_CATEGORIES } from '../../constants/bracketCategories';
import { ArenaBg, GoldButton, Eyebrow, SongTile, GOLD_LT, fontUI, fontDisplay } from './weekly/WeeklyParts';

const RESULTS_STYLE = `
@keyframes br-confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes br-winner-reveal {
  0%   { opacity: 0; transform: scale(0.7) translateY(20px); }
  60%  { transform: scale(1.05) translateY(-4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes br-fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

const CONFETTI_COLORS = ['#f5d97a', '#d4af37', '#a855f7', '#ec4899', '#5cc0ef', '#82d39a'];

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    animationDuration: `${2 + (i % 4) * 0.5}s`,
    animationDelay: `${(i % 6) * 0.25}s`,
    size: `${6 + (i % 5) * 2}px`,
  }));
  return (
    <>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'fixed', top: -20, left: p.left,
          width: p.size, height: p.size, borderRadius: 2,
          background: p.background, pointerEvents: 'none', zIndex: 300,
          animation: `br-confetti-fall ${p.animationDuration} ease-in ${p.animationDelay} forwards`,
        }} />
      ))}
    </>
  );
}

// Draw a shareable winner card to a canvas (1080×1080).
function drawResultCard(canvas, bracket, categoryId, categoryNameOverride) {
  if (!canvas || !bracket.winner) return;
  const ctx = canvas.getContext('2d');
  const W = 1080, H = 1080;
  canvas.width = W;
  canvas.height = H;

  const era = getEra(bracket.winner.albumId);
  const colors = getEraColors(bracket.winner.albumId);
  const cat = BRACKET_CATEGORIES.find(c => c.id === categoryId);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#d4af37';
  ctx.fillRect(0, 0, W, 8);
  ctx.fillRect(0, H - 8, W, 8);

  ctx.textAlign = 'center';
  ctx.font = '140px serif';
  ctx.fillText(era.emoji, W / 2, 360);

  ctx.fillStyle = '#f5d97a';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillText((categoryNameOverride || cat?.name || categoryId).toUpperCase(), W / 2, 460);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.fillText('CHAMPION', W / 2, 560);

  ctx.font = 'bold 68px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = colors.secondary || '#f1f5f9';
  const name = bracket.winner.name;
  if (name.length > 22) {
    const mid = name.lastIndexOf(' ', 22);
    ctx.fillText(name.slice(0, mid), W / 2, 660);
    ctx.fillText(name.slice(mid + 1), W / 2, 740);
  } else {
    ctx.fillText(name, W / 2, 700);
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '34px system-ui, -apple-system, sans-serif';
  ctx.fillText(era.name, W / 2, 820);

  ctx.fillStyle = 'rgba(148,163,184,0.6)';
  ctx.font = '28px system-ui, -apple-system, sans-serif';
  ctx.fillText('The Eras Ranker · erasranker.com', W / 2, 1010);
}

// Compact bracket recap — winners highlighted with their era color.
function BracketDiagram({ bracket }) {
  const isRoundComplete = (round) => round.every(m => m.winner !== null);
  const currentRoundIndex = bracket.rounds.findIndex(r => !isRoundComplete(r));
  const hasCurrentRound = currentRoundIndex !== -1;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {bracket.rounds.map((round, ri) => {
        const isCurrent = hasCurrentRound && ri === currentRoundIndex;
        const isFuture = hasCurrentRound && ri > currentRoundIndex;
        const scale = isCurrent ? 1 : isFuture ? 0.65 : 0.85;
        const fontSize = isCurrent ? 12 : 10;
        const padding = isCurrent ? '9px 11px' : '6px 8px';
        const opacity = isFuture ? 0.5 : 1;

        return (
          <div key={ri} style={{ marginBottom: isCurrent ? 22 : 14, opacity, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div style={{
              fontSize: isCurrent ? 12 : 10, fontWeight: 700,
              color: isCurrent ? GOLD_LT : 'rgba(255,255,255,0.4)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: isCurrent ? 10 : 6,
            }}>
              {ri === bracket.rounds.length - 1 ? 'Final' : `Round ${ri + 1}`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isCurrent ? 8 : 5 }}>
              {round.map((m, mi) => (
                <div key={mi} style={{ display: 'flex', gap: isCurrent ? 8 : 4, alignItems: 'center' }}>
                  {[m.song1, m.song2].map((song, si) => {
                    const isWinner = m.winner && song &&
                      m.winner.albumId === song.albumId && m.winner.songIndex === song.songIndex;
                    const isPlaceholder = !song || !song.name;
                    const era = song ? getEra(song.albumId) : null;
                    return (
                      <div key={si} style={{
                        flex: 1, padding, borderRadius: 8, fontSize,
                        background: isWinner ? `linear-gradient(135deg, ${era.tile}, ${era.deep})`
                          : 'rgba(255,255,255,0.05)',
                        border: isWinner ? `1px solid ${era.tile}` : '1px solid rgba(255,255,255,0.08)',
                        fontWeight: isWinner ? 700 : 400,
                        color: isWinner ? '#fff' : (isPlaceholder ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)'),
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {isWinner && '♛ '}{isPlaceholder ? '?' : song.name}
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
    const t1 = setTimeout(() => setEntered(true), 100);
    const t2 = setTimeout(() => setShowConfetti(false), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (canvasRef.current && bracket.winner) {
      drawResultCard(canvasRef.current, bracket, categoryId, bracket.customCategoryName);
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
  const era = getEra(winner.albumId);
  const bracketName = bracket.customCategoryName || cat?.name || 'Bracket';

  // Real runner-up: the song the champion beat in the final.
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  const finalMatch = finalRound && finalRound.length === 1 ? finalRound[0] : null;
  const runnerUp = finalMatch
    ? ((finalMatch.song1 && finalMatch.song1.albumId === winner.albumId && finalMatch.song1.songIndex === winner.songIndex)
        ? finalMatch.song2 : finalMatch.song1)
    : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      maxWidth: 700, margin: '0 auto',
      color: '#fff', fontFamily: fontUI, overflowY: 'auto',
    }}>
      <style>{RESULTS_STYLE}</style>
      {showConfetti && <Confetti />}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <ArenaBg />

      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 5 }}>
        <FeedbackLauncher variant="overlay" />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        padding: '52px 22px 40px', maxWidth: 460, margin: '0 auto',
        opacity: entered ? 1 : 0, transform: entered ? 'none' : 'scale(0.96)',
        transition: 'all 0.5s ease',
      }}>

        {/* Champion reveal */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-block', animation: 'br-winner-reveal 0.6s ease-out both' }}>
            <SongTile song={winner} size={92} glow />
          </div>
          <div style={{ marginTop: 14, animation: 'br-fade-in 0.4s ease 0.2s both' }}>
            <Eyebrow color={GOLD_LT}>✦ {bracket.emoji ? `${bracket.emoji} ` : ''}{bracketName} champion ✦</Eyebrow>
          </div>
          <div style={{
            fontFamily: fontDisplay, fontSize: 34, lineHeight: 1.1, letterSpacing: -0.4,
            marginTop: 10, animation: 'br-winner-reveal 0.6s ease-out 0.1s both',
          }}>
            {winner.name}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6, animation: 'br-fade-in 0.4s ease 0.3s both' }}>
            {era.name}
          </div>
          {runnerUp && runnerUp.name && (
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.42)', marginTop: 12, animation: 'br-fade-in 0.4s ease 0.4s both' }}>
              crowned over <span style={{ color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>{runnerUp.name}</span> in the final
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ animation: 'br-fade-in 0.4s ease 0.5s both', marginBottom: 30 }}>
          <GoldButton full onClick={handleShare}>Share result 📲</GoldButton>
          <button
            onClick={onTryAnother}
            style={{
              width: '100%', marginTop: 10, padding: '13px', borderRadius: 999,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontFamily: fontUI, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >Back to brackets</button>
        </div>

        {/* Full bracket recap */}
        <div style={{ animation: 'br-fade-in 0.4s ease 0.6s both' }}>
          <Eyebrow color="rgba(255,255,255,0.5)">Full bracket</Eyebrow>
          <div style={{ marginTop: 12 }}>
            <BracketDiagram bracket={bracket} />
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 22, padding: '11px',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.4)', fontFamily: fontUI, fontSize: 13, cursor: 'pointer',
            animation: 'br-fade-in 0.4s ease 0.7s both',
          }}
        >Done →</button>
      </div>
    </div>
  );
}
