// ─────────────────────────────────────────────────────────────
//  CHARACTERS + small sprites — generated in code, pixel by pixel.
//  Art pass: swap for pack/custom sprite sheets, keep the keys.
// ─────────────────────────────────────────────────────────────
import { PAL } from '../config.js';

import { hash, px, TILES, T } from './tiles.js';

// ── Characters (16×24, 4 dirs × 3 frames) ────────────────────
// dir: 0 down, 1 up, 2 left, 3 right.  frame: 0 idle, 1 step A, 2 step B.
export const CHAR_W = 16, CHAR_H = 24;

export function buildCharacter(scene, key, look) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, CHAR_W * 12, CHAR_H);
  const c = tex.getContext();
  for (let dir = 0; dir < 4; dir++) {
    for (let f = 0; f < 3; f++) {
      const i = dir * 3 + f;
      c.save();
      if (dir === 3) { c.translate(i * CHAR_W + CHAR_W, 0); c.scale(-1, 1); drawChar(c, look, 2, f); }
      else { c.translate(i * CHAR_W, 0); drawChar(c, look, dir, f); }
      c.restore();
      tex.add(i, 0, i * CHAR_W, 0, CHAR_W, CHAR_H);
    }
  }
  outline(c, CHAR_W * 12, CHAR_H, CHAR_W);
  tex.refresh();
  const names = ['down', 'up', 'left', 'right'];
  names.forEach((n, dir) => {
    scene.anims.create({
      key: `${key}-walk-${n}`,
      frames: [1, 0, 2, 0].map((f) => ({ key, frame: dir * 3 + f })),
      frameRate: 8, repeat: -1,
    });
  });
  return key;
}

// 1px dark outline around every opaque pixel (per frame), Escapists-style:
// makes people read clearly against any floor.
export function outline(c, w, h, frameW = w, col = [27, 26, 34, 255]) {
  const img = c.getImageData(0, 0, w, h), d = img.data, src = new Uint8ClampedArray(d);
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 90;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (src[i + 3] > 90) continue;
    const fx = x % frameW;
    const n = (fx > 0 && solid(x - 1, y)) || (fx < frameW - 1 && solid(x + 1, y)) || solid(x, y - 1) || solid(x, y + 1);
    if (n) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = col[3]; }
  }
  c.putImageData(img, 0, 0);
}

