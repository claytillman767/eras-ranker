import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ScoreBar from './ScoreBar';

// Read-only public profile screen. Reached via /u/{uid}.
//
// For v1, the only visibility level is 'unlisted' (anyone with the link).
// If the profile is off or doesn't exist, we render a friendly "not
// available" state without leaking whether the uid exists at all.
export default function ProfileView({ uid }) {
  const [state, setState] = useState({ status: 'loading', profile: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', profile: null });
    getDoc(doc(db, 'profiles', uid))
      .then(snap => {
        if (cancelled) return;
        if (!snap.exists()) {
          setState({ status: 'unavailable', profile: null });
          return;
        }
        const data = snap.data();
        if (data.visibility !== 'unlisted') {
          setState({ status: 'unavailable', profile: null });
          return;
        }
        setState({ status: 'ok', profile: data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unavailable', profile: null });
      });
    return () => { cancelled = true; };
  }, [uid]);

  function goHome() {
    history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  // ── Loading shell ──────────────────────────────────────────────────────
  if (state.status === 'loading') {
    return (
      <Shell>
        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
          Loading profile…
        </div>
      </Shell>
    );
  }

  // ── Profile off / not found ────────────────────────────────────────────
  if (state.status === 'unavailable') {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
            This profile isn't available
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, maxWidth: 320, margin: '0 auto 20px' }}>
            The link may have been turned off, or it never existed. The owner
            decides whether their profile is public.
          </div>
          <button
            onClick={goHome}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              border: 'none',
              borderRadius: 12,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
            }}
          >
            Go to The Eras Ranker →
          </button>
        </div>
      </Shell>
    );
  }

  // ── OK ─────────────────────────────────────────────────────────────────
  const p = state.profile;
  const rankings = Array.isArray(p.albumRankings) ? p.albumRankings : [];
  const maxScore = rankings[0]?.score ?? 100;

  return (
    <Shell onHome={goHome}>
      {/* Identity */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '4px 0 18px',
        borderBottom: '0.5px solid #f3f4f6',
        marginBottom: 18,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '2px solid #a855f7',
          overflow: 'hidden',
          background: '#f3e8ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {p.photoURL ? (
            <img src={p.photoURL} alt={p.displayName || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 22, fontWeight: 700, color: '#a855f7' }}>
              {(p.displayName || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
            {p.displayName || 'A Swiftie'}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', letterSpacing: '0.04em' }}>
            ALBUM RANKINGS
          </div>
        </div>
      </div>

      {/* Bio */}
      {p.bio && (
        <div style={{
          fontSize: 13,
          color: '#374151',
          lineHeight: 1.55,
          marginBottom: 22,
          padding: '12px 14px',
          background: '#faf5ff',
          border: '0.5px solid #e9d5ff',
          borderRadius: 10,
        }}>
          {p.bio}
        </div>
      )}

      {/* Album rankings */}
      {rankings.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '30px 0' }}>
          No albums rated yet.
        </div>
      ) : rankings.map((album, i) => (
        <div key={album.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 0',
          borderBottom: '0.5px solid #f3f4f6',
        }}>
          <span style={{ fontSize: i < 3 ? 16 : 12, color: '#9ca3af', width: 28, textAlign: 'center' }}>
            {rankIcon(i)}
          </span>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
          }}>
            {album.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {album.name}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{album.year}</div>
          </div>
          <ScoreBar score={album.score} maxScore={maxScore} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#a855f7', width: 28, textAlign: 'right' }}>
            {album.score}
          </span>
        </div>
      ))}

      {/* Footer CTA — drives traffic back to the app */}
      <div style={{
        marginTop: 28,
        padding: '14px',
        background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
        border: '0.5px solid #e9d5ff',
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
          Want to rank your own?
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
          The Eras Ranker lets every Swiftie score and share their picks.
        </div>
        <button
          onClick={goHome}
          style={{
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            border: 'none',
            borderRadius: 10,
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Open The Eras Ranker →
        </button>
      </div>
    </Shell>
  );
}

function rankIcon(i) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `#${i + 1}`;
}

// Page chrome shared across loading/unavailable/ok states.
function Shell({ children, onHome }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '20px 18px 60px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#a855f7' }}>
            The Eras Ranker
          </div>
          {onHome && (
            <button
              onClick={onHome}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 13,
                color: '#6b7280',
                fontWeight: 500,
                cursor: 'pointer',
                padding: 4,
              }}
            >
              Open the app →
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
