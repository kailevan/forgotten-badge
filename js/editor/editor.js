// ─────────────────────────────────────────────────────────────
//  MAP EDITOR — paint the levels on a grid, trace over a reference
//  image, drop markers + notes, Save → maps/<level>.json.
//  Uses the game's own tile painters + legend, so what you draw is
//  exactly what the game shows.
// ─────────────────────────────────────────────────────────────
import { TILE } from '../config.js';
import { TILES, T } from '../art/tiles.js';
import { LEGEND, tileKeyAt } from '../systems/map.js';
import { LEVELS } from '../levels/index.js';

const $ = (id) => document.getElementById(id);

// ── palette (friendly names; chars = the game's legend) ──────
const PALETTE = [
  ['Walls & glass', [
    ['#', 'White wall'], ['X', 'Concrete wall'], ['G', 'Glass façade'], ['g', 'Glass partition (classroom)'],
    ['A', 'Oak balustrade'], ['o', 'Concrete column'], ['Q', 'Poster wall'], ['W', 'White stair block (lobby)'],
  ]],
  ['Doors & access', [
    ['D', 'Door'], ['E', 'Glass entrance door'], ['t', 'Speed gate (badge)'], ['i', 'Gate post'], ['j', 'Badge reader post'],
    ['s', 'Stairs'], ['e', 'Grand oak staircase'], ['J', 'Oak staircase (sideways)'], ['L', 'Lift'], ['V', 'Atrium (void)'],
  ]],
  ['Floors', [
    ['w', 'Oak parquet'], ['.', 'Concrete floor'], ['_', 'Doormat'], [',', 'Paving'], ['k', 'Cobbles (riverbank)'], ['"', 'Grass'], ['~', 'Water'],
  ]],
  ['Furniture', [
    ['c', 'Reception desk'], ['d', 'Desk'], ['q', 'Café table'], ['y', 'High table'], ['u', 'Chairs'], ['v', 'Amphi seats'],
    ['M', 'Sewing machine'], ['m', 'Mannequin'], ['r', 'Clothes rack (hiding spot)'], ['l', 'Bookshelf'], ['b', 'Bench'], ['f', 'Sofa'], ['N', 'Edusign QR'], ['[', 'Projector screen'], ['$', 'Food kiosk (Allegria)'], ['a', 'Sink'], ['I', 'Microwave'],
  ]],
  ['Street & outside', [
    ['=', 'Road'], ['-', 'Road line'], ['z', 'Crossing (across ↕)'], ['Z', 'Crossing (across ↔)'], ['+', 'Bike lane'], ['B', 'Bus lane'],
    ['%', 'Bridge'], ['p', 'Pontoon'], ['T', 'Tree'], ['x', 'Barrier'], ['h', 'Hedge (hiding spot)'], ['n', 'Bollard'], ['K', 'Bus shelter'],
  ]],
  ['Buildings (outside view)', [
    ['R', 'Docks roof (oak deck)'], ['Y', 'Roof planting'], ['P', 'Green glass (Plug-Over)'], ['F', 'Green cladding'],
    ['H', 'Ground-floor glazing'], ['C', 'Concrete pillar'], ['U', 'Roller shutter'], ['S', 'Station roof'], ['O', 'Other building roof'],
  ]],
  ['Empty', [[' ', 'Nothing / outside the map']]],
];
const MARKERS = [
  ['start', 'You start here', '#ffd75e', 'S'],
  ['exit', 'Exit / stairs to next floor', '#7fbf3f', '↑'],
  ['goal', 'Goal (room 1.11 door)', '#d6332e', '★'],
  ['guard', 'Security guard', '#5aa9ff', 'G'],
  ['teacher', 'Teacher', '#f2b134', 'T'],
  ['camera', 'CCTV camera', '#ff6b9a', 'C'],
  ['crowd', 'Students hang out here', '#c9b28a', 'st'],
  ['note', 'Note (type text)', '#f4f1ea', '✎'],
];

