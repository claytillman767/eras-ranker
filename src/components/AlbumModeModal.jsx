// Shown once when a user opens an album for the first time.
// Asks whether they want to score songs (Vibe Check) or sort manually.
// Styled as a bottom sheet that slides up from the bottom edge.
export default function AlbumModeModal({
  album,
  onChooseScore,
  onChooseManual,
  onBack,
}) {
  return (
    <div
      onClick={onBack}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(20,16,30,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes album-mode-sheet-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 700,
          background: 'var(--surface)',
          borderRadius: '22px 22px 0 0',
          padding: '20px 20px 34px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
          animation: 'album-mode-sheet-up 0.28s cubic-bezier(0.17, 0.89, 0.32, 1.05) both',
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-2)',
            fontSize: 14,
            padding: '0 0 14px',
          }}
        >
          ← Back
        </button>

        {/* Album identity */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 34 }}>{album.icon}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{album.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>How do you want to rank this album?</div>
        </div>

        {/* Vibe Check option */}
        <button
          onClick={onChooseScore}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: 10,
            padding: 16,
            borderRadius: 16,
            border: '2px solid var(--brand)',
            background: 'var(--accent-soft)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <span style={{ fontSize: 26 }}>🎧</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-text)', marginBottom: 3 }}>
                Vibe Check
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>
                Answer a few quick questions about each song and we'll rank them for you. You can sort by hand afterward if you like.
              </div>
            </div>
          </div>
        </button>

        {/* Sort It Yourself option */}
        <button
          onClick={onChooseManual}
          style={{
            display: 'block',
            width: '100%',
            padding: 16,
            borderRadius: 16,
            border: '1.5px solid var(--border)',
            background: 'var(--surface)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <span style={{ fontSize: 26 }}>✋</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                Sort It Yourself
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>
                Drag songs into your own order — no questions.
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
