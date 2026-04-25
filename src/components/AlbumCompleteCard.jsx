import { useEffect, useState } from 'react';
import { ALBUMS, SONGS } from '../data/albums';
import { drawCard } from './RankingCard';

// Full-screen overlay shown when a user finishes ranking every song in an album.
// Renders a live preview of their shareable card and lets them download it.
export default function AlbumCompleteCard({
  albumName,
  albumIcon,
  getCompositeScore,
  activeCategories,
  onClose,
}) {
  const [cardDataUrl, setCardDataUrl] = useState(null);

  // Build the top-songs list across all albums (same logic as RankingCard)
  const allRated = [];
  for (const album of ALBUMS) {
    const songs = SONGS[album.id] || [];
    for (let i = 0; i < songs.length; i++) {
      const score = getCompositeScore(album.id, i, activeCategories);
      if (score !== null) {
        allRated.push({ name: songs[i], albumName: album.name, albumIcon: album.icon, score });
      }
    }
  }
  allRated.sort((a, b) => b.score - a.score);

  // Render the card to an off-screen canvas once on mount
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width  = 1080;
    canvas.height = 1080;
    drawCard(canvas.getContext('2d'), allRated.slice(0, 10));
    setCardDataUrl(canvas.toDataURL('image/png'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDownload() {
    if (!cardDataUrl) return;
    const link = document.createElement('a');
    link.download = 'my-eras-rankings.png';
    link.href = cardDataUrl;
    link.click();
  }

  async function handleShare() {
    if (!cardDataUrl) return;
    try {
      const res  = await fetch(cardDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'my-eras-rankings.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Eras Rankings' });
        return;
      }
    } catch { /* fall through to download */ }
    handleDownload();
  }

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
      <style>{`
        @keyframes acc-slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes acc-card-in {
          0%   { opacity: 0; transform: scale(0.88); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0d0618',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: 20,
          animation: 'acc-slide-up 0.4s ease both',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{albumIcon}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
            {albumName}
          </div>
          <div style={{ fontSize: 14, color: '#a855f7', marginTop: 4, letterSpacing: '0.04em' }}>
            fully ranked ✦
          </div>
        </div>

        {/* Card preview */}
        <div style={{
          animation: 'acc-card-in 0.45s cubic-bezier(0.17, 0.89, 0.32, 1.1) 0.1s both',
          boxShadow: '0 0 48px rgba(168,85,247,0.4), 0 8px 32px rgba(0,0,0,0.6)',
          borderRadius: 16,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 360,
          aspectRatio: '1 / 1',
          background: '#0f0a1e',
          flexShrink: 0,
        }}>
          {cardDataUrl
            ? <img src={cardDataUrl} alt="Your rankings card" style={{ width: '100%', height: '100%', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid #a855f7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              </div>
          }
        </div>

        {/* Action buttons */}
        <div style={{
          width: '100%',
          maxWidth: 360,
          marginTop: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: 'acc-slide-up 0.4s ease 0.25s both',
          opacity: 0,
        }}>
          <button
            onClick={canNativeShare ? handleShare : handleDownload}
            disabled={!cardDataUrl}
            style={{
              padding: '13px',
              borderRadius: 12,
              border: 'none',
              background: cardDataUrl ? '#a855f7' : '#2d1b4e',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 600,
              cursor: cardDataUrl ? 'pointer' : 'default',
              letterSpacing: '0.01em',
            }}
          >
            {canNativeShare ? 'Share Card' : 'Download Card'}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '11px',
              borderRadius: 12,
              border: '0.5px solid rgba(168,85,247,0.3)',
              background: 'none',
              color: '#9ca3af',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Back to album
          </button>
        </div>

      </div>
    </>
  );
}
