import { useState, useRef, useEffect } from 'react';
import SongRow from './SongRow';
import AlbumHero from './AlbumHero';
import QuickScore from './QuickScore';
import AlbumCompleteCard from './AlbumCompleteCard';
import MidnightsEasterEgg from './MidnightsEasterEgg';
import { ALL_ALBUMS, SONGS } from '../data/albums';

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
  // Auto-launch QuickScore on first mount (Vibe Check flow or Continue card)
  autoStartScore,
  autoStartSongIndex,   // when set, opens QuickScore on this specific song index
  onAutoStartConsumed,
  // Extra data hooks needed for AlbumHero
  getAlbumScore,
  getRatedCount,
  // Display settings
  showCategoryBars,
  // Spotify playback (optional — omit to hide the feature entirely)
  spotify,
  spotifyAutoplay,
  spotifyBridgeAutoplay,
  spotifyAlbumArt,
  onGoToSpotifySettings,
  // Rating behavior
  confirmExit,
  updateSetting,
}) {
  // Which song row is expanded (showing action buttons)
  const [selectedIndex, setSelectedIndex] = useState(null);
  // Songs to pass to the QuickScore overlay (null = closed, array = open)
  const [quickScoreSongs, setQuickScoreSongs] = useState(null);
  // Completion card overlay
  const [showCompletionCard, setShowCompletionCard] = useState(false);
  const [completionShown, setCompletionShown] = useState(false);
  // Midnights Easter egg — shown before the completion card for album 'ml'
  const [showMidnightsEgg, setShowMidnightsEgg] = useState(false);

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

  // Show the completion card the first time the album becomes fully ranked,
  // but only after QuickScore has closed.
  useEffect(() => {
    if (wasIncompleteOnMount.current && albumComplete && !completionShown && quickScoreSongs === null) {
      setCompletionShown(true);
      if (albumId === 'ml') {
        setShowMidnightsEgg(true);
      } else {
        setShowCompletionCard(true);
      }
    }
  }, [albumComplete, quickScoreSongs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-launch QuickScore when the user chose "Vibe Check" or tapped Continue
  useEffect(() => {
    if (autoStartScore) {
      const songs = (SONGS[albumId] || []).map((name, i) => ({
        name,
        index: i,
        score: getCompositeScore(albumId, i, activeCategories),
      }));
      let initialPos;
      if (autoStartSongIndex !== null && autoStartSongIndex !== undefined) {
        // Continue card — open on the specific song
        initialPos = autoStartSongIndex;
      } else {
        // Vibe Check — start from first unscored song
        const firstUnscored = songs.findIndex(s => s.score === null);
        initialPos = firstUnscored === -1 ? 0 : firstUnscored;
      }
      setQuickScoreSongs({ songs, initialSongPos: initialPos });
      onAutoStartConsumed?.();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const album = ALL_ALBUMS.find(a => a.id === albumId);
  if (!album) return null;

  function handleSongClick(songIndex) {
    setSelectedIndex(prev => (prev === songIndex ? null : songIndex));
  }

  // Always display in manual order
  const displaySongs = manualOrder.map(songIndex => ({
    name: SONGS[albumId][songIndex],
    index: songIndex,
    score: getCompositeScore(albumId, songIndex, activeCategories),
  }));

  // Show "Rank by score" when at least one song has been scored
  const hasAnyScore = sortedSongs.some(s => s.score !== null);

  // Detect whether the current manual order already matches score order
  const isRankedByScore = hasAnyScore &&
    JSON.stringify(manualOrder) === JSON.stringify(sortedSongs.map(s => s.index));

  function handleResortByScore() {
    const confirmed = window.confirm(
      'Rank by score?\n\nYour manual order will be replaced with a High → Low score ranking. This cannot be undone.\n\nContinue?'
    );
    if (confirmed) {
      onSetOrder(albumId, sortedSongs.map(s => s.index));
      setSelectedIndex(null);
    }
  }

  // ── Drag handlers ───────────────────────────────────────────────

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

  // Shared style for the selected-row action bar buttons
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

  // Build the section-header legend: abbreviations of the first 4 active categories
  const catLegend = activeCategories.slice(0, 4).map(c => abbrevLabel(c.name)).join(' · ');

  return (
    <div>
      {/* Midnights Easter egg */}
      {showMidnightsEgg && (
        <MidnightsEasterEgg
          onDone={() => {
            setShowMidnightsEgg(false);
            setShowCompletionCard(true);
          }}
        />
      )}

      {/* Album completion card */}
      {showCompletionCard && (
        <AlbumCompleteCard
          albumName={album.name}
          albumIcon={album.icon}
          getCompositeScore={getCompositeScore}
          activeCategories={activeCategories}
          onClose={() => setShowCompletionCard(false)}
        />
      )}

      {/* QuickScore overlay */}
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
          spotify={spotify}
          spotifyAutoplay={spotifyAutoplay}
          spotifyBridgeAutoplay={spotifyBridgeAutoplay}
          confirmExit={confirmExit}
          updateSetting={updateSetting}
          onGoToSpotifySettings={onGoToSpotifySettings}
        />
      )}

      {/* ── Album hero (replaces the old small header) ── */}
      <AlbumHero
        albumId={albumId}
        getCompositeScore={getCompositeScore}
        getAlbumScore={getAlbumScore}
        getRatedCount={getRatedCount}
        activeCategories={activeCategories}
        onBack={onBack}
        spotifyArtUrl={spotifyAlbumArt?.[albumId] ?? null}
      />

      {/* ── Action buttons ── */}
      <div style={{ padding: '0 16px 14px' }}>
        <button
          onClick={() => {
            const firstUnscored = displaySongs.findIndex(s => s.score === null);
            setQuickScoreSongs({
              songs: displaySongs,
              initialSongPos: firstUnscored === -1 ? 0 : firstUnscored,
            });
          }}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: 8,
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            background: '#a855f7',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(168,85,247,0.25)',
          }}
        >
          ★ Score Album
        </button>

        {hasAnyScore && (
          <button
            onClick={handleResortByScore}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '0.5px solid #d8b4fe',
              background: '#faf5ff',
              color: '#7c3aed',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {isRankedByScore ? '✓ Ranked by score' : 'Rank by score ↕'}
          </button>
        )}
      </div>

      {/* ── Song rows ── */}
      <div style={{ padding: '0 16px 80px' }}>
        {/* Section header with optional category legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Songs
          </div>
          {hasAnyScore && showCategoryBars !== false && (
            <div style={{ fontSize: 10, color: '#9ca3af' }}>
              {catLegend}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {displaySongs.map((song, listPos) => {
            const compositeScore = getCompositeScore(albumId, song.index, activeCategories);
            const songRatings = ratings[`${albumId}_${song.index}`] || null;
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
                  borderRadius: 10,
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
                  songRatings={songRatings}
                  activeCategories={activeCategories}
                  showCategoryBars={showCategoryBars}
                />

                {/* Action bar — shown when song row is selected */}
                {isSelected && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 10px',
                    background: '#f5f3ff',
                    borderLeft: '3px solid #a855f7',
                    borderRight: '0.5px solid #e9d5ff',
                    borderBottom: '0.5px solid #e9d5ff',
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                  }}>
                    <button
                      onClick={() => onMoveUp(albumId, listPos)}
                      disabled={listPos === 0}
                      style={{ ...actionBtnStyle(false), opacity: listPos === 0 ? 0.35 : 1 }}
                    >
                      ↑ Up
                    </button>
                    <button
                      onClick={() => onMoveDown(albumId, listPos)}
                      disabled={listPos === displaySongs.length - 1}
                      style={{ ...actionBtnStyle(false), opacity: listPos === displaySongs.length - 1 ? 0.35 : 1 }}
                    >
                      ↓ Down
                    </button>
                    <div style={{ flex: 1 }} />
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
    </div>
  );
}

function abbrevLabel(name) {
  const MAP = {
    'Lyrics': 'Lyrics',
    'Music / melody': 'Music',
    'Bridge': 'Bridge',
    'Nostalgia': 'Nostlg',
    'Skip on shuffle?': 'Skip',
    'Hook / chorus': 'Hook',
    'Vocal performance': 'Vocal',
    'Cry factor': 'Cry',
    'Romantic feel': 'Rom',
    'Hype / energy': 'Hype',
    'Opening line': 'Open',
    'Vibe / atmosphere': 'Vibe',
    'Storytelling': 'Story',
  };
  return MAP[name] || name.slice(0, 6);
}
