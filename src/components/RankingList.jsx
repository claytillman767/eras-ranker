import { useState } from 'react';
import ScoreBar from './ScoreBar';

// Shared rankings list — the Songs | Albums leaderboard used by BOTH the
// Rankings tab (the owner's live view) and ProfileView (what a visitor sees
// at /u/{uid}). Keeping one component guarantees the two stay visually
// identical, which is the whole point: your public profile should look like
// your Rankings tab.
//
// Callers pass already-built, already-sorted arrays:
//   albums: [{ id, name, icon, year, color, score }]
//   songs:  [{ name, albumName, albumIcon, score }]
//
// onSelectAlbum is optional — when provided, album rows become tappable
// (Rankings tab routes into the album). ProfileView omits it (read-only).
//
// The Songs view shows `songPageSize` rows first, then a "Load more"
// button reveals the next batch, matching the agreed 25 → +25 → rest flow.

function rankIcon(i) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `#${i + 1}`;
}

export default function RankingList({
  albums = [],
  songs = [],
  onSelectAlbum,
  initialView = 'songs',
  songPageSize = 25,
}) {
  const [view, setView] = useState(initialView); // 'songs' | 'albums'
  const [songLimit, setSongLimit] = useState(songPageSize);

  const maxScore = view === 'songs'
    ? (songs[0]?.score ?? 100)
    : (albums[0]?.score ?? 100);

  const isEmpty = (view === 'songs' && songs.length === 0)
    || (view === 'albums' && albums.length === 0);

  const visibleSongs = songs.slice(0, songLimit);
  const remaining = songs.length - visibleSongs.length;

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
          {view === 'songs' ? 'No songs rated yet.' : 'No albums rated yet.'}
        </div>
      )}

      {/* Songs leaderboard */}
      {view === 'songs' && visibleSongs.map((song, i) => (
        <div key={`${song.albumName}-${song.name}-${i}`} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 0',
          borderBottom: '0.5px solid #f3f4f6',
        }}>
          <span style={{ fontSize: i < 3 ? 16 : 12, color: '#9ca3af', width: 28, textAlign: 'center' }}>
            {rankIcon(i)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {song.name}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{song.albumIcon} {song.albumName}</div>
          </div>
          <ScoreBar score={song.score} maxScore={maxScore} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#a855f7', width: 28, textAlign: 'right' }}>
            {song.score}
          </span>
        </div>
      ))}

      {/* Load more (Songs view only) */}
      {view === 'songs' && remaining > 0 && (
        <button
          onClick={() => setSongLimit(l => l + songPageSize)}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 14,
            padding: '10px',
            borderRadius: 10,
            border: '0.5px solid #e9d5ff',
            background: '#faf5ff',
            color: '#7c3aed',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {remaining > songPageSize
            ? `Load ${songPageSize} more`
            : `Show all ${songs.length} songs`}
        </button>
      )}

      {/* Albums leaderboard — rows tappable only when onSelectAlbum is given */}
      {view === 'albums' && albums.map((album, i) => {
        const tappable = !!onSelectAlbum;
        return (
          <div
            key={album.id}
            onClick={tappable ? () => onSelectAlbum(album.id) : undefined}
            role={tappable ? 'button' : undefined}
            tabIndex={tappable ? 0 : undefined}
            onKeyDown={tappable ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectAlbum(album.id);
              }
            } : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 0',
              borderBottom: '0.5px solid #f3f4f6',
              cursor: tappable ? 'pointer' : 'default',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: i < 3 ? 16 : 12, color: '#9ca3af', width: 28, textAlign: 'center' }}>
              {rankIcon(i)}
            </span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              background: album.color || '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {album.icon}
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
    </div>
  );
}