// ── state ────────────────────────────────────────────────────
const S = {
  level: 'quai', w: 0, h: 0, grid: [], markers: [],
  brush: '#', marker: null, tool: 'brush', size: 1, zoom: 24,
  ref: { src: null, x: 0, y: 0, scale: 1, opacity: 0.55, ext: null, dirty: false },
  tileOpacity: 0.85, gridOn: true, undo: [], redo: [], dirty: false,
};

// ── tile atlas, painted with the game's painters ─────────────
const VARIANTS = 4;
const atlas = document.createElement('canvas');
atlas.width = TILES.length * TILE; atlas.height = TILE * VARIANTS;
{
  const c = atlas.getContext('2d');
  for (let v = 0; v < VARIANTS; v++) TILES.forEach(([, paint], i) => {
    c.save(); c.translate(i * TILE, v * TILE); c.beginPath(); c.rect(0, 0, TILE, TILE); c.clip(); paint(c, v * 31 + i); c.restore();
  });
}

// ── palette UI ───────────────────────────────────────────────
function swatch(ch) {
  const cv = document.createElement('canvas'); cv.width = cv.height = TILE;
  const at = (x, y) => (y === 1 ? (ch === ',' ? ',' : 'w') : ch);
  const key = ch === ' ' ? 'void' : tileKeyAt((x, y) => (x === 0 && y === 0 ? ch : at(x, y)), 0, 0);
  cv.getContext('2d').drawImage(atlas, T[key] * TILE, 0, TILE, TILE, 0, 0, TILE, TILE);
  return cv;
}
function buildPalette() {
  const root = $('palette');
  root.innerHTML = '';
  for (const [group, items] of PALETTE) {
    const h = document.createElement('h3'); h.textContent = group; root.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'pal-grid';
    for (const [ch, name] of items) {
      const b = document.createElement('button'); b.className = 'pal-item'; b.dataset.ch = ch;
      b.appendChild(swatch(ch)); b.append(name);
      b.onclick = () => selectBrush(ch);
      grid.appendChild(b);
    }
    root.appendChild(grid);
  }
  const h = document.createElement('h3'); h.textContent = 'Markers'; root.appendChild(h);
  const grid = document.createElement('div'); grid.className = 'pal-grid';
  for (const [type, name, col, glyph] of MARKERS) {
    const b = document.createElement('button'); b.className = 'pal-item'; b.dataset.marker = type;
    const d = document.createElement('span'); d.className = 'dot'; d.style.background = col; d.style.color = type === 'note' ? '#1b1a22' : '#fff'; d.textContent = glyph;
    b.appendChild(d); b.append(name);
    b.onclick = () => selectMarker(type);
    grid.appendChild(b);
  }
  root.appendChild(grid);
  markPalette();
}
function markPalette() {
  document.querySelectorAll('.pal-item').forEach((b) => b.classList.toggle('is-on', S.marker ? b.dataset.marker === S.marker : b.dataset.ch === S.brush));
}
function selectBrush(ch) { S.brush = ch; S.marker = null; if (S.tool === 'pick' || S.tool === 'move') setTool('brush'); markPalette(); }
function selectMarker(type) { S.marker = type; setTool('brush'); markPalette(); }
function setTool(t) { S.tool = t; document.querySelectorAll('#tools button').forEach((b) => b.classList.toggle('is-on', b.dataset.tool === t)); }

