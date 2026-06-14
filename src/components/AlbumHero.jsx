// Big album hero block — shown at the top of the album/song-list screen.
// Full era-color gradient header: emoji watermark, big thin album score,
// progress bar, "Your #1" chip, and a mode pill. In manual mode it shows a
// "drag to rearrange" line instead of a score.
//
// The era gradient + on-tile "ink" text read well in both light and dark
// mode (same palette the bracket tiles use), so the header is theme-agnostic.
import { ALL_ALBUMS, SONGS } from '../data/albums';
import { getEra } from '../constants/eraColors';

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
}

export default function AlbumHero({
  albumId,
  getCompositeScore,
  getAlbumScore,
  getRatedCount,
  activeCategories,
  onBack,
  albumMode,
}) {
  const album = ALL_ALBUMS.find(a => a.id === albumId);
  if (!album) return null;

  const era = getEra(albumId);
  const ink = era.ink;
  const dim = (a) => hexA(ink, a);

  const total = SONGS[albumId]?.length || 0;
  const rated = getRatedCount(albumId);
  const pct = total ? Math.round((rated / total) * 100) : 0;
  const albumScore = getAlbumScore(albumId, activeCategories);
  const isManual = albumMode === 'manual';

  // Highest-scored song for the "Your #1" chip.
  const songs = SONGS[albumId] || [];
  const topSong = songs
    .map((name, i) => ({ name, score: getCompositeScore(albumId, i, activeCategories) }))
    .filter(s => s.score !== null)
    .sort((a, b) => b.score - a.score)[0] || null;

  const eyebrow = album.year ? `${album.year} · ${total} songs` : `${total} songs`;

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      // Bleed past App's 16px content padding so the color spans full width.
      margin: '0 -16px',
      padding: '18px 18px 22px',
      background: `linear-gradient(158deg, ${era.tile} 0%, ${era.deep} 130%)`,
    }}>
      {/* Decorative gloss + watermark */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 16% -8%, rgba(255,255,255,0.28), transparent 55%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: -16, top: 26, fontSize: 128, opacity: 0.16, transform: 'rotate(-8deg)', pointerEvents: 'none' }}>{album.icon}</div>

      <div style={{ position: 'relative' }}>
        {/* Back pill + mode pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button
            onClick={onBack}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 9,
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.28)',
              color: ink,
              fontWeight: 600,
              fontSize: 12.5,
            }}
          >
            ← Albums
          </button>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 11px',
            borderRadius: 999,
            background: dim(0.14),
            border: `1px solid ${dim(0.22)}`,
            color: ink,
            fontSize: 11.5,
            fontWeight: 700,
          }}>
            {isManual ? '✋ Sort it yourself' : '🎧 Vibe Check'}
          </div>
        </div>

        {/* Eyebrow + name */}
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: dim(0.62) }}>
          {eyebrow}
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: ink, letterSpacing: '-0.4px', marginTop: 5, lineHeight: 1.08 }}>
          {album.name}
        </div>

        {isManual ? (
          <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: dim(0.8) }}>
            Your order · drag ⠿ to rearrange
          </div>
        ) : (
          <>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                {albumScore !== null ? (
                  <>
                    <span style={{ fontSize: 46, fontWeight: 200, color: ink, lineHeight: 0.9, letterSpacing: '-0.02em' }}>{albumScore}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: dim(0.6) }}>/100 album score</span>
                  </>
                ) : (
                  <span style={{ fontSize: 15, fontStyle: 'italic', color: dim(0.7) }}>not yet scored</span>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: dim(0.7) }}>{rated}/{total} rated</div>
            </div>

            <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: dim(0.18), overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(pct, pct > 0 ? 3 : 0)}%`, background: ink, opacity: 0.85, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>

            {topSong && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 11, background: dim(0.13) }}>
                <span style={{ fontSize: 13 }}>★</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: dim(0.6) }}>Your #1</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topSong.name}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: ink }}>{topSong.score}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
