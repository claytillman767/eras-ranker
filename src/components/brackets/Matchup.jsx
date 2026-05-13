import { useState, useEffect, useRef } from 'react';
import { ALL_ALBUMS } from '../../data/albums';
import { getEraColors } from '../../constants/eraColors';
import { getSnippetLyrics, getBridgeLyrics } from '../../data/lyricsAccess';
import { BRACKET_CATEGORIES } from '../../constants/bracketCategories';
import SpotifyBadge from '../SpotifyBadge';

// Length of each Spotify clip — matches the wireframe's "~15s clip" copy.
const CLIP_MS = 15000;

const STYLE = `
@keyframes matchup-scale-in {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes matchup-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes matchup-pulse-dot {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}
@keyframes matchup-winner-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.02); }
  100% { transform: scale(1); }
}
@keyframes matchup-bar-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
`;

function getLyric(categoryId, albumId, songIndex) {
  const cat = BRACKET_CATEGORIES.find(c => c.id === categoryId);
  if (cat?.lyricsContext === 'bridge') {
    return getBridgeLyrics(albumId, songIndex) || getSnippetLyrics(albumId, songIndex);
  }
  return getSnippetLyrics(albumId, songIndex);
}

// Eras whose primary text is light (white-ish) — used to flip contrast on bottom progress bars.
const LIGHT_TEXT_ERAS = new Set(['rp', 'ml']);

