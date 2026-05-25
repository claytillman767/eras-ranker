import { ALL_ALBUMS, SONGS } from '../data/albums';
import RankingCard from './RankingCard';
import RankingList from './RankingList';
import PublicProfilePanel from './PublicProfilePanel';

// Rankings tab — now styled as the owner's own profile page. It mirrors
// exactly what a visitor sees at /u/{uid}: identity header, the public-
// profile share control front and center, then the Songs | Albums
// leaderboard (shared RankingList component). The downloadable image card
// stays as a secondary share option at the bottom.
export default function Rankings({
  getCompositeScore,
  getScoreBreakdown,
  getAlbumScore,
  activeCategories,
  ratings,
  onSelectAlbum,
  profile,
  user,
  signIn,
}) {
  // Every rated song across all albums, high → low. Each carries its
  // per-category breakdown so a tap can show how the score was built.
  const songs = [];
  for (const album of ALL_ALBUMS) {
    const albumSongs = SONGS[album.id] || [];
    for (let i = 0; i < albumSongs.length; i++) {
      const b = getScoreBreakdown(album.id, i, activeCategories);
      if (b) {
        songs.push({
          name: albumSongs[i],
          albumName: album.name,
          albumIcon: album.icon,
          score: b.score,
          categories: b.rows,
        });
      }
    }
  }
  songs.sort((a, b) => b.score - a.score);

  // Every album with at least one rated song, high → low.
  const albums = ALL_ALBUMS
    .map(album => ({
      id: album.id,
      name: album.name,
      icon: album.icon,
      year: album.year,
      color: album.color,
      score: getAlbumScore(album.id, activeCategories),
    }))
    .filter(a => a.score !== null)
    .sort((a, b) => b.score - a.score);

  const hasAnyRatings = songs.length > 0;
  const displayName = user?.displayName || 'Your rankings';

  return (
    <div>
      {/* Identity header — same look as the public /u/{uid} page */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '4px 0 18px',
        borderBottom: '0.5px solid var(--hairline)',
        marginBottom: 18,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '2px solid var(--brand)',
          overflow: 'hidden',
          background: 'var(--accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-text)' }}>
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
            {displayName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.04em' }}>
            ALBUM &amp; SONG RANKINGS
          </div>
        </div>
      </div>

      {/* Share / public-profile control — front and center */}
      <PublicProfilePanel profile={profile} user={user} signIn={signIn} />

      {/* Leaderboard (shared with the public profile view) */}
      {!hasAnyRatings ? (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 14, padding: '40px 0' }}>
          No ratings yet — go to the Albums tab to get started.
        </div>
      ) : (
        <RankingList
          albums={albums}
          songs={songs}
          onSelectAlbum={onSelectAlbum}
        />
      )}

      {/* Shareable image card — secondary share option */}
      <RankingCard
        getCompositeScore={getCompositeScore}
        activeCategories={activeCategories}
        ratings={ratings}
      />
    </div>
  );
}
