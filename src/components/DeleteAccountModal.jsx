import { useState } from 'react';
import { reauthenticateWithPopup, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, googleProvider } from '../firebase';

// Multi-step delete-account flow.
//
// Steps:
//   1. 'explain'  — list what will be wiped + offer CSV export + Continue/Cancel
//   2. 'confirm'  — re-auth + final checkbox + Delete forever
//   3. 'working'  — running the deletion (spinner)
//   4. 'done'     — "your account has been deleted" goodbye screen
//   5. 'error'    — something failed mid-way; show the error and a retry path
//
// Order of operations during deletion (matters for privacy):
//   1. (future) Cancel any active Lemon Squeezy subscription
//   2. Delete profiles/{uid}                     — kills the public link
//   3. Delete users/{uid}                        — wipes ratings + Pro flag
//   4. deleteUser() on the Firebase auth record  — sign-out is automatic
//   5. Wipe local app data on this device
//
// Steps 2–4 must run in this order. Auth must outlive the Firestore writes
// (Firestore rules require auth.uid === userId to delete the doc), and we
// purge auth last so a partial failure leaves orphan docs only — never a
// case where auth survives WITH active Firestore data.
export default function DeleteAccountModal({ user, isPro, signOut, onClose }) {
  const [step, setStep] = useState('explain');
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // ── Step transitions ─────────────────────────────────────────────────────

  async function startDeletion() {
    if (!user) return;

    // Block the whole flow when offline — partial deletes are worse than
    // refusing to start. The fetch-style check is enough; the deletion
    // itself will surface a clearer error if connectivity drops mid-run.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setErrorMsg('You need to be online to delete your account. Please reconnect and try again.');
      setStep('error');
      return;
    }

    setStep('working');

    try {
      // 1) Cancel Pro subscription via /api/cancel-subscription.
      //    The endpoint is idempotent — if there's no subscription stored
      //    on the user's Firestore doc, it returns { skipped: true } and
      //    we move on. Only a hard failure (5xx, network error) aborts the
      //    deletion: better to bail out than to delete the user's data
      //    while still billing them.
      //
      //    Skipped entirely when:
      //    - the user isn't Pro (common case), or
      //    - Lemon Squeezy isn't fully wired yet (no variant-ID env var
      //      present means we're still on the mock unlock path, so there's
      //      no real subscription to cancel — and the API endpoint may
      //      not be deployed either).
      const lsWired = !!import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_ID_MONTHLY;
      if (isPro && lsWired) {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/cancel-subscription', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${idToken}` },
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw new Error(`Could not cancel your Pro subscription (${res.status}). ${detail}`);
        }
      }

      // 2) Delete the public profile doc, if one exists.
      //    deleteDoc on a non-existent doc is a no-op in Firestore, so we
      //    don't need to check first. If it fails for any other reason
      //    (e.g. permission), we surface the error and stop.
      try {
        await deleteDoc(doc(db, 'profiles', user.uid));
      } catch (e) {
        if (e?.code !== 'not-found') throw e;
      }

      // 3) Delete the user data doc.
      await deleteDoc(doc(db, 'users', user.uid));

      // 4) Delete the Firebase auth record. May throw 'auth/requires-recent-login'
      //    if the session is older than ~5 minutes. Handle that by re-authing
      //    via popup, then retrying once.
      try {
        await deleteUser(user);
      } catch (e) {
        if (e?.code === 'auth/requires-recent-login') {
          await reauthenticateWithPopup(user, googleProvider);
          await deleteUser(user);
        } else {
          throw e;
        }
      }

      // 5) Wipe local data on this device. Keep eras_beta_unlocked so the
      //    sign-out lands on the welcome flow and not the beta gate.
      Object.keys(localStorage)
        .filter(k => k.startsWith('eras_') && k !== 'eras_beta_unlocked')
        .forEach(k => localStorage.removeItem(k));

      setStep('done');
    } catch (e) {
      // Loud log so a developer reviewing console output can see the failure.
      // A daily failure check (planned) will surface partial deletions.
      console.error('Account deletion failed', e);
      setErrorMsg(humanizeError(e));
      setStep('error');
    }
  }

  // After the goodbye screen, sign the (now-deleted) session out and reload
  // so the app comes up in a clean state.
  async function finishGoodbye() {
    try {
      if (signOut) await signOut();
    } finally {
      window.location.assign('/');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      onClick={step === 'working' || step === 'done' ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '24px 24px 22px',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        }}
      >
        {step === 'explain' && (
          <ExplainStep
            isPro={isPro}
            onContinue={() => setStep('confirm')}
            onCancel={onClose}
          />
        )}

        {step === 'confirm' && (
          <ConfirmStep
            confirmed={confirmed}
            onToggle={setConfirmed}
            onBack={() => setStep('explain')}
            onDelete={startDeletion}
          />
        )}

        {step === 'working' && <WorkingStep />}

        {step === 'done' && <DoneStep onClose={finishGoodbye} />}

        {step === 'error' && (
          <ErrorStep
            message={errorMsg}
            onRetry={() => { setErrorMsg(null); setStep('explain'); }}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// ── Step components ─────────────────────────────────────────────────────────

function ExplainStep({ isPro, onContinue, onCancel }) {
  return (
    <>
      <Title>Delete your account?</Title>
      <Body>
        Deleting your account permanently removes:
      </Body>
      <ul style={{
        margin: '0 0 16px',
        paddingLeft: 20,
        color: '#4b5563',
        fontSize: 14,
        lineHeight: 1.7,
      }}>
        <li>All your song ratings and brackets</li>
        <li>Your public profile, if you have one</li>
        <li>Your account on every device you've signed into</li>
        {isPro && (
          <li>
            <b>Your Pro subscription</b> — cancelled immediately, with no
            refund for unused time. Sign up again to re-subscribe.
          </li>
        )}
      </ul>
      <div style={{
        background: '#fef3c7',
        border: '0.5px solid #fde68a',
        borderRadius: 10,
        padding: '10px 12px',
        fontSize: 12,
        color: '#92400e',
        marginBottom: 18,
        lineHeight: 1.5,
      }}>
        This can't be undone. If you'd like a copy of your ratings first,
        head to <b>Settings → Export ratings</b> and download the CSV before
        you continue.
      </div>

      <ButtonStack>
        <PrimaryButton destructive onClick={onContinue}>Continue</PrimaryButton>
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
      </ButtonStack>
    </>
  );
}

function ConfirmStep({ confirmed, onToggle, onBack, onDelete }) {
  return (
    <>
      <Title>One last check</Title>
      <Body>
        We'll sign you in with Google one more time to confirm it's really
        you, then delete everything tied to your account.
      </Body>

      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        border: '0.5px solid #e5e7eb',
        borderRadius: 10,
        background: '#fafafa',
        cursor: 'pointer',
        marginBottom: 18,
      }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => onToggle(e.target.checked)}
          style={{
            width: 18,
            height: 18,
            marginTop: 2,
            accentColor: '#dc2626',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
          I understand this is permanent and can't be undone.
        </span>
      </label>

      <ButtonStack>
        <PrimaryButton destructive disabled={!confirmed} onClick={onDelete}>
          Delete forever
        </PrimaryButton>
        <SecondaryButton onClick={onBack}>Back</SecondaryButton>
      </ButtonStack>
    </>
  );
}

function WorkingStep() {
  return (
    <div style={{ padding: '20px 0', textAlign: 'center' }}>
      <Spinner />
      <div style={{ fontSize: 14, color: '#4b5563', marginTop: 14 }}>
        Deleting your account…
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
        Don't close this tab.
      </div>
    </div>
  );
}

function DoneStep({ onClose }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
      <Title>Your account has been deleted</Title>
      <Body>
        Everything tied to your account has been removed. We're sorry to see
        you go — you're welcome back any time.
      </Body>
      <PrimaryButton onClick={onClose}>Close</PrimaryButton>
    </div>
  );
}

function ErrorStep({ message, onRetry, onClose }) {
  return (
    <>
      <Title>Something went wrong</Title>
      <Body>
        {message || 'We couldn\'t finish deleting your account. Please try again.'}
      </Body>
      <div style={{
        background: '#fef2f2',
        border: '0.5px solid #fecaca',
        borderRadius: 10,
        padding: '10px 12px',
        fontSize: 12,
        color: '#991b1b',
        marginBottom: 18,
        lineHeight: 1.5,
      }}>
        Some of your data may have been removed before this error. Sign in
        again and check your account — if anything looks off, retry the
        delete.
      </div>
      <ButtonStack>
        <PrimaryButton destructive onClick={onRetry}>Try again</PrimaryButton>
        <SecondaryButton onClick={onClose}>Close</SecondaryButton>
      </ButtonStack>
    </>
  );
}

// ── Shared mini components ──────────────────────────────────────────────────

function Title({ children }) {
  return (
    <div style={{
      fontSize: 18,
      fontWeight: 700,
      color: '#111827',
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function Body({ children }) {
  return (
    <div style={{
      fontSize: 14,
      color: '#4b5563',
      lineHeight: 1.55,
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function ButtonStack({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, destructive = false, disabled = false }) {
  const bg = destructive
    ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
    : 'linear-gradient(135deg, #a855f7, #7c3aed)';
  const shadow = destructive
    ? '0 4px 12px rgba(239,68,68,0.3)'
    : '0 4px 12px rgba(168,85,247,0.3)';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: 12,
        border: 'none',
        background: disabled ? '#e5e7eb' : bg,
        color: disabled ? '#9ca3af' : '#ffffff',
        fontSize: 15,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : shadow,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '11px',
        borderRadius: 12,
        border: '0.5px solid #d1d5db',
        background: '#ffffff',
        color: '#4b5563',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <>
      <style>{`
        @keyframes delete-spinner-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: 32,
        height: 32,
        margin: '0 auto',
        border: '3px solid #f3e8ff',
        borderTopColor: '#a855f7',
        borderRadius: '50%',
        animation: 'delete-spinner-spin 0.8s linear infinite',
      }} />
    </>
  );
}

// Map Firebase error codes to plain-language messages users can act on.
function humanizeError(e) {
  const code = e?.code || '';
  if (code === 'auth/popup-closed-by-user') {
    return 'The sign-in window closed before we could confirm your identity. Please try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'A network error stopped the deletion. Check your connection and try again.';
  }
  if (code === 'permission-denied') {
    return 'We couldn\'t delete your data because of a permissions issue. Please try again, or contact support if it keeps happening.';
  }
  if (code === 'auth/requires-recent-login') {
    return 'For your security, please sign out and sign back in, then try again.';
  }
  return e?.message || 'An unexpected error stopped the deletion.';
}
