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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
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
const ART_KEY     = 'eras_spotify_album_art';  // albumId → { url, spotifyAlbumId } cache
const PRODUCT_KEY = 'eras_spotify_product';    // 'premium' | 'free' | 'open' (cached /me result)

// Spotify's developer terms cap caching of catalog content (track URIs, album
// art URLs, etc.) at 24 hours unless explicitly allowed otherwise — entries
// older than this are dropped on load and refetched lazily so we always show
// fresh metadata.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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
// Schema (current): { [`${albumId}_${songIndex}`]: { uri, fetchedAt } }
// Stale entries (older than CACHE_TTL_MS) are dropped on load. Old entries
// stored as plain strings (legacy) are also dropped — they'll be re-resolved
// the next time playTrack runs, costing one extra Search call per song.

function loadCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const now = Date.now();
    const fresh = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v && typeof v === 'object' && v.uri && typeof v.fetchedAt === 'number') {
        if (now - v.fetchedAt < CACHE_TTL_MS) fresh[k] = v;
      }
      // legacy string entries are intentionally dropped — they had no timestamp
    }
    return fresh;
  } catch { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
  catch { /* storage full — ignore */ }
}

// ── Album art cache ───────────────────────────────────────────────────────────
// Schema (current): { [albumId]: { url, spotifyAlbumId, fetchedAt } }
// `spotifyAlbumId` powers the "Open in Spotify" link-back required by
// Spotify's design guidelines wherever album art is shown.

function loadArtCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(ART_KEY) || '{}');
    const now = Date.now();
    const fresh = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v && typeof v === 'object' && v.url && typeof v.fetchedAt === 'number') {
        if (now - v.fetchedAt < CACHE_TTL_MS) fresh[k] = v;
      }
      // legacy plain-URL entries are dropped — they had no timestamp or albumId
    }
    return fresh;
  } catch { return {}; }
}

function saveArtCache(cache) {
  try { localStorage.setItem(ART_KEY, JSON.stringify(cache)); }
  catch { /* storage full — ignore */ }
}

// Flatten the internal art cache (object values) to the {albumId: url} shape
// the rest of the app consumes. Components don't care about the underlying
// timestamp / spotify album id — they just want the image src.
function artUrlMap(cache) {
  const out = {};
  for (const [k, v] of Object.entries(cache)) out[k] = v.url;
  return out;
}

// Same idea for {albumId: spotifyAlbumId} so components that need link-back
// URLs ("Open in Spotify") can read the Spotify album id directly.
function artSpotifyIdMap(cache) {
  const out = {};
  for (const [k, v] of Object.entries(cache)) {
    if (v.spotifyAlbumId) out[k] = v.spotifyAlbumId;
  }
  return out;
}

// ── Spotify API helpers ───────────────────────────────────────────────────────

// Thin fetch wrapper that respects Spotify's rate-limit headers. On a 429
// response we wait the server-suggested duration (capped at 30s so a runaway
// Retry-After can't hang the UI indefinitely) and retry once. Any other
// status — including success — is returned unchanged.
async function spotifyApiFetch(url, init, retries = 1) {
  const res = await fetch(url, init);
  if (res.status === 429 && retries > 0) {
    const headerVal = Number(res.headers.get('Retry-After'));
    const seconds = Number.isFinite(headerVal) && headerVal > 0 ? headerVal : 1;
    const waitMs = Math.min(seconds, 30) * 1000;
    await new Promise(r => setTimeout(r, waitMs));
    return spotifyApiFetch(url, init, retries - 1);
  }
  return res;
}

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

