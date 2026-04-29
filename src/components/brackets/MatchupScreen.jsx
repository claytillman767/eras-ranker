import { useState, useEffect, useCallback } from 'react';
import { getEraColors } from '../../constants/eraColors';
import { getSnippetLyrics } from '../../data/snippetLyrics';
import { getBridgeLyrics } from '../../data/bridgeLyrics';
import { BRACKET_CATEGORIES } from '../../constants/bracketCategories';
import { ALBUMS } from '../../data/albums';

const MATCHUP_STYLE = `
@keyframes win-burst {
  0% { transform: scale(1); }
  40% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
@keyframes lose-fade {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.92) translateY(8px); }
}
@keyframes next-slide {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes bar-grow {
  from { width: 0; }
  to { width: 100%; }
}
`;

function getLyric(categoryId, albumId, songIndex) {
  const cat = BRACKET_CATEGORIES.find(c => c.id === categoryId);
  if (cat?.lyricsContext === 'bridge') {
    return getBridgeLyrics(albumId, songIndex) || getSnippetLyrics(albumId, songIndex);
  }
  return getSnippetLyrics(albumId, songIndex);
}

function SongCard({ song, categoryId, onPick, state, animKey }) {
  const colors = getEraColors(song.albumId);
  const album = ALBUMS.find(a => a.id === song.albumId);
  const lyric = getLyric(categoryId, song.albumId, song.songIndex);

  const isWinner = state === 'winner';
  const isLoser = state === 'loser';

  const isLight = ['fe', 'lv', '89', 'tv', 'fl'].includes(song.albumId);
  const textColor = song.albumId === 'rp' ? '#e5e5e5' : colors.text;

  return (
    <div
      key={animKey}
      onClick={() => state === 'idle' && onPick(song)}
      style={{
        flex: 1,
        borderRadius: 20,
        padding: '20px 18px',
        background: `linear-gradient(145deg, ${colors.primary}, ${colors.secondary})`,
        cursor: state === 'idle' ? 'pointer' : 'default',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isWinner
          ? `0 0 0 3px #fbbf24, 0 8px 32px rgba(0,0,0,0.25)`
          : '0 4px 16px rgba(0,0,0,0.12)',
        animation: isWinner
          ? 'win-burst 0.4s ease-out'
          : isLoser
            ? 'lose-fade 0.35s ease-out forwards'
            : `next-slide 0.3s ease-out`,
        transition: 'box-shadow 0.2s ease',
        opacity: isLoser ? 0 : 1,
      }}
      onMouseEnter={e => {
        if (state !== 'idle') return;
        e.currentTarget.style.transform = 'scale(1.015)';
        e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.2)`;
      }}
      onMouseLeave={e => {
        if (state !== 'idle') return;
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      }}
    >
      {isWinner && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 12,
          fontSize: 22,
          animation: 'win-burst 0.4s ease-out',
        }}>👑</div>
      )}

      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: textColor,
          opacity: 0.7,
          marginBottom: 6,
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <span>{album?.icon}</span>
          <span>{album?.name || song.albumId}</span>
        </div>
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          color: textColor,
          lineHeight: 1.25,
          marginBottom: 10,
        }}>
          {song.name}
        </div>
      </div>

      {lyric && (
        <div style={{
          fontSize: 11,
          color: textColor,
          opacity: 0.75,
          fontStyle: 'italic',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          "{lyric.split('\n').slice(0, 2).join(' / ')}"
        </div>
      )}

      {state === 'idle' && (
        <div style={{
          marginTop: 14,
          padding: '8px 0',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          color: textColor,
          letterSpacing: '0.02em',
        }}>
          Tap to Pick ✓
        </div>
      )}
    </div>
  );
}

export default function MatchupScreen({
  bracket,
  categoryId,
  onPick,
  onBack,
  onExit,
  communityPercent,  // optional — shown after pick in community mode
  showCommunityFeedback,
}) {
  const [pickedSong, setPickedSong] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const roundIndex = bracket.currentRound;
  const matchupIndex = bracket.currentMatchupIndex;
  const round = bracket.rounds[roundIndex];
  const matchup = round?.[matchupIndex];

  const totalRounds = Math.log2(bracket.contestants.length);
  const matchupsInRound = round?.length || 1;

  // Count all matchups completed before this round for overall progress
  const matchupsDoneTotal = bracket.rounds.slice(0, roundIndex).reduce((s, r) => s + r.length, 0) + matchupIndex;
  const totalMatchupsAll = bracket.contestants.length - 1;

  const handlePick = useCallback((song) => {
    if (pickedSong) return;
    setPickedSong(song);

    if (showCommunityFeedback && communityPercent != null) {
      setFeedbackVisible(true);
      setTimeout(() => {
        setFeedbackVisible(false);
        setPickedSong(null);
        setAnimKey(k => k + 1);
        onPick(roundIndex, matchupIndex, song);
      }, 1800);
    } else {
      setTimeout(() => {
        setPickedSong(null);
        setAnimKey(k => k + 1);
        onPick(roundIndex, matchupIndex, song);
      }, 500);
    }
  }, [pickedSong, onPick, roundIndex, matchupIndex, showCommunityFeedback, communityPercent]);

  if (!matchup) return null;

  const cat = BRACKET_CATEGORIES.find(c => c.id === categoryId);

  const song1State = pickedSong
    ? pickedSong.albumId === matchup.song1.albumId && pickedSong.songIndex === matchup.song1.songIndex
      ? 'winner'
      : 'loser'
    : 'idle';
  const song2State = pickedSong
    ? pickedSong.albumId === matchup.song2.albumId && pickedSong.songIndex === matchup.song2.songIndex
      ? 'winner'
      : 'loser'
    : 'idle';

  return (
    <>
      <style>{MATCHUP_STYLE}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0f172a',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 700,
        margin: '0 auto',
      }}>

        {/* ── Top bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 8px',
          flexShrink: 0,
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 20,
              padding: '6px 12px',
              color: '#94a3b8',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#d4af37', letterSpacing: '0.08em' }}>
              {cat?.name}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Round {roundIndex + 1} of {totalRounds} · Match {matchupIndex + 1}/{matchupsInRound}
            </div>
          </div>

          <button
            onClick={onExit}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: 13,
              cursor: 'pointer',
              padding: '6px 8px',
            }}
          >
            Save & Exit
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#1e293b', flexShrink: 0, margin: '0 16px' }}>
          <div style={{
            height: '100%',
            width: `${(matchupsDoneTotal / totalMatchupsAll) * 100}%`,
            background: 'linear-gradient(90deg, #a855f7, #d4af37)',
            borderRadius: 2,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* ── VS label ── */}
        <div style={{
          textAlign: 'center',
          padding: '10px 0 4px',
          flexShrink: 0,
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(168,85,247,0.2)',
            border: '1px solid rgba(168,85,247,0.4)',
            borderRadius: 20,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: '#c084fc',
            letterSpacing: '0.1em',
          }}>
            ⚡ VS ⚡
          </span>
        </div>

        {/* ── Song cards ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '8px 16px 16px',
          overflow: 'hidden',
        }}>
          <SongCard
            song={matchup.song1}
            categoryId={categoryId}
            onPick={handlePick}
            state={song1State}
            animKey={`s1-${animKey}`}
          />
          <SongCard
            song={matchup.song2}
            categoryId={categoryId}
            onPick={handlePick}
            state={song2State}
            animKey={`s2-${animKey}`}
          />
        </div>

        {/* ── Community feedback overlay ── */}
        {feedbackVisible && communityPercent != null && (
          <div style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(168,85,247,0.4)',
            borderRadius: 14,
            padding: '12px 20px',
            textAlign: 'center',
            zIndex: 10,
            minWidth: 220,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>
              {communityPercent >= 50 ? '✅' : '👀'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>
              {communityPercent}% of Swifties agree
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {communityPercent >= 50
                ? 'You\'re with the majority!'
                : 'Bold choice — you\'re in the minority'}
            </div>
          </div>
        )}

        {/* ── Instruction hint ── */}
        {!pickedSong && (
          <div style={{
            textAlign: 'center',
            padding: '0 0 16px',
            fontSize: 12,
            color: '#475569',
            flexShrink: 0,
          }}>
            Tap the song that wins. No overthinking.
          </div>
        )}
      </div>
    </>
  );
}
