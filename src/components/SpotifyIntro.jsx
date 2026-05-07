import { useEffect } from 'react';
import { ALBUMS } from '../data/albums';
import SpotifyBadge from './SpotifyBadge';
import Spinner from './Spinner';

// Shown ONCE per device, right after a user signs in with Google for the
// first time and before the Welcome tour. Asks them to connect Spotify so
// the rest of the app — including the Welcome tour's album carousel — uses
// real cover art instead of emoji fallbacks. Skip-able, and the user can
// still connect later from Settings.
//
// localStorage flag: eras_spotify_intro_seen — set on either Connect or Skip
// so the screen never reappears.

const INTRO_KEY = 'eras_spotify_intro_seen';

export function hasSeenSpotifyIntro() {
  return localStorage.getItem(INTRO_KEY) === '1';
}

export function markSpotifyIntroSeen() {
  localStorage.setItem(INTRO_KEY, '1');
}

export default function SpotifyIntro({ spotify, onContinue }) {
  // Auto-skip if Spotify is already connected (e.g. user reconnects after a
  // sign-out). They've already seen the value — no point gating them again.
  useEffect(() => {
    if (spotify?.isConnected) {
      markSpotifyIntroSeen();
      onContinue();
    }
  }, [spotify?.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleConnect() {
    markSpotifyIntroSeen();
    spotify?.connect?.(); // redirects to Spotify OAuth — won't return to this screen
  }

  function handleSkip() {
    markSpotifyIntroSeen();
    onContinue();
  }

  // Pick a handful of representative albums for the small preview row at the
  // top. Order tracks the in-app carousel feel — vibrant, recognisable picks.
  const previewIds = ['fl', 'ml', 'rd', '89', 'lv'];
  const previewAlbums = previewIds
    .map(id => ALBUMS.find(a => a.id === id))
    .filter(Boolean);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(180deg, #fdf4ff 0%, #ffffff 50%, #f0fdf4 100%)',
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowY: 'auto',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 24px 32px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Album preview — emoji fallback row, with a subtle "→ real art" cue */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}>
          {previewAlbums.map((album, i) => (
            <div
              key={album.id}
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: album.color,
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                animation: `spotify-intro-pop 0.5s ${i * 0.06}s cubic-bezier(0.2, 0.8, 0.3, 1.2) both`,
              }}
            >
              {album.icon}
            </div>
          ))}
        </div>

        <div style={{
          fontSize: 12,
          color: '#9ca3af',
          textAlign: 'center',
          marginBottom: 28,
          letterSpacing: '0.04em',
        }}>
          Today: emoji placeholders
        </div>

        <style>{`
          @keyframes spotify-intro-pop {
            0%   { transform: scale(0.4) translateY(10px); opacity: 0; }
            60%  { transform: scale(1.06) translateY(-2px); opacity: 1; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Heading */}
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#111827',
          textAlign: 'center',
          marginBottom: 10,
          lineHeight: 1.25,
        }}>
          See the real album art?
        </div>
        <div style={{
          fontSize: 14,
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          Connect Spotify and every album in the app will show the real album cover.
          A free Spotify account is enough for album art; Spotify Premium is required if you also want songs to play in-app.
        </div>

        {/* Connect Spotify — Spotify branding (green on white) */}
        <button
          onClick={handleConnect}
          disabled={spotify?.isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: spotify?.isLoading ? '#a7f3d0' : '#1DB954',
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 700,
            cursor: spotify?.isLoading ? 'default' : 'pointer',
            boxShadow: '0 4px 14px rgba(29,185,84,0.28)',
            marginBottom: 10,
          }}
        >
          {spotify?.isLoading ? <Spinner size={18} /> : <SpotifyBadge variant="white" size={22} />}
          {spotify?.isLoading ? 'Connecting…' : 'Connect Spotify'}
        </button>

        {/* Skip — keeps emoji placeholders */}
        <button
          onClick={handleSkip}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '0.5px solid #e5e7eb',
            background: '#ffffff',
            color: '#6b7280',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: 14,
          }}
        >
          Skip — I'll keep the emoji placeholders
        </button>

        {/* Footer note */}
        <div style={{
          fontSize: 11,
          color: '#9ca3af',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          You can connect any time from Settings → Spotify.
          With Eras Ranker Pro plus a Spotify Premium account, songs autoplay while you rate.
        </div>

        {/* Spotify connection error (rare, but surface it instead of silently failing) */}
        {spotify?.error && (
          <div style={{
            marginTop: 14,
            fontSize: 12,
            color: '#dc2626',
            background: '#fef2f2',
            border: '0.5px solid #fecaca',
            borderRadius: 8,
            padding: '8px 12px',
            textAlign: 'center',
          }}>
            {spotify.error}
          </div>
        )}
      </div>
    </div>
  );
}
