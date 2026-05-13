import { useState, useEffect, useRef } from 'react';
import { getEraColors } from '../../constants/eraColors';
import { ALL_ALBUMS } from '../../data/albums';
import { getCommunityVotePercent, getCurrentWeekNumber } from '../../constants/bracketCategories';
import SpotifyBadge from '../SpotifyBadge';

const DAILY_STYLE = `
@keyframes daily-slide-in {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes daily-done-pop {
  0% { opacity: 0; transform: scale(0.85); }
  70% { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
`;

function DailySongCard({ song, onPick, chosen, isWinner, onPlayBridge, canPlayBridge }) {
  const colors = getEraColors(song.albumId);
  const album = ALL_ALBUMS.find(a => a.id === song.albumId);
  const textColor = song.albumId === 'rp' ? '#e5e5e5' : colors.text;

  return (
    <div
      onClick={() => !chosen && onPick(song)}
      style={{
        flex: 1,
        borderRadius: 16,
        padding: '14px 12px',
        background: `linear-gradient(145deg, ${colors.primary}, ${colors.secondary})`,
        cursor: chosen ? 'default' : 'pointer',
        userSelect: 'none',
        minHeight: 130,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isWinner
          ? `0 0 0 2px #fbbf24, 0 6px 20px rgba(0,0,0,0.2)`
          : '0 2px 10px rgba(0,0,0,0.1)',
        opacity: chosen && !isWinner ? 0.5 : 1,
        animation: `daily-slide-in 0.3s ease both`,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => { if (!chosen) e.currentTarget.style.transform = 'scale(1.02)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: textColor, opacity: 0.65, marginBottom: 4 }}>
          {album?.icon} {album?.name}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: textColor, lineHeight: 1.25 }}>
          {song.name}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        {isWinner && <span style={{ fontSize: 16 }}>👑</span>}
        {canPlayBridge && (
          <button
            onClick={e => { e.stopPropagation(); onPlayBridge(song, album); }}
            aria-label="Play bridge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              borderRadius: 20,
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: textColor,
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            <span style={{ fontSize: 9 }}>▶</span>
            Bridge
          </button>
        )}
      </div>
    </div>
  );
}

export default function DailyMatchup({ dailyState, onVote, onClose, onKeepGoing, spotify }) {
  const [chosen, setChosen] = useState(null);
  const [communityPercent, setCommunityPercent] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const isSpotifyConnected = !!(spotify?.isConnected);
  const hasSpotify = !!(spotify?.isConnected && spotify?.playerReady);
  const autoPlayedRef = useRef(false);

  if (!dailyState) return null;

  const weekNumber = getCurrentWeekNumber();
  const currentIndex = dailyState.currentIndex;
  const matchup = dailyState.done ? null : dailyState.matchups[currentIndex];

  // Auto-play song1's bridge when each matchup loads.
  useEffect(() => {
    if (!matchup || !hasSpotify) return;
    autoPlayedRef.current = false;
  }, [currentIndex]);

  useEffect(() => {
    if (!matchup || !hasSpotify || autoPlayedRef.current) return;
    autoPlayedRef.current = true;
    const album = ALL_ALBUMS.find(a => a.id === matchup.song1.albumId);
    spotify.playTrack(matchup.song1.albumId, matchup.song1.songIndex, matchup.song1.name, album?.name || '', 'bridge');
  }, [hasSpotify, currentIndex, matchup]);

  // Stop music when this screen unmounts.
  useEffect(() => () => { spotify?.pause?.(); }, []);

  function handleClose() {
    spotify?.pause?.();
    onClose();
  }

  function handlePlayBridge(song, album) {
    if (!hasSpotify) return;
    spotify.playTrack(song.albumId, song.songIndex, song.name, album?.name || '', 'bridge');
  }

  function handlePick(song) {
    if (chosen) return;
    setChosen(song);

    const pct = getCommunityVotePercent(weekNumber, currentIndex, true);
    setCommunityPercent(pct);

    setTimeout(() => {
      onVote(currentIndex, song);
      setChosen(null);
      setCommunityPercent(null);
      setAnimKey(k => k + 1);

      // Auto-play next song's bridge after advancing (if not the last matchup).
      if (!dailyState.done) {
        autoPlayedRef.current = false;
      }
    }, 1400);
  }

  if (dailyState.done) {
    return (
      <>
        <style>{DAILY_STYLE}</style>
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: '#ffffff',
          maxWidth: 700, margin: '0 auto',
          display: 'flex', flexDirection: 'column',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Daily Matchup</div>
            <button onClick={handleClose} style={{
              width: 26, height: 26, borderRadius: 13,
              border: '1px solid #111827', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12, color: '#111827',
              padding: 0, lineHeight: 1,
            }}>✕</button>
          </div>
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px',
            animation: 'daily-done-pop 0.4s ease both',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
              Daily picks done!
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Come back tomorrow for new matchups.
            </div>
            <button onClick={handleClose} style={{
              padding: '9px 20px',
              background: '#f3f4f6', border: '1px solid #e5e7eb',
              borderRadius: 10, color: '#374151', fontSize: 13, cursor: 'pointer',
            }}>Close</button>
          </div>
        </div>
      </>
    );
  }

  if (!matchup) return null;

  const progress = currentIndex / dailyState.matchups.length;
  const remaining = dailyState.matchups.length - currentIndex;

  const song1IsWinner = chosen &&
    chosen.albumId === matchup.song1.albumId &&
    chosen.songIndex === matchup.song1.songIndex;
  const song2IsWinner = chosen &&
    chosen.albumId === matchup.song2.albumId &&
    chosen.songIndex === matchup.song2.songIndex;

  return (
    <>
      <style>{DAILY_STYLE}</style>
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
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', letterSpacing: '0.08em' }}>
              ☀️ DAILY MATCHUP
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {remaining} matchup{remaining !== 1 ? 's' : ''} left today
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSpotifyConnected && (
              <button
                onClick={() => spotify?.togglePlay?.()}
                aria-label={spotify?.isPlaying ? 'Pause' : 'Play'}
                style={{
                  width: 26, height: 26, borderRadius: 13,
                  border: '1px solid #a855f7', background: '#f3e8ff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11, color: '#a855f7',
                  padding: 0, lineHeight: 1,
                }}
              >{spotify?.isPlaying ? '⏸' : '▶'}</button>
            )}
            <button
              onClick={handleClose}
              style={{
                width: 26, height: 26, borderRadius: 13,
                border: '1px solid #111827', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12, color: '#111827',
                padding: 0, lineHeight: 1,
              }}
            >✕</button>
          </div>
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

        {/* Body */}
        <div style={{ flex: 1, padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Progress bar */}
          <div style={{ height: 3, background: '#f3f4f6', borderRadius: 2, marginBottom: 14, flexShrink: 0 }}>
            <div style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #a855f7, #d4af37)',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Question label */}
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textAlign: 'center', marginBottom: 12, flexShrink: 0 }}>
            Which bridge hits harder?
          </div>

          {/* Cards */}
          <div key={animKey} style={{ display: 'flex', gap: 10, marginBottom: 14, flex: 1, minHeight: 0 }}>
            <DailySongCard
              song={matchup.song1}
              onPick={handlePick}
              chosen={!!chosen}
              isWinner={song1IsWinner}
              onPlayBridge={handlePlayBridge}
              canPlayBridge={hasSpotify}
            />
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', flexShrink: 0 }}>VS</div>
            <DailySongCard
              song={matchup.song2}
              onPick={handlePick}
              chosen={!!chosen}
              isWinner={song2IsWinner}
              onPlayBridge={handlePlayBridge}
              canPlayBridge={hasSpotify}
            />
          </div>

          {/* Community feedback */}
          {chosen && communityPercent != null && (
            <div style={{
              textAlign: 'center',
              background: '#f5f3ff', border: '1px solid #e9d5ff',
              borderRadius: 10, padding: '9px',
              fontSize: 13, color: '#7c3aed', marginBottom: 10, flexShrink: 0,
            }}>
              {communityPercent}% of Swifties agree with you
              {communityPercent < 50 && ' — bold pick 👀'}
            </div>
          )}

          {/* Keep going prompt */}
          {!chosen && currentIndex === dailyState.matchups.length - 1 && onKeepGoing && (
            <button onClick={onKeepGoing} style={{
              width: '100%', padding: '10px',
              background: '#f5f3ff', border: '1px solid #e9d5ff',
              borderRadius: 10, color: '#7c3aed',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
            }}>
              Keep going → Start a full bracket
            </button>
          )}
        </div>
      </div>
    </>
  );
}
