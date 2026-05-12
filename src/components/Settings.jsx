import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ALL_ALBUMS, SONGS } from '../data/albums';
import { DEFAULT_CATEGORIES, EXTRA_CATEGORIES } from '../data/categories';
import { BIO_MAX_LENGTH } from '../utils/profanity';
import CategoriesEditor from './CategoriesEditor';
import SpotifyBadge from './SpotifyBadge';
import Spinner from './Spinner';
import ConfirmModal from './ConfirmModal';
import DeleteAccountModal from './DeleteAccountModal';
import { PlanPicker } from './PaywallCard';
import { isDevEmail, isUatMode, setUatMode, clearOnboardingFlags } from '../uat';

// Settings tab — app-wide display and behaviour preferences.
export default function Settings({
  settings, updateSetting, spotify, isPro, unlockPro,
  customerPortalUrl, subscriptionStatus, subscriptionEndsAt, nextRenewalAt, subscriptionPlan,
  user, signIn, signOut,
  ratings, activeCategories, customCategories,
  enabledExtras, toggleExtra,
  addCustomCategory, removeCustomCategory, disabledCustoms, toggleCustom,
  disabledDefaults, toggleDefault, setCustomCategoryType,
  categoryWeights, setCategoryWeight, resetCategoryWeights,
  getCompositeScore, getAlbumScore,
  onShowWelcome,
  profile,
}) {
  const [showProModal, setShowProModal] = useState(false);
  const [showCategoriesEditor, setShowCategoriesEditor] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // "Forget me on this device" — clears local data only. Cloud data is untouched
  // (Firestore record stays intact). The user can sign in again on any device to
  // restore everything. Distinct from "Sign out" which leaves local data alone.
  function handleForgetMe() {
    setConfirmState({
      title: 'Forget you on this device?',
      body: 'This clears your saved ratings, brackets, and settings from this browser. Your cloud data stays safe — sign in again on any device to bring it back.',
      confirmLabel: 'Forget me here',
      destructive: true,
      onConfirm: doForgetMe,
    });
  }

  async function doForgetMe() {
    // Wipe all app-owned localStorage keys, but keep beta-gate unlock so the
    // user doesn't have to re-enter the password on the next session.
    Object.keys(localStorage)
      .filter(k => k.startsWith('eras_') && k !== 'eras_beta_unlocked')
      .forEach(k => localStorage.removeItem(k));

    try {
      if (signOut) await signOut();
    } finally {
      location.reload();
    }
  }

  // Dev/test utility — wipes all bracket data so the flow can be replayed.
  function handleClearBracketData() {
    setConfirmState({
      title: 'Clear all bracket data?',
      body: 'This deletes your personal brackets, weekly votes, and daily matchup.',
      confirmLabel: 'Clear data',
      destructive: true,
      onConfirm: doClearBracketData,
    });
  }

  async function doClearBracketData() {
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

  function handleUnlockPro(plan) {
    unlockPro(plan);
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
          spotify={spotify}
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
            <div style={{ padding: '12px' }}>
              <div style={{
                fontSize: 12,
                color: '#16a34a',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                lineHeight: 1.4,
              }}>
                <span aria-hidden="true">✓</span>
                <span>
                  Your ratings and settings are backed up. They'll sync across devices when you sign in.
                </span>
              </div>

              {/* Pro subscription details moved into the dedicated Membership
                  section below. Account stays single-purpose: identity +
                  sign-out / forget / delete. */}

              {/* Sign out — non-destructive: cloud data is preserved */}
              <button
                onClick={signOut}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '0.5px solid #e5e7eb',
                  background: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                    Sign out
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
                    Your data stays in the cloud. Sign back in any time to restore it.
                  </div>
                </div>
                <span style={{ fontSize: 14, color: '#9ca3af', flexShrink: 0 }}>→</span>
              </button>

              {/* Forget me on this device — destructive: wipes local data */}
              <button
                onClick={handleForgetMe}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '0.5px solid #fecaca',
                  background: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 2 }}>
                    Forget me on this device
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
                    Wipes the local copy on this browser. Your cloud data is untouched.
                  </div>
                </div>
                <span style={{ fontSize: 14, color: '#dc2626', flexShrink: 0 }}>→</span>
              </button>

              {/* Delete account — fully destructive: wipes cloud + auth + local */}
              <button
                onClick={() => setShowDeleteAccount(true)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '0.5px solid #fecaca',
                  background: '#fef2f2',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#b91c1c', marginBottom: 2 }}>
                    Delete my account
                  </div>
                  <div style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.4 }}>
                    Permanently removes your ratings, profile, and account from every device.
                  </div>
                </div>
                <span style={{ fontSize: 14, color: '#b91c1c', flexShrink: 0 }}>→</span>
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

      {/* Dev-only UAT panel — only the developer email sees this row */}
      {isDevEmail(user?.email) && <UatToggle user={user} isPro={isPro} />}

      {/* ── Membership section ── */}
      <SectionHeader>Membership</SectionHeader>
      <MembershipSection
        user={user}
        isPro={isPro}
        unlockPro={unlockPro}
        signIn={signIn}
        spotify={spotify}
        customerPortalUrl={customerPortalUrl}
        subscriptionStatus={subscriptionStatus}
        subscriptionEndsAt={subscriptionEndsAt}
        nextRenewalAt={nextRenewalAt}
        subscriptionPlan={subscriptionPlan}
      />

      {/* ── Public profile section ── */}
      {user && profile && (
        <>
          <SectionHeader>Public profile</SectionHeader>
          <PublicProfileSection profile={profile} />
        </>
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
          label="Confirm before exiting QuickScore"
          description="Ask for confirmation before closing the rating screen mid-session."
          value={settings.confirmQuickScoreExit ?? true}
          onChange={v => updateSetting('confirmQuickScoreExit', v)}
        />
      </div>

      {/* ── Spotify section ── */}
      {/* Connection itself is FREE for everyone (gives real album art across
          the app). Playback features (autoplay, bridge autoplay, volume) stay
          gated behind Pro — the toggles still render so users can see what
          they're missing, but they're disabled and tagged with a PRO badge. */}
      <SectionHeader>Spotify</SectionHeader>

      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {spotify?.isConnected ? (
          <>
            {/* Connected state — status text adapts to whether the connected
                Spotify account is Premium (playback works) or free (album art
                only). */}
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
                  {!spotify.isPremium
                    ? 'Album art only — Spotify Premium is needed for in-app playback.'
                    : (isPro
                      ? (spotify.playerReady ? 'Player ready' : 'Player loading…')
                      : 'Real album art is showing across the app.')}
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

            {/* Playback controls — only shown when the connected Spotify is
                Premium (otherwise the toggles do nothing because Premium is
                required for the Web Playback SDK). For non-Premium accounts
                we surface a short note instead so the user knows why the
                rows are gone. */}
            {!spotify.isPremium ? (
              <div style={{ padding: '14px 16px', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                Autoplay, bridge autoplay, and volume controls require a Spotify Premium account.{' '}
                <a
                  href="https://spotify.com/premium"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#374151', textDecoration: 'underline', fontWeight: 500 }}
                >
                  Try Spotify Premium →
                </a>
              </div>
            ) : (
              <>
            <ProGatedRow
              isPro={isPro}
              onUpsell={() => setShowProModal(true)}
              label="Autoplay songs"
              description="Start playing each song automatically when it appears in the rating screen."
              value={settings.spotifyAutoplay}
              onChange={v => updateSetting('spotifyAutoplay', v)}
            />
            <div style={{ height: '0.5px', background: '#f3f4f6', margin: '0 16px' }} />
            <ProGatedRow
              isPro={isPro}
              onUpsell={() => setShowProModal(true)}
              label="Auto-play bridge"
              description="Seek to the bridge automatically when the Bridge category appears."
              value={settings.spotifyBridgeAutoplay ?? false}
              onChange={v => updateSetting('spotifyBridgeAutoplay', v)}
            />
            <div style={{ height: '0.5px', background: '#f3f4f6', margin: '0 16px' }} />
            {/* Volume slider — Pro only */}
            <div style={{ padding: '14px 16px', opacity: isPro ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Volume</div>
                    {!isPro && <ProBadge />}
                  </div>
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
                disabled={!isPro}
                onChange={e => {
                  const v = Number(e.target.value);
                  updateSetting('spotifyVolume', v);
                  spotify?.setVolume(v);
                }}
                style={{ width: '100%', accentColor: '#a855f7', cursor: isPro ? 'pointer' : 'not-allowed' }}
              />
            </div>
              </>
            )}
          </>
        ) : (
          /* Not connected — anyone can connect */
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <SpotifyBadge variant="green" />
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                Connect Spotify
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 14 }}>
              Connect to see real album art everywhere in the app.
              {!isPro && ' Pro unlocks autoplay so each song plays while you rate.'}
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
                background: spotify?.isLoading ? '#1aa84a' : '#1DB954',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: spotify?.isLoading ? 'default' : 'pointer',
              }}
            >
              {spotify?.isLoading ? (
                <Spinner size={18} />
              ) : (
                <SpotifyBadge variant="white" />
              )}
              {spotify?.isLoading ? 'Connecting to Spotify…' : 'Connect Spotify'}
            </button>

            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
              Free to connect · Spotify Premium required for in-app playback
            </div>
          </div>
        )}
      </div>

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
          style={{ color: '#374151', textDecoration: 'underline', fontWeight: 500 }}
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
          spotify={spotify}
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

      {/* ── About / version ── */}
      <div style={{
        marginTop: 32,
        textAlign: 'center',
        fontSize: 11,
        color: '#9ca3af',
        letterSpacing: '0.04em',
      }}>
        The Eras Ranker · v{__APP_VERSION__}
      </div>

      {/* ── Disclaimer ── */}
      <div style={{
        marginTop: 8,
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

      {confirmState && (
        <ConfirmModal
          {...confirmState}
          onClose={() => setConfirmState(null)}
        />
      )}

      {showDeleteAccount && user && (
        <DeleteAccountModal
          user={user}
          isPro={isPro}
          signOut={signOut}
          onClose={() => setShowDeleteAccount(false)}
        />
      )}
    </div>
  );
}

// ── Pro upgrade modal ─────────────────────────────────────────────────────────
// Two-step modal:
//   step 'features' → feature list + "Unlock Pro" button
//   step 'signin'   → "Sign in required" panel, shown after the user taps
//                     Unlock Pro without being signed in (lets them make the
//                     decision first, then explains the login requirement)
function ProModal({ onUnlock, onClose, user, signIn, spotify }) {
  const [step, setStep] = useState('features');
  const [plan, setPlan] = useState('monthly'); // monthly is the lower-commitment default
  // Pro perks list. Note: connecting Spotify itself is FREE — Pro adds the
  // in-app playback (autoplay + Play Bridge). Playback perks are hidden
  // when we already know the user's Spotify is non-Premium, since Pro alone
  // cannot unlock playback for them — they'd need to upgrade Spotify too.
  const knownNonPremium = spotify?.isConnected && !spotify?.isPremium;
  const features = [
    { kind: 'spotify',  playback: true,  label: 'Songs autoplay while you rate', desc: 'Each song plays automatically through Spotify (Premium required)' },
    { kind: 'emoji',    playback: true,  icon: '🌉', label: 'Jump to the bridge', desc: 'One-tap seek to any song’s bridge' },
    { kind: 'emoji',    playback: false, icon: '📊', label: '8 extra categories', desc: 'Hook, Vocals, Cry Factor, and more' },
    { kind: 'emoji',    playback: false, icon: '✏️', label: 'Custom categories',  desc: 'Add your own scoring dimensions' },
    { kind: 'emoji',    playback: false, icon: '📤', label: 'CSV export',         desc: 'Download all your ratings as a spreadsheet' },
  ].filter(f => !(f.playback && knownNonPremium));

  function handleUnlock() {
    if (!user) {
      setStep('signin');
      return;
    }
    onUnlock(plan);
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
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, lineHeight: 1.5 }}>
              $4.99/month, or save 22% with an annual plan. Cancel anytime.
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
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

            {/* Plan picker — choose monthly or annual */}
            <div style={{ marginBottom: 20 }}>
              <PlanPicker plan={plan} onChange={setPlan} />
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
              {plan === 'annual'
                ? 'Subscribe — $46.71/year'
                : 'Subscribe — $4.99/month'}
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

// ── Public profile section ────────────────────────────────────────────────────

function PublicProfileSection({ profile }) {
  const { isOn, profile: data, setVisibility, setBio, profileUrl, loading } = profile;
  const [bioDraft, setBioDraft] = useState(data.bio ?? '');
  const [bioError, setBioError] = useState(null);
  const [bioSavedTick, setBioSavedTick] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keep the textarea in sync if the cloud doc updates externally (e.g. on sign-in)
  useEffect(() => { setBioDraft(data.bio ?? ''); }, [data.bio]);

  async function handleToggle() {
    await setVisibility(isOn ? 'off' : 'unlisted');
  }

  async function handleSaveBio() {
    setBioError(null);
    const result = await setBio(bioDraft);
    if (!result.ok) {
      setBioError(result.reason);
      return;
    }
    setBioSavedTick(true);
    setTimeout(() => setBioSavedTick(false), 1500);
  }

  async function handleCopyLink() {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select the input so the user can copy manually
      const el = document.getElementById('eras-profile-url');
      if (el) { el.focus(); el.select(); }
    }
  }

  const charsLeft = BIO_MAX_LENGTH - bioDraft.length;
  const tooLong = charsLeft < 0;

  return (
    <div style={{
      background: '#ffffff',
      border: '0.5px solid #e5e7eb',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 28,
    }}>
      {/* Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderBottom: isOn ? '0.5px solid #f3f4f6' : 'none',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
            Anyone with the link can view
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
            Shows your album rankings and (optional) bio. We won't list your
            profile anywhere — only people you share the link with will see it.
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          aria-pressed={isOn}
          aria-label={isOn ? 'Turn profile off' : 'Turn profile on'}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            border: 'none',
            background: isOn ? '#a855f7' : '#e5e7eb',
            position: 'relative',
            cursor: loading ? 'default' : 'pointer',
            transition: 'background 0.15s ease',
            flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute',
            top: 2,
            left: isOn ? 20 : 2,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#ffffff',
            transition: 'left 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* Share link + bio editor — only when profile is on */}
      {isOn && (
        <div style={{ padding: '14px 16px' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            marginBottom: 6,
            letterSpacing: '0.04em',
          }}>
            SHAREABLE LINK
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <input
              id="eras-profile-url"
              type="text"
              value={profileUrl ?? ''}
              readOnly
              onFocus={e => e.target.select()}
              style={{
                flex: 1,
                padding: '9px 11px',
                fontSize: 12,
                fontFamily: 'monospace',
                border: '0.5px solid #e5e7eb',
                borderRadius: 8,
                background: '#f9fafb',
                color: '#374151',
                minWidth: 0,
              }}
            />
            <button
              onClick={handleCopyLink}
              style={{
                padding: '9px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#ffffff',
                background: copied ? '#16a34a' : '#a855f7',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                flexShrink: 0,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            marginBottom: 6,
            letterSpacing: '0.04em',
          }}>
            BIO (OPTIONAL)
          </div>
          <textarea
            value={bioDraft}
            onChange={e => { setBioDraft(e.target.value); setBioError(null); }}
            placeholder="A line about your taste — no links."
            rows={2}
            style={{
              width: '100%',
              padding: '9px 11px',
              fontSize: 13,
              fontFamily: 'inherit',
              border: `0.5px solid ${tooLong ? '#fecaca' : '#e5e7eb'}`,
              borderRadius: 8,
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none',
              color: '#111827',
            }}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
            marginBottom: 10,
            fontSize: 11,
            color: tooLong ? '#dc2626' : '#9ca3af',
          }}>
            <span>{bioError ?? ' '}</span>
            <span>{bioDraft.length} / {BIO_MAX_LENGTH}</span>
          </div>

          <button
            onClick={handleSaveBio}
            disabled={tooLong || bioDraft === (data.bio ?? '')}
            style={{
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              color: '#ffffff',
              background: (tooLong || bioDraft === (data.bio ?? '')) ? '#d1d5db' : '#a855f7',
              border: 'none',
              borderRadius: 8,
              cursor: (tooLong || bioDraft === (data.bio ?? '')) ? 'default' : 'pointer',
            }}
          >
            {bioSavedTick ? 'Saved ✓' : 'Save bio'}
          </button>
        </div>
      )}
    </div>
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

// Pro subscription summary row inside the Account card. Opens the LS
// customer portal in a new tab — that's where users cancel, update card
// details, download invoices, etc. We don't host that UI ourselves; LS
// provides one portal URL per subscription and stores it on users/{uid}
// via the webhook.
//
// When the user has cancelled but still has access until period end,
// `status === 'cancelled'` and we surface a "Cancels on {date}" line so
// they know exactly when access ends and aren't surprised.
function ManageSubscriptionRow({ portalUrl, status, endsAt }) {
  const isCancelled = status === 'cancelled';

  // endsAt is an ISO string from the LS webhook (or null). Format as a
  // friendly date — defensive about bad input so a typo or missing field
  // never crashes the Account card.
  let endsAtLabel = null;
  if (isCancelled && endsAt) {
    const d = new Date(endsAt);
    if (!Number.isNaN(d.getTime())) {
      endsAtLabel = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
  }

  return (
    <a
      href={portalUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: '0.5px solid #e9d5ff',
        background: '#faf5ff',
        textDecoration: 'none',
        marginBottom: 8,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#7c3aed',
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>Manage subscription</span>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: 8,
            textTransform: 'uppercase',
          }}>Pro</span>
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
          {isCancelled && endsAtLabel
            ? `Cancels on ${endsAtLabel}. Update card or restart anytime.`
            : 'Update payment, view invoices, or cancel anytime.'}
        </div>
      </div>
      <span style={{ fontSize: 14, color: '#a855f7', flexShrink: 0 }}>↗</span>
    </a>
  );
}

// Membership section — the dedicated home for Pro status / upgrade in
// Settings. Three states:
//   1. Pro user      → status pill (Active / Cancels on X / Past due),
//                      plan + renewal date, perks list, Manage subscription.
//   2. Free signed-in → "Free plan" header, inline plan picker, perks list,
//                      Unlock Pro button (mirrors ProModal's upgrade flow).
//   3. Signed-out    → short pitch + Sign in with Google CTA, since Pro
//                      requires identity (billing follows the account).
//
// Playback-only perks (autoplay, Play Bridge) are hidden when the user is
// connected to a free Spotify account — Pro alone can't unlock playback
// for non-Premium Spotify users. Same guardrail as ProModal/PaywallCard.
function MembershipSection({
  user, isPro, unlockPro, signIn, spotify,
  customerPortalUrl, subscriptionStatus, subscriptionEndsAt,
  nextRenewalAt, subscriptionPlan,
}) {
  const [plan, setPlan] = useState(subscriptionPlan === 'annual' ? 'annual' : 'monthly');

  // Pro perk catalogue. Filtered when the user has a free Spotify so we're
  // not selling playback features Pro can't deliver to them.
  const knownNonPremium = spotify?.isConnected && !spotify?.isPremium;
  const proPerks = [
    { kind: 'spotify',  playback: true,  label: 'Songs autoplay while you rate', desc: 'Each song plays through Spotify (Premium required)' },
    { kind: 'emoji',    playback: true,  icon: '🌉', label: 'Jump to the bridge', desc: 'One-tap seek to any song’s bridge' },
    { kind: 'emoji',    playback: false, icon: '📊', label: '8 extra categories', desc: 'Hook, Vocals, Cry Factor, and more' },
    { kind: 'emoji',    playback: false, icon: '✏️', label: 'Custom categories',  desc: 'Add your own scoring dimensions' },
    { kind: 'emoji',    playback: false, icon: '📤', label: 'CSV export',         desc: 'Download all your ratings as a spreadsheet' },
  ].filter(p => !(p.playback && knownNonPremium));

  // STATE 3 — signed-out. Pro requires identity, so the only CTA is sign-in.
  if (!user) {
    return (
      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 12,
        padding: '16px',
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 14 }}>
          Pro is tied to your account so it follows you to every device. Sign in to upgrade.
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
    );
  }

  // STATE 1 — Pro. Show status pill, plan/renewal info, perks, manage button.
  if (isPro) {
    const isCancelled = subscriptionStatus === 'cancelled';
    const isPastDue = subscriptionStatus === 'past_due';

    // Pretty date for the relevant "next thing happens on" line.
    function fmtDate(iso) {
      if (!iso) return null;
      const d = new Date(iso);
      return Number.isNaN(d.getTime())
        ? null
        : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
    const renewLabel = fmtDate(nextRenewalAt);
    const endsLabel = fmtDate(subscriptionEndsAt);

    // Status pill style/label depends on subscription state.
    const pill = isCancelled
      ? { bg: '#fef3c7', border: '#fde68a', color: '#92400e', text: 'Cancelling' }
      : isPastDue
        ? { bg: '#fee2e2', border: '#fecaca', color: '#b91c1c', text: 'Payment failed' }
        : { bg: '#dcfce7', border: '#bbf7d0', color: '#166534', text: 'Active' };

    // Plan label — we only know monthly vs annual if the webhook stored it.
    const planLabel = subscriptionPlan === 'annual'
      ? 'Annual — $46.71/year'
      : subscriptionPlan === 'monthly'
        ? 'Monthly — $4.99/month'
        : 'Pro membership';

    // Subline under the plan — explains when the next billing event happens.
    let subline;
    if (isCancelled && endsLabel) {
      subline = `Access ends ${endsLabel}. Restart anytime from the portal.`;
    } else if (isPastDue) {
      subline = 'Last payment failed — update your card to keep Pro active.';
    } else if (renewLabel) {
      subline = `Renews on ${renewLabel}`;
    } else {
      subline = 'Thanks for supporting the app.';
    }

    return (
      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 28,
      }}>
        {/* Status header — pill on the right, plan name + subline on the left. */}
        <div style={{
          padding: '16px',
          borderBottom: '0.5px solid #f3f4f6',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>⭐</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                {planLabel}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
              {subline}
            </div>
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '4px 8px',
            borderRadius: 999,
            background: pill.bg,
            border: `0.5px solid ${pill.border}`,
            color: pill.color,
            flexShrink: 0,
            marginTop: 2,
          }}>
            {pill.text}
          </span>
        </div>

        {/* Perks list — what they're getting for their money. */}
        <div style={{ padding: '12px 16px 14px', borderBottom: '0.5px solid #f3f4f6' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            What you’re getting
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proPerks.map(p => (
              <PerkRow key={p.label} perk={p} />
            ))}
          </div>
        </div>

        {/* Manage subscription button — links to LS customer portal. */}
        <div style={{ padding: '12px' }}>
          {customerPortalUrl ? (
            <ManageSubscriptionRow
              portalUrl={customerPortalUrl}
              status={subscriptionStatus}
              endsAt={subscriptionEndsAt}
            />
          ) : (
            <div style={{
              fontSize: 11,
              color: '#6b7280',
              padding: '8px 12px',
              textAlign: 'center',
              lineHeight: 1.4,
            }}>
              Subscription details are syncing. The manage link will appear here in a moment.
            </div>
          )}
        </div>
      </div>
    );
  }

  // STATE 2 — Free, signed-in. Show plan picker + perks + Unlock button.
  return (
    <div style={{
      background: '#ffffff',
      border: '0.5px solid #e5e7eb',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 28,
    }}>
      <div style={{ padding: '16px', borderBottom: '0.5px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            You’re on the Free plan
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
          Upgrade to Pro for $4.99/month, or save 22% with the annual plan. Cancel anytime.
        </div>
      </div>

      {/* Perks the user would unlock. */}
      <div style={{ padding: '12px 16px 14px', borderBottom: '0.5px solid #f3f4f6' }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#6b7280',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          You’ll unlock
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {proPerks.map(p => (
            <PerkRow key={p.label} perk={p} />
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ marginBottom: 14 }}>
          <PlanPicker plan={plan} onChange={setPlan} />
        </div>
        <button
          onClick={() => unlockPro(plan)}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(168,85,247,0.30)',
          }}
        >
          {plan === 'annual' ? 'Subscribe — $46.71/year' : 'Subscribe — $4.99/month'}
        </button>
      </div>
    </div>
  );
}

// One row in the perks list — icon tile + label + description. Used by both
// the Pro-active and Free states so the same perks render consistently.
function PerkRow({ perk }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: perk.kind === 'spotify' ? '#ffffff' : '#f3e8ff',
        border: perk.kind === 'spotify' ? '0.5px solid #e5e7eb' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        flexShrink: 0,
      }}>
        {perk.kind === 'spotify'
          ? <SpotifyBadge variant="green" size={24} />
          : perk.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{perk.label}</div>
        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>{perk.desc}</div>
      </div>
    </div>
  );
}

