import { useState, useEffect, useMemo } from 'react';
import { ALBUMS, SONGS } from '../data/albums';

const CATEGORY_DEFS = [
  { id: 'most-romantic',     emoji: '💕', label: 'Most Romantic'     },
  { id: 'most-devastating',  emoji: '💔', label: 'Most Devastating'  },
  { id: 'cry-factor',        emoji: '😭', label: 'Cry Factor'        },
  { id: 'best-storytelling', emoji: '📖', label: 'Best Storytelling' },
  { id: 'best-lyrics',       emoji: '✍️', label: 'Best Lyrics'       },
];

const ALBUM_BY_ID = Object.fromEntries(ALBUMS.map(a => [a.id, a]));
const ALBUM_ORDER = ['tv', 'fe', 'st', 'rd', '89', 'rp', 'lv', 'fl', 'ev', 'ml', 'tp', 'ls'];

// Empty pick scaffold — used when a song hasn't been processed yet.
function emptyPicks() {
  const obj = {};
  for (const cat of CATEGORY_DEFS) {
    obj[cat.id] = { line: null, score: 0, reasoning: '', rejected: false, manualLine: null };
  }
  return obj;
}

// Score → background colour for the pill
function scoreColor(score) {
  if (score >= 90) return '#16a34a';   // green-600
  if (score >= 70) return '#22c55e';   // green-500
  if (score >= 50) return '#eab308';   // yellow-500
  if (score >= 30) return '#f97316';   // orange-500
  return '#ef4444';                    // red-500
}

