// ─────────────────────────────────────────────────────────────
//  ASCII → tilemap.  Levels are drawn as text grids (see /js/levels)
//  so the layout can be corrected against real photos fast.
// ─────────────────────────────────────────────────────────────
import { TILE } from '../config.js';
import { T, buildTileset } from '../art/tiles.js';

// solid  = blocks walking      opaque = blocks vision
// hide   = standing still here makes you invisible
// wall   = auto top/face: the bottom tile of a run shows its face (3/4 view)
export const LEGEND = {
  ' ': { tile: 'void',      solid: 1, opaque: 1 },
  // street + river
  ',': { tile: 'paving' },
  '=': { tile: 'asphalt' },
  '-': { tile: 'roadLine' },
  'z': { tile: 'zebra' },                          // crossing a horizontal road
  'Z': { tile: 'zebraV' },                         // crossing a vertical road
  'p': { tile: 'roofDeck' },                       // wooden pontoon
  '+': { tile: 'bikeLane' },
  'B': { tile: 'busLane' },
  '~': { tile: 'water',     solid: 1 },
  '|': { tile: 'railing',   solid: 1 },
  '"': { tile: 'grass' },
  'T': { tile: 'tree',      solid: 1, opaque: 1 },
  'x': { tile: 'xbarrier',  solid: 1 },
  'h': { tile: 'hedge',     hide: 1 },
  'b': { tile: 'bench',     solid: 1 },
  'k': { tile: 'cobble' },
  'n': { tile: 'bollard',   solid: 1 },
  'K': { tile: 'shelter',   solid: 1 },
  '%': { tile: 'bridge' },
  // Les Docks exterior
  'R': { tile: 'roofDeck',  solid: 1, opaque: 1 },
  'Y': { tile: 'roofPlant', solid: 1, opaque: 1 },
  'P': { tile: 'plugGlass', solid: 1, opaque: 1 },
  'F': { tile: 'clad',      solid: 1 },             // façade strip: ground-level sight passes under it
  'H': { tile: 'glazing',   solid: 1 },
  'C': { tile: 'pillar',    solid: 1, opaque: 1 },
  'U': { tile: 'shutter',   solid: 1, opaque: 1 },
  'S': { tile: 'stationRoof', solid: 1, opaque: 1 },
  'O': { tile: 'officeRoof', solid: 1, opaque: 1 },
  // IFM interior
  'w': { tile: 'oak' },
  '.': { tile: 'floor' },
  'o': { tile: 'column',    solid: 1, opaque: 1 },
  'i': { tile: 'post',      solid: 1 },
  'j': { tile: 'postReader', solid: 1 },
  't': { tile: 'oak' },                             // speed gate — the glass wings are an entity
  'c': { tile: 'deskWhite', solid: 1 },
  'W': { tile: 'stairWhite', solid: 1, opaque: 1 },
  'Q': { tile: 'poster',    solid: 1, opaque: 1 },
  's': { tile: 'stairs' },
  'e': { tile: 'grandStair' },
  'v': { tile: 'tier' },
  '_': { tile: 'doormat' },
  'd': { tile: 'desk',      solid: 1 },
  'q': { tile: 'cafeTable', solid: 1 },
  'M': { tile: 'sewing',    solid: 1 },
  'm': { tile: 'mannequin', solid: 1 },
  'r': { tile: 'rack',      hide: 1 },
  'l': { tile: 'shelf',     solid: 1, opaque: 1 },
  'L': { tile: 'lift',      solid: 1, opaque: 1 },
  '#': { wall: 'wall',      solid: 1, opaque: 1 },  // white plaster
  'X': { wall: 'conc',      solid: 1, opaque: 1 },  // raw concrete
  'G': { wall: 'glass',     solid: 1 },             // glass: solid, see-through
  'g': { wall: 'gp',        solid: 1 },             // black-framed interior glazing (see-through!)
  'A': { wall: 'bal',       solid: 1 },             // oak balustrade round the atrium
  'D': { tile: 'door' },
  'V': { tile: 'atrium',    solid: 1 },             // the void over the grand staircase
  'u': { tile: 'chairs',    solid: 1 },
  'y': { tile: 'highTable', solid: 1 },
  'E': { tile: 'doorway' },                         // glass entrance doors
  'J': { tile: 'grandStairV' },                     // oak staircase running east–west
  'f': { tile: 'sofa',      solid: 1 },
  'N': { tile: 'edusign',   solid: 1 },
  '[': { tile: 'projScreen', solid: 1 },
  'a': { tile: 'sink',      solid: 1 },
  'I': { tile: 'microwave', solid: 1 },
  '$': { tile: 'foodCounter', solid: 1 },             // Allegria lunch kiosk            // projector screen on a classroom's east wall             // Edusign QR panel by a classroom door
};
export const WALLS = new Set(['#', 'X', 'G', ' ', 'L', 'Q', 'R', 'Y', 'P', 'W', 'g', 'A']);

