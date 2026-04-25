// Reusable star rating input. Renders 1–5 clickable stars.
// Props:
//   value      — current rating (0 = unrated)
//   onChange   — called with new value (0 if tapping same star to clear)
//   size       — 'sm' | 'md' | 'lg' (controls star size)
//   readonly   — if true, stars are display-only (no click)

const SIZES = { sm: 14, md: 20, lg: 26 };

export default function StarRating({ value = 0, onChange, size = 'md', readonly = false }) {
  const px = SIZES[size] || SIZES.md;

  function handleClick(starVal) {
    if (readonly || !onChange) return;
    // Tapping the currently-selected star clears it (toggle off)
    onChange(starVal === value ? 0 : starVal);
  }

  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= value;
        return (
          <button
            key={star}
            onClick={() => handleClick(star)}
            disabled={readonly}
            aria-label={`${star} star`}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: readonly ? 'default' : 'pointer',
              // Minimum 44px touch target height as required
              minHeight: 44,
              minWidth: px + 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width={px}
              height={px}
              viewBox="0 0 20 20"
              fill={filled ? '#a855f7' : '#e9d5ff'}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27l-4.78 2.51.91-5.32L2.27 6.62l5.34-.78L10 1z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
