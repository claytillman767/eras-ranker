import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// If the API key is missing (e.g. env vars not set on this deployment),
// skip Firebase entirely so the rest of the app still loads.
const firebaseReady = !!firebaseConfig.apiKey;

const app = firebaseReady ? initializeApp(firebaseConfig) : null;

export const auth           = firebaseReady ? getAuth(app)      : null;
export const db             = firebaseReady ? getFirestore(app) : null;
export const googleProvider = firebaseReady ? new GoogleAuthProvider() : null;
