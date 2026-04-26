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
    // Firebase calls this once immediately with the current user (or null),
    // then again any time the user signs in or out.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe; // clean up listener when component unmounts
  }, []);

  const signIn  = () => signInWithPopup(auth, googleProvider);
  const signOut = () => firebaseSignOut(auth);

  return { user, authLoading, signIn, signOut };
}
