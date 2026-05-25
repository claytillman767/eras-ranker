import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import RankingList from './RankingList';

// Read-only public profile screen. Reached via /u/{uid}.
//
// For v1, the only visibility level is 'unlisted' (anyone with the link).
// If the profile is off or doesn't exist, we render a friendly "not
// available" state without leaking whether the uid exists at all.
//
// The album + song leaderboard uses the shared RankingList component, so a
// visitor sees the exact same thing the owner sees on their Rankings tab.
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
        <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, padding: '40px 0' }}>
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
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            This profile isn't available
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 320, margin: '0 auto 20px' }}>
            The link may have been turned off, or it never existed. The owner
            decides whether their profile is public.
          </div>
          <button
            onClick={goHome}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
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
  const albums = Array.isArray(p.albumRankings) ? p.albumRankings : [];
  const songs = Array.isArray(p.songRankings) ? p.songRankings : [];

  return (
    <Shell onHome={goHome}>
      {/* Identity */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '4px 0 18px',
        borderBottom: '0.5px solid var(--hairline)',
        marginBottom: 18,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '2px solid var(--brand)',
          overflow: 'hidden',
          background: 'var(--accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {p.photoURL ? (
            <img src={p.photoURL} alt={p.displayName || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-text)' }}>
              {(p.displayName || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
            {p.displayName || 'A Swiftie'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.04em' }}>
            ALBUM &amp; SONG RANKINGS
          </div>
        </div>
      </div>

      {/* Bio */}
      {p.bio && (
        <div style={{
          fontSize: 13,
          color: 'var(--text-strong)',
          lineHeight: 1.55,
          marginBottom: 22,
          padding: '12px 14px',
          background: 'var(--accent-soft)',
          border: '0.5px solid var(--accent-soft-2)',
          borderRadius: 10,
        }}>
          {p.bio}
        </div>
      )}

      {/* Album + song rankings — shared with the owner's Rankings tab */}
      {albums.length === 0 && songs.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, padding: '30px 0' }}>
          No albums rated yet.
        </div>
      ) : (
        <RankingList albums={albums} songs={songs} />
      )}

      {/* Footer CTA — drives traffic back to the app */}
      <div style={{
        marginTop: 28,
        padding: '14px',
        background: 'linear-gradient(135deg, var(--accent-grad-a), var(--accent-soft))',
        border: '0.5px solid var(--accent-soft-2)',
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
          Want to rank your own?
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
          The Eras Ranker lets every Swiftie score and share their picks.
        </div>
        <button
          onClick={goHome}
          style={{
            padding: '9px 18px',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
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

// Page chrome shared across loading/unavailable/ok states.
function Shell({ children, onHome }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
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
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-text)' }}>
            The Eras Ranker
          </div>
          {onHome && (
            <button
              onClick={onHome}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 13,
                color: 'var(--text-2)',
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
