import { ALBUMS, ALL_ALBUMS, SONGS } from '../data/albums';

// ── Canvas helpers ────────────────────────────────────────────────────────────

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }
}

// 4-point sparkle star (matches design's SVG path)
function sparkle(ctx, cx, cy, r) {
  const s = r / 10;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(1.5, -1.5);
  ctx.lineTo(10, 0);
  ctx.lineTo(1.5, 1.5);
  ctx.lineTo(0, 10);
  ctx.lineTo(-1.5, 1.5);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-1.5, -1.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function logoMark(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#a855f7';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  sparkle(ctx, cx, cy, size * 0.28);
}

function fitFontSize(ctx, text, makeFontStr, maxWidth, start, min = 24, step = 4) {
  let size = start;
  while (size > min) {
    ctx.font = makeFontStr(size);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= step;
  }
  return size;
}

function truncate(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t + '…';
}

// ── Card C — Album Spotlight ──────────────────────────────────────────────────
// Fires when ONE album is fully ranked. Shows the album icon, score, and top songs.

export function drawAlbumSpotlightCard(ctx, { name, icon, year, songCount, score }, topSongs) {
  const W = 1080, H = 1080, PAD = 68;

  // Background
  ctx.fillStyle = '#0d0618';
  ctx.fillRect(0, 0, W, H);

  const topGlow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 680);
  topGlow.addColorStop(0, '#2a1a55');
  topGlow.addColorStop(1, 'rgba(13,6,24,0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, H);

  const tileHaloY = 328;
  const tileHalo = ctx.createRadialGradient(W / 2, tileHaloY, 0, W / 2, tileHaloY, 270);
  tileHalo.addColorStop(0, 'rgba(168,85,247,0.35)');
  tileHalo.addColorStop(1, 'rgba(168,85,247,0)');
  ctx.fillStyle = tileHalo;
  ctx.fillRect(0, 0, W, H);

  // Logo lockup (top-left)
  const markSize = 52;
  const markCX = PAD + markSize / 2;
  const markCY = 84;
  logoMark(ctx, markCX, markCY, markSize);

  const textX = markCX + markSize / 2 + 16;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '400 30px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('The Eras Ranker', textX, markCY + 9);

  ctx.font = '500 12px "Courier New", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('ALBUM · COMPLETE', textX, markCY + 28);

  // "✦ Fully Ranked" badge (top-right)
  ctx.font = '500 12px "Courier New", monospace';
  const badgeLabel = '✦  Fully Ranked';
  const badgePadX = 14, badgeH = 34;
  const badgeTextW = ctx.measureText(badgeLabel).width;
  const badgeW = badgeTextW + badgePadX * 2;
  const badgeX = W - PAD - badgeW;
  const badgeY = markCY - badgeH / 2;

  rrect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = 'rgba(168,85,247,0.09)';
  ctx.fill();
  rrect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.strokeStyle = 'rgba(168,85,247,0.33)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#a78bfa';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeLabel, badgeX + badgeW / 2, badgeY + badgeH / 2);
  ctx.textBaseline = 'alphabetic';

  // Album tile
  const tileSize = 360;
  const tileX = (W - tileSize) / 2;
  const tileY = 148;
  const tileR = 28;
  const tileCX = tileX + tileSize / 2;
  const tileCY = tileY + tileSize / 2;

  const tileGrad = ctx.createLinearGradient(tileX, tileY, tileX + tileSize, tileY + tileSize);
  tileGrad.addColorStop(0, '#2a1a4d');
  tileGrad.addColorStop(1, '#150a28');

  ctx.save();
  ctx.shadowColor = 'rgba(168,85,247,0.45)';
  ctx.shadowBlur = 60;
  rrect(ctx, tileX, tileY, tileSize, tileSize, tileR);
  ctx.fillStyle = tileGrad;
  ctx.fill();
  ctx.restore();

  rrect(ctx, tileX, tileY, tileSize, tileSize, tileR);
  ctx.fillStyle = tileGrad;
  ctx.fill();

  // Concentric rings
  for (const [r, alpha] of [[95, 0.12], [155, 0.08], [210, 0.05]]) {
    ctx.beginPath();
    ctx.arc(tileCX, tileCY, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  rrect(ctx, tileX, tileY, tileSize, tileSize, tileR);
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Album emoji
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '168px serif';
  ctx.fillText(icon, tileCX, tileCY + 8);
  ctx.textBaseline = 'alphabetic';

  // Year · song count
  const metaY = tileY + tileSize + 38;
  ctx.font = '500 14px "Courier New", monospace';
  ctx.fillStyle = '#a78bfa';
  ctx.textAlign = 'center';
  ctx.fillText(`${year} · ${songCount} songs`, W / 2, metaY);

  // Album name (italic serif, dynamic font size)
  const nameSize = fitFontSize(
    ctx, name,
    s => `italic 400 ${s}px Georgia, "Times New Roman", serif`,
    W - PAD * 2 - 40, 68, 28
  );
  ctx.font = `italic 400 ${nameSize}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  const nameY = metaY + 18 + Math.round(nameSize * 0.82);
  ctx.fillText(name, W / 2, nameY);

  // Score chip
  const chipTopY = nameY + 20;
  const chipH = 58;
  const chipPadX = 36;

  ctx.font = '500 12px "Courier New", monospace';
  const labelW = ctx.measureText('MY SCORE').width;
  ctx.font = `400 50px Georgia, serif`;
  const scoreStr = String(score);
  const scoreW = ctx.measureText(scoreStr).width;
  ctx.font = `400 22px Georgia, serif`;
  const denomW = ctx.measureText('/100').width;

  const chipInnerW = labelW + 18 + scoreW + 8 + denomW;
  const chipW = chipInnerW + chipPadX * 2;
  const chipX = (W - chipW) / 2;
  const chipMidY = chipTopY + chipH / 2;

  rrect(ctx, chipX, chipTopY, chipW, chipH, chipH / 2);
  ctx.fillStyle = 'rgba(168,85,247,0.13)';
  ctx.fill();
  rrect(ctx, chipX, chipTopY, chipW, chipH, chipH / 2);
  ctx.strokeStyle = 'rgba(168,85,247,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  let tx = chipX + chipPadX;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '500 12px "Courier New", monospace';
  ctx.fillStyle = '#a78bfa';
  ctx.fillText('MY SCORE', tx, chipMidY);
  tx += labelW + 18;

  ctx.font = `400 50px Georgia, serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(scoreStr, tx, chipMidY + 2);
  tx += scoreW + 8;

  ctx.font = `400 22px Georgia, serif`;
  ctx.fillStyle = '#a78bfa';
  ctx.fillText('/100', tx, chipMidY + 2);
  ctx.textBaseline = 'alphabetic';

  // Top songs
  const songsHeaderY = chipTopY + chipH + 26;
  ctx.font = '500 11px "Courier New", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'left';
  ctx.fillText('FAVORITES FROM THIS ALBUM', PAD, songsHeaderY);

  const songs = (topSongs || []).slice(0, 3);
  const songRowH = 52;

  for (let i = 0; i < songs.length; i++) {
    const rowY = songsHeaderY + 14 + i * songRowH;

    ctx.beginPath();
    ctx.moveTo(PAD, rowY);
    ctx.lineTo(W - PAD, rowY);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const rowMidY = rowY + songRowH / 2 + 4;

    ctx.font = '500 13px "Courier New", monospace';
    ctx.fillStyle = '#a78bfa';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`0${i + 1}`, PAD, rowMidY);

    ctx.font = '400 24px Georgia, serif';
    ctx.fillStyle = '#ffffff';
    const songNameMaxW = W - PAD * 2 - 52 - 64;
    ctx.fillText(truncate(ctx, songs[i].name, songNameMaxW), PAD + 44, rowMidY);

    ctx.font = '400 24px Georgia, serif';
    ctx.fillStyle = '#c4b5fd';
    ctx.textAlign = 'right';
    ctx.fillText(String(songs[i].score), W - PAD, rowMidY);
  }
  ctx.textBaseline = 'alphabetic';

  // CTA pill
  const ctaTopY = songsHeaderY + 14 + songs.length * songRowH + 22;
  const ctaH = 58;

  ctx.save();
  ctx.shadowColor = 'rgba(168,85,247,0.45)';
  ctx.shadowBlur = 28;
  rrect(ctx, PAD, ctaTopY, W - PAD * 2, ctaH, ctaH / 2);
  ctx.fillStyle = '#a855f7';
  ctx.fill();
  ctx.restore();

  rrect(ctx, PAD, ctaTopY, W - PAD * 2, ctaH, ctaH / 2);
  ctx.fillStyle = '#a855f7';
  ctx.fill();

  ctx.font = '600 17px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Rank your eras at eras-ranker.vercel.app', W / 2, ctaTopY + ctaH / 2);
  ctx.textBaseline = 'alphabetic';
}

