import { useState } from 'react';
import { useRatings } from './hooks/useRatings';
import { usePro } from './hooks/usePro';
import { useManualOrder } from './hooks/useManualOrder';
import AlbumGrid from './components/AlbumGrid';
import SongList from './components/SongList';
import Rankings from './components/Rankings';
import Categories from './components/Categories';

// Tab definitions
const TABS = [
  { id: 'albums',     label: 'Albums' },
  { id: 'rate',       label: 'Rate songs' },
  { id: 'rankings',   label: 'Rankings' },
  { id: 'categories', label: 'Categories' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('albums');
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);

  const {
    ratings,
    setStarRating,
    getCompositeScore,
    getAlbumScore,
    getSortedSongs,
    getTopCategoryForSong,
    getRatedCount,
  } = useRatings();

  const {
    isPro,
    unlockPro,
    enabledExtras,
    toggleExtra,
    customCategories,
    addCustomCategory,
    removeCustomCategory,
    categoryWeights,
    setCategoryWeight,
    resetCategoryWeights,
    getActiveCategories,
  } = usePro();

  const activeCategories = getActiveCategories();

  const { getManualOrder, moveUp, moveDown, reorder, setOrder } = useManualOrder();

  function handleSelectAlbum(albumId) {
    setSelectedAlbumId(albumId);
    setActiveTab('rate');
  }

  function handleBack() {
    setActiveTab('albums');
  }

  return (
    <div style={{
      maxWidth: 700,
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100dvh',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* App header + tab bar */}
      <div style={{
        padding: '14px 16px 0',
        borderBottom: '0.5px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        background: '#ffffff',
        zIndex: 10,
      }}>
        <div style={{ fontSize: 17, fontWeight: 500, color: '#111827', marginBottom: 12 }}>
          The Eras Ranker
        </div>
        <div style={{ display: 'flex' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #a855f7' : '2px solid transparent',
                color: activeTab === tab.id ? '#a855f7' : '#6b7280',
                fontWeight: activeTab === tab.id ? 500 : 400,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content area */}
      <div style={{ flex: 1, padding: '0 16px 80px' }}>
        {activeTab === 'albums' && (
          <AlbumGrid
            onSelectAlbum={handleSelectAlbum}
            selectedAlbumId={selectedAlbumId}
            getAlbumScore={getAlbumScore}
            getRatedCount={getRatedCount}
            activeCategories={activeCategories}
          />
        )}

        {activeTab === 'rate' && (
          selectedAlbumId ? (
            <SongList
              albumId={selectedAlbumId}
              onBack={handleBack}
              sortedSongs={getSortedSongs(selectedAlbumId, activeCategories)}
              ratings={ratings}
              activeCategories={activeCategories}
              getCompositeScore={getCompositeScore}
              setStarRating={setStarRating}
              manualOrder={getManualOrder(selectedAlbumId)}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onReorder={reorder}
              onSetOrder={setOrder}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '60px 0' }}>
              Go to Albums and tap one to start rating.
            </div>
          )
        )}

        {activeTab === 'rankings' && (
          <Rankings
            getCompositeScore={getCompositeScore}
            getAlbumScore={getAlbumScore}
            activeCategories={activeCategories}
            ratings={ratings}
          />
        )}

        {activeTab === 'categories' && (
          <Categories
            isPro={isPro}
            unlockPro={unlockPro}
            enabledExtras={enabledExtras}
            toggleExtra={toggleExtra}
            customCategories={customCategories}
            addCustomCategory={addCustomCategory}
            removeCustomCategory={removeCustomCategory}
            activeCategories={activeCategories}
            categoryWeights={categoryWeights}
            setCategoryWeight={setCategoryWeight}
            resetCategoryWeights={resetCategoryWeights}
          />
        )}
      </div>
    </div>
  );
}
