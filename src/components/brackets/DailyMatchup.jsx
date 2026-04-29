import { useState } from 'react';
import { getEraColors } from '../../constants/eraColors';
import { ALBUMS } from '../../data/albums';
import { getCommunityVotePercent, getCurrentWeekNumber } from '../../constants/bracketCategories';

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

function SpotifyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <path
        d="M17.25 16.31c-.19.31-.6.41-.91.22-2.49-1.52-5.63-1.87-9.33-1.02-.35.08-.7-.13-.79-.48-.08-.35.13-.7.48-.79 4.05-.93 7.52-.53 10.33 1.16.31.19.41.6.22.91zm1.26-2.81c-.24.38-.75.5-1.13.27-2.85-1.75-7.19-2.26-10.56-1.24-.43.13-.88-.11-1.01-.54-.13-.43.11-.88.54-1.01 3.86-1.17 8.66-.6 11.89 1.4.38.23.5.75.27 1.12zm.11-2.93c-3.42-2.03-9.07-2.21-12.33-1.22-.51.16-1.06-.13-1.22-.64-.16-.51.13-1.06.64-1.22C9.12 6.33 15.3 6.54 19.21 8.9c.46.27.61.86.34 1.32-.27.46-.86.61-1.32.34z"
        fill="white"
      />
    </svg>
  );
}

function DailySongCard({ song, onPick, chosen, isWinner, spotify }) {
  const colors = getEraColors(song.albumId);
  const album = ALBUMS.find(a => a.id === song.albumId);
  const textColor = song.albumId === 'rp' ? '#e5e5e5' : colors.text;
  const canPlayBridge = spotify?.isConnected && spotify?.playerReady;

  function handlePlayBridge(e) {
    e.stopPropagation(); // don't trigger the vote tap
    spotify.playTrack(song.albumId, song.songIndex, song.name, album?.name || '', 'bridge');
  }

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
        minHeight: 110,
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
            onClick={handlePlayBridge}
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
            <SpotifyIcon />
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

  if (!dailyState) return null;

  const weekNumber = getCurrentWeekNumber();

  if (dailyState.done) {
    return (
      <>
        <style>{DAILY_STYLE}</style>
        <div style={{
          padding: '24px 0 8px',
          textAlign: 'center',
          animation: 'daily-done-pop 0.4s ease both',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            Daily picks done!
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Come back tomorrow for new matchups.
          </div>
          <button onClick={onClose} style={{
            padding: '9px 20px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            color: '#374151',
            fontSize: 13,
            cursor: 'pointer',
          }}>
            Close
          </button>
        </div>
      </>
    );
  }

  const currentIndex = dailyState.currentIndex;
  const matchup = dailyState.matchups[currentIndex];
  if (!matchup) return null;

  const progress = currentIndex / dailyState.matchups.length;

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
    }, 1400);
  }

  const song1IsWinner = chosen &&
    chosen.albumId === matchup.song1.albumId &&
    chosen.songIndex === matchup.song1.songIndex;
  const song2IsWinner = chosen &&
    chosen.albumId === matchup.song2.albumId &&
    chosen.songIndex === matchup.song2.songIndex;

  const remaining = dailyState.matchups.length - currentIndex;

  return (
    <>
      <style>{DAILY_STYLE}</style>
      <div style={{ paddingBottom: 8 }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', letterSpacing: '0.08em' }}>
              ☀️ DAILY MATCHUP
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {remaining} matchup{remaining !== 1 ? 's' : ''} left today
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#9ca3af', fontSize: 18, cursor: 'pointer', lineHeight: 1,
          }}>
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#f3f4f6', borderRadius: 2, marginBottom: 12 }}>
          <div style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #a855f7, #d4af37)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Question label */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textAlign: 'center', marginBottom: 10 }}>
          Which bridge hits harder?
        </div>

        {/* Cards */}
        <div key={animKey} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <DailySongCard song={matchup.song1} onPick={handlePick} chosen={!!chosen} isWinner={song1IsWinner} spotify={spotify} />
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', flexShrink: 0 }}>VS</div>
          <DailySongCard song={matchup.song2} onPick={handlePick} chosen={!!chosen} isWinner={song2IsWinner} spotify={spotify} />
        </div>

        {/* Community feedback */}
        {chosen && communityPercent != null && (
          <div style={{
            textAlign: 'center',
            background: '#f5f3ff',
            border: '1px solid #e9d5ff',
            borderRadius: 10,
            padding: '9px',
            fontSize: 13,
            color: '#7c3aed',
            marginBottom: 10,
          }}>
            {communityPercent}% of Swifties agree with you
            {communityPercent < 50 && ' — bold pick 👀'}
          </div>
        )}

        {/* Keep going prompt */}
        {!chosen && currentIndex === dailyState.matchups.length - 1 && onKeepGoing && (
          <button onClick={onKeepGoing} style={{
            width: '100%',
            padding: '10px',
            background: '#f5f3ff',
            border: '1px solid #e9d5ff',
            borderRadius: 10,
            color: '#7c3aed',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Keep going → Start a full bracket
          </button>
        )}
      </div>
    </>
  );
}
