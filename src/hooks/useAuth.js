import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// Tracks the currently signed-in Google account.
// Returns:
//   user        — Firebase user object (null if not signed in)
//   authLoading — true while Firebase is figuring out the initial auth state
//   signIn      — opens the Google sign-in popup
//   signOut     — signs the user out
export function useAuth() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn  = () => auth && signInWithPopup(auth, googleProvider);
  const signOut = () => auth && firebaseSignOut(auth);

  return { user, authLoading, signIn, signOut };
}
