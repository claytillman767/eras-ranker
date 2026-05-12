// Cancel-subscription endpoint, called by the client during account deletion.
//
// The DeleteAccountModal calls this BEFORE wiping Firestore data so the user
// isn't billed again after their account is gone. LS bills the LS customer
// record, not the Firebase user — those are tied together via subscriptionId
// stored on users/{uid} by the webhook.
//
// Authorization: the client sends a Firebase ID token in the Authorization
// header. We verify the token via the Admin SDK, look up the user's
// subscriptionId from Firestore, then CROSS-CHECK ownership against Lemon
// Squeezy itself by fetching the subscription and verifying its `user_email`
// matches the verified token's email. The cross-check is defense-in-depth on
// top of the Firestore rules — even if the rule layer ever allowed the
// client to overwrite subscriptionId, this endpoint would refuse to cancel
// a subscription that doesn't belong to the caller.
//
// Idempotent: if the user has no Pro subscription, returns 200 OK with
// `{ skipped: true }` so the caller doesn't have to special-case it.
import { getAdminDb, getAdminAuth } from '../lib/firebase-admin.js';
import { getSubscription, cancelSubscription } from '../lib/lemon-squeezy.js';

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
  let verifiedEmail;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
    verifiedEmail = (decoded.email || '').toLowerCase();
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

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) {
    console.error('cancel-subscription: LEMON_SQUEEZY_API_KEY not set');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // 4) Verify the LS subscription actually belongs to this Firebase user.
  // The Firestore rule layer already blocks the client from writing
  // subscriptionId — this is a second line of defense against IDOR.
  try {
    const sub = await getSubscription(subscriptionId, apiKey);
    const subEmail = String(sub?.data?.attributes?.user_email || '').toLowerCase();
    if (!subEmail || !verifiedEmail || subEmail !== verifiedEmail) {
      console.warn('cancel-subscription: ownership mismatch', {
        uid,
        subscriptionId,
        // Only the first character of each email is logged so the audit
        // trail is useful without dumping full PII to Vercel logs.
        verifiedInitial: verifiedEmail ? verifiedEmail[0] : null,
        subEmailInitial: subEmail ? subEmail[0] : null,
      });
      return res.status(403).json({ error: 'Subscription does not belong to this user' });
    }
  } catch (e) {
    const message = e?.message || '';
    if (message.includes('404')) {
      // Subscription no longer exists on the LS side — treat as already gone.
      return res.status(200).json({ ok: true, skipped: true, reason: 'subscription_not_found' });
    }
    console.error('cancel-subscription: ownership check failed', { uid, subscriptionId, error: message });
    return res.status(502).json({ error: 'Lemon Squeezy verify failed' });
  }

  // 5) Tell LS to cancel. Cancel-at-period-end is the LS default; the user
  //    keeps Pro access until the current period expires, then it lapses.
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
