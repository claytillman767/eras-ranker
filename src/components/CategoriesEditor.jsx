import { useState } from 'react';
import Categories from './Categories';
import { ALL_ALBUMS, SONGS } from '../data/albums';

// Compute ALL rated songs across all albums, sorted by composite score
// descending, with each item carrying its rank (1-indexed). Captures the
// whole ranked universe so the preview can tell the user "Tim McGraw was
// #29, now it's #8" for songs that climbed up from outside the top 10.
function getAllRankedSongs(getCompositeScore, activeCategories) {
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
  all.sort((a, b) => b.score - a.score);
  return all.map((s, i) => ({ ...s, rank: i + 1 }));
}

// Compute ALL rated albums, sorted by album-level score, with rank.
function getAllRankedAlbums(getAlbumScore, activeCategories) {
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
    .map((a, i) => ({ ...a, rank: i + 1 }));
}

// For each item in the new top-N, look up its old rank+score so we can
// show "was #29 · +23 pts" style annotations. If the song wasn't rated
// before, oldRank/oldScore/rankDelta/scoreDelta are all null.
function annotateTopChanges(oldList, newList, topN) {
  const oldMap = new Map(oldList.map(item => [item.id, item]));
  return newList.slice(0, topN).map(item => {
    const old = oldMap.get(item.id);
    return {
      ...item,
      oldRank: old?.rank ?? null,
      oldScore: old?.score ?? null,
      rankDelta: old ? old.rank - item.rank : null,        // + = moved up (lower rank #)
      scoreDelta: old ? item.score - old.score : null,     // + = score went up
    };
  });
}

// Items that WERE in the old top-N but no longer are. Each gets its new
// rank/score so the dropouts list can say "was #4, now #15 · -12 pts".
function findDropouts(oldList, newList, topN) {
  const newMap = new Map(newList.map(item => [item.id, item]));
  return oldList.slice(0, topN).filter(item => {
    const newPos = newMap.get(item.id);
    return !newPos || newPos.rank > topN;
  }).map(oldItem => {
    const newItem = newMap.get(oldItem.id);
    return {
      ...oldItem,
      newRank: newItem?.rank ?? null,
      newScore: newItem?.score ?? null,
      scoreDelta: newItem ? newItem.score - oldItem.score : null,
    };
  });
}

// Builds the "was #29 · +23 pts" or "was newly rated · score 70" change text
// shown under each row of the preview. Returns null when nothing changed
// (dash treatment).
function changeLineParts(item) {
  // Brand-new song that wasn't rated before this session
  // (oldRank null because the song had no composite score at snapshot time)
  if (item.oldRank == null) {
    return [{ text: 'newly rated', color: 'var(--brand-text)' }];
  }
  const parts = [];
  if (item.oldRank !== item.rank) {
    parts.push({ text: `was #${item.oldRank}`, color: 'var(--text-2)' });
  }
  if (item.scoreDelta !== 0) {
    const positive = item.scoreDelta > 0;
    parts.push({
      text: `${positive ? '+' : '−'}${Math.abs(item.scoreDelta)} pts`,
      color: positive ? 'var(--success-text)' : 'var(--danger-text)',
    });
  }
  if (parts.length === 0) return null; // truly unchanged
  return parts;
}

function PreviewRow({ rank, item, isAlbum }) {
  const changes = changeLineParts(item);
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 0',
      borderBottom: '0.5px solid var(--hairline)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)', width: 22, textAlign: 'center', fontWeight: 500 }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {isAlbum
            ? `${item.icon} ${item.name}`
            : item.name}
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-3)',
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
          marginTop: 2,
        }}>
          {!isAlbum && <span>{item.albumIcon} {item.albumName}</span>}
          {changes && (
            <>
              {!isAlbum && <span style={{ color: 'var(--control-off)' }}>·</span>}
              {changes.map((part, i) => (
                <span key={i} style={{ color: part.color, fontWeight: 500 }}>
                  {part.text}
                  {i < changes.length - 1 && <span style={{ color: 'var(--control-off)', marginLeft: 6 }}>·</span>}
                </span>
              ))}
            </>
          )}
          {!changes && <span style={{ color: 'var(--text-3)' }}>unchanged</span>}
        </div>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-text)', width: 32, textAlign: 'right' }}>
        {item.score}
      </span>
    </div>
  );
}

