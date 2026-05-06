// Server-side Firebase Admin SDK init.
//
// This is NOT the same as src/firebase.js — that one is the *client* SDK,
// scoped to the user's auth credentials. The Admin SDK runs inside Vercel
// serverless functions and bypasses Firestore security rules entirely,
// which is what we want for webhook handlers (the LS webhook isn't an
// authenticated user — it's a server-to-server call from Lemon Squeezy
// that we authenticate via HMAC signature, then trust to write to any user's doc).
//
// Initialization happens once per cold start and is reused across requests.
// Do not call initializeApp on every invocation — it'll throw "already exists."
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let cachedApp = null;

function getApp() {
  if (cachedApp) return cachedApp;

  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_B64 env var is not set. ' +
      'Generate a service account JSON in Firebase Console → Project Settings → ' +
      'Service Accounts, then base64-encode it and add to Vercel env vars.'
    );
  }

  let credentials;
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    credentials = JSON.parse(json);
  } catch (e) {
    throw new Error(`Failed to decode FIREBASE_SERVICE_ACCOUNT_B64: ${e.message}`);
  }

  cachedApp = initializeApp({ credential: cert(credentials) });
  return cachedApp;
}

export function getAdminDb() {
  return getFirestore(getApp());
}

export function getAdminAuth() {
  return getAuth(getApp());
}
