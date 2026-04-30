import { useState } from 'react';
import ScoreBar from './ScoreBar';
import { ALL_ALBUMS, SONGS } from '../data/albums';
import RankingCard from './RankingCard';
import SpotifyAttribution from './SpotifyAttribution';

// Rankings tab — shows top songs or top albums sorted by composite score.
export default function Rankings({ getCompositeScore, getAlbumScore, activeCategories, ratings, spotifyAlbumArt }) {
  const [view, setView] = useState('songs'); // 'songs' | 'albums'

  // Build top songs list: all rated songs across all albums, sorted desc, max 20
  function getTopSongs() {
    const all = [];
    for (const album of ALL_ALBUMS) {
      const songs = SONGS[album.id] || [];
      for (let i = 0; i < songs.length; i++) {
        const score = getCompositeScore(album.id, i, activeCategories);
        if (score !== null) {
          all.push({ name: songs[i], albumName: album.name, albumIcon: album.icon, score });
        }
      }
    }
    return all.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  // Build top albums list: all albums with at least one rated song, sorted desc
  function getTopAlbums() {
    return ALL_ALBUMS
      .map(album => ({ ...album, score: getAlbumScore(album.id, activeCategories) }))
      .filter(a => a.score !== null)
      .sort((a, b) => b.score - a.score);
  }

  const topSongs = view === 'songs' ? getTopSongs() : [];
  const topAlbums = view === 'albums' ? getTopAlbums() : [];
  const maxScore = view === 'songs'
    ? (topSongs[0]?.score ?? 100)
    : (topAlbums[0]?.score ?? 100);

  function rankIcon(i) {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  }

  const isEmpty = (view === 'songs' && topSongs.length === 0) || (view === 'albums' && topAlbums.length === 0);

  return (
    <div>
      {/* Toggle: Songs | Albums */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['songs', 'albums'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '6px 18px',
              borderRadius: 20,
              border: '0.5px solid #e5e7eb',
              background: view === v ? '#a855f7' : '#ffffff',
              color: view === v ? '#ffffff' : '#374151',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {v === 'songs' ? 'Songs' : 'Albums'}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '40px 0' }}>
          No ratings yet — go to Rate Songs to get started.
        </div>
      )}

      {/* Songs leaderboard */}
      {view === 'songs' && topSongs.map((song, i) => (
        <div key={`${song.albumName}-${song.name}`} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 0',
          borderBottom: '0.5px solid #f3f4f6',
        }}>
          {/* Rank */}
          <span style={{ fontSize: i < 3 ? 16 : 12, color: '#9ca3af', width: 28, textAlign: 'center' }}>
            {rankIcon(i)}
          </span>
          {/* Name + album */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {song.name}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{song.albumIcon} {song.albumName}</div>
          </div>
          {/* Score bar */}
          <ScoreBar score={song.score} maxScore={maxScore} />
          {/* Score */}
          <span style={{ fontSize: 13, fontWeight: 500, color: '#a855f7', width: 28, textAlign: 'right' }}>
            {song.score}
          </span>
        </div>
      ))}

      {/* Spotify attribution — only when viewing albums and at least one cover is available */}
      {view === 'albums' && (
        <SpotifyAttribution
          visible={!!spotifyAlbumArt && Object.keys(spotifyAlbumArt).length > 0}
          style={{ marginBottom: 6 }}
        />
      )}

      {/* Albums leaderboard */}
      {view === 'albums' && topAlbums.map((album, i) => {
        const artUrl = spotifyAlbumArt?.[album.id];
        return (
          <div key={album.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 0',
            borderBottom: '0.5px solid #f3f4f6',
          }}>
            <span style={{ fontSize: i < 3 ? 16 : 12, color: '#9ca3af', width: 28, textAlign: 'center' }}>
              {rankIcon(i)}
            </span>
            {/* Album art tile (Spotify art when connected, color/emoji otherwise) */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              background: artUrl ? '#000' : album.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {artUrl ? (
                <img
                  src={artUrl}
                  alt={album.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                album.icon
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {album.name}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{album.year}</div>
            </div>
            <ScoreBar score={album.score} maxScore={maxScore} />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#a855f7', width: 28, textAlign: 'right' }}>
              {album.score}
            </span>
          </div>
        );
      })}

      {/* Shareable ranking card */}
      <RankingCard
        getCompositeScore={getCompositeScore}
        activeCategories={activeCategories}
        ratings={ratings}
      />
    </div>
  );
}
