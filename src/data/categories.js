// Default categories — always present for all users, weights are fixed and sum to 100.
export const DEFAULT_CATEGORIES = [
  {
    id: 'lyrics',
    name: 'Lyrics',
    weight: 34,
    description: 'Wordplay, imagery, storytelling, quotability',
  },
  {
    id: 'music',
    name: 'Music / melody',
    weight: 22,
    description: 'Production, arrangement, instrumentation',
  },
  {
    id: 'bridge',
    name: 'Bridge',
    weight: 22,
    description: 'Does the bridge hit different?',
  },
  {
    id: 'nostalgia',
    name: 'Nostalgia',
    weight: 5,
    description: 'Personal memory and emotional attachment',
  },
  {
    id: 'replay',
    name: 'Skip on shuffle?',
    weight: 17,
    description: "If this came on shuffle right now, would you skip it?",
  },
];

// Extra categories — Pro users can toggle each one on or off.
// When active, weights are recalculated so all active categories sum to 100.
export const EXTRA_CATEGORIES = [
  { id: 'hook',         name: 'Hook / chorus',     description: 'Is the chorus instantly memorable and singable?' },
  { id: 'vocals',       name: 'Vocal performance', description: 'Delivery, emotion in her voice, runs and ad-libs' },
  { id: 'cry',          name: 'Cry factor',         description: 'How devastatingly emotional does it get?' },
  { id: 'romantic',     name: 'Romantic feel',      description: 'Swoon-worthy love or heartbreak vibes' },
  { id: 'hype',         name: 'Hype / energy',      description: 'Makes you want to dance or scream along' },
  { id: 'opening',      name: 'Opening line',       description: 'Does the first line grab you immediately?' },
  { id: 'vibe',         name: 'Vibe / atmosphere',  description: 'The sonic world feels complete and immersive' },
  { id: 'storytelling', name: 'Storytelling',       description: 'Vivid compelling narrative from start to finish' },
];
