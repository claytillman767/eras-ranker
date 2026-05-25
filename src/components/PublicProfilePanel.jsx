import { useState, useEffect } from 'react';
import { BIO_MAX_LENGTH } from '../utils/profanity';

// The public-profile control: turn the anyone-with-link profile on/off,
// copy the shareable link, edit the bio. Rendered in BOTH the Rankings tab
// and Settings so the sharing path is visible where users look at results
// AND where they manage their account.
//
// All instances read/write the one useProfile hook (created in App.jsx and
// passed down), so toggling here updates everywhere automatically.
//
// Signed-out users see a sign-in prompt instead — a public profile must be
// tied to an account. This is an intentional sign-in nudge: wanting to
// share is a strong reason to create an account.
export default function PublicProfilePanel({ profile, user, signIn }) {
  const { isOn, profile: data, setVisibility, setBio, profileUrl, loading } = profile;
  const [bioDraft, setBioDraft] = useState(data.bio ?? '');
  const [bioError, setBioError] = useState(null);
  const [bioSavedTick, setBioSavedTick] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keep the textarea in sync if the cloud doc updates externally
  // (e.g. on sign-in, or after toggling from the other surface).
  useEffect(() => { setBioDraft(data.bio ?? ''); }, [data.bio]);

  async function handleToggle() {
    await setVisibility(isOn ? 'off' : 'unlisted');
  }

  async function handleSaveBio() {
    setBioError(null);
    const result = await setBio(bioDraft);
    if (!result.ok) {
      setBioError(result.reason);
      return;
    }
    setBioSavedTick(true);
    setTimeout(() => setBioSavedTick(false), 1500);
  }

  async function handleCopyLink() {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const el = document.getElementById('eras-profile-url');
      if (el) { el.focus(); el.select(); }
    }
  }

  const tooLong = bioDraft.length > BIO_MAX_LENGTH;

  // ── Signed out — sign-in nudge ───────────────────────────────────────────
  if (!user) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, var(--accent-grad-a), var(--accent-soft))',
        border: '0.5px solid var(--accent-soft-2)',
        borderRadius: 12,
        padding: '18px 16px',
        marginBottom: 24,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Share your rankings
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 300, margin: '0 auto 14px' }}>
          Create a public page of your album and song rankings that anyone
          can view with a link. Sign in to set it up.
        </div>
        <button
          onClick={signIn}
          style={{
            padding: '10px 22px',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
            border: 'none',
            borderRadius: 12,
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
          }}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // ── Signed in — full control ─────────────────────────────────────────────
  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      {/* Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderBottom: isOn ? '0.5px solid var(--hairline)' : 'none',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
            Public profile — anyone with the link can view
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
            Shows your album and song rankings and an optional bio. We won't
            list your profile anywhere — only people you share the link with
            will see it.
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          aria-pressed={isOn}
          aria-label={isOn ? 'Turn profile off' : 'Turn profile on'}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            border: 'none',
            background: isOn ? 'var(--brand)' : 'var(--control-off)',
            position: 'relative',
            cursor: loading ? 'default' : 'pointer',
            transition: 'background 0.15s ease',
            flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute',
            top: 2,
            left: isOn ? 20 : 2,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--surface)',
            transition: 'left 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* Share link + bio editor — only when profile is on */}
      {isOn && (
        <div style={{ padding: '14px 16px' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-2)',
            marginBottom: 6,
            letterSpacing: '0.04em',
          }}>
            SHAREABLE LINK
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <input
              id="eras-profile-url"
              type="text"
              value={profileUrl ?? ''}
              readOnly
              onFocus={e => e.target.select()}
              style={{
                flex: 1,
                padding: '9px 11px',
                fontSize: 12,
                fontFamily: 'monospace',
                border: '0.5px solid var(--border)',
                borderRadius: 8,
                background: 'var(--surface-2)',
                color: 'var(--text-strong)',
                minWidth: 0,
              }}
            />
            <button
              onClick={handleCopyLink}
              style={{
                padding: '9px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#ffffff',
                background: copied ? '#16a34a' : 'var(--brand)',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                flexShrink: 0,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-2)',
            marginBottom: 6,
            letterSpacing: '0.04em',
          }}>
            BIO (OPTIONAL)
          </div>
          <textarea
            value={bioDraft}
            onChange={e => { setBioDraft(e.target.value); setBioError(null); }}
            placeholder="A line about your taste — no links."
            rows={2}
            style={{
              width: '100%',
              padding: '9px 11px',
              fontSize: 13,
              fontFamily: 'inherit',
              border: `0.5px solid ${tooLong ? 'var(--danger-border)' : 'var(--border)'}`,
              borderRadius: 8,
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none',
              color: 'var(--text)',
            }}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
            marginBottom: 10,
            fontSize: 11,
            color: tooLong ? 'var(--danger-text)' : 'var(--text-3)',
          }}>
            <span>{bioError ?? ' '}</span>
            <span>{bioDraft.length} / {BIO_MAX_LENGTH}</span>
          </div>

          <button
            onClick={handleSaveBio}
            disabled={tooLong || bioDraft === (data.bio ?? '')}
            style={{
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              color: '#ffffff',
              background: (tooLong || bioDraft === (data.bio ?? '')) ? 'var(--control-off)' : 'var(--brand)',
              border: 'none',
              borderRadius: 8,
              cursor: (tooLong || bioDraft === (data.bio ?? '')) ? 'default' : 'pointer',
            }}
          >
            {bioSavedTick ? 'Saved ✓' : 'Save bio'}
          </button>
        </div>
      )}
    </div>
  );
}
