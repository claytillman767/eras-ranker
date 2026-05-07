// Big album hero block — shown at the top of the album/song-list screen.
// Displays album identity, score, progress bar, and top-song chip.
import { ALL_ALBUMS, SONGS } from '../data/albums';

export default function AlbumHero({
  albumId,
  getCompositeScore,
  getAlbumScore,
  getRatedCount,
  activeCategories,
  onBack,
  spotifyArtUrl,
  spotifyAlbumId,
}) {
  const album = ALL_ALBUMS.find(a => a.id === albumId);
  if (!album) return null;

  const total = SONGS[albumId]?.length || 0;
  const rated = getRatedCount(albumId);
  const pct = total ? Math.round((rated / total) * 100) : 0;
  const albumScore = getAlbumScore(albumId, activeCategories);

  // Find the highest-scored song
  const songs = SONGS[albumId] || [];
  const topSong = songs
    .map((name, i) => ({ name, score: getCompositeScore(albumId, i, activeCategories) }))
    .filter(s => s.score !== null)
    .sort((a, b) => b.score - a.score)[0] || null;

  return (
    <div style={{ padding: '16px' }}>
      {/* Back button */}
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: '0.5px solid #e5e7eb',
            borderRadius: 8,
            padding: '5px 10px',
            fontSize: 12,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          ← Albums
        </button>
      </div>

      {/* Album identity row */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
        {spotifyArtUrl ? (
          <img
            src={spotifyArtUrl}
            alt={album.name}
            style={{
              width: 76,
              height: 76,
              borderRadius: 8,
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          />
        ) : (
          <div style={{
            width: 76,
            height: 76,
            borderRadius: 14,
            background: album.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 38,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            {album.icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', lineHeight: 1.15 }}>
            {album.name}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {album.year} · {total} songs
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            {albumScore !== null ? (
              <>
                <span style={{ fontSize: 28, fontWeight: 300, color: '#7e22ce', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {albumScore}
                </span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>/100</span>
              </>
            ) : (
              <span style={{ fontSize: 13, fontStyle: 'italic', color: '#9ca3af' }}>not yet scored</span>
            )}
          </div>
          {/* Spotify attribution + link-back — required wherever Spotify-sourced
              album art is displayed. Only rendered when we actually have a
              Spotify-sourced cover; falls back to nothing when the user is
              free/offline and we're showing the colored emoji tile instead. */}
          {spotifyArtUrl && (
            <div style={{
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: '#9ca3af',
              letterSpacing: '0.02em',
            }}>
              <span>Album art from</span>
              <span style={{ fontWeight: 600, color: '#6b7280' }}>Spotify</span>
              {spotifyAlbumId && (
                <a
                  href={`https://open.spotify.com/album/${spotifyAlbumId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#6b7280',
                    textDecoration: 'underline',
                    fontWeight: 500,
                  }}
                >
                  Open ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress row */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#6b7280',
          marginBottom: 4,
        }}>
          <span>{rated} of {total} rated</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
            background: 'linear-gradient(90deg, #a855f7, #7e22ce)',
            borderRadius: 3,
            transition: 'width 0.4s',
          }} />
        </div>
      </div>

      {/* Top song chip — only shown once at least one song is scored */}
      {topSong && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          background: '#f3e8ff',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>★</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10,
              color: '#7e22ce',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}>
              Top song
            </div>
            <div style={{
              fontSize: 13,
              color: '#111827',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {topSong.name}
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#7e22ce', flexShrink: 0 }}>
            {topSong.score}
          </div>
        </div>
      )}
    </div>
  );
}
