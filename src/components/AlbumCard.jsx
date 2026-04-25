// Single album card shown in the album grid.
// Shows icon, name, and either album score (if songs rated), rated count, or year.

export default function AlbumCard({ album, ratedCount, albumScore, isSelected, onClick }) {
  // Decide what to show in the bottom line
  let bottomLine;
  if (albumScore !== null) {
    bottomLine = (
      <span style={{ color: '#7e22ce', fontWeight: 500, fontSize: 13 }}>
        {albumScore} / 100
      </span>
    );
  } else if (ratedCount > 0) {
    bottomLine = (
      <span style={{ color: '#a855f7', fontSize: 12 }}>
        {ratedCount} rated
      </span>
    );
  } else {
    bottomLine = (
      <span style={{ color: '#9ca3af', fontSize: 12 }}>
        {album.year}
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        background: album.color,
        border: isSelected ? '2px solid #a855f7' : '0.5px solid #e5e7eb',
        borderRadius: 12,
        padding: '12px 10px',
        textAlign: 'center',
        cursor: 'pointer',
        width: '100%',
        // Min touch target
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
        color: '#111827',
        lineHeight: 1.3,
        // Truncate long album names
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
