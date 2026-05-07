// Tiny inline loading spinner — used wherever the app shows a "loading" state.
// Inherits color from the parent (currentColor) so it looks right on white,
// purple, and Spotify-green backgrounds without any per-call overrides.

const SPIN_STYLE = `
@keyframes eras-spin { to { transform: rotate(360deg); } }
`;

export default function Spinner({
  size = 16,
  color = 'currentColor',
  strokeWidth = 2.5,
  style,
}) {
  return (
    <>
      <style>{SPIN_STYLE}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        role="status"
        aria-label="Loading"
        style={{
          animation: 'eras-spin 0.85s linear infinite',
          flexShrink: 0,
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style,
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="42 14"
          opacity="0.95"
        />
      </svg>
    </>
  );
}
