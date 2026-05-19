import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ALL_ALBUMS, SONGS } from '../data/albums';
import { validateBio } from '../utils/profanity';

// Manages the *owner-side* of the public profile feature.
// Reads and writes the profile doc at `profiles/{uid}` so a user can:
//   - flip their profile ON (visibility 'unlisted' — anyone with the link)
//     or OFF (only the owner can read)
//   - set a short bio
//   - have their album AND song rankings auto-mirrored to the public doc
//     whenever their ratings change
//
// Strangers reading the profile go through ProfileView.jsx, which fetches
// the same doc directly without using this hook.

const VISIBILITY_OFF = 'off';
const VISIBILITY_UNLISTED = 'unlisted';

// Debounce album-ranking mirror writes — QuickScore can fire many rating
// changes back-to-back; we don't want a Firestore write for each one.
const SYNC_DEBOUNCE_MS = 1500;

function emptyProfile() {
  return {
    visibility: VISIBILITY_OFF,
    bio: '',
    albumRankings: [],
    songRankings: [],
    displayName: '',
    photoURL: '',
    signedUpAt: null,
  };
}

export function useProfile(user, getAlbumScore, getScoreBreakdown, activeCategories) {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Latest values for the sync effect to read without re-binding the timer
  const profileRef = useRef(profile);
  profileRef.current = profile;

  // Hydrate from Firestore on sign-in
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setProfile(emptyProfile());
      setLoading(false);
      return;
    }
    setLoading(true);
    getDoc(doc(db, 'profiles', user.uid))
      .then(snap => {
        if (cancelled) return;
        if (snap.exists()) {
          setProfile({ ...emptyProfile(), ...snap.data() });
        } else {
          // Doc doesn't exist yet — leave it that way until the user opts in.
          setProfile(emptyProfile());
        }
        setLoading(false);
      })
      .catch(e => {
        if (cancelled) return;
        // A permission-denied read on the user's own doc usually means the
        // doc simply doesn't exist yet AND the rules treat absence as denied.
        // Treat it the same as "doc not found" so the UI doesn't show an
        // error on first load — the user can still flip the toggle on.
        if (e?.code === 'permission-denied') {
          setProfile(emptyProfile());
        } else {
          console.error('useProfile hydrate failed', e);
          setError(e.message || 'Failed to load profile');
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  // Derive the public album rankings from the user's current ratings.
  // Only albums with a score show up — same logic as the Rankings tab.
  const buildAlbumRankings = useCallback(() => {
    if (!getAlbumScore || !activeCategories) return [];
    return ALL_ALBUMS
      .map(a => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        year: a.year,
        color: a.color,
        score: getAlbumScore(a.id, activeCategories),
      }))
      .filter(a => a.score !== null)
      .sort((a, b) => b.score - a.score);
  }, [getAlbumScore, activeCategories]);

  // Derive the public song rankings — every rated song across all albums,
  // sorted high to low. Same logic the Rankings tab uses for its Songs view.
  // The public view shows the top 25 first with a "load more"; the full
  // list is mirrored so that progressive reveal has everything it needs.
  const buildSongRankings = useCallback(() => {
    if (!getScoreBreakdown || !activeCategories) return [];
    const all = [];
    for (const album of ALL_ALBUMS) {
      const songs = SONGS[album.id] || [];
      for (let i = 0; i < songs.length; i++) {
        const b = getScoreBreakdown(album.id, i, activeCategories);
        if (b) {
          all.push({
            name: songs[i],
            albumName: album.name,
            albumIcon: album.icon,
            score: b.score,
            // Per-category breakdown so the public profile can show users
            // exactly how the score was built (tap a song to expand).
            categories: b.rows,
          });
        }
      }
    }
    return all.sort((a, b) => b.score - a.score);
  }, [getScoreBreakdown, activeCategories]);

  // Persist a doc update both in local state and to Firestore.
  const writeProfile = useCallback(async (patch) => {
    if (!user) return;
    const next = { ...profileRef.current, ...patch };
    setProfile(next);
    try {
      await setDoc(
        doc(db, 'profiles', user.uid),
        {
          ...next,
          ownerUid: user.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('useProfile write failed', e);
      setError(e.message || 'Failed to save profile');
    }
  }, [user]);

  // Auto-mirror album + song rankings whenever they change AND the profile
  // is on. Debounced so a rapid rating session doesn't fire one write per
  // change.
  useEffect(() => {
    if (!user) return;
    if (profile.visibility !== VISIBILITY_UNLISTED) return;

    const t = setTimeout(() => {
      const freshAlbums = buildAlbumRankings();
      const freshSongs = buildSongRankings();
      // Cheap deep-equal on the small arrays — skip the write if unchanged.
      const albumsSame = JSON.stringify(freshAlbums) === JSON.stringify(profileRef.current.albumRankings);
      const songsSame = JSON.stringify(freshSongs) === JSON.stringify(profileRef.current.songRankings);
      if (albumsSame && songsSame) return;
      writeProfile({ albumRankings: freshAlbums, songRankings: freshSongs });
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile.visibility, buildAlbumRankings, buildSongRankings, writeProfile]);

  // ── Public API ───────────────────────────────────────────────────────────

  // Toggle the profile on or off. Turning it on creates / refreshes the doc
  // with the latest snapshot so the public view isn't blank on first share.
  const setVisibility = useCallback(async (next) => {
    if (!user) return;
    if (next === VISIBILITY_UNLISTED) {
      const albumRankings = buildAlbumRankings();
      const songRankings = buildSongRankings();
      await writeProfile({
        visibility: VISIBILITY_UNLISTED,
        albumRankings,
        songRankings,
        displayName: user.displayName ?? '',
        photoURL: user.photoURL ?? '',
      });
    } else {
      await writeProfile({ visibility: VISIBILITY_OFF });
    }
  }, [user, buildAlbumRankings, writeProfile]);

  // Save the bio, running it through the profanity / URL filter first.
  // Returns { ok, reason? } so callers can show a helpful error inline.
  const setBio = useCallback(async (rawBio) => {
    const result = validateBio(rawBio);
    if (!result.ok) return result;
    await writeProfile({ bio: result.cleaned });
    return { ok: true };
  }, [writeProfile]);

  // The shareable URL — uid-based for v1; vanity handles come later.
  const profileUrl = user
    ? `${window.location.origin}/u/${user.uid}`
    : null;

  return {
    profile,
    loading,
    error,
    isOn: profile.visibility === VISIBILITY_UNLISTED,
    setVisibility,
    setBio,
    profileUrl,
  };
}
