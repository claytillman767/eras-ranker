import { useState, useCallback } from 'react';
import { SONGS } from '../data/albums';
import { getBridgeLyrics } from '../data/bridgeLyrics';

// Key used to store all ratings in localStorage
const STORAGE_KEY = 'eras_ratings';

// Load saved ratings from localStorage, or return empty object if nothing saved yet
function loadRatings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Save the full ratings object to localStorage
function saveRatings(ratings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
}

export function useRatings() {
  const [ratings, setRatings] = useState(loadRatings);

  // Set a star value (1–5) for one category on one song.
  // Passing value = 0 clears that category rating.
  // If the user taps the same star again, value will be 0 (toggle off).
  const setStarRating = useCallback((albumId, songIndex, catId, value) => {
    setRatings(prev => {
      const key = `${albumId}_${songIndex}`;
      const existing = prev[key] || {};

      let updated;
      if (value === 0) {
        const { [catId]: _, ...rest } = existing;
        updated = Object.keys(rest).length === 0 ? undefined : rest;
      } else {
        updated = { ...existing, [catId]: value };
      }

      const next = { ...prev };
      if (updated === undefined) {
        delete next[key];
      } else {
        next[key] = updated;
      }

      saveRatings(next);
      return next;
    });
  }, []);

  // Calculate composite score (0–100) for one song given the active categories.
  // Returns null if no categories have been rated yet.
  // Formula: sum(starValue * weight) / sum(weight for rated cats only) / 5 * 100
  // Special case: if the song has no bridge, bridge's weight is folded into lyrics' weight.
  const getCompositeScore = useCallback((albumId, songIndex, activeCategories) => {
    const key = `${albumId}_${songIndex}`;
    const songRatings = ratings[key];
    if (!songRatings || !activeCategories) return null;

    // For bridgeless songs, combine bridge weight into lyrics weight
    const hasBridge = getBridgeLyrics(albumId, songIndex) !== null;
    let effectiveCategories = activeCategories;
    if (!hasBridge) {
      const bridgeCat = activeCategories.find(c => c.id === 'bridge');
      if (bridgeCat) {
        effectiveCategories = activeCategories
          .filter(c => c.id !== 'bridge')
          .map(c => c.id === 'lyrics' ? { ...c, weight: c.weight + bridgeCat.weight } : c);
      }
    }

    let numerator = 0;
    let denominator = 0;

    for (const cat of effectiveCategories) {
      const stars = songRatings[cat.id];
      if (stars && stars > 0) {
        numerator += stars * cat.weight;
        denominator += cat.weight;
      }
    }

    if (denominator === 0) return null;

    const raw = numerator / denominator; // 1–5 scale
    return Math.round((raw / 5) * 100);  // convert to 0–100
  }, [ratings]);

  // Calculate average score across all rated songs in an album.
  // Returns null if no songs have been rated yet.
  const getAlbumScore = useCallback((albumId, activeCategories) => {
    const songs = SONGS[albumId];
    if (!songs) return null;

    const scores = songs
      .map((_, i) => getCompositeScore(albumId, i, activeCategories))
      .filter(s => s !== null);

    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [getCompositeScore]);

  // Returns songs for an album sorted by score descending.
  // Rated songs come first (highest score first), then unrated in original order.
  const getSortedSongs = useCallback((albumId, activeCategories) => {
    const songs = SONGS[albumId] || [];
    const withScores = songs.map((name, i) => ({
      name,
      index: i,
      score: getCompositeScore(albumId, i, activeCategories),
    }));

    const rated = withScores.filter(s => s.score !== null).sort((a, b) => b.score - a.score);
    const unrated = withScores.filter(s => s.score === null);

    return [...rated, ...unrated];
  }, [getCompositeScore]);

  // Returns the name of the highest-rated category for a song (shown as subtitle in song rows).
  // Returns null if no categories have been rated.
  const getTopCategoryForSong = useCallback((albumId, songIndex, activeCategories) => {
    const key = `${albumId}_${songIndex}`;
    const songRatings = ratings[key];
    if (!songRatings || !activeCategories) return null;

    let topCat = null;
    let topStars = 0;

    for (const cat of activeCategories) {
      const stars = songRatings[cat.id] || 0;
      if (stars > topStars) {
        topStars = stars;
        topCat = cat.name;
      }
    }

    return topCat;
  }, [ratings]);

  // How many songs in an album have at least one category rated
  const getRatedCount = useCallback((albumId) => {
    const songs = SONGS[albumId] || [];
    return songs.filter((_, i) => {
      const key = `${albumId}_${i}`;
      const r = ratings[key];
      return r && Object.keys(r).length > 0;
    }).length;
  }, [ratings]);

  return {
    ratings,
    setStarRating,
    getCompositeScore,
    getAlbumScore,
    getSortedSongs,
    getTopCategoryForSong,
    getRatedCount,
  };
}