export default function AuditReview() {
  const [audit, setAudit] = useState({});
  const [synced, setSynced] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dirtyKeys, setDirtyKeys] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('processed');
  const [visibleCount, setVisibleCount] = useState(50);
  const [overrideOpen, setOverrideOpen] = useState(null); // { key, cid } or null
  const [showInstructions, setShowInstructions] = useState(false);

  // Load both data files on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [auditMod, syncedMod] = await Promise.all([
          import('../data/categoryTimesAudit.json'),
          import('../data/syncedLyricsFull.json'),
        ]);
        if (cancelled) return;
        setAudit(auditMod.default || {});
        setSynced(syncedMod.default || {});
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Build the full ordered list of song keys (every song in the catalog)
  const allKeys = useMemo(() => {
    const keys = [];
    for (const aid of ALBUM_ORDER) {
      const songs = SONGS[aid] || [];
      for (let i = 0; i < songs.length; i++) {
        keys.push(`${aid}_${i}`);
      }
    }
    return keys;
  }, []);

  // Apply search + filter
  const visibleKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allKeys.filter(key => {
      const [aid, idx] = [key.split('_')[0], parseInt(key.split('_')[1], 10)];
      const songName = SONGS[aid]?.[idx] || '';
      const album = ALBUM_BY_ID[aid]?.name || '';

      if (q && !(songName.toLowerCase().includes(q) || album.toLowerCase().includes(q) || key.includes(q))) {
        return false;
      }

      const entry = audit[key];
      const hasPicks = !!entry?.picks;

      if (filter === 'all')         return true;
      if (filter === 'unprocessed') return !hasPicks;
      if (filter === 'processed')   return hasPicks;
      if (filter === 'rejected')    return hasPicks && CATEGORY_DEFS.some(c => entry.picks[c.id]?.rejected);
      if (filter === 'overridden')  return hasPicks && CATEGORY_DEFS.some(c => entry.picks[c.id]?.manualLine);
      return true;
    });
  }, [allKeys, audit, search, filter]);

  // Reset visible count whenever search/filter changes (so going to a new view starts at top)
  useEffect(() => { setVisibleCount(50); }, [search, filter]);

  function updatePick(key, cid, patch) {
    setAudit(prev => {
      const entry = prev[key] || {
        song:  SONGS[key.split('_')[0]]?.[parseInt(key.split('_')[1], 10)] || '',
        album: ALBUM_BY_ID[key.split('_')[0]]?.name || '',
        picks: emptyPicks(),
      };
      const picks = { ...entry.picks };
      const prevPick = picks[cid] || { line: null, score: 0, reasoning: '', rejected: false, manualLine: null };
      picks[cid] = { ...prevPick, ...patch };
      return { ...prev, [key]: { ...entry, picks } };
    });
    setDirtyKeys(prev => new Set(prev).add(key));
  }

  async function saveChanges() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const resp = await fetch('/__dev/audit/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(audit),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || `HTTP ${resp.status}`);
      setSaveMsg(`Saved ${data.count} entries`);
      setDirtyKeys(new Set());
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (e) {
      setSaveMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{padding: 24, fontFamily: 'system-ui'}}>Loading audit data…</div>;
  }
  if (error) {
    return <div style={{padding: 24, fontFamily: 'system-ui', color: 'crimson'}}>Failed to load: {error}</div>;
  }

  return (
    <div style={{
      fontFamily:  'system-ui, -apple-system, sans-serif',
      background:  '#0f172a',
      color:       '#e2e8f0',
      minHeight:   '100vh',
      paddingBottom: 80,
    }}>
      {/* Sticky header */}
      <div style={{
        position:    'sticky',
        top:         0,
        zIndex:      10,
        background:  '#1e293b',
        borderBottom: '1px solid #334155',
        padding:     '12px 20px',
        display:     'flex',
        alignItems:  'center',
        gap:         12,
        flexWrap:    'wrap',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>🎯 Category Pick Audit</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          {Object.keys(audit).length} / {allKeys.length} songs processed
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search song or album…"
          style={{
            flex: '1 1 200px',
            padding: '6px 12px',
            background: '#0f172a',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: 6,
            fontSize: 14,
          }}
        />

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            background: '#0f172a',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          <option value="all">All songs</option>
          <option value="processed">Processed</option>
          <option value="unprocessed">Unprocessed</option>
          <option value="rejected">Has rejections</option>
          <option value="overridden">Has overrides</option>
        </select>

        <button
          onClick={() => setShowInstructions(true)}
          title="Show usage instructions"
          style={{
            padding: '6px 12px',
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid #475569',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ❓ Instructions
        </button>

        <button
          onClick={saveChanges}
          disabled={saving || dirtyKeys.size === 0}
          style={{
            padding: '6px 16px',
            background: dirtyKeys.size > 0 ? '#16a34a' : '#475569',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: dirtyKeys.size > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving…' : `Save changes${dirtyKeys.size > 0 ? ` (${dirtyKeys.size})` : ''}`}
        </button>

        {saveMsg && (
          <div style={{ fontSize: 13, color: saveMsg.startsWith('Error') ? '#fca5a5' : '#86efac' }}>
            {saveMsg}
          </div>
        )}
      </div>

      {/* Songs list */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {visibleKeys.length === 0 && (
          <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>
            No songs match the current search/filter.
          </div>
        )}
        {visibleKeys.slice(0, visibleCount).map(key => (
          <SongCard
            key={key}
            songKey={key}
            audit={audit[key]}
            syncedSong={synced[key]}
            isDirty={dirtyKeys.has(key)}
            updatePick={updatePick}
            overrideOpen={overrideOpen}
            setOverrideOpen={setOverrideOpen}
          />
        ))}
        {visibleKeys.length > visibleCount && (
          <button
            onClick={() => setVisibleCount(c => c + 50)}
            style={{
              padding: '12px',
              background: '#334155',
              color: '#e2e8f0',
              border: '1px solid #475569',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Show {Math.min(50, visibleKeys.length - visibleCount)} more
            <span style={{ color: '#94a3b8', marginLeft: 8 }}>
              ({visibleCount} of {visibleKeys.length})
            </span>
          </button>
        )}
      </div>

      {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
    </div>
  );
}


function InstructionsModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position:   'fixed',
        inset:      0,
        background: 'rgba(0,0,0,0.7)',
        zIndex:     1000,
        display:    'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding:    '40px 20px',
        overflowY:  'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:   '#1e293b',
          color:        '#e2e8f0',
          maxWidth:     780,
          width:        '100%',
          borderRadius: 12,
          border:       '1px solid #334155',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          padding:      '16px 24px',
          borderBottom: '1px solid #334155',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          position:     'sticky',
          top:          0,
          background:   '#1e293b',
          borderRadius: '12px 12px 0 0',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            🎯 Category Picks Pipeline — How to use this UI
          </div>
          <button
            onClick={onClose}
            style={{
              background:   'transparent',
              color:        '#94a3b8',
              border:       '1px solid #475569',
              borderRadius: 6,
              padding:      '4px 10px',
              fontSize:     14,
              cursor:       'pointer',
            }}
          >
            ✕ Close
          </button>
        </div>

        <div style={{ padding: '20px 24px', fontSize: 14, lineHeight: 1.6 }}>
          <Section title="Getting here next time">
            <p style={p}>With <Code>npm run dev</Code> running in your terminal, open:</p>
            <Code block>http://localhost:5173/?dev=audit</Code>
            <p style={p}>The <Code>?dev=audit</Code> part is the magic key — without it you get the normal app.</p>
            <p style={small}>This page only renders during <Code>npm run dev</Code> and is never bundled into the production build on Vercel.</p>
          </Section>

          <Section title="Reading a song card">
            <p style={p}>Each song card shows the 5 lyric-based categories. For each pick:</p>
            <ul style={ul}>
              <li><b>Category emoji + name</b> — 💕 Most Romantic, 💔 Most Devastating, 😭 Cry Factor, 📖 Best Storytelling, ✍️ Best Lyrics</li>
              <li><b>Score pill</b> — colored 0–100 fitness rating: green ≥70 (strong), yellow ≥50 (moderate), orange ≥30 (weak), red &lt;30 (forced/exclude)</li>
              <li><b>The picked line</b> in italics, with quote marks</li>
              <li><b>Reasoning</b> — a one-line note explaining why this line was chosen</li>
            </ul>
          </Section>

          <Section title="Acting on a pick">
            <ul style={ul}>
              <li>
                <b>Don't like the pick?</b> Click <Pill color="#ef4444">✗ Reject</Pill>.
                The button changes to "✗ Rejected", the line gets a strike-through and red border. The save button at the top will show "Save changes (N)".
              </li>
              <li>
                <b>Want a different specific line?</b> Click <Pill color="#f97316">✏️ Override</Pill>.
                A panel slides open with every synced line in the song, grouped by section ([Verse 1], [Chorus], etc.) with timestamps. Click any line to use it. Click <b>Clear override</b> to undo.
              </li>
              <li>
                <b>Reject AND override the same pick?</b> Allowed — the override wins. Reject is just visual feedback that you didn't like the original.
              </li>
            </ul>
          </Section>

          <Section title="Saving">
            <p style={p}>When you're done with a batch, click the green <Pill color="#16a34a">Save changes (N)</Pill> button at the top right. It writes back to <Code>src/data/categoryTimesAudit.json</Code> on disk and shows "Saved N entries" briefly.</p>
            <p style={p}>Reload the page any time — your saved changes persist.</p>
          </Section>

          <Section title="Filters and search">
            <p style={p}>The <b>Filter dropdown</b> options:</p>
            <ul style={ul}>
              <li><b>Processed</b> (default) — songs picks have been made for</li>
              <li><b>Unprocessed</b> — songs still waiting for picks (use this to see what's left)</li>
              <li><b>Has rejections</b> — songs where you've rejected at least one pick</li>
              <li><b>Has overrides</b> — songs where you've overridden at least one pick</li>
              <li><b>All songs</b> — every song in the catalog (heavy — uses pagination)</li>
            </ul>
            <p style={p}>The <b>Search box</b> filters by song name or album name. Try typing "lover" or "all too well".</p>
          </Section>

          <Section title="When you're satisfied">
            <p style={p}>After all your reject/override decisions are saved, in your terminal run:</p>
            <Code block>python find_category_times.py</Code>
            <p style={p}>This regenerates <Code>src/data/spotifyCategoryTimes.js</Code> honoring your changes (rejected picks become <Code>null</Code>, overrides replace the original line). The bracket builder picks up the new data automatically.</p>
          </Section>

          <Section title="Quick troubleshooting">
            <ul style={ul}>
              <li><b>Page is blank or shows the normal app</b> → you forgot the <Code>?dev=audit</Code> part of the URL</li>
              <li><b>"Loading audit data…" forever</b> → Vite dev server isn't running; check the terminal</li>
              <li><b>Save button is grey</b> → no unsaved changes (greyed out is correct)</li>
              <li><b>Save shows "Error: ..."</b> → check the dev server terminal; usually means Vite restarted and just needs a moment</li>
            </ul>
          </Section>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #334155' }}>
            <button
              onClick={onClose}
              style={{
                padding:      '8px 20px',
                background:   '#475569',
                color:        '#fff',
                border:       'none',
                borderRadius: 6,
                fontSize:     14,
                cursor:       'pointer',
              }}
            >
              Got it, close this
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// Inline style helpers for InstructionsModal
const p     = { margin: '0 0 10px 0' };
const small = { margin: '0 0 10px 0', fontSize: 12, color: '#94a3b8' };
const ul    = { margin: '0 0 10px 18px', padding: 0 };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontSize: 15,
        fontWeight: 700,
        color: '#cbd5e1',
        margin: '0 0 8px 0',
        borderBottom: '1px solid #334155',
        paddingBottom: 4,
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Code({ children, block }) {
  if (block) {
    return (
      <pre style={{
        background:   '#0f172a',
        color:        '#86efac',
        padding:      '10px 14px',
        borderRadius: 6,
        margin:       '4px 0 12px 0',
        fontSize:     13,
        fontFamily:   'ui-monospace, SFMono-Regular, Menlo, monospace',
        overflowX:    'auto',
      }}>{children}</pre>
    );
  }
  return (
    <code style={{
      background:   '#0f172a',
      color:        '#86efac',
      padding:      '1px 6px',
      borderRadius: 4,
      fontSize:     12,
      fontFamily:   'ui-monospace, SFMono-Regular, Menlo, monospace',
    }}>{children}</code>
  );
}

function Pill({ color, children }) {
  return (
    <span style={{
      display:      'inline-block',
      padding:      '1px 8px',
      borderRadius: 4,
      border:       `1px solid ${color}`,
      color:        color,
      fontSize:     12,
      fontWeight:   600,
      whiteSpace:   'nowrap',
    }}>{children}</span>
  );
}


function SongCard({ songKey, audit, syncedSong, isDirty, updatePick, overrideOpen, setOverrideOpen }) {
  const [aid, idxStr] = songKey.split('_');
  const idx = parseInt(idxStr, 10);
  const songName = SONGS[aid]?.[idx] || '(unknown)';
  const album    = ALBUM_BY_ID[aid] || { name: aid, icon: '🎵', color: '#475569' };

  const picks = audit?.picks;
  const isUnprocessed = !picks;

  return (
    <div style={{
      background:   '#1e293b',
      border:       isDirty ? '2px solid #eab308' : '1px solid #334155',
      borderRadius: 10,
      overflow:     'hidden',
    }}>
      {/* Song header */}
      <div style={{
        background: album.color,
        color:      '#1f2937',
        padding:    '12px 16px',
        display:    'flex',
        alignItems: 'center',
        gap:        12,
      }}>
        <div style={{ fontSize: 24 }}>{album.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{songName}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{album.name} · {songKey}</div>
        </div>
        {isUnprocessed && (
          <div style={{
            fontSize: 12,
            background: '#475569',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 999,
          }}>
            Unprocessed
          </div>
        )}
        {isDirty && (
          <div style={{
            fontSize: 12,
            background: '#eab308',
            color: '#1f2937',
            padding: '4px 10px',
            borderRadius: 999,
            fontWeight: 600,
          }}>
            Unsaved
          </div>
        )}
      </div>

      {/* Picks grid */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CATEGORY_DEFS.map(cat => (
          <PickRow
            key={cat.id}
            songKey={songKey}
            category={cat}
            pick={picks?.[cat.id]}
            syncedSong={syncedSong}
            updatePick={updatePick}
            isOverrideOpen={overrideOpen?.key === songKey && overrideOpen?.cid === cat.id}
            setOverrideOpen={setOverrideOpen}
          />
        ))}
      </div>
    </div>
  );
}


function PickRow({ songKey, category, pick, syncedSong, updatePick, isOverrideOpen, setOverrideOpen }) {
  const hasData = pick && (pick.line !== null || pick.score > 0);
  const rejected   = pick?.rejected;
  const overridden = !!pick?.manualLine;
  const effectiveLine = pick?.manualLine ?? pick?.line;

  // Border colour reflects status
  let borderColor = '#334155'; // unset
  if (rejected)   borderColor = '#ef4444';
  else if (overridden) borderColor = '#f97316';
  else if (hasData)    borderColor = '#22c55e';

  return (
    <div style={{
      border:       `2px solid ${borderColor}`,
      borderRadius: 8,
      padding:      10,
      background:   '#0f172a',
      opacity:      rejected ? 0.55 : 1,
    }}>
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        10,
        marginBottom: hasData ? 6 : 0,
      }}>
        <div style={{ fontSize: 18 }}>{category.emoji}</div>
        <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{category.label}</div>

        {hasData && (
          <div style={{
            background: scoreColor(pick.score),
            color:      '#fff',
            padding:    '2px 10px',
            borderRadius: 999,
            fontSize:   12,
            fontWeight: 700,
          }}>
            {pick.score}
          </div>
        )}

        {hasData && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => updatePick(songKey, category.id, { rejected: !rejected })}
              title={rejected ? 'Un-reject' : 'Reject this pick'}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                background: rejected ? '#ef4444' : 'transparent',
                color: rejected ? '#fff' : '#fca5a5',
                border: '1px solid #ef4444',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {rejected ? '✗ Rejected' : '✗ Reject'}
            </button>
            <button
              onClick={() => setOverrideOpen(isOverrideOpen ? null : { key: songKey, cid: category.id })}
              title="Override with a different line"
              style={{
                padding: '4px 8px',
                fontSize: 12,
                background: overridden ? '#f97316' : 'transparent',
                color: overridden ? '#fff' : '#fdba74',
                border: '1px solid #f97316',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {overridden ? '✏️ Overridden' : '✏️ Override'}
            </button>
          </div>
        )}
      </div>

      {hasData && pick.line === null && (
        <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
          (intentionally null — category doesn't apply)
        </div>
      )}

      {hasData && effectiveLine && (
        <div style={{
          fontSize:    14,
          color:       overridden ? '#fdba74' : '#cbd5e1',
          fontStyle:   'italic',
          textDecoration: rejected ? 'line-through' : 'none',
          marginBottom: 4,
        }}>
          “{effectiveLine}”
          {overridden && <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'normal', marginLeft: 6 }}>(manual)</span>}
        </div>
      )}

      {hasData && pick.reasoning && (
        <div style={{ fontSize: 12, color: '#64748b' }}>{pick.reasoning}</div>
      )}

      {!hasData && (
        <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>No pick yet.</div>
      )}

      {/* Override dropdown — list every line in the song */}
      {isOverrideOpen && (
        <OverridePanel
          syncedSong={syncedSong}
          currentLine={effectiveLine}
          onPick={(line) => {
            updatePick(songKey, category.id, { manualLine: line || null });
            setOverrideOpen(null);
          }}
          onClose={() => setOverrideOpen(null)}
        />
      )}
    </div>
  );
}


function OverridePanel({ syncedSong, currentLine, onPick, onClose }) {
  if (!syncedSong) {
    return (
      <div style={{ marginTop: 8, padding: 10, background: '#1e293b', borderRadius: 6, fontSize: 13, color: '#94a3b8' }}>
        Synced lyrics not available for this song. Cannot override.
        <button onClick={onClose} style={{ marginLeft: 8, padding: '2px 8px', fontSize: 12 }}>Close</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8, padding: 10, background: '#1e293b', borderRadius: 6, maxHeight: 300, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Pick a different line:</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => onPick(null)}
            style={{ fontSize: 11, padding: '2px 8px', background: '#475569', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Clear override
          </button>
          <button onClick={onClose} style={{ fontSize: 11, padding: '2px 8px', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: 4, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
      {syncedSong.sections.map((sec, secIdx) => (
        <div key={secIdx} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
            [{sec.label}]{sec.startMs != null ? ` @${Math.floor(sec.startMs / 1000)}s` : ''}
          </div>
          {sec.lines.map((ln, lnIdx) => {
            const isCurrent = ln.text === currentLine;
            return (
              <div
                key={lnIdx}
                onClick={() => onPick(ln.text)}
                style={{
                  padding: '4px 8px',
                  fontSize: 13,
                  cursor: 'pointer',
                  background: isCurrent ? '#f97316' : 'transparent',
                  color: isCurrent ? '#fff' : '#cbd5e1',
                  borderRadius: 3,
                  marginLeft: 12,
                }}
                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = '#334155'; }}
                onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: '#64748b', fontSize: 11, marginRight: 6 }}>
                  {ln.ms != null ? `${Math.floor(ln.ms / 1000)}s` : '—'}
                </span>
                {ln.text}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
