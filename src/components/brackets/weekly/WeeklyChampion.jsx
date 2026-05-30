// Weekly bracket — Champion Crowning (animated replay) + Share card.
// Recreated from design_handoff_weekly_bracket/champion.jsx.
//
//  • ChampionScreen (default export) — the Sunday-night finale: an animated
//    bracket replay (16 → 8 → 4 → 2 → 1 with tumble-and-fade knockouts)
//    culminating in the crown, then title + Crowd Match + CTAs slide up.
//  • drawWeeklyChampionCard(ctx, data) — the 1080×1080 SHARE image, rendered
//    on a <canvas> (NOT a DOM node) so it can be exported via toDataURL, the
//    same pattern as RankingCard.jsx's drawCard. The "Share my week" button
//    generates + downloads it.
//
// Inputs are the resolved community bracket (rounds from computeCommunityBracket)
// + the user's Crowd Match. A "song" is { name, albumId, songIndex }.

import { useEffect, useRef, useState, useMemo } from 'react';
import { FeedbackLauncher } from '../../FeedbackButton';
import { getEra } from '../../../constants/eraColors';
import {
  ArenaBg, SongTile, Eyebrow,
  ARENA_BG, GOLD, GOLD_LT, PURPLE, PURPLE_DEEP, fontUI, fontDisplay,
} from './WeeklyParts';

const songKey = (s) => (s ? `${s.albumId}_${s.songIndex}` : '');

