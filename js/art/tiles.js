// ─────────────────────────────────────────────────────────────
//  TILESET — painted in code, 16×16, matched to the real place:
//  Les Docks (green cladding, fritted green glass, oak roof deck,
//  raw concrete), the quai (paving, plane trees, X barriers,
//  bus + bike lanes), the riverbank (cobbles, bollards, shutters)
//  and the 2021 IFM interior (oak parquet, white desk, speed gates).
//  Art pass: swap painters for pack/custom sprites, keep the keys.
// ─────────────────────────────────────────────────────────────
import { TILE, PAL } from '../config.js';

export const hash = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
export const px = (c, color, x, y, w = 1, h = 1) => { c.fillStyle = color; c.fillRect(x, y, w, h); };

const C = {
  oak: '#d9b88c', oakD: '#c9a679', oakL: '#e6c9a0', oakSeam: '#b8956a',
  concrete: '#a7a29a', concreteD: '#8e8981', concreteL: '#bcb7ae',
  plaster: '#ece8e0', plasterD: '#d7d2c8', plasterTop: '#c9c4ba',
  clad: '#8fae3a', cladD: '#6f8c2a', cladL: '#a9c757',
  fritt: '#7fb83a', frittD: '#4f7d22', frittL: '#b6e07a',
  deck: '#9a7a55', deckD: '#7f6243', deckL: '#b08d64',
  glaze: '#3a4652', glazeL: '#56687a', glazeR: '#7f95a6', frame: '#23262c',
  cobble: '#8b857c', cobbleD: '#6e6961', cobbleL: '#a29c92',
  asph: '#4b4b53', asphD: '#43434a', bike: '#55555e',
  steel: '#c9ced3', steelD: '#8d9399',
  white: '#f6f4ef', whiteD: '#dedad2',
};

function paving(c, s) {
  px(c, PAL.paving, 0, 0, 16, 16);
  if (hash(s, 7) > .55) px(c, PAL.pavingDark, 0, 0, 8, 8);
  if (hash(s, 8) > .6) px(c, PAL.pavingDark, 8, 8, 8, 8);
  px(c, PAL.pavingLine, 0, 7, 16, 1); px(c, PAL.pavingLine, 7, 0, 1, 7); px(c, PAL.pavingLine, 15, 8, 1, 8);
}
function asphalt(c, s, base = C.asph) {
  px(c, base, 0, 0, 16, 16);
  for (let i = 0; i < 6; i++) px(c, C.asphD, (hash(s, i) * 15) | 0, (hash(i, s) * 15) | 0, 2, 1);
}
function cobble(c, s) {
  px(c, C.cobbleD, 0, 0, 16, 16);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 2 : 0;
    for (let col = -1; col < 4; col++) {
      const x = col * 4 + off, y = row * 4;
      const k = hash(s + row, col + 9);
      px(c, k > .66 ? C.cobbleL : k > .33 ? C.cobble : '#7d776f', x + 0, y + 0, 3, 3);
      px(c, C.cobbleL, x, y, 2, 1);
    }
  }
}
function oak(c, s) {
  px(c, C.oak, 0, 0, 16, 16);
  for (let y = 0; y < 16; y += 4) {
    px(c, C.oakSeam, 0, y + 3, 16, 1);
    const cut = ((hash(s, y) * 12) | 0) + 2;
    px(c, C.oakSeam, cut, y, 1, 3);
    if (hash(y, s) > .5) px(c, C.oakL, 0, y, cut, 1); else px(c, C.oakD, cut + 1, y + 1, 16 - cut, 1);
  }
}
function water(c, s) {
  px(c, PAL.water, 0, 0, 16, 16);
  for (let i = 0; i < 3; i++) {
    const x = (hash(s, i) * 11) | 0, y = (hash(i, s) * 14) | 0;
    px(c, PAL.waterLight, x, y, 4, 1); px(c, PAL.waterDark, x + 1, y + 1, 4, 1);
  }
}
const shadowBelow = (c) => px(c, 'rgba(0,0,0,.18)', 0, 14, 16, 2);

