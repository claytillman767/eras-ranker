// Reusable confirmation modal — replacement for window.confirm().
// Matches the app's purple gradient style.
//
// Pass `destructive` for actions that delete or overwrite user data —
// the confirm button switches to a red gradient.
//
// Backdrop click and the Cancel button both call onClose. The confirm
// button calls onConfirm AND onClose, so callers don't have to remember
// to dismiss after firing the action.
export default function ConfirmModal({
  title,
  body,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onClose,
}) {
  const confirmBg = destructive
    ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
    : 'linear-gradient(135deg, #a855f7, #7c3aed)';
  const confirmShadow = destructive
    ? '0 4px 12px rgba(239,68,68,0.3)'
    : '0 4px 12px rgba(168,85,247,0.3)';

  function handleConfirm() {
    onConfirm?.();
    onClose?.();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '24px 24px 20px',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#111827',
          marginBottom: 10,
        }}>
          {title}
        </div>

        {body && (
          <div style={{
            fontSize: 14,
            color: '#4b5563',
            lineHeight: 1.55,
            marginBottom: 22,
          }}>
            {body}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleConfirm}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: confirmBg,
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: confirmShadow,
            }}
          >
            {confirmLabel}
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 12,
              border: '0.5px solid #d1d5db',
              background: '#ffffff',
              color: '#4b5563',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
