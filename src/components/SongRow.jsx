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
  songRatings,     // object like { lyrics: 4, music: 3, ... } or null/undefined
  activeCategories, // full array of active category objects
}) {
  const scored = compositeScore !== null;

  // Build the bar data: up to the first 4 active categories that have been rated
  const ratedBars = scored && songRatings && activeCategories
    ? activeCategories
        .slice(0, 4)
        .map(cat => ({
          id: cat.id,
          label: abbrevLabel(cat.name),
          pct: songRatings[cat.id] ? Math.round((songRatings[cat.id] / 5) * 100) : null,
        }))
        .filter(b => b.pct !== null)
    : [];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      background: isSelected ? '#faf5ff' : '#ffffff',
      border: '0.5px solid #e5e7eb',
      borderLeft: isSelected ? '3px solid #a855f7' : '0.5px solid #e5e7eb',
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
          color: '#c4b5fd',
          fontSize: 16,
          borderRight: '0.5px solid #f3f4f6',
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
            color: scored ? '#111827' : '#9ca3af',
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
            color: '#111827',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {song.name}
          </div>

          {scored ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: '#a855f7', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {compositeScore}
              </span>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>/100</span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', flexShrink: 0 }}>
              not rated
            </div>
          )}
        </div>

        {/* Category bars — only shown for scored songs */}
        {scored && ratedBars.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            {ratedBars.map(bar => (
              <div key={bar.id} style={{ flex: 1 }}>
                <div style={{ height: 3, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${bar.pct}%`,
                    background: bar.pct >= 85 ? '#a855f7' : bar.pct >= 70 ? '#a855f7aa' : '#a855f755',
                    borderRadius: 2,
                  }} />
                </div>
                <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2, letterSpacing: '0.02em' }}>
                  {bar.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* "Tap to score" nudge for unrated songs */}
        {!scored && (
          <div style={{ marginTop: 5, fontSize: 11, color: '#a855f7', fontWeight: 500 }}>
            Tap to score →
          </div>
        )}
      </div>
    </div>
  );
}

// Abbreviate category name to ≤5 chars for the tiny bar legend
function abbrevLabel(name) {
  const MAP = {
    'Lyrics': 'Lyr',
    'Music / melody': 'Music',
    'Bridge': 'Brdg',
    'Nostalgia': 'Nost',
    'Skip on shuffle?': 'Skip',
    'Hook / chorus': 'Hook',
    'Vocal performance': 'Voc',
    'Cry factor': 'Cry',
    'Romantic feel': 'Rom',
    'Hype / energy': 'Hype',
    'Opening line': 'Open',
    'Vibe / atmosphere': 'Vibe',
    'Storytelling': 'Story',
  };
  return MAP[name] || name.slice(0, 5);
}
