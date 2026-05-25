// Shown once when a user opens an album for the first time.
// Asks whether they want to score songs (Vibe Check) or sort manually.
export default function AlbumModeModal({
  album,
  onChooseScore,
  onChooseManual,
  onBack,
}) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 20,
        padding: '28px 20px 20px',
        width: '100%',
        maxWidth: 480,
        margin: '0 16px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-2)',
            fontSize: 14,
            padding: '0 0 16px',
          }}
        >
          ← Back
        </button>

        {/* Album identity */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>{album.icon}</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{album.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>How do you want to rank this album?</div>
        </div>

        {/* Vibe Check option */}
        <button
          onClick={onChooseScore}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: 10,
            padding: '16px 16px',
            borderRadius: 14,
            border: '2px solid var(--brand)',
            background: 'var(--accent-grad-a)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>🎧</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-text)', marginBottom: 3 }}>
                Vibe Check
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>
                Answer a few questions about each song and we'll rank them for you. You can manually sort songs after a score is assigned.
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
            padding: '16px 16px',
            borderRadius: 14,
            border: '1.5px solid var(--border)',
            background: 'var(--surface)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>✋</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                Sort It Yourself
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>
                Drag songs into your own order without answering any questions.
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
