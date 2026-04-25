// Thin horizontal bar representing a score proportionally.
// Props:
//   score     — this item's score (0–100)
//   maxScore  — the highest score in the list (used to scale bar width)

export default function ScoreBar({ score, maxScore }) {
  // Avoid division by zero; default to 0 width
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return (
    <div style={{
      height: 4,
      background: '#f3e8ff',
      borderRadius: 2,
      overflow: 'hidden',
      flex: 1,
      minWidth: 40,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: '#a855f7',
        borderRadius: 2,
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}
