import { useMemo, useRef, useState, useEffect, Fragment } from 'react';
import { FeedbackLauncher } from '../FeedbackButton';
import { BRACKET_CATEGORIES } from '../../constants/bracketCategories';
import { ALL_ALBUMS, SONGS } from '../../data/albums';
import { getEraColors } from '../../constants/eraColors';

// ─────────────────────────────────────────────────────────────────────────
// Custom (Pro) bracket builder — 3-step flow + two overlays.
//   Step 1  Pick a category — name the bracket (write your own OR a theme).
//           The name is JUST a label; it does not filter songs.
//   Step 2  Bracket size — 4 / 8 / 16 / 32.
//   Step 3  Pick your songs — hand-pick + randomizer fill, grouped by album.
//   Overlay A  "Your songs" sheet (review / remove picks).
//   Overlay B  "Bracket ready" confirmation (round-1 preview) → onStart.
//
// Built from the design handoff in
// Claude Design/design_handoff_custom_bracket_builder. Uses the app's real
// catalog (ALL_ALBUMS / SONGS), era colors, CSS tokens, and FeedbackLauncher.
// The chosen roster is handed to onStart(categoryId, 'custom', size, name,
// contestants); the engine shuffles it into round-1 pairs.
// ─────────────────────────────────────────────────────────────────────────

const SIZES = [4, 8, 16, 32];
const WARN = '#e0533b';

// rounds + rough time estimate per bracket size
function sizeMeta(n) {
  const rounds = Math.log2(n);            // 4→2, 8→3, 16→4, 32→5
  const mins = Math.round((n - 1) * 0.5); // ~one vote per matchup
  return { rounds, mins: `~${mins} min` };
}

// Theme presets — keyed to the app's real (non-weekly) categories so the
// stored categoryId stays valid (drives the bracket label). Emoji + punchy
// description are presentation only (shown on step 1). Only categories with an
// entry here appear as themes, and they render in BRACKET_CATEGORIES order.
//
// Every theme here is NON-LYRIC by design — judged from the song itself, not
// from a line on screen — because the app's lyric display is off (see
// bracket-planning/README.md rule 4). The old lyric-based presets (Best Bridge /
// Opening Line / Closing Line) are intentionally NOT here so they don't surface
// as themes while lyrics can't be shown.
const THEME_PRESENTATION = {
  'best-breakup':     { emoji: '💔', desc: 'For when it’s truly over' },
  'best-chorus':      { emoji: '🎶', desc: 'The part you scream at concerts' },
  'most-romantic':    { emoji: '🌹', desc: 'The one you send without context' },
  'most-devastating': { emoji: '😭', desc: 'The one that makes you pull over' },
  'best-driving':     { emoji: '🚗', desc: 'Windows down, full volume' },
  'best-hype':        { emoji: '🔥', desc: 'Pre-game, full-confidence energy' },
  'best-revenge':     { emoji: '😈', desc: 'Petty, unbothered, iconic' },
  'best-dance':       { emoji: '🪩', desc: 'The one that fills the floor' },
  'best-summer':      { emoji: '☀️', desc: 'Top down, August heat' },
  'best-fall':        { emoji: '🍂', desc: 'Scarf season, all the feelings' },
  'best-vocal':       { emoji: '🎤', desc: 'Where her voice does the impossible' },
  'most-underrated':  { emoji: '💎', desc: 'The ones that deserved more' },
  'most-iconic':      { emoji: '👑', desc: 'The ones that define her' },
};

const THEMES = BRACKET_CATEGORIES
  .filter(c => !c.isWeekly && THEME_PRESENTATION[c.id])
  .map(c => ({ id: c.id, name: c.name, ...THEME_PRESENTATION[c.id] }));

