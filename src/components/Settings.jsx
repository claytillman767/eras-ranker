import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ALL_ALBUMS, SONGS } from '../data/albums';
import { DEFAULT_CATEGORIES, EXTRA_CATEGORIES } from '../data/categories';
import PublicProfilePanel from './PublicProfilePanel';
import { TIP_JAR_URL } from '../data/tipJar';
import CategoriesEditor from './CategoriesEditor';
import ConfirmModal from './ConfirmModal';
import DeleteAccountModal from './DeleteAccountModal';
import { isDevEmail, isUatMode, setUatMode, clearOnboardingFlags, isAdminUid } from '../uat';
import { getNow, setOffset, advanceMs, resetClock, useDevClock } from '../constants/devClock';
import { weekStartMs, MS_PER_DAY, dayOffset, currentRoundIndex, isChampionRevealed } from '../constants/weeklySchedule';
import { getCurrentWeekNumber, getWeeklyCategoryName } from '../constants/bracketCategories';

// Settings tab — app-wide display and behaviour preferences.
export default function Settings({
  settings, updateSetting, isPro, unlockPro,
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
    // Wipe all app-owned localStorage keys.
    Object.keys(localStorage)
      .filter(k => k.startsWith('eras_'))
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
      body: 'This deletes your personal brackets and weekly votes.',
      confirmLabel: 'Clear data',
      destructive: true,
      onConfirm: doClearBracketData,
    });
  }

  async function doClearBracketData() {
    ['eras_brackets', 'eras_weekly_bracket']
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

      {/* Page title — gives the screen a proper anchor so it doesn't start
          cold on a tiny section header. */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text)',
          margin: 0,
          marginBottom: 4,
          letterSpacing: '-0.01em',
        }}>
          Settings
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>
          Account, membership, and app preferences.
        </div>
      </div>

      {/* ── Sign-in hero (signed-out only) ──
          Consolidates the three sign-in asks (Account, Membership, Public
          profile) into a single primary CTA. The three sections below that
          require an account are hidden when signed out, so this card is the
          one place that pitches sign-in. */}
      {!user && <SignInHeroCard signIn={signIn} />}

      {/* ── Pro upgrade modal ── */}
      {showProModal && (
        <ProModal
          onUnlock={handleUnlockPro}
          onClose={() => setShowProModal(false)}
          user={user}
          signIn={signIn}
        />
      )}

      {/* ── Account section (signed-in only) ──
          When signed out, the Sign-in hero above carries the ask; the
          account-management rows (sign out / forget / delete) have no
          meaning without an account, so the section is hidden entirely. */}
      {user && <>
      <SectionHeader>Account</SectionHeader>
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
      }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px',
              borderBottom: '0.5px solid var(--hairline)',
            }}>
              {/* Avatar */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '2px solid var(--brand)',
                overflow: 'hidden',
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName ?? 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-text)' }}>
                    {user.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  {user.displayName ?? 'Google User'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{
                fontSize: 12,
                color: 'var(--success-text)',
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
                  border: '0.5px solid var(--border)',
                  background: 'var(--surface)',
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                    Sign out
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>
                    Your data stays in the cloud. Sign back in any time to restore it.
                  </div>
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-3)', flexShrink: 0 }}>→</span>
              </button>

              {/* Danger zone divider — separates non-destructive Sign out
                  from the destructive Forget/Delete cluster so they read as
                  a distinct group. */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 16,
                marginBottom: 10,
              }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-3)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Danger zone
                </div>
                <div style={{ flex: 1, height: '0.5px', background: 'var(--hairline)' }} />
              </div>

              {/* Forget me on this device — destructive: wipes local data */}
              <button
                onClick={handleForgetMe}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '0.5px solid var(--danger-border)',
                  background: 'var(--surface)',
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger-text)', marginBottom: 2 }}>
                    Forget me on this device
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>
                    Wipes the local copy on this browser. Your cloud data is untouched.
                  </div>
                </div>
                <span style={{ fontSize: 14, color: 'var(--danger-text)', flexShrink: 0 }}>→</span>
              </button>

              {/* Delete account — fully destructive: wipes cloud + auth + local */}
              <button
                onClick={() => setShowDeleteAccount(true)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '0.5px solid var(--danger-border)',
                  background: 'var(--danger-bg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger-text)', marginBottom: 2 }}>
                    Delete my account
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--danger-text)', lineHeight: 1.4 }}>
                    Permanently removes your ratings, profile, and account from every device.
                  </div>
                </div>
                <span style={{ fontSize: 14, color: 'var(--danger-text)', flexShrink: 0 }}>→</span>
              </button>
            </div>
      </div>
      </>}

      {/* Dev-only UAT panel — only the developer email sees this row */}
      {isDevEmail(user?.email) && <UatToggle user={user} isPro={isPro} />}

      {/* Admin-only time-travel panel — step through the weekly bracket screens */}
      {isAdminUid(user?.uid) && <AdminTimeTravel />}

      {/* ── Membership section (signed-in only) ──
          The Sign-in hero up top covers the "what Pro unlocks" pitch when
          signed out, so this section only renders once there's an account
          to attach a subscription to. */}
      {user && <>
      <SectionHeader>Membership</SectionHeader>
      <MembershipSection
        user={user}
        isPro={isPro}
        unlockPro={unlockPro}
        signIn={signIn}
        customerPortalUrl={customerPortalUrl}
        subscriptionStatus={subscriptionStatus}
        subscriptionEndsAt={subscriptionEndsAt}
        nextRenewalAt={nextRenewalAt}
        subscriptionPlan={subscriptionPlan}
      />
      </>}

      {/* Tip jar — pure goodwill, hidden until a URL is configured. */}
      {TIP_JAR_URL && (
        <a
          href={TIP_JAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-2)',
            textDecoration: 'none',
            margin: '-8px 0 24px',
          }}
        >
          ☕ Enjoying the app? Buy me a coffee
        </a>
      )}

      {/* ── Public profile section (signed-in only) ──
          The Sign-in hero up top mentions public profiles when signed out,
          so this section only renders once there's an account it can mirror
          rankings into. */}
      {user && profile && (
        <>
          <SectionHeader>Public profile</SectionHeader>
          <PublicProfilePanel profile={profile} user={user} signIn={signIn} />
        </>
      )}

      {/* ── Rating Categories section ── */}
      <SectionHeader>Rating Categories</SectionHeader>
      <button
        onClick={() => setShowCategoriesEditor(true)}
        style={{
          width: '100%',
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 24,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
            Edit categories &amp; weights
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>
            {activeCategories.length} active · turn defaults on/off, tune weights, see how your top songs and albums shift.
          </div>
        </div>
        <span style={{ fontSize: 18, color: 'var(--brand-text)', flexShrink: 0 }}>→</span>
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

      {/* ── Appearance section ── */}
      {/* Visual theming. Dark mode flips the data-theme attribute on <html>;
          CSS variables in index.css repaint the whole app. */}
      <SectionHeader>Appearance</SectionHeader>
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        <SettingRow
          label="Dark mode"
          description="Use a dark color scheme across the app. Your choice is saved and synced to your account."
          value={settings.theme === 'dark'}
          onChange={v => updateSetting('theme', v ? 'dark' : 'light')}
        />
      </div>

      {/* ── Preferences section ── */}
      {/* App-wide behaviour toggles. Renamed from "Display" since the rows
          here are about how the app behaves (rather than visual theming). */}
      <SectionHeader>Preferences</SectionHeader>
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        <SettingRow
          label="Confirm before exiting QuickScore"
          description="Ask for confirmation before closing the rating screen mid-session."
          value={settings.confirmQuickScoreExit ?? true}
          onChange={v => updateSetting('confirmQuickScoreExit', v)}
        />
        {onShowWelcome && (
          <>
            <div style={{ height: '0.5px', background: 'var(--hairline)', margin: '0 16px' }} />
            <button
              onClick={onShowWelcome}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '14px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
                  Show welcome tour again
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                  Replays the intro slides — handy when you want a refresher.
                </div>
              </div>
              <span style={{ fontSize: 14, color: 'var(--brand-text)', flexShrink: 0 }}>→</span>
            </button>
          </>
        )}
      </div>

      {/* ── Data section ── */}
      <SectionHeader>Data</SectionHeader>
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
            Export ratings
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>
            Download all your ratings as a spreadsheet (.csv) — one row per song, one column per category.
          </div>
          <button
            onClick={handleExportRatings}
            disabled={!ratings || Object.keys(ratings).length === 0}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: '0.5px solid var(--border)',
              background: ratings && Object.keys(ratings).length > 0 ? 'var(--surface)' : 'var(--surface-2)',
              fontSize: 13,
              fontWeight: 500,
              color: ratings && Object.keys(ratings).length > 0 ? 'var(--text)' : 'var(--text-3)',
              cursor: ratings && Object.keys(ratings).length > 0 ? 'pointer' : 'default',
            }}
          >
            Download CSV
          </button>
        </div>
        <div style={{ borderTop: '0.5px solid var(--border)', padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
            Clear bracket data
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>
            Wipes personal brackets and weekly votes so you can replay the flow. Your ratings are not touched.
          </div>
          <button
            onClick={handleClearBracketData}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: '0.5px solid var(--danger-border)',
              background: 'var(--surface)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--danger-text)',
              cursor: 'pointer',
            }}
          >
            Clear bracket data
          </button>
        </div>
      </div>

      {/* ── Footer: version + disclaimer ── */}
      {/* Unified footer block — single card with the version line on top and
          the fan-made disclaimer below, separated by a thin divider. Replaces
          the earlier setup where the version was loose centred text and the
          disclaimer was its own card. */}
      <div style={{
        marginTop: 16,
        padding: '14px 16px',
        background: 'var(--surface-2)',
        border: '0.5px solid var(--border)',
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-2)',
          letterSpacing: '0.04em',
        }}>
          The Eras Ranker · v{__APP_VERSION__}
        </div>

        {/* Legal links — sit right under the version line so they're easy
            to find from anywhere in the app via Settings → bottom of page. */}
        <div style={{
          fontSize: 11,
          color: 'var(--text-3)',
          marginTop: 6,
        }}>
          <a
            href="/privacy"
            style={{ color: 'var(--brand-text)', textDecoration: 'underline' }}
          >
            Privacy Policy
          </a>
          {' · '}
          <a
            href="/terms"
            style={{ color: 'var(--brand-text)', textDecoration: 'underline' }}
          >
            Terms of Service
          </a>
        </div>

        <div style={{ height: '0.5px', background: 'var(--border)', margin: '10px 0' }} />
        <div style={{
          fontSize: 11,
          color: 'var(--text-3)',
          lineHeight: 1.5,
        }}>
          This app is a fan-made project and is not affiliated with, endorsed by,
          or connected to Taylor Swift or TAS Rights Management, LLC.
        </div>
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
function ProModal({ onUnlock, onClose, user, signIn }) {
  const [step, setStep] = useState('features');
  const features = [
    { icon: '📊', label: '8 extra rating categories', desc: 'Hook, Vocals, Cry Factor, and more' },
    { icon: '✏️', label: 'Custom categories',  desc: 'Add your own scoring dimensions' },
    { icon: '🏆', label: 'Custom brackets',    desc: 'Build your own song tournaments' },
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
          background: 'var(--surface)',
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
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
                Unlock Pro
              </div>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.5 }}>
              A one-time $3.99 unlock — yours forever, no subscription.
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {features.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--accent-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{f.desc}</div>
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
                background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
                marginBottom: 12,
              }}
            >
              Unlock — $3.99 one time
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                border: '0.5px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-2)',
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
          color: 'var(--text-2)',
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
        background: 'var(--accent-soft)',
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
        color: 'var(--text)',
        textAlign: 'center',
        marginBottom: 8,
      }}>
        Sign in to continue
      </div>

      <div style={{
        fontSize: 13,
        color: 'var(--text-2)',
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
          border: '1px solid var(--control-off)',
          background: 'var(--surface)',
          color: 'var(--text)',
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
      color: 'var(--text-2)',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

// Signed-out hero on the Settings page. Replaces three separate "Sign in
// with Google" buttons (one each in Account, Membership, Public profile)
// with one primary CTA that consolidates what signing in unlocks. The
// three sections below are hidden when signed out, so this card is the
// only sign-in ask on the page.
//
// Pro perk copy ("8 extra rating categories, custom categories, and
// custom brackets") and price ("$3.99 one time") must match the canonical
// wording used on PaywallCard / VibeCheckIntro / MembershipSection / the
// ProModal. If this changes, run the pro-funnel-auditor.
function SignInHeroCard({ signIn }) {
  const benefits = [
    {
      title: 'Back up your ratings',
      body: 'Your scores follow you to every device — phone, tablet, laptop.',
    },
    {
      title: 'Unlock the full toolkit',
      body: '8 extra rating categories, custom categories, and custom brackets — $3.99 one time.',
    },
    {
      title: 'Share a public ranking page',
      body: 'A simple link anyone can open to see your album and song rankings.',
    },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--accent-grad-a), var(--accent-soft))',
      border: '0.5px solid var(--accent-soft-2)',
      borderRadius: 14,
      padding: '20px 18px',
      marginBottom: 28,
    }}>
      <div style={{
        fontSize: 17,
        fontWeight: 700,
        color: 'var(--text)',
        marginBottom: 4,
        letterSpacing: '-0.01em',
      }}>
        Sign in to get more out of the app
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--text-2)',
        lineHeight: 1.5,
        marginBottom: 16,
      }}>
        One Google account unlocks three things you can&rsquo;t do signed out:
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        {benefits.map(({ title, body }) => (
          <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
              flexShrink: 0,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'var(--brand)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              marginTop: 1,
            }} aria-hidden="true">✓</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 2,
                lineHeight: 1.3,
              }}>
                {title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>
                {body}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={signIn}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          padding: '12px',
          borderRadius: 12,
          border: '1px solid var(--control-off)',
          background: 'var(--surface)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text)',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
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
    </div>
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
function MembershipSection({
  user, isPro, unlockPro, signIn,
  customerPortalUrl, subscriptionStatus, subscriptionEndsAt,
  nextRenewalAt, subscriptionPlan,
}) {
  const proPerks = [
    { icon: '📊', label: '8 extra rating categories', desc: 'Hook, Vocals, Cry Factor, and more' },
    { icon: '✏️', label: 'Custom categories',  desc: 'Add your own scoring dimensions' },
    { icon: '🏆', label: 'Custom brackets',    desc: 'Build your own song tournaments' },
  ];

  // STATE 3 — signed-out. Pro requires identity, so the only CTA is sign-in.
  if (!user) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12,
        padding: '16px',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 14 }}>
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
            border: '1px solid var(--control-off)',
            background: 'var(--surface)',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text)',
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
    // One-time unlock — nothing to renew, cancel, or manage.
    const pill = { bg: 'var(--success-bg)', border: 'var(--success-border)', color: 'var(--success-text)', text: 'Unlocked' };
    const planLabel = 'Unlocked — $3.99 one time';
    const subline = 'Yours forever. Thanks for supporting the app.';

    return (
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        {/* Status header — pill on the right, plan name + subline on the left. */}
        <div style={{
          padding: '16px',
          borderBottom: '0.5px solid var(--hairline)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>⭐</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                {planLabel}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
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
        <div style={{ padding: '12px 16px 14px', borderBottom: '0.5px solid var(--hairline)' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-2)',
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

        {/* One-time unlock — no billing portal, nothing to manage. */}
        <div style={{
          padding: '14px 16px',
          fontSize: 11,
          color: 'var(--text-2)',
          textAlign: 'center',
          lineHeight: 1.4,
        }}>
          One-time purchase — there's nothing to manage or cancel.
        </div>
      </div>
    );
  }

  // STATE 2 — Free, signed-in. Show plan picker + perks + Unlock button.
  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      <div style={{ padding: '16px', borderBottom: '0.5px solid var(--hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            You’re on the Free plan
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
          A one-time $3.99 unlock — yours forever, no subscription.
        </div>
      </div>

      {/* Perks the user would unlock. */}
      <div style={{ padding: '12px 16px 14px', borderBottom: '0.5px solid var(--hairline)' }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-2)',
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
        <button
          onClick={() => unlockPro()}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(168,85,247,0.30)',
          }}
        >
          Unlock — $3.99 one time
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
        background: 'var(--accent-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        flexShrink: 0,
      }}>
        {perk.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{perk.label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>{perk.desc}</div>
      </div>
    </div>
  );
}

