// Spotify Web Playback SDK integration.
// Uses the PKCE OAuth flow — no client secret needed on the client side.
//
// SETUP (one-time, done by developer):
//   1. Create an app at https://developer.spotify.com/dashboard
//   2. Add redirect URIs:
//        http://localhost:5173/
//        https://eras-ranker.vercel.app/
//   3. Add VITE_SPOTIFY_CLIENT_ID=<your_client_id> to .env
//   4. Add VITE_SPOTIFY_CLIENT_ID to Vercel environment variables
//
// Users need a Spotify Premium account for Web Playback SDK.
import { useState, useEffect, useCallback, useRef } from 'react';
import { ALBUMS, SONGS } from '../data/albums';
import { SPOTIFY_START_TIMES } from '../data/spotifyStartTimes';
import { SPOTIFY_BRIDGE_TIMES } from '../data/spotifyBridgeTimes';

const CLIENT_ID   = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '';
const REDIRECT_URI = window.location.origin + '/';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
].join(' ');

// localStorage keys
const TOKEN_KEY   = 'spotify_access_token';
const REFRESH_KEY = 'spotify_refresh_token';
const EXPIRY_KEY  = 'spotify_token_expiry';
const CACHE_KEY   = 'eras_spotify_tracks';     // song-URI lookup cache
const ART_KEY     = 'eras_spotify_album_art';  // albumId → image URL cache

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(length);
  window.crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}

async function computeChallenge(verifier) {
  const data   = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// ── Token storage ─────────────────────────────────────────────────────────────

function loadToken() {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
  if (!token || Date.now() > expiry) return null;
  return token;
}

function saveTokens(access, refresh, expiresIn) {
  localStorage.setItem(TOKEN_KEY,   access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  // Subtract 60s as a safety margin so we refresh slightly before expiry
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + (expiresIn - 60) * 1000));
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

// ── Track URI cache ───────────────────────────────────────────────────────────

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
  catch { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
  catch { /* storage full — ignore */ }
}

// ── Album art cache ───────────────────────────────────────────────────────────

function loadArtCache() {
  try { return JSON.parse(localStorage.getItem(ART_KEY) || '{}'); }
  catch { return {}; }
}

function saveArtCache(cache) {
  try { localStorage.setItem(ART_KEY, JSON.stringify(cache)); }
  catch { /* storage full — ignore */ }
}

// ── Spotify API helpers ───────────────────────────────────────────────────────

async function exchangeCode(code, verifier) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

async function doRefresh(refreshToken) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return res.json();
}

// Returns a fresh access token, refreshing if expired. Returns null if impossible.
async function getFreshToken() {
  const token = loadToken();
  if (token) return token;

  const rt = localStorage.getItem(REFRESH_KEY);
  if (!rt) return null;

  try {
    const { access_token, refresh_token, expires_in } = await doRefresh(rt);
    saveTokens(access_token, refresh_token, expires_in);
    return access_token;
  } catch {
    clearTokens();
    return null;
  }
}

