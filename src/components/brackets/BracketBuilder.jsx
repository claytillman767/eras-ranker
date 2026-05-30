import { useMemo, useState } from 'react';
import { FeedbackLauncher } from '../FeedbackButton';
import { BRACKET_CATEGORIES, BRACKET_SIZES, bracketSize } from '../../constants/bracketCategories';
import { ALL_ALBUMS, SONGS } from '../../data/albums';
import { getEraColors } from '../../constants/eraColors';

// Two-step full-screen builder: pick a category → pick a scope → start.
// The bracket engine + categories already exist; this screen just turns
// the user's selections into a createBracket(categoryId, scope) call.
//
// Scope is either 'all' (every Taylor song across albums) or an albumId.
// Scopes that would produce fewer than 4 eligible songs after the
// category's songFilter are disabled — bracketSize() rejects them.
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

// Smallest bracket the engine will accept (matches BRACKET_SIZES[0]).
const MIN_BRACKET = BRACKET_SIZES[0];

// log2 — used to display "4 rounds" etc.
function roundsForSize(size) {
  return Math.log2(size);
}

// Time estimate: ~30s per matchup (listen + decide). A bracket has size-1
// matchups total. Returns minutes (whole number, min 1).
function estimateMinutes(size) {
  return Math.max(1, Math.round((size - 1) * 0.5));
}

function eligibleCount(category, scope) {
  const filter = category?.songFilter;
  if (scope === 'all') {
    let n = 0;
    for (const albumId of Object.keys(SONGS)) {
      const songs = SONGS[albumId];
      for (let i = 0; i < songs.length; i++) {
        if (!filter || filter(albumId, i)) n += 1;
      }
    }
    return n;
  }
  const songs = SONGS[scope] || [];
  if (!filter) return songs.length;
  let n = 0;
  for (let i = 0; i < songs.length; i++) {
    if (filter(scope, i)) n += 1;
  }
  return n;
}

export default function BracketBuilder({ onClose, onStart }) {
  const [step, setStep] = useState('category'); // 'category' | 'scope'
  const [categoryId, setCategoryId] = useState(null);
  const [scope, setScope] = useState('all'); // 'all' | albumId
  const [size, setSize] = useState(16);      // desired bracket size

  // Personal categories only — the weekly one runs on its own schedule.
  const categories = useMemo(
    () => BRACKET_CATEGORIES.filter(c => !c.isWeekly),
    []
  );

  const category = categories.find(c => c.id === categoryId) || null;

  // For each scope option, compute eligible song count once category is picked.
  const allCount = category ? eligibleCount(category, 'all') : 0;
  const allMaxSize = bracketSize(allCount);

  // Eligible count for the currently selected scope — drives the size picker.
  const scopeCount = category ? eligibleCount(category, scope) : 0;
  const scopeMaxSize = bracketSize(scopeCount);

  function handlePickCategory(id) {
    setCategoryId(id);
    setStep('scope');
  }

  // Whenever scope changes (and the category is set), clamp `size` so it
  // never exceeds what the new scope can support. Keep the user's choice
  // when it still fits; otherwise drop to the largest size that does.
  function handleSetScope(nextScope) {
    setScope(nextScope);
    if (!category) return;
    const max = bracketSize(eligibleCount(category, nextScope));
    if (size > max) setSize(max);
  }

  function handleStart() {
    if (!category) return;
    if (scopeMaxSize < MIN_BRACKET) return;
    if (size > scopeMaxSize) return;
    onStart(category.id, scope, size);
  }

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
          onClick={step === 'scope' ? () => setStep('category') : onClose}
          aria-label={step === 'scope' ? 'Back' : 'Close'}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-2)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '6px 4px',
          }}
        >
          {step === 'scope' ? '← Back' : '✕'}
        </button>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          {step === 'category' ? 'Build a Bracket' : 'Across which songs?'}
        </div>
        <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <FeedbackLauncher variant="header" />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 120px' }}>
        {step === 'category' ? (
          <CategoryStep
            categories={categories}
            onPick={handlePickCategory}
          />
        ) : (
          <ScopeStep
            category={category}
            scope={scope}
            setScope={handleSetScope}
            size={size}
            setSize={setSize}
            allCount={allCount}
            allMaxSize={allMaxSize}
            scopeMaxSize={scopeMaxSize}
          />
        )}
      </div>

      {/* Bottom — only visible on scope step */}
      {step === 'scope' && (
        <BottomBar
          scope={scope}
          size={size}
          ready={scopeMaxSize >= MIN_BRACKET && size <= scopeMaxSize}
          onStart={handleStart}
        />
      )}
    </div>
  );
}

