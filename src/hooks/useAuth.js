import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// Tracks the currently signed-in Google account.
// Uses redirect-based sign-in (not popup) for reliability across all browsers
// and devices — especially Chrome with strict cookie settings and Safari.
//
// Returns:
//   user        — Firebase user object (null if not signed in)
//   authLoading — true while Firebase is figuring out the initial auth state
//   signIn      — redirects the user to Google sign-in, then back to the app
//   signOut     — signs the user out
export function useAuth() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    // If we just came back from a Google redirect, Firebase will surface the
    // result here. onAuthStateChanged will fire with the new user automatically,
    // so we just need to catch any errors.
    getRedirectResult(auth).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn  = () => auth && signInWithRedirect(auth, googleProvider);
  const signOut = () => auth && firebaseSignOut(auth);

  return { user, authLoading, signIn, signOut };
}