// Dev-only toggle for the developer email. When flipped on, clears every
// onboarding flag and reloads so the next app boot looks like a brand-new
// user. main.jsx also re-clears the flags on every subsequent boot until
// this toggle is flipped off, so reloading mid-UAT keeps everything fresh.
function UatToggle({ user, isPro }) {
  const [on, setOn] = useState(isUatMode);

  function handleToggle() {
    const next = !on;
    setUatMode(next);
    setOn(next);
    if (next) {
      clearOnboardingFlags();
      // Reload so the user immediately sees the Welcome tour, etc.
      window.location.reload();
    }
  }

  // Revokes the dev's Pro entitlement so they can re-test the upgrade
  // flow. Mirrors usePro's mock-grant path in reverse: clears local +
  // cloud isPro. The onSnapshot listener in usePro picks it up and the
  // UI flips back to non-Pro.
  function handleRevokePro() {
    if (!user || !db) return;
    localStorage.removeItem('eras_is_pro');
    setDoc(
      doc(db, 'users', user.uid),
      { isPro: false, proPlan: null, proRevokedAt: new Date() },
      { merge: true }
    ).catch(() => {});
  }

  return (
    <div style={{
      background: '#fffbeb',
      border: '0.5px solid #fde68a',
      borderRadius: 12,
      padding: '4px 0',
      marginBottom: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Dev · UAT
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
            UAT as new user
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>
            Resets onboarding flags so the Welcome tour, album mode modal,
            Vibe Check intro, drag hint, and bridge nudge all reappear. While
            on, every reload restores the new-user view.
          </div>
        </div>
        <div
          onClick={handleToggle}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            background: on ? '#a855f7' : '#d1d5db',
            position: 'relative',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 3,
            left: on ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#ffffff',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
      </div>

      {/* Pro test grant note + revoke button. Dev emails get a free
          mock-grant when they tap Unlock Pro (see usePro.js), so this
          panel just needs to flag that and offer a way to revoke. */}
      <div style={{
        borderTop: '0.5px solid #fde68a',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
            Pro test grant
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>
            Tapping Unlock Pro on this account skips Lemon Squeezy and grants
            Pro instantly. Use Revoke to drop back to non-Pro for re-testing.
          </div>
        </div>
        <button
          onClick={handleRevokePro}
          disabled={!isPro}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '0.5px solid #fde68a',
            background: isPro ? '#ffffff' : '#fef3c7',
            color: isPro ? '#92400e' : '#d97706',
            fontSize: 12,
            fontWeight: 600,
            cursor: isPro ? 'pointer' : 'default',
            opacity: isPro ? 1 : 0.5,
            flexShrink: 0,
          }}
        >
          {isPro ? 'Revoke Pro' : 'Not Pro'}
        </button>
      </div>
    </div>
  );
}

// Small purple "PRO" pill — used inline next to setting labels that are
// gated behind Pro. Tells the free user "this is a paid feature" without
// hiding the row entirely.
function ProBadge() {
  return (
    <span style={{
      fontSize: 9,
      fontWeight: 700,
      color: '#a855f7',
      background: '#f3e8ff',
      padding: '2px 7px',
      borderRadius: 99,
      letterSpacing: '0.05em',
    }}>
      PRO
    </span>
  );
}

// SettingRow variant that renders the toggle disabled when isPro is false,
// and instead routes taps on the row to the upgrade modal. Pro users see
// the regular toggle behaviour.
function ProGatedRow({ isPro, onUpsell, label, description, value, onChange }) {
  if (isPro) {
    return (
      <SettingRow
        label={label}
        description={description}
        value={value}
        onChange={onChange}
      />
    );
  }

  return (
    <div
      onClick={onUpsell}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        cursor: 'pointer',
        opacity: 0.65,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{label}</span>
          <ProBadge />
        </div>
        {description && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: '#d1d5db',
        position: 'relative',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
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

