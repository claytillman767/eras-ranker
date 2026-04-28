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

import { SPOTIFY_START_TIMES } from '../data/spotifyStartTimes';

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

    // Prefer a result from the same album (loose match)
    const shortAlbum = albumName.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 12);
    const match = items.find(t =>
      t.album.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').includes(shortAlbum)
    );
    return (match ?? items[0]).uri;
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

  const playerRef    = useRef(null);
  const deviceIdRef  = useRef(null);
  const trackCache   = useRef(loadCache());

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
    setIsConnected(false);
    setPlayerReady(false);
    setIsPlaying(false);
    setCurrentSongName(null);
    setError(null);
  }, []);

  // ── Play a specific song ──────────────────────────────────────────────────
  // albumId + songIndex are used as the cache key; songName + albumName for the search.
  const playTrack = useCallback(async (albumId, songIndex, songName, albumName) => {
    const token = await getFreshToken();
    if (!token || !deviceIdRef.current) return;

    const cacheKey = `${albumId}_${songIndex}`;
    let uri = trackCache.current[cacheKey];

    if (!uri) {
      uri = await searchTrackUri(songName, albumName, token);
      if (uri) {
        trackCache.current[cacheKey] = uri;
        saveCache(trackCache.current);
      }
    }

    if (!uri) return; // song not found on Spotify

    const startMs = SPOTIFY_START_TIMES[cacheKey] ?? 0;

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

  return {
    isConnected,
    isLoading,
    playerReady,
    isPlaying,
    currentSongName,
    error,
    connect,
    disconnect,
    playTrack,
    pause,
    resume,
    togglePlay,
  };
}
