// ─────────────────────────────────────────────────────────────
//  LEVEL 2 — IFM 1st floor → Room 1.11
//
//  Built from Kai's drawing (IMG_1253), rotated so the Seine is north,
//  revised after his review (2026-11-05):
//  · the floor is deeper toward the NORTH: the north corridor to 1.11
//    sits high, the atrium has real walkways round the long tables
//  · EAST: the atrium — the 13×5 stair climbs east along the void, you
//    arrive on its top landing; chairs along the balustrade, sitting
//    area, long atrium tables, café kiosk by the south wall facing north
//  · river side: 1.05 · 1.06 · 1.07 · 1.08 · 1.09 · 1.10 · 1.11 (NW corner)
//  · inner side: Allegria (lunch kiosk), meeting rooms round a light well,
//    offices, meeting + admin; 1.12 under 1.11
//  · 1.11 has an Edusign QR panel by its door — scanning it is the win
// ─────────────────────────────────────────────────────────────
import { grid } from './grid.js';
import { tilePt } from '../entities/actors.js';
import { HUD } from '../ui/hud.js';
import { LOOKS } from '../art/characters.js';

const W = 128, H = 34;
const g = grid(W, H, '#');
g.rect(0, 0, W, 2, '~'); g.rect(0, 0, 1, 14, '~');
g.hline(1, 2, W - 1, 'G'); g.vline(1, 2, 11, 'G');          // 1.11: glass on two sides, over the Seine
g.rect(2, 3, W - 3, 30, 'w');                                // oak parquet
g.hline(0, 33, W, 'F');                                      // quai side: green cladding

// ── river-side classrooms (west → east), close to the river façade ──
const ROOMS = [['1.11', 2, 15, 12], ['1.10', 17, 25, 21], ['1.09', 27, 35, 31], ['1.08', 37, 45, 41], ['1.07', 47, 55, 51], ['1.06', 57, 63, 60], ['1.05', 65, 71, 68]];
[16, 26, 36, 46, 56, 64, 72].forEach((x) => g.vline(x, 3, 7, '#'));
g.hline(2, 10, 8, '#'); g.hline(10, 10, 62, 'g');           // glazing onto the north corridor
ROOMS.forEach(([, , , door]) => g.set(door, 10, 'D'));
g.set(14, 10, 'N');                                          // Edusign QR by 1.11's door
// classrooms: rows of tables facing EAST — projector screen + teacher on the east wall
const classroom = (a, b, y0, y1, rack = true) => {
  for (let x = a + 1; x <= b - 3; x += 3) g.vline(x, y0 + 1, y1 - y0 - 1, 'd');   // a row of tables (runs north–south)
  g.vline(b, y0 + 2, Math.max(2, y1 - y0 - 3), '[');                               // the projector screen
  if (rack) g.set(a, y0, 'r');                                                      // coat rack by the door side (hiding spot)
};
for (const [name, a, b] of ROOMS) classroom(a, b, 3, 9, name !== '1.11');
// ── 1.12, under 1.11 ──
g.vline(9, 11, 11, '#'); g.set(9, 12, 'D'); g.hline(2, 21, 8, '#');
classroom(2, 8, 11, 20, false);
g.rect(2, 22, 7, 11, '#');
// ── meeting rooms + admin offices (west column) ──
g.hline(10, 14, 9, '#'); g.hline(10, 21, 8, '#'); g.rect(2, 30, 17, 3, '#'); g.vline(18, 14, 19, '#');
g.set(18, 17, 'D'); g.set(18, 25, 'D');
g.rect(12, 17, 4, 1, 'q');                                   // meeting table
[[11, 23], [14, 23], [11, 26], [14, 26]].forEach(([x, y]) => g.set(x, y, 'd')); g.set(16, 28, 'l');
// ── central block: offices · light well + meeting rooms · computer room ──
g.hline(23, 14, 49, '#'); g.hline(23, 29, 49, '#'); g.vline(23, 14, 16, '#');
[31, 39, 47].forEach((x) => g.vline(x, 14, 16, '#'));
[27, 35, 43].forEach((x) => g.set(x, 14, 'D'));
for (const y of [18, 22, 26]) [25, 28, 33, 36, 41, 44].forEach((x) => g.set(x, y, 'd'));
g.rect(48, 15, 15, 8, 'V'); g.hline(48, 23, 15, '#'); g.vline(55, 24, 5, '#'); g.vline(63, 14, 16, '#');
g.set(51, 29, 'D'); g.set(59, 29, 'D'); g.rect(50, 26, 3, 1, 'q'); g.rect(57, 26, 3, 1, 'q');
g.set(67, 14, 'D'); g.set(67, 29, 'D');
// ALLEGRIA — lunch kiosk: counter ~30% up from the south wall, serving south; sinks + microwaves on the north wall
g.rect(66, 25, 5, 1, '$');
g.set(65, 15, 'a'); g.set(66, 15, 'a');                      // two sinks side by side
g.vline(64, 15, 4, 'I');                                     // a column of microwaves, west of the sinks
g.vline(71, 14, 16, '#');

