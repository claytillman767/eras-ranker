// Custom-bracket Matchup — the "Which one wins?" voting screen.
// Restyled to match the weekly bracket's arena experience: a dark navy arena,
// two big stacked era-gradient song cards, one tap to crown a winner (gold ring
// + ✓), then it advances. A personal bracket has no other voters, so — unlike
// the weekly flow — there are NO community percentages, no "skip", and no live
// counter. The shared VoteCard/VsDivider/ArenaBg primitives keep it pixel-
// consistent with WeeklyVote.

import { useState, useRef, useEffect } from 'react';
import { FeedbackLauncher } from '../FeedbackButton';
import {
  ArenaBg, Eyebrow, ProgressDots, VoteCard, VsDivider,
  GOLD_LT, fontUI, fontDisplay,
} from './weekly/WeeklyParts';

const CONFIRM_MS = 460; // selected state shows briefly, then advances

export default function Matchup({
  song1,
  song2,
  weekLabel,          // bracket display name (e.g. "My Fav Bops")
  emoji,              // optional per-bracket emoji
  roundIndex,
  totalRounds,
  matchupIndex,
  matchupsInRound,
  onVote,             // (winnerSong) => void — fires when the matchup is decided
  onClose,            // top-left × — exits to Tree (parent decides)
  onSeeBracket,       // bottom link — opens Tree
}) {
  const [picked, setPicked] = useState(null); // 'left' | 'right' | null
  const lockRef = useRef(false);
  const timerRef = useRef(null);

  // Reset whenever the matchup swaps out (parent rotates through the bracket).
  const matchupKey = `${song1.albumId}_${song1.songIndex}__${song2.albumId}_${song2.songIndex}`;
  useEffect(() => {
    setPicked(null);
    lockRef.current = false;
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [matchupKey]);

  function choose(side) {
    if (lockRef.current) return;
    lockRef.current = true;
    setPicked(side);
    const winner = side === 'left' ? song1 : song2;
    timerRef.current = setTimeout(() => onVote && onVote(winner), CONFIRM_MS);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      maxWidth: 700, margin: '0 auto',
      color: '#fff', fontFamily: fontUI,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      <ArenaBg />

      {/* top chrome */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '20px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onClose} aria-label="Close" style={{
            appearance: 'none', cursor: 'pointer',
            width: 36, height: 36, borderRadius: 18,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600,
          }}>×</button>
          <FeedbackLauncher variant="overlay" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Eyebrow color={GOLD_LT}>Round {roundIndex + 1} · {emoji ? `${emoji} ` : ''}{weekLabel}</Eyebrow>
          <ProgressDots total={totalRounds} current={roundIndex} dark />
        </div>
        <div style={{
          minWidth: 36, height: 36, borderRadius: 18, padding: '0 8px',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
          color: GOLD_LT,
        }}>{matchupIndex + 1}/{matchupsInRound}</div>
      </div>

      {/* prompt */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '18px 24px 0', textAlign: 'center', flexShrink: 0,
      }}>
        <div style={{ fontFamily: fontDisplay, fontSize: 26, lineHeight: 1.15, letterSpacing: -0.3 }}>
          Which one wins?
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
          Tap a card to vote · matchup {matchupIndex + 1} of {matchupsInRound}
        </div>
      </div>

      {/* cards */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '20px 20px 0',
        display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0,
      }}>
        <VoteCard song={song1}
          picked={picked === 'left'} dimmed={picked && picked !== 'left'}
          disabled={!!picked}
          onTap={() => choose('left')} />
        <VsDivider />
        <VoteCard song={song2}
          picked={picked === 'right'} dimmed={picked && picked !== 'right'}
          disabled={!!picked}
          onTap={() => choose('right')} />
      </div>

      {/* spacer pushes the footer down on tall screens; collapses on short ones */}
      <div style={{ flex: 1, minHeight: 18 }} />

      {/* bottom: see full bracket (back lives on the × top-left) */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '12px 24px 34px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {onSeeBracket && (
          <button onClick={onSeeBracket} disabled={!!picked} style={{
            appearance: 'none', border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600,
            fontFamily: fontUI, cursor: picked ? 'default' : 'pointer', padding: 0,
          }}>See full bracket →</button>
        )}
      </div>
    </div>
  );
}
