import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
  useCurrentFeedbackScreen,
  useFeedbackControls,
} from '../context/FeedbackScreen';
import { resolveScreen } from '../data/screenRegistry';
import { isAdminUid } from '../uat';

// Feedback system, in two pieces:
//   • <FeedbackLauncher>  — a small chat-bubble icon that opens the modal.
//     Lives in the app header on the main tabs, and inside each full-screen
//     overlay's own top bar (so it never floats over other controls). Two
//     visual variants: 'header' (light chrome) and 'overlay' (dark arena).
//   • <FeedbackModal>     — the actual modal, rendered ONCE at the app root.
//     Opened/closed via the FeedbackScreen context so any launcher can drive it.
//
// Each submission is stamped with WHERE the user was: a screen key, a human
// label, a live detail string, and the source FILE(S) behind that screen
// (src/data/screenRegistry.js). That makes a note dropped from anywhere in the
// app self-describing — paste it to Claude Code and it already knows which file
// to open. The current screen comes from the FeedbackScreen context (deep
// overlays self-report) and falls back to the base key App.jsx passes for the
// top-level tab.

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const MAX_LEN = 1500;

// Local mirror of every submission made ON THIS DEVICE, so the dev export
// can rebuild a ready-to-paste list without needing Firestore reads
// (feedback is write-only by security rule).
const LOG_KEY = 'eras_feedback_log';
const LOG_CAP = 100;

function appendLocalLog(entry) {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    while (arr.length > LOG_CAP) arr.shift();
    localStorage.setItem(LOG_KEY, JSON.stringify(arr));
  } catch { /* localStorage unavailable — skip the mirror */ }
}

function readLocalLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

// Build a single ready-to-paste block for Claude Code from the local log.
function buildExportText() {
  const arr = readLocalLog();
  if (!arr.length) return '';
  const blocks = arr.map(e => {
    const head = e.screenDetail ? `${e.screenLabel} — ${e.screenDetail}` : e.screenLabel;
    const files = (e.sourceFiles && e.sourceFiles.length)
      ? e.sourceFiles.join(', ')
      : '(none mapped)';
    return [
      `### Feedback — ${head}`,
      `Screen key: ${e.screenKey}`,
      `Files: ${files}`,
      `When: ${e.createdAtLocal}   App: ${e.appVersion}   URL: ${e.url}`,
      '',
      e.message,
    ].join('\n');
  });
  return blocks.join('\n\n---\n\n');
}

