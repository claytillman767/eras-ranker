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
  isLover,
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

  // Rose-pink palette for Lover; default purple for everything else.
  const accentText        = isLover ? '#be185d' : 'var(--brand-text)';
  const accentChipBg      = isLover ? 'rgba(252, 231, 243, 0.85)' : 'var(--accent-soft)';
  const accentChipLabel   = isLover ? '#be185d' : 'var(--brand-text)';
  const accentBarGradient = isLover ? 'linear-gradient(90deg, #f9a8d4, #ec4899)' : 'linear-gradient(90deg, #a855f7, #7e22ce)';
  const accentBackBorder  = isLover ? '0.5px solid #fbcfe8' : '0.5px solid var(--border)';

  return (
    <div style={{ padding: '16px' }}>
      {/* Back button */}
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={onBack}
          style={{
            background: isLover ? 'rgba(255,255,255,0.7)' : 'none',
            border: accentBackBorder,
            borderRadius: 8,
            padding: '5px 10px',
            fontSize: 12,
            color: 'var(--text-strong)',
            cursor: 'pointer',
          }}
        >
          ← Albums
        </button>
      </div>

      {/* Album identity row */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', lineHeight: 1.15 }}>
            {album.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            {album.year} · {total} songs
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            {albumScore !== null ? (
              <>
                <span style={{ fontSize: 28, fontWeight: 300, color: accentText, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {albumScore}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>/100</span>
              </>
            ) : (
              <span style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-3)' }}>not yet scored</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress row */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-2)',
          marginBottom: 4,
        }}>
          <span>{rated} of {total} rated</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 6, background: isLover ? 'rgba(255,255,255,0.6)' : 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
            background: accentBarGradient,
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
          background: accentChipBg,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>★</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10,
              color: accentChipLabel,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}>
              Top song
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--text)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {topSong.name}
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: accentChipLabel, flexShrink: 0 }}>
            {topSong.score}
          </div>
        </div>
      )}
    </div>
  );
}
