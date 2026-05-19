import { useState } from 'react';
import ScoreBar from './ScoreBar';
import StarRating from './StarRating';

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

// Expanded panel under a song row — shows users exactly how the 0–100
// score was built from the category stars they gave. The average is
// recomputed here from ONLY the rated rows so what's shown always adds
// up to the displayed score. Unrated categories are still listed (grayed
// out) so users can see what they haven't rated yet.
function ScoreBreakdown({ song }) {
  const cats = (song.categories || []);
  // Backward compatibility: older mirrored docs don't carry `rated`. Treat
  // any row that has stars > 0 as rated; missing flag → derive from stars.
  const normalized = cats.map(c => ({ ...c, rated: c.rated ?? c.stars > 0 }));
  const rated = normalized.filter(c => c.rated);
  const unrated = normalized.filter(c => !c.rated);

  let num = 0;
  let den = 0;
  for (const c of rated) {
    num += c.stars * c.weight;
    den += c.weight;
  }
  const avg = den > 0 ? num / den : 0;

  return (
    <div style={{
      background: '#faf5ff',
      border: '0.5px solid #e9d5ff',
      borderRadius: 10,
      padding: '12px 14px',
      margin: '4px 0 10px 38px',
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: '#7c3aed',
        marginBottom: 10,
      }}>
        HOW THIS SCORE IS BUILT
      </div>

      {/* Rated categories — these are what built the score */}
      {rated.map(c => (
        <div key={c.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 0',
        }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.label}
          </span>
          <StarRating value={c.stars} readonly size="sm" />
          <span style={{ width: 56, textAlign: 'right', fontSize: 11, color: '#9ca3af' }}>
            weight {c.weight}%
          </span>
        </div>
      ))}

      {/* Unrated categories — listed so users see what they didn't rate */}
      {unrated.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '0.5px dashed #e9d5ff' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', marginBottom: 4, letterSpacing: '0.03em' }}>
            NOT RATED — DOESN'T COUNT TOWARD THE SCORE
          </div>
          {unrated.map(c => (
            <div key={c.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '3px 0',
              opacity: 0.55,
            }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.label}
              </span>
              <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>not rated</span>
              <span style={{ width: 56, textAlign: 'right', fontSize: 11, color: '#9ca3af' }}>
                weight {c.weight}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* The math */}
      <div style={{ borderTop: '0.5px solid #e9d5ff', margin: '8px 0 0', paddingTop: 8 }}>
        <div style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>
          Weighted average of your stars: <strong>{avg.toFixed(2)}</strong> out of 5
        </div>
        <div style={{ fontSize: 12, color: '#374151' }}>
          Scaled to 100: {avg.toFixed(2)} ÷ 5 × 100 = <strong style={{ color: '#a855f7' }}>{song.score}</strong>
        </div>
      </div>
    </div>
  );
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
  const [openSong, setOpenSong] = useState(null); // key of expanded song row

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

      {/* Songs leaderboard — tap a row to see how its score was built */}
      {view === 'songs' && visibleSongs.map((song, i) => {
        const key = `${song.albumName}-${song.name}-${i}`;
        const expandable = Array.isArray(song.categories) && song.categories.length > 0;
        const open = openSong === key;
        return (
          <div key={key}>
            <div
              onClick={expandable ? () => setOpenSong(open ? null : key) : undefined}
              role={expandable ? 'button' : undefined}
              tabIndex={expandable ? 0 : undefined}
              aria-expanded={expandable ? open : undefined}
              onKeyDown={expandable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenSong(open ? null : key);
                }
              } : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '0.5px solid #f3f4f6',
                cursor: expandable ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: i < 3 ? 16 : 12, color: '#9ca3af', width: 28, textAlign: 'center' }}>
                {rankIcon(i)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.name}
                  {expandable && (
                    <span style={{ color: '#c4b5fd', fontSize: 11, marginLeft: 6 }}>
                      {open ? '▾' : '▸'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{song.albumIcon} {song.albumName}</div>
              </div>
              <ScoreBar score={song.score} maxScore={maxScore} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#a855f7', width: 28, textAlign: 'right' }}>
                {song.score}
              </span>
            </div>
            {expandable && open && <ScoreBreakdown song={song} />}
          </div>
        );
      })}

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