const ChatBubbleIcon = ({ stroke, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// ── Launcher icon ────────────────────────────────────────────────────────────
// variant: 'header'  → light chrome, matches the header avatar / Sign-in pills
//          'overlay' → dark arena chrome, matches the × / round-pill buttons
//                      in the immersive overlays
export function FeedbackLauncher({ variant = 'header' }) {
  const { openFeedback } = useFeedbackControls();
  const isOverlay = variant === 'overlay';

  const base = {
    appearance: 'none',
    width: isOverlay ? 36 : 32,
    height: isOverlay ? 36 : 32,
    borderRadius: isOverlay ? 18 : 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'opacity 0.15s ease, transform 0.15s ease',
  };
  const skin = isOverlay
    ? { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }
    : { background: 'var(--surface)', border: '1px solid var(--border)' };

  return (
    <button
      onClick={openFeedback}
      aria-label="Send feedback"
      title="Send feedback"
      style={{ ...base, ...skin }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      <ChatBubbleIcon stroke={isOverlay ? 'rgba(255,255,255,0.85)' : 'var(--brand-2)'} size={isOverlay ? 18 : 16} />
    </button>
  );
}

// ── Shared modal ─────────────────────────────────────────────────────────────
// Rendered once at the app root. Opens when any launcher calls openFeedback().
export function FeedbackModal({ user, baseScreenKey, baseDetail }) {
  const { open, closeFeedback } = useFeedbackControls();
  const [text, setText]     = useState('');
  const [state, setState]   = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [copied, setCopied] = useState(false);

  // Resolve the current location: a deep overlay's self-report wins, else the
  // base key App passes for the active tab.
  const ctx = useCurrentFeedbackScreen();
  const screenKey    = ctx?.key ?? baseScreenKey ?? 'unknown';
  const screenDetail = ctx?.detail ?? baseDetail ?? null;
  const { label: screenLabel, files: sourceFiles } = resolveScreen(screenKey);
  const isDev = isAdminUid(user?.uid);

  // Signed-in only — feedback is tied to a real account so we can follow
  // up if needed. Nothing renders for anonymous users.
  if (!user || !open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const message = text.trim();
    if (!message || !db || state === 'sending') return;
    setState('sending');

    const payload = {
      message:     message.slice(0, MAX_LEN),
      screen:      screenLabel,   // legacy field name kept for back-compat
      screenKey,
      screenLabel,
      screenDetail,
      sourceFiles,
      uid:         user.uid,
      email:       user.email       ?? null,
      displayName: user.displayName ?? null,
      userAgent:   typeof navigator !== 'undefined' ? navigator.userAgent : '',
      appVersion:  APP_VERSION,
      url:         typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '',
    };

    // Mirror locally first so the dev export keeps the note even if the
    // Firestore write fails (offline, rules, etc.).
    appendLocalLog({ ...payload, createdAtLocal: new Date().toISOString() });

    try {
      await addDoc(collection(db, 'feedback'), { ...payload, createdAt: serverTimestamp() });
      setState('sent');
      setText('');
      setTimeout(() => {
        closeFeedback();
        setState('idle');
      }, 1500);
    } catch (err) {
      console.warn('Feedback save failed:', err);
      setState('error');
    }
  }

  async function handleExport() {
    const out = buildExportText();
    if (!out) { setCopied(false); return; }
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — fall back to a prompt the user can copy from.
      try { window.prompt('Copy your feedback log for Claude Code:', out); } catch { /* noop */ }
    }
  }

  function close() {
    if (state === 'sending') return;
    closeFeedback();
    setState('idle');
  }

  const sentFrom = screenLabel
    ? `Sent from: ${screenLabel}${screenDetail ? ` — ${screenDetail}` : ''}`
    : '';
  const logCount = isDev ? readLocalLog().length : 0;

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 10000,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          boxSizing: 'border-box',
        }}
      >
        {state === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💌</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
              Thanks for the feedback!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              It'll help shape the app.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
              Send feedback
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
              Bug, idea, anything — I read every one.
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_LEN))}
              placeholder="What's on your mind?"
              autoFocus
              rows={5}
              disabled={state === 'sending'}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--control-off)',
                borderRadius: 10,
                fontSize: 14,
                color: 'var(--text)',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: 100,
              }}
            />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 6,
              fontSize: 11,
              color: 'var(--text-3)',
            }}>
              <span>{sentFrom}</span>
              <span>{text.length}/{MAX_LEN}</span>
            </div>

            {state === 'error' && (
              <div style={{ fontSize: 12, color: 'var(--danger-text)', marginTop: 8 }}>
                Couldn't send. Check your connection and try again.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={close}
                disabled={state === 'sending'}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: 'none',
                  border: '1px solid var(--control-off)',
                  borderRadius: 10,
                  fontSize: 14,
                  color: 'var(--text-2)',
                  fontWeight: 500,
                  cursor: state === 'sending' ? 'default' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!text.trim() || state === 'sending'}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: !text.trim() || state === 'sending'
                    ? '#c4b5fd'
                    : 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: !text.trim() || state === 'sending' ? 'default' : 'pointer',
                  boxShadow: !text.trim() || state === 'sending'
                    ? 'none'
                    : '0 4px 12px rgba(168,85,247,0.3)',
                }}
              >
                {state === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </div>

            {/* Developer-only: copy every note logged on this device as one
                ready-to-paste block for Claude Code. Gated by admin uid. */}
            {isDev && (
              <button
                type="button"
                onClick={handleExport}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 12,
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: logCount ? 'pointer' : 'default',
                  textAlign: 'center',
                }}
              >
                {copied
                  ? '✓ Copied — paste into Claude Code'
                  : `Dev · copy ${logCount} note${logCount === 1 ? '' : 's'} for Claude Code`}
              </button>
            )}
          </>
        )}
      </form>
    </div>
  );
}
