import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ALL_ALBUMS, SONGS } from '../data/albums';
import { DEFAULT_CATEGORIES, EXTRA_CATEGORIES } from '../data/categories';
import CategoriesEditor from './CategoriesEditor';
import SpotifyBadge from './SpotifyBadge';

// Settings tab — app-wide display and behaviour preferences.
export default function Settings({
  settings, updateSetting, spotify, isPro, unlockPro,
  user, signIn, signOut,
  ratings, activeCategories, customCategories,
  enabledExtras, toggleExtra,
  addCustomCategory, removeCustomCategory, disabledCustoms, toggleCustom,
  disabledDefaults, toggleDefault, setCustomCategoryType,
  categoryWeights, setCategoryWeight, resetCategoryWeights,
  getCompositeScore, getAlbumScore,
  onShowWelcome,
}) {
  const [showProModal, setShowProModal] = useState(false);
  const [showCategoriesEditor, setShowCategoriesEditor] = useState(false);

  // Dev/test utility — wipes all bracket data so the flow can be replayed.
  async function handleClearBracketData() {
    const ok = window.confirm(
      'Clear all bracket data? This deletes your personal brackets, weekly votes, and daily matchup.'
    );
    if (!ok) return;

    ['eras_brackets', 'eras_weekly_bracket', 'eras_daily_bracket']
      .forEach(k => localStorage.removeItem(k));

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { brackets: [], weeklyBracket: null },
          { merge: true }
        );
      } catch (e) {
        console.error('Failed to clear cloud bracket data', e);
      }
    }

    location.reload();
  }

  function handleExportRatings() {
    const allCats = [
      ...DEFAULT_CATEGORIES,
      ...EXTRA_CATEGORIES,
      ...(customCategories || []),
    ];

    // Collect every category ID that appears in any rating
    const catIdSet = new Set();
    Object.values(ratings || {}).forEach(r => Object.keys(r).forEach(id => catIdSet.add(id)));
    const catIds = [...catIdSet];

    const catName = id => allCats.find(c => c.id === id)?.name ?? id;

    const rows = [['Album', 'Song', ...catIds.map(catName)]];

    for (const [key, songRatings] of Object.entries(ratings || {})) {
      const parts = key.split('_');
      // Key format: albumId_songIndex — albumId may contain underscores (none currently, but safe)
      const songIndex = Number(parts[parts.length - 1]);
      const albumId = parts.slice(0, -1).join('_');
      const album = ALL_ALBUMS.find(a => a.id === albumId);
      const songName = SONGS[albumId]?.[songIndex] ?? key;
      rows.push([
        album?.name ?? albumId,
        songName,
        ...catIds.map(id => songRatings[id] ?? ''),
      ]);
    }

    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eras-ranker-ratings.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleUnlockPro() {
    unlockPro();
    setShowProModal(false);
  }

  return (
    <div style={{ paddingTop: 20, paddingBottom: 40 }}>

      {/* ── Pro upgrade modal ── */}
      {showProModal && (
        <ProModal
          onUnlock={handleUnlockPro}
          onClose={() => setShowProModal(false)}
          user={user}
          signIn={signIn}
        />
      )}

      {/* ── Account section ── */}
      <SectionHeader>Account</SectionHeader>
      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
      }}>
        {user ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px',
              borderBottom: '0.5px solid #f3f4f6',
            }}>
              {/* Avatar */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '2px solid #a855f7',
                overflow: 'hidden',
                background: '#f3e8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName ?? 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#a855f7' }}>
                    {user.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                  {user.displayName ?? 'Google User'}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
            <div style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10, paddingTop: 4 }}>
                Your ratings and settings are backed up to the cloud and will sync across devices.
              </div>
              <button
                onClick={signOut}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 10,
                  border: '0.5px solid #e5e7eb',
                  background: '#ffffff',
                  fontSize: 13,
                  color: '#ef4444',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 14 }}>
              Sign in with Google to back up your ratings and sync across devices.
            </div>
            <button
              onClick={signIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: '#ffffff',
                fontSize: 14,
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      {/* Replay welcome tour — small text link below the Account card */}
      {onShowWelcome && (
        <button
          onClick={onShowWelcome}
          style={{
            background: 'none',
            border: 'none',
            color: '#a855f7',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '2px 4px',
            marginBottom: 28,
            display: 'inline-block',
          }}
        >
          Show welcome tour again
        </button>
      )}

      {/* ── Display section ── */}
      <SectionHeader>Display</SectionHeader>

      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 28,
      }}>
        <SettingRow
          label="Category breakdown"
          description="Show score bars under each song in the album view."
          value={settings.showCategoryBars}
          onChange={v => updateSetting('showCategoryBars', v)}
        />
        <div style={{ height: '0.5px', background: '#f3f4f6', margin: '0 16px' }} />
        <SettingRow
          label="Confirm before exiting QuickScore"
          description="Ask for confirmation before closing the rating screen mid-session."
          value={settings.confirmQuickScoreExit ?? true}
          onChange={v => updateSetting('confirmQuickScoreExit', v)}
        />
      </div>

      {/* ── Spotify section ── */}
      <SectionHeader>Spotify</SectionHeader>

      {!isPro ? (
        /* Not Pro — show the feature, but clicking Connect opens the upgrade modal */
        <div style={{
          background: '#ffffff',
          border: '0.5px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderBottom: '0.5px solid #f3f4f6',
          }}>
            <SpotifyBadge variant="green" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                  Hear it, then rate it
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#a855f7',
                  background: '#f3e8ff',
                  padding: '2px 7px',
                  borderRadius: 99,
                  letterSpacing: '0.05em',
                }}>
                  PRO
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                Play each song on Spotify while you rate it
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 16px' }}>
            <button
              onClick={() => setShowProModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                border: 'none',
                background: '#1DB954',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <SpotifyBadge variant="white" />
              Connect Spotify
            </button>
          </div>
        </div>
      ) : (
        /* Pro — show connect / connected UI */
        <div style={{
          background: '#ffffff',
          border: '0.5px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {spotify?.isConnected ? (
            <>
              {/* Connected state */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderBottom: '0.5px solid #f3f4f6',
              }}>
                <SpotifyBadge variant="green" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                    Spotify connected
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {spotify.playerReady ? 'Player ready' : 'Player loading…'}
                  </div>
                </div>
                <button
                  onClick={spotify.disconnect}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '0.5px solid #e5e7eb',
                    background: '#ffffff',
                    fontSize: 12,
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              </div>

              {/* Autoplay toggle */}
              <SettingRow
                label="Autoplay songs"
                description="Start playing each song automatically when it appears in the rating screen."
                value={settings.spotifyAutoplay}
                onChange={v => updateSetting('spotifyAutoplay', v)}
              />
              <div style={{ height: '0.5px', background: '#f3f4f6', margin: '0 16px' }} />
              <SettingRow
                label="Auto-play bridge"
                description="Seek to the bridge automatically when the Bridge category appears."
                value={settings.spotifyBridgeAutoplay ?? false}
                onChange={v => updateSetting('spotifyBridgeAutoplay', v)}
              />
              <div style={{ height: '0.5px', background: '#f3f4f6', margin: '0 16px' }} />
              {/* Volume slider */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Volume</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>In-app Spotify playback volume</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#a855f7', minWidth: 36, textAlign: 'right' }}>
                    {Math.round((settings.spotifyVolume ?? 0.8) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.spotifyVolume ?? 0.8}
                  onChange={e => {
                    const v = Number(e.target.value);
                    updateSetting('spotifyVolume', v);
                    spotify?.setVolume(v);
                  }}
                  style={{ width: '100%', accentColor: '#1DB954', cursor: 'pointer' }}
                />
              </div>

            </>
          ) : (
            /* Pro but not yet connected */
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <SpotifyBadge variant="green" />
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                  Connect Spotify
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 14 }}>
                Link your Spotify Premium account to hear each song play automatically
                while you rate it.
              </div>

              {spotify?.error && (
                <div style={{
                  fontSize: 12,
                  color: '#dc2626',
                  background: '#fef2f2',
                  border: '0.5px solid #fecaca',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 12,
                }}>
                  {spotify.error}
                </div>
              )}

              <button
                onClick={spotify?.connect}
                disabled={spotify?.isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: spotify?.isLoading ? '#d1d5db' : '#1DB954',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: spotify?.isLoading ? 'default' : 'pointer',
                }}
              >
                <SpotifyBadge variant="white" />
                {spotify?.isLoading ? 'Connecting…' : 'Connect Spotify'}
              </button>

              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
                Requires Spotify Premium · Your Eras Ranker login stays separate
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Spotify Premium note ── */}
      <div style={{
        marginTop: 10,
        padding: '10px 14px',
        fontSize: 11,
        color: '#6b7280',
        lineHeight: 1.5,
      }}>
        Spotify Premium lets you play any track, podcast episode or audiobook, ad-free and with better audio quality.{' '}
        <a
          href="https://spotify.com/premium"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1DB954', textDecoration: 'none', fontWeight: 500 }}
        >
          Go to spotify.com/premium
        </a>{' '}
        to try it for free.
      </div>

      {/* ── Rating Categories section ── */}
      <SectionHeader>Rating Categories</SectionHeader>
      <button
        onClick={() => setShowCategoriesEditor(true)}
        style={{
          width: '100%',
          background: '#ffffff',
          border: '0.5px solid #e5e7eb',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 28,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 2 }}>
            Edit categories &amp; weights
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
            {activeCategories.length} active · turn defaults on/off, tune weights, see how your top songs and albums shift.
          </div>
        </div>
        <span style={{ fontSize: 18, color: '#a855f7', flexShrink: 0 }}>→</span>
      </button>

      {showCategoriesEditor && (
        <CategoriesEditor
          onClose={() => setShowCategoriesEditor(false)}
          isPro={isPro}
          unlockPro={unlockPro}
          enabledExtras={enabledExtras}
          toggleExtra={toggleExtra}
          customCategories={customCategories}
          addCustomCategory={addCustomCategory}
          removeCustomCategory={removeCustomCategory}
          disabledCustoms={disabledCustoms}
          toggleCustom={toggleCustom}
          disabledDefaults={disabledDefaults}
          toggleDefault={toggleDefault}
          setCustomCategoryType={setCustomCategoryType}
          activeCategories={activeCategories}
          categoryWeights={categoryWeights}
          setCategoryWeight={setCategoryWeight}
          resetCategoryWeights={resetCategoryWeights}
          getCompositeScore={getCompositeScore}
          getAlbumScore={getAlbumScore}
          user={user}
          signIn={signIn}
        />
      )}

      {/* ── Data section ── */}
      <SectionHeader>Data</SectionHeader>
      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 28,
      }}>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 2 }}>
            Export ratings
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>
            Download all your ratings as a spreadsheet (.csv) — one row per song, one column per category.
          </div>
          <button
            onClick={handleExportRatings}
            disabled={!ratings || Object.keys(ratings).length === 0}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: '0.5px solid #e5e7eb',
              background: ratings && Object.keys(ratings).length > 0 ? '#ffffff' : '#f9fafb',
              fontSize: 13,
              fontWeight: 500,
              color: ratings && Object.keys(ratings).length > 0 ? '#111827' : '#9ca3af',
              cursor: ratings && Object.keys(ratings).length > 0 ? 'pointer' : 'default',
            }}
          >
            Download CSV
          </button>
        </div>
        <div style={{ borderTop: '0.5px solid #e5e7eb', padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 2 }}>
            Clear bracket data
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>
            Wipes personal brackets, weekly votes, and the daily matchup so you can replay the flow. Your ratings are not touched.
          </div>
          <button
            onClick={handleClearBracketData}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: '0.5px solid #fecaca',
              background: '#ffffff',
              fontSize: 13,
              fontWeight: 500,
              color: '#dc2626',
              cursor: 'pointer',
            }}
          >
            Clear bracket data
          </button>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div style={{
        marginTop: 32,
        padding: '12px 14px',
        background: '#f9fafb',
        border: '0.5px solid #e5e7eb',
        borderRadius: 10,
        fontSize: 11,
        color: '#9ca3af',
        lineHeight: 1.5,
        textAlign: 'center',
      }}>
        This app is a fan-made project and is not affiliated with, endorsed by,
        or connected to Taylor Swift or TAS Rights Management, LLC.
      </div>

    </div>
  );
}