function MatchupCard({
  song,
  songLabel,
  categoryId,
  state,           // 'queued' | 'playing' | 'played' | 'winner' | 'loser'
  progressPct,    // 0..100, used in 'playing'
  percent,        // 0..100, used in 'winner'/'loser'
  onTap,           // (song) => void  — only wired when card is tappable
  onPlayPause,     // () => void  — toggles audio for this card; null when no Spotify
  isAudible,       // true when this card's song is currently producing audio
}) {
  const colors = getEraColors(song.albumId);
  const album = ALL_ALBUMS.find(a => a.id === song.albumId);
  const lyric = getLyric(categoryId, song.albumId, song.songIndex);

  const isPlaying = state === 'playing';
  const isQueued  = state === 'queued';
  const isPlayed  = state === 'played';
  const isWinner  = state === 'winner';
  const isLoser   = state === 'loser';

  const lightText = LIGHT_TEXT_ERAS.has(song.albumId);

  let boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
  if (isPlaying) boxShadow = '0 0 0 3px #a855f7, 0 1px 2px rgba(0,0,0,0.06)';
  if (isWinner)  boxShadow = '0 0 0 3px #f59e0b, 0 1px 2px rgba(0,0,0,0.06)';

  const tappable = !!onTap;

  return (
    <div
      onClick={() => { if (tappable) onTap(song); }}
      style={{
        flex: 1,
        borderRadius: 16,
        padding: '14px 12px',
        background: `linear-gradient(145deg, ${colors.primary}, ${colors.secondary})`,
        color: colors.text,
        border: '1px solid #e5e7eb',
        boxShadow,
        position: 'relative',
        minHeight: 230,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: tappable ? 'pointer' : 'default',
        opacity: isLoser ? 0.45 : (isQueued ? 0.7 : 1),
        transition: 'opacity 0.35s ease, box-shadow 0.2s ease, transform 0.2s ease',
        animation: isWinner ? 'matchup-winner-pop 0.2s ease-out' : 'matchup-fade-up 0.25s ease-out',
        userSelect: 'none',
      }}
    >
      {/* Top-right status badges */}
      {isWinner && (
        <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 18 }}>♛</div>
      )}
      {isPlaying && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 9, fontWeight: 700, opacity: 0.9,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 3, background: '#ef4444',
            animation: 'matchup-pulse-dot 1s ease-in-out infinite',
          }} />
          now playing
        </div>
      )}
      {isPlayed && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          fontSize: 9, fontWeight: 700, opacity: 0.7,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>✓ heard</div>
      )}

      {/* Top: meta + title + lyric */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, opacity: 0.75,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {songLabel} · {album?.name}
        </div>
        <div style={{
          fontSize: 19, fontWeight: 600, lineHeight: 1.2,
          marginBottom: 8,
        }}>
          {song.name}
        </div>
        {lyric && (
          <div style={{
            fontSize: 11, fontStyle: 'italic', lineHeight: 1.4,
            opacity: 0.85,
            borderLeft: `2px solid ${lightText ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)'}`,
            paddingLeft: 8,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            "{lyric.split('\n').slice(0, 2).join(' / ')}"
          </div>
        )}
      </div>

      {/* Bottom variant — depends on state */}
      {(isPlaying || isPlayed) && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 6,
          }}>
            {onPlayPause && (
              <button
                onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
                aria-label={isAudible ? 'Pause' : 'Play'}
                style={{
                  width: 28, height: 28, borderRadius: 14,
                  background: '#ffffff',
                  border: 'none',
                  color: '#111827',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, padding: 0, lineHeight: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                  flexShrink: 0,
                }}
              >{isAudible ? '⏸' : '▶'}</button>
            )}
            <div style={{
              flex: 1, fontSize: 9, opacity: 0.75,
              display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
            }}>
              <span style={{ fontSize: 11 }}>{isPlaying ? '♪' : '↺'}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isPlaying
                  ? `0:${String(Math.min(15, Math.round((progressPct / 100) * 15))).padStart(2, '0')} / 0:15`
                  : 'replay clip'}
              </span>
              <span style={{ letterSpacing: '0.04em' }}>Spotify</span>
            </div>
          </div>
          <div style={{
            height: 4, borderRadius: 2,
            background: lightText ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${isPlayed ? 100 : progressPct}%`,
              height: '100%',
              background: lightText ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)',
              transition: 'width 120ms linear',
            }} />
          </div>
        </div>
      )}

      {isQueued && (
        <div style={{
          marginTop: 10, padding: '6px 0', textAlign: 'center',
          fontSize: 10, opacity: 0.65,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>up next…</div>
      )}

      {(isWinner || isLoser) && percent != null && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 24, fontWeight: 300, lineHeight: 1 }}>{percent}%</div>
          <div style={{
            height: 6, borderRadius: 3, marginTop: 4,
            background: lightText ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${percent}%`, height: '100%',
              background: lightText ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.5)',
              transformOrigin: 'left center',
              animation: 'matchup-bar-grow 600ms ease-out',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Matchup({
  song1,
  song2,
  categoryId,
  weekLabel,         // e.g., "Best Bridge · Wk 37"
  roundIndex,
  totalRounds,
  matchupIndex,
  matchupsInRound,
  spotify,           // null when user is not Pro / not connected
  onVote,            // (winnerSong) => void  — fires when matchup completes
  onClose,           // top-right ✕ — exits to Tree (parent decides)
  onSeeBracket,      // bottom-right link — opens Tree
  // OPEN QUESTION (README §1): community vote percentages need a real backend
  // counter. For now the parent passes a number (0..100) representing the % of
  // the community that voted for song1. When null, the result strip is muted.
  communityPercentSong1,
}) {
  // isConnected gates the phase state machine; playerReady gates actual playTrack calls.
  // playerReady arrives async (SDK ~1s after mount), so using it for initial phase would
  // lock the machine to 'ready' before Spotify has had a chance to initialize.
  const isSpotifyConnected = !!(spotify?.isConnected);
  const hasSpotify = !!(spotify?.isConnected && spotify?.playerReady);

  // Reset whenever the matchup changes (parent rotates song1/song2 through the bracket).
  const matchupKey = `${song1.albumId}_${song1.songIndex}__${song2.albumId}_${song2.songIndex}`;

  const [phase, setPhase] = useState(isSpotifyConnected ? 'intro' : 'ready');
  const [pickedSong, setPickedSong] = useState(null);
  const [progress1, setProgress1] = useState(0);
  const [progress2, setProgress2] = useState(0);
  // Which slot's song is currently loaded in the Spotify player. Drives the
  // per-card play/pause icon and which action a tap fires (toggle vs replay).
  const [lastPlayedSlot, setLastPlayedSlot] = useState(null);

  const album1 = ALL_ALBUMS.find(a => a.id === song1.albumId);
  const album2 = ALL_ALBUMS.find(a => a.id === song2.albumId);
  const cat = BRACKET_CATEGORIES.find(c => c.id === categoryId);
  const playbackScreen = cat?.spotifyContext || 'shuffle';

  const phaseTimerRef = useRef(null);
  const progressTimerRef = useRef(null);

  function clearTimers() {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  // When the matchup itself swaps out, rewind to the starting phase.
  useEffect(() => {
    setPickedSong(null);
    setProgress1(0);
    setProgress2(0);
    setLastPlayedSlot(null);
    setPhase(isSpotifyConnected ? 'intro' : 'ready');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchupKey]);

  // Drive each phase's behaviour (autoplay, progress bar, auto-advance).
  useEffect(() => {
    clearTimers();

    if (phase === 'intro') {
      // Hold the title card for a beat, then fall through to play1.
      phaseTimerRef.current = setTimeout(() => setPhase('play1'), 600);
      return clearTimers;
    }

    if (phase === 'play1' || phase === 'play2') {
      const isFirst = phase === 'play1';
      const targetSong  = isFirst ? song1 : song2;
      const targetAlbum = isFirst ? album1 : album2;
      const setProgress = isFirst ? setProgress1 : setProgress2;

      setProgress(0);
      setLastPlayedSlot(isFirst ? 1 : 2);
      if (hasSpotify) {
        spotify.playTrack(
          targetSong.albumId,
          targetSong.songIndex,
          targetSong.name,
          targetAlbum?.name,
          playbackScreen,
        );
      }

      const start = Date.now();
      progressTimerRef.current = setInterval(() => {
        const pct = Math.min(100, ((Date.now() - start) / CLIP_MS) * 100);
        setProgress(pct);
      }, 100);

      phaseTimerRef.current = setTimeout(() => {
        setPhase(isFirst ? 'play2' : 'ready');
      }, CLIP_MS);

      return clearTimers;
    }

    if (phase === 'ready') {
      // Idle — the user listens or replays. Stop autoplay so the cards aren't
      // still bleeding song 2 into the silence.
      if (hasSpotify) spotify.pause?.();
      return clearTimers;
    }

    if (phase === 'voted') {
      if (hasSpotify) spotify.pause?.();
      // Auto-advance after the result reveal animates in.
      phaseTimerRef.current = setTimeout(() => {
        if (pickedSong) onVote?.(pickedSong);
      }, 1200);
      return clearTimers;
    }

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, matchupKey]);

  // Pause Spotify when the screen unmounts entirely (e.g. user closes).
  useEffect(() => () => {
    clearTimers();
    if (hasSpotify) spotify.pause?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSkip() {
    if (phase === 'play1') setPhase('play2');
    else if (phase === 'play2') setPhase('ready');
  }

  function handleReplay(slot) {
    if (!hasSpotify) return;
    const song = slot === 1 ? song1 : song2;
    const album = slot === 1 ? album1 : album2;
    spotify.playTrack(song.albumId, song.songIndex, song.name, album?.name, playbackScreen);
    setLastPlayedSlot(slot);
  }

  // Per-card play/pause: toggles when the slot's song is already loaded;
  // otherwise switches the player to that slot's song.
  function handleSlotPlayPause(slot) {
    if (!hasSpotify) return;
    if (lastPlayedSlot === slot) {
      spotify.togglePlay?.();
    } else {
      handleReplay(slot);
    }
  }

  function handleVote(song) {
    // Vote-lock rule: only tappable in 'ready' phase.
    if (phase !== 'ready') return;
    setPickedSong(song);
    setPhase('voted');
  }

  function handleAdvanceNow() {
    clearTimers();
    if (hasSpotify) spotify.pause?.();
    if (pickedSong) onVote?.(pickedSong);
  }

  // Determine each card's visual state from the phase + pick.
  const pickedSong1 = pickedSong &&
    pickedSong.albumId === song1.albumId &&
    pickedSong.songIndex === song1.songIndex;

  const card1State =
    phase === 'intro' ? 'queued' :
    phase === 'play1' ? 'playing' :
    phase === 'play2' ? 'played' :
    phase === 'ready' ? 'played' :
    phase === 'voted' ? (pickedSong1 ? 'winner' : 'loser') : 'queued';

  const card2State =
    phase === 'intro' ? 'queued' :
    phase === 'play1' ? 'queued' :
    phase === 'play2' ? 'playing' :
    phase === 'ready' ? 'played' :
    phase === 'voted' ? (pickedSong1 ? 'loser' : 'winner') : 'queued';

  // Result percentages — fall back to 50/50 when no community data is supplied.
  const pct1 = phase === 'voted'
    ? (communityPercentSong1 != null ? communityPercentSong1 : 50)
    : null;
  const pct2 = pct1 == null ? null : 100 - pct1;
  const userAgreementPct = pickedSong1 ? pct1 : pct2;

  // A slot is "audible" when its song is loaded AND Spotify is actively playing.
  const isAudible1 = lastPlayedSlot === 1 && !!spotify?.isPlaying;
  const isAudible2 = lastPlayedSlot === 2 && !!spotify?.isPlaying;

  return (
    <>
      <style>{STYLE}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#ffffff',
        maxWidth: 700, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#111827',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{weekLabel}</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 26, height: 26, borderRadius: 13,
              border: '1px solid #111827',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#111827', padding: 0, lineHeight: 1,
            }}
          >✕</button>
        </div>

        {/* Spotify attribution strip — required when the screen plays Spotify
            audio. White background only (Spotify-green logo branding rule). */}
        {isSpotifyConnected && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 10, padding: '8px 16px',
            background: '#ffffff',
            borderBottom: '1px solid #f3f4f6',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <SpotifyBadge size={24} />
              <span style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.04em' }}>
                Powered by Spotify
              </span>
            </div>
            <a
              href={spotify?.currentSongName
                ? `https://open.spotify.com/search/${encodeURIComponent('Taylor Swift ' + spotify.currentSongName)}`
                : 'https://open.spotify.com'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11, color: '#6b7280',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              Open in Spotify ↗
            </a>
          </div>
        )}

        {/* Round dots + label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 16px 4px', flexShrink: 0,
        }}>
          {Array.from({ length: totalRounds }).map((_, i) => {
            const isCurrent = i === roundIndex;
            const isComplete = i < roundIndex;
            return (
              <span key={i} style={{
                width: 8, height: 8, borderRadius: 4,
                background: isComplete ? '#a855f7' : 'transparent',
                border: `2px solid ${isCurrent ? '#f59e0b' : (isComplete ? '#a855f7' : '#e5e7eb')}`,
                boxSizing: 'border-box',
              }} />
            );
          })}
          <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 6 }}>
            R{roundIndex + 1} · {matchupIndex + 1}/{matchupsInRound}
          </span>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, padding: '8px 16px 14px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0,
        }}>

          {/* Intro overlay — replaces the two cards while it's running */}
          {phase === 'intro' && (
            <div style={{
              flex: 1,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
              color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'matchup-fade-up 0.25s ease-out',
              padding: 24,
            }}>
              <div style={{ textAlign: 'center', maxWidth: '100%' }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#fbbf24',
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  marginBottom: 8,
                }}>First up</div>
                <div style={{
                  fontSize: 48, fontWeight: 200, lineHeight: 1,
                  animation: 'matchup-scale-in 300ms ease-out',
                }}>Song 1</div>
                <div style={{
                  fontSize: 22, fontWeight: 300, color: '#fde68a',
                  marginTop: 8, lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {song1.name} →
                </div>
                <div style={{
                  fontSize: 10, color: '#94a3b8', marginTop: 16,
                  letterSpacing: '0.04em',
                }}>15-sec clip · auto-plays</div>
              </div>
            </div>
          )}

          {/* The two cards (hidden during intro) */}
          {phase !== 'intro' && (
            <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0 }}>
              <MatchupCard
                song={song1}
                songLabel="Song 1"
                categoryId={categoryId}
                state={card1State}
                progressPct={progress1}
                percent={pct1}
                onTap={phase === 'ready' ? handleVote : null}
                onPlayPause={hasSpotify ? () => handleSlotPlayPause(1) : null}
                isAudible={isAudible1}
              />
              <MatchupCard
                song={song2}
                songLabel="Song 2"
                categoryId={categoryId}
                state={card2State}
                progressPct={progress2}
                percent={pct2}
                onTap={phase === 'ready' ? handleVote : null}
                onPlayPause={hasSpotify ? () => handleSlotPlayPause(2) : null}
                isAudible={isAudible2}
              />
            </div>
          )}

          {/* Phase-specific bottom strip */}
          <div style={{ marginTop: 12, flexShrink: 0 }}>
            {phase === 'intro' && (
              <div style={{
                padding: '8px 12px', borderRadius: 10,
                background: '#f3e8ff', border: '1px dashed #a855f7',
                textAlign: 'center', fontSize: 13, color: '#7e22ce',
              }}>
                Listen to both clips, then vote ♪
              </div>
            )}

            {(phase === 'play1' || phase === 'play2') && (
              <div style={{
                padding: '8px 12px', borderRadius: 10,
                background: '#f9fafb', border: '1px dashed #9ca3af',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                  {phase === 'play1'
                    ? 'Song 2 plays automatically next →'
                    : 'Almost there — vote unlocks at end ✓'}
                </span>
                <button
                  onClick={handleSkip}
                  style={{
                    padding: '4px 10px', borderRadius: 12,
                    background: '#ffffff', border: '1px solid #e5e7eb',
                    fontSize: 11, color: '#374151', cursor: 'pointer',
                  }}
                >Skip ⏭</button>
              </div>
            )}

            {phase === 'ready' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hasSpotify && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleReplay(1)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 16,
                        background: '#ffffff', border: '1.5px solid #111827',
                        fontSize: 12, fontWeight: 500, color: '#111827',
                        cursor: 'pointer',
                      }}
                    >↺ Replay 1</button>
                    <button
                      onClick={() => handleReplay(2)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 16,
                        background: '#ffffff', border: '1.5px solid #111827',
                        fontSize: 12, fontWeight: 500, color: '#111827',
                        cursor: 'pointer',
                      }}
                    >↺ Replay 2</button>
                  </div>
                )}
                <div style={{
                  textAlign: 'center', fontSize: 13, color: '#a855f7',
                  fontStyle: 'italic',
                }}>
                  Tap a card to vote ↑
                </div>
              </div>
            )}

            {phase === 'voted' && (
              <div style={{
                padding: '10px 12px', borderRadius: 10,
                background: '#f3e8ff', border: '1px dashed #a855f7',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{
                  fontSize: 14, color: '#7e22ce', fontWeight: 500, textAlign: 'center',
                }}>
                  {communityPercentSong1 != null
                    ? `${userAgreementPct}% of Swifties agree with you ✦`
                    : 'Vote counted ✦'}
                </div>
                <div style={{
                  fontSize: 11, color: '#6b7280', textAlign: 'center',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                }}>
                  <span>Next matchup in 1.2s…</span>
                  <button
                    onClick={handleAdvanceNow}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: '#a855f7', fontSize: 11, fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >Next →</button>
                </div>
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div style={{
            marginTop: 10, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: 11, color: '#6b7280', flexShrink: 0,
          }}>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 11, color: '#6b7280', cursor: 'pointer',
              }}
            >← Back</button>
            {onSeeBracket && (
              <button
                onClick={onSeeBracket}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: 11, color: '#6b7280', cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >See full bracket</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
