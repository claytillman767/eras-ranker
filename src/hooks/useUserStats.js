import { useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ALBUMS, SONGS } from '../data/albums';
import { LEGAL_VERSION } from '../data/legalVersion';

// Per-user analytics fields written to users/{uid}:
//   lastActiveAt          — server timestamp, written each session start
//   sessionCount          — increments by 1 each session start
//   totalRatings          — count of unique songs with at least one category rated
//   albumsCompleted       — count of albums where every song has at least one category rated
//   signedUpAt            — server timestamp, written ONCE on first session ever
//   signedUpVia           — 'google' (password-bypass users have no Firebase user, so no field)
//   signupSource          — value of ?ref= URL param at first visit (if any)
//   referrer              — document.referrer at first visit (if any)
//   termsAcceptedVersion  — date string of the legal-text version the user
//                           accepted (written ONCE — on first session ever for
//                           a new user, or grandfathered in on the next
//                           session for users created before this feature
//                           shipped). UpdatedTermsModal owns subsequent writes.
//   termsAcceptedAt       — server timestamp paired with termsAcceptedVersion
//
// signupSource + referrer + signedUpAt are written only on the first session
// for this user (we read the existing doc and skip if signedUpAt is already
// set). termsAcceptedVersion follows the same "write if missing" rule.

const SOURCE_KEY   = 'eras_signup_source';
const REFERRER_KEY = 'eras_referrer';

export function useUserStats(user, ratings) {
  // ── Session start: lastActiveAt + sessionCount + (one-time) signup origin ──
  useEffect(() => {
    if (!user || !db) return;
    let cancelled = false;

    (async () => {
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (cancelled) return;

        const existing = snap.exists() ? snap.data() : {};

        const update = {
          lastActiveAt: serverTimestamp(),
          sessionCount: increment(1),
        };

        // Origin fields — only on the first session ever for this user.
        if (!existing.signedUpAt) {
          update.signedUpAt  = serverTimestamp();
          update.signedUpVia = 'google';
          const src      = localStorage.getItem(SOURCE_KEY);
          const referrer = localStorage.getItem(REFERRER_KEY) || document.referrer || '';
          if (src)      update.signupSource = src;
          if (referrer) update.referrer     = referrer;
        }

        // Legal acceptance — write the current version if the user has
        // never had a version stored. Two cases this covers:
        //   1. New user, first session ever — they accepted by signing in,
        //      so we record what they accepted.
        //   2. Existing user whose account predates this feature — they're
        //      grandfathered in here so UpdatedTermsModal does not fire
        //      for terms that haven't changed since they signed up.
        // We never overwrite an existing version — that's the modal's job
        // after a future LEGAL_VERSION bump.
        if (existing.termsAcceptedVersion === undefined) {
          update.termsAcceptedVersion = LEGAL_VERSION;
          update.termsAcceptedAt      = serverTimestamp();
        }

        await setDoc(ref, update, { merge: true });
      } catch {
        // Silent — analytics writes shouldn't break the app.
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // ── Engagement counters: totalRatings + albumsCompleted ───────────────────
  // Recomputed from `ratings`; writes only when the values actually change so
  // we don't spam Firestore on every star tap.
  const lastWrittenRef = useRef({ total: -1, albums: -1 });
  useEffect(() => {
    if (!user || !db || !ratings) return;

    const totalRatings = Object.keys(ratings).length;

    let albumsCompleted = 0;
    for (const album of ALBUMS) {
      const songs = SONGS[album.id] || [];
      if (songs.length === 0) continue;
      const allRated = songs.every((_, i) => {
        const r = ratings[`${album.id}_${i}`];
        return r && Object.keys(r).length > 0;
      });
      if (allRated) albumsCompleted++;
    }

    const last = lastWrittenRef.current;
    if (last.total === totalRatings && last.albums === albumsCompleted) return;
    lastWrittenRef.current = { total: totalRatings, albums: albumsCompleted };

    setDoc(
      doc(db, 'users', user.uid),
      { totalRatings, albumsCompleted },
      { merge: true }
    ).catch(() => {});
  }, [user, ratings]);
}