function drawChar(c, L, dir, f) {
  const bob = f === 0 ? 0 : 1;
  const skinD = shade(L.skin, -0.18);
  const hairD = shade(L.hair, -0.25);
  const topD = shade(L.top, -0.22);
  const botD = shade(L.bottom, -0.2);
  const y0 = bob;

  // legs + shoes
  const legL = dir === 2 ? [6, 8] : [5, 9];
  const lift = (f === 1) ? [1, 0] : (f === 2) ? [0, 1] : [0, 0];
  for (let k = 0; k < 2; k++) {
    const lx = dir === 2 ? (k === 0 ? 6 : 8) : legL[k];
    const h = 4 - lift[k];
    px(c, k === 0 ? L.bottom : botD, lx, 18, 2, h);
    px(c, L.shoes, lx, 18 + h, 2, 1);
    if (dir === 2) px(c, L.shoes, lx - 1, 18 + h, 1, 1);
  }
  if (L.highWaist) px(c, L.bottom, dir === 2 ? 5 : 4, 15 + y0, dir === 2 ? 6 : 8, 3);

  // torso
  const tx = dir === 2 ? 5 : 4, tw = dir === 2 ? 6 : 8;
  px(c, L.top, tx, 10 + y0, tw, 8);
  px(c, topD, tx, 16 + y0, tw, 2);
  if (L.highWaist) { px(c, L.bottom, tx, 15 + y0, tw, 3); px(c, shade(L.bottom, -0.35), tx, 15 + y0, tw, 1); }
  if (L.coat) { px(c, L.coat, tx, 10 + y0, tw, 9); if (dir === 0) px(c, L.top, 7, 10 + y0, 2, 7); }
  if (L.bag && dir !== 1) px(c, L.bag, dir === 2 ? 9 : 11, 13 + y0, 3, 4);

  // arms (swing)
  const sw = f === 1 ? 1 : f === 2 ? -1 : 0;
  const armCol = L.coat || L.top;
  if (dir === 2) {
    px(c, shade(armCol, -0.1), 7 + sw, 11 + y0, 2, 5); px(c, L.skin, 7 + sw, 16 + y0, 2, 1);
  } else {
    px(c, shade(armCol, -0.1), 3, 11 + y0 + sw, 1, 5); px(c, L.skin, 3, 16 + y0 + sw, 1, 1);
    px(c, shade(armCol, -0.1), 12, 11 + y0 - sw, 1, 5); px(c, L.skin, 12, 16 + y0 - sw, 1, 1);
  }

  // neck / collar
  if (L.turtleneck) px(c, L.top, dir === 2 ? 6 : 6, 9 + y0, 4, 2);
  else px(c, skinD, 7, 9 + y0, 2, 1);

  // head
  const hx = dir === 2 ? 5 : 4;
  px(c, L.skin, hx, 2 + y0, 8, 7);
  px(c, skinD, hx, 8 + y0, 8, 1);

  // hair
  const st = L.hairStyle;
  if (st === 'buzz') {
    px(c, hairD, hx, 1 + y0, 8, 2);
    if (dir === 1) px(c, hairD, hx, 1 + y0, 8, 6);
    if (dir === 2) px(c, hairD, hx + 4, 1 + y0, 4, 4);
    px(c, shade(L.hair, 0.1), hx + 2, 1 + y0, 3, 1);
  } else {
    px(c, L.hair, hx, 0 + y0, 8, 3);
    px(c, hairD, hx, 2 + y0, 8, 1);
    if (dir === 0) { px(c, L.hair, hx, 2 + y0, 1, 3); px(c, L.hair, hx + 7, 2 + y0, 1, 3); }
    if (dir === 1) px(c, L.hair, hx, 0 + y0, 8, 8);
    if (dir === 2) px(c, L.hair, hx + 4, 0 + y0, 4, 7);
    if (st === 'long') {
      if (dir === 0) { px(c, L.hair, hx - 1, 2 + y0, 1, 9); px(c, L.hair, hx + 8, 2 + y0, 1, 9); }
      if (dir === 1) px(c, L.hair, hx, 0 + y0, 8, 12);
      if (dir === 2) px(c, L.hair, hx + 5, 0 + y0, 4, 11);
    }
    if (st === 'clip') { // pulled back, clipped
      if (dir === 1) { px(c, hairD, hx + 2, 6 + y0, 4, 3); px(c, L.clip || '#2a2a30', hx + 2, 5 + y0, 4, 1); }
      if (dir === 2) { px(c, hairD, hx + 7, 3 + y0, 2, 4); px(c, L.clip || '#2a2a30', hx + 8, 3 + y0, 1, 3); }
      if (dir === 0) { px(c, L.clip || '#2a2a30', hx + 6, 0 + y0, 2, 1); }
    }
    if (st === 'dreads') { // locs: thick strands falling to the shoulders
      const dk = shade(L.hair, 0.12);
      if (dir === 0) { for (const sx of [hx - 1, hx, hx + 7, hx + 8]) px(c, L.hair, sx, 2 + y0, 1, 8); px(c, dk, hx - 1, 4 + y0, 1, 1); px(c, dk, hx + 8, 6 + y0, 1, 1); }
      if (dir === 1) { px(c, L.hair, hx - 1, 0 + y0, 10, 11); for (let sx = hx; sx < hx + 8; sx += 2) px(c, dk, sx, 3 + y0, 1, 8); }
      if (dir === 2) { px(c, L.hair, hx + 4, 0 + y0, 5, 10); px(c, dk, hx + 5, 3 + y0, 1, 7); px(c, dk, hx + 7, 4 + y0, 1, 6); }
    }
    if (st === 'curly') { px(c, L.hair, hx - 1, -0 + y0, 10, 4); if (dir !== 0) px(c, L.hair, hx - 1, 0 + y0, 10, 8); }
    if (st === 'ponytail' && dir !== 0) px(c, hairD, dir === 2 ? hx + 8 : hx + 3, 4 + y0, 2, 6);
  }

  // face
  if (dir === 0) {
    px(c, L.ink || PAL.ink, hx + 2, 5 + y0); px(c, L.ink || PAL.ink, hx + 5, 5 + y0);
    if (L.glasses) { px(c, PAL.ink, hx + 1, 4 + y0, 3, 1); px(c, PAL.ink, hx + 4, 4 + y0, 3, 1); px(c, PAL.ink, hx + 1, 5 + y0); px(c, PAL.ink, hx + 6, 5 + y0); }
    px(c, skinD, hx + 3, 7 + y0, 2, 1);
  } else if (dir === 2) {
    px(c, PAL.ink, hx + 1, 5 + y0);
    if (L.glasses) px(c, PAL.ink, hx, 4 + y0, 4, 1);
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1, 7), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// ── Cast ─────────────────────────────────────────────────────
export const LOOKS = {
  player:   { skin: '#e8b894', hair: '#3a2a22', hairStyle: 'short', top: '#e9e4d8', coat: '#3b4a6b', bottom: '#2b2b33', shoes: '#f4f1ea', bag: '#1e1e24' },
  guard:    { skin: '#8d5a3b', hair: '#1a1414', hairStyle: 'buzz', top: '#1d1f2a', bottom: '#1d1f2a', shoes: '#0f0f12' },
  // older teacher — grey hair clipped back, glasses
  madame:   { skin: '#efc9a8', hair: '#b9b6b2', hairStyle: 'clip', clip: '#3c3346', glasses: true, top: '#6d4b5a', coat: '#2c2a33', bottom: '#2c2a33', shoes: '#151519' },
  // 33yo teacher — buzz cut, black longsleeve turtleneck, high-waisted blue jeans
  buzz:     { skin: '#e2b08c', hair: '#4a3a30', hairStyle: 'buzz', top: '#141418', turtleneck: true, bottom: '#4f6f9e', highWaist: true, shoes: '#1a1a1d' },
  allegria1:{ skin: '#c98e68', hair: '#121014', hairStyle: 'short', top: '#2f6b4f', coat: '#f4f1ea', bottom: '#1e1e24', shoes: '#121014' },
  allegria2:{ skin: '#8d5a3b', hair: '#2b2b2b', hairStyle: 'buzz', top: '#2f6b4f', coat: '#f4f1ea', bottom: '#2b2b33', shoes: '#121014' },
  barista:  { skin: '#5a3825', hair: '#1a1414', hairStyle: 'dreads', top: '#2b2b33', coat: '#c9b28a', bottom: '#1e1e24', shoes: '#f4f1ea' },
  friend:   { skin: '#c98e68', hair: '#121014', hairStyle: 'long', top: '#d6332e', bottom: '#1e1e24', shoes: '#f4f1ea', bag: '#c9b28a' },
  smoker:   { skin: '#d9a582', hair: '#6b4b32', hairStyle: 'ponytail', top: '#8a8f99', bottom: '#2b2b33', shoes: '#1b1b20' },
};

const STUDENT_PARTS = {
  skin: ['#f1c9a5', '#e2b08c', '#c98e68', '#a86d4a', '#7c4c33', '#f6d7bf'],
  hair: ['#121014', '#3a2a22', '#6b4b32', '#c79a5b', '#e6d3a6', '#8a2c2c', '#2b2b2b'],
  hairStyle: ['short', 'long', 'curly', 'ponytail', 'short', 'long'],
  top: ['#e9e4d8', '#1e1e24', '#8a2c2c', '#c9b28a', '#3b4a6b', '#6d7a5a', '#d9d3c4', '#b06c8c'],
  coat: [null, null, '#2c2a33', '#7a5a3a', '#cfc6b4', '#1e1e24'],
  bottom: ['#1e1e24', '#2b2b33', '#4f6f9e', '#c9b28a', '#5c5a66', '#e9e4d8'],
  shoes: ['#f4f1ea', '#121014', '#7a5a3a'],
  bag: [null, '#1e1e24', '#c9b28a', '#e9e4d8', null],
};

export function studentLook(seed) {
  const pick = (arr, k) => arr[(hash(seed, k) * arr.length) | 0];
  const L = {};
  Object.keys(STUDENT_PARTS).forEach((k, i) => { const v = pick(STUDENT_PARTS[k], i + 3); if (v) L[k] = v; });
  return L;
}

// ── Small sprites: shadow, bubbles, gate, phone icon ─────────
export function buildMisc(scene) {
  const make = (key, w, h, paint) => {
    if (scene.textures.exists(key)) return;
    const t = scene.textures.createCanvas(key, w, h); const c = t.getContext(); paint(c); t.refresh();
  };
  make('shadow', 12, 4, (c) => { px(c, '#00000040', 2, 0, 8, 4); px(c, '#00000040', 0, 1, 12, 2); });
  make('bubble-q', 9, 11, (c) => bubble(c, '#f4f1ea', PAL.ink, [[3,2],[4,2],[5,2],[6,3],[5,4],[4,5],[4,6],[4,8]]));
  make('bubble-x', 9, 11, (c) => bubble(c, PAL.ifmRed, PAL.white, [[4,2],[4,3],[4,4],[4,5],[4,6],[4,8]]));
  make('bubble-phone', 9, 11, (c) => { bubble(c, '#f4f1ea', PAL.ink, []); px(c, PAL.ink, 3, 2, 3, 6); px(c, PAL.glass, 4, 3, 1, 3); });
  make('bubble-dots', 11, 9, (c) => { px(c, '#f4f1ea', 0, 0, 11, 7); px(c, PAL.ink, 2, 3); px(c, PAL.ink, 5, 3); px(c, PAL.ink, 8, 3); px(c, '#f4f1ea', 3, 7, 2, 2); });
  make('gate-closed', 16, 16, (c) => { px(c, '#8b8a92', 0, 4, 3, 10); px(c, '#8b8a92', 13, 4, 3, 10); px(c, '#5b5a62', 0, 12, 3, 2); px(c, '#5b5a62', 13, 12, 3, 2); px(c, '#e2e8ea', 3, 8, 10, 2); px(c, '#b8c4c8', 3, 10, 10, 1); px(c, PAL.ifmRed, 1, 5, 1, 1); });
  make('gate-open', 16, 16, (c) => { px(c, '#8b8a92', 0, 4, 3, 10); px(c, '#8b8a92', 13, 4, 3, 10); px(c, '#5b5a62', 0, 12, 3, 2); px(c, '#5b5a62', 13, 12, 3, 2); px(c, '#e2e8ea', 3, 6, 2, 6); px(c, '#e2e8ea', 11, 6, 2, 6); px(c, '#58c46a', 1, 5, 1, 1); });
  make('badge', 8, 6, (c) => { px(c, PAL.white, 0, 0, 8, 6); px(c, PAL.ifmRed, 0, 0, 8, 2); px(c, '#9a9a9a', 1, 3, 2, 2); px(c, PAL.ink, 4, 3, 3, 1); });
  // RATP bus, side view, heading east (mint + white livery)
  make('bus', 60, 26, (c) => {
    px(c, 'rgba(0,0,0,.25)', 2, 22, 58, 4);
    px(c, '#eef0ee', 0, 2, 60, 18); px(c, '#ffffff', 0, 2, 60, 2);
    px(c, '#4fb79a', 0, 15, 60, 5); px(c, '#3c9a80', 0, 19, 60, 1);
    px(c, '#26323a', 6, 5, 46, 7); for (let x = 6; x < 52; x += 8) px(c, '#3e5260', x + 1, 6, 5, 3);
    px(c, '#26323a', 53, 5, 6, 9); px(c, '#4a6270', 54, 6, 3, 4);
    px(c, '#1d1d22', 20, 5, 6, 14); px(c, '#1d1d22', 38, 5, 6, 14);
    px(c, '#ffd75e', 58, 15, 2, 2); px(c, '#d6332e', 0, 15, 1, 3);
    px(c, '#26323a', 2, 2, 12, 2); px(c, '#ffd75e', 3, 2, 10, 1);
    [[8, 19], [46, 19]].forEach(([x, y]) => { px(c, '#141418', x, y, 8, 6); px(c, '#5b5a62', x + 2, y + 2, 4, 2); });
  });
  // plane-tree canopy (overhead layer)
  make('canopy', 44, 40, (c) => {
    const blobs = [[22, 20, 18], [12, 16, 10], [32, 15, 11], [16, 27, 10], [30, 28, 10], [22, 9, 10]];
    const disc = (cx, cy, r, col) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); px(c, col, cx - w, cy + y, w * 2, 1); } };
    blobs.forEach(([x, y, r]) => disc(x, y + 1, r, 'rgba(20,30,15,.35)'));
    blobs.forEach(([x, y, r]) => disc(x, y, r, '#3f5a2f'));
    blobs.forEach(([x, y, r]) => disc(x - 2, y - 2, Math.max(3, r - 4), '#4f6f3a'));
    blobs.forEach(([x, y, r], i) => disc(x - 4, y - 4, Math.max(2, r - 9), i % 2 ? '#6a8c4c' : '#5f8044'));
    for (let i = 0; i < 40; i++) px(c, '#82a35c', (hash(i, 3) * 40) | 0 + 2, (hash(3, i) * 34) | 0 + 2, 1, 1);
  });
  make('ring', 16, 7, (c) => { px(c, '#ffd75e', 3, 0, 10, 1); px(c, '#ffd75e', 3, 6, 10, 1); px(c, '#ffd75e', 1, 1, 2, 1); px(c, '#ffd75e', 13, 1, 2, 1); px(c, '#ffd75e', 1, 5, 2, 1); px(c, '#ffd75e', 13, 5, 2, 1); px(c, '#ffd75e', 0, 2, 1, 3); px(c, '#ffd75e', 15, 2, 1, 3); });
  // the red & white barge moored by the bridge (satellite view)
  make('barge', 132, 40, (c) => {
    px(c, 'rgba(0,0,0,.25)', 4, 8, 128, 30);
    px(c, '#b8302c', 0, 6, 124, 28); px(c, '#d6332e', 2, 6, 120, 4); px(c, '#8f2421', 0, 30, 124, 4);
    px(c, '#b8302c', 124, 10, 6, 20); px(c, '#b8302c', 130, 14, 2, 12);
    px(c, '#f4f1ea', 14, 10, 84, 18); px(c, '#ffffff', 14, 10, 84, 3); px(c, '#d8d4cc', 14, 25, 84, 3);
    for (let x = 18; x < 96; x += 9) px(c, '#3e5260', x, 15, 5, 5);
    px(c, '#f4f1ea', 100, 12, 16, 14); px(c, '#3e5260', 103, 15, 10, 5);
    px(c, '#2b2b33', 6, 12, 4, 4); px(c, '#2b2b33', 118, 12, 4, 4);
  });
  make('houseboat', 84, 30, (c) => {
    px(c, 'rgba(0,0,0,.25)', 3, 6, 81, 24);
    px(c, '#2f3b4a', 0, 4, 80, 22); px(c, '#3e4d5e', 2, 4, 76, 3);
    px(c, '#c9b28a', 10, 7, 54, 14); px(c, '#e6d3a6', 10, 7, 54, 3);
    for (let x = 14; x < 62; x += 8) px(c, '#3e5260', x, 11, 4, 4);
    px(c, '#6f8a4f', 66, 8, 8, 6);
  });
  make('roofTile', 16, 16, (c) => { const p = TILES[T.roofDeck][1]; p(c, 3); });
  make('arrow-up', 11, 9, (c) => {
    for (let i = 0; i < 5; i++) px(c, '#1b1a22', 5 - i - 1, 1 + i, 2 * i + 3, 1);
    for (let i = 0; i < 4; i++) px(c, '#ffd75e', 5 - i, 2 + i, 2 * i + 1, 1);
    px(c, '#1b1a22', 3, 6, 5, 3); px(c, '#ffd75e', 4, 6, 3, 2);
  });
  make('arrow-star', 11, 11, (c) => {
    const pts = [[5,0],[6,3],[10,3],[7,6],[8,10],[5,8],[2,10],[3,6],[0,3],[4,3]];
    px(c, '#1b1a22', 3, 2, 5, 7); px(c, '#1b1a22', 0, 3, 11, 3); px(c, '#1b1a22', 4, 0, 3, 3); px(c, '#1b1a22', 1, 7, 3, 4); px(c, '#1b1a22', 7, 7, 3, 4);
    px(c, '#d6332e', 4, 3, 3, 5); px(c, '#d6332e', 1, 4, 9, 1); px(c, '#d6332e', 5, 1, 1, 3); px(c, '#d6332e', 2, 8, 2, 2); px(c, '#d6332e', 7, 8, 2, 2);
  });
  // who's watching: shield = security, book = teacher, cup = staff
  make('ic-guard', 9, 10, (c) => { px(c, '#1b1a22', 0, 0, 9, 7); px(c, '#1b1a22', 1, 7, 7, 2); px(c, '#1b1a22', 3, 9, 3, 1); px(c, '#4ea3ff', 1, 1, 7, 6); px(c, '#4ea3ff', 2, 7, 5, 1); px(c, '#4ea3ff', 4, 8, 1, 1); px(c, '#d9ecff', 2, 2, 2, 3); });
  make('ic-teacher', 10, 8, (c) => { px(c, '#1b1a22', 0, 0, 10, 8); px(c, '#ffc93c', 1, 1, 4, 6); px(c, '#ffe28a', 5, 1, 4, 6); px(c, '#1b1a22', 5, 1, 0.5, 6); px(c, '#b8862a', 2, 3, 2, 1); px(c, '#b8862a', 6, 3, 2, 1); });
  make('ic-staff', 8, 8, (c) => { px(c, '#1b1a22', 0, 0, 8, 8); px(c, '#9be36a', 1, 1, 6, 6); px(c, '#e8ffd8', 2, 2, 2, 2); });
  make('ic-camera', 2, 2, () => {});
  make('puff', 7, 7, (c) => { px(c, 'rgba(230,230,230,.85)', 2, 0, 3, 7); px(c, 'rgba(230,230,230,.85)', 0, 2, 7, 3); px(c, 'rgba(255,255,255,.9)', 2, 2, 2, 2); });
  make('cctv', 10, 8, (c) => { px(c, '#f4f1ea', 1, 0, 8, 2); px(c, '#d8d4cc', 0, 2, 10, 3); px(c, '#2b2b33', 2, 4, 6, 4); px(c, '#46464e', 3, 4, 2, 2); });
  make('led', 2, 2, (c) => px(c, '#ff3b30', 0, 0, 2, 2));
  make('cig', 3, 3, (c) => px(c, '#cfcfcf', 0, 0, 2, 2));
}
function bubble(c, bg, fg, dots) {
  px(c, bg, 0, 0, 9, 10); px(c, PAL.ink, 0, 0, 9, 1); px(c, PAL.ink, 0, 9, 9, 1); px(c, PAL.ink, 0, 0, 1, 10); px(c, PAL.ink, 8, 0, 1, 10);
  px(c, bg, 1, 1, 7, 8);
  px(c, bg, 3, 10, 2, 1);
  dots.forEach(([x, y]) => px(c, fg, x, y));
}
