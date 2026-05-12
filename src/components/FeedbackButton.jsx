import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Floating "send feedback" button + modal. Visible across the main app for
// any signed-in user. Submissions land in the `feedback` Firestore
// collection, which is write-only from the client — the developer reads
// them via the Firebase console.

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const MAX_LEN = 1500;

export default function FeedbackButton({ user, screen }) {
  const [open, setOpen]   = useState(false);
  const [text, setText]   = useState('');
  const [state, setState] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'

  // Signed-in only — feedback is tied to a real account so we can follow
  // up if needed. The button just hides for anonymous users.
  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const message = text.trim();
    if (!message || !db || state === 'sending') return;
    setState('sending');
    try {
      await addDoc(collection(db, 'feedback'), {
        message:     message.slice(0, MAX_LEN),
        screen:      screen ?? 'unknown',
        uid:         user.uid,
        email:       user.email       ?? null,
        displayName: user.displayName ?? null,
        userAgent:   typeof navigator !== 'undefined' ? navigator.userAgent : '',
        appVersion:  APP_VERSION,
        url:         typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '',
        createdAt: serverTimestamp(),
      });
      setState('sent');
      setText('');
      setTimeout(() => {
        setOpen(false);
        setState('idle');
      }, 1500);
    } catch (err) {
      console.warn('Feedback save failed:', err);
      setState('error');
    }
  }

  function close() {
    if (state === 'sending') return;
    setOpen(false);
    setState('idle');
  }

  return (
    <>
      {/* Floating launcher — small enough to live in the corner without
          dominating, always visible on top of app content. zIndex sits
          below QuickScore's celebration overlays (which fully take over
          the screen) but above every regular surface. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        title="Send feedback"
        style={{
          position: 'fixed',
          bottom: 18,
          right: 18,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          opacity: 0.85,
          zIndex: 9000,
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {/* Chat-bubble icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {open && (
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
              background: '#ffffff',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              boxSizing: 'border-box',
            }}
          >
            {state === 'sent' ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💌</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                  Thanks for the feedback!
                </div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  It'll help shape the app.
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                  Send feedback
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
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
                    border: '1px solid #d1d5db',
                    borderRadius: 10,
                    fontSize: 14,
                    color: '#111827',
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
                  color: '#9ca3af',
                }}>
                  <span>{screen ? `Sent from: ${screen}` : ''}</span>
                  <span>{text.length}/{MAX_LEN}</span>
                </div>

                {state === 'error' && (
                  <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>
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
                      border: '1px solid #d1d5db',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#4b5563',
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
                        : 'linear-gradient(135deg, #a855f7, #7c3aed)',
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
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
}
