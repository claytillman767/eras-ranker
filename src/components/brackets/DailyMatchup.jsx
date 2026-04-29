import { useState } from 'react';
import { getEraColors } from '../../constants/eraColors';
import { getSnippetLyrics } from '../../data/snippetLyrics';
import { ALBUMS } from '../../data/albums';
import { getCommunityVotePercent, getCurrentWeekNumber } from '../../constants/bracketCategories';

const DAILY_STYLE = `
@keyframes daily-slide-in {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes daily-win {
  0% { transform: scale(1); }
  40% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
@keyframes daily-done-pop {
  0% { opacity: 0; transform: scale(0.85); }
  70% { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
`;

function DailySongCard({ song, onPick, chosen, isWinner }) {
  const colors = getEraColors(song.albumId);
  const album = ALBUMS.find(a => a.id === song.albumId);
  const lyric = getSnippetLyrics(song.albumId, song.songIndex);
  const textColor = song.albumId === 'rp' ? '#e5e5e5' : colors.text;

  return (
    <div
      onClick={() => !chosen && onPick(song)}
      style={{
        flex: 1,
        borderRadius: 16,
        padding: '16px',
        background: `linear-gradient(145deg, ${colors.primary}, ${colors.secondary})`,
        cursor: chosen ? 'default' : 'pointer',
        userSelect: 'none',
        minHeight: 140,
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
      onMouseEnter={e => {
        if (!chosen) e.currentTarget.style.transform = 'scale(1.02)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <div>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          color: textColor,
          opacity: 0.65,
          marginBottom: 5,
        }}>
          {album?.icon} {album?.name}
        </div>
        <div style={{
          fontSize: 16,
          fontWeight: 800,
          color: textColor,
          lineHeight: 1.25,
          marginBottom: 8,
        }}>
          {song.name}
        </div>
        {lyric && (
          <div style={{
            fontSize: 10,
            color: textColor,
            opacity: 0.7,
            fontStyle: 'italic',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            "{lyric.split('\n')[0]}"
          </div>
        )}
      </div>
      {isWinner && (
        <div style={{ textAlign: 'right', fontSize: 18 }}>👑</div>
      )}
    </div>
  );
}

export default function DailyMatchup({ dailyState, onVote, onClose, onKeepGoing }) {
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
          background: '#0f172a',
          borderRadius: 20,
          padding: '32px 20px',
          textAlign: 'center',
          animation: 'daily-done-pop 0.4s ease both',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
            Daily picks done!
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            You voted on all 3 of today's matchups. Come back tomorrow!
          </div>
          <button onClick={onClose} style={{
            padding: '11px 24px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            color: '#94a3b8',
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
      <div style={{
        background: '#0f172a',
        borderRadius: 20,
        padding: '20px 16px 16px',
        position: 'relative',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', letterSpacing: '0.08em' }}>
              ☀️ DAILY MATCHUP
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {remaining} matchup{remaining !== 1 ? 's' : ''} left today
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#475569', fontSize: 18, cursor: 'pointer',
          }}>
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginBottom: 14 }}>
          <div style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #a855f7, #d4af37)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Matchup question */}
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#64748b',
          textAlign: 'center',
          marginBottom: 10,
        }}>
          Which bridge hits harder?
        </div>

        {/* Cards */}
        <div key={animKey} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <DailySongCard
            song={matchup.song1}
            onPick={handlePick}
            chosen={!!chosen}
            isWinner={song1IsWinner}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#475569',
            flexShrink: 0,
          }}>
            VS
          </div>
          <DailySongCard
            song={matchup.song2}
            onPick={handlePick}
            chosen={!!chosen}
            isWinner={song2IsWinner}
          />
        </div>

        {/* Community feedback */}
        {chosen && communityPercent != null && (
          <div style={{
            textAlign: 'center',
            background: 'rgba(168,85,247,0.1)',
            border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 10,
            padding: '10px',
            fontSize: 13,
            color: '#c084fc',
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
            padding: '11px',
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 10,
            color: '#c084fc',
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
