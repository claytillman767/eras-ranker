// Lemon Squeezy server-side helpers.
//
// Two responsibilities:
//   1. verifyWebhookSignature — HMAC-SHA256 check on incoming webhook payloads
//      so we can trust that the event really came from Lemon Squeezy and not
//      an attacker spoofing requests at /api/lemon-webhook.
//   2. cancelSubscription — DELETE call to LS REST API, used by
//      /api/cancel-subscription when a user deletes their account while Pro.
//
// LS API docs: https://docs.lemonsqueezy.com/api
import crypto from 'node:crypto';

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';

// Verify the X-Signature header on an LS webhook against the raw request body.
// Uses constant-time comparison to prevent timing-based signature leaks.
//
// IMPORTANT: rawBody must be the EXACT bytes LS sent — pre-parsing JSON breaks
// the HMAC because re-stringified JSON has different whitespace. The webhook
// handler reads the raw stream before any JSON.parse for this reason.
export function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret || !rawBody) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const expected = hmac.update(rawBody).digest('hex');

  // Both strings must be the same length for timingSafeEqual.
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(signatureHeader, 'utf8');
  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

// Fetch a subscription resource from LS. Used by /api/cancel-subscription
// for an ownership cross-check before cancelling — the subscription's
// `user_email` must match the verified Firebase ID-token email, otherwise
// the request is rejected as a possible hijack attempt.
export async function getSubscription(subscriptionId, apiKey) {
  if (!subscriptionId) throw new Error('getSubscription: subscriptionId is required');
  if (!apiKey) throw new Error('getSubscription: LEMON_SQUEEZY_API_KEY is not set');

  const res = await fetch(`${LS_API_BASE}/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/vnd.api+json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Lemon Squeezy get failed (${res.status}): ${text}`);
  }

  return res.json();
}

// Cancel a subscription via the LS API. LS interprets a DELETE on a
// subscription resource as "cancel at period end" — the user retains
// access until the current billing period expires, then doesn't renew.
//
// For our delete-account flow we want this behaviour: the user already
// confirmed they're done, so they get to use Pro until period end as a
// small courtesy. (If we ever need "terminate immediately + refund," LS
// supports that via a separate `disable_billing` flag.)
export async function cancelSubscription(subscriptionId, apiKey) {
  if (!subscriptionId) throw new Error('cancelSubscription: subscriptionId is required');
  if (!apiKey) throw new Error('cancelSubscription: LEMON_SQUEEZY_API_KEY is not set');

  const res = await fetch(`${LS_API_BASE}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Lemon Squeezy cancel failed (${res.status}): ${text}`);
  }

  return res.json();
}

// Read the body of a Vercel/Node request as a raw UTF-8 string without
// triggering JSON parsing. Required for HMAC verification on webhooks.
export async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