// One row in the "Off the top N" dropout list. Shows the song's old rank,
// new rank (if still ranked), and score delta.
function DropoutRow({ item, isAlbum }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--text-2)', padding: '4px 0', lineHeight: 1.4 }}>
      • {isAlbum ? `${item.icon} ${item.name}` : item.name}
      {!isAlbum && <span style={{ color: 'var(--text-3)' }}> ({item.albumName})</span>}
      <span style={{ color: 'var(--text-3)' }}>
        {' '}— was #{item.rank}
        {item.newRank != null
          ? `, now #${item.newRank}`
          : ', no longer ranked'}
        {item.scoreDelta != null && item.scoreDelta !== 0 && (
          <span style={{
            color: item.scoreDelta > 0 ? 'var(--success-text)' : 'var(--danger-text)',
            fontWeight: 500,
            marginLeft: 6,
          }}>
            {item.scoreDelta > 0 ? '+' : '−'}{Math.abs(item.scoreDelta)} pts
          </span>
        )}
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
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      maxWidth: 700, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
          Here's what your changes did
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
          Your category settings are saved. Adjust them again any time.
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 90px' }}>
        {/* Top songs */}
        {songDiff.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, color: 'var(--text-3)', fontWeight: 600,
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
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>
                  Off the top {songDiff.length}:
                </div>
                {songDropouts.map(s => (
                  <DropoutRow key={s.id} item={s} isAlbum={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top albums */}
        {albumDiff.length > 0 && (
          <div>
            <div style={{
              fontSize: 11, color: 'var(--text-3)', fontWeight: 600,
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
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>
                  Off the top {albumDiff.length}:
                </div>
                {albumDropouts.map(a => (
                  <DropoutRow key={a.id} item={a} isAlbum />
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
        background: 'linear-gradient(180deg, transparent, var(--surface) 30%)',
        display: 'flex', justifyContent: 'center',
      }}>
        <button
          onClick={onDone}
          style={{
            background: 'var(--brand)',
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
  // Snapshot the FULL ranked universe (not just top 10) once on first render.
  // Capturing every song lets the preview say "Tim McGraw was #29" rather
  // than just "NEW" — which is meaningless if you're trying to understand
  // how much your tweaks moved a song.
  const [snapshot] = useState(() => ({
    songs: getAllRankedSongs(getCompositeScore, categoriesProps.activeCategories),
    albums: getAllRankedAlbums(getAlbumScore, categoriesProps.activeCategories),
  }));

  const [preview, setPreview] = useState(null);

  function handleDone() {
    // Use the LATEST activeCategories (after user's edits) to recompute.
    const newAllSongs = getAllRankedSongs(getCompositeScore, categoriesProps.activeCategories);
    const newAllAlbums = getAllRankedAlbums(getAlbumScore, categoriesProps.activeCategories);

    const TOP_SONGS = 10;
    const TOP_ALBUMS = 5;
    const songDiff = annotateTopChanges(snapshot.songs, newAllSongs, TOP_SONGS);
    const albumDiff = annotateTopChanges(snapshot.albums, newAllAlbums, TOP_ALBUMS);
    const songDropouts = findDropouts(snapshot.songs, newAllSongs, TOP_SONGS);
    const albumDropouts = findDropouts(snapshot.albums, newAllAlbums, TOP_ALBUMS);

    // Skip preview only if literally nothing changed — every top item kept its
    // exact rank AND its exact score, with no dropouts. Any score drift (even
    // without rank movement) is worth showing.
    const literallyNoChange =
      songDiff.every(s => s.rankDelta === 0 && s.scoreDelta === 0) &&
      albumDiff.every(a => a.rankDelta === 0 && a.scoreDelta === 0) &&
      songDropouts.length === 0 &&
      albumDropouts.length === 0;

    if (literallyNoChange) {
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
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      maxWidth: 700, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--border)',
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
            color: 'var(--brand-text)',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
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
        background: 'linear-gradient(180deg, transparent, var(--surface) 30%)',
        display: 'flex', justifyContent: 'center',
      }}>
        <button
          onClick={handleDone}
          style={{
            background: 'var(--brand)',
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
