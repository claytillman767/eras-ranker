// Custom-bracket round transition — shown between rounds. Restyled to the
// weekly arena look: navy arena background, gold "round complete" eyebrow,
// era-tile survivor chips, a gold pill CTA. The "Did you know?" trivia card is
// kept — it's a nice beat in the solo flow.

import { useState, useEffect } from 'react';
import { getEra } from '../../constants/eraColors';
import { ArenaBg, GoldButton, Eyebrow, GOLD_LT, fontUI, fontDisplay } from './weekly/WeeklyParts';

const TRANSITION_STYLE = `
@keyframes rt-fade-in-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rt-survivor-pop {
  0%   { opacity: 0; transform: scale(0.8); }
  60%  { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
`;

// Fun trivia facts keyed loosely by song name fragments.
const TRIVIA = [
  { match: 'All Too Well', fact: '"All Too Well (10 Minute Version)" is Taylor\'s longest officially released song and won the Grammy for Best Song Written for Visual Media.' },
  { match: 'Cruel Summer', fact: '"Cruel Summer" was written in 2019 but became a global phenomenon four years later after the Eras Tour.' },
  { match: 'cardigan', fact: '"cardigan" and "august" are both named after items of clothing — the only two songs Taylor has done this for on the same album.' },
  { match: 'Fearless', fact: '"Fearless" became the fastest-certified diamond album by a female artist when its Taylor\'s Version was released.' },
  { match: 'champagne problems', fact: 'Taylor wrote "champagne problems" about a fictional character — it\'s one of the rare folklore/evermore songs told from someone else\'s perspective.' },
  { match: 'Anti-Hero', fact: '"Anti-Hero" spent 8 weeks at #1 on the Billboard Hot 100 — Taylor\'s longest run at the top.' },
  { match: 'Shake It Off', fact: '"Shake It Off" was written in 30 minutes on a day when Taylor was feeling particularly criticized by the media.' },
  { match: 'Love Story', fact: '"Love Story" was written when Taylor was 17 and was inspired by a real-life relationship her parents didn\'t approve of.' },
  { match: 'Lavender Haze', fact: '"Lavender Haze" is a phrase from the 1950s meaning to be in a blissful romantic state — Taylor heard it on Mad Men.' },
  { match: 'exile', fact: '"exile" is a duet with Bon Iver\'s Justin Vernon and was recorded with both artists in the same room — rare for folklore.' },
];

function pickTrivia(survivors) {
  if (!survivors || survivors.length === 0) return null;
  for (const song of survivors) {
    for (const t of TRIVIA) {
      if (song.name.toLowerCase().includes(t.match.toLowerCase())) {
        return t.fact;
      }
    }
  }
  return 'Taylor Swift has sold over 200 million records worldwide — more than any other artist in the 21st century.';
}

function SurvivorChip({ song }) {
  const era = getEra(song.albumId);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: `linear-gradient(135deg, ${era.tile}33, ${era.deep}55)`,
      border: `1px solid ${era.tile}66`,
      borderRadius: 999, padding: '5px 12px 5px 6px',
      animation: 'rt-survivor-pop 0.4s ease-out both',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 7, flexShrink: 0,
        background: `linear-gradient(140deg, ${era.tile}, ${era.deep})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
      }}>{era.emoji}</span>
      <span style={{
        fontSize: 12, fontWeight: 600, color: '#fff',
        maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{song.name}</span>
    </div>
  );
}

export default function RoundTransition({ bracket, completedRoundIndex, onContinue }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 80); return () => clearTimeout(t); }, []);

  const completedRound = bracket.rounds[completedRoundIndex];
  const survivors = completedRound?.map(m => m.winner).filter(Boolean) || [];
  const nextRoundNum = completedRoundIndex + 2;
  const totalRounds = Math.log2(bracket.contestants.length);
  const trivia = pickTrivia(survivors);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      maxWidth: 700, margin: '0 auto',
      color: '#fff', fontFamily: fontUI,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflowY: 'auto',
    }}>
      <style>{TRANSITION_STYLE}</style>
      <ArenaBg />

      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 460, padding: '52px 22px 28px',
        opacity: entered ? 1 : 0,
        transform: entered ? 'none' : 'translateY(16px)',
        transition: 'all 0.4s ease',
      }}>

        {/* Round complete header */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(212,175,55,0.14)',
            border: '1px solid rgba(245,217,122,0.45)',
            borderRadius: 999, padding: '7px 18px', marginBottom: 16,
          }}>
            <Eyebrow color={GOLD_LT}>✦ Round {completedRoundIndex + 1} complete ✦</Eyebrow>
          </div>
          <div style={{ fontFamily: fontDisplay, fontSize: 30, lineHeight: 1.12, letterSpacing: -0.4 }}>
            {survivors.length} song{survivors.length !== 1 ? 's' : ''} moving on
          </div>
          {nextRoundNum <= totalRounds && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
              Round {nextRoundNum} of {totalRounds} is up next
            </div>
          )}
        </div>

        {/* Survivors */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: 16, marginBottom: 22,
        }}>
          <Eyebrow color="rgba(255,255,255,0.5)">Survivors</Eyebrow>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {survivors.map((song, i) => (
              <div key={i} style={{ animationDelay: `${i * 0.06}s` }}>
                <SurvivorChip song={song} />
              </div>
            ))}
          </div>
        </div>

        {/* Trivia */}
        {trivia && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(245,217,122,0.25)',
            borderRadius: 14, padding: 16, marginBottom: 28,
            animation: 'rt-fade-in-up 0.4s ease 0.2s both',
          }}>
            <Eyebrow color={GOLD_LT}>✦ Did you know?</Eyebrow>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, marginTop: 8 }}>
              {trivia}
            </div>
          </div>
        )}

        {/* Continue */}
        <div style={{ animation: 'rt-fade-in-up 0.4s ease 0.3s both' }}>
          <GoldButton full onClick={onContinue}>
            {nextRoundNum <= totalRounds
              ? `Continue to Round ${nextRoundNum} →`
              : 'See the winner →'}
          </GoldButton>
        </div>
      </div>
    </div>
  );
}
