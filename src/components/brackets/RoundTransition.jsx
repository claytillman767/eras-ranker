import { useState, useEffect } from 'react';
import { getEraColors } from '../../constants/eraColors';
import { ALBUMS } from '../../data/albums';

const TRANSITION_STYLE = `
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes survivor-pop {
  0% { opacity: 0; transform: scale(0.8); }
  60% { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
`;

// Fun trivia facts keyed loosely by song name fragments
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
  // Default fun fact
  return 'Taylor Swift has sold over 200 million records worldwide — more than any other artist in the 21st century.';
}

function MiniSongChip({ song }) {
  const colors = getEraColors(song.albumId);
  const album = ALBUMS.find(a => a.id === song.albumId);
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: `linear-gradient(135deg, ${colors.primary}22, ${colors.secondary}44)`,
      border: `1.5px solid ${colors.primary}55`,
      borderRadius: 20,
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      color: '#f1f5f9',
      animation: 'survivor-pop 0.4s ease-out both',
    }}>
      <span>{album?.icon}</span>
      <span style={{
        maxWidth: 150,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{song.name}</span>
    </div>
  );
}

export default function RoundTransition({ bracket, completedRoundIndex, onContinue }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => { setTimeout(() => setEntered(true), 80); }, []);

  const completedRound = bracket.rounds[completedRoundIndex];
  const survivors = completedRound?.map(m => m.winner).filter(Boolean) || [];
  const nextRoundNum = completedRoundIndex + 2;
  const totalRounds = Math.log2(bracket.contestants.length);
  const trivia = pickTrivia(survivors);

  return (
    <>
      <style>{TRANSITION_STYLE}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0f172a',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 700,
        margin: '0 auto',
        padding: '40px 20px 24px',
        overflowY: 'auto',
      }}>
        <div style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : 'translateY(16px)',
          transition: 'all 0.4s ease',
          width: '100%',
          maxWidth: 440,
        }}>

          {/* Round complete badge */}
          <div style={{
            textAlign: 'center',
            marginBottom: 28,
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(212,175,55,0.15)',
              border: '1.5px solid rgba(212,175,55,0.5)',
              borderRadius: 24,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 700,
              color: '#fcd34d',
              letterSpacing: '0.06em',
              marginBottom: 16,
            }}>
              ✦ Round {completedRoundIndex + 1} Complete ✦
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>
              {survivors.length} song{survivors.length !== 1 ? 's' : ''} moving on
            </div>
            {nextRoundNum <= totalRounds && (
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
                Round {nextRoundNum} of {totalRounds} is up next
              </div>
            )}
          </div>

          {/* Survivors grid */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            padding: '16px',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 12, letterSpacing: '0.06em' }}>
              SURVIVORS
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}>
              {survivors.map((song, i) => (
                <div key={i} style={{ animationDelay: `${i * 0.07}s` }}>
                  <MiniSongChip song={song} />
                </div>
              ))}
            </div>
          </div>

          {/* Trivia card */}
          {trivia && (
            <div style={{
              background: 'rgba(168,85,247,0.1)',
              border: '1.5px solid rgba(168,85,247,0.25)',
              borderRadius: 14,
              padding: '16px',
              marginBottom: 28,
              animation: 'fade-in-up 0.4s ease 0.2s both',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', marginBottom: 8, letterSpacing: '0.08em' }}>
                ✦ DID YOU KNOW?
              </div>
              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                {trivia}
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={onContinue}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              border: 'none',
              borderRadius: 16,
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
              animation: 'fade-in-up 0.4s ease 0.3s both',
            }}
          >
            {nextRoundNum <= totalRounds
              ? `Continue to Round ${nextRoundNum} →`
              : 'See the Winner →'}
          </button>
        </div>
      </div>
    </>
  );
}
