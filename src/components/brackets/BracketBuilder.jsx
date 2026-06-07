import { useMemo, useState } from 'react';
import { FeedbackLauncher } from '../FeedbackButton';
import { BRACKET_CATEGORIES, BRACKET_SIZES } from '../../constants/bracketCategories';
import { ALL_ALBUMS, SONGS } from '../../data/albums';
import { getEraColors } from '../../constants/eraColors';

// Two-step full-screen builder:
//   1. Name it   — pick a theme name (label only) OR write your own.
//   2. Roster    — pick a size, then hand-pick songs and/or random-fill.
//
// The theme NO LONGER restricts which songs are eligible — it's purely the
// label shown on every bracket screen. The user builds the exact roster: pick
// any songs by hand, optionally narrow the randomizer to certain albums, then
// "Fill remaining randomly" tops the roster up to the chosen size. The final
// roster (exactly `size` songs) is handed to onStart and the engine shuffles
// it into round-1 pairs.
const ICONS = {
  'best-bridge': '🌉',
  'most-devastating': '💔',
  'best-opening-line': '🎬',
  'most-romantic': '💕',
  'best-vocal': '🎤',
  'most-underrated': '💎',
  'best-chorus': '📣',
  'best-closing-line': '🎯',
};

// log2 — used to display "4 rounds" etc.
function roundsForSize(size) {
  return Math.log2(size);
}

// Time estimate: ~30s per matchup. A bracket has size-1 matchups total.
function estimateMinutes(size) {
  return Math.max(1, Math.round((size - 1) * 0.5));
}

// All albums that actually have songs, each with its song list pre-keyed.
// Built once — the catalog never changes at runtime.
const ALBUM_SECTIONS = ALL_ALBUMS
  .map(a => ({
    ...a,
    songs: (SONGS[a.id] || []).map((name, songIndex) => ({
      name,
      albumId: a.id,
      songIndex,
      key: `${a.id}_${songIndex}`,
    })),
  }))
  .filter(a => a.songs.length > 0);

const ALL_SONGS = ALBUM_SECTIONS.flatMap(a => a.songs);
const SONG_BY_KEY = new Map(ALL_SONGS.map(s => [s.key, s]));

