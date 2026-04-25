// One row in the song list. Shows rank, drag handle, title, and score.
// Clicking the row opens the action bar (reorder + score buttons) in SongList.
export default function SongRow({
  song, isSelected, compositeScore, onClick,
  position,
  onDragStart, onDragMove, onDragEnd,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: isSelected ? '#faf5ff' : '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderLeft: isSelected ? '3px solid #a855f7' : '0.5px solid #e5e7eb',
        borderRadius: 8,
        width: '100%',
        minHeight: 44,
        overflow: 'hidden',
      }}
    >
      {/* Drag handle — touch/pointer events only, never triggers onClick */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          alignSelf: 'stretch',
          flexShrink: 0,
          cursor: 'grab',
          touchAction: 'none',
          color: '#c4b5fd',
          fontSize: 18,
          userSelect: 'none',
          borderRight: '0.5px solid #f3e8ff',
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

      {/* Clickable content area — opens action bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flex: 1,
          padding: '8px 12px',
          cursor: 'pointer',
          minWidth: 0,
        }}
        onClick={onClick}
      >
        {/* Position number */}
        <span style={{ fontSize: 11, color: '#9ca3af', width: 24, textAlign: 'center', flexShrink: 0 }}>
          #{position + 1}
        </span>

        {/* Song title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
          }}>
            {song.name}
          </div>
        </div>

        {/* Score or dash */}
        <div style={{
          fontSize: 14,
          fontWeight: 500,
          color: compositeScore !== null ? '#a855f7' : '#d1d5db',
          width: 32,
          textAlign: 'right',
          flexShrink: 0,
        }}>
          {compositeScore !== null ? compositeScore : '—'}
        </div>
      </div>
    </div>
  );
}
