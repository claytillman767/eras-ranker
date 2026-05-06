// Cancel-subscription endpoint, called by the client during account deletion.
//
// The DeleteAccountModal calls this BEFORE wiping Firestore data so the user
// isn't billed again after their account is gone. LS bills the LS customer
// record, not the Firebase user — those are tied together via subscriptionId
// stored on users/{uid} by the webhook.
//
// Authorization: the client sends a Firebase ID token in the Authorization
// header. We verify the token via the Admin SDK, look up the user's
// subscriptionId, and tell LS to cancel. The user can ONLY cancel their
// own subscription this way — the uid in the verified token is what we
// look up, never anything from the request body.
//
// Idempotent: if the user has no Pro subscription, returns 200 OK with
// `{ skipped: true }` so the caller doesn't have to special-case it.
import { getAdminDb, getAdminAuth } from '../lib/firebase-admin.js';
import { cancelSubscription } from '../lib/lemon-squeezy.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1) Pull the Firebase ID token out of Authorization: Bearer <token>.
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }
  const idToken = match[1];

  // 2) Verify the token. Admin SDK throws if the token is bad/expired.
  let uid;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (e) {
    console.warn('cancel-subscription: token verify failed', e?.message);
    return res.status(401).json({ error: 'Invalid token' });
  }

  // 3) Look up the subscription ID stored by the webhook.
  const db = getAdminDb();
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    // No user doc — nothing to cancel. Treat as success so deletion proceeds.
    return res.status(200).json({ ok: true, skipped: true, reason: 'no_user_doc' });
  }
  const user = userSnap.data() || {};
  const subscriptionId = user.subscriptionId;
  if (!subscriptionId) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'no_subscription' });
  }

  // 4) Tell LS to cancel. Cancel-at-period-end is the LS default; the user
  //    keeps Pro access until the current period expires, then it lapses.
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) {
    console.error('cancel-subscription: LEMON_SQUEEZY_API_KEY not set');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    await cancelSubscription(subscriptionId, apiKey);
  } catch (e) {
    // LS API failed. Two scenarios worth distinguishing:
    //   - 404: the subscription was already cancelled or never existed.
    //          Treat as success — nothing to do.
    //   - everything else: surface the error so the modal can warn the user.
    const message = e?.message || '';
    if (message.includes('404')) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'already_cancelled' });
    }
    console.error('cancel-subscription: LS API call failed', { uid, subscriptionId, error: message });
    return res.status(502).json({ error: 'Lemon Squeezy cancel failed' });
  }

  return res.status(200).json({ ok: true, cancelled: true });
}
