import AlbumCard from './AlbumCard';
import SpotifyAttribution from './SpotifyAttribution';
import { ALBUMS, OTHER_ALBUM } from '../data/albums';

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 10,
};

export default function AlbumGrid({ onSelectAlbum, selectedAlbumId, getAlbumScore, getRatedCount, activeCategories, albumArt, albumSpotifyIds }) {
  const hasArt = !!albumArt && Object.keys(albumArt).length > 0;
  return (
    <div style={{ padding: '12px 0' }}>
      {/* Spotify attribution — required wherever we show Spotify-sourced art.
          Hidden entirely when no covers have been fetched (free / offline). */}
      <SpotifyAttribution
        visible={hasArt}
        style={{ marginBottom: 8, paddingRight: 4 }}
      />
      <div style={gridStyle}>
        {ALBUMS.map(album => (
          <AlbumCard
            key={album.id}
            album={album}
            ratedCount={getRatedCount(album.id)}
            albumScore={getAlbumScore(album.id, activeCategories)}
            isSelected={album.id === selectedAlbumId}
            onClick={() => onSelectAlbum(album.id)}
            spotifyArtUrl={albumArt?.[album.id] ?? null}
            spotifyAlbumId={albumSpotifyIds?.[album.id] ?? null}
          />
        ))}
      </div>

      <div style={{ marginTop: 24, marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Other
      </div>
      <div style={gridStyle}>
        <AlbumCard
          album={OTHER_ALBUM}
          ratedCount={getRatedCount(OTHER_ALBUM.id)}
          albumScore={getAlbumScore(OTHER_ALBUM.id, activeCategories)}
          isSelected={OTHER_ALBUM.id === selectedAlbumId}
          onClick={() => onSelectAlbum(OTHER_ALBUM.id)}
        />
      </div>
    </div>
  );
}
