// Single album card shown in the album grid.
// Vibrant era-color tile (gradient + emoji watermark) with a state badge:
//   • fully scored  → gold pill with score /100
//   • in progress   → dark glass pill with rated/total
//   • manual mode   → dark glass pill "✋ sorted"
//   • untouched     → translucent "NEW"
// The era gradient is self-contained and reads well in BOTH light and dark
// mode (same palette the bracket tiles use), so no --album-scrim is needed.
import { SONGS } from '../data/albums';
import { getEra } from '../constants/eraColors';

// hex → rgba with alpha. Era ink/deep values are 6-digit hex.
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
}

function badgePill(bg, color) {
  return {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 2,
    padding: '3px 9px',
    borderRadius: 999,
    background: bg,
    color,
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: '0.4px',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  };
}

export default function AlbumCard({ album, ratedCount, albumScore, isSelected, onClick, mode }) {
  const era = getEra(album.id);
  const total = (SONGS[album.id] || []).length;
  const complete = total > 0 && ratedCount >= total;
  const ink = era.ink;
  const dim = (a) => hexA(ink, a);

  // State badge — top-right.
  let badge;
  if (mode === 'manual') {
    badge = <span style={badgePill('rgba(0,0,0,0.32)', '#fff')}>✋ sorted</span>;
  } else if (complete) {
    badge = (
      <span style={{ ...badgePill('linear-gradient(180deg,#f5d97a,#d4af37)', '#2a1d00'), boxShadow: '0 2px 8px rgba(212,175,55,0.4)' }}>
        <b style={{ fontSize: 12 }}>{albumScore}</b>
        <span style={{ fontSize: 9, opacity: 0.7 }}>/100</span>
      </span>
    );
  } else if (ratedCount > 0) {
    badge = <span style={badgePill('rgba(0,0,0,0.32)', '#fff')}>{ratedCount}/{total}</span>;
  } else {
    badge = <span style={badgePill('rgba(255,255,255,0.22)', '#fff')}>NEW</span>;
  }

  // Meta line under the album name.
  const yearPart = album.year ? `${album.year} · ` : '';
  const metaText = mode === 'manual'
    ? `${yearPart}your order`
    : `${yearPart}${total} songs`;

  return (
    <button
      onClick={onClick}
      style={{
        appearance: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        padding: 0,
        position: 'relative',
        height: 152,
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        background: `linear-gradient(158deg, ${era.tile} 0%, ${era.deep} 130%)`,
        boxShadow: isSelected
          ? `0 0 0 2px var(--brand), 0 6px 16px ${hexA(era.deep, 0.4)}`
          : `0 6px 16px ${hexA(era.deep, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
      }}
    >
      {/* Top-left gloss */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 70% at 18% 0%, rgba(255,255,255,0.28), transparent 52%)' }} />
      {/* Big faded emoji watermark */}
      <div style={{ position: 'absolute', right: -8, top: 18, fontSize: 74, opacity: 0.22, transform: 'rotate(-8deg)' }}>{album.icon}</div>
      {/* State badge */}
      <div style={{ position: 'absolute', top: 10, right: 10 }}>{badge}</div>
      {/* Small emoji top-left */}
      <div style={{ position: 'absolute', top: 12, left: 13, fontSize: 30 }}>{album.icon}</div>
      {/* Bottom scrim with name + meta */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: '24px 13px 12px',
        background: `linear-gradient(180deg, transparent, ${hexA(era.deep, 0.55)})`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: ink, lineHeight: 1.12, letterSpacing: '-0.2px' }}>
          {album.name}
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.4px', color: dim(0.72) }}>
          {metaText}
        </div>
      </div>
    </button>
  );
}