// ── Pro upgrade modal ─────────────────────────────────────────────────────────
// Two-step modal:
//   step 'features' → feature list + "Unlock Pro" button
//   step 'signin'   → "Sign in required" panel, shown after the user taps
//                     Unlock Pro without being signed in (lets them make the
//                     decision first, then explains the login requirement)
function ProModal({ onUnlock, onClose, user, signIn }) {
  const [step, setStep] = useState('features');
  const features = [
    { kind: 'spotify', label: 'Connect Spotify',     desc: 'Hear each song play while you rate it' },
    { kind: 'emoji',   icon: '📊', label: '8 extra categories', desc: 'Hook, Vocals, Cry Factor, and more' },
    { kind: 'emoji',   icon: '✏️', label: 'Custom categories',  desc: 'Add your own scoring dimensions' },
  ];

  function handleUnlock() {
    if (!user) {
      setStep('signin');
      return;
    }
    onUnlock();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
      }}
    >
      {/* Card — stop clicks from bubbling through */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '28px 24px',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        }}
      >
        {step === 'features' ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>⭐</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                Unlock Pro
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
              One-time unlock. No subscription, no recurring charges.
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {features.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: f.kind === 'spotify' ? '#ffffff' : '#f3e8ff',
                    border: f.kind === 'spotify' ? '0.5px solid #e5e7eb' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}>
                    {f.kind === 'spotify'
                      ? <SpotifyBadge variant="green" size={26} />
                      : f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Unlock — always tappable. If not signed in, transitions to the
                sign-in step instead of immediately calling onUnlock. */}
            <button
              onClick={handleUnlock}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
                marginBottom: 12,
              }}
            >
              Unlock Pro
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                border: '0.5px solid #e5e7eb',
                background: '#ffffff',
                color: '#6b7280',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
          </>
        ) : (
          <SignInRequiredStep
            onBack={() => setStep('features')}
            signIn={signIn}
          />
        )}
      </div>
    </div>
  );
}

