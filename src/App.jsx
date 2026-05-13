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
import { useTermsAcceptance } from './hooks/useTermsAcceptance';
import Welcome from './components/Welcome';
import GoogleLoginPromo, { hasSeenGoogleLoginPromo } from './components/GoogleLoginPromo';
import SpotifyIntro, { hasSeenSpotifyIntro } from './components/SpotifyIntro';
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
import ProcessingBanner from './components/ProcessingBanner';
import ProfileView from './components/ProfileView';
import PrivacyPolicy from './components/PrivacyPolicy';
import Terms from './components/Terms';
import UpdatedTermsModal from './components/UpdatedTermsModal';
import FeedbackButton from './components/FeedbackButton';
import { ALL_ALBUMS } from './data/albums';

// Hand-rolled URL routing. The app is otherwise tab-driven, so adding
// react-router for a handful of extra routes would be overkill. If we
// add more deep-linkable screens later, swap this for a real router.
function getProfileUidFromPath() {
  const m = window.location.pathname.match(/^\/u\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// 'privacy' | 'terms' | null — checked at mount and on back/forward.
function getLegalPath() {
  const p = window.location.pathname;
  if (p === '/privacy' || p === '/privacy/') return 'privacy';
  if (p === '/terms' || p === '/terms/') return 'terms';
  return null;
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

const WELCOME_KEY = 'eras_welcome_seen';

export default function App() {
  // Public-profile route gate — checked once at mount and again on
  // back/forward navigation. Pre-empts the rest of the app and the beta gate
  // so a shared profile link is reachable without signing in.
  const [profileUid, setProfileUid] = useState(getProfileUidFromPath);
  const [legalPath, setLegalPath] = useState(getLegalPath);
  useEffect(() => {
    function onPop() {
      setProfileUid(getProfileUidFromPath());
      setLegalPath(getLegalPath());
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const [activeTab, setActiveTab] = useState('home');
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Auth
  const { user, authLoading, signIn, signOut } = useAuth();

  // ── Welcome tour state ───────────────────────────────────────────────────────
  const [welcomeSeen, setWelcomeSeen] = useState(() => localStorage.getItem(WELCOME_KEY) === '1');

  // ── Onboarding screen state (one-time per device) ───────────────────────────
  // Order: Welcome tour → GoogleLoginPromo (only if not signed in) → SpotifyIntro
  //        (only if signed in, since real album art needs Spotify connected).
  // Tracked via state so connecting/skipping advances to the next screen
  // without a full reload.
  const [googleLoginPromoSeen, setGoogleLoginPromoSeen] = useState(hasSeenGoogleLoginPromo);
  const [spotifyIntroSeen, setSpotifyIntroSeen] = useState(hasSeenSpotifyIntro);

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
    isUpgrading,
    customerPortalUrl,
    subscriptionStatus,
    subscriptionEndsAt,
    nextRenewalAt,
    subscriptionPlan,
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

  // Legal acceptance — fires UpdatedTermsModal when the signed-in user's
  // stored termsAcceptedVersion doesn't match the current LEGAL_VERSION.
  // Anonymous users are unaffected (no Firestore doc to compare against);
  // their acceptance is governed by ToS section 1 ("by using the App you
  // agree...") and recorded on their first sign-in via useUserStats.
  const { needsAcceptance, acceptTerms } = useTermsAcceptance(user);

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
  // True once the user-facing "🎉 You're Pro!" prompt should actually render
  // (i.e., the webhook has confirmed payment AND the user clicked Subscribe
  // in this session). Distinct from `pendingUpgradeIntent` below, which is
  // only the user's intent — not proof of payment.
  const [showConnectSpotifyPrompt, setShowConnectSpotifyPrompt] = useState(false);
  // Set true the moment the user clicks Subscribe; cleared when isPro flips
  // to true (success — fire the prompt) OR when isUpgrading lapses without
  // isPro becoming true (failsafe — user closed the LS overlay without
  // paying, never show the prompt). Plain in-memory state because LS keeps
  // the user on the same page; if the user refreshes mid-checkout we lose
  // the intent and the celebration prompt is skipped — they still get Pro
  // when the webhook lands, just without the auto-Connect-Spotify CTA.
  const [pendingUpgradeIntent, setPendingUpgradeIntent] = useState(false);

  // Wraps usePro's unlockPro. We mark "the user clicked Subscribe" here;
  // the celebration prompt itself only fires once isPro actually flips true
  // (driven by the webhook → Firestore → onSnapshot path). Suppressed
  // inside VibeCheckIntro by using the raw unlockPro there.
  function handleUnlockProGlobal(plan) {
    const ok = unlockPro(plan);
    if (ok && !spotify?.isConnected) {
      setPendingUpgradeIntent(true);
    }
    return ok;
  }

  // Fire the celebration prompt only when isPro transitions false→true
  // AND the user actually clicked Subscribe in this session (pending
  // intent). prevIsProRef stops this from re-firing when isPro is already
  // true at mount (returning Pro user signing back in).
  const prevIsProRef = useRef(isPro);
  useEffect(() => {
    const prev = prevIsProRef.current;
    prevIsProRef.current = isPro;
    if (!prev && isPro && pendingUpgradeIntent && !spotify?.isConnected) {
      setShowConnectSpotifyPrompt(true);
      setPendingUpgradeIntent(false);
    }
  }, [isPro, pendingUpgradeIntent, spotify?.isConnected]);

  // Clear pending intent if the upgrade attempt lapses (isUpgrading was
  // true, now it's false, and isPro never flipped) — i.e., the LS overlay
  // closed without payment, or the 90s failsafe expired. Without this,
  // a stale intent would silently fire on the next legitimate session
  // where isPro transitions true for any other reason.
  const prevIsUpgradingRef = useRef(isUpgrading);
  useEffect(() => {
    const prev = prevIsUpgradingRef.current;
    prevIsUpgradingRef.current = isUpgrading;
    if (prev && !isUpgrading && !isPro) {
      setPendingUpgradeIntent(false);
    }
  }, [isUpgrading, isPro]);

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

  // Legal pages take precedence over everything else — they must be
  // reachable from anywhere (sign-in screen, external links from Lemon
  // Squeezy / Google OAuth verification, etc.) without sitting through
  // the welcome tour or sign-in flow. Also reachable while the
  // UpdatedTermsModal is up (its links open in a new tab, but pasting
  // /privacy directly into the URL bar still works).
  if (legalPath === 'privacy') return <PrivacyPolicy />;
  if (legalPath === 'terms')   return <Terms />;

  // Public profile route takes precedence over the welcome tour — a shared
  // link should always render the profile screen for unauthenticated visitors.
  if (profileUid) {
    return <ProfileView uid={profileUid} />;
  }

  // Updated-terms gate — pre-empts the rest of the app for a signed-in
  // user whose stored acceptance version doesn't match LEGAL_VERSION.
  // Anonymous users skip this entirely (no Firestore doc → no mismatch).
  // The modal is shown AFTER the legal routes above so its inline links
  // to /privacy and /terms still work.
  if (needsAcceptance) {
    return <UpdatedTermsModal onAccept={acceptTerms} />;
  }

  // ── Welcome tour — shown once per device for new users ───────────────────────
  function dismissWelcome() {
    localStorage.setItem(WELCOME_KEY, '1');
    setWelcomeSeen(true);
  }
  function replayWelcome() {
    localStorage.removeItem(WELCOME_KEY);
    setWelcomeSeen(false);
  }

  if (!welcomeSeen) {
    return <Welcome onClose={dismissWelcome} spotifyAlbumArt={spotify.albumArt} />;
  }

  // ── Google login promo — shown once per device after the Welcome tour, only
  // when no account is connected yet. The user can either sign in (default
  // path) or tap "Not now" to keep going as anonymous. The promo's own
  // useEffect auto-skips when a user is already signed in (e.g. they signed
  // back in via the header avatar in a previous session). ────
  if (!googleLoginPromoSeen && !user) {
    return (
      <GoogleLoginPromo
        user={user}
        signIn={signIn}
        onContinue={() => setGoogleLoginPromoSeen(true)}
      />
    );
  }

  // ── Spotify intro — shown once per device after Google sign-in. Pitches
  // free album art across the app. Skip-able. We only render this when a
  // user is signed in because the real value (cross-device sync of the
  // Spotify-connected state) only kicks in with an account. ────────────────
  if (user && !spotifyIntroSeen) {
    return (
      <SpotifyIntro
        spotify={spotify}
        onContinue={() => setSpotifyIntroSeen(true)}
      />
    );
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

  // Plain-English label of where the user is right now — attached to any
  // feedback they submit so we know which screen the comment is about.
  const selectedAlbumName = selectedAlbumId
    ? ALL_ALBUMS.find(a => a.id === selectedAlbumId)?.name ?? selectedAlbumId
    : null;
  const currentScreen =
    pendingVibeCheckAlbumId !== null ? 'Vibe Check Intro' :
    pendingAlbumId         !== null ? 'Album mode picker' :
    activeTab === 'home'              ? 'Home' :
    activeTab === 'albums'            ? 'Albums grid' :
    activeTab === 'rate'              ? `Album: ${selectedAlbumName ?? 'unknown'}` :
    activeTab === 'brackets'          ? 'Brackets' :
    activeTab === 'rankings'          ? 'Rankings' :
    activeTab === 'settings'          ? 'Settings' :
    activeTab;

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
      {/* Pro upgrade in flight — banner stays up until the LS webhook lands
          and usePro flips isPro to true (clears isUpgrading), or the 90s
          failsafe expires. */}
      <ProcessingBanner visible={isUpgrading} />

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
            spotifyAlbumArt={spotify.albumArt}
          />
        )}

        {activeTab === 'albums' && (
          <AlbumGrid
            onSelectAlbum={handleSelectAlbum}
            selectedAlbumId={selectedAlbumId}
            getAlbumScore={getAlbumScore}
            getRatedCount={getRatedCount}
            activeCategories={activeCategories}
            albumArt={spotify.albumArt}
            albumSpotifyIds={spotify.albumSpotifyIds}
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
              spotify={spotify}
              isPro={isPro}
              spotifyAutoplay={settings.spotifyAutoplay}
              spotifyBridgeAutoplay={settings.spotifyBridgeAutoplay}
              spotifyAlbumArt={spotify.albumArt}
              spotifyAlbumIds={spotify.albumSpotifyIds}
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
            spotifyAlbumArt={spotify.albumArt}
            onSelectAlbum={handleSelectAlbum}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            updateSetting={updateSetting}
            spotify={spotify}
            isPro={isPro}
            unlockPro={handleUnlockProGlobal}
            customerPortalUrl={customerPortalUrl}
            subscriptionStatus={subscriptionStatus}
            subscriptionEndsAt={subscriptionEndsAt}
            nextRenewalAt={nextRenewalAt}
            subscriptionPlan={subscriptionPlan}
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

      {/* Floating "send feedback" button — visible across the main app for
          any signed-in user. Submissions land in Firestore `feedback`. */}
      <FeedbackButton user={user} screen={currentScreen} />
    </div>
  );
}