// ── the atrium ──
g.vline(72, 3, 30, '#'); g.rect(72, 11, 1, 3, 'w'); g.rect(72, 30, 1, 3, 'w');   // corridor mouths
// river-side classroom: reaches further west, one long table in the middle
g.vline(79, 3, 5, '#'); g.hline(80, 8, 30, 'g'); g.set(95, 8, 'D');
g.rect(85, 5, 19, 1, 'y'); g.rect(85, 4, 19, 1, 'u'); g.rect(85, 6, 19, 1, 'u');
// long atrium tables, with walkways all round
g.rect(86, 12, 13, 1, 'y'); g.rect(86, 11, 13, 1, 'u'); g.rect(86, 13, 13, 1, 'u');
// sitting area
[[76, 20], [79, 20], [76, 24], [79, 24]].forEach(([x, y]) => g.set(x, y, 'q'));
[[75, 20], [80, 20], [75, 24], [80, 24]].forEach(([x, y]) => g.set(x, y, 'u'));
// the void + the 13×5 stair climbing east along it, landing at the top
g.hline(85, 16, 13, 'u');                                    // chairs along the balustrade
g.rect(84, 17, 20, 10, 'A'); g.rect(85, 18, 18, 8, 'V');
g.rect(86, 18, 13, 5, 'J'); g.rect(99, 18, 4, 5, 'w'); g.rect(99, 17, 4, 1, 'w');
// café kiosk: right against the south wall, serving north
g.rect(101, 31, 6, 1, 'c');
// south side: WC + classroom
g.hline(75, 29, 8, '#'); g.vline(75, 29, 4, '#'); g.vline(82, 29, 4, '#'); g.set(78, 29, 'D');
g.hline(83, 29, 18, '#'); g.vline(100, 29, 4, '#'); g.set(91, 29, 'D');
classroom(83, 99, 29, 33, false);
g.vline(110, 3, 30, '#'); g.rect(110, 30, 18, 3, 'w');                           // corridor → east wing
g.rect(111, 3, 17, 27, '#');

