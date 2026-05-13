// Home tab — progress-first dashboard shown when the app opens.
// Sections: signed-out backup warning, catalog progress hero, continue card,
// daily prompt, and an album checklist sorted by user state.
import { ALBUMS, ALL_ALBUMS, SONGS } from '../data/albums';
import SpotifyAttribution from './SpotifyAttribution';

// Google "G" SVG — same one used in App.jsx
function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

// Splits a lastRatedKey like "rd_3" into { albumId: 'rd', songIndex: 3 }
// Uses lastIndexOf('_') to handle any albumId format safely.
function splitRatedKey(key) {
  if (!key) return null;
  const lastUnder = key.lastIndexOf('_');
  if (lastUnder === -1) return null;
  const songIndex = parseInt(key.slice(lastUnder + 1), 10);
  if (isNaN(songIndex)) return null;
  return { albumId: key.slice(0, lastUnder), songIndex };
}

// Abbreviate a category name to fit in the tiny bar legend (≤5 chars)
function abbrev(name) {
  const overrides = {
    'Lyrics': 'Lyr',
    'Music / melody': 'Music',
    'Bridge': 'Brdg',
    'Nostalgia': 'Nost',
    'Skip on shuffle?': 'Skip',
    'Hook / chorus': 'Hook',
    'Vocal performance': 'Voc',
    'Cry factor': 'Cry',
    'Romantic feel': 'Rom',
    'Hype / energy': 'Hype',
    'Opening line': 'Open',
    'Vibe / atmosphere': 'Vibe',
    'Storytelling': 'Story',
  };
  return overrides[name] || name.slice(0, 5);
}