// ── Canvas helpers (mirrors RankingCard.jsx) ─────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function fitFontSize(ctx, text, makeFont, maxWidth, start, min = 28, step = 3) {
  let size = start;
  while (size > min) { ctx.font = makeFont(size); if (ctx.measureText(text).width <= maxWidth) break; size -= step; }
  return size;
}
function truncate(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t + '…';
}
function drawTileCanvas(ctx, x, y, size, era, ring = false) {
  const r = size * 0.22;
  if (ring) {
    const pad = Math.max(4, size * 0.05);
    const rg = ctx.createLinearGradient(x - pad, y - pad, x + size + pad, y + size + pad);
    rg.addColorStop(0, GOLD_LT); rg.addColorStop(0.5, GOLD); rg.addColorStop(1, GOLD_LT);
    rrect(ctx, x - pad, y - pad, size + pad * 2, size + pad * 2, r + pad);
    ctx.fillStyle = rg; ctx.fill();
  }
  const g = ctx.createLinearGradient(x, y, x + size, y + size);
  g.addColorStop(0, era.tile); g.addColorStop(1, era.deep);
  rrect(ctx, x, y, size, size, r);
  ctx.fillStyle = g; ctx.fill();
  // gloss
  const gloss = ctx.createRadialGradient(x + size * 0.25, y, 0, x + size * 0.25, y, size * 0.8);
  gloss.addColorStop(0, 'rgba(255,255,255,0.25)'); gloss.addColorStop(0.55, 'rgba(255,255,255,0)');
  rrect(ctx, x, y, size, size, r);
  ctx.fillStyle = gloss; ctx.fill();
  // emoji
  ctx.font = `${Math.round(size * 0.5)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(era.emoji, x + size / 2, y + size / 2 + size * 0.02);
  ctx.textBaseline = 'alphabetic';
}

// ── 1080×1080 share card (Canvas) ────────────────────────────────────────────
export function drawWeeklyChampionCard(ctx, {
  weekNumber = 14,
  categoryName = 'Best Bridge',
  champion, championPct = 61,
  runnerUp, runnerUpPct = 39,
  crowdMatchPct = 87, crowdMatchTier = 'Mostly with the crowd',
  crowdMatchMatched, crowdMatchTotal,
}) {
  const W = 1080, H = 1080;
  const champEra = getEra(champion.albumId);
  const runnerEra = runnerUp ? getEra(runnerUp.albumId) : champEra;

  // Background — arena gradient (≈135°)
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1a2e'); bg.addColorStop(0.55, '#16213e'); bg.addColorStop(1, '#0f3460');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const spot = ctx.createRadialGradient(W / 2, 120, 0, W / 2, 120, 760);
  spot.addColorStop(0, 'rgba(245,217,122,0.22)'); spot.addColorStop(1, 'rgba(245,217,122,0)');
  ctx.fillStyle = spot; ctx.fillRect(0, 0, W, H);

  // ── 1. Brand band ──
  ctx.beginPath(); ctx.arc(56 + 18, 43, 18, 0, Math.PI * 2); ctx.fillStyle = PURPLE; ctx.fill();
  ctx.font = '800 22px system-ui, sans-serif'; ctx.fillStyle = '#fff';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('♪', 56 + 12, 44);
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText('ERAS RANKER', 56 + 44, 44);
  ctx.font = '700 16px system-ui, sans-serif'; ctx.fillStyle = GOLD_LT; ctx.textAlign = 'right';
  ctx.fillText(`WEEK ${weekNumber} · ${categoryName.toUpperCase()}`, W - 56, 44);
  ctx.strokeStyle = 'rgba(212,175,55,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 86); ctx.lineTo(W, 86); ctx.stroke();
  ctx.textBaseline = 'alphabetic';

  // ── 2. Hero champion ──
  ctx.textAlign = 'center';
  ctx.font = '800 22px system-ui, sans-serif'; ctx.fillStyle = GOLD_LT;
  const eyebrow = 'THIS WEEK’S CHAMPION';
  const ew = ctx.measureText(eyebrow).width;
  ctx.fillText(eyebrow, W / 2, 150);
  ctx.strokeStyle = `${GOLD_LT}55`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - ew / 2 - 76, 145); ctx.lineTo(W / 2 - ew / 2 - 16, 145); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 + ew / 2 + 16, 145); ctx.lineTo(W / 2 + ew / 2 + 76, 145); ctx.stroke();

  // crown + tile
  ctx.font = '56px serif'; ctx.fillText('👑', W / 2, 210);
  drawTileCanvas(ctx, W / 2 - 64, 226, 128, champEra, true);

  // champion name
  const nameSize = fitFontSize(ctx, champion.name, s => `400 ${s}px Georgia, serif`, W - 200, 84, 36, 4);
  ctx.font = `400 ${nameSize}px Georgia, serif`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText(champion.name, W / 2, 410 + nameSize * 0.34);
  ctx.font = '700 17px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(`FROM ${champEra.name.toUpperCase()}`, W / 2, 452);

  // ── 3. The deciding two ──
  const cardX = 60, cardY = 476, cardW = W - 120, cardH = 250;
  rrect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill();
  rrect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke();

  ctx.font = '800 13px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center'; ctx.fillText('HOW THE FINAL WENT DOWN', W / 2, cardY + 30);

  // winner row
  const wRowY = cardY + 52;
  drawTileCanvas(ctx, cardX + 30, wRowY, 64, champEra, true);
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
  ctx.font = `400 ${fitFontSize(ctx, champion.name, s => `400 ${s}px Georgia, serif`, cardW - 320, 34, 20, 2)}px Georgia, serif`;
  ctx.fillText(truncate(ctx, champion.name, cardW - 320), cardX + 116, wRowY + 30);
  ctx.font = '700 12px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`👑 WINNER · ${champEra.name.toUpperCase()}`, cardX + 116, wRowY + 54);
  ctx.font = '400 64px Georgia, serif'; ctx.fillStyle = GOLD_LT; ctx.textAlign = 'right';
  ctx.fillText(`${championPct}%`, cardX + cardW - 28, wRowY + 48);

  // score bar
  const barY = cardY + 134, barX = cardX + 28, barW = cardW - 56, barH = 14;
  rrect(ctx, barX, barY, barW, barH, 7); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
  const goldW = barW * (championPct / 100);
  const gb = ctx.createLinearGradient(barX, 0, barX + goldW, 0);
  gb.addColorStop(0, GOLD_LT); gb.addColorStop(1, GOLD);
  rrect(ctx, barX, barY, goldW, barH, 7); ctx.fillStyle = gb; ctx.fill();
  rrect(ctx, barX + goldW, barY, barW - goldW, barH, 7); ctx.fillStyle = `${runnerEra.tile}99`; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(barX + goldW - 1, barY - 3, 2, barH + 6);

  // runner-up row
  const rRowY = cardY + 168;
  ctx.globalAlpha = 0.7;
  drawTileCanvas(ctx, cardX + 30, rRowY, 64, runnerEra, false);
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = `400 ${fitFontSize(ctx, runnerUp ? runnerUp.name : '', s => `400 ${s}px Georgia, serif`, cardW - 320, 34, 20, 2)}px Georgia, serif`;
  ctx.fillText(truncate(ctx, runnerUp ? runnerUp.name : '', cardW - 320), cardX + 116, rRowY + 30);
  ctx.font = '700 12px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(`RUNNER-UP · ${runnerEra.name.toUpperCase()}`, cardX + 116, rRowY + 54);
  ctx.font = '400 64px Georgia, serif'; ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.textAlign = 'right';
  ctx.fillText(`${runnerUpPct}%`, cardX + cardW - 28, rRowY + 48);
  ctx.globalAlpha = 1;

  // ── 4. Crowd Match ──
  const cmY = 766, cmX = 60, cmW = W - 120, cmH = 150;
  const cmg = ctx.createLinearGradient(cmX, cmY, cmX + cmW, cmY + cmH);
  cmg.addColorStop(0, 'rgba(168,85,247,0.22)'); cmg.addColorStop(0.55, 'rgba(124,58,237,0.12)'); cmg.addColorStop(1, 'rgba(212,175,55,0.16)');
  rrect(ctx, cmX, cmY, cmW, cmH, 26); ctx.fillStyle = cmg; ctx.fill();
  rrect(ctx, cmX, cmY, cmW, cmH, 26); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.stroke();
  // badge
  const badge = 120, bx = cmX + 22, by = cmY + (cmH - badge) / 2;
  const bg2 = ctx.createLinearGradient(bx, by, bx + badge, by + badge);
  bg2.addColorStop(0, PURPLE); bg2.addColorStop(1, PURPLE_DEEP);
  rrect(ctx, bx, by, badge, badge, 24); ctx.fillStyle = bg2; ctx.fill();
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.font = '400 56px Georgia, serif'; ctx.fillText(`${crowdMatchPct}%`, bx + badge / 2, by + badge / 2 + 6);
  ctx.font = '800 11px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('CROWD MATCH', bx + badge / 2, by + badge - 18);
  // text
  const tx = bx + badge + 26;
  ctx.textAlign = 'left';
  ctx.font = 'italic 400 32px Georgia, serif'; ctx.fillStyle = '#fff';
  ctx.fillText(truncate(ctx, `“${crowdMatchTier}.”`, cmW - badge - 70), tx, cmY + 56);
  ctx.font = '400 17px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.72)';
  const frac = (crowdMatchMatched != null && crowdMatchTotal != null) ? ` — ${crowdMatchMatched} of ${crowdMatchTotal} went my way.` : '';
  ctx.fillText(truncate(ctx, `How my picks matched the crowd${frac}`, cmW - badge - 70), tx, cmY + 88);
  ctx.fillStyle = GOLD_LT; ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillText('What’s yours?', tx, cmY + 114);

  // ── 5. CTA band ──
  const ctaY = H - 96;
  const cta = ctx.createLinearGradient(0, 0, W, 0);
  cta.addColorStop(0, GOLD); cta.addColorStop(0.5, GOLD_LT); cta.addColorStop(1, GOLD);
  ctx.fillStyle = cta; ctx.fillRect(0, ctaY, W, 96);
  ctx.textBaseline = 'middle';
  ctx.font = '800 22px system-ui, sans-serif'; ctx.fillStyle = '#2a1d00'; ctx.textAlign = 'right';
  ctx.fillText('PLAY THIS WEEK →', W / 2 - 24, ctaY + 48);
  ctx.fillStyle = 'rgba(42,29,0,0.3)'; ctx.fillRect(W / 2 - 1, ctaY + 28, 2, 40);
  ctx.font = 'italic 400 44px Georgia, serif'; ctx.fillStyle = '#1a0e00'; ctx.textAlign = 'left';
  ctx.fillText('erasranker.com', W / 2 + 24, ctaY + 50);
  ctx.textBaseline = 'alphabetic';
}

// Generate + download the share PNG.
export function downloadWeeklyChampionCard(data) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  drawWeeklyChampionCard(ctx, data);
  const link = document.createElement('a');
  link.download = `eras-week-${data.weekNumber || ''}-champion.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function Confetti({ count = 36 }) {
  const palette = ['#f5d97a', '#d4af37', '#a855f7', '#fff', '#fb923c', '#ec4899', '#22c55e'];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      {Array.from({ length: count }).map((_, i) => {
        const x = (i * 67) % 100, y = (i * 41) % 90, rot = (i * 31) % 360;
        const w = 4 + ((i * 7) % 6), h = 8 + ((i * 11) % 10), c = palette[i % palette.length];
        return <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${4 + y}%`, width: w, height: h, borderRadius: 1, background: c, transform: `rotate(${rot}deg)`, opacity: 0.85 }} />;
      })}
    </div>
  );
}

// ── Animated champion replay ─────────────────────────────────────────────────
const TIMES = { introEnd: 500, r1End: 2000, r2End: 3300, r3End: 4500, finalEnd: 6300, crownIn: 7000, titleIn: 7600, statsIn: 8300, ctasIn: 9000, holdEnd: 14500 };

export default function WeeklyChampion({
  weekNumber = 14,
  categoryName = 'Best Bridge',
  rounds = [],
  crowdMatch = { pct: null, tier: '', matched: 0, total: 0 },
  streakWeeks = 0,
  onClose, onSeeBracket, onShare,
}) {
  // Derive the bracket structure from the community rounds.
  const model = useMemo(() => {
    if (!rounds.length) return null;
    const sixteen = [];
    rounds[0].forEach(m => { sixteen.push(m.song1, m.song2); });
    const winnersOf = (r) => (rounds[r] || []).map(m => m.winner).filter(Boolean);
    const adv8 = winnersOf(0), adv4 = winnersOf(1), adv2 = winnersOf(2);
    const finalRound = rounds[rounds.length - 1];
    const champion = finalRound ? finalRound[0].winner : sixteen[0];
    const champKey = songKey(champion);
    const finalM = finalRound ? finalRound[0] : null;
    const championPct = finalM ? Math.max(finalM.song1Pct, finalM.song2Pct) : 0;
    const runnerUp = finalM ? (finalM.winnerIndex === 0 ? finalM.song2 : finalM.song1) : null;
    const runnerUpPct = finalM ? Math.min(finalM.song1Pct, finalM.song2Pct) : 0;
    const elim = {};
    sixteen.forEach(s => {
      const k = songKey(s);
      if (k === champKey) elim[k] = null;
      else if (adv2.some(x => songKey(x) === k)) elim[k] = 4;
      else if (adv4.some(x => songKey(x) === k)) elim[k] = 3;
      else if (adv8.some(x => songKey(x) === k)) elim[k] = 2;
      else elim[k] = 1;
    });
    return { sixteen, adv8, adv4, adv2, champion, champKey, championPct, runnerUp, runnerUpPct, elim };
  }, [rounds]);

  const [t, setT] = useState(0);
  useEffect(() => {
    if (!model) return;
    let raf, start = performance.now();
    function tick(now) {
      let e = now - start;
      if (e > TIMES.holdEnd) { start = now; e = 0; }
      setT(e);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [model]);

  if (!model) return null;
  const { sixteen, adv8, adv4, adv2, champion, champKey, championPct, runnerUp, runnerUpPct, elim } = model;

  let phase = 'intro', phaseIdx = 0;
  if (t >= TIMES.finalEnd) { phase = 'crown'; phaseIdx = 5; }
  else if (t >= TIMES.r3End) { phase = 'final'; phaseIdx = 4; }
  else if (t >= TIMES.r2End) { phase = 'r3'; phaseIdx = 3; }
  else if (t >= TIMES.r1End) { phase = 'r2'; phaseIdx = 2; }
  else if (t >= TIMES.introEnd) { phase = 'r1'; phaseIdx = 1; }

  const idxIn = (arr, k) => arr.findIndex(x => songKey(x) === k);
  const phasePos = (k, p) => {
    if (p === 'crown') return k === champKey ? { x: 0, y: 0, size: 168 } : phasePos(k, 'final');
    if (p === 'final') { const i = idxIn(adv2, k); if (i >= 0) return { x: (i === 0 ? -62 : 62), y: 0, size: 100 }; return phasePos(k, 'r3'); }
    if (p === 'r3') { const i = idxIn(adv4, k); if (i >= 0) { const col = i % 2, row = Math.floor(i / 2); return { x: (col - 0.5) * 100, y: (row - 0.5) * 100, size: 80 }; } return phasePos(k, 'r2'); }
    if (p === 'r2') { const i = idxIn(adv8, k); if (i >= 0) { const col = i % 4, row = Math.floor(i / 4); return { x: (col - 1.5) * 72, y: (row - 0.5) * 80, size: 60 }; } return phasePos(k, 'r1'); }
    const i = sixteen.findIndex(x => songKey(x) === k); const col = i % 4, row = Math.floor(i / 4);
    return { x: (col - 1.5) * 64, y: (row - 1.5) * 64, size: 50 };
  };

  const phaseLabels = { intro: '', r1: 'Round 1 · 16 contenders', r2: 'Quarters · the elite 8', r3: 'Semis · final 4', final: 'The deciding two', crown: '👑 CHAMPION' };
  const champEra = getEra(champion.albumId);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', color: '#fff', fontFamily: fontUI, overflow: 'hidden' }}>
      <ArenaBg />
      <div style={{
        position: 'absolute', top: -140, left: '50%', transform: 'translateX(-50%)', width: 540, height: 540, borderRadius: '50%',
        background: phase === 'crown' ? 'radial-gradient(circle, rgba(245,217,122,0.42), transparent 65%)' : 'radial-gradient(circle, rgba(212,175,55,0.18), transparent 65%)',
        transition: 'background 1.2s', pointerEvents: 'none',
      }} />
      {phase === 'crown' && t > TIMES.crownIn && <Confetti count={36} />}

      <button onClick={onClose} style={{
        position: 'absolute', top: 58, right: 18, zIndex: 5, appearance: 'none', cursor: 'pointer', color: '#fff',
        width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700,
      }}>×</button>
      <div style={{ position: 'absolute', top: 58, left: 18, zIndex: 5 }}>
        <FeedbackLauncher variant="overlay" />
      </div>

      <div style={{ position: 'relative', zIndex: 3, padding: '70px 24px 0', textAlign: 'center' }}>
        <Eyebrow color={GOLD_LT}>Sunday · Week {weekNumber} · {categoryName}</Eyebrow>
        <div key={phase} style={{
          marginTop: 14, height: 22, fontSize: 13, fontWeight: 800,
          color: phase === 'crown' ? GOLD_LT : 'rgba(255,255,255,0.65)', letterSpacing: 1.6, textTransform: 'uppercase',
          animation: phase !== 'intro' ? 'weeklyFadeUp .5s ease both' : 'none',
        }}>{phaseLabels[phase]}</div>
      </div>

      {/* tile arena */}
      <div style={{ position: 'absolute', top: 160, left: 0, right: 0, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: 0, height: 0 }}>
          {sixteen.map(s => {
            const k = songKey(s);
            const pos = phasePos(k, phase);
            const e = elim[k];
            const lives = e === null || phaseIdx <= e;
            const visible = phase !== 'intro' && lives;
            const isChamp = k === champKey && phase === 'crown';
            const exitRot = (k.charCodeAt(2) % 2 === 0 ? 1 : -1) * (15 + (k.charCodeAt(1) % 10));
            return (
              <div key={k} style={{
                position: 'absolute', left: 0, top: 0, width: pos.size, height: pos.size,
                marginLeft: -pos.size / 2, marginTop: -pos.size / 2,
                transform: visible ? `translate(${pos.x}px, ${pos.y}px) scale(1) rotate(0deg)` : `translate(${pos.x}px, ${pos.y + 70}px) scale(0.15) rotate(${exitRot}deg)`,
                opacity: visible ? 1 : 0,
                transition: 'transform 700ms cubic-bezier(.34,1.32,.64,1), opacity 600ms ease',
                filter: isChamp ? `drop-shadow(0 0 32px ${GOLD}aa)` : 'none', zIndex: isChamp ? 3 : 1,
              }}>
                <div style={{ position: 'relative', borderRadius: pos.size * 0.22, ...(isChamp && { padding: 4, background: `linear-gradient(140deg, ${GOLD_LT}, ${GOLD}, ${GOLD_LT})`, boxShadow: `0 16px 40px ${getEra(s.albumId).tile}66` }) }}>
                  <SongTile song={s} size={isChamp ? pos.size - 8 : pos.size} glow={isChamp} />
                </div>
              </div>
            );
          })}

          <div style={{
            position: 'absolute', left: 0, top: 0, transform: 'translate(-50%, -50%)',
            fontFamily: fontDisplay, fontStyle: 'italic', fontSize: 38, color: GOLD_LT, textShadow: `0 0 18px ${GOLD}aa`,
            opacity: phase === 'final' ? 1 : 0, transition: 'opacity .4s',
            animation: phase === 'final' ? 'weeklyPulseVS 1.2s ease-in-out infinite' : 'none',
          }}>vs</div>

          {phase === 'crown' && t > TIMES.crownIn && (
            <div style={{ position: 'absolute', left: 0, top: -98, fontSize: 56, lineHeight: 1, transform: 'translateX(-50%)', filter: 'drop-shadow(0 6px 14px rgba(212,175,55,0.55))', animation: 'weeklyDropCrown 700ms cubic-bezier(.34,1.7,.64,1) both' }}>👑</div>
          )}
        </div>
      </div>

      {/* replay progress */}
      <div style={{ position: 'absolute', bottom: 40, left: 36, right: 36, zIndex: 2, opacity: phase === 'crown' ? 0 : 1, transition: 'opacity .5s', pointerEvents: 'none' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.42)', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>Replaying week {weekNumber} →</div>
        <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (t / TIMES.crownIn) * 100)}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LT})`, transition: 'width 0.12s linear', boxShadow: `0 0 8px ${GOLD_LT}88` }} />
        </div>
      </div>

      {/* title block */}
      <div style={{
        position: 'absolute', left: 20, right: 20, bottom: 0, zIndex: 4, padding: '0 4px 30px',
        opacity: t >= TIMES.titleIn ? 1 : 0, transform: t >= TIMES.titleIn ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity .55s, transform .55s cubic-bezier(.34,1.4,.64,1)', textAlign: 'center', pointerEvents: t >= TIMES.titleIn ? 'auto' : 'none',
      }}>
        <div style={{ fontFamily: fontDisplay, fontSize: 38, lineHeight: 1.0, letterSpacing: -0.5 }}>{champion.name}</div>
        <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.7, textTransform: 'uppercase' }}>from {champEra.name}</div>

        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 9, padding: '5px 11px', borderRadius: 999, background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.3)' }}>
          <span style={{ fontSize: 10, color: GOLD_LT, fontWeight: 800, letterSpacing: 0.7 }}>FINAL</span>
          <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>{championPct}%</span>
          {runnerUp && <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)' }}>vs {runnerUp.name} · {runnerUpPct}%</span>}
        </div>

        {crowdMatch.pct != null && (
          <div style={{
            marginTop: 12, opacity: t >= TIMES.statsIn ? 1 : 0, transform: t >= TIMES.statsIn ? 'translateY(0)' : 'translateY(14px)',
            transition: 'opacity .5s, transform .5s cubic-bezier(.34,1.4,.64,1)',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '11px 14px',
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(150deg, ${PURPLE}, ${PURPLE_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontDisplay, fontSize: 19, color: '#fff', flexShrink: 0 }}>{crowdMatch.pct}%</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: fontUI, fontWeight: 700, fontSize: 13 }}>Your Crowd Match{crowdMatch.total ? ` · ${crowdMatch.matched} of ${crowdMatch.total}` : ''}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                “{crowdMatch.tier}”{streakWeeks ? <> · streak <b style={{ color: GOLD_LT }}>{streakWeeks} wk{streakWeeks === 1 ? '' : 's'}</b> 🔥</> : null}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', gap: 10, opacity: t >= TIMES.ctasIn ? 1 : 0, transform: t >= TIMES.ctasIn ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity .5s, transform .5s cubic-bezier(.34,1.4,.64,1)' }}>
          <button onClick={onSeeBracket} style={{ flex: 1, appearance: 'none', cursor: 'pointer', padding: '13px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontFamily: fontUI, fontWeight: 700, fontSize: 13.5 }}>See the bracket</button>
          <button onClick={() => {
            downloadWeeklyChampionCard({ weekNumber, categoryName, champion, championPct, runnerUp, runnerUpPct, crowdMatchPct: crowdMatch.pct ?? 0, crowdMatchTier: crowdMatch.tier, crowdMatchMatched: crowdMatch.matched, crowdMatchTotal: crowdMatch.total });
            onShare && onShare();
          }} style={{ flex: 1.4, appearance: 'none', border: 'none', cursor: 'pointer', padding: '13px 12px', borderRadius: 14, background: `linear-gradient(180deg, ${GOLD_LT}, ${GOLD})`, color: '#2a1d00', fontFamily: fontUI, fontWeight: 800, fontSize: 13.5, boxShadow: '0 8px 20px rgba(212,175,55,0.35)' }}>🔗 Share my week</button>
        </div>
      </div>

      <style>{`
        @keyframes weeklyPulseVS { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.18); } }
        @keyframes weeklyDropCrown { 0% { transform: translate(-50%, -70px) scale(0.4); opacity: 0; } 60% { transform: translate(-50%, 6px) scale(1.18); opacity: 1; } 100% { transform: translate(-50%, 0px) scale(1); opacity: 1; } }
        @keyframes weeklyFadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
