import { useState, useEffect } from 'react';
import { getBridgeLyrics } from '../data/bridgeLyrics';
import { getSnippetLyrics } from '../data/snippetLyrics';
import SpotifyMiniPlayer from './SpotifyMiniPlayer';

// Calibration phrases for each category × star level (index 0 = ★1).
// Goal: make ★1–★2 feel like valid, honest ratings — not insults.
const STAR_LABELS = {
  lyrics: [
    'Filler words',
    'Gets the point across',
    'Some good lines',
    'Clever and quotable',
    'Rewrites poetry',
  ],
  music: [
    'Forgettable production',
    'Standard backdrop',
    'Solid production',
    'Really draws you in',
    "Can't get it out of your head",
  ],
  bridge: [
    "Doesn't land",
    'Just a transition',
    'Decent shift',
    'Changes the whole song',
    'Best part by far',
  ],
  nostalgia: [
    'No personal connection',
    'Vaguely familiar',
    'Takes you back a bit',
    'Tied to a real memory',
    'Instantly transported',
  ],
  replay: [
    'Likely to skip.',
    'Rarely comes back to it',
    'On rotation sometimes',
    'Hard to skip',
    'Stuck on repeat',
  ],
  hook: [
    "Doesn't stick",
    'Easy to forget',
    'Solid and singable',
    'Stuck in your head',
    'Legendary chorus',
  ],
  vocals: [
    'By the numbers',
    'Clean but flat',
    'Controlled and clear',
    'Emotionally charged',
    'Gives you chills',
  ],
  cry: [
    'Completely dry-eyed',
    'A little heavy',
    'Lump in your throat',
    'Eyes are watering',
    'Full ugly cry',
  ],
  romantic: [
    'No romantic pull',
    'Mildly sweet',
    'Genuinely romantic',
    'Makes your heart ache',
    'Peak swoon',
  ],
  hype: [
    'No energy',
    'Low-key only',
    'Gets you moving a little',
    'Hard to stay still',
    'Full dance mode',
  ],
  opening: [
    'Slow start',
    'Takes a minute to hook',
    'Decent opener',
    'Hooked immediately',
    'Iconic first line',
  ],
  vibe: [
    'Thin or generic',
    'Some atmosphere',
    'Consistent vibe',
    'Fully immersive',
    'Its own universe',
  ],
  storytelling: [
    'No clear narrative',
    'Impressions only',
    'Clear enough story',
    'Vivid and specific',
    'Cinematic',
  ],
};

// Distinct background gradient per category — lets the user immediately know
// which category they're rating just from the screen color.
const CAT_BACKGROUNDS = {
  lyrics:      'linear-gradient(160deg, #fdf4ff 0%, #f3e8ff 100%)', // lavender
  music:       'linear-gradient(160deg, #eff6ff 0%, #dbeafe 100%)', // blue
  bridge:      'linear-gradient(160deg, #f0fdfa 0%, #ccfbf1 100%)', // teal
  nostalgia:   'linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)', // amber
  hook:        'linear-gradient(160deg, #fff1f2 0%, #ffe4e6 100%)', // rose
  vocals:      'linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 100%)', // sky
  cry:         'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)', // slate
  romantic:    'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 100%)', // pink
  hype:        'linear-gradient(160deg, #fff7ed 0%, #fed7aa 100%)', // orange
  opening:     'linear-gradient(160deg, #f0fdf4 0%, #dcfce7 100%)', // green
  vibe:        'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)', // indigo
  storytelling:'linear-gradient(160deg, #fefce8 0%, #fef9c3 100%)', // yellow
};

