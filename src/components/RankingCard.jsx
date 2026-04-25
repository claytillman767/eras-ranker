import { ALBUMS, SONGS } from '../data/albums';

// ── Canvas card renderer ──────────────────────────────────────────────────────

export function drawCard(ctx, songs) {
  const W = 1080;
  const H = 1080;
  const PAD = 68;

  // ── Background gradient ───────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d0618');
  bg.addColorStop(1, '#160a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Top accent bar ────────────────────────────────────────────────────────
  const topAccent = ctx.createLinearGradient(0, 0, W, 0);
  topAccent.addColorStop(0,   'rgba(168,85,247,0)');
  topAccent.addColorStop(0.3, '#a855f7');
  topAccent.addColorStop(0.7, '#7c3aed');
  topAccent.addColorStop(1,   'rgba(168,85,247,0)');
  ctx.fillStyle = topAccent;
  ctx.fillRect(0, 0, W, 5);

  // ── App title ─────────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.font = `bold 54px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('The Eras Ranker', W / 2, 100);

  // ── Subtitle ──────────────────────────────────────────────────────────────
  ctx.font = `500 19px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#a855f7';
  ctx.letterSpacing = '0.15em';
  ctx.fillText('\u2726  MY TOP SONGS  \u2726', W / 2, 142);
  ctx.letterSpacing = '';

  // ── Divider under header ──────────────────────────────────────────────────
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

  // ── Song rows ─────────────────────────────────────────────────────────────
  const ROW_START_Y = 192;
  const ROW_H       = 74;
  const RANK_RIGHT  = PAD + 52;          // rank number right-aligned to this x
  const CONTENT_X   = RANK_RIGHT + 26;   // song name starts here
  const SCORE_X     = W - PAD;           // score right-aligned to this x
  const MAX_NAME_W  = SCORE_X - CONTENT_X - 72;

  // Helper: truncate text to fit maxWidth
  function truncate(text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '\u2026').width > maxWidth) {
      t = t.slice(0, -1);
    }
    return t + '\u2026';
  }

  for (let i = 0; i < songs.length; i++) {
    const song   = songs[i];
    const baseY  = ROW_START_Y + i * ROW_H;
    const midY   = baseY + ROW_H / 2;

    // Subtle alternating row tint
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(168,85,247,0.04)';
      ctx.fillRect(PAD, baseY + 2, W - PAD * 2, ROW_H - 4);
    }

    // ── Rank ──────────────────────────────────────────────────────────────
    const rankColors = ['#fbbf24', '#c0cad4', '#e07540'];
    ctx.font = i < 3
      ? `bold ${26 - i}px system-ui, -apple-system, sans-serif`
      : `500 18px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = i < 3 ? rankColors[i] : '#4b3d6e';
    ctx.textAlign = 'right';
    ctx.fillText(i < 3 ? `#${i + 1}` : `#${i + 1}`, RANK_RIGHT, midY + 7);

    // ── Song name ─────────────────────────────────────────────────────────
    ctx.font = `bold 25px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#f3f0fa';
    ctx.textAlign = 'left';
    ctx.fillText(truncate(song.name, MAX_NAME_W), CONTENT_X, midY - 4);

    // ── Album name ────────────────────────────────────────────────────────
    ctx.font = `400 17px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#5b4a7a';
    ctx.fillText(`${song.albumIcon}  ${song.albumName}`, CONTENT_X, midY + 20);

    // ── Score ─────────────────────────────────────────────────────────────
    ctx.font = `bold 26px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = i === 0 ? '#c084fc' : '#7c3aed';
    ctx.textAlign = 'right';
    ctx.fillText(String(song.score), SCORE_X, midY + 8);

    // ── Row divider ───────────────────────────────────────────────────────
    if (i < songs.length - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CONTENT_X, baseY + ROW_H);
      ctx.lineTo(W - PAD, baseY + ROW_H);
      ctx.stroke();
    }
  }

  // ── Bottom accent bar ─────────────────────────────────────────────────────
  const botAccent = ctx.createLinearGradient(0, 0, W, 0);
  botAccent.addColorStop(0,   'rgba(168,85,247,0)');
  botAccent.addColorStop(0.3, '#7c3aed');
  botAccent.addColorStop(0.7, '#a855f7');
  botAccent.addColorStop(1,   'rgba(168,85,247,0)');
  ctx.fillStyle = botAccent;
  ctx.fillRect(0, H - 5, W, 5);

  // ── Watermark ─────────────────────────────────────────────────────────────
  ctx.font = `400 18px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.textAlign = 'center';
  ctx.fillText('eras-ranker.vercel.app', W / 2, H - 22);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RankingCard({ getCompositeScore, activeCategories, ratings }) {
  // A song counts as "scored" if it has any rating data at all.
  // Using raw ratings (not getCompositeScore) so that songs where all
  // categories were skipped don't falsely fail the check.
  const hasCompletedAlbum = ALBUMS.some(album => {
    const songs = SONGS[album.id] || [];
    return songs.length > 0 && songs.every((_, i) => {
      const key = `${album.id}_${i}`;
      return ratings[key] && Object.keys(ratings[key]).length > 0;
    });
  });

  // Build full sorted list of rated songs for the card
  const allRated = [];
  for (const album of ALBUMS) {
    const songs = SONGS[album.id] || [];
    for (let i = 0; i < songs.length; i++) {
      const score = getCompositeScore(album.id, i, activeCategories);
      if (score !== null) {
        allRated.push({ name: songs[i], albumName: album.name, albumIcon: album.icon, score });
      }
    }
  }
  allRated.sort((a, b) => b.score - a.score);

  // ── No completed album yet ────────────────────────────────────────────────
  if (!hasCompletedAlbum) {
    return (
      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 28 }}>
        Finish rating every song in an album to unlock your shareable card.
      </p>
    );
  }

  // ── Generate card and trigger download ────────────────────────────────────
  function handleGenerate() {
    const canvas = document.createElement('canvas');
    canvas.width  = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    drawCard(ctx, allRated.slice(0, 10));

    const link = document.createElement('a');
    link.download = 'my-eras-rankings.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 28, paddingTop: 20, borderTop: '0.5px solid #f3f4f6' }}>
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
        Share My Rankings
      </button>
    </div>
  );
}