// Plain (non-seeded) shuffle — fine here, it's a one-off user action.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BracketBuilder({ onClose, onStart }) {
  const [step, setStep] = useState('category'); // 'category' | 'roster'
  const [categoryId, setCategoryId] = useState(null);
  const [customName, setCustomName] = useState('');

  const [size, setSize] = useState(16);
  // Ordered list of selected song keys (order preserved for trimming).
  const [selected, setSelected] = useState([]);
  // Albums the randomizer is allowed to draw from. Empty set = all albums.
  const [randomAlbums, setRandomAlbums] = useState(() => new Set());
  const [startError, setStartError] = useState(null);
  const [fillNote, setFillNote] = useState(null);

  // Personal categories only — the weekly one runs on its own schedule.
  const categories = useMemo(
    () => BRACKET_CATEGORIES.filter(c => !c.isWeekly),
    []
  );
  const category = categories.find(c => c.id === categoryId) || null;

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const label = customName || category?.name || 'Bracket';

  function handlePickCategory(id) {
    setCategoryId(id);
    setCustomName('');
    setStep('roster');
  }

  function handlePickCustom(name) {
    const trimmed = (name || '').trim().slice(0, 60);
    if (!trimmed) return;
    setCustomName(trimmed);
    // Reuse a neutral category id for lyricsContext defaults; the label
    // overrides the display name everywhere downstream.
    setCategoryId('most-devastating');
    setStep('roster');
  }

  // Changing size trims the selection if it now exceeds the new size.
  function handleSetSize(next) {
    setSize(next);
    setFillNote(null);
    if (selected.length > next) setSelected(prev => prev.slice(0, next));
  }

  function toggleSong(key) {
    setFillNote(null);
    setStartError(null);
    setSelected(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= size) return prev; // full — ignore
      return [...prev, key];
    });
  }

  function toggleRandomAlbum(albumId) {
    setRandomAlbums(prev => {
      const next = new Set(prev);
      if (next.has(albumId)) next.delete(albumId);
      else next.add(albumId);
      return next;
    });
  }

  // Fill empty slots (or the whole roster) with random songs drawn from the
  // narrowed album set (or all albums if none chosen).
  function randomFill(replaceAll) {
    setStartError(null);
    setFillNote(null);
    const base = replaceAll ? [] : selected;
    const baseSet = new Set(base);
    const allowAll = randomAlbums.size === 0;
    const pool = ALL_SONGS.filter(
      s => (allowAll || randomAlbums.has(s.albumId)) && !baseSet.has(s.key)
    );
    const picked = shuffle(pool);
    const next = [...base];
    for (const s of picked) {
      if (next.length >= size) break;
      next.push(s.key);
    }
    setSelected(next);
    if (next.length < size) {
      setFillNote(
        `Only ${next.length} of ${size} filled — not enough songs in the chosen albums. Add more albums or pick by hand.`
      );
    }
  }

  function clearAll() {
    setSelected([]);
    setFillNote(null);
    setStartError(null);
  }

  function handleStart() {
    setStartError(null);
    if (selected.length !== size) {
      setStartError(`Pick exactly ${size} songs (you have ${selected.length}).`);
      return;
    }
    const contestants = selected
      .map(k => SONG_BY_KEY.get(k))
      .filter(Boolean)
      .map(s => ({ name: s.name, albumId: s.albumId, songIndex: s.songIndex }));
    const result = onStart(categoryId, 'custom', size, customName || null, contestants);
    if (result === 'failed') {
      setStartError('Something went wrong starting that bracket. Try again.');
    }
  }

  const ready = selected.length === size;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '0.5px solid var(--hairline)',
      }}>
        <button
          onClick={step === 'roster' ? () => setStep('category') : onClose}
          aria-label={step === 'roster' ? 'Back' : 'Close'}
          style={{
            background: 'none', border: 'none', color: 'var(--text-2)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '6px 4px',
          }}
        >
          {step === 'roster' ? '← Back' : '✕'}
        </button>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          {step === 'category' ? 'Build a Bracket' : 'Pick your songs'}
        </div>
        <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <FeedbackLauncher variant="header" />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 140px' }}>
        {step === 'category' ? (
          <CategoryStep
            categories={categories}
            onPick={handlePickCategory}
            onPickCustom={handlePickCustom}
          />
        ) : (
          <RosterStep
            label={label}
            isCustom={!!customName}
            categoryId={categoryId}
            size={size}
            setSize={handleSetSize}
            selected={selected}
            selectedSet={selectedSet}
            toggleSong={toggleSong}
            randomAlbums={randomAlbums}
            toggleRandomAlbum={toggleRandomAlbum}
            randomFill={randomFill}
            clearAll={clearAll}
            fillNote={fillNote}
          />
        )}
      </div>

      {/* Bottom — only on roster step */}
      {step === 'roster' && (
        <BottomBar
          size={size}
          count={selected.length}
          ready={ready}
          onStart={handleStart}
          error={startError}
        />
      )}
    </div>
  );
}