// Step 2 of the Pro modal — shown after the user taps "Unlock Pro" without
// being signed in. Explains that sign-in is needed first (so the purchase
// follows them to every device) and offers a Google sign-in button.
// Reused by other Pro upgrade surfaces (PaywallCard, VibeCheckIntro).
export function SignInRequiredStep({ onBack, signIn }) {
  return (
    <>
      {/* Back arrow */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          padding: 0,
          color: '#6b7280',
          fontSize: 13,
          cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        ← Back
      </button>

      {/* Lock icon */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: '#f3e8ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        fontSize: 28,
      }}>
        🔐
      </div>

      <div style={{
        fontSize: 19,
        fontWeight: 700,
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
      }}>
        Sign in to continue
      </div>

      <div style={{
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 1.6,
        marginBottom: 24,
      }}>
        Pro is tied to your Google account so it follows you to every device —
        no risk of losing it if you change browsers or clear your cache.
      </div>

      <button
        onClick={signIn}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          width: '100%',
          padding: '13px',
          borderRadius: 12,
          border: '1px solid #d1d5db',
          background: '#ffffff',
          color: '#111827',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 10,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        Sign in with Google
      </button>
    </>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#6b7280',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function SettingRow({ label, description, value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          background: value ? '#a855f7' : '#d1d5db',
          position: 'relative',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 3,
          left: value ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  );
}

