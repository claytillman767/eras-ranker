// Lemon Squeezy webhook receiver.
//
// LS calls POST https://erasranker.com/api/lemon-webhook for every
// subscription lifecycle event (created, updated, cancelled, expired,
// payment failed, etc.). This endpoint is the ONLY trusted source of
// "did the user pay?" — never trust a click in the browser, always wait
// for the webhook to write `isPro: true` to Firestore.
//
// Flow:
//   1. Read the raw request body (NOT pre-parsed) for HMAC verification.
//   2. Verify X-Signature against LEMON_SQUEEZY_WEBHOOK_SECRET.
//   3. Parse the JSON, find the user's Firebase uid in custom_data.uid.
//   4. Update users/{uid} in Firestore based on event_name.
//
// Always returns 200 OK so LS doesn't retry. Errors are logged to Vercel
// logs and surfaced via the planned daily developer health-check email
// (see CLAUDE.md → Notification System → Daily developer health-check).
import { getAdminDb } from '../lib/firebase-admin.js';
import { verifyWebhookSignature, readRawBody } from '../lib/lemon-squeezy.js';
import { FieldValue } from 'firebase-admin/firestore';

// Disable Vercel's built-in JSON body parser so we can read the raw bytes
// for HMAC verification. Re-stringifying parsed JSON breaks the signature.
export const config = {
  api: { bodyParser: false },
};

// Events that should grant Pro access.
const ENABLE_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_resumed',
  'subscription_unpaused',
  'subscription_payment_success',
  'subscription_payment_recovered',
]);

// Events that should revoke Pro access immediately.
// Note: 'subscription_cancelled' itself does NOT revoke — LS keeps the
// subscription active until period end and sends 'subscription_expired'
// when access truly stops. We honour that here.
const DISABLE_EVENTS = new Set([
  'subscription_expired',
  'subscription_paused',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1) Read raw body for signature verification.
  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (e) {
    console.error('lemon-webhook: failed to read body', e);
    return res.status(400).json({ error: 'Invalid body' });
  }

  // 2) Verify signature. LS sends `X-Signature` (lowercased on Node).
  const signature = req.headers['x-signature'];
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    console.warn('lemon-webhook: bad signature, rejecting');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 3) Parse the verified payload.
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    console.error('lemon-webhook: invalid JSON after signature passed', e);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventName = payload?.meta?.event_name;
  const uid = payload?.meta?.custom_data?.uid;
  const subscription = payload?.data?.attributes;
  const subscriptionId = payload?.data?.id;

  if (!eventName) {
    console.error('lemon-webhook: missing event_name', payload?.meta);
    return res.status(200).json({ ok: true, ignored: 'no_event' });
  }

  if (!uid) {
    // Not all events carry a uid (e.g. orders without a user). Acknowledge
    // and move on — only subscription events with custom_data matter to us.
    console.warn(`lemon-webhook: ${eventName} without uid, ignoring`);
    return res.status(200).json({ ok: true, ignored: 'no_uid' });
  }

  // 4) Decide what to write based on the event.
  const db = getAdminDb();
  const userRef = db.collection('users').doc(uid);

  try {
    if (eventName === 'order_created') {
      // One-time $3.99 unlock. LS fires `order_created` for non-subscription
      // products. There is no renewal or cancellation — grant Pro for good.
      // data.id is the ORDER id here (not a subscription id).
      await userRef.set(
        {
          isPro: true,
          proSource: 'lemonsqueezy',
          orderId: subscriptionId ?? null,
          proUpdatedAt: FieldValue.serverTimestamp(),
          proLastEvent: eventName,
        },
        { merge: true }
      );
    } else if (eventName === 'order_refunded') {
      // Refunded one-time unlock — revoke access.
      await userRef.set(
        {
          isPro: false,
          proUpdatedAt: FieldValue.serverTimestamp(),
          proLastEvent: eventName,
        },
        { merge: true }
      );
    } else if (ENABLE_EVENTS.has(eventName)) {
      await userRef.set(
        {
          isPro: true,
          // Marks this Pro grant as originating from a real Lemon Squeezy
          // subscription. Anything written by hand in the Firebase console
          // (e.g. a beta tester comp) leaves this field unset, so the
          // operator can distinguish "real paying customer — DO NOT REVOKE"
          // from "manual comp — safe to revoke" at a glance.
          proSource: 'lemonsqueezy',
          subscriptionId: subscriptionId ?? null,
          subscriptionStatus: subscription?.status ?? null,
          customerId: subscription?.customer_id ?? null,
          customerPortalUrl: subscription?.urls?.customer_portal ?? null,
          updatePaymentMethodUrl: subscription?.urls?.update_payment_method ?? null,
          currentPeriodEnd: subscription?.renews_at ?? null,
          proUpdatedAt: FieldValue.serverTimestamp(),
          proLastEvent: eventName,
        },
        { merge: true }
      );
    } else if (DISABLE_EVENTS.has(eventName)) {
      await userRef.set(
        {
          isPro: false,
          subscriptionStatus: subscription?.status ?? eventName,
          proUpdatedAt: FieldValue.serverTimestamp(),
          proLastEvent: eventName,
        },
        { merge: true }
      );
    } else if (eventName === 'subscription_cancelled') {
      // User cancelled but still has access until period end.
      // Record the intent so the UI can show "Cancels on {date}" copy.
      await userRef.set(
        {
          subscriptionStatus: 'cancelled',
          subscriptionCancelledAt: FieldValue.serverTimestamp(),
          subscriptionEndsAt: subscription?.ends_at ?? null,
          proUpdatedAt: FieldValue.serverTimestamp(),
          proLastEvent: eventName,
        },
        { merge: true }
      );
    } else if (eventName === 'subscription_payment_failed') {
      // First failed payment — LS will retry several times before expiring.
      // Don't revoke yet; just record the state for visibility.
      await userRef.set(
        {
          subscriptionStatus: 'past_due',
          paymentFailedAt: FieldValue.serverTimestamp(),
          proUpdatedAt: FieldValue.serverTimestamp(),
          proLastEvent: eventName,
        },
        { merge: true }
      );
    } else {
      // Unknown / new event LS added since this code shipped — log it but
      // don't fail. Webhooks should be forward-compatible.
      console.warn(`lemon-webhook: unhandled event_name=${eventName}`);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    // Firestore write failed. Log loudly so the daily health check picks
    // it up. Still return 200 — LS retries can hammer the endpoint, and a
    // failed write usually means a transient Firestore issue we can't fix
    // by retrying instantly. The daily health check catches the drift.
    console.error('lemon-webhook: Firestore write failed', {
      eventName,
      uid,
      error: e?.message,
    });
    return res.status(200).json({ ok: false, error: 'firestore_write_failed' });
  }
}
