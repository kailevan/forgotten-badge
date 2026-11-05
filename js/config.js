// ─────────────────────────────────────────────────────────────
//  FORGOTTEN BADGE — global tuning
//  Every number that changes how the game *feels* lives here.
// ─────────────────────────────────────────────────────────────

export const TILE = 16;
export const VIEW_W = 480;   // the world view, in game pixels
export const VIEW_H = 270;
export const RENDER_SCALE = 2; // canvas renders at 2× → crisp text, same pixel art
export const GATE_OPEN_MS = 7000; // a gate stays open 7 s after anyone badges through (real IFM)

export const PLAYER = {
  walk: 76,          // px / s
  run: 126,
  bodyW: 10,
  bodyH: 6,
};

// Suspicion is one global meter (0–100), Escapists-style.
export const SUSPICION = {
  baseRate: 9,         // per second while a watcher sees you
  runMult: 2.4,
  restrictedMult: 4,   // seen near the gates / staff zone without a badge
  crowdMult: 0.15,     // hidden among ≥ CROWD_MIN students
  badgeMult: 0.7,      // a borrowed badge calms GUARDS a little (teachers/cameras ignore it)
  badgePhotoSpike: 28, // badging in while a guard watches: they check the photo
  cameraCatch: 0.35,   // seconds a CCTV needs a clear look at you → caught
  decay: 7,            // per second when nobody sees you
  tailgateSpike: 55,   // slipping through an open gate while watched
  tailgateCrowdSpike: 8,
  handoffSpike: 50,    // caught mid-handoff
  questionAt: 35,      // watcher shows "?" and turns to you
  alertAt: 70,         // watcher shows "!" and walks at you
  caughtAt: 100,
};

export const CROWD = {
  radius: 22,          // px — students this close count as cover
  min: 3,
};

export const VISION = {
  rays: 18,
  step: 4,             // ray-march step, px
  bumpRadius: 14,      // anyone this close notices you regardless of facing
};

// In-game clock: 1 real second = CLOCK.scale game seconds.
export const CLOCK = {
  start: 8 * 3600 + 52 * 60,    // 08:52 — leaving Gare d'Austerlitz, already running late
  classAt: 9 * 3600,            // 09:00 — class starts in room 1.11
  deadline: 9 * 3600 + 5 * 60,  // 09:05 — Edusign only stays open 5 minutes after the start
  scale: 3,                     // 1 real second = 3 game seconds → ~4½ minutes to make it
};

// Palette — muted, warm, slightly Parisian. Everything procedural uses these.
export const PAL = {
  ink: '#1b1a22',
  void: '#14131a',
  paving: '#b9b2a6', pavingDark: '#a49d91', pavingLine: '#968f84',
  asphalt: '#4a4a52', asphaltDark: '#424249', roadLine: '#d9d3c4',
  water: '#3d6b7d', waterLight: '#5a8a99', waterDark: '#2f5666',
  quayEdge: '#8d8577',
  grass: '#6f8a4f', grassDark: '#5d7642',
  wallTop: '#3a3943', wallFace: '#5c5a66', wallFaceDark: '#4b4955',
  stone: '#cfc6b4', stoneDark: '#b4ab98',          // Haussmann / station limestone
  plug: '#7fbf3f', plugDark: '#5f9a2c', plugLight: '#a6dc63', // Jakob+MacFarlane green
  glass: '#9fc4cf', glassLight: '#d4ecf1', glassDark: '#79a3b0',
  floor: '#d8d6d0', floorDark: '#c9c7c0',
  wood: '#b08a62', woodDark: '#987452',
  counter: '#2d2c33',
  ifmRed: '#d6332e',
  white: '#f4f1ea',
};