export default {
  name: 'First floor',
  rows: g.rows(),
  spawn: { x: 100, y: 20, dir: 1 },
  entries: { stairs: { x: 100, y: 20, dir: 1 } },
  exits: [{ x: 12, y: 10.6, w: 1, label: '★ 1.11 · EDUSIGN', icon: 'arrow-star', color: '#f4f1ea' }],
  labels: [
    ...ROOMS.map(([name, a]) => ({ x: a + 0.3, y: 3.15, text: name, color: '#f4f1ea', plate: name === '1.11' ? '#d6332e' : '#1b1a22' })),
    { x: 2.3, y: 11.2, text: '1.12', color: '#f4f1ea', plate: '#1b1a22' },
    { x: 10.3, y: 15.2, text: 'MEETING', color: '#1b1a22', plate: '#f4f1ea', size: 7 },
    { x: 10.3, y: 22.2, text: 'ADMIN', color: '#1b1a22', plate: '#f4f1ea', size: 7 },
    { x: 24.3, y: 15.2, text: 'OFFICES', color: '#1b1a22', plate: '#f4f1ea', size: 7 },
    { x: 48.3, y: 24.2, text: 'MEETING', color: '#1b1a22', plate: '#f4f1ea', size: 7 },
    { x: 66.1, y: 21.6, text: 'ALLEGRIA', color: '#f4f1ea', plate: '#2f6b4f', size: 7 },
    { x: 80.3, y: 3.15, text: 'CLASSROOM', color: '#f4f1ea', plate: '#1b1a22' },
    { x: 76.2, y: 30.2, text: 'WC', color: '#1b1a22', plate: '#f4f1ea', size: 7 },
    { x: 83.3, y: 30.2, text: 'CLASSROOM', color: '#1b1a22', plate: '#f4f1ea', size: 7 },
    { x: 101.2, y: 30.1, text: 'CAFÉ', color: '#f4f1ea', plate: '#d6332e', size: 7 },
    { x: 88, y: 24.1, text: '(ground floor below)', color: '#5c4630', font: 'Pixelify Sans', size: 8 },
    { x: 99.1, y: 22.3, text: 'STAIRS ▼', color: '#1b1a22', plate: '#ffd75e', size: 7 },
    { x: 40, y: 11.4, text: '< TO 1.11', color: '#f4f1ea', plate: '#1b1a22', size: 7 },
    { x: 40, y: 30.4, text: '< TO 1.11', color: '#f4f1ea', plate: '#1b1a22', size: 7 },
    { x: 114, y: 30.6, text: 'CORRIDOR →', color: '#f4f1ea', plate: '#1b1a22', size: 7 },
  ],

  setup(L) {
    // Monsieur — buzz cut, black turtleneck, high-waisted jeans. Fast, sharp, owns the north corridor.
    L.npc({ key: 'buzz', look: LOOKS.buzz, role: 'teacher', name: 'Monsieur', mode: 'patrol', speed: 38, strict: true, watchMult: 1.5,
      ...tilePt(68, 12), vision: { range: 130, fov: 1.2 },
      points: [tilePt(68, 12, { wait: 1200, look: 3 }), tilePt(40, 12, { wait: 900, look: 0 }), tilePt(20, 12, { wait: 2600, look: 2 }), tilePt(44, 13, { wait: 900, look: 1 }), tilePt(68, 13, { wait: 1200, look: 3 })],
      caughtLines: ['Shouldn’t you be in class? Where’s your badge?', 'Funny. Your badge says Camille.', 'Not today. Downstairs, reception.'] });
    // the hall monitor walks the south corridor — the other way round isn't free either
    L.npc({ key: 'guard', look: LOOKS.guard, role: 'guard', name: 'Surveillant', mode: 'patrol', speed: 26, strict: true, ...tilePt(64, 31),
      vision: { range: 112, fov: 1.3 },
      points: [tilePt(64, 31, { wait: 2000, look: 2 }), tilePt(24, 31, { wait: 2400, look: 3 }), tilePt(24, 30, { wait: 1200, look: 1 })],
      caughtLines: ['Corridors aren’t for loitering. Badge?'] });
    // admin staff walking the cross corridor between the offices
    L.npc({ key: 'smoker', look: LOOKS.smoker, role: 'staff', name: 'Admin', mode: 'patrol', speed: 24, strict: true, ...tilePt(20, 15),
      vision: { range: 84, fov: 1.4 },
      points: [tilePt(20, 15, { wait: 1800, look: 0 }), tilePt(20, 25, { wait: 3200, look: 2 }), tilePt(20, 31, { wait: 1800, look: 3 }), tilePt(20, 25)],
      caughtLines: ['Can I help you? …Which class are you in?'] });
    L.cctv({ ...tilePt(73, 10), from: Math.PI * 0.72, to: Math.PI * 1.18, period: 9000, vision: { range: 120, fov: 0.7 } });
    L.cctv({ ...tilePt(44, 11), from: Math.PI * 0.08, to: Math.PI * 0.92, period: 7000, vision: { range: 72, fov: 0.8 } });   // mid north corridor
    // Madame Couture: in and out of 1.10, checking the corridor in front of 1.11 / 1.12
    L.npc({ key: 'couture', look: LOOKS.couture, role: 'teacher', name: 'Madame Couture', mode: 'patrol', speed: 24, strict: true, ...tilePt(22, 7),
      vision: { range: 100, fov: 1.5 },
      points: [tilePt(22, 7, { wait: 4200, look: 3 }), tilePt(21, 9), tilePt(21, 12, { wait: 1200, look: 2 }), tilePt(13, 12, { wait: 2600, look: 2 }), tilePt(13, 13, { wait: 1400, look: 1 }), tilePt(21, 12, { wait: 1000, look: 3 }), tilePt(21, 9)],
      caughtLines: ['You. Late, no badge, and in my corridor? Non.', 'Darling, the gates are downstairs. Badge, please.'] });
    // your teacher in 1.11: at the projector (east wall), turning between the class and the screen
    L.prof = L.npc({ key: 'prof', look: LOOKS.prof, role: 'teacher', name: 'Prof', ...tilePt(14, 6), dir: 2,
      vision: { range: 130, fov: 1.6 }, strict: true, watchMult: 3, scan: [2, 3, 2, 3, 3], scanEvery: 2600, canChase: false,
      caughtLines: ['Twenty minutes late… and no badge either? Reception, please.', 'Ah, there you are. Badge? …I thought so.'] });
    // students drifting along the north corridor = moving cover
    L.every(11000, () => {
      for (let i = 0; i < 3; i++) {
        const s = L.student({ seed: (Math.random() * 999) | 0, ...tilePt(73 + i, 12 + (i % 2)), speed: 30 + i * 3 });
        s.route([tilePt(52 - i, 12 + (i % 2)), tilePt(31, 12), tilePt(31, 10), tilePt(30, 7)], (n) => L.remove(n));
      }
    }, 4000);

    // the atrium is busy: tables, sitting area, café queue
    [[88, 11], [92, 13], [96, 11], [77, 21], [78, 23], [80, 22], [103, 30], [105, 29], [86, 4], [90, 6], [97, 4], [74, 14]].forEach(([x, y], i) =>
      L.student({ seed: 50 + i, ...tilePt(x, y), dir: i % 4 }));
    L.npc({ key: 'barista', look: LOOKS.barista, role: 'student', name: 'Café', ...tilePt(103, 32), dir: 1 });
    // Allegria: two guys selling lunches, a queue in front
    L.npc({ key: 'allegria1', look: LOOKS.allegria1, role: 'student', name: 'Allegria', ...tilePt(67, 24), dir: 0 });
    L.npc({ key: 'allegria2', look: LOOKS.allegria2, role: 'student', name: 'Allegria', ...tilePt(69, 24), dir: 0 });
    [[67, 26], [67, 27], [68, 28], [66, 28]].forEach(([x, y], i) => L.student({ seed: 110 + i, ...tilePt(x, y), dir: 1 }));
    [[20, 5], [23, 7], [30, 4], [33, 6], [50, 5], [53, 7], [60, 4], [68, 6], [5, 15], [86, 31], [92, 30]].forEach(([x, y], i) => L.student({ seed: 80 + i, ...tilePt(x, y), dir: 3 }));
    // your class in 1.11 (Inès made it up too)
    [[5, 5], [8, 4], [8, 7], [11, 5], [5, 8]].forEach(([x, y], i) => L.student({ seed: 70 + i, ...tilePt(x, y), dir: 3 }));
    L.npc({ key: 'friend', look: LOOKS.friend, role: 'friend', name: 'Inès', ...tilePt(11, 8), dir: 0 });
    // the win: get to the free seat next to Inès without the prof clocking you
    L.zone({ x: 10, y: 6, w: 1, h: 2, once: true, onEnter: (L) => win(L) });
    L.zone({ x: 12, y: 10, w: 1, h: 1, once: true, onEnter: () => HUD.toast('Wait until the prof turns to the screen — then slip in and sit next to Inès.', 3600) });
  },

  ways: () => ({ title: 'Tips', items: [
    { text: 'Room 1.11 is at the far west end', active: true },
    { text: 'Two ways there: north corridor (Monsieur + camera) or south (hall monitor + admin)' },
    { text: 'Madame Couture keeps popping out of 1.10 — time it' },
    { text: 'Glass walls: hide behind coat racks or walk with other students' },
    { text: 'In 1.11, sit next to Inès while the prof faces the screen' },
  ] }),
  onPlay(L) { L.objective('Get into 1.11 and sit next to Inès — unseen'); },
  phone() { HUD.toast('Inès: “1.11, the very end. Monsieur is in the corridor, careful.”'); },
};

async function win(L) {
  L.mode = 'over';
  L.player.body.setVelocity(0, 0);
  HUD.letterbox(true); HUD.show(false);
  const clock = L.registry.get('clock');
  const h = Math.floor(clock / 3600), m = Math.floor((clock % 3600) / 60);
  const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const late = clock > 9 * 3600 + 30 * 60;
  L.player.face(3); L.player.animate(false);
  await new Promise((r) => setTimeout(r, 400));
  L.sfx('beep');
  HUD.toast(late ? `EDUSIGN — closed at 09:30 (it’s ${time})` : `EDUSIGN ✓  Présent·e — ${time}`, 2600);
  await new Promise((r) => setTimeout(r, 1200));
  await HUD.talk(late
    ? [['Inès', 'Edusign’s closed… but you’re here, that counts. Kind of.'], ['You', 'Never. Again. (until next week)']]
    : [['Inès', '(whispering) You made it!! Quick — Edusign’s still open.'], ['You', '(whispering) …don’t ask how. What did I miss?']]);
  HUD.letterbox(false);
  HUD.win({ time, late, caughtCount: L.registry.get('caught') });
}
