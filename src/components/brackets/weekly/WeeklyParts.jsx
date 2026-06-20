// Shared visual primitives for the redesigned weekly bracket.
// Ported from the design handoff (design_handoff_weekly_bracket/parts.jsx) to
// real React + the real album catalog. Inline styles only, per the codebase.
//
// A "song" here is a contestant object from generateBracket: { name, albumId, songIndex }.
// Its era visuals (tile/deep/ink colors + emoji + album name) come from getEra(albumId).

import { Fragment } from 'react';
import { getEra } from '../../../constants/eraColors';

export const ARENA_BG = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)';
export const GOLD = '#d4af37';
export const GOLD_LT = '#f5d97a';
export const PURPLE = '#a855f7';
export const PURPLE_DEEP = '#7c3aed';
export const PURPLE_LT = '#f3e8ff';
export const PURPLE_MD = '#e9d5ff';

export const fontUI = '"Inter", -apple-system, system-ui, sans-serif';
export const fontDisplay = '"Instrument Serif", "Iowan Old Style", Georgia, serif';

// ── Song tile — colored square + emoji ──────────────────────────────────────
export function SongTile({ song, size = 56, glow = false }) {
  const era = getEra(song.albumId);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: size * 0.22,
      background: `linear-gradient(140deg, ${era.tile} 0%, ${era.deep} 130%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5,
      boxShadow: glow
        ? `0 0 0 2px rgba(255,255,255,0.15), 0 8px 22px ${era.tile}55`
        : '0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.18)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,0.22), transparent 55%)',
        pointerEvents: 'none',
      }} />
      <span style={{ position: 'relative', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}>
        {era.emoji}
      </span>
    </div>
  );
}

// ── Song row — tile + title + album, horizontal ─────────────────────────────
export function SongRow({ song, dark = true, size = 'md', muted = false }) {
  const era = getEra(song.albumId);
  const sizes = {
    sm: { tile: 40, title: 15, album: 11, gap: 10 },
    md: { tile: 56, title: 18, album: 12, gap: 14 },
    lg: { tile: 72, title: 22, album: 13, gap: 16 },
  }[size];
  const titleColor = dark ? (muted ? 'rgba(255,255,255,0.5)' : '#fff') : (muted ? 'rgba(0,0,0,0.4)' : '#1a1a2e');
  const albumColor = dark ? (muted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)') : (muted ? 'rgba(0,0,0,0.3)' : 'rgba(26,26,46,0.55)');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: sizes.gap, minWidth: 0 }}>
      <SongTile song={song} size={sizes.tile} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: fontUI, fontWeight: 700, fontSize: sizes.title, color: titleColor,
          lineHeight: 1.15, letterSpacing: -0.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{song.name}</div>
        <div style={{
          fontFamily: fontUI, fontSize: sizes.album, fontWeight: 500,
          color: albumColor, marginTop: 3,
          letterSpacing: 0.4, textTransform: 'uppercase',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{era.name}</div>
      </div>
    </div>
  );
}

// ── Arena background — deep navy gradient with subtle starfield ──────────────
export function ArenaBg({ children, style = {} }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: ARENA_BG,
      overflow: 'hidden', ...style,
    }}>
      <div style={{
        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 520, height: 420,
        background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.18), transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.05) 0.6px, transparent 1.2px),' +
          'radial-gradient(circle at 72% 38%, rgba(255,255,255,0.04) 0.5px, transparent 1px),' +
          'radial-gradient(circle at 36% 78%, rgba(212,175,55,0.07) 0.7px, transparent 1.4px),' +
          'radial-gradient(circle at 84% 84%, rgba(255,255,255,0.04) 0.5px, transparent 1px)',
        backgroundSize: '380px 380px, 220px 220px, 300px 300px, 260px 260px',
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  );
}

// ── Gold pill button (arena CTAs) ───────────────────────────────────────────
export function GoldButton({ children, onClick, full = false, size = 'md' }) {
  const pad = size === 'lg' ? '18px 28px' : size === 'sm' ? '10px 16px' : '14px 22px';
  const fs = size === 'lg' ? 17 : size === 'sm' ? 13 : 15;
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 'none', cursor: 'pointer',
      width: full ? '100%' : undefined,
      padding: pad, borderRadius: 999,
      background: `linear-gradient(180deg, ${GOLD_LT} 0%, ${GOLD} 100%)`,
      color: '#2a1d00', fontFamily: fontUI, fontWeight: 700, fontSize: fs,
      letterSpacing: 0.1,
      boxShadow:
        '0 1px 0 rgba(255,255,255,0.4) inset,' +
        ' 0 -1px 0 rgba(0,0,0,0.15) inset,' +
        ' 0 8px 22px rgba(212,175,55,0.35),' +
        ' 0 2px 6px rgba(0,0,0,0.25)',
    }}>{children}</button>
  );
}

// ── Purple primary button (light contexts) ──────────────────────────────────
export function PurpleButton({ children, onClick, full = false, size = 'md' }) {
  const pad = size === 'lg' ? '18px 28px' : size === 'sm' ? '10px 16px' : '14px 22px';
  const fs = size === 'lg' ? 17 : size === 'sm' ? 13 : 15;
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 'none', cursor: 'pointer',
      width: full ? '100%' : undefined,
      padding: pad, borderRadius: 999,
      background: `linear-gradient(180deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
      color: '#fff', fontFamily: fontUI, fontWeight: 700, fontSize: fs,
      letterSpacing: 0.1,
      boxShadow:
        '0 1px 0 rgba(255,255,255,0.25) inset,' +
        ' 0 -1px 0 rgba(0,0,0,0.2) inset,' +
        ' 0 8px 22px rgba(124,58,237,0.4),' +
        ' 0 2px 6px rgba(0,0,0,0.18)',
    }}>{children}</button>
  );
}