export default function Home({
  user,
  signIn,
  ratings,
  getCompositeScore,
  getAlbumScore,
  getRatedCount,
  activeCategories,
  lastRatedKey,
  streak,
  onContinueRating,
  onSelectAlbum,
  onGoToAlbums,
  spotifyAlbumArt,
  spotifyAlbumIds,
}) {
  // ── Computed totals ──────────────────────────────────────────────
  const totalSongs = ALL_ALBUMS.reduce((sum, a) => sum + (SONGS[a.id]?.length || 0), 0);
  const totalRated = ALL_ALBUMS.reduce((sum, a) => sum + getRatedCount(a.id), 0);
  const pct = totalSongs > 0 ? Math.round((totalRated / totalSongs) * 100) : 0;

  // ── User state detection ─────────────────────────────────────────
  const fullyRankedCount = ALBUMS.filter(a => {
    const total = SONGS[a.id]?.length || 0;
    return total > 0 && getRatedCount(a.id) === total;
  }).length;

  let userState = 'first';
  if (totalRated > 0) {
    if (totalRated / totalSongs >= 0.8 || fullyRankedCount >= 1) {
      userState = 'power';
    } else {
      userState = 'returning';
    }
  }
  const isFirst = userState === 'first';

  // ── Auto-sorted album list ───────────────────────────────────────
  let sortedAlbums = [...ALBUMS];
  if (userState === 'returning') {
    sortedAlbums.sort((a, b) => {
      const aTotal = SONGS[a.id]?.length || 0;
      const bTotal = SONGS[b.id]?.length || 0;
      const aPct = aTotal ? getRatedCount(a.id) / aTotal : 0;
      const bPct = bTotal ? getRatedCount(b.id) / bTotal : 0;
      return bPct - aPct;
    });
  } else if (userState === 'power') {
    sortedAlbums.sort((a, b) => {
      const aScore = getAlbumScore(a.id, activeCategories) ?? -1;
      const bScore = getAlbumScore(b.id, activeCategories) ?? -1;
      return bScore - aScore;
    });
  }
  // 'first' → release order (no sort needed)

  // ── Continue card data ───────────────────────────────────────────
  let continueInfo = null;

  if (!isFirst) {
    const split = splitRatedKey(lastRatedKey);
    if (split) {
      const { albumId, songIndex } = split;
      const album = ALBUMS.find(a => a.id === albumId);
      const songName = SONGS[albumId]?.[songIndex];
      if (album && songName) {
        const songRatings = ratings[lastRatedKey] || {};
        const nextCat = activeCategories.find(c => !songRatings[c.id]);
        continueInfo = {
          albumId,
          songIndex,
          songName,
          album,
          nextCategory: nextCat?.name || 'Re-rate',
        };
      }
    }

    // Fallback: first unrated song in first incomplete album
    if (!continueInfo) {
      for (const album of ALBUMS) {
        const songs = SONGS[album.id] || [];
        const firstUnrated = songs.findIndex((_, i) => {
          const key = `${album.id}_${i}`;
          const r = ratings[key];
          return !r || Object.keys(r).length === 0;
        });
        if (firstUnrated !== -1) {
          continueInfo = {
            albumId: album.id,
            songIndex: firstUnrated,
            songName: songs[firstUnrated],
            album,
            nextCategory: activeCategories[0]?.name || 'Rate',
          };
          break;
        }
      }
    }
  }

  // ── Daily prompt ─────────────────────────────────────────────────
  // Pick a song deterministically from today's date. Skip if already rated.
  const dayIndex = Math.floor(Date.now() / 86400000);
  const dailyGlobalIndex = dayIndex % totalSongs;
  let dailyInfo = null;
  if (!isFirst) {
    let count = 0;
    for (const album of ALBUMS) {
      const songs = SONGS[album.id] || [];
      if (dailyGlobalIndex < count + songs.length) {
        const si = dailyGlobalIndex - count;
        const key = `${album.id}_${si}`;
        const alreadyRated = ratings[key] && Object.keys(ratings[key]).length > 0;
        if (!alreadyRated) {
          dailyInfo = { albumId: album.id, songIndex: si, songName: songs[si], album };
        }
        break;
      }
      count += songs.length;
    }
  }

  return (
    <div>
      {/* ── Signed-out backup warning ── */}
      {!user && (
        <div style={{
          margin: '14px 16px 0',
          padding: '12px 14px',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: 10,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#b45309',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}>!</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#b45309', marginBottom: 2 }}>
              Your ratings aren't backed up
            </div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4, marginBottom: 10 }}>
              Right now, your ratings only live in this browser. If you clear your history or switch devices, they'll be gone.
            </div>
            <button
              onClick={signIn}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#ffffff',
                border: '1px solid #374151',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <GoogleIcon />
              Sign in with Google to save them
            </button>
          </div>
        </div>
      )}

      {/* ── Catalog progress hero ── */}
      <div style={{ padding: '20px 16px 16px', textAlign: 'center' }}>
        <div style={{
          fontSize: 11,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 6,
        }}>
          Catalog progress
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontSize: 84, fontWeight: 200, color: '#111827', lineHeight: 1, letterSpacing: '-0.04em' }}>
            {pct}
          </span>
          <span style={{ fontSize: 28, fontWeight: 300, color: '#a855f7', lineHeight: 1 }}>%</span>
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          {totalRated.toLocaleString()} of {totalSongs.toLocaleString()} songs rated
        </div>
        <div style={{
          marginTop: 14,
          height: 8,
          background: '#f3f4f6',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.max(pct, pct > 0 ? 1 : 0)}%`,
            background: 'linear-gradient(90deg, #a855f7, #7e22ce)',
            borderRadius: 4,
            transition: 'width 0.4s ease',
          }} />
        </div>
        {!isFirst && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
            {streak > 0 && (
              <span style={{
                padding: '3px 9px',
                background: '#f3e8ff',
                color: '#7e22ce',
                borderRadius: 12,
                fontWeight: 500,
                fontSize: 11,
              }}>
                🔥 {streak}-day streak
              </span>
            )}
            <span style={{
              padding: '3px 9px',
              background: '#f3f4f6',
              color: '#374151',
              borderRadius: 12,
              fontSize: 11,
            }}>
              {Math.max(0, 100 - pct)}% to complete
            </span>
          </div>
        )}
      </div>

      {/* ── Continue card ── */}
      {isFirst ? (
        // First-time user — "Rate your first song"
        <div style={{
          margin: '4px 16px 16px',
          padding: '16px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: '#f3e8ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}>✨</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Rate your first song</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>We'll start you with a quick vibe check.</div>
          </div>
          <button
            onClick={onGoToAlbums}
            style={{
              padding: '8px 16px',
              background: '#a855f7',
              color: 'white',
              border: 'none',
              borderRadius: 18,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Begin
          </button>
        </div>
      ) : continueInfo ? (
        // Returning user — show last-rated song
        <div style={{
          margin: '4px 16px 16px',
          padding: '14px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            background: continueInfo.album.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            flexShrink: 0,
          }}>
            {continueInfo.album.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 2,
            }}>Continue</div>
            <div style={{
              fontSize: 15,
              fontWeight: 500,
              color: '#111827',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {continueInfo.songName}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
              {continueInfo.album.name} · next: {continueInfo.nextCategory}
            </div>
          </div>
          <button
            onClick={() => onContinueRating(continueInfo.albumId, continueInfo.songIndex)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#a855f7',
              color: 'white',
              border: 'none',
              fontSize: 14,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >▶</button>
        </div>
      ) : null}

      {/* ── Daily prompt ── */}
      {dailyInfo && (
        <div style={{
          margin: '0 16px 16px',
          padding: '12px 14px',
          background: '#f3e8ff',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{ fontSize: 18 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#7e22ce' }}>
              Today's pick: {dailyInfo.songName}
            </div>
            <div style={{ fontSize: 11, color: '#374151' }}>
              {dailyInfo.album.name}
            </div>
          </div>
          <span
            onClick={() => onContinueRating(dailyInfo.albumId, dailyInfo.songIndex)}
            style={{ fontSize: 11, color: '#7e22ce', fontWeight: 500, cursor: 'pointer' }}
          >
            Try →
          </span>
        </div>
      )}

      {/* ── Album checklist ── */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Albums
          </div>
          <div
            onClick={onGoToAlbums}
            style={{ fontSize: 12, color: '#a855f7', fontWeight: 500, cursor: 'pointer' }}
          >
            See all {ALBUMS.length} →
          </div>
        </div>

        {/* Spotify attribution — only shown when album art is being displayed */}
        <SpotifyAttribution
          visible={!!spotifyAlbumArt && Object.keys(spotifyAlbumArt).length > 0}
          style={{ marginBottom: 8 }}
        />

        {sortedAlbums.slice(0, 6).map(album => {
          const total = SONGS[album.id]?.length || 0;
          const rated = getRatedCount(album.id);
          const albumPct = total ? Math.round((rated / total) * 100) : 0;
          const done = albumPct === 100;
          const score = getAlbumScore(album.id, activeCategories);

          return (
            <div
              key={album.id}
              onClick={() => onSelectAlbum(album.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: '0.5px solid #e5e7eb',
                cursor: 'pointer',
              }}
            >
              {/* Album tile with optional checkmark badge */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: spotifyAlbumArt?.[album.id] ? '#000' : album.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {spotifyAlbumArt?.[album.id] ? (
                  <img
                    src={spotifyAlbumArt[album.id]}
                    alt={album.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  album.icon
                )}
                {done && (
                  <div style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#a855f7',
                    color: 'white',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                  }}>✓</div>
                )}
              </div>

              {/* Name + score/progress + bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 4,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>
                    {album.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: score !== null ? '#7e22ce' : '#9ca3af',
                    fontWeight: score !== null ? 500 : 400,
                  }}>
                    {score !== null ? `${score}/100` : `${rated}/${total}`}
                  </div>
                </div>
                <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${albumPct}%`,
                    background: done ? '#a855f7' : '#a855f7aa',
                    borderRadius: 2,
                  }} />
                </div>
              </div>

              {/* Open in Spotify — per-row link-back required when art is from Spotify */}
              {spotifyAlbumIds?.[album.id] && (
                <a
                  href={`https://open.spotify.com/album/${spotifyAlbumIds[album.id]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  aria-label={`Open ${album.name} on Spotify`}
                  title="Open in Spotify"
                  style={{
                    flexShrink: 0,
                    width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: 13,
                    textDecoration: 'none',
                  }}
                >
                  ↗
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