// ── load / save ──────────────────────────────────────────────
async function load(level) {
  S.level = level;
  $('level').value = level;
  let data = null;
  try { const r = await fetch(`maps/${level}.json`, { cache: 'no-store' }); if (r.ok) data = await r.json(); } catch (e) { /* none yet */ }
  const rows = data?.rows || LEVELS[level].rows;
  S.h = rows.length; S.w = Math.max(...rows.map((r) => r.length));
  S.grid = rows.map((r) => r.padEnd(S.w, ' ').split(''));
  S.markers = data?.markers || [];
  S.undo = []; S.redo = [];
  const ref = data?.ref;
  S.ref = { src: null, x: ref?.x || 0, y: ref?.y || 0, scale: ref?.scale || 1, opacity: ref?.opacity ?? 0.55, ext: ref?.ext || null, dirty: false };
  $('ref').style.display = 'none';
  if (S.ref.ext) setRef(`maps/${level}-reference.${S.ref.ext}?t=${Date.now()}`, false);
  $('ref-opacity').value = Math.round(S.ref.opacity * 100);
  $('ref-scale').value = Math.round(S.ref.scale * 100);
  $('w').value = S.w; $('h').value = S.h;
  status(data ? `Your saved map · ${new Date(data.savedAt || Date.now()).toLocaleString()}` : 'Current game map — draw over it', data ? 'ok' : '');
  S.dirty = false;
  resizeCanvas(); renderAll();
}
async function save() {
  status('Saving…');
  const body = { level: S.level, w: S.w, h: S.h, rows: S.grid.map((r) => r.join('')), markers: S.markers,
    ref: S.ref.ext || S.ref.dirty ? { x: S.ref.x, y: S.ref.y, scale: S.ref.scale, opacity: S.ref.opacity, ext: S.ref.ext } : null,
    savedAt: Date.now() };
  try {
    if (S.ref.dirty && S.ref.src) {
      const r = await fetch(`/api/ref/${S.level}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: S.ref.src }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error);
      S.ref.ext = j.file.endsWith('.png') ? 'png' : 'jpg'; S.ref.dirty = false; body.ref.ext = S.ref.ext;
    }
    const r = await fetch(`/api/map/${S.level}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json(); if (!j.ok) throw new Error(j.error);
    S.dirty = false;
    status(`Saved ✓ ${new Date().toLocaleTimeString()} — tell Claude it’s ready`, 'ok');
  } catch (e) {
    status('Could not save — is “python3 _serve.py” running? (' + e.message + ')', 'err');
  }
}
function status(t, cls = '') { const el = $('status'); el.textContent = t; el.className = 'status ' + cls; }

// ── rendering ────────────────────────────────────────────────
const map = $('map'), overlay = $('overlay');
const mctx = map.getContext('2d'), octx = overlay.getContext('2d');
const at = (x, y) => (y < 0 || y >= S.h || x < 0 || x >= S.w ? ' ' : S.grid[y][x]);
function resizeCanvas() {
  const W = S.w * S.zoom, H = S.h * S.zoom;
  for (const c of [map, overlay]) { c.width = W; c.height = H; c.style.width = W + 'px'; c.style.height = H + 'px'; }
  $('stage').style.width = W + 'px'; $('stage').style.height = H + 'px';
  $('zoom-label').textContent = S.zoom + 'px';
  placeRef();
}
function renderCell(x, y) {
  const z = S.zoom, ch = at(x, y);
  mctx.clearRect(x * z, y * z, z, z);
  if (ch === ' ') return;
  const key = tileKeyAt(at, x, y);
  const v = ((x * 7 + y * 13) ^ (x * y)) & 3;
  mctx.globalAlpha = S.tileOpacity;
  mctx.drawImage(atlas, T[key] * TILE, v * TILE, TILE, TILE, x * z, y * z, z, z);
  if (ch === 'T') { mctx.fillStyle = 'rgba(79,111,58,.85)'; mctx.beginPath(); mctx.arc(x * z + z / 2, y * z + z / 2, z * 0.62, 0, Math.PI * 2); mctx.fill(); }
  mctx.globalAlpha = 1;
}
function renderRegion(x0, y0, x1, y1) {
  for (let y = Math.max(0, y0 - 1); y <= Math.min(S.h - 1, y1 + 1); y++)
    for (let x = Math.max(0, x0 - 1); x <= Math.min(S.w - 1, x1 + 1); x++) renderCell(x, y);
  // trees overhang neighbours: redraw nearby trees on top
  for (let y = Math.max(0, y0 - 2); y <= Math.min(S.h - 1, y1 + 2); y++)
    for (let x = Math.max(0, x0 - 2); x <= Math.min(S.w - 1, x1 + 2); x++) if (at(x, y) === 'T') renderCell(x, y);
  renderOverlay();
}
function renderAll() { mctx.imageSmoothingEnabled = false; mctx.clearRect(0, 0, map.width, map.height); for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) renderCell(x, y); renderOverlay(); }

let preview = null; // {x0,y0,x1,y1} rect/line being dragged
let hoverCell = null;
function renderOverlay() {
  const z = S.zoom;
  octx.clearRect(0, 0, overlay.width, overlay.height);
  if (S.gridOn && z >= 10) {
    octx.strokeStyle = 'rgba(0,0,0,.18)'; octx.lineWidth = 1; octx.beginPath();
    for (let x = 0; x <= S.w; x++) { octx.moveTo(x * z + .5, 0); octx.lineTo(x * z + .5, S.h * z); }
    for (let y = 0; y <= S.h; y++) { octx.moveTo(0, y * z + .5); octx.lineTo(S.w * z, y * z + .5); }
    octx.stroke();
    octx.strokeStyle = 'rgba(0,0,0,.35)'; octx.beginPath();
    for (let x = 0; x <= S.w; x += 10) { octx.moveTo(x * z + .5, 0); octx.lineTo(x * z + .5, S.h * z); }
    for (let y = 0; y <= S.h; y += 10) { octx.moveTo(0, y * z + .5); octx.lineTo(S.w * z, y * z + .5); }
    octx.stroke();
  }
  for (const m of S.markers) {
    const def = MARKERS.find((d) => d[0] === m.type); if (!def) continue;
    const cx = m.x * z + z / 2, cy = m.y * z + z / 2, r = Math.max(7, z * 0.42);
    octx.fillStyle = def[2]; octx.strokeStyle = '#1b1a22'; octx.lineWidth = 2;
    octx.beginPath(); octx.arc(cx, cy, r, 0, Math.PI * 2); octx.fill(); octx.stroke();
    octx.fillStyle = m.type === 'note' ? '#1b1a22' : '#fff'; octx.font = `700 ${Math.max(9, r)}px Silkscreen, monospace`; octx.textAlign = 'center'; octx.textBaseline = 'middle';
    octx.fillText(def[3], cx, cy + 1);
    if (m.text) {
      octx.font = `600 ${Math.max(11, z * 0.55)}px "Pixelify Sans", sans-serif`; octx.textAlign = 'left';
      const tw = octx.measureText(m.text).width;
      octx.fillStyle = 'rgba(27,26,34,.88)'; octx.fillRect(cx + r + 3, cy - z * 0.4, tw + 10, z * 0.8 + 2);
      octx.fillStyle = '#f4f1ea'; octx.fillText(m.text, cx + r + 8, cy + 1);
    }
  }
  const box = preview || (hoverCell && S.tool !== 'move' ? brushBox(hoverCell.x, hoverCell.y) : null);
  if (box) {
    octx.strokeStyle = '#ffd75e'; octx.lineWidth = 2;
    if (preview && preview.line) {
      octx.fillStyle = 'rgba(255,215,94,.35)';
      lineCells(preview.x0, preview.y0, preview.x1, preview.y1).forEach(([x, y]) => octx.fillRect(x * z, y * z, z, z));
    } else {
      const x0 = Math.min(box.x0, box.x1), y0 = Math.min(box.y0, box.y1), x1 = Math.max(box.x0, box.x1), y1 = Math.max(box.y0, box.y1);
      octx.strokeRect(x0 * z + 1, y0 * z + 1, (x1 - x0 + 1) * z - 2, (y1 - y0 + 1) * z - 2);
    }
  }
}
function brushBox(x, y) {
  if (S.marker) return { x0: x, y0: y, x1: x, y1: y };
  const r = Math.floor((S.size - 1) / 2);
  return { x0: x - r, y0: y - r, x1: x - r + S.size - 1, y1: y - r + S.size - 1 };
}

// ── reference image ──────────────────────────────────────────
function setRef(src, fresh = true) {
  const img = $('ref');
  img.onload = () => { img.style.display = 'block'; placeRef(); };
  img.src = src;
  if (fresh) { S.ref.src = src; S.ref.dirty = true; S.dirty = true; status('Image added — Save keeps it'); }
}
function placeRef() {
  const img = $('ref'); if (!img.naturalWidth) return;
  const k = S.zoom / 24; // ref transform is stored at 24px zoom
  img.style.width = img.naturalWidth * S.ref.scale * k + 'px';
  img.style.transform = `translate(${S.ref.x * k}px, ${S.ref.y * k}px)`;
  img.style.opacity = S.ref.opacity;
}
function readImage(file) {
  if (!file || !/^image\/(png|jpeg)$/.test(file.type)) { status('Use a PNG or JPG image', 'err'); return; }
  const fr = new FileReader();
  fr.onload = () => setRef(fr.result);
  fr.readAsDataURL(file);
}

// ── editing ──────────────────────────────────────────────────
function snapshot() { S.undo.push({ grid: S.grid.map((r) => r.join('')), markers: JSON.stringify(S.markers), w: S.w, h: S.h }); if (S.undo.length > 80) S.undo.shift(); S.redo = []; }
function restore(s) { S.w = s.w; S.h = s.h; S.grid = s.grid.map((r) => r.split('')); S.markers = JSON.parse(s.markers); resizeCanvas(); renderAll(); }
function undo() { const s = S.undo.pop(); if (!s) return; S.redo.push({ grid: S.grid.map((r) => r.join('')), markers: JSON.stringify(S.markers), w: S.w, h: S.h }); restore(s); touched(); }
function redo() { const s = S.redo.pop(); if (!s) return; S.undo.push({ grid: S.grid.map((r) => r.join('')), markers: JSON.stringify(S.markers), w: S.w, h: S.h }); restore(s); touched(); }
function touched() { S.dirty = true; status('Unsaved changes'); }

function setCell(x, y, ch) { if (x < 0 || y < 0 || x >= S.w || y >= S.h) return false; if (S.grid[y][x] === ch) return false; S.grid[y][x] = ch; return true; }
function paintBox(b, ch) {
  const x0 = Math.min(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), x1 = Math.max(b.x0, b.x1), y1 = Math.max(b.y0, b.y1);
  let any = false;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) any = setCell(x, y, ch) || any;
  if (any) { renderRegion(x0, y0, x1, y1); touched(); }
}
function lineCells(x0, y0, x1, y1) {
  const out = []; let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
  for (;;) { out.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  return out;
}
function fill(x, y, ch) {
  const from = at(x, y); if (from === ch) return;
  const stack = [[x, y]]; let n = 0, minX = x, minY = y, maxX = x, maxY = y;
  while (stack.length && n < 40000) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= S.w || cy >= S.h || S.grid[cy][cx] !== from) continue;
    S.grid[cy][cx] = ch; n++;
    minX = Math.min(minX, cx); maxX = Math.max(maxX, cx); minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  renderRegion(minX, minY, maxX, maxY); touched();
}
function placeMarker(x, y) {
  S.markers = S.markers.filter((m) => !(m.x === x && m.y === y));
  const m = { type: S.marker, x, y };
  if (S.marker === 'note') { const t = prompt('Note text (e.g. “library”, “toilets”, “security stands here”):'); if (!t) return renderOverlay(); m.text = t.slice(0, 80); }
  if (S.marker === 'start' || S.marker === 'goal') S.markers = S.markers.filter((k) => k.type !== S.marker);
  S.markers.push(m); renderOverlay(); touched();
}
function eraseMarker(x, y) { const n = S.markers.length; S.markers = S.markers.filter((m) => !(m.x === x && m.y === y)); if (S.markers.length !== n) { renderOverlay(); touched(); return true; } return false; }