// Fetches the connected Spotify user's product tier ('premium' | 'free' | 'open').
// Premium is required for the Web Playback SDK; free/open accounts can still
// authenticate and use the public Web API (Search), so we keep them connected
// for album art but skip SDK init entirely. Returns null on network failure
// — callers should treat null as "unknown, don't sell Premium-dependent perks."
async function fetchProduct(token) {
  try {
    const res = await spotifyApiFetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product ?? null;
  } catch {
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

// Searches Spotify for a track and returns its URI, the cover image URL, and
// the Spotify album id (used to build "Open in Spotify" link-back URLs).
// Returns null if not found.
async function searchTrackUri(songName, albumName, token) {
  const clean = cleanName(songName);
  const q = encodeURIComponent(`track:${clean} artist:taylor swift`);
  try {
    const res = await spotifyApiFetch(
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
    return {
      uri: best.uri,
      imageUrl,
      spotifyAlbumId: best.album.id ?? null,
    };
  } catch {
    return null;
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useSpotify(user) {
  // Persistent connection: treat the user as connected if EITHER
  //   - a still-valid access token is in localStorage, OR
  //   - a refresh token is in localStorage (the SDK's getOAuthToken callback
  //     will use it to mint a fresh access token automatically).
  // Without this, an expired access token would force the user to re-link
  // Spotify on every visit even though Spotify's refresh token is still good.
  const [isConnected, setIsConnected]     = useState(() => {
    return !!loadToken() || !!localStorage.getItem(REFRESH_KEY);
  });
  const [isLoading, setIsLoading]         = useState(false);
  const [playerReady, setPlayerReady]     = useState(false);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [currentSongName, setCurrentSongName] = useState(null);
  const [error, setError]                 = useState(null);
  // The art cache is stored as { albumId: { url, spotifyAlbumId, fetchedAt } }
  // internally, but we expose two flat maps to consumers:
  //   - albumArt:        { albumId: url }              — for <img src>
  //   - albumSpotifyIds: { albumId: spotifyAlbumId }   — for "Open in Spotify"
  const [artCacheState, setArtCacheState] = useState(loadArtCache);
  const albumArt        = artUrlMap(artCacheState);
  const albumSpotifyIds = artSpotifyIdMap(artCacheState);
  // 'premium' | 'free' | 'open' | null (null = unknown — treat as non-Premium
  // for funnel purposes so we don't sell perks the user can't use). Cached in
  // localStorage so we don't re-fetch on every load.
  const [spotifyProduct, setSpotifyProduct] = useState(() => localStorage.getItem(PRODUCT_KEY));
  const isPremium = spotifyProduct === 'premium';

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
      .then(async ({ access_token, refresh_token, expires_in }) => {
        saveTokens(access_token, refresh_token, expires_in);
        // Detect Premium status immediately so we know whether to init the
        // Web Playback SDK and whether to sell playback-dependent Pro perks
        // to this user. Cached so subsequent loads don't re-fetch.
        const product = await fetchProduct(access_token);
        if (product) {
          localStorage.setItem(PRODUCT_KEY, product);
          setSpotifyProduct(product);
        }
        setIsConnected(true);
        setError(null);
      })
      .catch(() => setError('Could not connect to Spotify. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  // ── On app load with a cached connection, refresh the product tier in case
  // the user's Spotify subscription changed (downgraded from Premium, or
  // upgraded to Premium) since their last visit. Best-effort — failures
  // leave the cached value alone. ─────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) return;
    let cancelled = false;
    (async () => {
      const token = await getFreshToken();
      if (!token || cancelled) return;
      const product = await fetchProduct(token);
      if (cancelled || !product) return;
      localStorage.setItem(PRODUCT_KEY, product);
      setSpotifyProduct(product);
    })();
    return () => { cancelled = true; };
  }, [isConnected]);

  // ── Load SDK + init player whenever we have a valid token ────────────────
  // Only runs for Premium accounts — the Web Playback SDK requires Premium
  // and would just fire authentication_error for free/open accounts. Skipping
  // it entirely for non-Premium keeps them connected for album art (via the
  // Search API, which works for any account) without the doomed init.
  useEffect(() => {
    if (!isConnected) return;
    if (!isPremium) return;

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
        // Defensive: this should rarely fire now that we gate init on
        // isPremium. If it does (e.g. a Premium user who just downgraded),
        // mark them as non-Premium so the rest of the UI catches up — but
        // keep them connected so album art still works.
        if (message?.toLowerCase().includes('premium')) {
          localStorage.setItem(PRODUCT_KEY, 'free');
          setSpotifyProduct('free');
          setPlayerReady(false);
          setError(null);
        } else {
          setError('Spotify authentication failed. Please reconnect.');
          clearTokens();
          setIsConnected(false);
          setPlayerReady(false);
        }
      });

      player.addListener('initialization_error', () => {
        setError('Spotify player could not load. Try reconnecting from Settings.');
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
  }, [isConnected, isPremium]);

  // ── Sync connection state to Firestore so we can see who has linked Spotify ─
  // Writes { spotifyConnected, spotifyLastConnectedAt } onto users/{uid}.
  // No-op when there is no signed-in user (anonymous browsing).
  useEffect(() => {
    if (!user || !db) return;
    const update = isConnected
      ? { spotifyConnected: true, spotifyLastConnectedAt: serverTimestamp() }
      : { spotifyConnected: false };
    setDoc(doc(db, 'users', user.uid), update, { merge: true }).catch(() => {});
  }, [isConnected, user]);

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
          updated[album.id] = {
            url: result.imageUrl,
            spotifyAlbumId: result.spotifyAlbumId ?? null,
            fetchedAt: Date.now(),
          };
          changed = true;
        }
        // Light pacing between requests so we don't paint a target on
        // ourselves with Spotify's per-app rate limiter when 13 albums
        // queue up at once. spotifyApiFetch handles 429 if it does fire.
        await new Promise(r => setTimeout(r, 60));
      }

      if (changed) {
        artCache.current = updated;
        saveArtCache(updated);
        setArtCacheState({ ...updated });
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
    // Clear art + track + product caches so reconnecting always re-fetches with fresh data
    localStorage.removeItem(ART_KEY);
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(PRODUCT_KEY);
    artCache.current   = {};
    trackCache.current = {};
    setArtCacheState({});
    setIsConnected(false);
    setPlayerReady(false);
    setIsPlaying(false);
    setCurrentSongName(null);
    setSpotifyProduct(null);
    setError(null);
  }, []);

  // ── Play a specific song ──────────────────────────────────────────────────
  // albumId + songIndex are used as the cache key; songName + albumName for the search.
  // screen: 'shuffle' (first screen) | 'bridge' (bridge category)
  const playTrack = useCallback(async (albumId, songIndex, songName, albumName, screen = 'shuffle') => {
    const token = await getFreshToken();
    if (!token || !deviceIdRef.current) return;

    const cacheKey = `${albumId}_${songIndex}`;
    let uri = trackCache.current[cacheKey]?.uri;

    if (!uri) {
      const result = await searchTrackUri(songName, albumName, token);
      if (result?.uri) {
        uri = result.uri;
        trackCache.current[cacheKey] = { uri, fetchedAt: Date.now() };
        saveCache(trackCache.current);
        // Cache art as a bonus if we don't have it yet for this album
        if (result.imageUrl && !artCache.current[albumId]) {
          const entry = {
            url: result.imageUrl,
            spotifyAlbumId: result.spotifyAlbumId ?? null,
            fetchedAt: Date.now(),
          };
          artCache.current[albumId] = entry;
          saveArtCache(artCache.current);
          setArtCacheState(prev => ({ ...prev, [albumId]: entry }));
        }
      }
    }

    if (!uri) return; // song not found on Spotify

    const startMs = screen === 'bridge'
      ? (SPOTIFY_BRIDGE_TIMES[cacheKey] ?? 0)
      : (SPOTIFY_START_TIMES[cacheKey] ?? 0);

    try {
      await spotifyApiFetch(
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
    // { albumId: spotifyAlbumId } — used by surfaces that show album art
    // to build the "Open in Spotify" link-back required by Spotify's
    // design guidelines (e.g. AlbumCard, AlbumHero).
    albumSpotifyIds,
    error,
    // Spotify product tier of the connected account: 'premium' | 'free' |
    // 'open' | null. `isPremium` is the derived boolean the rest of the app
    // should use — falls back to false when unknown so we err on the side
    // of NOT selling Premium-dependent perks.
    spotifyProduct,
    isPremium,
    connect,
    disconnect,
    playTrack,
    pause,
    resume,
    togglePlay,
    setVolume,
  };
}
