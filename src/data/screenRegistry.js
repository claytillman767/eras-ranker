// Maps a feedback "screen key" to a human label and the source file(s) behind
// it. The Feedback button stamps these onto every submission, so a note dropped
// from anywhere in the app points Claude Code straight at the right file(s).
//
// Adding a new screen/overlay? Add its key here AND call
//   useFeedbackScreen('<key>', optionalDetailString)
// from that component. For the top-level tabs the base key comes from the
// baseScreenKey map in App.jsx instead.

export const SCREENS = {
  // ── Top-level tabs (base key supplied by App.jsx) ──
  home:     { label: 'Home',             files: ['src/components/Home.jsx'] },
  albums:   { label: 'Albums grid',      files: ['src/components/AlbumGrid.jsx', 'src/components/AlbumCard.jsx'] },
  songlist: { label: 'Album song list',  files: ['src/components/SongList.jsx', 'src/components/SongRow.jsx'] },
  rankings: { label: 'Rankings / profile', files: ['src/components/Rankings.jsx', 'src/components/RankingCard.jsx'] },
  settings: { label: 'Settings',         files: ['src/components/Settings.jsx'] },

  // ── First-run / album overlays ──
  vibecheck_intro:   { label: 'Vibe Check intro',  files: ['src/components/VibeCheckIntro.jsx'] },
  album_mode_picker: { label: 'Album mode picker', files: ['src/components/AlbumModeModal.jsx'] },
  quickscore:        { label: 'Vibe Check scoring', files: ['src/components/QuickScore.jsx'] },

  // ── Brackets (deep — from the screen state in Brackets.jsx) ──
  brackets:           { label: 'Brackets',                    files: ['src/components/brackets/Brackets.jsx', 'src/components/brackets/Landing.jsx'] },
  bracket_landing:    { label: 'Brackets — landing',          files: ['src/components/brackets/Landing.jsx'] },
  bracket_builder:    { label: 'Brackets — build your own',   files: ['src/components/brackets/BracketBuilder.jsx'] },
  bracket_tree:       { label: 'Brackets — bracket tree',     files: ['src/components/brackets/Tree.jsx'] },
  bracket_matchup:    { label: 'Brackets — matchup vote',     files: ['src/components/brackets/Matchup.jsx'] },
  bracket_transition: { label: 'Brackets — round transition', files: ['src/components/brackets/RoundTransition.jsx'] },
  bracket_results:    { label: 'Brackets — results',          files: ['src/components/brackets/BracketResults.jsx'] },
  bracket_locked:     { label: 'Brackets — unlock (build your own)', files: ['src/components/brackets/Brackets.jsx'] },

  // ── Weekly community bracket (deep — from the screen state in WeeklyExperience.jsx) ──
  weekly_experience: { label: 'Weekly bracket',                files: ['src/components/brackets/weekly/WeeklyExperience.jsx'] },
  weekly_home:       { label: 'Weekly bracket — home',         files: ['src/components/brackets/weekly/WeeklyExperience.jsx'] },
  weekly_vote:       { label: 'Weekly bracket — voting',       files: ['src/components/brackets/weekly/WeeklyExperience.jsx'] },
  weekly_reveal:     { label: 'Weekly bracket — reveal',       files: ['src/components/brackets/weekly/WeeklyExperience.jsx'] },
  weekly_locked:     { label: 'Weekly bracket — locked / waiting', files: ['src/components/brackets/weekly/WeeklyExperience.jsx'] },
  weekly_champion:   { label: 'Weekly bracket — champion',     files: ['src/components/brackets/weekly/WeeklyExperience.jsx'] },
};

// Resolve a key to its { label, files }, with a safe fallback for unknown keys.
export function resolveScreen(key) {
  return SCREENS[key] ?? { label: key ?? 'unknown', files: [] };
}
