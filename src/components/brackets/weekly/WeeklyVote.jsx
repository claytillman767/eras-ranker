// Weekly bracket — Voting Matchup.
// One matchup at a time, two big tappable song cards stacked vertically.
// Recreated from design_handoff_weekly_bracket/vote.jsx against the real
// catalog: a "song" is { name, albumId, songIndex }; its visuals come from
// getEra(song.albumId).
//
// Tap a card → it locks in with a gold ring + ✓ + the other card dims, then
// after a short confirm beat onVote(winnerSong) fires so the parent can post
// the vote and advance. (The design shows the selected state; one tap = one
// vote, no separate confirm button.)

import { useState, useRef, useEffect } from 'react';
import { FeedbackLauncher } from '../../FeedbackButton';
import {
  ArenaBg, Eyebrow, ProgressDots, VoteCard, VsDivider,
  GOLD_LT, fontUI, fontDisplay,
} from './WeeklyParts';

const CONFIRM_MS = 460; // how long the selected state shows before advancing

export default function WeeklyVote({
  leftSong, rightSong,
  categoryName = 'Best Bridge',
  roundNumber = 1,
  matchupIndex = 0,
  totalMatchups = 8,
  liveCount = 0,
  onVote,
  onClose,
  onSkip,
}) {
  const [picked, setPicked] = useState(null); // 'left' | 'right' | null
  const lockRef = useRef(false);
  const timerRef = useRef(null);

  // Reset selection whenever a new matchup comes in.
  useEffect(() => {
    setPicked(null);
    lockRef.current = false;
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [leftSong, rightSong, matchupIndex]);

  function choose(side) {
    if (lockRef.current) return;
    lockRef.current = true;
    setPicked(side);
    const winner = side === 'left' ? leftSong : rightSong;
    timerRef.current = setTimeout(() => onVote && onVote(winner), CONFIRM_MS);
  }

  const liveLabel = liveCount > 0 ? liveCount.toLocaleString() : null;

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      color: '#fff', fontFamily: fontUI, overflow: 'hidden',
    }}>
      <ArenaBg />

      {/* top chrome */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '60px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onClose} style={{
            appearance: 'none', cursor: 'pointer',
            width: 36, height: 36, borderRadius: 18,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600,
          }}>×</button>
          <FeedbackLauncher variant="overlay" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Eyebrow color={GOLD_LT}>Round {roundNumber} · {categoryName}</Eyebrow>
          <ProgressDots total={totalMatchups} current={matchupIndex} dark />
        </div>
        <div style={{
          minWidth: 36, height: 36, borderRadius: 18, padding: '0 8px',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
          color: GOLD_LT,
        }}>{matchupIndex + 1}/{totalMatchups}</div>
      </div>

      {/* prompt */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '18px 24px 0', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: fontDisplay, fontSize: 26, lineHeight: 1.15,
          letterSpacing: -0.3,
        }}>Which one wins?</div>
        <div style={{
          marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.55)',
        }}>Tap a card to vote · matchup {matchupIndex + 1} of {totalMatchups}</div>
      </div>

      {/* cards */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '20px 20px 0',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <VoteCard song={leftSong}
          picked={picked === 'left'} dimmed={picked && picked !== 'left'}
          disabled={!!picked}
          onTap={() => choose('left')} />

        <VsDivider />

        <VoteCard song={rightSong}
          picked={picked === 'right'} dimmed={picked && picked !== 'right'}
          disabled={!!picked}
          onTap={() => choose('right')} />
      </div>

      {/* bottom: skip */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 40,
        zIndex: 2, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      }}>
        {onSkip && (
          <button onClick={onSkip} disabled={!!picked} style={{
            appearance: 'none', border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600,
            fontFamily: fontUI, cursor: picked ? 'default' : 'pointer', padding: 0,
          }}>skip →</button>
        )}
      </div>

      <style>{`
        @keyframes weeklyPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