// ── Card D — All Eras Mosaic ──────────────────────────────────────────────────
// Unlocks when ALL 12 albums are fully ranked. Shows every album scored in a grid.

function rankChipColors(score) {
  if (score >= 90) return ['#a855f7', '#7c3aed'];
  if (score >= 85) return ['#9333ea', '#6d28d9'];
  if (score >= 80) return ['#7c3aed', '#5b21b6'];
  if (score >= 75) return ['#6d28d9', '#4c1d95'];
  return ['#5b21b6', '#3b1571'];
}

function drawAlbumChip(ctx, x, y, size, album, rank) {
  const [c1, c2] = rankChipColors(album.score);
  const r = Math.min(18, size * 0.09);

  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  rrect(ctx, x, y, size, size, r);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  rrect(ctx, x, y, size, size, r);
  ctx.fillStyle = grad;
  ctx.fill();

  rrect(ctx, x, y, size, size, r);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Rank pip
  const pipR = Math.max(11, Math.round(size * 0.11));
  const pipX = x + size - pipR - 10;
  const pipY = y + pipR + 10;
  ctx.beginPath();
  ctx.arc(pipX, pipY, pipR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(13,6,24,0.6)';
  ctx.fill();
  ctx.font = `600 ${Math.floor(pipR * 0.9)}px "Courier New", monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(rank), pipX, pipY);

  // Emoji
  const emojiSize = Math.floor(size * 0.44);
  ctx.font = `${emojiSize}px serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(album.icon, x + Math.floor(size * 0.1), y + Math.floor(size * 0.12) + Math.floor(emojiSize * 0.85));

  // Album name
  const nameFs = Math.max(9, Math.floor(size * 0.057));
  ctx.font = `500 ${nameFs}px "Courier New", monospace`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const nameMaxW = size - 20;
  const nameText = truncate(ctx, album.name, nameMaxW);
  ctx.fillText(nameText, x + Math.floor(size * 0.08), y + size - nameFs * 2.4 - 2);

  // Score
  const scoreFs = Math.max(20, Math.floor(size * 0.22));
  ctx.font = `400 ${scoreFs}px Georgia, serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(album.score !== null ? String(album.score) : '—', x + Math.floor(size * 0.08), y + size - 10);

  ctx.textBaseline = 'alphabetic';
}

export function drawMosaicCard(ctx, albumRankings) {
  const W = 1080, H = 1080, PAD = 68;

  // Background
  ctx.fillStyle = '#0d0618';
  ctx.fillRect(0, 0, W, H);

  const bgGlow = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 700);
  bgGlow.addColorStop(0, '#1f1240');
  bgGlow.addColorStop(1, 'rgba(13,6,24,0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, W, H);

  // ── Header ─────────────────────────────────────────────────────────────────
  const headerTop = 60;

  // "✦ All 12 Albums Ranked" badge
  ctx.font = '500 13px "Courier New", monospace';
  const badgeLabel = '✦  All 12 Albums Ranked';
  const badgePadX = 14, badgeH = 34;
  const badgeW = ctx.measureText(badgeLabel).width + badgePadX * 2;

  rrect(ctx, PAD, headerTop, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = 'rgba(168,85,247,0.09)';
  ctx.fill();
  rrect(ctx, PAD, headerTop, badgeW, badgeH, badgeH / 2);
  ctx.strokeStyle = 'rgba(168,85,247,0.33)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#a78bfa';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeLabel, PAD + badgePadX, headerTop + badgeH / 2);
  ctx.textBaseline = 'alphabetic';

  // Title
  const titleSize = 78;
  const title1Y = headerTop + badgeH + 14 + Math.round(titleSize * 0.85);
  ctx.font = `400 ${titleSize}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('My Eras,', PAD, title1Y);

  const title2Y = title1Y + Math.round(titleSize * 0.95);
  ctx.font = `italic 400 ${titleSize}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText('ranked.', PAD, title2Y);

  // Logo mark (top-right)
  const markSize = 36;
  const markCX = W - PAD - markSize / 2;
  const markCY = headerTop + 30;
  logoMark(ctx, markCX, markCY, markSize);

  ctx.font = '400 22px Georgia, serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('The Eras Ranker', W - PAD, markCY + markSize / 2 + 2);
  ctx.textBaseline = 'alphabetic';

  // ── Grid ───────────────────────────────────────────────────────────────────
  const gridTop = title2Y + 18 + 28;
  const COLS = 4, ROWS = 3, GAP = 14;
  const availW = W - PAD * 2;
  const footerH = 72, footerGap = 20, bottomPad = 56;
  const availH = H - gridTop - footerH - footerGap - bottomPad;

  const chipByW = Math.floor((availW - (COLS - 1) * GAP) / COLS);
  const chipByH = Math.floor((availH - (ROWS - 1) * GAP) / ROWS);
  const chipSize = Math.min(chipByW, chipByH);

  const gridW = COLS * chipSize + (COLS - 1) * GAP;
  const gridX = PAD + Math.floor((availW - gridW) / 2);

  for (let i = 0; i < 12; i++) {
    const a = albumRankings[i];
    if (!a) continue;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx = gridX + col * (chipSize + GAP);
    const cy = gridTop + row * (chipSize + GAP);
    drawAlbumChip(ctx, cx, cy, chipSize, a, i + 1);
  }

  // ── Footer bar ─────────────────────────────────────────────────────────────
  const footerY = H - bottomPad - footerH;

  rrect(ctx, PAD, footerY, W - PAD * 2, footerH, 14);
  ctx.fillStyle = 'rgba(168,85,247,0.13)';
  ctx.fill();
  rrect(ctx, PAD, footerY, W - PAD * 2, footerH, 14);
  ctx.strokeStyle = 'rgba(168,85,247,0.33)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const fMidY = footerY + footerH / 2;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  ctx.font = '500 11px "Courier New", monospace';
  ctx.fillStyle = '#a78bfa';
  ctx.fillText('RANK YOUR OWN', PAD + 28, fMidY - 11);

  ctx.font = '600 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('eras-ranker.vercel.app', PAD + 28, fMidY + 12);

  // CTA button
  const btnLabel = 'Try it →';
  ctx.font = '600 16px system-ui, -apple-system, sans-serif';
  const btnW = ctx.measureText(btnLabel).width + 44;
  const btnH = 46;
  const btnX = W - PAD - 28 - btnW;
  const btnY = footerY + (footerH - btnH) / 2;

  rrect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
  ctx.fillStyle = '#a855f7';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(btnLabel, btnX + btnW / 2, btnY + btnH / 2);
  ctx.textBaseline = 'alphabetic';
}

// ── Card (legacy top-10) ──────────────────────────────────────────────────────
// Kept as fallback when not all albums are ranked.

export function drawCard(ctx, songs) {
  const W = 1080;
  const H = 1080;
  const PAD = 68;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d0618');
  bg.addColorStop(1, '#160a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const topAccent = ctx.createLinearGradient(0, 0, W, 0);
  topAccent.addColorStop(0,   'rgba(168,85,247,0)');
  topAccent.addColorStop(0.3, '#a855f7');
  topAccent.addColorStop(0.7, '#7c3aed');
  topAccent.addColorStop(1,   'rgba(168,85,247,0)');
  ctx.fillStyle = topAccent;
  ctx.fillRect(0, 0, W, 5);

  ctx.textAlign = 'center';
  ctx.font = `bold 54px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('The Eras Ranker', W / 2, 100);

  ctx.font = `500 19px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#a855f7';
  ctx.letterSpacing = '0.15em';
  ctx.fillText('✦  MY TOP SONGS  ✦', W / 2, 142);
  ctx.letterSpacing = '';

  const divGrad = ctx.createLinearGradient(0, 0, W, 0);
  divGrad.addColorStop(0,   'rgba(168,85,247,0)');
  divGrad.addColorStop(0.15, 'rgba(168,85,247,0.4)');
  divGrad.addColorStop(0.85, 'rgba(168,85,247,0.4)');
  divGrad.addColorStop(1,   'rgba(168,85,247,0)');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 168);
  ctx.lineTo(W - PAD, 168);
  ctx.stroke();

  const ROW_START_Y = 192;
  const ROW_H       = 74;
  const RANK_RIGHT  = PAD + 52;
  const CONTENT_X   = RANK_RIGHT + 26;
  const SCORE_X     = W - PAD;
  const MAX_NAME_W  = SCORE_X - CONTENT_X - 72;

  function truncText(text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
    return t + '…';
  }

  for (let i = 0; i < songs.length; i++) {
    const song  = songs[i];
    const baseY = ROW_START_Y + i * ROW_H;
    const midY  = baseY + ROW_H / 2;

    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(168,85,247,0.04)';
      ctx.fillRect(PAD, baseY + 2, W - PAD * 2, ROW_H - 4);
    }

    const rankColors = ['#fbbf24', '#c0cad4', '#e07540'];
    ctx.font = i < 3
      ? `bold ${26 - i}px system-ui, -apple-system, sans-serif`
      : `500 18px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = i < 3 ? rankColors[i] : '#4b3d6e';
    ctx.textAlign = 'right';
    ctx.fillText(`#${i + 1}`, RANK_RIGHT, midY + 7);

    ctx.font = `bold 25px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#f3f0fa';
    ctx.textAlign = 'left';
    ctx.fillText(truncText(song.name, MAX_NAME_W), CONTENT_X, midY - 4);

    ctx.font = `400 17px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#5b4a7a';
    ctx.fillText(`${song.albumIcon}  ${song.albumName}`, CONTENT_X, midY + 20);

    ctx.font = `bold 26px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = i === 0 ? '#c084fc' : '#7c3aed';
    ctx.textAlign = 'right';
    ctx.fillText(String(song.score), SCORE_X, midY + 8);

    if (i < songs.length - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CONTENT_X, baseY + ROW_H);
      ctx.lineTo(W - PAD, baseY + ROW_H);
      ctx.stroke();
    }
  }

  const botAccent = ctx.createLinearGradient(0, 0, W, 0);
  botAccent.addColorStop(0,   'rgba(168,85,247,0)');
  botAccent.addColorStop(0.3, '#7c3aed');
  botAccent.addColorStop(0.7, '#a855f7');
  botAccent.addColorStop(1,   'rgba(168,85,247,0)');
  ctx.fillStyle = botAccent;
  ctx.fillRect(0, H - 5, W, 5);

  ctx.font = `400 18px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.textAlign = 'center';
  ctx.fillText('eras-ranker.vercel.app', W / 2, H - 22);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RankingCard({ getCompositeScore, activeCategories, ratings }) {
  const hasCompletedAlbum = ALL_ALBUMS.some(album => {
    const songs = SONGS[album.id] || [];
    return songs.length > 0 && songs.every((_, i) => {
      const key = `${album.id}_${i}`;
      return ratings[key] && Object.keys(ratings[key]).length > 0;
    });
  });

  const allAlbumsRanked = ALBUMS.every(album => {
    const songs = SONGS[album.id] || [];
    return songs.length > 0 && songs.every((_, i) => {
      const key = `${album.id}_${i}`;
      return ratings[key] && Object.keys(ratings[key]).length > 0;
    });
  });

  const allRated = [];
  for (const album of ALL_ALBUMS) {
    const songs = SONGS[album.id] || [];
    for (let i = 0; i < songs.length; i++) {
      const score = getCompositeScore(album.id, i, activeCategories);
      if (score !== null) {
        allRated.push({ name: songs[i], albumName: album.name, albumIcon: album.icon, score });
      }
    }
  }
  allRated.sort((a, b) => b.score - a.score);

  if (!hasCompletedAlbum) {
    return (
      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 28 }}>
        Finish rating every song in an album to unlock your shareable card.
      </p>
    );
  }

  function handleGenerate() {
    const canvas = document.createElement('canvas');
    canvas.width  = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (allAlbumsRanked) {
      const albumRankings = ALBUMS.map(album => {
        const scores = (SONGS[album.id] || [])
          .map((_, i) => getCompositeScore(album.id, i, activeCategories))
          .filter(s => s !== null);
        const avg = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
        return { name: album.name, icon: album.icon, score: avg };
      }).sort((a, b) => b.score - a.score);

      drawMosaicCard(ctx, albumRankings);
    } else {
      drawCard(ctx, allRated.slice(0, 10));
    }

    const link = document.createElement('a');
    link.download = allAlbumsRanked ? 'my-eras-mosaic.png' : 'my-eras-rankings.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div style={{ marginTop: 28, paddingTop: 20, borderTop: '0.5px solid #f3f4f6' }}>
      {allAlbumsRanked && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#a855f7', marginBottom: 10, fontWeight: 600 }}>
          ✦ All 12 albums ranked — mosaic card unlocked!
        </p>
      )}
      <button
        onClick={handleGenerate}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px',
          borderRadius: 10,
          border: 'none',
          background: '#a855f7',
          color: '#ffffff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          letterSpacing: '0.01em',
        }}
      >
        {allAlbumsRanked ? 'Share My Eras Mosaic' : 'Share My Rankings'}
      </button>
    </div>
  );
}
