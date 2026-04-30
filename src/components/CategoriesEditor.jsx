import { useState } from 'react';
import Categories from './Categories';
import { ALL_ALBUMS, SONGS } from '../data/albums';

// Compute the top-N rated songs across all albums by composite score.
function getTopSongs(getCompositeScore, activeCategories, n = 10) {
  const all = [];
  for (const album of ALL_ALBUMS) {
    const songs = SONGS[album.id] || [];
    for (let i = 0; i < songs.length; i++) {
      const score = getCompositeScore(album.id, i, activeCategories);
      if (score !== null) {
        all.push({
          id: `${album.id}_${i}`,
          name: songs[i],
          albumName: album.name,
          albumIcon: album.icon,
          score,
        });
      }
    }
  }
  return all.sort((a, b) => b.score - a.score).slice(0, n);
}

// Compute the top-N rated albums by album-level score.
function getTopAlbums(getAlbumScore, activeCategories, n = 5) {
  return ALL_ALBUMS
    .map(album => ({
      id: album.id,
      name: album.name,
      icon: album.icon,
      year: album.year,
      score: getAlbumScore(album.id, activeCategories),
    }))
    .filter(a => a.score !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

// For each item in newList, look up its position in oldList. Returns
// new array with `delta` (positions moved up: positive, down: negative,
// or string 'new' for entries that weren't on the old list).
function annotateDiff(oldList, newList) {
  const oldMap = new Map(oldList.map((item, idx) => [item.id, idx]));
  return newList.map((item, idx) => {
    const oldPos = oldMap.get(item.id);
    let delta;
    if (oldPos === undefined) delta = 'new';
    else delta = oldPos - idx; // + means moved up (lower idx)
    return { ...item, oldPos, delta };
  });
}

// Items present in oldList but absent from newList.
function findDropouts(oldList, newList) {
  const newIds = new Set(newList.map(i => i.id));
  return oldList.filter(i => !newIds.has(i.id));
}

// Visual delta indicator for a row in the preview.
function DeltaBadge({ delta }) {
  if (delta === 'new') {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: '#a855f7',
        background: '#f3e8ff',
        borderRadius: 4,
        padding: '2px 6px',
        letterSpacing: '0.04em',
      }}>NEW</span>
    );
  }
  if (delta === 0) {
    return <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>;
  }
  if (delta > 0) {
    return <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>↑{delta}</span>;
  }
  return <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>↓{Math.abs(delta)}</span>;
}

function PreviewRow({ rank, item, isAlbum }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 0',
      borderBottom: '0.5px solid #f3f4f6',
    }}>
      <span style={{ fontSize: 12, color: '#9ca3af', width: 22, textAlign: 'center', fontWeight: 500 }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: '#111827',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {isAlbum
            ? `${item.icon} ${item.name}`
            : item.name}
        </div>
        {!isAlbum && (
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            {item.albumIcon} {item.albumName}
          </div>
        )}
      </div>
      <DeltaBadge delta={item.delta} />
      <span style={{ fontSize: 13, fontWeight: 500, color: '#a855f7', width: 28, textAlign: 'right' }}>
        {item.score}
      </span>
    </div>
  );
}

