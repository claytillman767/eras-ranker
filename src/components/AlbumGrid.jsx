// Grid of all 11 album cards. Tapping one navigates to the Rate Songs tab.
import AlbumCard from './AlbumCard';
import { ALBUMS } from '../data/albums';

export default function AlbumGrid({ onSelectAlbum, selectedAlbumId, getAlbumScore, getRatedCount, activeCategories }) {
  return (
    <div style={{
      display: 'grid',
      // 2 columns on mobile, 3 on wider screens
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 10,
      padding: '12px 0',
    }}>
      {ALBUMS.map(album => (
        <AlbumCard
          key={album.id}
          album={album}
          ratedCount={getRatedCount(album.id)}
          albumScore={getAlbumScore(album.id, activeCategories)}
          isSelected={album.id === selectedAlbumId}
          onClick={() => onSelectAlbum(album.id)}
        />
      ))}
    </div>
  );
}