// Strips parenthetical suffixes that break Spotify search
// e.g. "(From The Vault)", "(feat. Post Malone)", "(Taylor's Version)"
function cleanName(name) {
  return name
    .replace(/\s*\(From The Vault\)/i, '')
    .replace(/\s*\(feat\..*?\)/i, '')
    .replace(/\s*\(Taylor's Version\)/i, '')
    .trim();
}

// Searches Spotify for a track and returns its URI, or null if not found.
async function searchTrackUri(songName, albumName, token) {
  const clean = cleanName(songName);
  const q = encodeURIComponent(`track:${clean} artist:taylor swift`);
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=track&limit=5&market=US`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.tracks?.items ?? [];
    if (!items.length) return null;

    // Prefer a result from the same album — try exact match first, then prefix, then loose.
    // This avoids picking acoustic/deluxe editions over the original when both appear in results.
    const cleanAlbum = albumName.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const itemAlbum  = t => t.album.name.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const exact   = items.find(t => itemAlbum(t) === cleanAlbum);
    const prefix  = items.find(t => itemAlbum(t).startsWith(cleanAlbum));
    const loose   = items.find(t => itemAlbum(t).includes(cleanAlbum.slice(0, 12)));
    const best = exact ?? prefix ?? loose ?? items[0];
    const images = best.album.images;
    // Prefer medium size (index 1 ~300px); fall back to largest if only one size
    const imageUrl = (images[1] ?? images[0])?.url ?? null;
    return { uri: best.uri, imageUrl };
  } catch {
    return null;
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useSpotify() {
  // Whether a valid token exists in localStorage
  const [isConnected, setIsConnected]     = useState(() => !!loadToken());
  const [isLoading, setIsLoading]         = useState(false);
  const [playerReady, setPlayerReady]     = useState(false);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [currentSongName, setCurrentSongName] = useState(null);
  const [error, setError]                 = useState(null);
  const [albumArt, setAlbumArt]           = useState(loadArtCache);

  const playerRef    = useRef(null);
  const deviceIdRef  = useRef(null);
  const trackCache   = useRef(loadCache());
  const artCache     = useRef(loadArtCache());

  // ── Handle redirect back from Spotify (code in URL) ─────────────────────
  useEffect(() => {
    if (!CLIENT_ID) return;

    const params  = new URLSearchParams(window.location.search);
    const code    = params.get('code');
    const state   = params.get('state');
    if (!code || state !== 'eras_spotify') return;

    const verifier = sessionStorage.getItem('spotify_pkce_verifier');
    if (!verifier) return;

    // Remove the auth params from the URL immediately
    window.history.replaceState({}, '', window.location.pathname);
    sessionStorage.removeItem('spotify_pkce_verifier');

    setIsLoading(true);
    exchangeCode(code, verifier)
      .then(({ access_token, refresh_token, expires_in }) => {
        saveTokens(access_token, refresh_token, expires_in);
        setIsConnected(true);
        setError(null);
      })
      .catch(() => setError('Could not connect to Spotify. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  // ── Load SDK + init player whenever we have a valid token ────────────────
  useEffect(() => {
    if (!isConnected) return;

    function init() {
      if (playerRef.current) return; // already initialized

      const player = new window.Spotify.Player({
        name: 'Eras Ranker',
        getOAuthToken: async (cb) => {
          const t = await getFreshToken();
          if (t) { cb(t); }
          else {
            clearTokens();
            setIsConnected(false);
          }
        },
        volume: 0.8,
      });

      player.addListener('ready', ({ device_id }) => {
        deviceIdRef.current = device_id;
        setPlayerReady(true);
      });

      player.addListener('not_ready', () => {
        setPlayerReady(false);
      });

      player.addListener('player_state_changed', (state) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setCurrentSongName(state.track_window?.current_track?.name ?? null);
      });

      player.addListener('authentication_error', ({ message }) => {
        // Usually means the user isn't Premium or the token expired
        setError(
          message?.toLowerCase().includes('premium')
            ? 'Spotify Premium is required for in-app playback.'
            : 'Spotify authentication failed. Please reconnect.'
        );
        clearTokens();
        setIsConnected(false);
        setPlayerReady(false);
      });

      player.addListener('initialization_error', () => {
        setError('Spotify player could not load. Make sure you have a Premium account.');
      });

      player.connect();
      playerRef.current = player;
    }

    if (window.Spotify?.Player) {
      init();
    } else {
      window.onSpotifyWebPlaybackSDKReady = init;
      if (!document.getElementById('spotify-sdk-script')) {
        const script = document.createElement('script');
        script.id  = 'spotify-sdk-script';
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        document.head.appendChild(script);
      }
    }
  }, [isConnected]);

  // ── Proactively fetch album art for all albums when connected ─────────────
  useEffect(() => {
    if (!isConnected) return;

    async function prefetchArt() {
      const token = await getFreshToken();
      if (!token) return;

      const updated = { ...artCache.current };
      let changed = false;

      for (const album of ALBUMS) {
        if (updated[album.id]) continue; // already cached
        const songName = SONGS[album.id]?.[0];
        if (!songName) continue;
        const result = await searchTrackUri(songName, album.name, token);
        if (result?.imageUrl) {
          updated[album.id] = result.imageUrl;
          changed = true;
        }
      }

      if (changed) {
        artCache.current = updated;
        saveArtCache(updated);
        setAlbumArt({ ...updated });
      }
    }

    prefetchArt();
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Connect: kick off PKCE OAuth flow ────────────────────────────────────
  const connect = useCallback(async () => {
    if (!CLIENT_ID) {
      setError('Spotify is not configured yet. Add VITE_SPOTIFY_CLIENT_ID to your .env file.');
      return;
    }
    setError(null);
    const verifier  = generateRandomString(64);
    const challenge = await computeChallenge(verifier);
    sessionStorage.setItem('spotify_pkce_verifier', verifier);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state: 'eras_spotify',
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    playerRef.current?.disconnect();
    playerRef.current   = null;
    deviceIdRef.current = null;
    clearTokens();
    // Clear art + track caches so reconnecting always re-fetches with fresh data
    localStorage.removeItem(ART_KEY);
    localStorage.removeItem(CACHE_KEY);
    artCache.current   = {};
    trackCache.current = {};
    setAlbumArt({});
    setIsConnected(false);
    setPlayerReady(false);
    setIsPlaying(false);
    setCurrentSongName(null);
    setError(null);
  }, []);

  // ── Play a specific song ──────────────────────────────────────────────────
  // albumId + songIndex are used as the cache key; songName + albumName for the search.
  // screen: 'shuffle' (first screen) | 'bridge' (bridge category)
  const playTrack = useCallback(async (albumId, songIndex, songName, albumName, screen = 'shuffle') => {
    const token = await getFreshToken();
    if (!token || !deviceIdRef.current) return;

    const cacheKey = `${albumId}_${songIndex}`;
    let uri = trackCache.current[cacheKey];

    if (!uri) {
      const result = await searchTrackUri(songName, albumName, token);
      if (result?.uri) {
        uri = result.uri;
        trackCache.current[cacheKey] = uri;
        saveCache(trackCache.current);
        // Cache art as a bonus if we don't have it yet for this album
        if (result.imageUrl && !artCache.current[albumId]) {
          artCache.current[albumId] = result.imageUrl;
          saveArtCache(artCache.current);
          setAlbumArt(prev => ({ ...prev, [albumId]: result.imageUrl }));
        }
      }
    }

    if (!uri) return; // song not found on Spotify

    const startMs = screen === 'bridge'
      ? (SPOTIFY_BRIDGE_TIMES[cacheKey] ?? 0)
      : (SPOTIFY_START_TIMES[cacheKey] ?? 0);

    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: [uri], position_ms: startMs }),
        }
      );
    } catch { /* ignore playback errors silently */ }
  }, []);

  const pause      = useCallback(() => playerRef.current?.pause(),  []);
  const resume     = useCallback(() => playerRef.current?.resume(), []);
  const togglePlay = useCallback(() => {
    if (isPlaying) pause(); else resume();
  }, [isPlaying, pause, resume]);

  const setVolume = useCallback((value) => {
    playerRef.current?.setVolume(value);
  }, []);

  return {
    isConnected,
    isLoading,
    playerReady,
    isPlaying,
    currentSongName,
    albumArt,
    error,
    connect,
    disconnect,
    playTrack,
    pause,
    resume,
    togglePlay,
    setVolume,
  };
}
