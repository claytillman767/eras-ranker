import { useState, useRef, useEffect } from 'react';
import SongRow from './SongRow';
import AlbumHero from './AlbumHero';
import QuickScore from './QuickScore';
import AlbumCompleteCard from './AlbumCompleteCard';
import MidnightsEasterEgg from './MidnightsEasterEgg';
import ConfirmModal from './ConfirmModal';
import { ALL_ALBUMS, SONGS } from '../data/albums';

const DRAG_HINT_KEY = 'eras_sort_it_yourself_hint_seen';

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
  // Album mode — used to show the one-time drag hint when 'manual'
  albumMode,
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

  // One-time drag hint shown when the user lands in Sort It Yourself mode
  // for the first time. The drag handle (⠿) is small and not labelled and
  // the up/down buttons only appear after a row is tapped, so without this
  // hint a brand-new user has no on-screen signal that drag works.
  const [showDragHint, setShowDragHint] = useState(() => (
    albumMode === 'manual' &&
    !quickScoreSongs &&
    localStorage.getItem(DRAG_HINT_KEY) !== '1'
  ));
  function dismissDragHint() {
    localStorage.setItem(DRAG_HINT_KEY, '1');
    setShowDragHint(false);
  }

  // Custom confirm modal state (replaces window.confirm)
  const [confirmState, setConfirmState] = useState(null);

  // Drag state: which positions are being dragged from/to
  const [dragState, setDragState] = useState(null); // { fromPos, toPos } | null
  const rowRefs = useRef([]);

  // Drop-flash — after a successful drag reorder, briefly highlight the song
  // that just moved so the user can see where it landed (the list re-sorts
  // silently otherwise). flashKey forces the animation to restart when the
  // same song is dragged twice in a row.
  const [flashIndex, setFlashIndex] = useState(null);
  const [flashKey, setFlashKey] = useState(0);

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
    const performResort = () => {
      onSetOrder(albumId, sortedSongs.map(s => s.index));
      setSelectedIndex(null);
    };
    // Skip the "this cannot be undone" warning when there's no manual
    // order to lose — i.e. the album is still in its default tracklist
    // order. The default is just [0, 1, 2, ...n-1], so any list whose
    // entries equal their position has never been hand-sorted.
    const isUntouched = manualOrder.every((songIdx, listPos) => songIdx === listPos);
    if (isUntouched) {
      performResort();
      return;
    }
    setConfirmState({
      title: 'Rank by score?',
      body: 'Your manual order will be replaced with a High → Low score ranking. This cannot be undone.',
      confirmLabel: 'Rank by score',
      destructive: true,
      onConfirm: performResort,
    });
  }

  // ── Drag handlers ───────────────────────────────────────────────

  function startDrag(fromPos) {
    setDragState({ fromPos, toPos: fromPos });
    // Power users who figure out drag on their own shouldn't have to tap
    // "Got it" — dismiss the hint as soon as they actually use it.
    if (showDragHint) dismissDragHint();
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
      const movedSongIndex = displaySongs[fromPos].index;
      onReorder(albumId, fromPos, toPos);
      setFlashIndex(movedSongIndex);
      setFlashKey(k => k + 1);
      setTimeout(() => {
        setFlashIndex(prev => (prev === movedSongIndex ? null : prev));
      }, 900);
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

  return (
    <div>
      {/* Drop-flash keyframes — animates a soft purple ring/glow on the
          row that was just reordered, fading out over ~900ms. */}
      <style>{`
        @keyframes song-row-drop-flash {
          0%   { box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.55), 0 4px 14px rgba(168, 85, 247, 0.25); }
          70%  { box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.20), 0 4px 14px rgba(168, 85, 247, 0.08); }
          100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0),    0 0 0 rgba(168, 85, 247, 0); }
        }
      `}</style>

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
          albumId={albumId}
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
          ★ Vibe Check
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
        </div>

        {/* One-time drag hint — shown only on first entry into Sort It
            Yourself mode. Auto-dismisses as soon as the user actually drags. */}
        {showDragHint && !quickScoreSongs && (
          <DragHint onDismiss={dismissDragHint} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {displaySongs.map((song, listPos) => {
            const compositeScore = getCompositeScore(albumId, song.index, activeCategories);
            const songRatings = ratings[`${albumId}_${song.index}`] || null;
            const isDraggingThis = dragState?.fromPos === listPos;
            const lineAbove = dragState && !isDraggingThis && dragState.toPos === listPos && dragState.fromPos > listPos;
            const lineBelow = dragState && !isDraggingThis && dragState.toPos === listPos && dragState.fromPos < listPos;
            const isSelected = selectedIndex === song.index;

            const isFlashing = song.index === flashIndex;

            return (
              <div
                // Re-key during a flash so the keyframe animation restarts
                // every time the same song is dropped.
                key={isFlashing ? `${song.index}-flash-${flashKey}` : song.index}
                ref={el => { rowRefs.current[listPos] = el; }}
                style={{
                  opacity: isDraggingThis ? 0.35 : 1,
                  boxShadow: lineAbove ? '0 -2px 0 #a855f7' : lineBelow ? '0 2px 0 #a855f7' : 'none',
                  borderRadius: 10,
                  transition: 'opacity 0.15s',
                  animation: isFlashing ? 'song-row-drop-flash 900ms ease-out' : undefined,
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

      {confirmState && (
        <ConfirmModal
          {...confirmState}
          onClose={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}

// One-time hint card shown above the song list when a user enters Sort It
// Yourself mode for the first time. Includes a downward arrow that visually
// points at the drag handles below it.
function DragHint({ onDismiss }) {
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
      border: '0.5px solid #e9d5ff',
      borderRadius: 12,
      padding: '12px 14px',
      marginBottom: 18,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {/* Big drag handle glyph so the user learns what to look for */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: '#ffffff',
        border: '0.5px solid #e9d5ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a855f7',
        fontSize: 22,
        flexShrink: 0,
      }}>
        ⠿
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
          Drag to reorder
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
          Hold the ⠿ on any row and drag it up or down.
        </div>
      </div>

      <button
        onClick={onDismiss}
        style={{
          background: '#a855f7',
          color: '#ffffff',
          border: 'none',
          borderRadius: 999,
          padding: '7px 14px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Got it
      </button>

      {/* Downward triangle pointing at the first row's drag handle */}
      <div style={{
        position: 'absolute',
        bottom: -7,
        left: 30,
        width: 0,
        height: 0,
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop: '7px solid #f3e8ff',
      }} />
    </div>
  );
}
