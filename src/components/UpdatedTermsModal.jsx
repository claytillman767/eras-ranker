import { useState } from 'react';
import {
  LEGAL_VERSION,
  LEGAL_VERSION_CHANGES_NOTE,
  formatLegalDate,
} from '../data/legalVersion';

// Shown when a signed-in user's stored `termsAcceptedVersion` doesn't
// match the current LEGAL_VERSION. Pre-empts the rest of the app —
// users must tap "I agree, continue" to dismiss it, which records the
// new version on their Firestore doc.
//
// On the initial 2026-05-12 rollout this modal does not appear for
// anyone — existing users are grandfathered in by useUserStats. The
// modal kicks in on future LEGAL_VERSION bumps.
//
// Props:
//   onAccept — async function that writes LEGAL_VERSION to Firestore
//              and resolves when the snapshot listener has updated.
//              We optimistically dismiss the modal locally for snappy
//              UX, but App.jsx will keep rendering us if the write
//              ever fails (the version mismatch will stay true).
export default function UpdatedTermsModal({ onAccept }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleAccept() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onAccept();
      // App.jsx unmounts us once the Firestore snapshot reflects the
      // new acceptedVersion; we don't need to manage local visibility.
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>📜</div>

        <h2 style={titleStyle}>We've updated our Terms</h2>

        <p style={subtitleStyle}>
          Before continuing, please review and agree to our updated{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineLinkStyle}
          >
            Terms of Service
          </a>
          {' '}and{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineLinkStyle}
          >
            Privacy Policy
          </a>
          .
        </p>

        {LEGAL_VERSION_CHANGES_NOTE && (
          <div style={changesNoteStyle}>
            <div style={changesNoteLabelStyle}>What changed</div>
            <div style={changesNoteBodyStyle}>
              {LEGAL_VERSION_CHANGES_NOTE}
            </div>
          </div>
        )}

        <div style={effectiveLineStyle}>
          New effective date: <strong>{formatLegalDate(LEGAL_VERSION)}</strong>
        </div>

        <button
          onClick={handleAccept}
          disabled={submitting}
          style={{
            ...primaryButtonStyle,
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'wait' : 'pointer',
          }}
        >
          {submitting ? 'Saving…' : 'I agree, continue'}
        </button>

        <div style={footerNoteStyle}>
          If you don't agree, you can{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineLinkStyle}
          >
            review the full Terms
          </a>
          {' '}or delete your account from Settings.
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'linear-gradient(180deg, #fdf4ff 0%, #ffffff 50%, #eff6ff 100%)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  overflowY: 'auto',
};

const cardStyle = {
  background: '#ffffff',
  border: '0.5px solid #e5e7eb',
  borderRadius: 16,
  boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
  padding: '28px 24px',
  maxWidth: 440,
  width: '100%',
  textAlign: 'center',
};

const iconStyle = {
  fontSize: 40,
  lineHeight: 1,
  marginBottom: 14,
};

const titleStyle = {
  margin: '0 0 8px',
  fontSize: 20,
  fontWeight: 700,
  color: '#111827',
  lineHeight: 1.3,
};

const subtitleStyle = {
  margin: '0 0 18px',
  fontSize: 14,
  color: '#374151',
  lineHeight: 1.6,
};

const inlineLinkStyle = {
  color: '#7c3aed',
  textDecoration: 'underline',
};

const changesNoteStyle = {
  background: '#faf5ff',
  border: '0.5px solid #e9d5ff',
  borderRadius: 10,
  padding: '12px 14px',
  marginBottom: 16,
  textAlign: 'left',
};

const changesNoteLabelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#7c3aed',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 4,
};

const changesNoteBodyStyle = {
  fontSize: 13,
  color: '#374151',
  lineHeight: 1.6,
};

const effectiveLineStyle = {
  fontSize: 12,
  color: '#6b7280',
  marginBottom: 18,
};

const primaryButtonStyle = {
  width: '100%',
  padding: '13px',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(180deg, #a855f7, #7c3aed)',
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 600,
  boxShadow: '0 4px 14px rgba(124,58,237,0.30)',
  marginBottom: 14,
};

const footerNoteStyle = {
  fontSize: 11,
  color: '#9ca3af',
  lineHeight: 1.6,
};
