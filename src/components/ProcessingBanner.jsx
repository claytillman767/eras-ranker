// Fixed banner shown at the top of the app while a Pro upgrade is in
// flight — from the moment the LS checkout opens until the webhook lands
// and `isPro` flips to true (or the failsafe timer in usePro expires).
//
// Why a global banner: the LS overlay closes itself after a successful
// payment, so the user is dropped back into the app and would otherwise
// see no acknowledgement that the system noticed their payment. There's a
// 2–10 second window between checkout success and the webhook updating
// Firestore, and during that window the user might think the upgrade
// failed. The banner bridges that gap.
//
// When Pro flips on, usePro.js clears `isUpgrading` and the banner
// disappears. Pro features re-render normally a frame later.
export default function ProcessingBanner({ visible }) {
  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes processing-banner-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes processing-banner-slide-in {
          from { transform: translateY(-100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9800,
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          color: '#ffffff',
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: '0 4px 12px rgba(168,85,247,0.25)',
          animation: 'processing-banner-slide-in 0.25s ease-out',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <span style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: '#ffffff',
          animation: 'processing-banner-spin 0.8s linear infinite',
          flexShrink: 0,
        }} />
        Processing your payment — Pro will activate in a moment.
      </div>
    </>
  );
}
