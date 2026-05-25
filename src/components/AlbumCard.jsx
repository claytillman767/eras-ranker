// Single album card shown in the album grid.
// Shows icon, name, and either album score (if songs rated), rated count, or year.

export default function AlbumCard({ album, ratedCount, albumScore, isSelected, onClick }) {
  // ── Colored background + emoji card ──────────────────────────────────────
  let bottomLine;
  if (albumScore !== null) {
    bottomLine = (
      <span style={{ color: 'var(--brand-text)', fontWeight: 500, fontSize: 13 }}>
        {albumScore} / 100
      </span>
    );
  } else if (ratedCount > 0) {
    bottomLine = (
      <span style={{ color: 'var(--brand-text)', fontSize: 12 }}>
        {ratedCount} rated
      </span>
    );
  } else {
    bottomLine = (
      <span style={{ color: 'var(--text-3)', fontSize: 12 }}>
        {album.year}
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        background: album.color,
        border: isSelected ? '2px solid var(--brand)' : '0.5px solid var(--border)',
        borderRadius: 12,
        padding: '12px 10px',
        textAlign: 'center',
        cursor: 'pointer',
        width: '100%',
        minHeight: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 24 }}>{album.icon}</span>
      <span style={{
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text)',
        lineHeight: 1.3,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {album.name}
      </span>
      {bottomLine}
    </button>
  );
}
