import { useState } from 'react';
import PaywallCard from './PaywallCard';
import { DEFAULT_CATEGORIES, EXTRA_CATEGORIES } from '../data/categories';
import { CUSTOM_CAT_LIMIT } from '../hooks/usePro';

// Slider that controls a category's raw priority weight (1–50).
// Shows the resulting normalized % next to the label.
function WeightSlider({ catId, rawWeight, normalizedPct, onChange }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>Weight</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#a855f7' }}>{normalizedPct}% of score</span>
      </div>
      <input
        type="range"
        min={1}
        max={50}
        value={rawWeight}
        onChange={e => onChange(catId, Number(e.target.value))}
        style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
      />
    </div>
  );
}

// Type toggle — segmented control for Stars vs Yes/No
function TypeToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3, gap: 3 }}>
      {['stars', 'yesno'].map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            flex: 1,
            padding: '5px 0',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            background: value === t ? '#ffffff' : 'transparent',
            color: value === t ? '#7c3aed' : '#9ca3af',
            boxShadow: value === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {t === 'stars' ? '5 Star Scale' : 'Yes / No'}
        </button>
      ))}
    </div>
  );
}

// Categories tab — shows default categories, Pro extras, custom creator, and paywall.
export default function Categories({
  isPro,
  unlockPro,
  enabledExtras,
  toggleExtra,
  customCategories,
  addCustomCategory,
  removeCustomCategory,
  disabledCustoms,
  toggleCustom,
  disabledDefaults,
  toggleDefault,
  setCustomCategoryType,
  activeCategories,
  categoryWeights,
  setCategoryWeight,
  resetCategoryWeights,
}) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('stars');
  const [selectedCat, setSelectedCat] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleAdd() {
    const trimmed = newCatName.trim();
    if (!trimmed || customCategories.length >= CUSTOM_CAT_LIMIT) return;
    addCustomCategory(trimmed, newCatType);
    setNewCatName('');
    setNewCatType('stars');
  }

  function handleDeleteConfirm() {
    removeCustomCategory(selectedCat.id);
    setSelectedCat(null);
    setConfirmingDelete(false);
  }

  function closeModal() {
    setSelectedCat(null);
    setConfirmingDelete(false);
  }

  // Returns the raw slider value for a category (stored override, or default weight, clamped to 1–50).
  function rawWeight(cat) {
    const stored = categoryWeights?.[cat.id];
    return stored != null ? stored : Math.min(cat.weight, 50);
  }

  // Returns the normalized % this category contributes to the final score.
  function normalizedPct(catId) {
    return activeCategories.find(c => c.id === catId)?.weight ?? 0;
  }

  return (
    <div>
      {/* Reset weightings banner — appears at the top whenever weights have been customised */}
      {isPro && Object.keys(categoryWeights).length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#faf5ff',
          border: '0.5px solid #e9d5ff',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 13, color: '#7c3aed' }}>Weights customised</span>
          <button
            onClick={resetCategoryWeights}
            style={{
              background: '#a855f7',
              border: 'none',
              borderRadius: 6,
              padding: '5px 14px',
              fontSize: 13,
              fontWeight: 500,
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Reset to defaults
          </button>
        </div>
      )}

      {/* Pro unlocked banner */}
      {isPro && (
        <div style={{
          background: '#dcfce7',
          border: '0.5px solid #bbf7d0',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 13,
          color: '#166534',
          marginBottom: 16,
        }}>
          ✓ Pro unlocked
        </div>
      )}

      {/* Default categories section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Default categories {isPro ? '' : '(free)'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DEFAULT_CATEGORIES.map(cat => {
            const isOn = !disabledDefaults?.has(cat.id);
            return (
              <div key={cat.id} style={{
                background: '#ffffff',
                border: '0.5px solid #e5e7eb',
                borderRadius: 8,
                padding: '10px 12px',
                opacity: isOn ? 1 : 0.55,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => toggleDefault?.(cat.id)}
                    style={{ accentColor: '#a855f7', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{cat.name}</span>
                      {!isPro && isOn && (
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{normalizedPct(cat.id)}%</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      {isOn ? cat.description : 'Off — your existing ratings are saved and will reapply if turned back on.'}
                    </div>
                  </div>
                </div>
                {isPro && isOn && (
                  <WeightSlider
                    catId={cat.id}
                    rawWeight={rawWeight(cat)}
                    normalizedPct={normalizedPct(cat.id)}
                    onChange={setCategoryWeight}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pro-only sections */}
      {isPro ? (
        <>
          {/* Extra categories */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Extra categories
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {EXTRA_CATEGORIES.map(cat => {
                const isOn = enabledExtras.has(cat.id);
                return (
                  <div key={cat.id} style={{
                    background: '#ffffff',
                    border: '0.5px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => toggleExtra(cat.id)}
                        style={{ accentColor: '#a855f7', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{cat.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{cat.description}</div>
                      </div>
                    </div>
                    {isOn && (
                      <WeightSlider
                        catId={cat.id}
                        rawWeight={rawWeight({ id: cat.id, weight: 10 })}
                        normalizedPct={normalizedPct(cat.id)}
                        onChange={setCategoryWeight}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom categories */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Custom categories
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                {customCategories.length} / {CUSTOM_CAT_LIMIT}
              </div>
            </div>
            {customCategories.length === 0 && (
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
                No custom categories yet.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {customCategories.map(cat => {
                const isOn = !disabledCustoms.has(cat.id);
                return (
                  <div key={cat.id} style={{
                    background: '#ffffff',
                    border: '0.5px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => toggleCustom(cat.id)}
                        style={{ accentColor: '#a855f7', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div
                        style={{ flex: 1, cursor: 'pointer' }}
                        onClick={() => { setSelectedCat(cat); setConfirmingDelete(false); }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{cat.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          {cat.type === 'yesno' ? 'Yes / No' : '5 Star Scale'} · tap to edit
                        </div>
                      </div>
                    </div>
                    {isOn && (
                      <WeightSlider
                        catId={cat.id}
                        rawWeight={rawWeight(cat)}
                        normalizedPct={normalizedPct(cat.id)}
                        onChange={setCategoryWeight}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add new custom category */}
            {customCategories.length < CUSTOM_CAT_LIMIT ? (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value.slice(0, 30))}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="New category name (max 30 chars)"
                    style={{
                      flex: 1,
                      border: '0.5px solid #e5e7eb',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!newCatName.trim()}
                    style={{
                      background: newCatName.trim() ? '#a855f7' : '#e5e7eb',
                      color: newCatName.trim() ? '#ffffff' : '#9ca3af',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: newCatName.trim() ? 'pointer' : 'default',
                    }}
                  >
                    Add
                  </button>
                </div>
                <TypeToggle value={newCatType} onChange={setNewCatType} />
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>
                Maximum of {CUSTOM_CAT_LIMIT} custom categories reached.
              </div>
            )}
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
              Weights auto-adjust so all active categories always add up to 100%.
            </div>
          </div>

          {/* Custom category detail modal */}
          {selectedCat && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
              onClick={closeModal}
            >
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px 20px 0 0',
                  padding: '24px 24px 40px',
                  width: '100%',
                  maxWidth: 480,
                }}
                onClick={e => e.stopPropagation()}
              >
                {!confirmingDelete ? (
                  <>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                      {selectedCat.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>Custom category</div>

                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Rating type</div>
                    <TypeToggle
                      value={selectedCat.type ?? 'stars'}
                      onChange={t => {
                        setCustomCategoryType(selectedCat.id, t);
                        setSelectedCat(prev => ({ ...prev, type: t }));
                      }}
                    />

                    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                      <button
                        onClick={closeModal}
                        style={{
                          flex: 1,
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: 10,
                          padding: '12px 0',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#6b7280',
                          cursor: 'pointer',
                        }}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(true)}
                        style={{
                          flex: 1,
                          background: '#fff1f2',
                          border: 'none',
                          borderRadius: 10,
                          padding: '12px 0',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#e11d48',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                      Delete "{selectedCat.name}"?
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
                      Your ratings for this category won't count toward scores anymore. Your other ratings are unaffected.
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => setConfirmingDelete(false)}
                        style={{
                          flex: 1,
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: 10,
                          padding: '12px 0',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#6b7280',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteConfirm}
                        style={{
                          flex: 1,
                          background: '#e11d48',
                          border: 'none',
                          borderRadius: 10,
                          padding: '12px 0',
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        // Paywall card + teaser for free users
        <>
          <PaywallCard onUnlock={unlockPro} />

          {/* Teaser — extra categories (locked) */}
          <div style={{ marginTop: 24, position: 'relative' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Extra categories
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.45, pointerEvents: 'none', userSelect: 'none' }}>
              {EXTRA_CATEGORIES.map(cat => (
                <div key={cat.id} style={{
                  background: '#ffffff',
                  border: '0.5px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <span style={{ fontSize: 13, color: '#d1d5db' }}>🔒</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{cat.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teaser — custom categories (locked) */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Custom categories
            </div>
            <div style={{ opacity: 0.45, pointerEvents: 'none', userSelect: 'none' }}>
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>No custom categories yet.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  flex: 1,
                  border: '0.5px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  color: '#9ca3af',
                  background: '#f9fafb',
                }}>
                  🔒 New category name
                </div>
                <div style={{
                  background: '#e5e7eb',
                  color: '#9ca3af',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                }}>
                  Add
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