// ── Step 1 — Name / theme ──────────────────────────────────────────────────
function CategoryStep({ categories, onPick, onPickCustom }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.5 }}>
        Pick a name for your bracket. Next you'll choose the exact songs that go in it.
      </div>
      <CustomCategoryCard onSubmit={onPickCustom} />
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        margin: '20px 0 10px',
      }}>
        Or pick a theme
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onPick(cat.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px',
              background: 'var(--surface-2)', border: '0.5px solid var(--border)',
              borderRadius: 14, textAlign: 'left', cursor: 'pointer', width: '100%',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {ICONS[cat.id] || '🏆'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                {cat.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>
                {cat.description}
              </div>
            </div>
            <div style={{ color: 'var(--control-off)', fontSize: 18, flexShrink: 0 }}>›</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// "Write your own" card — collapsed by default, expands into a name input.
function CustomCategoryCard({ onSubmit }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const canSubmit = name.trim().length > 0;

  function submit() {
    if (!canSubmit) return;
    onSubmit(name);
  }

  return (
    <div style={{
      background: 'var(--surface-2)', border: '0.5px dashed var(--brand)',
      borderRadius: 14, padding: '14px',
    }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, width: '100%',
            background: 'transparent', border: 'none', padding: 0,
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'var(--accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>✏️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
              Write your own
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>
              Name a custom bracket — "Best workout song", "Saddest line", whatever.
            </div>
          </div>
          <div style={{ color: 'var(--control-off)', fontSize: 18, flexShrink: 0 }}>›</div>
        </button>
      ) : (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Name your bracket
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              maxLength={60}
              placeholder="e.g. Best workout song"
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', fontSize: 14, outline: 'none',
              }}
            />
            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{
                padding: '10px 14px', borderRadius: 10, border: 'none',
                background: canSubmit ? 'var(--brand)' : 'var(--border)',
                color: canSubmit ? '#ffffff' : 'var(--text-3)',
                fontSize: 13, fontWeight: 600,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >Continue →</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            You'll pick the songs on the next screen. Up to 60 characters.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 2 — Size + roster picker ──────────────────────────────────────────
function RosterStep({
  label, isCustom, categoryId, size, setSize,
  selected, selectedSet, toggleSong,
  randomAlbums, toggleRandomAlbum, randomFill, clearAll, fillNote,
}) {
  const [query, setQuery] = useState('');
  const [openAlbums, setOpenAlbums] = useState(() => new Set());
  const [randomizerOpen, setRandomizerOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const isFull = selected.length >= size;

  function toggleAlbumOpen(albumId) {
    setOpenAlbums(prev => {
      const next = new Set(prev);
      if (next.has(albumId)) next.delete(albumId);
      else next.add(albumId);
      return next;
    });
  }

  // When searching, show every album with a matching song, auto-expanded,
  // and only the matching songs within each.
  const sections = ALBUM_SECTIONS
    .map(a => ({
      album: a,
      songs: searching ? a.songs.filter(s => s.name.toLowerCase().includes(q)) : a.songs,
    }))
    .filter(a => a.songs.length > 0);

  const randomLabel = randomAlbums.size === 0
    ? 'All albums'
    : `${randomAlbums.size} album${randomAlbums.size === 1 ? '' : 's'}`;

  return (
    <div>
      {/* Selected theme recap */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        background: 'var(--accent-soft)', border: '0.5px solid var(--accent-soft-2)',
        borderRadius: 12, marginBottom: 18,
      }}>
        <div style={{ fontSize: 22 }}>{isCustom ? '✏️' : (ICONS[categoryId] || '🏆')}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Your bracket</div>
        </div>
      </div>

      {/* Bracket size */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
        Bracket size
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 22 }}>
        {BRACKET_SIZES.map(s => {
          const sel = size === s;
          const rounds = roundsForSize(s);
          const minutes = estimateMinutes(s);
          return (
            <button
              key={s}
              onClick={() => setSize(s)}
              style={{
                padding: '12px 14px', borderRadius: 12,
                border: sel ? '2px solid var(--brand)' : '1px solid var(--border)',
                background: sel ? 'var(--accent-soft)' : 'var(--surface)',
                cursor: 'pointer', textAlign: 'left',
                boxShadow: sel ? '0 2px 8px rgba(168,85,247,0.18)' : 'none',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {s} songs
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                {rounds} round{rounds === 1 ? '' : 's'} · ~{minutes} min
              </div>
            </button>
          );
        })}
      </div>

      {/* Roster controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {selected.length} / {size} chosen
        </div>
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            style={{
              background: 'none', border: 'none', color: 'var(--text-2)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 6px',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Fill buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button
          onClick={() => randomFill(false)}
          disabled={isFull}
          style={{
            flex: 1, padding: '11px', borderRadius: 10,
            border: '1px solid var(--brand)',
            background: isFull ? 'var(--border)' : 'var(--accent-soft)',
            color: isFull ? 'var(--text-3)' : 'var(--brand)',
            fontSize: 13, fontWeight: 600, cursor: isFull ? 'not-allowed' : 'pointer',
          }}
        >
          🎲 Fill remaining
        </button>
        <button
          onClick={() => randomFill(true)}
          style={{
            flex: 1, padding: '11px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Fill all randomly
        </button>
      </div>

      {/* Randomizer source narrowing */}
      <div style={{
        border: '1px solid var(--border)', borderRadius: 10,
        marginBottom: 14, overflow: 'hidden',
      }}>
        <button
          onClick={() => setRandomizerOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '10px 12px', background: 'var(--surface)',
            border: 'none', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            Randomizer pulls from: <strong style={{ color: 'var(--text)' }}>{randomLabel}</strong>
          </span>
          <span style={{ color: 'var(--control-off)', fontSize: 14 }}>{randomizerOpen ? '▴' : '▾'}</span>
        </button>
        {randomizerOpen && (
          <div style={{ padding: '4px 12px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, lineHeight: 1.4 }}>
              Tick albums to limit the random fill. (Hand-picking still works across every album.)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALBUM_SECTIONS.map(a => {
                const on = randomAlbums.has(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleRandomAlbum(a.id)}
                    style={{
                      padding: '6px 10px', borderRadius: 999,
                      border: on ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                      background: on ? 'var(--accent-soft)' : 'var(--surface)',
                      color: on ? 'var(--brand)' : 'var(--text-2)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {a.icon} {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {fillNote && (
        <div style={{
          fontSize: 12, color: 'var(--text-2)', background: 'var(--surface-2)',
          border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px',
          marginBottom: 12,
        }}>
          {fillNote}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search songs…"
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 14,
          boxSizing: 'border-box',
        }}
      />

      {/* Album sections */}
      {sections.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '24px 0' }}>
          No songs match "{query}".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sections.map(({ album, songs }) => {
            const expanded = searching || openAlbums.has(album.id);
            const chosenInAlbum = songs.filter(s => selectedSet.has(s.key)).length;
            const colors = getEraColors(album.id);
            return (
              <div key={album.id} style={{
                border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
                background: 'var(--surface)',
              }}>
                <button
                  onClick={() => !searching && toggleAlbumOpen(album.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '12px 14px', background: 'transparent', border: 'none',
                    cursor: searching ? 'default' : 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>{album.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{album.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {chosenInAlbum > 0 ? `${chosenInAlbum} chosen · ` : ''}{songs.length} song{songs.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  {!searching && (
                    <span style={{ color: 'var(--control-off)', fontSize: 14 }}>{expanded ? '▴' : '▾'}</span>
                  )}
                </button>
                {expanded && (
                  <div style={{ borderTop: '0.5px solid var(--hairline)' }}>
                    {songs.map(s => {
                      const on = selectedSet.has(s.key);
                      const blocked = !on && isFull;
                      return (
                        <button
                          key={s.key}
                          onClick={() => toggleSong(s.key)}
                          disabled={blocked}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                            padding: '10px 14px', background: on ? 'var(--accent-soft)' : 'transparent',
                            border: 'none', borderTop: '0.5px solid var(--hairline)',
                            cursor: blocked ? 'not-allowed' : 'pointer', textAlign: 'left',
                            opacity: blocked ? 0.4 : 1,
                          }}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                            border: on ? 'none' : '1.5px solid var(--control-off)',
                            background: on ? 'var(--brand)' : 'transparent',
                            color: '#fff', fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>{on ? '✓' : ''}</div>
                          <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.3 }}>{s.name}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Bottom CTA bar ─────────────────────────────────────────────────────────
function BottomBar({ size, count, ready, onStart, error }) {
  const minutes = estimateMinutes(size);
  const rounds = roundsForSize(size);

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '16px 20px 24px', background: 'var(--surface)',
      borderTop: '0.5px solid var(--hairline)', boxShadow: '0 -4px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, textAlign: 'center' }}>
        {ready
          ? `${size} songs · ${rounds} rounds · ~${minutes} min`
          : `Choose ${size - count} more song${size - count === 1 ? '' : 's'} (or use Fill remaining)`}
      </div>
      {error && (
        <div style={{
          fontSize: 12, color: 'var(--danger-text)',
          background: 'var(--danger-soft, rgba(239,68,68,0.08))',
          border: '1px solid var(--danger-text)', borderRadius: 8,
          padding: '8px 12px', marginBottom: 10, textAlign: 'center',
        }}>
          {error}
        </div>
      )}
      <button
        onClick={onStart}
        disabled={!ready}
        style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          background: ready ? 'linear-gradient(135deg, var(--brand), var(--brand-2))' : 'var(--border)',
          color: ready ? '#ffffff' : 'var(--text-3)',
          fontSize: 16, fontWeight: 700, cursor: ready ? 'pointer' : 'not-allowed',
          boxShadow: ready ? '0 4px 12px rgba(168,85,247,0.3)' : 'none',
        }}
      >
        Start bracket
      </button>
    </div>
  );
}
