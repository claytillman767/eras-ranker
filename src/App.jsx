import { useState, useRef, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useRatings } from './hooks/useRatings';
import { usePro } from './hooks/usePro';
import { useManualOrder } from './hooks/useManualOrder';
import { useAlbumModes } from './hooks/useAlbumModes';
import { useSettings } from './hooks/useSettings';
import { useSpotify } from './hooks/useSpotify';
import { useUserStats } from './hooks/useUserStats';
import { useProfile } from './hooks/useProfile';
import BetaGate from './components/BetaGate';
import Welcome from './components/Welcome';
import VibeCheckIntro, { hasSeenVibeCheckIntro } from './components/VibeCheckIntro';
import Home from './components/Home';
import AlbumGrid from './components/AlbumGrid';
import AlbumModeModal from './components/AlbumModeModal';
import SongList from './components/SongList';
import Rankings from './components/Rankings';
import Categories from './components/Categories';
import Settings from './components/Settings';
import Brackets from './components/brackets/Brackets';
import ConnectSpotifyPrompt from './components/ConnectSpotifyPrompt';
import ProfileView from './components/ProfileView';
import { ALL_ALBUMS } from './data/albums';

// Hand-rolled URL routing for the public-profile feature. The app is
// otherwise tab-driven, so adding react-router for one extra route would
// be overkill. If we add more deep-linkable screens later, swap this for
// a real router.
function getProfileUidFromPath() {
  const m = window.location.pathname.match(/^\/u\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Brackets feature is hidden from the published app until phase 2 of launch.
// Flip to `true` to re-enable the Brackets tab — all underlying code (the tab
// render, the Brackets components, the useBrackets hook) is intact.
const BRACKETS_ENABLED = false;

// Tab definitions — Categories lives inside Settings
const TABS = [
  { id: 'home',     label: 'Home' },
  { id: 'albums',   label: 'Albums' },
  ...(BRACKETS_ENABLED ? [{ id: 'brackets', label: 'Brackets' }] : []),
  { id: 'rankings', label: 'Rankings' },
  { id: 'settings', label: 'Settings' },
];

const BETA_KEY = 'eras_beta_unlocked';
const WELCOME_KEY = 'eras_welcome_seen';

export default function App() {
  // Public-profile route gate — checked once at mount and again on
  // back/forward navigation. Pre-empts the rest of the app and the beta gate
  // so a shared profile link is reachable without signing in.
  const [profileUid, setProfileUid] = useState(getProfileUidFromPath);
  useEffect(() => {
    function onPop() { setProfileUid(getProfileUidFromPath()); }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const [activeTab, setActiveTab] = useState('home');
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Auth
  const { user, authLoading, signIn, signOut } = useAuth();

  // ── Beta gate state ──────────────────────────────────────────────────────────
  const [betaUnlocked, setBetaUnlocked] = useState(() => localStorage.getItem(BETA_KEY) === 'true');
  const [betaRejected, setBetaRejected] = useState(false);

  // ── Welcome tour state ───────────────────────────────────────────────────────
  const [welcomeSeen, setWelcomeSeen] = useState(() => localStorage.getItem(WELCOME_KEY) === '1');

  // ── Data hooks — ALL hooks must be declared before any conditional return ────
  const {
    ratings,
    lastRatedKey,
    streak,
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
    disabledCustoms,
    toggleCustom,
    disabledDefaults,
    toggleDefault,
    setCustomCategoryType,
    categoryWeights,
    setCategoryWeight,
    resetCategoryWeights,
    getActiveCategories,
  } = usePro(user);

  const activeCategories = getActiveCategories();

  const { getManualOrder, moveUp, moveDown, reorder, setOrder } = useManualOrder(user);
  const { getAlbumMode, setAlbumMode } = useAlbumModes(user);
  const { settings, updateSetting } = useSettings(user);
  const spotify = useSpotify(user);

  // Public profile (anyone-with-link sharing). Mirrors album rankings to
  // a separate Firestore doc when the user has it turned on.
  const profile = useProfile(user, getAlbumScore, activeCategories);

  // Per-user analytics: lastActiveAt, sessionCount, totalRatings, albumsCompleted, signup origin
  useUserStats(user, ratings);

  // Sync stored volume to the Spotify player whenever it becomes ready
  useEffect(() => {
    if (spotify.playerReady) {
      spotify.setVolume(settings.spotifyVolume ?? 0.8);
    }
  }, [spotify.playerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const [pendingAlbumId, setPendingAlbumId] = useState(null);
  const [autoStartScore, setAutoStartScore] = useState(false);
  const [autoStartSongIndex, setAutoStartSongIndex] = useState(null);
  // Holds the album the user just chose Vibe Check for, while the
  // Spotify intro screen is showing (first-time only).
  const [pendingVibeCheckAlbumId, setPendingVibeCheckAlbumId] = useState(null);
  // Set true right after a successful Pro upgrade so we can auto-prompt
  // the user to connect Spotify (instead of forcing the three-tap detour
  // through Settings → Spotify → Connect).
  const [showConnectSpotifyPrompt, setShowConnectSpotifyPrompt] = useState(false);

  // Wraps usePro's unlockPro so any successful upgrade triggers the
  // Connect Spotify prompt — unless the user already has Spotify connected,
  // in which case the prompt would be redundant. Suppressed inside
  // VibeCheckIntro by using the raw unlockPro there (its own UI adapts).
  function handleUnlockProGlobal(plan) {
    const ok = unlockPro(plan);
    if (ok && !spotify?.isConnected) {
      setShowConnectSpotifyPrompt(true);
    }
    return ok;
  }

  function handleConnectSpotifyFromPrompt() {
    setShowConnectSpotifyPrompt(false);
    spotify?.connect?.(); // redirects to Spotify OAuth
  }

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

  // When a Google sign-in completes, check the allowlist and unlock the gate.
  // If rejected, leave the user signed in so BetaGate can show the launch
  // waitlist screen (which needs their email). The waitlist screen signs them
  // out itself once they decide.
  useEffect(() => {
    if (betaUnlocked || authLoading || !user || betaRejected) return;
    const allowedRaw = import.meta.env.VITE_BETA_EMAILS ?? '';
    const allowed = allowedRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    // Empty list = allow any signed-in Google account
    if (allowed.length === 0 || allowed.includes(user.email?.toLowerCase())) {
      localStorage.setItem(BETA_KEY, 'true');
      setBetaUnlocked(true);
      setBetaRejected(false);
    } else {
      setBetaRejected(true);
    }
  }, [user, authLoading, betaUnlocked, betaRejected]);

  // ── Gate check — safe to early-return now that all hooks are declared above ──
  function handleBetaPassword() {
    localStorage.setItem(BETA_KEY, 'true');
    setBetaUnlocked(true);
  }

  function handleRejectedSignOut() {
    setBetaRejected(false);
    signOut();
  }

  // Public profile route takes precedence over both the beta gate and the
  // welcome tour — a shared link should always render the profile screen
  // for unauthenticated visitors.
  if (profileUid) {
    return <ProfileView uid={profileUid} />;
  }

  if (!betaUnlocked) {
    return (
      <BetaGate
        onSignIn={signIn}
        onPassword={handleBetaPassword}
        loading={authLoading || (!!user && !betaRejected)}
        rejected={betaRejected}
        rejectedUser={betaRejected ? user : null}
        onRejectedSignOut={handleRejectedSignOut}
      />
    );
  }

  // ── Welcome tour — shown once per device after the beta gate is passed ──────
  function dismissWelcome() {
    localStorage.setItem(WELCOME_KEY, '1');
    setWelcomeSeen(true);
  }
  function replayWelcome() {
    localStorage.removeItem(WELCOME_KEY);
    setWelcomeSeen(false);
  }

  if (!welcomeSeen) {
    return <Welcome onClose={dismissWelcome} />;
  }
  // ────────────────────────────────────────────────────────────────────────────

  function handleSelectAlbum(albumId) {
    const mode = getAlbumMode(albumId);
    if (mode === null) {
      setPendingAlbumId(albumId);
    } else {
      setSelectedAlbumId(albumId);
      setActiveTab('rate');
    }
  }

  function handleChooseScore() {
    const albumId = pendingAlbumId;
    setPendingAlbumId(null); // close the AlbumModeModal either way

    // First Vibe Check ever? Show the Spotify intro before launching QuickScore.
    // Skipped for users who are already enjoying it (Pro + Spotify connected).
    const alreadyBenefits = isPro && spotify?.isConnected;
    if (!hasSeenVibeCheckIntro() && !alreadyBenefits) {
      setPendingVibeCheckAlbumId(albumId);
      return;
    }

    launchVibeCheck(albumId);
  }

  // Common launch path used by both the normal flow and after the Spotify
  // intro is dismissed. Records the album mode and opens QuickScore.
  function launchVibeCheck(albumId) {
    if (!albumId) return;
    setAlbumMode(albumId, 'score');
    setSelectedAlbumId(albumId);
    setAutoStartScore(true);
    setAutoStartSongIndex(null);
    setActiveTab('rate');
  }

  function handleVibeCheckIntroContinue() {
    const albumId = pendingVibeCheckAlbumId;
    setPendingVibeCheckAlbumId(null);
    launchVibeCheck(albumId);
  }

  function handleChooseManual() {
    setAlbumMode(pendingAlbumId, 'manual');
    setSelectedAlbumId(pendingAlbumId);
    setAutoStartScore(false);
    setAutoStartSongIndex(null);
    setPendingAlbumId(null);
    setActiveTab('rate');
  }

  function handleContinueRating(albumId, songIndex) {
    const mode = getAlbumMode(albumId);
    if (mode === null) {
      setPendingAlbumId(albumId);
    } else {
      setSelectedAlbumId(albumId);
      setAutoStartScore(true);
      setAutoStartSongIndex(songIndex);
      setActiveTab('rate');
    }
  }

  function handleBack() {
    setActiveTab('albums');
  }

  const userInitial = user?.displayName?.charAt(0)?.toUpperCase() ?? '?';
  const userFirstName = user?.displayName?.split(' ')[0] ?? 'there';

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
      {/* ── App header + tab bar ── */}
      <div style={{
        padding: '14px 16px 0',
        borderBottom: '0.5px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        background: '#ffffff',
        zIndex: 10,
      }}>
        {/* Title row with auth button on the right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#111827' }}>
            The Eras Ranker
          </div>

          {authLoading ? (
            <div style={{ width: 32, height: 32 }} />
          ) : user ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                title={user.displayName ?? 'Account'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '5px 10px 5px 5px',
                  borderRadius: 20,
                  border: '1.5px solid #a855f7',
                  background: '#f3e8ff',
                  cursor: 'pointer',
                }}
              >
                {/* Avatar circle */}
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#e9d5ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName ?? 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>{userInitial}</span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#7c3aed', whiteSpace: 'nowrap' }}>
                  Hello, {userFirstName}
                </span>
              </button>

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
          isPro={isPro}
          spotify={spotify}
        />
      )}

      {/* Spotify intro — shown ONCE on the user's first Vibe Check */}
      {pendingVibeCheckAlbumId !== null && (
        <VibeCheckIntro
          user={user}
          isPro={isPro}
          spotify={spotify}
          unlockPro={unlockPro}
          signIn={signIn}
          onContinue={handleVibeCheckIntroContinue}
        />
      )}

      {/* Auto-prompt to connect Spotify right after a successful Pro upgrade.
          Removes the three-tap detour through Settings → Spotify → Connect. */}
      {showConnectSpotifyPrompt && !spotify?.isConnected && (
        <ConnectSpotifyPrompt
          isLoading={spotify?.isLoading}
          onConnect={handleConnectSpotifyFromPrompt}
          onDismiss={() => setShowConnectSpotifyPrompt(false)}
        />
      )}

      {/* ── Tab content ── */}
      <div style={{ flex: 1, padding: '0 16px 80px' }}>

        {activeTab === 'home' && (
          <Home
            user={user}
            signIn={signIn}
            ratings={ratings}
            getCompositeScore={getCompositeScore}
            getAlbumScore={getAlbumScore}
            getRatedCount={getRatedCount}
            activeCategories={activeCategories}
            lastRatedKey={lastRatedKey}
            streak={streak}
            onContinueRating={handleContinueRating}
            onSelectAlbum={handleSelectAlbum}
            onGoToAlbums={() => setActiveTab('albums')}
            spotifyAlbumArt={isPro ? spotify.albumArt : null}
          />
        )}

        {activeTab === 'albums' && (
          <AlbumGrid
            onSelectAlbum={handleSelectAlbum}
            selectedAlbumId={selectedAlbumId}
            getAlbumScore={getAlbumScore}
            getRatedCount={getRatedCount}
            activeCategories={activeCategories}
            albumArt={isPro ? spotify.albumArt : null}
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
              getAlbumScore={getAlbumScore}
              getRatedCount={getRatedCount}
              setStarRating={setStarRating}
              manualOrder={getManualOrder(selectedAlbumId)}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onReorder={reorder}
              onSetOrder={setOrder}
              autoStartScore={autoStartScore}
              autoStartSongIndex={autoStartSongIndex}
              onAutoStartConsumed={() => { setAutoStartScore(false); setAutoStartSongIndex(null); }}
              showCategoryBars={settings.showCategoryBars}
              albumMode={getAlbumMode(selectedAlbumId)}
              spotify={isPro ? spotify : null}
              spotifyAutoplay={settings.spotifyAutoplay}
              spotifyBridgeAutoplay={settings.spotifyBridgeAutoplay}
              spotifyAlbumArt={isPro ? spotify.albumArt : null}
              onGoToSpotifySettings={() => setActiveTab('settings')}
              confirmExit={settings.confirmQuickScoreExit}
              updateSetting={updateSetting}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '60px 0' }}>
              Go to Albums and tap one to start rating.
            </div>
          )
        )}

        {activeTab === 'brackets' && (
          <Brackets user={user} spotify={isPro ? spotify : null} isPro={isPro} />
        )}

        {activeTab === 'rankings' && (
          <Rankings
            getCompositeScore={getCompositeScore}
            getAlbumScore={getAlbumScore}
            activeCategories={activeCategories}
            ratings={ratings}
            spotifyAlbumArt={isPro ? spotify.albumArt : null}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            updateSetting={updateSetting}
            spotify={isPro ? spotify : null}
            isPro={isPro}
            unlockPro={handleUnlockProGlobal}
            user={user}
            signIn={signIn}
            signOut={signOut}
            ratings={ratings}
            activeCategories={activeCategories}
            customCategories={customCategories}
            enabledExtras={enabledExtras}
            toggleExtra={toggleExtra}
            addCustomCategory={addCustomCategory}
            removeCustomCategory={removeCustomCategory}
            disabledCustoms={disabledCustoms}
            toggleCustom={toggleCustom}
            disabledDefaults={disabledDefaults}
            toggleDefault={toggleDefault}
            setCustomCategoryType={setCustomCategoryType}
            categoryWeights={categoryWeights}
            setCategoryWeight={setCategoryWeight}
            resetCategoryWeights={resetCategoryWeights}
            getCompositeScore={getCompositeScore}
            getAlbumScore={getAlbumScore}
            onShowWelcome={replayWelcome}
            profile={profile}
          />
        )}
      </div>
    </div>
  );
}
