// Lightweight profanity + URL filter for user-supplied text (currently only
// the public-profile bio). Not a full content-moderation system — designed to
// catch common slurs and low-effort spam, not adversarial bad actors.
//
// On a real rejection we return { ok: false, reason } so the caller can show
// the user why the save was blocked.

// Small starter list. Conservative — easy to expand.
const BAD_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'cock', 'whore', 'slut', 'fag', 'faggot', 'nigger', 'nigga', 'retard',
  'kike', 'spic', 'chink', 'tranny', 'rape', 'rapist',
];

// Catches http/https, www., bare-domain.tld, and obvious obfuscation
// (dot/space/(dot)). Anything URL-shaped is rejected.
const URL_PATTERNS = [
  /https?:\/\//i,
  /\bwww\./i,
  /\b[\w-]+\.[a-z]{2,}\b/i,
  /\b\w+\s*(?:\.|\(dot\)|\[dot\])\s*\w+/i,
];

export const BIO_MAX_LENGTH = 140;

export function validateBio(raw) {
  const text = (raw ?? '').trim();
  if (!text) return { ok: true, cleaned: '' };

  if (text.length > BIO_MAX_LENGTH) {
    return { ok: false, reason: `Bio is too long (max ${BIO_MAX_LENGTH} characters).` };
  }

  if (URL_PATTERNS.some(re => re.test(text))) {
    return { ok: false, reason: 'Links aren’t allowed in your bio.' };
  }

  // Lowercase + strip punctuation so "f.u.c.k" still trips the filter
  const normalized = text.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ');
  for (const word of BAD_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, 'i');
    if (re.test(normalized)) {
      return { ok: false, reason: 'That bio contains a word we don’t allow.' };
    }
  }

  return { ok: true, cleaned: text };
}
