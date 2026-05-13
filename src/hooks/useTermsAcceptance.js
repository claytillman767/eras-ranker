import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { LEGAL_VERSION } from '../data/legalVersion';

// Watches the signed-in user's accepted-legal-version against the
// current LEGAL_VERSION. Exposes:
//
//   needsAcceptance — true when a signed-in user's accepted version is
//                     present on their doc AND it does NOT match the
//                     current LEGAL_VERSION. Used by App.jsx to render
//                     UpdatedTermsModal before the rest of the app.
//
//   acceptTerms()   — writes the current LEGAL_VERSION (and a server
//                     timestamp) to the user's doc, dismissing the modal.
//
//   loading         — true on first read while waiting for Firestore to
//                     send the initial snapshot. App.jsx uses this to
//                     avoid flashing the modal on cold load.
//
// ── Grandfather rule ───────────────────────────────────────────────────
// A user doc with NO `termsAcceptedVersion` field is treated as already
// having accepted the current version. The field gets written for them
// on their next session by useUserStats, so this case is brief — only
// users created before the tracking feature shipped, on the very first
// session after the feature went live. It prevents an "Updated Terms"
// modal from appearing for existing users on day one for terms that
// haven't actually changed since they signed up.
export function useTermsAcceptance(user) {
  const [acceptedVersion, setAcceptedVersion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setAcceptedVersion(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const data = snap.data() ?? {};
        // `undefined` means "field not present on the doc" — the
        // grandfather case. Reading as the current version means
        // needsAcceptance stays false for these users.
        const v = data.termsAcceptedVersion ?? LEGAL_VERSION;
        setAcceptedVersion(v);
        setLoading(false);
      },
      () => {
        // Snapshot error (e.g. offline) — fail open so the modal
        // doesn't block the app for a transient network issue.
        setAcceptedVersion(LEGAL_VERSION);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  async function acceptTerms() {
    if (!user || !db) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          termsAcceptedVersion: LEGAL_VERSION,
          termsAcceptedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Silent — the onSnapshot listener will reflect a successful
      // write the next time Firestore confirms it. A failed write
      // means the modal stays up; user can try again.
    }
  }

  const needsAcceptance =
    !loading &&
    !!user &&
    acceptedVersion !== null &&
    acceptedVersion !== LEGAL_VERSION;

  return { needsAcceptance, acceptTerms, loading };
}