// ── mouse ────────────────────────────────────────────────────
const wrap = $('wrap');
let drag = null, spaceDown = false;
const cellAt = (e) => { const r = map.getBoundingClientRect(); return { x: Math.floor((e.clientX - r.left) / S.zoom), y: Math.floor((e.clientY - r.top) / S.zoom) }; };

wrap.addEventListener('contextmenu', (e) => e.preventDefault());
wrap.addEventListener('pointerdown', (e) => {
  if (e.button === 1 || spaceDown) { drag = { pan: true, sx: e.clientX, sy: e.clientY, l: wrap.scrollLeft, t: wrap.scrollTop }; wrap.classList.add('is-pan'); return; }
  const c = cellAt(e);
  const erase = e.button === 2;
  if (S.tool === 'move') { drag = { move: true, sx: e.clientX, sy: e.clientY, x: S.ref.x, y: S.ref.y }; return; }
  if (S.tool === 'pick') { const ch = at(c.x, c.y); selectBrush(ch); return; }
  snapshot();
  if (S.marker && !erase) { placeMarker(c.x, c.y); drag = null; return; }
  if (erase && eraseMarker(c.x, c.y)) { drag = null; return; }
  const ch = erase ? ' ' : S.brush;
  if (S.tool === 'fill') { fill(c.x, c.y, ch); return; }
  if (S.tool === 'rect' || S.tool === 'line' || e.shiftKey) {
    drag = { shape: S.tool === 'line' ? 'line' : 'rect', ch, x0: c.x, y0: c.y };
    preview = { x0: c.x, y0: c.y, x1: c.x, y1: c.y, line: drag.shape === 'line' }; renderOverlay(); return;
  }
  drag = { paint: true, ch, last: c };
  paintBox(brushBox(c.x, c.y), ch);
  wrap.setPointerCapture(e.pointerId);
});
wrap.addEventListener('pointermove', (e) => {
  const c = cellAt(e);
  if (!drag || !drag.pan) {
    if (!hoverCell || hoverCell.x !== c.x || hoverCell.y !== c.y) {
      hoverCell = c;
      const ch = at(c.x, c.y), name = PALETTE.flatMap((g) => g[1]).find((p) => p[0] === ch)?.[1] || '—';
      const mk = S.markers.find((m) => m.x === c.x && m.y === c.y);
      $('hover').textContent = `x ${c.x}, y ${c.y} · ${name}${mk ? ' · marker: ' + (mk.text || mk.type) : ''}`;
      if (!drag) renderOverlay();
    }
  }
  if (!drag) return;
  if (drag.pan) { wrap.scrollLeft = drag.l - (e.clientX - drag.sx); wrap.scrollTop = drag.t - (e.clientY - drag.sy); return; }
  if (drag.move) { const k = 24 / S.zoom; S.ref.x = drag.x + (e.clientX - drag.sx) * k; S.ref.y = drag.y + (e.clientY - drag.sy) * k; placeRef(); S.dirty = true; return; }
  if (drag.shape) { preview.x1 = c.x; preview.y1 = c.y; renderOverlay(); return; }
  if (drag.paint) {
    lineCells(drag.last.x, drag.last.y, c.x, c.y).forEach(([x, y]) => paintBox(brushBox(x, y), drag.ch));
    drag.last = c;
  }
});
window.addEventListener('pointerup', () => {
  if (drag?.shape) {
    if (drag.shape === 'line') { lineCells(preview.x0, preview.y0, preview.x1, preview.y1).forEach(([x, y]) => paintBox(brushBox(x, y), drag.ch)); }
    else paintBox(preview, drag.ch);
    preview = null; renderOverlay();
  }
  if (drag?.move) status('Image moved — Save keeps it');
  drag = null; wrap.classList.remove('is-pan');
});
wrap.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
function zoom(dir) {
  const steps = [8, 12, 16, 20, 24, 32, 40, 48];
  const i = Math.max(0, Math.min(steps.length - 1, steps.indexOf(S.zoom) + dir));
  if (steps[i] === S.zoom) return;
  S.zoom = steps[i]; resizeCanvas(); renderAll();
}

