import { useEffect, useRef, useState } from 'react';
import { ALBUMS, SONGS } from '../data/albums';
import { drawAlbumSpotlightCard, drawMosaicCard, drawCard } from '../components/RankingCard';

// Mock data for previewing the three shareable cards without having to rate
// every song in the app. Visit /?dev=cards while running `npm run dev`.

// Card C — pick Red (TV) as the spotlight album with realistic top songs.
function buildSpotlightMock() {
  const album = ALBUMS.find(a => a.id === 'rd');
  const songs = SONGS[album.id] || [];
  return {
    meta: {
      name: album.name,
      icon: album.icon,
      year: album.year,
      songCount: songs.length,
      score: 87,
    },
    topSongs: [
      { name: 'All Too Well (10 Minute Version) (From The Vault)', score: 98 },
      { name: 'All Too Well',                                    score: 94 },
      { name: 'Red',                                             score: 91 },
    ],
  };
}

// Legacy top-10: pick well-known songs across multiple albums with descending scores.
function buildTop10Mock() {
  const picks = [
    { albumId: 'rd', songIndex: 5,  score: 98 }, // All Too Well (just pick a real song)
    { albumId: 'fl', songIndex: 0,  score: 96 },
    { albumId: 'ml', songIndex: 0,  score: 94 },
    { albumId: '89', songIndex: 1,  score: 92 },
    { albumId: 'tp', songIndex: 2,  score: 90 },
    { albumId: 'fe', songIndex: 2,  score: 88 },
    { albumId: 'st', songIndex: 4,  score: 87 },
    { albumId: 'rp', songIndex: 5,  score: 85 },
    { albumId: 'lv', songIndex: 2,  score: 83 },
    { albumId: 'ev', songIndex: 0,  score: 82 },
  ];
  return picks.map(p => {
    const album = ALBUMS.find(a => a.id === p.albumId);
    const songName = (SONGS[p.albumId] || [])[p.songIndex] || '(unknown)';
    return {
      name: songName,
      albumName: album?.name ?? '',
      albumIcon: album?.icon ?? '',
      score: p.score,
    };
  });
}

// Mosaic: every album scored, sorted high → low.
function buildMosaicMock() {
  const scores = {
    rd: 94, fl: 92, ml: 90, '89': 88, tp: 86, fe: 84,
    st: 83, rp: 81, lv: 79, ev: 78, tv: 75, ls: 72,
  };
  return ALBUMS
    .map(a => ({ name: a.name, icon: a.icon, score: scores[a.id] ?? 70 }))
    .sort((a, b) => b.score - a.score);
}

function CardPanel({ title, subtitle, draw, downloadName }) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    draw(ctx);
    setDataUrl(canvas.toDataURL('image/png'));
  }, [draw]);

  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = downloadName;
    link.href = dataUrl;
    link.click();
  }

  return (
    <div style={{
      background: '#0f0a1e',
      border: '1px solid rgba(168,85,247,0.25)',
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 480,
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#000',
        boxShadow: '0 0 32px rgba(168,85,247,0.25)',
      }}>
        {dataUrl
          ? <img src={dataUrl} alt={title} style={{ width: '100%', height: '100%', display: 'block' }} />
          : <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        }
        {!dataUrl && <canvas ref={canvasRef} style={{ display: 'none' }} />}
      </div>
      <button
        onClick={handleDownload}
        disabled={!dataUrl}
        style={{
          marginTop: 12,
          width: '100%',
          padding: 11,
          borderRadius: 10,
          border: 'none',
          background: dataUrl ? '#a855f7' : '#2d1b4e',
          color: '#ffffff',
          fontSize: 14,
          fontWeight: 600,
          cursor: dataUrl ? 'pointer' : 'default',
        }}
      >
        Download PNG
      </button>
    </div>
  );
}

export default function CardPreview() {
  const spotlight = buildSpotlightMock();
  const top10 = buildTop10Mock();
  const mosaic = buildMosaicMock();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0618',
      padding: '32px 20px 64px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff' }}>
            Shareable Card Preview
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 6 }}>
            Dev-only sample of the three share cards rendered with mock data.
            Not visible in production builds.
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'center',
        }}>
          <CardPanel
            title="Album Spotlight"
            subtitle="Shown when one album is fully ranked (AlbumCompleteCard overlay)."
            draw={ctx => drawAlbumSpotlightCard(ctx, spotlight.meta, spotlight.topSongs)}
            downloadName="preview-album-spotlight.png"
          />
          <CardPanel
            title="Top 10 Songs (legacy)"
            subtitle="Rankings tab — unlocks after the first album is fully ranked."
            draw={ctx => drawCard(ctx, top10)}
            downloadName="preview-top-10.png"
          />
          <CardPanel
            title="All Eras Mosaic"
            subtitle="Rankings tab — unlocks after all 12 albums are fully ranked."
            draw={ctx => drawMosaicCard(ctx, mosaic)}
            downloadName="preview-mosaic.png"
          />
        </div>
      </div>
    </div>
  );
}