// Order matters: list index = tile index.
export const TILES = [
  ['void',       (c) => px(c, PAL.void, 0, 0, 16, 16)],
  ['paving',     paving],
  ['curb',       (c, s) => { paving(c, s); px(c, PAL.stoneDark, 0, 13, 16, 2); px(c, PAL.ink, 0, 15, 16, 1); }],
  ['quayEdge',   (c) => { px(c, '#9a9387', 0, 0, 16, 16); px(c, PAL.stone, 0, 0, 16, 3); px(c, '#7d776f', 0, 3, 16, 1); for (let i = 0; i < 16; i += 8) px(c, '#7d776f', i, 4, 1, 12); }],
  ['asphalt',    asphalt],
  ['roadLine',   (c, s) => { asphalt(c, s); px(c, PAL.roadLine, 2, 7, 8, 2); }],
  ['zebra',      (c, s) => { asphalt(c, s); px(c, PAL.roadLine, 0, 2, 16, 4); px(c, PAL.roadLine, 0, 10, 16, 4); }],
  ['zebraV',     (c, s) => { asphalt(c, s); px(c, PAL.roadLine, 2, 0, 4, 16); px(c, PAL.roadLine, 10, 0, 4, 16); }],
  ['bikeLane',   (c, s) => { asphalt(c, s, C.bike); px(c, PAL.roadLine, 0, 0, 16, 1); }],
  ['busLane',    (c, s) => { asphalt(c, s); px(c, PAL.roadLine, 0, 15, 16, 1); px(c, PAL.roadLine, 0, 0, 16, 1); }],
  ['water',      water],
  ['grass',      (c, s) => { px(c, PAL.grass, 0, 0, 16, 16); for (let i = 0; i < 9; i++) px(c, PAL.grassDark, (hash(s, i) * 15) | 0, (hash(i, s) * 15) | 0, 1, 2); }],
  ['tree',       (c, s) => { paving(c, s); px(c, '#3a3a40', 1, 3, 14, 12); px(c, '#4a4a52', 2, 4, 12, 10); for (let i = 3; i < 14; i += 2) px(c, '#2a2a30', i, 5, 1, 8); px(c, '#6b5a48', 6, 2, 4, 8); px(c, '#8a7660', 6, 2, 2, 8); }],
  ['xbarrier',   (c, s) => { paving(c, s); px(c, PAL.ink, 1, 5, 1, 8); px(c, PAL.ink, 14, 5, 1, 8); for (let i = 0; i < 8; i++) { px(c, PAL.ink, 2 + i * 1.5 | 0, 5 + i, 1, 1); px(c, PAL.ink, 13 - (i * 1.5 | 0), 5 + i, 1, 1); } }],
  ['hedge',      (c, s) => { paving(c, s); px(c, '#7a6a55', 0, 10, 16, 6); px(c, PAL.grassDark, 0, 1, 16, 11); for (let i = 0; i < 10; i++) px(c, PAL.grass, (hash(s, i) * 14) | 0, (hash(i, s) * 9 + 1) | 0, 2, 2); }],
  ['bench',      (c, s) => { cobble(c, s); px(c, C.concreteD, 0, 6, 16, 6); px(c, C.concreteL, 0, 5, 16, 2); }],
  ['cobble',     cobble],
  ['bollard',    (c, s) => { cobble(c, s); px(c, 'rgba(0,0,0,.25)', 5, 11, 7, 3); px(c, '#2b2b30', 5, 4, 6, 8); px(c, '#46464e', 6, 4, 2, 7); px(c, '#2b2b30', 4, 3, 8, 2); }],
  ['shutter',    (c, s) => { px(c, '#8f9196', 0, 0, 16, 16); for (let y = 1; y < 16; y += 2) px(c, '#7a7c81', 0, y, 16, 1); px(c, C.concrete, 0, 0, 2, 16); px(c, C.concrete, 14, 0, 2, 16); if (hash(s, 4) > .6) { px(c, '#c94f3d', 4, 6, 5, 2); px(c, '#3b4a6b', 6, 8, 4, 2); } }],
  ['roofDeck',   (c, s) => { px(c, C.deck, 0, 0, 16, 16); for (let y = 0; y < 16; y += 3) px(c, C.deckD, 0, y + 2, 16, 1); px(c, C.deckL, (hash(s, 2) * 12) | 0, 0, 3, 1); }],
  ['roofPlant',  (c, s) => { px(c, C.deck, 0, 0, 16, 16); px(c, '#5d7642', 1, 1, 14, 14); for (let i = 0; i < 12; i++) px(c, hash(s, i) > .5 ? '#7a9a50' : '#4a6236', (hash(s, i) * 14) | 0, (hash(i, s) * 14) | 0, 2, 2); }],
  ['plugGlass',  (c, s) => { px(c, C.fritt, 0, 0, 16, 16); for (let i = 0; i < 16; i += 2) for (let j = (i / 2) % 2; j < 16; j += 2) px(c, C.frittL, j, i, 1, 1); px(c, C.frittD, 0, 0, 16, 1); px(c, C.frittD, 0, 0, 1, 16); if (hash(s, 1) > .5) px(c, C.frittD, 0, 8, 16, 1); }],
  ['clad',       (c) => { px(c, C.clad, 0, 0, 16, 16); px(c, C.cladL, 0, 0, 16, 1); px(c, C.cladD, 0, 7, 16, 1); px(c, C.cladD, 0, 15, 16, 1); px(c, C.cladD, 7, 0, 1, 16); px(c, C.cladL, 1, 1, 5, 1); }],
  ['glazing',    (c, s) => { px(c, C.glaze, 0, 0, 16, 16); px(c, C.glazeL, 2, 2, 12, 12); px(c, C.glazeR, 3, 3, 2, 8); px(c, C.glazeR, 6, 3, 1, 4); px(c, C.frame, 0, 0, 16, 2); px(c, C.frame, 0, 0, 2, 16); px(c, C.frame, 0, 14, 16, 2); if (hash(s, 3) > .7) px(c, '#e8e3d6', 9, 9, 3, 3); }],
  ['pillar',     (c) => { px(c, C.concrete, 0, 0, 16, 16); px(c, C.concreteL, 1, 0, 3, 16); px(c, C.concreteD, 12, 0, 4, 16); px(c, C.concreteD, 0, 14, 16, 2); }],
  ['stoneTop',   (c, s) => { px(c, '#b8ae9a', 0, 0, 16, 16); px(c, PAL.stone, 1, 1, 14, 14); if (hash(s, 1) > .5) px(c, '#a9a08d', 0, 7, 16, 1); }],
  ['stationRoof',(c) => { px(c, '#6d7681', 0, 0, 16, 16); for (let x = 0; x < 16; x += 4) px(c, '#9aa7b3', x, 0, 2, 16); px(c, '#4f5761', 0, 15, 16, 1); }],
  ['officeRoof', (c) => { px(c, '#5f6973', 0, 0, 16, 16); px(c, '#7c8893', 1, 1, 14, 6); px(c, '#7c8893', 1, 9, 14, 6); }],
  ['wallTop',    (c) => { px(c, C.plasterTop, 0, 0, 16, 16); px(c, C.plasterD, 0, 0, 16, 1); }],
  ['wallFace',   (c) => { px(c, C.plaster, 0, 0, 16, 16); px(c, C.plasterTop, 0, 0, 16, 2); px(c, C.plasterD, 0, 13, 16, 2); px(c, '#9e9a92', 0, 15, 16, 1); }],
  ['concTop',    (c) => { px(c, C.concreteD, 0, 0, 16, 16); px(c, C.concrete, 1, 1, 14, 14); }],
  ['concFace',   (c) => { px(c, C.concrete, 0, 0, 16, 16); px(c, C.concreteL, 0, 0, 16, 2); px(c, C.concreteD, 0, 13, 16, 3); px(c, '#9a958c', 5, 5, 1, 1); px(c, '#9a958c', 11, 8, 1, 1); }],
  ['glassTop',   (c) => { px(c, PAL.glassDark, 0, 0, 16, 16); px(c, PAL.glass, 0, 6, 16, 4); }],
  ['glassFace',  (c) => { px(c, PAL.glass, 0, 0, 16, 16); px(c, PAL.glassLight, 2, 2, 2, 9); px(c, PAL.glassLight, 5, 2, 1, 5); px(c, PAL.glassDark, 15, 0, 1, 16); px(c, '#6f7b80', 0, 14, 16, 2); }],
  ['oak',        oak],
  ['floor',      (c, s) => { px(c, '#d6d3cc', 0, 0, 16, 16); px(c, '#c9c6bf', 15, 0, 1, 16); px(c, '#c9c6bf', 0, 15, 16, 1); if (hash(s, 2) > .8) px(c, '#e2dfd8', (hash(s, 5) * 13) | 0, (hash(s, 6) * 13) | 0, 2, 1); }],
  ['column',     (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.2)', 3, 12, 12, 3); px(c, C.concreteD, 2, 1, 12, 12); px(c, C.concrete, 3, 1, 10, 10); px(c, C.concreteL, 3, 1, 3, 10); }],
  ['post',       (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.22)', 6, 11, 6, 3); px(c, C.steelD, 6, 3, 4, 9); px(c, C.steel, 6, 3, 2, 9); px(c, C.white, 6, 2, 4, 2); }],
  ['postReader', (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.22)', 6, 11, 6, 3); px(c, C.steelD, 6, 3, 4, 9); px(c, C.steel, 6, 3, 2, 9); px(c, '#2a6fd6', 5, 1, 6, 3); px(c, '#8fc0ff', 6, 2, 2, 1); }],
  ['deskWhite',  (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.18)', 0, 12, 16, 3); px(c, C.whiteD, 0, 2, 16, 11); px(c, C.white, 0, 2, 16, 8); px(c, '#ffffff', 0, 2, 16, 1); }],
  ['stairWhite', (c) => { px(c, C.whiteD, 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { px(c, C.white, 0, y, 16, 3); } px(c, '#c8c3ba', 15, 0, 1, 16); }],
  ['poster',     (c, s) => { px(c, C.plaster, 0, 0, 16, 16); px(c, C.plasterTop, 0, 0, 16, 2); const cols = [['#f2efe6', '#1b1a22'], ['#1b1a22', '#f2efe6'], ['#c94f3d', '#f2efe6']][(hash(s, 1) * 3) | 0]; px(c, cols[0], 3, 3, 10, 10); px(c, cols[1], 4, 5, 6, 1); px(c, cols[1], 4, 7, 4, 1); px(c, '#d6332e', 4, 10, 3, 2); px(c, C.plasterD, 0, 14, 16, 2); }],
  ['stairs',     (c) => { px(c, C.concreteD, 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { px(c, C.concreteL, 0, y, 16, 2); px(c, C.concrete, 0, y + 2, 16, 1); } }],
  ['grandStair', (c) => { px(c, C.oakD, 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { px(c, C.oakL, 0, y, 16, 2); px(c, C.oakSeam, 0, y + 3, 16, 1); } }],
  ['tier',       (c) => { px(c, C.oakD, 0, 0, 16, 16); px(c, C.oak, 0, 0, 16, 7); px(c, '#3b3a40', 1, 8, 6, 5); px(c, '#3b3a40', 9, 8, 6, 5); px(c, '#4c4b52', 1, 8, 6, 1); px(c, '#4c4b52', 9, 8, 6, 1); }],
  ['doormat',    (c, s) => { oak(c, s); px(c, '#3b3a40', 1, 2, 14, 12); px(c, '#4a4950', 2, 3, 12, 10); }],
  ['desk',       (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.18)', 1, 11, 15, 3); px(c, C.whiteD, 0, 3, 16, 9); px(c, C.white, 0, 3, 16, 7); px(c, '#2b2b33', 3, 5, 4, 3); px(c, '#59646f', 4, 5, 2, 2); }],
  ['cafeTable',  (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.2)', 4, 11, 9, 3); px(c, C.white, 3, 4, 10, 7); px(c, C.whiteD, 3, 9, 10, 2); px(c, '#2b2b33', 7, 6, 2, 2); }],
  ['sewing',     (c, s) => { oak(c, s); px(c, C.whiteD, 0, 3, 16, 9); px(c, C.white, 0, 3, 16, 7); px(c, '#2b2b33', 3, 4, 8, 4); px(c, '#46464e', 4, 4, 2, 2); px(c, '#c9b28a', 10, 7, 4, 3); }],
  ['counter',    (c, s) => { oak(c, s); px(c, PAL.counter, 0, 1, 16, 12); px(c, '#46454e', 0, 1, 16, 2); px(c, '#1a1a20', 0, 13, 16, 2); }],
  ['rack',       (c, s) => { oak(c, s); px(c, PAL.ink, 0, 1, 16, 1); px(c, PAL.ink, 1, 1, 1, 14); px(c, PAL.ink, 14, 1, 1, 14); ['#c94f3d', '#2f3b5c', '#e9d9b8', '#1e1e24', '#7d8c6a'].forEach((col, i) => { px(c, col, 2 + i * 2.4 | 0, 2, 3, 11); px(c, 'rgba(0,0,0,.14)', 2 + i * 2.4 | 0, 11, 3, 2); }); }],
  ['mannequin',  (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.18)', 4, 13, 8, 3); px(c, '#e9ddc8', 6, 1, 4, 4); px(c, '#f2efe6', 5, 5, 6, 7); px(c, '#d9d2c2', 5, 10, 6, 2); px(c, PAL.ink, 7, 12, 2, 3); }],
  ['lift',       (c) => { px(c, '#8b8a92', 0, 0, 16, 16); px(c, '#a9a8b0', 1, 2, 6, 14); px(c, '#a9a8b0', 9, 2, 6, 14); px(c, PAL.ink, 7, 2, 2, 14); px(c, PAL.ifmRed, 7, 0, 2, 1); }],
  ['railing',    (c, s) => { cobble(c, s); px(c, PAL.ink, 0, 6, 16, 1); px(c, '#5a5a62', 0, 7, 16, 1); for (let i = 1; i < 16; i += 5) px(c, PAL.ink, i, 7, 1, 7); }],
  ['shelter',    (c, s) => { paving(c, s); px(c, 'rgba(0,0,0,.2)', 0, 12, 16, 4); px(c, '#9fc4cf', 0, 1, 16, 11); px(c, '#d4ecf1', 2, 2, 3, 7); px(c, '#2b2b33', 0, 0, 16, 2); }],
  ['bridge',     (c, s) => { asphalt(c, s, '#56565e'); px(c, '#3e3e45', 0, 0, 2, 16); px(c, '#3e3e45', 14, 0, 2, 16); px(c, '#8b8a92', 0, 0, 1, 16); px(c, '#8b8a92', 15, 0, 1, 16); }],
  ['shelf',      (c, s) => { oak(c, s); px(c, '#7f6243', 0, 1, 16, 13); for (let x = 1; x < 15; x += 2) px(c, ['#c94f3d', '#2f3b5c', '#e9d9b8', '#1e1e24', '#7d8c6a', '#c9b28a'][(hash(s, x) * 6) | 0], x, 2, 1, 5); for (let x = 1; x < 15; x += 2) px(c, ['#c94f3d', '#2f3b5c', '#e9d9b8', '#1e1e24'][(hash(x, s) * 4) | 0], x, 8, 1, 5); }],
  // interior glazing — black steel frames (see-through)
  ['gpTop',      (c, s) => { oak(c, s); px(c, '#2a2b30', 0, 6, 16, 3); px(c, '#9fb7c0', 0, 7, 16, 1); }],
  ['gpFace',     (c) => { px(c, '#cfdde2', 0, 0, 16, 16); px(c, '#e8f1f3', 2, 1, 4, 10); px(c, '#2a2b30', 0, 0, 16, 1); px(c, '#2a2b30', 0, 0, 1, 16); px(c, '#2a2b30', 8, 0, 1, 16); px(c, '#2a2b30', 0, 11, 16, 1); px(c, '#e6e1d5', 0, 12, 16, 4); px(c, '#2a2b30', 0, 15, 16, 1); }],
  ['gpTopV',     (c, s) => { oak(c, s); px(c, '#2a2b30', 6, 0, 3, 16); px(c, '#9fb7c0', 7, 0, 1, 16); }],
  ['balTopV',    (c, s) => { oak(c, s); px(c, C.oakSeam, 5, 0, 6, 16); px(c, C.oakL, 5, 0, 2, 16); }],
  ['glassTopV',  (c) => { px(c, PAL.glassDark, 0, 0, 16, 16); px(c, PAL.glass, 6, 0, 4, 16); }],
  ['grandStairV', (c) => { px(c, '#c9a679', 0, 0, 16, 16); for (let x = 0; x < 16; x += 4) { px(c, '#e6c9a0', x, 0, 2, 16); px(c, '#9a7040', x + 3, 0, 1, 16); } px(c, '#7f5a32', 0, 0, 16, 1); px(c, '#7f5a32', 0, 15, 16, 1); }],
  ['sofa',       (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.2)', 1, 13, 15, 3); px(c, '#1b1a22', 0, 2, 16, 12); px(c, '#3e4a5e', 1, 3, 14, 10); px(c, '#56647c', 1, 3, 14, 3); px(c, '#2e3848', 1, 11, 14, 2); px(c, '#2e3848', 7, 6, 1, 5); }],
  ['edusign',    (c) => { px(c, '#cfdde2', 0, 0, 16, 16); px(c, '#2a2b30', 0, 0, 16, 1); px(c, '#ffffff', 3, 2, 10, 10); px(c, '#1b1a22', 4, 3, 3, 3); px(c, '#1b1a22', 9, 3, 3, 3); px(c, '#1b1a22', 4, 8, 3, 3); px(c, '#1b1a22', 8, 8, 1, 1); px(c, '#1b1a22', 10, 9, 2, 1); px(c, '#1b1a22', 9, 11, 1, 1); px(c, '#ffffff', 5, 4, 1, 1); px(c, '#ffffff', 10, 4, 1, 1); px(c, '#ffffff', 5, 9, 1, 1); px(c, '#6c4bd6', 3, 12, 10, 2); px(c, '#e6e1d5', 0, 14, 16, 2); }],
  ['projScreen', (c, s) => { oak(c, s); px(c, '#8d9399', 11, 0, 2, 16); px(c, '#1b1a22', 12, 1, 4, 14); px(c, '#ffffff', 13, 2, 3, 12); px(c, '#d4ecf1', 13, 4, 2, 5); px(c, '#ffd75e', 6, 7, 2, 2); }],
  ['sink',       (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.18)', 0, 12, 16, 3); px(c, '#8d9399', 0, 2, 16, 11); px(c, '#c9ced3', 1, 3, 14, 9); px(c, '#9aa3ab', 3, 5, 10, 5); px(c, '#6f7880', 4, 6, 8, 3); px(c, '#5b6168', 7, 2, 2, 3); px(c, '#e6f2f6', 4, 6, 2, 1); }],
  ['microwave',  (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.2)', 1, 13, 15, 3); px(c, '#1b1a22', 1, 1, 14, 13); px(c, '#3a3943', 2, 2, 9, 10); px(c, '#56687a', 3, 3, 7, 8); px(c, '#ffd75e', 12, 3, 2, 1); px(c, '#8d9399', 12, 6, 2, 5); }],
  ['foodCounter',(c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.2)', 0, 13, 16, 3); px(c, '#2f6b4f', 0, 1, 16, 13); px(c, '#d4ecf1', 1, 2, 14, 6); px(c, '#e9d9b8', 2, 4, 3, 3); px(c, '#c94f3d', 6, 4, 3, 3); px(c, '#7fbf3f', 10, 4, 3, 3); px(c, '#3e8a66', 0, 9, 16, 1); px(c, '#24533d', 0, 12, 16, 2); }],
  ['door',       (c, s) => { oak(c, s); px(c, '#b07a45', 1, 0, 14, 3); px(c, '#8f6235', 1, 3, 14, 1); px(c, '#2a2b30', 0, 0, 1, 4); px(c, '#2a2b30', 15, 0, 1, 4); }],
  ['balTop',     (c, s) => { oak(c, s); px(c, C.oakSeam, 0, 5, 16, 6); px(c, C.oakL, 0, 5, 16, 2); }],
  ['balFace',    (c) => { px(c, '#c99a62', 0, 0, 16, 16); px(c, C.oakL, 0, 0, 16, 2); for (let x = 3; x < 16; x += 4) px(c, '#b8894f', x, 2, 1, 14); px(c, '#9a7040', 0, 14, 16, 2); }],
  ['atrium',     (c, s) => { px(c, '#cfc9bd', 0, 0, 16, 16); px(c, '#bdb6a8', 0, 0, 16, 2); if (hash(s, 3) > .5) px(c, '#d9b88c', 4, 6, 8, 3); }],
  ['chairs',     (c, s) => { oak(c, s); px(c, '#1e1e24', 2, 3, 5, 9); px(c, '#1e1e24', 9, 3, 5, 9); px(c, '#3a3a42', 2, 3, 5, 2); px(c, '#3a3a42', 9, 3, 5, 2); px(c, '#8d9399', 2, 12, 5, 1); px(c, '#8d9399', 9, 12, 5, 1); }],
  ['highTable',  (c, s) => { oak(c, s); px(c, 'rgba(0,0,0,.16)', 1, 12, 15, 3); px(c, C.whiteD, 0, 3, 16, 9); px(c, C.white, 0, 3, 16, 7); px(c, '#c9a679', 2, 0, 3, 3); px(c, '#c9a679', 11, 12, 3, 3); }],
  ['doorway',    (c, s) => { oak(c, s); px(c, '#23262c', 0, 0, 1, 16); px(c, '#23262c', 15, 0, 1, 16); px(c, '#9fc4cf', 1, 0, 3, 16); px(c, '#9fc4cf', 12, 0, 3, 16); px(c, '#d4ecf1', 2, 2, 1, 6); }],
];

export const T = Object.fromEntries(TILES.map(([k], i) => [k, i]));

export function buildTileset(scene) {
  const variants = 4;
  if (scene.textures.exists('tiles')) return { columns: TILES.length, variants };
  const tex = scene.textures.createCanvas('tiles', TILES.length * TILE, TILE * variants);
  const c = tex.getContext();
  c.imageSmoothingEnabled = false;
  for (let v = 0; v < variants; v++) {
    TILES.forEach(([, paint], i) => {
      c.save(); c.translate(i * TILE, v * TILE);
      c.beginPath(); c.rect(0, 0, TILE, TILE); c.clip();
      paint(c, v * 31 + i);
      c.restore();
    });
  }
  tex.refresh();
  return { columns: TILES.length, variants };
}
