// Single album card shown in the album grid.
// Shows icon, name, and either album score (if songs rated), rated count, or year.

export default function AlbumCard({ album, ratedCount, albumScore, isSelected, onClick, spotifyArtUrl }) {
  let scoreLabel;
  if (albumScore !== null) {
    scoreLabel = `${albumScore} / 100`;
  } else if (ratedCount > 0) {
    scoreLabel = `${ratedCount} rated`;
  } else {
    scoreLabel = album.year;
  }

  // ── Art card: clean image with name + score below (Spotify guidelines compliant)
  // No overlays, text, or controls on top of the artwork.
  // Corner radius 4px per Spotify small/medium device spec.
  if (spotifyArtUrl) {
    return (
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: 0,
          border: isSelected ? '2px solid #a855f7' : 'none',
          borderRadius: isSelected ? 6 : 0,
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <img
          src={spotifyArtUrl}
          alt={album.name}
          style={{
            width: '100%',
            aspectRatio: '1',
            objectFit: 'cover',
            borderRadius: 4,
            display: 'block',
          }}
        />
        <div style={{ paddingLeft: 2, paddingRight: 2 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#111827',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginBottom: 1,
          }}>
            {album.name}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>
            {scoreLabel}
          </div>
        </div>
      </button>
    );
  }

  // ── Default card: colored background + emoji ─────────────────────────────
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