// Which painted tile a grid cell shows (shared with the editor so both draw the same).
export function tileKeyAt(at, x, y) {
  const ch = at(x, y);
  const def = LEGEND[ch] || LEGEND[','];
  let key = def.tile;
  if (def.wall) {
    key = def.wall + (WALLS.has(at(x, y + 1)) ? 'Top' : 'Face');
    const vertical = (at(x, y - 1) === ch || at(x, y + 1) === ch) && at(x - 1, y) !== ch && at(x + 1, y) !== ch;
    if (key.endsWith('Top') && vertical && T[key + 'V'] !== undefined) key += 'V';
  }
  if (ch === ',' && '=-z+B'.includes(at(x, y + 1))) key = 'curb';
  if ((ch === ',' || ch === 'k') && at(x, y - 1) === '~') key = 'quayEdge';
  return key;
}

export function buildMap(scene, rows) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => r.padEnd(w, ' ').split(''));
  const at = (x, y) => (y < 0 || y >= h || x < 0 || x >= w ? ' ' : grid[y][x]);

  const { columns } = buildTileset(scene);
  const solid = new Uint8Array(w * h), opaque = new Uint8Array(w * h), hide = new Uint8Array(w * h);
  const data = [];
  const gates = [];
  const trees = [];

  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      const ch = at(x, y);
      const def = LEGEND[ch] || LEGEND[','];
      const key = tileKeyAt(at, x, y);
      if (ch === 'T') trees.push({ x, y });
      const variant = ((x * 7 + y * 13) ^ (x * y)) & 3;
      row.push(variant * columns + T[key]);
      const i = y * w + x;
      solid[i] = def.solid ? 1 : 0;
      opaque[i] = def.opaque ? 1 : 0;
      hide[i] = def.hide ? 1 : 0;
      if (ch === 't') gates.push({ x, y, vertical: 'tij'.includes(at(x, y - 1)) || 'tij'.includes(at(x, y + 1)) });
    }
    data.push(row);
  }

  const map = scene.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
  const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
  const layer = map.createLayer(0, tileset, 0, 0);
  // Collision per tile from the solid grid (not by index — variants share indices).
  layer.forEachTile((t) => { const c = !!solid[t.y * w + t.x]; t.setCollision(c, c, c, c, false); });
  map.calculateFacesWithin(0, 0, w, h, layer);
  layer.setDepth(-10);

  const cell = (px, py) => ((py / TILE) | 0) * w + ((px / TILE) | 0);
  const inside = (px, py) => px >= 0 && py >= 0 && px < w * TILE && py < h * TILE;
  return {
    map, layer, w, h, gates, trees, grid, columns,
    widthPx: w * TILE, heightPx: h * TILE,
    isOpaque: (px, py) => !inside(px, py) || opaque[cell(px, py)] === 1,
    isSolid: (px, py) => !inside(px, py) || solid[cell(px, py)] === 1,
    isHide: (px, py) => inside(px, py) && hide[cell(px, py)] === 1,
  };
}

export const tileCenter = (tx, ty) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