// ── Big interactive stars ─────────────────────────────────────────────────────
// Gets a new `key` each question so hover state resets automatically.
function StarPicker({ currentRating, onRate, labels }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || currentRating;
  const activeLevel = hovered || currentRating;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(star => {
          const active = star <= display;
          const isHoverTarget = hovered > 0 && star <= hovered;
          return (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onRate(star)}
              aria-label={`${star} star`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                lineHeight: 0,
                transition: 'transform 0.1s ease',
                transform: isHoverTarget ? 'scale(1.18)' : 'scale(1)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <svg
                width={52}
                height={52}
                viewBox="0 0 20 20"
                fill={active ? (hovered > 0 ? '#f59e0b' : '#a855f7') : '#e9d5ff'}
                style={{ display: 'block', transition: 'fill 0.08s ease' }}
              >
                <path d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27l-4.78 2.51.91-5.32L2.27 6.62l5.34-.78L10 1z" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Label list — always visible so mobile users can see descriptions without hovering.
          The active row (hovered on desktop, selected on mobile) is fully opaque; others fade back. */}
      {labels && (
        <div style={{
          marginTop: 18,
          width: '100%',
          maxWidth: 272,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}>
          {labels.map((label, i) => {
            const starNum = i + 1;
            const isActive = starNum === activeLevel;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: isActive ? 1 : 0.32,
                  transition: 'opacity 0.1s ease',
                }}
              >
                <span style={{
                  fontSize: 10,
                  color: '#a855f7',
                  minWidth: 42,
                  letterSpacing: 1,
                  fontWeight: 700,
                }}>
                  {starNum}★
                </span>
                <span style={{
                  fontSize: 12,
                  color: isActive ? '#5b21b6' : '#9ca3af',
                  fontWeight: isActive ? 600 : 400,
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Completion flash — animates in, holds briefly, fades out, then auto-closes ─
function DoneFlash({ albumIcon, albumName, songName, isSingleSong, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes qs-check-pop {
          0%   { transform: scale(0.2) rotate(-10deg); opacity: 0; }
          55%  { transform: scale(1.25) rotate(4deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
        }
        @keyframes qs-label-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes qs-overlay-out {
          0%, 55% { opacity: 1; }
          100%    { opacity: 0; }
        }
      `}</style>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: 32,
          animation: 'qs-overlay-out 2s ease forwards',
        }}
      >
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'qs-check-pop 0.45s cubic-bezier(0.17, 0.89, 0.32, 1.28) forwards',
          boxShadow: '0 4px 24px rgba(168,85,247,0.35)',
        }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{
          textAlign: 'center',
          animation: 'qs-label-in 0.35s 0.3s ease both',
          opacity: 0,
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            {isSingleSong ? 'Scored!' : 'All done!'}
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            {isSingleSong ? songName : `${albumIcon} ${albumName}`}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Lyric scroller — scrollable lyrics box above the stars on the Lyrics screen ─
function LyricScroller({ lyrics }) {
  const lines = lyrics
    ? lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 1)
    : [];

  if (!lines.length) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: 300,
      maxHeight: 110,
      overflowY: 'auto',
      marginBottom: 20,
      textAlign: 'center',
      WebkitOverflowScrolling: 'touch',
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontSize: 13,
          color: '#4c1d95',
          fontStyle: 'italic',
          lineHeight: 1.85,
        }}>
          {line}
        </div>
      ))}
    </div>
  );
}

// ── Falling trees easter egg — triggered when rating "Wood" ──────────────────
const TREE_POSITIONS = [4, 12, 21, 30, 39, 48, 57, 66, 74, 83, 91];

function FallingTrees({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <>
      <style>{`
        @keyframes tree-fall {
          0%   { transform: translateY(-80px) rotate(-8deg); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(12deg); opacity: 0; }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        {TREE_POSITIONS.map((left, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: `${left}%`,
              fontSize: 28 + (i % 3) * 6,
              animation: `tree-fall ${1.8 + (i % 5) * 0.28}s ${i * 0.18}s ease-in both`,
              userSelect: 'none',
            }}
          >
            🌲
          </div>
        ))}
      </div>
    </>
  );
}

// ── Shared scatter positions for floating lyrics background ──────────────────
const SPOTS = [
  { top: '6%',  left: '3%',  right: undefined, maxWidth: '42%', size: 15 },
  { top: '12%', left: undefined, right: '3%',  maxWidth: '40%', size: 16 },
  { top: '20%', left: '7%',  right: undefined, maxWidth: '44%', size: 17 },
  { top: '30%', left: undefined, right: '5%',  maxWidth: '38%', size: 15 },
  { top: '52%', left: '2%',  right: undefined, maxWidth: '43%', size: 16 },
  { top: '62%', left: undefined, right: '4%',  maxWidth: '40%', size: 15 },
  { top: '71%', left: '9%',  right: undefined, maxWidth: '44%', size: 17 },
  { top: '80%', left: undefined, right: '4%',  maxWidth: '38%', size: 16 },
  { top: '87%', left: '5%',  right: undefined, maxWidth: '44%', size: 15 },
  { top: '93%', left: undefined, right: '8%',  maxWidth: '40%', size: 16 },
];

// Floating lyrics scattered across the background — used on every screen.
// animating=true triggers the pulse-out transition instead of the fade-in.
function FloatingLyrics({ lyrics, animating = false }) {
  const lines = lyrics
    ? lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 2).slice(0, 10)
    : [];

  if (!lines.length) return null;

  return (
    <>
      <style>{`
        @keyframes lyric-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 0.32; transform: translateY(0); }
        }
        @keyframes lyric-pulse {
          0%   { opacity: 0.32; transform: translateY(0); }
          45%  { opacity: 0.65; transform: translateY(-4px); }
          100% { opacity: 0;    transform: translateY(-8px); }
        }
      `}</style>
      {lines.map((line, i) => {
        const spot = SPOTS[i];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: spot.top,
              left: spot.left,
              right: spot.right,
              maxWidth: spot.maxWidth,
              fontSize: spot.size,
              color: '#7c3aed',
              fontStyle: 'italic',
              lineHeight: 1.5,
              pointerEvents: 'none',
              userSelect: 'none',
              animation: animating
                ? `lyric-pulse 0.72s ${i * 0.04}s ease both`
                : `lyric-in 1s ${i * 0.14}s ease both`,
            }}
          >
            {line}
          </div>
        );
      })}
    </>
  );
}

// ── No-bridge notice — shown when a song has no bridge section ───────────────
function NoBridgeScreen({ songName, onContinue }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 36px',
      textAlign: 'center',
      gap: 0,
    }}>
      {/* Icon */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: '#f3e8ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        fontSize: 28,
      }}>
        🎵
      </div>

      {/* Message */}
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: 12, maxWidth: 300 }}>
        {songName} has no bridge.
      </div>
      <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, maxWidth: 280, marginBottom: 40 }}>
        Bridge score has been combined with Lyric category score.
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        style={{
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          border: 'none',
          borderRadius: 14,
          padding: '14px 40px',
          fontSize: 15,
          fontWeight: 600,
          color: '#ffffff',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Continue →
      </button>
    </div>
  );
}

