import { useState, useRef, useEffect } from 'react';
import SongRow from './SongRow';
import QuickScore from './QuickScore';
import AlbumCompleteCard from './AlbumCompleteCard';
import { ALBUMS, SONGS } from '../data/albums';

// Full song list for one album with drag-to-reorder and inline scoring.
// Props come from App via useRatings, usePro, and useManualOrder hooks.
export default function SongList({
  albumId,
  onBack,
  sortedSongs,
  ratings,
  activeCategories,
  getCompositeScore,
  setStarRating,
  // Manual order props
  manualOrder,
  onMoveUp,
  onMoveDown,
  onReorder,
  onSetOrder,
  // Auto-launch QuickScore on first mount (Vibe Check flow)
  autoStartScore,
  onAutoStartConsumed,
}) {
  // Which song row is expanded (showing action buttons)
  const [selectedIndex, setSelectedIndex] = useState(null);
  // Songs to pass to the QuickScore overlay (null = closed, array = open)
  const [quickScoreSongs, setQuickScoreSongs] = useState(null);
  // Completion card overlay
  const [showCompletionCard, setShowCompletionCard] = useState(false);
  const [completionShown, setCompletionShown] = useState(false);

  // Drag state: which positions are being dragged from/to
  const [dragState, setDragState] = useState(null); // { fromPos, toPos } | null
  const rowRefs = useRef([]);

  // Track whether the album was incomplete when this view was first opened,
  // so we only show the completion card when it transitions to complete.
  const wasIncompleteOnMount = useRef(
    !(SONGS[albumId] || []).every((_, i) => {
      const key = `${albumId}_${i}`;
      return ratings[key] && Object.keys(ratings[key]).length > 0;
    })
  );

  // Derived: is every song in this album now rated?
  const albumComplete = (SONGS[albumId] || []).every((_, i) => {
    const key = `${albumId}_${i}`;
    return ratings[key] && Object.keys(ratings[key]).length > 0;
  });

  // Show the completion card the first time the album becomes fully ranked
  useEffect(() => {
    if (wasIncompleteOnMount.current && albumComplete && !completionShown) {
      setCompletionShown(true);
      setShowCompletionCard(true);
    }
  }, [albumComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-launch QuickScore when the user chose "Vibe Check" from the mode modal
  useEffect(() => {
    if (autoStartScore) {
      const songs = (SONGS[albumId] || []).map((name, i) => ({
        name,
        index: i,
        score: getCompositeScore(albumId, i, activeCategories),
      }));
      const firstUnscored = songs.findIndex(s => s.score === null);
      setQuickScoreSongs({ songs, initialSongPos: firstUnscored === -1 ? 0 : firstUnscored });
      onAutoStartConsumed?.();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const album = ALBUMS.find(a => a.id === albumId);
  if (!album) return null;

  function handleSongClick(songIndex) {
    if (selectedIndex === songIndex) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(songIndex);
    }
  }

  // Always display in manual order
  const displaySongs = manualOrder.map(songIndex => ({
    name: SONGS[albumId][songIndex],
    index: songIndex,
    score: getCompositeScore(albumId, songIndex, activeCategories),
  }));

  // Show "Rank by score" button when at least one song has been scored
  const hasAnyScore = sortedSongs.some(s => s.score !== null);

  function handleResortByScore() {
    const confirmed = window.confirm(
      'Rank by score?\n\nYour manual order will be replaced with a High → Low score ranking. This cannot be undone.\n\nContinue?'
    );
    if (confirmed) {
      onSetOrder(albumId, sortedSongs.map(s => s.index));
      setSelectedIndex(null);
    }
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function startDrag(fromPos) {
    setDragState({ fromPos, toPos: fromPos });
  }

  function moveDrag(clientY) {
    if (!dragState) return;
    for (let i = 0; i < rowRefs.current.length; i++) {
      const el = rowRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        if (dragState.toPos !== i) {
          setDragState(prev => prev ? { ...prev, toPos: i } : null);
        }
        return;
      }
    }
  }

  function endDrag() {
    if (!dragState) return;
    const { fromPos, toPos } = dragState;
    setDragState(null);
    if (fromPos !== toPos) {
      onReorder(albumId, fromPos, toPos);
    }
  }

  // Shared button style for action bar
  const actionBtnStyle = (primary) => ({
    padding: '5px 10px',
    borderRadius: 6,
    border: primary ? 'none' : '0.5px solid #e5e7eb',
    background: primary ? '#a855f7' : '#ffffff',
    color: primary ? '#ffffff' : '#6b7280',
    fontSize: 12,
    fontWeight: primary ? 500 : 400,
    cursor: 'pointer',
    flexShrink: 0,
  });

  return (
    <div>
      {/* Album completion card — shown once when every song in the album is rated */}
      {showCompletionCard && (
        <AlbumCompleteCard
          albumName={album.name}
          albumIcon={album.icon}
          getCompositeScore={getCompositeScore}
          activeCategories={activeCategories}
          onClose={() => setShowCompletionCard(false)}
        />
      )}

      {/* QuickScore overlay — used for both Score Album and Score single song */}
      {quickScoreSongs !== null && (
        <QuickScore
          songs={quickScoreSongs.songs}
          initialSongPos={quickScoreSongs.initialSongPos}
          albumId={albumId}
          albumName={album.name}
          albumIcon={album.icon}
          activeCategories={activeCategories}
          ratings={ratings}
          onRate={(songIndex, catId, val) => setStarRating(albumId, songIndex, catId, val)}
          onClose={() => setQuickScoreSongs(null)}
        />
      )}

      {/* Header row — back button + album info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: '0.5px solid #e5e7eb',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: 13,
            color: '#374151',
            flexShrink: 0,
          }}
        >
          ← Albums
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 22 }}>{album.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.name}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{album.year} · tap a song to reorder or score</div>
          </div>
        </div>
      </div>

      {/* Score Album button — always visible, kicks off rapid scoring */}
      <button
        onClick={() => {
          const firstUnscored = displaySongs.findIndex(s => s.score === null);
          setQuickScoreSongs({ songs: displaySongs, initialSongPos: firstUnscored === -1 ? 0 : firstUnscored });
        }}
        style={{
          display: 'block',
          width: '100%',
          marginBottom: 8,
          padding: '10px 12px',
          borderRadius: 10,
          border: 'none',
          background: '#a855f7',
          color: '#ffffff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'center',
          letterSpacing: '0.01em',
        }}
      >
        ★ Score Album
      </button>

      {/* Rank by score button — appears once any song has been scored */}
      {hasAnyScore && (
        <button
          onClick={handleResortByScore}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: 10,
            padding: '7px 12px',
            borderRadius: 8,
            border: '0.5px solid #d8b4fe',
            background: '#faf5ff',
            color: '#7c3aed',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Rank by score ↕
        </button>
      )}

      {/* Song rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {displaySongs.map((song, listPos) => {
          const compositeScore = getCompositeScore(albumId, song.index, activeCategories);
          const isDraggingThis = dragState?.fromPos === listPos;
          const lineAbove = dragState && !isDraggingThis && dragState.toPos === listPos && dragState.fromPos > listPos;
          const lineBelow = dragState && !isDraggingThis && dragState.toPos === listPos && dragState.fromPos < listPos;
          const isSelected = selectedIndex === song.index;

          return (
            <div
              key={song.index}
              ref={el => { rowRefs.current[listPos] = el; }}
              style={{
                opacity: isDraggingThis ? 0.35 : 1,
                boxShadow: lineAbove ? '0 -2px 0 #a855f7' : lineBelow ? '0 2px 0 #a855f7' : 'none',
                borderRadius: 8,
                transition: 'opacity 0.15s',
              }}
            >
              <SongRow
                song={song}
                isSelected={isSelected}
                compositeScore={compositeScore}
                onClick={() => handleSongClick(song.index)}
                position={listPos}
                onDragStart={() => startDrag(listPos)}
                onDragMove={(clientY) => moveDrag(clientY)}
                onDragEnd={() => endDrag()}
              />

              {/* Action bar — shown when song is selected */}
              {isSelected && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 10px',
                    background: '#f5f3ff',
                    borderLeft: '3px solid #a855f7',
                    borderRight: '0.5px solid #e9d5ff',
                    borderBottom: '0.5px solid #e9d5ff',
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                  }}
                >
                  {/* Reorder buttons */}
                  <button
                    onClick={() => onMoveUp(albumId, listPos)}
                    disabled={listPos === 0}
                    style={{
                      ...actionBtnStyle(false),
                      opacity: listPos === 0 ? 0.35 : 1,
                    }}
                  >
                    ↑ Up
                  </button>
                  <button
                    onClick={() => onMoveDown(albumId, listPos)}
                    disabled={listPos === displaySongs.length - 1}
                    style={{
                      ...actionBtnStyle(false),
                      opacity: listPos === displaySongs.length - 1 ? 0.35 : 1,
                    }}
                  >
                    ↓ Down
                  </button>

                  <div style={{ flex: 1 }} />

                  {/* Score button — opens QuickScore for this song only */}
                  <button
                    onClick={() => setQuickScoreSongs({ songs: [song], initialSongPos: 0 })}
                    style={actionBtnStyle(true)}
                  >
                    ★ Score
                  </button>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
