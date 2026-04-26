import { useState, useRef, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useRatings } from './hooks/useRatings';
import { usePro } from './hooks/usePro';
import { useManualOrder } from './hooks/useManualOrder';
import { useAlbumModes } from './hooks/useAlbumModes';
import AlbumGrid from './components/AlbumGrid';
import AlbumModeModal from './components/AlbumModeModal';
import SongList from './components/SongList';
import Rankings from './components/Rankings';
import Categories from './components/Categories';
import { ALL_ALBUMS } from './data/albums';

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Auth — knows who is signed in (or null if not signed in)
  const { user, authLoading, signIn, signOut } = useAuth();

  // Data hooks — each one accepts user so it can sync to Firestore when signed in
  const {
    ratings,
    setStarRating,
    getCompositeScore,
    getAlbumScore,
    getSortedSongs,
    getTopCategoryForSong,
    getRatedCount,
  } = useRatings(user);

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
  } = usePro(user);

  const activeCategories = getActiveCategories();

  const { getManualOrder, moveUp, moveDown, reorder, setOrder } = useManualOrder(user);
  const { getAlbumMode, setAlbumMode } = useAlbumModes(user);

  // Album waiting for a mode choice; null = no modal shown
  const [pendingAlbumId, setPendingAlbumId] = useState(null);
  // When true, SongList will auto-launch QuickScore on mount
  const [autoStartScore, setAutoStartScore] = useState(false);

  // Close the user menu if the user clicks anywhere outside it
  useEffect(() => {
    if (!showUserMenu) return;
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserMenu]);

  function handleSelectAlbum(albumId) {
    const mode = getAlbumMode(albumId);
    if (mode === null) {
      // First visit — show the mode-choice modal
      setPendingAlbumId(albumId);
    } else {
      setSelectedAlbumId(albumId);
      setActiveTab('rate');
    }
  }

  function handleChooseScore() {
    setAlbumMode(pendingAlbumId, 'score');
    setSelectedAlbumId(pendingAlbumId);
    setAutoStartScore(true);
    setPendingAlbumId(null);
    setActiveTab('rate');
  }

  function handleChooseManual() {
    setAlbumMode(pendingAlbumId, 'manual');
    setSelectedAlbumId(pendingAlbumId);
    setAutoStartScore(false);
    setPendingAlbumId(null);
    setActiveTab('rate');
  }

  function handleBack() {
    setActiveTab('albums');
  }

  // Get the first letter of the user's name for the avatar fallback
  const userInitial = user?.displayName?.charAt(0)?.toUpperCase() ?? '?';

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
        {/* Title row with login button on the right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#111827' }}>
            The Eras Ranker
          </div>

          {/* Auth area — top right */}
          {authLoading ? (
            // Small placeholder while Firebase figures out auth state
            <div style={{ width: 32, height: 32 }} />
          ) : user ? (
            // Signed in — show avatar; click opens a mini menu
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                title={user.displayName ?? 'Account'}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '2px solid #a855f7',
                  padding: 0,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  background: '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName ?? 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#a855f7' }}>{userInitial}</span>
                )}
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: 40,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  minWidth: 180,
                  zIndex: 100,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 2 }}>
                      {user.displayName}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); signOut(); }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      fontSize: 13,
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Not signed in — show Sign in button
            <button
              onClick={signIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              {/* Google "G" logo */}
              <svg width="14" height="14" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Sign in
            </button>
          )}
        </div>

        {/* Tab bar */}
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

      {/* Album mode modal — shown on first visit to an album */}
      {pendingAlbumId !== null && (
        <AlbumModeModal
          album={ALL_ALBUMS.find(a => a.id === pendingAlbumId)}
          onChooseScore={handleChooseScore}
          onChooseManual={handleChooseManual}
          onBack={() => setPendingAlbumId(null)}
        />
      )}

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
              autoStartScore={autoStartScore}
              onAutoStartConsumed={() => setAutoStartScore(false)}
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