// Preview screen — shown after the user finishes editing weights/toggles, only
// if the top rankings actually shifted. Read-only display; the user's edits
// are already saved. They can re-open the editor any time to keep tweaking.
function Preview({ songDiff, albumDiff, songDropouts, albumDropouts, onDone }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 220,
      background: '#ffffff',
      display: 'flex', flexDirection: 'column',
      maxWidth: 700, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid #e5e7eb',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
          Here's what your changes did
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
          Your category settings are saved. Adjust them again any time.
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 90px' }}>
        {/* Top songs */}
        {songDiff.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, color: '#9ca3af', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 6,
            }}>
              Top songs now
            </div>
            {songDiff.map((s, i) => (
              <PreviewRow key={s.id} rank={i + 1} item={s} isAlbum={false} />
            ))}
            {songDropouts.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
                  Off the top {songDiff.length}:
                </div>
                {songDropouts.map(s => (
                  <div key={s.id} style={{
                    fontSize: 12, color: '#6b7280',
                    padding: '3px 0',
                  }}>
                    • {s.name} <span style={{ color: '#9ca3af' }}>({s.albumName})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top albums */}
        {albumDiff.length > 0 && (
          <div>
            <div style={{
              fontSize: 11, color: '#9ca3af', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 6,
            }}>
              Top albums now
            </div>
            {albumDiff.map((a, i) => (
              <PreviewRow key={a.id} rank={i + 1} item={a} isAlbum />
            ))}
            {albumDropouts.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
                  Off the top {albumDiff.length}:
                </div>
                {albumDropouts.map(a => (
                  <div key={a.id} style={{
                    fontSize: 12, color: '#6b7280',
                    padding: '3px 0',
                  }}>
                    • {a.icon} {a.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single primary action — preview is read-only acknowledgement */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 16,
        background: 'linear-gradient(180deg, transparent, #ffffff 30%)',
        display: 'flex', justifyContent: 'center',
      }}>
        <button
          onClick={onDone}
          style={{
            background: '#a855f7',
            color: '#ffffff',
            border: 'none',
            borderRadius: 22,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(168,85,247,0.25)',
            maxWidth: 480, width: '100%',
          }}
        >
          Okay
        </button>
      </div>
    </div>
  );
}

// Full-screen Rating Categories editor. Captures the top songs/albums on
// open, lets the user edit weights/toggles inline, and on Done shows a
// preview screen of how the rankings shifted.
export default function CategoriesEditor({
  onClose,
  getCompositeScore,
  getAlbumScore,
  // ...everything Categories needs (forwarded as a single object below)
  ...categoriesProps
}) {
  // Snapshot once on first render — captures the rankings BEFORE any edits.
  const [snapshot] = useState(() => ({
    songs: getTopSongs(getCompositeScore, categoriesProps.activeCategories, 10),
    albums: getTopAlbums(getAlbumScore, categoriesProps.activeCategories, 5),
  }));

  const [preview, setPreview] = useState(null);

  function handleDone() {
    // Use the LATEST activeCategories (after user's edits) to recompute.
    const newSongs = getTopSongs(getCompositeScore, categoriesProps.activeCategories, 10);
    const newAlbums = getTopAlbums(getAlbumScore, categoriesProps.activeCategories, 5);

    const songDiff = annotateDiff(snapshot.songs, newSongs);
    const albumDiff = annotateDiff(snapshot.albums, newAlbums);
    const songDropouts = findDropouts(snapshot.songs, newSongs);
    const albumDropouts = findDropouts(snapshot.albums, newAlbums);

    // If neither the top-songs ordering nor the top-albums ordering changed,
    // skip the preview screen entirely — it would have nothing useful to show.
    const orderingUnchanged =
      songDiff.every(s => s.delta === 0) &&
      albumDiff.every(a => a.delta === 0) &&
      songDropouts.length === 0 &&
      albumDropouts.length === 0;

    if (orderingUnchanged) {
      onClose();
      return;
    }

    setPreview({ songDiff, albumDiff, songDropouts, albumDropouts });
  }

  if (preview) {
    return <Preview {...preview} onDone={onClose} />;
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 210,
      background: '#ffffff',
      display: 'flex', flexDirection: 'column',
      maxWidth: 700, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          aria-label="Back"
          style={{
            background: 'transparent',
            border: 'none',
            padding: '4px 6px',
            fontSize: 14,
            color: '#a855f7',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
          Rating Categories
        </div>
        <span style={{ width: 50 }} /> {/* spacer to balance the back button */}
      </div>

      {/* Body — Categories component, scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 90px' }}>
        <Categories {...categoriesProps} />
      </div>

      {/* Footer Done button */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 16,
        background: 'linear-gradient(180deg, transparent, #ffffff 30%)',
        display: 'flex', justifyContent: 'center',
      }}>
        <button
          onClick={handleDone}
          style={{
            background: '#a855f7',
            color: '#ffffff',
            border: 'none',
            borderRadius: 22,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(168,85,247,0.25)',
            maxWidth: 480, width: '100%',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
