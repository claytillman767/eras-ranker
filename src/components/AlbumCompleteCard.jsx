import { useEffect, useState } from 'react';
import { ALL_ALBUMS, SONGS } from '../data/albums';
import { drawAlbumSpotlightCard } from './RankingCard';

// Full-screen overlay shown when a user finishes ranking every song in an album.
// Renders the Album Spotlight share card (Card C from design) and lets them download/share it.
export default function AlbumCompleteCard({
  albumId,
  albumName,
  albumIcon,
  getCompositeScore,
  activeCategories,
  onClose,
}) {
  const [cardDataUrl, setCardDataUrl] = useState(null);

  useEffect(() => {
    const album = ALL_ALBUMS.find(a => a.id === albumId);
    const songList = SONGS[albumId] || [];

    // Top songs for this specific album, sorted by score
    const topSongs = songList
      .map((name, i) => ({ name, score: getCompositeScore(albumId, i, activeCategories) }))
      .filter(s => s.score !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Album score = average of all song scores
    const allScores = songList
      .map((_, i) => getCompositeScore(albumId, i, activeCategories))
      .filter(s => s !== null);
    const albumScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    const canvas = document.createElement('canvas');
    canvas.width  = 1080;
    canvas.height = 1080;
    drawAlbumSpotlightCard(
      canvas.getContext('2d'),
      {
        name:      albumName,
        icon:      albumIcon,
        year:      album?.year ?? '',
        songCount: songList.length,
        score:     albumScore,
      },
      topSongs
    );
    setCardDataUrl(canvas.toDataURL('image/png'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDownload() {
    if (!cardDataUrl) return;
    const link = document.createElement('a');
    link.download = `my-${albumId}-ranking.png`;
    link.href = cardDataUrl;
    link.click();
  }

  async function handleShare() {
    if (!cardDataUrl) return;
    try {
      const res  = await fetch(cardDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `my-${albumId}-ranking.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `My ${albumName} Rankings` });
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
            ? <img src={cardDataUrl} alt="Your album ranking card" style={{ width: '100%', height: '100%', display: 'block' }} />
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
          {/* Share — only on platforms with the native share sheet
              (mobile, mostly). When share isn't available, the Save
              button below covers downloading on its own. */}
          {canNativeShare && (
            <button
              onClick={handleShare}
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
              Share Card
            </button>
          )}

          {/* Save — always available; primary style on desktop where it's
              the only action, secondary outline style on mobile where it
              sits next to Share. */}
          <button
            onClick={handleDownload}
            disabled={!cardDataUrl}
            style={{
              padding: '13px',
              borderRadius: 12,
              border: canNativeShare ? '1px solid rgba(168,85,247,0.5)' : 'none',
              background: canNativeShare
                ? 'transparent'
                : (cardDataUrl ? '#a855f7' : '#2d1b4e'),
              color: canNativeShare ? '#a855f7' : '#ffffff',
              fontSize: 15,
              fontWeight: 600,
              cursor: cardDataUrl ? 'pointer' : 'default',
              letterSpacing: '0.01em',
            }}
          >
            Save Card
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