// Albums that actually have songs, each with its songs pre-keyed.
const ALBUM_SECTIONS = ALL_ALBUMS
  .map(a => ({
    id: a.id,
    name: a.name,
    icon: a.icon,
    songs: (SONGS[a.id] || []).map((name, songIndex) => ({
      name, albumId: a.id, songIndex, key: `${a.id}_${songIndex}`,
    })),
  }))
  .filter(a => a.songs.length > 0);

const ALL_SONGS = ALBUM_SECTIONS.flatMap(a => a.songs);
const SONG_BY_KEY = new Map(ALL_SONGS.map(s => [s.key, s]));
const ALBUM_BY_ID = new Map(ALBUM_SECTIONS.map(a => [a.id, a]));

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Shared presentational bits ─────────────────────────────────────────────
function EraTile({ albumId, s = 36, r = 10 }) {
  const c = getEraColors(albumId);
  return (
    <div style={{
      width: s, height: s, borderRadius: r, flexShrink: 0,
      background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: s * 0.5, lineHeight: 1,
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.18)',
    }}>
      <span style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}>
        {ALBUM_BY_ID.get(albumId)?.icon || '🎵'}
      </span>
    </div>
  );
}

function Chevron({ open, c = 'var(--text-3)', s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{
      transition: 'transform .2s ease', transform: open ? 'rotate(90deg)' : 'none', flexShrink: 0,
    }}>
      <path d="M9 5l7 7-7 7" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckBox({ on }) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 7, flexShrink: 0,
      transition: 'border-color .15s ease, box-shadow .15s ease',
      border: on ? '0 solid transparent' : '2px solid var(--border)',
      background: on ? 'linear-gradient(135deg, var(--brand), var(--brand-2))' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: on ? '0 2px 6px rgba(124,58,237,0.4)' : 'none',
    }}>
      {on && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function Icon({ name, s = 20, c = 'currentColor', sw = 2 }) {
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none' };
  const stroke = { stroke: c, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'back':   return <svg {...common}><path d="M15 5l-7 7 7 7" {...stroke} /></svg>;
    case 'close':  return <svg {...common}><path d="M6 6l12 12M18 6L6 18" {...stroke} /></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="7" {...stroke} /><path d="M20 20l-3.5-3.5" {...stroke} /></svg>;
    case 'shuffle':return <svg {...common}><path d="M16 4h4v4M20 4l-6 6M4 20l6-6M16 20h4v-4M4 4l4.5 4.5" {...stroke} /></svg>;
    case 'check':  return <svg {...common}><path d="M5 12.5l4.5 4.5L19 7" {...stroke} strokeWidth="2.6" /></svg>;
    case 'pencil': return <svg {...common}><path d="M4 20h4L19 9l-4-4L4 16v4z" {...stroke} /><path d="M14 6l4 4" {...stroke} /></svg>;
    case 'arrow':  return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" {...stroke} /></svg>;
    case 'info':   return <svg {...common}><circle cx="12" cy="12" r="9" {...stroke} /><path d="M12 11v5M12 8h.01" {...stroke} /></svg>;
    case 'trophy': return <svg {...common}><path d="M7 4h10v4a5 5 0 01-10 0V4zM5 6H3v1a3 3 0 003 3M19 6h2v1a3 3 0 01-3 3M9 17h6M10 17l.5-3M14 17l-.5-3M8 21h8" {...stroke} /></svg>;
    case 'list':   return <svg {...common}><path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" {...stroke} /></svg>;
    default: return null;
  }
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 2px 10px' }}>{children}</div>;
}

function IconButton({ children, onClick, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: 'transparent', border: 'none', cursor: onClick ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center', appearance: 'none',
      }}
    >
      {children}
    </button>
  );
}