// ── drag & drop images ───────────────────────────────────────
['dragenter', 'dragover'].forEach((t) => window.addEventListener(t, (e) => { e.preventDefault(); $('drop').classList.add('is-on'); }));
['dragleave', 'drop'].forEach((t) => window.addEventListener(t, (e) => { e.preventDefault(); if (t === 'drop' || e.target === document.documentElement) $('drop').classList.remove('is-on'); }));
window.addEventListener('drop', (e) => { const f = e.dataTransfer?.files?.[0]; if (f) readImage(f); });
window.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])][0]; if (f) readImage(f); });

// ── keys ─────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === ' ') { spaceDown = true; wrap.classList.add('is-pan'); e.preventDefault(); }
  if ((e.metaKey || e.ctrlKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.metaKey || e.ctrlKey) && k === 's') { e.preventDefault(); save(); return; }
  if (e.metaKey || e.ctrlKey) return;
  ({ b: () => setTool('brush'), r: () => setTool('rect'), l: () => setTool('line'), f: () => setTool('fill'), i: () => setTool('pick'), m: () => setTool('move') })[k]?.();
});
window.addEventListener('keyup', (e) => { if (e.key === ' ') { spaceDown = false; wrap.classList.remove('is-pan'); } });
window.addEventListener('beforeunload', (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

// ── wiring ───────────────────────────────────────────────────
document.querySelectorAll('#tools button').forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
document.querySelectorAll('#brush-sizes button').forEach((b) => (b.onclick = () => {
  S.size = +b.dataset.size; document.querySelectorAll('#brush-sizes button').forEach((x) => x.classList.toggle('is-on', x === b));
}));
$('undo').onclick = undo; $('redo').onclick = redo;
$('zoom-in').onclick = () => zoom(1); $('zoom-out').onclick = () => zoom(-1);
$('save').onclick = save;
$('play').onclick = async () => { if (S.dirty) await save(); window.open(`index.html?map=custom&level=${S.level}`, '_blank'); };
$('level').onchange = (e) => { if (S.dirty && !confirm('You have unsaved changes. Switch map anyway?')) { e.target.value = S.level; return; } load(e.target.value); };
$('ref-file').onchange = (e) => readImage(e.target.files[0]);
$('ref-opacity').oninput = (e) => { S.ref.opacity = e.target.value / 100; placeRef(); };
$('ref-scale').oninput = (e) => { S.ref.scale = e.target.value / 100; placeRef(); };
$('tile-opacity').oninput = (e) => { S.tileOpacity = e.target.value / 100; renderAll(); };
$('grid-on').onchange = (e) => { S.gridOn = e.target.checked; renderOverlay(); };
$('ref-clear').onclick = () => { $('ref').style.display = 'none'; $('ref').removeAttribute('src'); S.ref = { ...S.ref, src: null, ext: null, dirty: false }; touched(); };
$('resize').onclick = () => {
  const w = Math.max(10, Math.min(300, +$('w').value | 0)), h = Math.max(10, Math.min(200, +$('h').value | 0));
  snapshot();
  S.grid = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => S.grid[y]?.[x] ?? ' '));
  S.w = w; S.h = h; S.markers = S.markers.filter((m) => m.x < w && m.y < h);
  resizeCanvas(); renderAll(); touched();
};

buildPalette();
await document.fonts.ready;
load(new URLSearchParams(location.search).get('level') || 'quai');
