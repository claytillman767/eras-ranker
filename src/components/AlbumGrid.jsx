import AlbumCard from './AlbumCard';
import { ALBUMS, OTHER_ALBUM } from '../data/albums';

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
};

// Small stat tile for the two-up strip above the grid.
function Stat({ n, label }) {
  return (
    <div style={{
      flex: 1,
      padding: '12px 14px',
      borderRadius: 14,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.3px', color: 'var(--text-3)', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

export default function AlbumGrid({ onSelectAlbum, selectedAlbumId, getAlbumScore, getRatedCount, getAlbumMode, activeCategories }) {
  // Stat-strip values. An era counts as "ranked" once it has a score or has
  // been put in a hand-sorted (manual) order. Songs scored = total rated
  // across the 12 main eras.
  const scoredEras = ALBUMS.filter(a =>
    getAlbumScore(a.id, activeCategories) !== null || getAlbumMode?.(a.id) === 'manual'
  ).length;
  const songsScored = ALBUMS.reduce((n, a) => n + getRatedCount(a.id), 0);

  return (
    <div style={{ padding: '12px 0 8px' }}>
      {/* Title + intro */}
      <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>Albums</div>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.45 }}>
        Rank every era your way — score each song with a <b style={{ color: 'var(--brand-text)' }}>Vibe Check</b>, or just <b style={{ color: 'var(--brand-text)' }}>sort it yourself</b>.
      </div>

      {/* Stat strip */}
      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <Stat n={`${scoredEras}/12`} label="eras ranked" />
        <Stat n={songsScored} label="songs scored" />
      </div>

      {/* Main 12 albums */}
      <div style={{ ...gridStyle, marginTop: 18 }}>
        {ALBUMS.map(album => (
          <AlbumCard
            key={album.id}
            album={album}
            ratedCount={getRatedCount(album.id)}
            albumScore={getAlbumScore(album.id, activeCategories)}
            mode={getAlbumMode?.(album.id)}
            isSelected={album.id === selectedAlbumId}
            onClick={() => onSelectAlbum(album.id)}
          />
        ))}
      </div>

      {/* Other (standalone / non-album tracks) */}
      <div style={{ marginTop: 24, marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Other
      </div>
      <div style={gridStyle}>
        <AlbumCard
          album={OTHER_ALBUM}
          ratedCount={getRatedCount(OTHER_ALBUM.id)}
          albumScore={getAlbumScore(OTHER_ALBUM.id, activeCategories)}
          mode={getAlbumMode?.(OTHER_ALBUM.id)}
          isSelected={OTHER_ALBUM.id === selectedAlbumId}
          onClick={() => onSelectAlbum(OTHER_ALBUM.id)}
        />
      </div>
    </div>
  );
}