// ── Header + stepper ────────────────────────────────────────────────────────
function Stepper({ step }) {
  const labels = ['Category', 'Size', 'Songs'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 12px' }}>
      {labels.map((l, i) => {
        const n = i + 1, done = n < step, active = n === step, reached = n <= step;
        return (
          <Fragment key={l}>
            {i > 0 && (
              <div style={{ flex: 1, height: 2, margin: '0 7px', borderRadius: 2, background: n <= step ? 'var(--brand)' : 'var(--hairline)' }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 19, height: 19, borderRadius: 999, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: reached ? 'linear-gradient(135deg, var(--brand), var(--brand-2))' : 'var(--surface-2)',
                color: reached ? '#fff' : 'var(--text-3)',
                border: reached ? 'none' : '1.5px solid var(--border)',
              }}>{done ? <Icon name="check" s={11} c="#fff" sw={3} /> : n}</div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--text)' : done ? 'var(--text-2)' : 'var(--text-3)' }}>{l}</span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function Header({ step, onBack, title }) {
  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--hairline)', flexShrink: 0, position: 'relative', zIndex: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 6px' }}>
        <IconButton onClick={onBack} label={step === 1 ? 'Close' : 'Back'}>
          <Icon name={step === 1 ? 'close' : 'back'} s={22} c="var(--text)" />
        </IconButton>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: -0.2 }}>{title}</div>
        <div style={{ width: 40, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <FeedbackLauncher variant="header" />
        </div>
      </div>
      <Stepper step={step} />
    </div>
  );
}

// ── Recap chip (steps 2 & 3) ─────────────────────────────────────────────────
function RecapChip({ name }) {
  return (
    <div style={{ padding: '14px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 999, background: 'var(--accent-soft)', border: '1px solid var(--brand)' }}>
        <Icon name="trophy" s={16} c="var(--brand)" />
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
      </div>
    </div>
  );
}

// ── Step 1 — name ─────────────────────────────────────────────────────────
function NameScreen({ onPick }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);
  const go = () => { const v = draft.trim().slice(0, 60); if (v) onPick({ categoryId: 'most-devastating', name: v, custom: true }); };

  return (
    <div style={{ padding: '18px 16px 28px' }}>
      <p style={{ margin: '2px 4px 16px', fontSize: 14, lineHeight: 1.5, color: 'var(--text-2)' }}>
        Name your tournament, then choose the songs that compete.
      </p>

      <div
        onClick={() => !editing && setEditing(true)}
        style={{
          borderRadius: 16, padding: editing ? 16 : 18, cursor: editing ? 'default' : 'pointer',
          background: editing ? 'var(--surface)' : 'linear-gradient(135deg, var(--brand), var(--brand-2))',
          border: editing ? '2px solid var(--brand)' : 'none',
          boxShadow: editing ? 'none' : '0 8px 22px rgba(124,58,237,0.32)',
          color: editing ? 'var(--text)' : '#fff',
        }}
      >
        {!editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="pencil" s={22} c="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Write your own</div>
              <div style={{ fontSize: 13, opacity: 0.88, marginTop: 2 }}>Best workout song, Saddest line… anything</div>
            </div>
            <Icon name="arrow" s={22} c="#fff" />
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Name your bracket</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                ref={inputRef}
                value={draft}
                maxLength={60}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') go(); }}
                placeholder="e.g. Best bridge of all time"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 18, fontWeight: 600, color: 'var(--text)', fontFamily: 'inherit' }}
              />
              <button onClick={go} disabled={!draft.trim()} style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0, border: 'none', appearance: 'none',
                cursor: draft.trim() ? 'pointer' : 'default',
                background: draft.trim() ? 'linear-gradient(135deg, var(--brand), var(--brand-2))' : 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="arrow" s={20} c={draft.trim() ? '#fff' : 'var(--text-3)'} />
              </button>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{draft.length}/60</div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--text-3)', margin: '26px 4px 10px' }}>Or pick a theme</div>
      <div style={{ borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--hairline)', overflow: 'hidden' }}>
        {THEMES.map((t, i) => (
          <div
            key={t.id}
            onClick={() => onPick({ categoryId: t.id, name: t.name, custom: false })}
            style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', cursor: 'pointer', borderTop: i ? '1px solid var(--hairline)' : 'none' }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{t.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--text)' }}>{t.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 1 }}>{t.desc}</div>
            </div>
            <Chevron open={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 2 — size ───────────────────────────────────────────────────────────
function SizeSelector({ size, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {SIZES.map(n => {
        const m = sizeMeta(n);
        const on = size === n;
        return (
          <button key={n} onClick={() => onSelect(n)} style={{
            textAlign: 'left', cursor: 'pointer', position: 'relative', appearance: 'none',
            padding: '13px 14px', borderRadius: 14,
            border: on ? '2px solid var(--brand)' : '1.5px solid var(--border)',
            background: on ? 'var(--accent-soft)' : 'var(--surface)',
            transition: 'border-color .12s ease, box-shadow .12s ease', fontFamily: 'inherit',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: on ? 'var(--brand)' : 'var(--text)', lineHeight: 1 }}>{n}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>songs</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 5 }}>{m.rounds} rounds · {m.mins}</div>
            {on && (
              <div style={{ position: 'absolute', top: 11, right: 11, width: 18, height: 18, borderRadius: 9, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" s={12} c="#fff" sw={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SizeScreen({ name, size, onSelect }) {
  return (
    <div>
      <RecapChip name={name} />
      <div style={{ padding: '22px 16px 0' }}>
        <SectionLabel>How many songs compete?</SectionLabel>
        <SizeSelector size={size} onSelect={onSelect} />
        <p style={{ margin: '16px 4px 0', fontSize: 13, lineHeight: 1.55, color: 'var(--text-2)' }}>
          Songs go head-to-head until one wins. A bigger bracket means more rounds — and more votes. You can change this later.
        </p>
      </div>
    </div>
  );
}

// ── Randomizer source (collapsible) ──────────────────────────────────────────
function RandomizerSource({ selected, onToggle, size }) {
  const [open, setOpen] = useState(false);
  const all = selected.size === 0;
  const poolCount = all ? ALL_SONGS.length : ALL_SONGS.filter(s => selected.has(s.albumId)).length;
  const short = !all && poolCount < size;
  return (
    <div style={{ borderRadius: 13, border: '1px solid var(--hairline)', background: 'var(--surface-2)', overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 13px', cursor: 'pointer' }}>
        <Icon name="shuffle" s={16} c="var(--text-2)" />
        <div style={{ flex: 1, fontSize: 13, color: 'var(--text-2)' }}>
          Randomizer pulls from: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{all ? 'All albums' : `${selected.size} album${selected.size > 1 ? 's' : ''}`}</span>
        </div>
        <Chevron open={open} />
      </div>
      {open && (
        <div style={{ padding: '2px 13px 13px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {ALBUM_SECTIONS.map(a => {
              const on = selected.has(a.id);
              return (
                <button key={a.id} onClick={() => onToggle(a.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px 6px 7px', borderRadius: 999,
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, appearance: 'none',
                  border: on ? '1.5px solid var(--brand)' : '1.5px solid var(--border)',
                  background: on ? 'var(--accent-soft)' : 'var(--surface)',
                  color: on ? 'var(--brand)' : 'var(--text-2)', transition: 'border-color .12s ease',
                }}>
                  <EraTile albumId={a.id} s={18} r={6} />
                  {a.name}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: short ? WARN : 'var(--text-3)', marginTop: 10, display: 'flex', gap: 5, alignItems: 'flex-start' }}>
            <span style={{ marginTop: 1 }}><Icon name="info" s={13} c={short ? WARN : 'var(--text-3)'} /></span>
            <span>{all
              ? 'Hand-picking always works across every album — this only limits the randomizer.'
              : short
                ? `Only ${poolCount} songs in these albums — not enough to fill ${size}. Add more albums.`
                : `Randomizer draws from these ${poolCount} songs only.`}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── One album section in the song list ───────────────────────────────────────
function AlbumSection({ album, songs, pickedSet, full, onToggle, open, onHeader, last }) {
  const chosen = songs.filter(s => pickedSet.has(s.key)).length;
  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--hairline)' }}>
      <div onClick={onHeader} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer' }}>
        <EraTile albumId={album.id} s={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{album.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>
            {chosen > 0 && <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{chosen} chosen · </span>}
            {songs.length} songs
          </div>
        </div>
        <Chevron open={open} />
      </div>
      {open && (
        <div style={{ paddingBottom: 4 }}>
          {songs.map(s => {
            const on = pickedSet.has(s.key);
            const dim = full && !on;
            return (
              <div key={s.key} onClick={() => onToggle(s.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', paddingLeft: 18, cursor: dim ? 'default' : 'pointer', opacity: dim ? 0.4 : 1 }}>
                <CheckBox on={on} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, color: 'var(--text)', fontWeight: on ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Step 3 — pick songs ───────────────────────────────────────────────────
function SongScreen({ name, size, picked, setPicked, onViewChosen }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());
  const [randoAlbums, setRandoAlbums] = useState(() => new Set());
  const [note, setNote] = useState('');
  const pickedSet = useMemo(() => new Set(picked), [picked]);
  const full = picked.length === size;

  const pool = () => randoAlbums.size === 0 ? ALL_SONGS : ALL_SONGS.filter(s => randoAlbums.has(s.albumId));

  const toggleSong = (key) => {
    setNote('');
    setPicked(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= size) return prev;
      return [...prev, key];
    });
  };

  const fillRemaining = () => {
    const cands = shuffle(pool().map(s => s.key).filter(k => !pickedSet.has(k)));
    const need = size - picked.length;
    setPicked(prev => [...prev, ...cands.slice(0, need)]);
    setNote(cands.length < need ? `Only ${picked.length + cands.length} songs available in the randomizer pool — couldn't reach ${size}. Widen the source.` : '');
  };

  const fillAll = () => {
    const cands = shuffle(pool().map(s => s.key));
    setPicked(cands.slice(0, size));
    setNote(cands.length < size ? `Only ${cands.length} songs in the randomizer pool — couldn't reach ${size}. Widen the source.` : '');
  };

  const toggleAlbumRando = (id) => {
    setNote('');
    setRandoAlbums(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSection = (id) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const q = search.trim().toLowerCase();
  const sectionsData = ALBUM_SECTIONS
    .map(al => ({ album: al, songs: q ? al.songs.filter(s => s.name.toLowerCase().includes(q)) : al.songs }))
    .filter(sec => !q || sec.songs.length > 0);
  const noMatches = q && sectionsData.length === 0;

  return (
    <div>
      <RecapChip name={name} />

      {/* counter + view/clear */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            <span style={{ color: full ? 'var(--brand)' : 'var(--text)' }}>{picked.length}</span>
            <span style={{ color: 'var(--text-3)' }}> / {size} chosen</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {picked.length > 0 && (
              <button onClick={onViewChosen} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, appearance: 'none', border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                <Icon name="list" s={15} c="var(--text-2)" /> View
              </button>
            )}
            {picked.length > 0 && (
              <button onClick={() => { setNote(''); setPicked([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: 'var(--text-2)', padding: '6px', appearance: 'none' }}>Clear</button>
            )}
          </div>
        </div>

        <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-2)', marginTop: 9, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (picked.length / size) * 100)}%`, borderRadius: 3, background: 'linear-gradient(90deg, var(--brand), var(--brand-2))', transition: 'width .25s ease' }} />
        </div>

        <div style={{ display: 'flex', gap: 9, marginTop: 13 }}>
          <button onClick={fillRemaining} disabled={full} style={{
            flex: 1, padding: '11px', borderRadius: 12, cursor: full ? 'default' : 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 600, border: '1.5px solid var(--border)', background: 'var(--surface)', appearance: 'none',
            color: full ? 'var(--text-3)' : 'var(--text)', opacity: full ? 0.55 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>🎲 Fill remaining</button>
          <button onClick={fillAll} style={{
            flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 600, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', appearance: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>Fill all randomly</button>
        </div>
        {note && (
          <div style={{ marginTop: 10, padding: '9px 12px', borderRadius: 10, background: 'rgba(224,83,59,0.10)', color: WARN, fontSize: 12, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <span style={{ marginTop: 1 }}><Icon name="info" s={14} c={WARN} /></span><span>{note}</span>
          </div>
        )}

        <div style={{ marginTop: 13 }}>
          <RandomizerSource selected={randoAlbums} onToggle={toggleAlbumRando} size={size} />
        </div>
      </div>

      {/* search */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 13px', height: 42, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
          <Icon name="search" s={18} c="var(--text-3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search songs"
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: 'var(--text)', fontFamily: 'inherit' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', appearance: 'none' }}><Icon name="close" s={16} c="var(--text-3)" /></button>}
        </div>
      </div>

      {/* song list */}
      <div style={{ padding: '14px 16px 8px' }}>
        <SectionLabel>{q ? 'Results' : 'Songs by album'}</SectionLabel>
        {noMatches ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-2)' }}>No songs match “{search}”</div>
            <div style={{ fontSize: 12.5, marginTop: 3 }}>Try a different word.</div>
          </div>
        ) : (
          <div style={{ borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--hairline)', overflow: 'hidden' }}>
            {sectionsData.map((sec, i) => (
              <AlbumSection key={sec.album.id} album={sec.album} songs={sec.songs}
                pickedSet={pickedSet} full={full} onToggle={toggleSong}
                open={q ? true : expanded.has(sec.album.id)}
                onHeader={() => toggleSection(sec.album.id)} last={i === sectionsData.length - 1} />
            ))}
          </div>
        )}
      </div>
      <div style={{ height: 8 }} />
    </div>
  );
}

// ── Overlay A — chosen-songs sheet ───────────────────────────────────────────
function ChosenSheet({ picked, size, onRemove, onClear, onClose }) {
  const items = picked.map(key => SONG_BY_KEY.get(key)).filter(Boolean);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 6px' }}>
          <div style={{ width: 40, flexShrink: 0 }} />
          <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Your songs</div>
          <IconButton onClick={onClose} label="Close"><Icon name="close" s={22} c="var(--text)" /></IconButton>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-2)' }}>
            <span style={{ color: 'var(--brand)', fontWeight: 700 }}>{picked.length}</span> of {size} chosen
          </div>
          {picked.length > 0 && (
            <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: 'var(--text-2)', appearance: 'none' }}>Clear all</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>🎵</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-2)' }}>No songs yet</div>
            <div style={{ fontSize: 12.5, marginTop: 3 }}>Pick songs or use the fill buttons.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((s, i) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 13, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                <div style={{ width: 20, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', flexShrink: 0, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</div>
                <EraTile albumId={s.albumId} s={32} r={9} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>{ALBUM_BY_ID.get(s.albumId)?.name}</div>
                </div>
                <button onClick={() => onRemove(s.key)} aria-label="Remove" style={{
                  width: 30, height: 30, borderRadius: 999, flexShrink: 0, cursor: 'pointer', appearance: 'none',
                  border: '1.5px solid var(--border)', background: 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Icon name="close" s={15} c="var(--text-2)" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, padding: '11px 16px 24px', background: 'var(--surface)', borderTop: '1px solid var(--hairline)' }}>
        <button onClick={onClose} style={{ width: '100%', padding: '13px', borderRadius: 13, border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#fff', appearance: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', boxShadow: '0 6px 18px rgba(124,58,237,0.4)' }}>
          {picked.length === size ? 'Looks good' : 'Keep picking'}
        </button>
      </div>
    </div>
  );
}

// ── Overlay B — start confirmation ───────────────────────────────────────────
function MatchupRow({ song, right }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexDirection: right ? 'row-reverse' : 'row', textAlign: right ? 'right' : 'left' }}>
      <EraTile albumId={song.albumId} s={28} r={8} />
      <div style={{ minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.name}</div>
    </div>
  );
}

function StartConfirm({ name, roster, onEdit, onStart }) {
  const m = sizeMeta(roster.length);
  const pairs = [];
  for (let i = 0; i < roster.length; i += 2) pairs.push([roster[i], roster[i + 1]]);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', padding: '44px 24px 18px' }}>
        <div style={{ fontSize: 40 }}>🏆</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 8 }}>Bracket ready</div>
        <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>“{name}” · {roster.length} songs · {m.rounds} rounds</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Round 1 · {pairs.length} matchups</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {pairs.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 13, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
              <MatchupRow song={p[0]} />
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', flexShrink: 0 }}>VS</div>
              <MatchupRow song={p[1]} right />
            </div>
          ))}
        </div>
        <div style={{ height: 20 }} />
      </div>
      <div style={{ flexShrink: 0, padding: '11px 16px 24px', background: 'var(--surface)', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 10 }}>
        <button onClick={onEdit} style={{ flex: '0 0 auto', padding: '13px 18px', borderRadius: 13, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', appearance: 'none' }}>Edit roster</button>
        <button onClick={onStart} style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', appearance: 'none', boxShadow: '0 6px 18px rgba(124,58,237,0.4)' }}>Start voting →</button>
      </div>
    </div>
  );
}

// ── Bottom bars ───────────────────────────────────────────────────────────
function SizeBottomBar({ size, onContinue }) {
  const m = sizeMeta(size);
  return (
    <div style={{ flexShrink: 0, background: 'var(--surface)', borderTop: '1px solid var(--hairline)', padding: '11px 16px 24px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.35 }}>
          <b style={{ color: 'var(--text)' }}>{size} songs</b> · {m.rounds} rounds · {m.mins}
        </div>
        <button onClick={onContinue} style={{
          flexShrink: 0, padding: '13px 24px', borderRadius: 13, border: 'none', fontFamily: 'inherit',
          fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#fff', appearance: 'none',
          background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
          boxShadow: '0 6px 18px rgba(124,58,237,0.4)',
        }}>Continue →</button>
      </div>
    </div>
  );
}

function StartBottomBar({ size, picked, onStart }) {
  const full = picked.length === size;
  const m = sizeMeta(size);
  const remaining = size - picked.length;
  return (
    <div style={{ flexShrink: 0, background: 'var(--surface)', borderTop: '1px solid var(--hairline)', padding: '11px 16px 24px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.35 }}>
          {full
            ? <span><b style={{ color: 'var(--text)' }}>{size} songs</b> · {m.rounds} rounds · {m.mins}</span>
            : <span>Choose <b style={{ color: 'var(--text)' }}>{remaining} more</b> {remaining === 1 ? 'song' : 'songs'} <span style={{ color: 'var(--text-3)' }}>(or use Fill remaining)</span></span>}
        </div>
        <button onClick={onStart} disabled={!full} style={{
          flexShrink: 0, padding: '13px 22px', borderRadius: 13, border: 'none', fontFamily: 'inherit',
          fontSize: 15, fontWeight: 700, cursor: full ? 'pointer' : 'default', appearance: 'none',
          color: full ? '#fff' : 'var(--text-3)',
          background: full ? 'linear-gradient(135deg, var(--brand), var(--brand-2))' : 'var(--surface-2)',
          boxShadow: full ? '0 6px 18px rgba(124,58,237,0.4)' : 'none', transition: 'box-shadow .15s ease',
        }}>Start bracket</button>
      </div>
    </div>
  );
}

// ── App shell ────────────────────────────────────────────────────────────
export default function BracketBuilder({ onClose, onStart }) {
  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState('most-devastating');
  const [name, setName] = useState('');
  const [custom, setCustom] = useState(false);
  const [size, setSize] = useState(16);
  const [picked, setPicked] = useState([]);
  const [chosenOpen, setChosenOpen] = useState(false);
  // When the user taps "Start bracket" we freeze the shuffled roster (flat,
  // round-1 order) so the "Bracket ready" preview is stable AND is the exact
  // order handed to the engine — the preview is the real bracket, not a
  // throwaway reshuffle.
  const [confirmRoster, setConfirmRoster] = useState(null);
  const [startError, setStartError] = useState(null);
  const scrollRef = useRef(null);
  const toTop = () => { if (scrollRef.current) scrollRef.current.scrollTop = 0; };

  const pickName = ({ categoryId, name, custom }) => {
    setCategoryId(categoryId);
    setName(name);
    setCustom(custom);
    setPicked([]);
    setStep(2);
    toTop();
  };
  const selectSize = (n) => {
    setSize(n);
    setPicked(prev => prev.length > n ? prev.slice(0, n) : prev);
  };
  const back = () => { setStep(s => Math.max(1, s - 1)); toTop(); };
  const onBack = step === 1 ? onClose : back;

  const openConfirm = () => {
    // Shuffle ONCE here. This exact order drives the preview pairs and is the
    // same order passed to the engine, so what the user sees is what they vote.
    const songs = shuffle(picked.map(k => SONG_BY_KEY.get(k)).filter(Boolean));
    setConfirmRoster(songs);
  };

  const confirmStart = () => {
    setStartError(null);
    const roster = confirmRoster || [];
    const contestants = roster.map(s => ({ name: s.name, albumId: s.albumId, songIndex: s.songIndex }));
    let result;
    try {
      result = onStart(categoryId, 'custom', size, custom ? name : null, contestants);
    } catch (err) {
      // Belt-and-suspenders: never let an unexpected throw leave the user
      // stuck on "Bracket ready" with no feedback — surface the inline error.
      // eslint-disable-next-line no-console
      console.error('[confirmStart] onStart threw', err);
      result = 'failed';
    }
    if (result === 'failed') {
      setConfirmRoster(null);
      setStartError('Something went wrong starting that bracket. Try again.');
    }
    // 'ok' routes away to the matchup flow; 'locked' routes to the paywall.
  };

  const titles = { 1: 'Pick a category', 2: 'Bracket size', 3: 'Pick your songs' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    }}>
      <Header step={step} title={titles[step]} onBack={onBack} />

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {step === 1 && <NameScreen onPick={pickName} />}
        {step === 2 && <SizeScreen name={name} size={size} onSelect={selectSize} />}
        {step === 3 && (
          <SongScreen name={name} size={size} picked={picked} setPicked={setPicked} onViewChosen={() => setChosenOpen(true)} />
        )}
        {startError && (
          <div style={{ margin: '0 16px 16px', padding: '10px 12px', borderRadius: 10, background: 'rgba(224,83,59,0.10)', color: WARN, fontSize: 13, textAlign: 'center' }}>
            {startError}
          </div>
        )}
      </div>

      {step === 2 && <SizeBottomBar size={size} onContinue={() => { setStep(3); toTop(); }} />}
      {step === 3 && <StartBottomBar size={size} picked={picked} onStart={openConfirm} />}

      {chosenOpen && step === 3 && (
        <ChosenSheet
          picked={picked} size={size}
          onRemove={(key) => setPicked(prev => prev.filter(k => k !== key))}
          onClear={() => setPicked([])}
          onClose={() => setChosenOpen(false)}
        />
      )}

      {confirmRoster && (
        <StartConfirm
          name={name} roster={confirmRoster}
          onEdit={() => setConfirmRoster(null)}
          onStart={confirmStart}
        />
      )}
    </div>
  );
}
