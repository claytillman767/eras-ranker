import { useRef, useEffect } from 'react';
import StarRating from './StarRating';
import { getBridgeLyrics } from '../data/lyricsAccess';

// Full scoring panel — opens below the selected song's action bar.
export default function RatingPanel({ song, albumId, albumName, year, songRatings, activeCategories, compositeScore, onRate }) {
  const bridgeLyrics = song ? getBridgeLyrics(albumId, song.index) : null;
  const panelRef = useRef(null);

  // Scroll into view on mobile when it opens
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [song]);

  if (!song) return null;

  const overallStars = compositeScore !== null ? Math.round((compositeScore / 100) * 5) : 0;

  return (
    <div
      ref={panelRef}
      style={{
        background: '#faf5ff',
        border: '0.5px solid #e9d5ff',
        borderRadius: 12,
        padding: '14px 14px 10px',
        marginTop: 6,
      }}
    >
      {/* Song title and score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>{song.name}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{albumName} · {year}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#a855f7', lineHeight: 1 }}>
            {compositeScore !== null ? compositeScore : '—'}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>score</div>
        </div>
      </div>

      {/* One row per active category */}
      {activeCategories.map((cat, i) => {
        const starVal = songRatings?.[cat.id] || 0;
        return (
          <div key={cat.id}>
            {i > 0 && <div style={{ height: 1, background: '#f3e8ff', margin: '4px 0' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
              <div style={{ width: 90, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{cat.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{cat.weight}%</div>
              </div>
              <div style={{ flex: 1 }}>
                <StarRating
                  value={starVal}
                  size="md"
                  onChange={val => onRate(cat.id, val)}
                />
                {cat.id === 'bridge' && bridgeLyrics && (
                  <div style={{ fontSize: 11, color: '#a78bfa', fontStyle: 'italic', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                    "{bridgeLyrics}"
                  </div>
                )}
                {cat.id === 'bridge' && !bridgeLyrics && (
                  <div style={{ fontSize: 11, color: '#d1d5db', fontStyle: 'italic', marginTop: 2 }}>
                    No bridge section
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#a855f7', width: 16, textAlign: 'right' }}>
                {starVal > 0 ? starVal : '—'}
              </div>
            </div>
          </div>
        );
      })}

      {/* Divider before overall */}
      <div style={{ height: 1, background: '#e9d5ff', margin: '8px 0' }} />

      {/* Overall summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 90, flexShrink: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>Overall</div>
        <div style={{ flex: 1 }}>
          <StarRating value={overallStars} size="md" readonly />
        </div>
        <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 500 }}>
          {compositeScore !== null ? `${compositeScore} / 100` : '— / 100'}
        </div>
      </div>
    </div>
  );
}