// ── Shuffle screen — Play/Skip question with song lyrics floating in background ─
// Lyrics fade in softly, then pulse up and out when the user picks an answer,
// creating a bridge into the detailed rating questions.
function ShuffleScreen({ song, albumName, albumIcon, lyrics, onPick }) {
  const [animating, setAnimating] = useState(false);

  function handlePick(val) {
    if (animating) return;
    setAnimating(true);
    // Let the transition animation finish before handing control back to the parent
    setTimeout(() => onPick(val), 720);
  }

  return (
    <>
      <style>{`
        @keyframes shuffle-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes shuffle-btn-pop {
          0%   { transform: scale(1); }
          35%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #ffffff 0%, #fdf8ff 100%)',
        animation: animating ? 'shuffle-fade-out 0.72s ease forwards' : 'none',
      }}>
        {/* Floating lyrics in background */}
        <FloatingLyrics lyrics={lyrics} animating={animating} />

        {/* Center content */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Album context */}
          <div style={{ fontSize: 12, color: '#c4b5fd', marginBottom: 18, letterSpacing: '0.02em' }}>
            {albumIcon} {albumName}
          </div>

          {/* Song name */}
          <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: 14, maxWidth: 300 }}>
            {song.name}
          </div>

          {/* Question */}
          <div style={{ fontSize: 15, color: '#9ca3af', marginBottom: 52 }}>
            If this came on shuffle right now...
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 20 }}>
            {/* ▶ Play */}
            <button
              onClick={() => handlePick(5)}
              disabled={animating}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                border: 'none',
                borderRadius: 22,
                padding: '24px 30px',
                cursor: animating ? 'default' : 'pointer',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 600,
                minWidth: 114,
                boxShadow: '0 4px 24px rgba(168,85,247,0.4)',
                WebkitTapHighlightColor: 'transparent',
                animation: animating ? 'shuffle-btn-pop 0.3s ease' : 'none',
              }}
            >
              {/* Standard play triangle */}
              <svg width={46} height={46} viewBox="0 0 24 24" fill="none">
                <polygon points="6,3 21,12 6,21" fill="white" />
              </svg>
              Play
            </button>

            {/* ⏭ Skip */}
            <button
              onClick={() => handlePick(1)}
              disabled={animating}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                background: '#f9fafb',
                border: '1.5px solid #e5e7eb',
                borderRadius: 22,
                padding: '24px 30px',
                cursor: animating ? 'default' : 'pointer',
                color: '#6b7280',
                fontSize: 15,
                fontWeight: 600,
                minWidth: 114,
                WebkitTapHighlightColor: 'transparent',
                animation: animating ? 'shuffle-btn-pop 0.3s ease' : 'none',
              }}
            >
              {/* Skip-forward: two chevrons + a bar */}
              <svg width={46} height={46} viewBox="0 0 24 24" fill="none">
                <polygon points="4,5 11,12 4,19" fill="#9ca3af" />
                <polygon points="11,5 18,12 11,19" fill="#d1d5db" />
                <rect x="19.5" y="5" width="2" height="14" rx="1" fill="#9ca3af" />
              </svg>
              Skip
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main QuickScore overlay ───────────────────────────────────────────────────
// songs         — displaySongs array [{name, index}] from SongList
// albumId       — used to look up bridge lyrics and ratings
// albumName/Icon— display info
// activeCategories — [{id, name, weight}]
// ratings       — raw ratings object from useRatings
// onRate(songIndex, catId, val) — saves a rating
// onClose       — dismisses the overlay
// spotify       — object from useSpotify (optional; omit to disable Spotify features)
// spotifyAutoplay — boolean; when true, song plays automatically on each advance
// onGoToSpotifySettings — callback to navigate the user to the Settings tab
export default function QuickScore({
  songs,
  albumId,
  albumName,
  albumIcon,
  activeCategories,
  ratings,
  onRate,
  onClose,
  initialSongPos = 0,
  spotify,
  spotifyAutoplay = true,
  onGoToSpotifySettings,
}) {
  const [songPos, setSongPos] = useState(initialSongPos);
  const [catPos, setCatPos] = useState(0);
  const [done, setDone] = useState(false);
  const [showTrees, setShowTrees] = useState(false);

  const isSingleSong = songs.length === 1;

  // ── Spotify autoplay: start playing whenever the song changes ────────────
  useEffect(() => {
    if (!spotify?.isConnected || !spotify?.playerReady || !spotifyAutoplay) return;
    const song = songs[songPos];
    if (!song) return;
    spotify.playTrack(albumId, song.index, song.name, albumName);
  }, [songPos, spotify?.playerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pause when QuickScore closes ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      spotify?.pause?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-compute effective categories per song.
  // • Bridge is skipped for songs without bridge lyrics.
  // • Replay (Skip on shuffle?) is always sorted to the front when present.
  const songsWithCats = songs.map(song => {
    let cats = activeCategories.map(cat =>
      cat.id === 'bridge' && getBridgeLyrics(albumId, song.index) === null
        ? { ...cat, noBridge: true }
        : cat
    );
    const replayIdx = cats.findIndex(c => c.id === 'replay');
    if (replayIdx > 0) {
      cats = [cats[replayIdx], ...cats.slice(0, replayIdx), ...cats.slice(replayIdx + 1)];
    }
    return { ...song, cats };
  });

  const totalSteps = songsWithCats.reduce((acc, s) => acc + s.cats.length, 0);
  const completedSteps =
    songsWithCats.slice(0, songPos).reduce((acc, s) => acc + s.cats.length, 0) + catPos;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const currentSong = songsWithCats[songPos];
  const currentCat = currentSong?.cats[catPos];

  const currentRating =
    currentSong && currentCat
      ? ratings[`${albumId}_${currentSong.index}`]?.[currentCat.id] || 0
      : 0;

  // Bridge lyrics — shown inline when rating the bridge category.
  const bridgeLyrics = currentSong
    ? getBridgeLyrics(albumId, currentSong.index)
    : null;

  // Snippet lyrics — best available section (bridge > chorus > verse 1) for the
  // shuffle screen background. Covers nearly every song, not just ones with bridges.
  const snippetLyrics = currentSong
    ? getSnippetLyrics(albumId, currentSong.index)
    : null;

  // Whether the current question is the bridge category
  const showBridgeLyrics = currentCat?.id === 'bridge' && bridgeLyrics;

  const isFirstStep = songPos === 0 && catPos === 0;

  function goBack() {
    if (catPos > 0) {
      setCatPos(catPos - 1);
    } else if (songPos > 0) {
      const prevSong = songsWithCats[songPos - 1];
      setSongPos(songPos - 1);
      setCatPos(prevSong.cats.length - 1);
    }
  }

  function advance() {
    const nextCat = catPos + 1;
    if (nextCat >= currentSong.cats.length) {
      const nextSong = songPos + 1;
      if (nextSong >= songsWithCats.length) {
        setDone(true);
      } else {
        setSongPos(nextSong);
        setCatPos(0);
      }
    } else {
      setCatPos(nextCat);
    }
  }

  function handleRate(val) {
    onRate(currentSong.index, currentCat.id, val);
    if (currentSong.name === 'Wood') setShowTrees(true);
    advance();
  }

  // Called by ShuffleScreen after its own transition animation finishes (~720ms)
  function handleShufflePick(val) {
    onRate(currentSong.index, currentCat.id, val);
    advance();
  }

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: (currentCat && currentCat.id !== 'replay')
      ? (CAT_BACKGROUNDS[currentCat.id] ?? '#ffffff')
      : '#ffffff',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'background 0.3s ease',
  };

  if (done) {
    return (
      <div style={overlayStyle}>
        <DoneFlash
          albumIcon={albumIcon}
          albumName={albumName}
          songName={songs[0]?.name}
          isSingleSong={isSingleSong}
          onClose={onClose}
        />
      </div>
    );
  }

  const isShuffleQuestion = currentCat?.id === 'replay';
  const isNoBridgeNotice = currentCat?.noBridge === true;

  return (
    <div style={overlayStyle}>
      {showTrees && <FallingTrees onDone={() => setShowTrees(false)} />}

      {/* Progress bar */}
      <div style={{ height: 4, background: '#f3e8ff', flexShrink: 0 }}>
        <div
          style={{
            height: '100%',
            background: '#a855f7',
            width: `${progress}%`,
            transition: 'width 0.25s ease',
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>

      {/* Top bar — back + song counter + exit */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        flexShrink: 0,
      }}>
        <button
          onClick={goBack}
          disabled={isFirstStep}
          style={{
            background: 'none',
            border: '0.5px solid #e5e7eb',
            borderRadius: 8,
            padding: '5px 12px',
            cursor: isFirstStep ? 'default' : 'pointer',
            fontSize: 13,
            color: '#6b7280',
            opacity: isFirstStep ? 0 : 1,
            pointerEvents: isFirstStep ? 'none' : 'auto',
          }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          {isSingleSong ? '\u00a0' : `Song ${songPos + 1} of ${songs.length}`}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: '0.5px solid #e5e7eb',
            borderRadius: 8,
            padding: '5px 12px',
            cursor: 'pointer',
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          ✕ Exit
        </button>
      </div>

      {/* ── Spotify mini player ── */}
      <SpotifyMiniPlayer
        isConnected={!!spotify?.isConnected}
        playerReady={!!spotify?.playerReady}
        isPlaying={!!spotify?.isPlaying}
        songName={currentSong?.name}
        onTogglePlay={spotify?.togglePlay}
        onGoToSettings={onGoToSpotifySettings}
      />

      {/* ── No-bridge notice ── */}
      {isNoBridgeNotice ? (
        <NoBridgeScreen
          key={`${songPos}-nobridge`}
          songName={currentSong.name}
          onContinue={advance}
        />
      ) : isShuffleQuestion ? (
        <ShuffleScreen
          key={`${songPos}-shuffle`}
          song={currentSong}
          albumName={albumName}
          albumIcon={albumIcon}
          lyrics={snippetLyrics}
          onPick={handleShufflePick}
        />
      ) : (
        /* ── Normal star-rating question ── */
        <div
          key={`${songPos}-${catPos}`}
          style={{
            position: 'relative',
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 28px 20px',
            gap: 0,
            textAlign: 'center',
          }}
        >
          {/* Floating lyrics background */}
          <FloatingLyrics key={`${songPos}-lyrics`} lyrics={snippetLyrics} />

          {/* Center content sits above the floating lyrics */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

          {/* Album context */}
          <div style={{ fontSize: 12, color: '#c4b5fd', marginBottom: 20, letterSpacing: '0.02em' }}>
            {albumIcon} {albumName}
          </div>

          {/* Song name */}
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: currentCat?.id === 'lyrics' ? 16 : 32, maxWidth: 320 }}>
            {currentSong?.name}
          </div>

          {/* Category label */}
          <div style={{ fontSize: 11, fontWeight: 600, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            {currentCat?.name}
          </div>
          <div style={{ fontSize: 12, color: '#c4b5fd', marginBottom: currentCat?.id === 'lyrics' ? 14 : 32 }}>
            Category {catPos + 1} of {currentSong?.cats.length}
          </div>

          {/* Lyric scroller — shown when rating the Lyrics category */}
          {currentCat?.id === 'lyrics' && snippetLyrics && (
            <LyricScroller key={`${songPos}`} lyrics={snippetLyrics} />
          )}

          {/* Bridge lyrics (if applicable) */}
          {showBridgeLyrics && (
            <div style={{
              fontSize: 12,
              color: '#a78bfa',
              fontStyle: 'italic',
              marginBottom: 28,
              maxWidth: 300,
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
            }}>
              "{bridgeLyrics}"
            </div>
          )}

          {/* Stars */}
          <StarPicker
            key={`${songPos}-${catPos}`}
            currentRating={currentRating}
            onRate={handleRate}
            labels={STAR_LABELS[currentCat?.id] ?? null}
          />

          {/* Skip */}
          <button
            onClick={advance}
            style={{
              marginTop: 28,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: '#9ca3af',
              padding: '8px 20px',
            }}
          >
            Skip →
          </button>

          </div>
        </div>
      )}

      {/* Bottom progress bar + label */}
      <div style={{ padding: '0 20px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>{Math.round(progress)}% complete</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {songs.length - songPos} {songs.length - songPos === 1 ? 'song' : 'songs'} left on {albumName}
          </span>
        </div>
        <div style={{ height: 8, background: '#f3e8ff', borderRadius: 99 }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
            width: `${progress}%`,
            borderRadius: 99,
            transition: 'width 0.25s ease',
          }} />
        </div>
      </div>
    </div>
  );
}