// Admin-only time-travel panel (gated by uid in the parent). Shifts the dev
// clock (devClock.js) so the weekly bracket jumps to a chosen day of the
// current week — letting an admin step through the later screens (results
// reveal, locked/waiting, the Sunday champion) without waiting for the real
// Mon→Sun schedule. The offset only changes the bracket view on this device;
// it grants nothing and writes nothing to the server.
function AdminTimeTravel() {
  const { offset } = useDevClock(); // re-render whenever the clock changes
  const now = getNow();
  const wk = getCurrentWeekNumber();
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const d = dayOffset(now, wk);
  const champ = isChampionRevealed(now, wk);
  const round = currentRoundIndex(now, wk) + 1;
  const stateLabel = champ ? '👑 Champion crowned' : `Round ${round} of 4 open`;

  // Land at noon UTC of the chosen day of the current week (safely inside it).
  const jumpToDay = (day) => {
    const target = weekStartMs(wk) + day * MS_PER_DAY + 12 * 60 * 60 * 1000;
    setOffset(target - Date.now());
  };

  const MILESTONES = [
    { label: 'R1 vote', sub: 'Mon', day: 0 },
    { label: 'R1 results + R2', sub: 'Wed', day: 2 },
    { label: 'R2 results + R3', sub: 'Fri', day: 4 },
    { label: 'R3 results + Final', sub: 'Sat', day: 5 },
    { label: '👑 Champion', sub: 'Sun', day: 6 },
  ];

  const pill = {
    appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
    border: '1px solid #fcd34d', background: '#fff', color: '#92400e',
    borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 700,
  };

  return (
    <div style={{
      background: '#fffbeb', border: '0.5px solid #fde68a', borderRadius: 12,
      padding: '14px 16px', marginBottom: 24,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        Admin · Bracket time travel
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45, marginBottom: 10 }}>
        Jump the weekly bracket to any day of the week to test every screen, then open the
        Brackets tab to see it. Only shifts the bracket clock on this device.
      </div>

      <div style={{
        fontSize: 12, color: 'var(--text)', background: '#fff',
        border: '0.5px solid #fde68a', borderRadius: 8, padding: '8px 10px', marginBottom: 12,
      }}>
        <div><b>{DAYS[d]}</b> · {stateLabel}</div>
        <div style={{ color: 'var(--text-2)', marginTop: 2 }}>
          {getWeeklyCategoryName(wk)} · effective {new Date(now).toLocaleString()}
        </div>
        {offset !== 0 && (
          <div style={{ color: '#92400e', marginTop: 2 }}>
            clock shifted {offset > 0 ? '+' : ''}{Math.round((offset / MS_PER_DAY) * 10) / 10}d from real time
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {MILESTONES.map(m => (
          <button key={m.day} onClick={() => jumpToDay(m.day)}
            style={{ ...pill, background: d === m.day ? '#fcd34d' : '#fff' }}>
            {m.label} <span style={{ opacity: 0.6, fontWeight: 600 }}>· {m.sub}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button onClick={() => advanceMs(-MS_PER_DAY)} style={pill}>− 1 day</button>
        <button onClick={() => advanceMs(MS_PER_DAY)} style={pill}>+ 1 day</button>
        <button onClick={() => advanceMs(6 * 60 * 60 * 1000)} style={pill}>+ 6 h</button>
        <button onClick={resetClock} style={{ ...pill, borderColor: '#d1d5db', color: 'var(--text-2)' }}>
          Reset to now
        </button>
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
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Dev · UAT
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
            UAT as new user
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.4 }}>
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
            background: on ? 'var(--brand)' : 'var(--control-off)',
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
            background: 'var(--surface)',
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
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
            Pro test grant
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.4 }}>
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

function SettingRow({ label, description, value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.4 }}>
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
          background: value ? 'var(--brand)' : 'var(--control-off)',
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
          background: 'var(--surface)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  );
}

