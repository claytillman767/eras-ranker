// Per-album theme registry. Maps albumId → bundle of:
//   - background:     CSS gradient string
//   - Scene:          ambient layer component (z-index 1)
//   - SignatureMoment: fired when celebration?.type matches signatureKey
//   - signatureKey:   detectCelebration type that triggers SignatureMoment
//   - CompleteMoment: fired on album-complete render
//   - completeZIndex: where the complete decoration sits relative to the
//                     All-done card (Red blows in front at 30, 1989 deals
//                     behind at 5)
//   - textTuning:     per-theme label/calibration colors for Layer 3
//
// Adding a theme:
//   1. Build the four exports in a new themeFile.jsx
//   2. Register it here
//   3. detectCelebration() in QuickScore.jsx must return a type matching
//      signatureKey for the signature moment to fire.

import {
  RED_BACKGROUND,
  RedScene,
  AllTooWellMoment,
  RedScarfComplete,
  RED_TEXT_TUNING,
} from './redTheme';

import {
  NINETEEN89_BACKGROUND,
  NineteenEightyNineScene,
  WelcomeToNewYorkMoment,
  PolaroidComplete,
  NINETEEN89_TEXT_TUNING,
} from './nineteen89Theme';

const THEMES = {
  rd: {
    background: RED_BACKGROUND,
    Scene: RedScene,
    SignatureMoment: AllTooWellMoment,
    signatureKey: 'red-leaf-fall',
    CompleteMoment: RedScarfComplete,
    completeZIndex: 30,
    textTuning: RED_TEXT_TUNING,
  },
  '89': {
    background: NINETEEN89_BACKGROUND,
    Scene: NineteenEightyNineScene,
    SignatureMoment: WelcomeToNewYorkMoment,
    signatureKey: '89-neon-bloom',
    CompleteMoment: PolaroidComplete,
    completeZIndex: 5,
    textTuning: NINETEEN89_TEXT_TUNING,
  },
};

export function getAlbumTheme(albumId) {
  return THEMES[albumId] ?? null;
}