// ── Round progress dots (e.g. 5 of 8) ───────────────────────────────────────
export function ProgressDots({ total, current, dark = true }) {
  const base = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
  const done = dark ? GOLD : PURPLE;
  const now = dark ? GOLD_LT : PURPLE_DEEP;
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < current;
        const isNow = i === current;
        return (
          <div key={i} style={{
            width: isNow ? 22 : 8, height: 8, borderRadius: 4,
            background: isDone ? done : isNow ? now : base,
            transition: 'all 0.3s',
          }} />
        );
      })}
    </div>
  );
}

// ── "Round X of 4" stepper with bracket labels ──────────────────────────────
export function RoundStepper({ round, dark = true }) {
  const labels = ['16', '8', '4', 'Final'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {labels.map((l, i) => {
        const isDone = i < round - 1;
        const isNow = i === round - 1;
        const isLast = i === labels.length - 1;
        return (
          <Fragment key={l}>
            <div style={{
              padding: isNow ? '4px 11px' : '4px 9px',
              borderRadius: 999,
              fontFamily: fontUI, fontWeight: 700, fontSize: 11, letterSpacing: 0.3,
              background: isNow ? (dark ? GOLD : PURPLE) : 'transparent',
              color: isNow ? (dark ? '#2a1d00' : '#fff')
                : isDone ? (dark ? GOLD_LT : PURPLE_DEEP)
                  : (dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
              border: !isNow ? `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}` : 'none',
              textTransform: l === 'Final' ? 'uppercase' : 'none',
            }}>{l}</div>
            {!isLast && (
              <div style={{
                width: 6, height: 1,
                background: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
              }} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Vote bar — animated horizontal bar showing two percentages ──────────────
export function VoteBar({ leftSong, rightSong, leftPct, rightPct, settled = false, leftWon }) {
  const leftEra = getEra(leftSong.albumId);
  const rightEra = getEra(rightSong.albumId);
  return (
    <div style={{
      position: 'relative', height: 56, borderRadius: 16, overflow: 'hidden',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: `${leftPct}%`,
        background: `linear-gradient(90deg, ${leftEra.tile} 0%, ${leftEra.tile}cc 100%)`,
        transition: 'width 60ms linear, opacity .4s',
        opacity: settled && !leftWon ? 0.55 : 1,
      }} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0,
        width: `${rightPct}%`,
        background: `linear-gradient(270deg, ${rightEra.tile} 0%, ${rightEra.tile}cc 100%)`,
        transition: 'width 60ms linear, opacity .4s',
        opacity: settled && leftWon ? 0.55 : 1,
      }} />
      <div style={{
        position: 'absolute', top: 8, bottom: 8, left: '50%',
        width: 1, background: 'rgba(255,255,255,0.25)', transform: 'translateX(-0.5px)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 14px',
        fontFamily: fontUI, fontWeight: 800, fontSize: 18, color: '#fff',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}>
        <span style={{ opacity: leftPct < 5 ? 0 : 1, transition: 'opacity .4s' }}>
          {leftPct > 0 ? `${leftPct}%` : ''}
        </span>
        <span style={{ opacity: rightPct < 5 ? 0 : 1, transition: 'opacity .4s' }}>
          {rightPct > 0 ? `${rightPct}%` : ''}
        </span>
      </div>
    </div>
  );
}

// ── Vote card — big tappable era-gradient song card ─────────────────────────
// Shared by the weekly Voting screen AND the custom-bracket Matchup so both
// flows render identical cards. Tap → it locks in with a gold ring + ✓ and the
// other card dims (the parent drives picked/dimmed/disabled).
export function VoteCard({ song, onTap, picked, dimmed, disabled }) {
  const era = getEra(song.albumId);
  return (
    <button onClick={onTap} disabled={disabled} style={{
      appearance: 'none', border: 'none',
      cursor: disabled ? 'default' : 'pointer',
      width: '100%', textAlign: 'left',
      padding: 0, borderRadius: 22,
      background: `linear-gradient(155deg, ${era.tile} 0%, ${era.deep} 130%)`,
      boxShadow: picked
        ? `0 0 0 3px ${GOLD_LT}, 0 14px 36px ${era.tile}66, 0 6px 14px rgba(0,0,0,0.3)`
        : '0 12px 30px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.18)',
      color: era.ink,
      position: 'relative', overflow: 'hidden',
      opacity: dimmed ? 0.45 : 1,
      transform: picked ? 'scale(1.01)' : 'scale(1)',
      transition: 'transform .25s, opacity .35s, box-shadow .25s',
    }}>
      {/* glossy highlight */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 22,
        background: 'radial-gradient(120% 60% at 25% 0%, rgba(255,255,255,0.28), transparent 55%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'relative', padding: '20px 22px 22px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{
          fontSize: 64, lineHeight: 1, marginBottom: 6,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))',
        }}>{era.emoji}</div>
        <div style={{
          fontFamily: fontUI, fontWeight: 800, fontSize: 28,
          lineHeight: 1.1, letterSpacing: -0.6,
          textShadow: '0 1px 2px rgba(0,0,0,0.18)',
        }}>{song.name}</div>
        <div style={{
          fontFamily: fontUI, fontSize: 12, fontWeight: 600,
          letterSpacing: 1.4, textTransform: 'uppercase',
          opacity: 0.75, marginTop: 2,
        }}>from {era.name}</div>
      </div>
      {picked && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          width: 36, height: 36, borderRadius: 18,
          background: GOLD_LT, color: '#2a1d00',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 800,
          boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
        }}>✓</div>
      )}
    </button>
  );
}

// ── "vs" divider between two stacked vote cards ─────────────────────────────
export function VsDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '-4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.14)' }} />
      <div style={{ fontFamily: fontDisplay, fontStyle: 'italic', fontSize: 22, color: GOLD_LT }}>vs</div>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.14)' }} />
    </div>
  );
}

// ── Section eyebrow ("ROUND 1 · MATCHUP 3 / 8") ─────────────────────────────
export function Eyebrow({ children, color }) {
  return (
    <div style={{
      fontFamily: fontUI, fontSize: 11, fontWeight: 700,
      letterSpacing: 1.6, textTransform: 'uppercase',
      color: color || 'rgba(255,255,255,0.55)',
    }}>{children}</div>
  );
}