// ── Step 1 — Category list ─────────────────────────────────────────────────
function CategoryStep({ categories, onPick }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.5 }}>
        Pick the theme. We'll match up songs head-to-head until one wins.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {categories.map(cat => {
          const songCount = eligibleCount(cat, 'all');
          const meta = cat.songFilter
            ? `${songCount} eligible songs`
            : 'Pick size on the next screen';
          return (
            <button
              key={cat.id}
              onClick={() => onPick(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 14px',
                background: 'var(--surface-2)',
                border: '0.5px solid var(--border)',
                borderRadius: 14,
                textAlign: 'left',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}>
                {ICONS[cat.id] || '🏆'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45, marginBottom: 4 }}>
                  {cat.description}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {meta}
                </div>
              </div>
              <div style={{ color: 'var(--control-off)', fontSize: 18, flexShrink: 0 }}>›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2 — Scope picker + bracket-size picker ────────────────────────────
function ScopeStep({ category, scope, setScope, size, setSize, allCount, allMaxSize, scopeMaxSize }) {
  if (!category) return null;

  return (
    <div>
      {/* Selected category recap */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: 'var(--accent-soft)',
        border: '0.5px solid var(--accent-soft-2)',
        borderRadius: 12,
        marginBottom: 18,
      }}>
        <div style={{ fontSize: 22 }}>{ICONS[category.id] || '🏆'}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{category.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{category.description}</div>
        </div>
      </div>

      {/* Scope: All Taylor songs */}
      <ScopeOption
        active={scope === 'all'}
        disabled={allMaxSize < MIN_BRACKET}
        onClick={() => setScope('all')}
        title="All Taylor songs"
        meta={
          allMaxSize >= MIN_BRACKET
            ? `${allCount} eligible songs · up to ${allMaxSize}-song bracket`
            : `Only ${allCount} eligible — needs ${MIN_BRACKET}+`
        }
        icon="🎶"
      />

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '20px 0 10px' }}>
        Or pick one album
      </div>

      {/* Scope: Album grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {ALL_ALBUMS.map(album => {
          const count = eligibleCount(category, album.id);
          const max = bracketSize(count);
          const disabled = max < MIN_BRACKET;
          const selected = scope === album.id;
          const colors = getEraColors(album.id);
          return (
            <button
              key={album.id}
              onClick={() => !disabled && setScope(album.id)}
              disabled={disabled}
              style={{
                background: 'var(--surface)',
                border: selected ? '2px solid var(--brand)' : '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                textAlign: 'center',
                boxShadow: selected ? '0 2px 8px rgba(168,85,247,0.18)' : 'none',
              }}
            >
              <div style={{
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: 8,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                marginBottom: 6,
              }}>
                {album.icon}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, marginBottom: 2, height: 26, overflow: 'hidden' }}>
                {album.name}
              </div>
              <div style={{ fontSize: 10, color: disabled ? 'var(--danger-text)' : 'var(--text-3)' }}>
                {disabled
                  ? (count === 0 ? 'no songs' : `${count} song${count === 1 ? '' : 's'} — needs ${MIN_BRACKET}+`)
                  : `up to ${max}`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bracket size — pick how long this should run */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '24px 0 10px' }}>
        Bracket size
      </div>
      <SizePicker
        size={size}
        setSize={setSize}
        max={scopeMaxSize}
      />
    </div>
  );
}

function SizePicker({ size, setSize, max }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
      {BRACKET_SIZES.map(s => {
        const disabled = s > max;
        const selected = size === s;
        const rounds = roundsForSize(s);
        const minutes = estimateMinutes(s);
        return (
          <button
            key={s}
            onClick={() => !disabled && setSize(s)}
            disabled={disabled}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: selected ? '2px solid var(--brand)' : '1px solid var(--border)',
              background: selected ? 'var(--accent-soft)' : 'var(--surface)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.4 : 1,
              textAlign: 'left',
              boxShadow: selected ? '0 2px 8px rgba(168,85,247,0.18)' : 'none',
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
  );
}

function ScopeOption({ active, disabled, onClick, title, meta, icon }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '14px',
        background: active ? 'var(--accent-soft)' : 'var(--surface)',
        border: active ? '2px solid var(--brand)' : '1px solid var(--border)',
        borderRadius: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        textAlign: 'left',
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'var(--accent-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 12, color: disabled ? 'var(--danger-text)' : 'var(--text-2)' }}>{meta}</div>
      </div>
      {active && (
        <div style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'var(--brand)',
          color: '#ffffff',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>✓</div>
      )}
    </button>
  );
}

// ── Bottom CTA bar ─────────────────────────────────────────────────────────
function BottomBar({ scope, size, ready, onStart }) {
  const scopeLabel = scope === 'all'
    ? 'All Taylor songs'
    : ALL_ALBUMS.find(a => a.id === scope)?.name || '';
  const minutes = estimateMinutes(size);
  const rounds = roundsForSize(size);

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '16px 20px 24px',
      background: 'var(--surface)',
      borderTop: '0.5px solid var(--hairline)',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, textAlign: 'center' }}>
        {ready
          ? `${size} songs · ${rounds} rounds · ~${minutes} min · ${scopeLabel}`
          : 'Pick a scope and bracket size with enough eligible songs'}
      </div>
      <button
        onClick={onStart}
        disabled={!ready}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          border: 'none',
          background: ready ? 'linear-gradient(135deg, var(--brand), var(--brand-2))' : 'var(--border)',
          color: ready ? '#ffffff' : 'var(--text-3)',
          fontSize: 16,
          fontWeight: 700,
          cursor: ready ? 'pointer' : 'not-allowed',
          boxShadow: ready ? '0 4px 12px rgba(168,85,247,0.3)' : 'none',
        }}
      >
        Start bracket
      </button>
    </div>
  );
}
