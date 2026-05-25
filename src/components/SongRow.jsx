// One row in the song list.
// Shows drag handle, rank number, song title, score, and (when scored) per-category mini bars.
export default function SongRow({
  song,
  isSelected,
  compositeScore,
  onClick,
  position,
  onDragStart,
  onDragMove,
  onDragEnd,
  // New props for category bars
  songRatings,       // object like { lyrics: 4, music: 3, ... } or null/undefined
  activeCategories,  // full array of active category objects
  showCategoryBars,  // boolean — when false, hides the mini bar breakdown
}) {
  const scored = compositeScore !== null;

  // Build the bar data — full category names; only the rated ones, in active order.
  // Three render kinds:
  //   - 'shuffle': the 'replay' / Skip-on-shuffle category → Play or Skip icon
  //   - 'yesno':   custom binary categories (type 'yesno') → Y or N badge
  //   - 'stars':   everything else (1–5 stars)            → bar + N/5 label
  const ratedBars = scored && songRatings && activeCategories
    ? activeCategories
        .map(cat => {
          const rating = songRatings[cat.id];
          if (!rating) return null;
          let kind = 'stars';
          if (cat.id === 'replay') kind = 'shuffle';
          else if (cat.type === 'yesno') kind = 'yesno';
          return {
            id: cat.id,
            label: cat.name,
            rating,
            pct: Math.round((rating / 5) * 100),
            kind,
            // For yesno: rating 5 → 'Y', 1 → 'N'
            yesNo: kind === 'yesno' ? (rating >= 3 ? 'Y' : 'N') : null,
            // For shuffle: rating 5 → "Play" (don't skip), rating 1 → "Skip"
            shuffle: kind === 'shuffle' ? (rating >= 3 ? 'play' : 'skip') : null,
          };
        })
        .filter(Boolean)
    : [];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      background: isSelected ? 'var(--accent-grad-a)' : 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderLeft: isSelected ? '3px solid var(--brand)' : '0.5px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Drag handle — touch/pointer events only, never triggers row click */}
      <div
        style={{
          width: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--control-off)',
          fontSize: 16,
          borderRight: '0.5px solid var(--hairline)',
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
          flexShrink: 0,
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          onDragStart();
        }}
        onPointerMove={(e) => {
          onDragMove(e.clientY);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          onDragEnd();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </div>

      {/* Clickable content area */}
      <div
        style={{
          flex: 1,
          padding: '10px 12px',
          cursor: 'pointer',
          minWidth: 0,
        }}
        onClick={onClick}
      >
        {/* Top row: rank + title + score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 18,
            fontWeight: 300,
            color: scored ? 'var(--text)' : 'var(--text-3)',
            width: 22,
            textAlign: 'center',
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}>
            {position + 1}
          </span>

          <div style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {song.name}
          </div>

          {scored ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--brand-text)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {compositeScore}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>/100</span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', flexShrink: 0 }}>
              not rated
            </div>
          )}
        </div>

        {/* Category breakdown — only when the row is selected (click to expand) */}
        {scored && isSelected && showCategoryBars !== false && ratedBars.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {ratedBars.map(bar => (
              <div key={bar.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  flex: 1,
                  fontSize: 12,
                  color: 'var(--text-strong)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {bar.label}
                </div>

                {bar.kind === 'shuffle' ? (
                  <div style={{
                    width: 80,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 9px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#ffffff',
                      background: bar.shuffle === 'play' ? 'var(--brand)' : 'var(--text-3)',
                      lineHeight: 1.4,
                    }}>
                      <ShuffleIcon kind={bar.shuffle} />
                      {bar.shuffle === 'play' ? 'Play' : 'Skip'}
                    </div>
                  </div>
                ) : bar.kind === 'yesno' ? (
                  <div style={{
                    width: 80,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      minWidth: 28,
                      padding: '2px 10px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ffffff',
                      background: bar.yesNo === 'Y' ? 'var(--brand)' : 'var(--text-3)',
                      textAlign: 'center',
                      lineHeight: 1.5,
                    }}>
                      {bar.yesNo}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: 80,
                    height: 4,
                    background: 'var(--surface-3)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${bar.pct}%`,
                      background: bar.pct >= 85 ? '#a855f7' : bar.pct >= 70 ? '#a855f7aa' : '#a855f755',
                      borderRadius: 2,
                    }} />
                  </div>
                )}

                <div style={{
                  width: 32,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--brand-text)',
                  textAlign: 'right',
                  flexShrink: 0,
                }}>
                  {bar.kind === 'stars' ? `${bar.rating}/5` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* "Tap to score" nudge for unrated songs */}
        {!scored && (
          <div style={{ marginTop: 5, fontSize: 11, color: 'var(--brand-text)', fontWeight: 500 }}>
            Tap to score →
          </div>
        )}
      </div>
    </div>
  );
}

// Small inline SVGs for the Skip-on-shuffle category badge
function ShuffleIcon({ kind }) {
  if (kind === 'play') {
    return (
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
    );
  }
  // 'skip' — skip-forward / next-track glyph
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 6l8.5 6L6 18V6zm10 0h2v12h-2V6z" />
    </svg>
  );
}

