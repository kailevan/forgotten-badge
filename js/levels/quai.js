// ─────────────────────────────────────────────────────────────
//  LEVEL 1 — Gare d'Austerlitz → the quai → IFM ground floor
//
//  Built from Kai's drawings (IMG_1251 ground floor, IMG_1252 outside),
//  corrected 2026-11-05 after his review:
//  · two buildings with a COVERED GAP between them; IFM = the west one
//  · the lobby is SMALL: doors → gates + reception right away;
//    sofas pushed against the east and south walls
//  · the gate line runs north–south from under the reception desk
//    down to the toilets
//  · the staircase runs EAST–WEST: after the gates you walk round its
//    west end, U-turn, and climb EASTWARD; its top ends at reception
//    (the white desk sits under the stair). Same 13×5 stair as upstairs.
//  · the auditorium is a block in the middle-north. Its lobby door is
//    round a CORNER: walk north up the passage beside reception, the
//    door is on your left. Its west door opens behind the gates.
//  · IFM continues further west (not needed) → shown as a closed roof
//  North = the Seine · South = quai d'Austerlitz · West = the station
// ─────────────────────────────────────────────────────────────
import { grid } from './grid.js';
import { tilePt } from '../entities/actors.js';
import { HUD } from '../ui/hud.js';
import { LOOKS } from '../art/characters.js';
import { Input } from '../systems/input.js';
import { sees } from '../systems/vision.js';

const W = 160, H = 57;
// IFM ground floor is laid out in LOCAL coords (0,0 = NW corner of the drawn part)
const OX = 62, OY = 11;
const P = (lx, ly, extra) => tilePt(lx + OX, ly + OY, extra);        // local → world point
const LANES = [12, 14, 16, 18];                                        // gate rows (local y)
const DOORS = [11, 16];                                                // IFM double doors (local y, east wall)
const STAIR = { x0: 3, x1: 15, y0: 8, y1: 12 };                        // 13 × 5, climbs east
const BUS_STOP = { x: 110, y: 39 };
// smokers: in the covered gap (local) and on the pavement out front
const SMOKE_SPOTS = [[33, 14], [36, 12], [40, 13], [43, 15], [34, 19], [38, 17], [42, 20], [35, 23], [39, 22], [43, 23], [33, 28], [37, 29], [41, 28], [44, 29]];

const g = grid(W, H, ',');
const r = (lx, ly, w, h, ch) => g.rect(lx + OX, ly + OY, w, h, ch);
const s = (lx, ly, ch) => g.set(lx + OX, ly + OY, ch);
const vl = (lx, ly, len, ch) => g.vline(lx + OX, ly + OY, len, ch);
const hl = (lx, ly, len, ch) => g.hline(lx + OX, ly + OY, len, ch);

// ── river, riverbank, west of the Docks (satellite view) ──
g.rect(0, 0, W, 5, '~');
g.rect(0, 5, W, 5, 'k');
g.every(34, 6, W - 34, 9, 'n');
g.rect(0, 10, 22, 28, '"');
[[3, 13], [9, 18], [15, 12], [5, 26], [13, 28], [18, 21], [8, 33]].forEach(([x, y]) => g.set(x, y, 'T'));
for (let x = 2; x < 22; x += 5) g.set(x, 36, 'T');
g.rect(30, 12, 7, 7, '"'); g.rect(41, 11, 8, 5, '"');
[[31, 13], [35, 17], [44, 12], [47, 14]].forEach(([x, y]) => g.set(x, y, 'T'));
for (let x = 32; x < 51; x += 5) g.set(x, 36, 'T');
for (let y = 10; y <= 37; y++) { const cx = 37 + Math.round(((y - 10) * 9) / 27); g.rect(cx, y, 3, 1, 'k'); }
g.rect(46, 2, 3, 3, 'p');
g.rect(22, 0, 8, 42, '%');                                             // Pont Charles-de-Gaulle

// ── IFM: the whole block (west wing + the drawn part) ──
g.rect(51, 10, 42, 28, '#');
g.hline(51, 10, 42, 'G');                                              // river façade
r(-5, 0, 35, 26, 'w');                                                 // oak parquet
// auditorium: wide — from the west wing almost to the east passage
vl(-5, 0, 8, '#'); vl(25, 0, 8, '#'); hl(-5, 7, 31, '#');
s(0, 7, 'D');                                                          // west exit: a few metres west of the stair start
s(25, 5, 'D');                                                         // east door: round the corner from the passage
for (let y = 1; y <= 4; y++) { r(-3, y, 12, 1, 'v'); r(12, y, 12, 1, 'v'); }   // two banks of seats, centre aisle
s(9, 6, 'c'); s(10, 6, 'c'); s(11, 6, 'c');                            // stage / lectern (south)
// the staircase: climbs EAST, top end at reception
r(STAIR.x0, STAIR.y0, 13, 5, 'J'); hl(3, 13, 13, 'A'); vl(16, 11, 2, 'A');
// reception: white desk under the top of the stair, facing the gates
vl(16, 8, 2, 'c'); hl(16, 10, 6, 'c'); vl(22, 8, 3, '#');
// the gate line: reader post, then gate / post, down to the south wall
['j', 't', 'i', 't', 'i', 't', 'i', 't', 'i'].forEach((ch, i) => s(21, 11 + i, ch));
vl(21, 20, 6, '#');
// west wall of the hall (the west wing is behind it)
vl(-6, 0, 20, '#');
// street side: classroom (runs on into the west wing) + WCs, further west
hl(-6, 20, 21, '#'); vl(5, 21, 5, '#'); vl(15, 21, 5, '#');
s(1, 20, 'D'); s(10, 20, 'D');
r(-11, 21, 16, 5, 'w');
for (const x of [-4, -2, 0, 2]) { s(x, 22, 'd'); s(x, 24, 'd'); }
vl(-6, 21, 5, 'd');                                                    // the room carries on west (we can't go there)
r(6, 21, 9, 5, '.'); [8, 11].forEach((x) => vl(x, 23, 3, '#'));        // WC stalls
// the lobby: small; sofas against the east and south walls
vl(30, 0, 26, '#');
DOORS.forEach((y) => { s(30, y, 'E'); s(30, y + 1, 'E'); });
vl(29, 19, 4, 'f'); hl(25, 25, 4, 'f');
vl(29, 1, 3, 'Q');                                                     // programme posters in the passage
// street façade (west wing + IFM): glazing between concrete pillars
g.hline(51, 37, 42, 'H'); for (let x = 51; x <= 92; x += 6) g.set(x, 37, 'C');

// ── the covered gap ──
r(31, -1, 14, 8, 'k');                                                 // stone quay north of the river stairs
r(31, -1, 2, 11, 'k');                                                 // the way down to the river…
r(33, 7, 12, 3, 'J');                                                  // …stairs behind the smokers, down east → west
hl(33, 10, 9, 'G'); for (let x = 33; x <= 41; x += 3) s(x, 10, 'o'); s(31, 10, 'o'); s(32, 10, 'G');
r(31, 11, 14, 14, ',');
r(31, 25, 14, 2, 's');                                                 // steps up from the footpath

// ── master building (east) + the rest of the Docks ──
g.rect(107, 10, W - 107, 28, 'R');
g.rect(107, 11, W - 107, 3, 'P');
for (let i = 0; i < 26; i++) g.rect(118 + i, 17 + Math.floor(i / 4), 2, 1, 'P');
[[125, 26], [126, 26], [140, 30], [141, 30]].forEach(([x, y]) => g.set(x, y, 'Y'));
g.hline(107, 36, W - 107, 'F'); g.hline(107, 37, W - 107, 'H');
for (let x = 107; x < W; x += 6) g.set(x, 37, 'C');
g.vline(107, 21, 15, 'X'); g.set(107, 27, 'E'); g.set(107, 28, 'E');

// ── the street ──
g.rect(0, 42, W, 2, 'B'); g.rect(0, 44, W, 3, '='); g.every(0, 45, W, 3, '-'); g.rect(0, 47, W, 2, '+');
g.rect(31, 42, 3, 7, 'z'); g.rect(99, 42, 3, 7, 'z');                  // junction crossing · crossing in front of the gap
for (let x = 53; x < W; x += 6) if (x < 90 || x > 108) g.set(x, 40, 'T');
for (let x = 55; x < W; x += 12) if (x < 90 || x > 108) g.set(x, 40, 'x');
g.rect(BUS_STOP.x, BUS_STOP.y, 3, 1, 'K');
for (let x = 2; x < W; x += 7) if (x < 21 || x > 31) g.set(x, 50, 'T');
g.rect(0, 52, 21, 5, 'S'); g.rect(9, 51, 3, 1, '_');
g.rect(21, 51, 4, 6, 'O');
g.rect(25, 49, 6, 8, '='); g.rect(25, 49, 6, 3, 'Z');
for (let x = 31; x < 115; x++) { const top = Math.max(52, 56 - Math.floor((x - 31) / 2)); g.rect(x, top, 1, 57 - top, 'O'); }
g.rect(118, 52, W - 118, 5, 'O');

const M = (lx, ly) => ({ x: lx + OX, y: ly + OY });                    // local → tile coords (for labels/zones)

export default {
  name: "Quai d'Austerlitz · IFM ground floor",
  rows: g.rows(),
  props: [
    { key: 'barge', x: 31, y: 0.2 },
    { key: 'houseboat', x: 6, y: 0.8 },
    { key: 'houseboat', x: 128, y: 0.6 },
  ],
  spawn: { x: 10, y: 50, dir: 1 },
  entries: { door: { x: 100, y: 39, dir: 1 }, retry: { x: 84, y: 39, dir: 3 }, lobby: { ...M(26, 14), dir: 2 } },
  retryEntry: 'retry',
  roofs: [
    // the covered gap: reveals as soon as you're on the pavement in front of it
    { ...M(31, 10), w: 14, h: 16, style: 'canopy', reveal: { l: 5, r: 5, t: 2, b: 7 } },
    // IFM: hidden until you're through the doors
    { ...M(-6, -1), w: 37, h: 27, style: 'docks', reveal: { l: 0.2, r: 0.7, t: 0.2, b: 0.1 } },
    // the rest of IFM to the west — exists, but we don't need it
    { x: 51, y: 10, w: 5, h: 27, style: 'docks', fixed: true, label: 'WEST\nWING' },
  ],
  exits: [{ ...M(14, 7.6), w: 2, label: '▲ 1ST FLOOR' }],
  restricted: [
    { ...M(18, 11), w: 7, h: 9 },                                       // at the gates without a badge
    { ...M(28, 10), w: 5, h: 9 },                                       // IFM's doors: security checks them
  ],
  labels: [
    { x: 60, y: 1.6, text: 'LA  SEINE', color: '#9cc3cf', alpha: 0.7 },
    { x: 22.6, y: 6.2, text: 'PONT\nCHARLES-\nDE-GAULLE', color: '#e6e1d5', alpha: 0.85 },
    { x: 2.5, y: 53.6, text: "GARE D'AUSTERLITZ", color: '#f4f1ea', plate: '#1b1a22' },
    { x: 60, y: 53.6, text: 'CAISSE DES DÉPÔTS', color: '#e6e1d5', alpha: 0.75 },
    { x: 21.2, y: 53.2, text: 'LE\nMONDE', color: '#e6e1d5', alpha: 0.75 },
    { x: 29.6, y: 52.2, text: 'AV. P.-MENDÈS-FRANCE', color: '#c9c7c0', alpha: 0.8, angle: 90 },
    { x: 40, y: 44.3, text: "QUAI  D'AUSTERLITZ", color: '#c9c7c0', alpha: 0.7 },
    { x: 60, y: 42.4, text: 'BUS', color: '#f4f1ea', alpha: 0.7 }, { x: 120, y: 42.4, text: 'BUS', color: '#f4f1ea', alpha: 0.7 },
    { x: 64, y: 37.12, text: 'Institut FRANÇAIS de la MODE', color: '#ffffff', font: 'Pixelify Sans', size: 9 },
    { x: 93.3, y: 38.15, text: 'entrée 34  ▲ IFM', color: '#f4f1ea', plate: '#1b1a22' },
    { x: 108.2, y: 38.05, text: 'Cité de la Mode et du Design · 61 · 215', color: '#1b1a22', plate: '#f4f1ea', font: 'Pixelify Sans', size: 7 },
    { x: 118, y: 25.5, text: 'MASTER BUILDING', color: '#f4f1ea', plate: '#1b1a22' },
    // inside IFM (under the roof until you enter)
    { ...M(7.6, 0.15), text: 'AUDITORIUM', color: '#f4f1ea', plate: '#1b1a22' },
    { ...M(26.2, 4.2), text: '< DOOR', color: '#f4f1ea', plate: '#1b1a22', size: 7 },
    { ...M(31.1, 6.3), text: 'STAIRS ▼ RIVER', color: '#1b1a22', plate: '#f4f1ea', size: 7 },
    { ...M(16.9, 8.2), text: 'RECEPTION', color: '#1b1a22', plate: '#f4f1ea', size: 7 },
    { ...M(3.3, 13.25), text: 'STAIRS: go round, climb east  >', color: '#1b1a22', plate: '#ffd75e', size: 7 },
    { ...M(6.3, 21.2), text: 'WC', color: '#1b1a22', plate: '#f4f1ea', size: 7 },
    { ...M(-5.7, 21.2), text: 'CLASSROOM', color: '#1b1a22', plate: '#f4f1ea', size: 7 },
    { ...M(23.2, 21), text: 'IFM · 40 ANS', color: '#f4f1ea', plate: '#d6332e', size: 7 },

  ],

  setup(L) {
    const f = L.flags;
    if (f.texted && !f.badge) f.texted = false;   // caught before the handoff → you can text Inès again
    L.smokers = [];

    // security outside, by IFM's doors in the covered gap — relaxed, students hang out here
    // security outside: faces IFM's doors and checks who walks in. Takes phone breaks.
    L.doorGuard = L.npc({ key: 'guard', look: LOOKS.guard, role: 'guard', name: 'Security', ...P(34, 14), dir: 2,
      vision: { range: 110, fov: 1.7 }, bump: 42, scan: [2, 2, 3, 2, 0, 2], scanEvery: 2400, canChase: false,
      caughtLines: ['Hop hop hop — badge? No badge, no entry.', 'You think I didn’t see you run in? Badge.'] });
    L.every(15000, () => {                                     // the phone break = your window
      const gd = L.doorGuard; if (!gd || gd.dead || gd.alert) return;
      gd.onPhone = true; gd.dir = 3;
      L.time.delayedCall(4500, () => { gd.onPhone = false; gd.dir = 2; });
    }, 9000);
    // reception — behind the desk, watching the gate line (and sometimes the stairs)
    L.guard = L.npc({ key: 'guard', look: LOOKS.guard, role: 'guard', name: 'Reception', ...P(19, 9), dir: 0,
      vision: { range: 150, fov: 1.9 }, bump: 58, strict: true, scan: [0, 0, 3, 0, 2], scanEvery: 2400, canChase: false,
      caughtLines: ['Badge, please. …No badge? Back outside.', 'Nice try. The gates are for badges, not for hopping.', 'Everyone forgets once. You forget every week.'] });
    // the auditorium guard: back aisle, then the stage, watching the rows
    L.npc({ key: 'guard', look: LOOKS.guard, role: 'guard', name: 'Security', mode: 'patrol', speed: 22, strict: true, ...P(-3, 0),
      vision: { range: 112, fov: 1.4 },
      points: [P(-3, 0, { wait: 2200, look: 0 }), P(10, 0, { wait: 1600, look: 0 }), P(23, 0, { wait: 2200, look: 0 }), P(23, 5, { wait: 2600, look: 1 }), P(10, 5, { wait: 2000, look: 1 }), P(-3, 5, { wait: 2600, look: 1 })],
      caughtLines: ['This lecture is for enrolled students. Badge?', 'Sneaking through the auditorium? Classic.'] });
    // Madame — behind the gates, slow, never forgets a face
    L.npc({ key: 'madame', look: LOOKS.madame, role: 'teacher', name: 'Madame', mode: 'patrol', speed: 20, strict: true, memory: true, ...P(12, 14),
      vision: { range: 92, fov: 1.5 },
      points: [P(12, 14, { wait: 2400, look: 3 }), P(4, 16), P(1, 19, { wait: 3800, look: 0 }), P(-2, 13, { wait: 2200, look: 1 }), P(17, 22, { wait: 2000, look: 3 })],
      caughtLines: ['Mm. I never forget a face. And you have no badge. Reception — now.', 'Forty years of IFM and still nobody can keep a badge.'] });
    L.cctv({ ...P(24, 11), from: Math.PI * 0.5, to: Math.PI * 0.95, period: 8000, vision: { range: 100, fov: 0.85 } });

    // people
    SMOKE_SPOTS.slice(0, 8).forEach(([x, y], i) => smoker(L, L.student({ seed: 3 + i, ...P(x, y), dir: i % 4 })));
    [[26, 17], [27, 23], [24, 14]].forEach(([x, y], i) => L.student({ seed: 30 + i, ...P(x, y), dir: i % 4 }));
    for (let i = 0; i < 18; i++) { const x = (i % 2 ? 12 : -3) + ((i * 5) % 12); L.student({ seed: 60 + i, ...P(x, 1 + ((i * 3) % 4)), dir: 0 }); }   // the lecture
    [[10, 15], [15, 17], [-3, 16], [18, 23]].forEach(([x, y], i) => L.student({ seed: 90 + i, ...P(x, y), dir: i % 4 }));

    // the in-and-out: students keep leaving for a cigarette and going back in
    L.every(6500, () => { if (L.smokers.length < 11) comeOut(L); }, 2500);
    L.every(8000, () => { if (L.smokers.length > 4) goBackIn(L); }, 5000);
    L.every(40000, () => busArrives(L), L.mode === 'title' ? 500 : 14000);
    L.every(24000, () => walkers(L, 3), L.mode === 'title' ? 2000 : 9000);

    L.friendTalk = L.interact({
      target: null, r: 22,
      when: (L) => L.friend && L.friend.mode !== 'route' && !f.badge && !L.handoff,
      label: (L) => (L.friend.mode === 'follow' ? 'Take the badge' : 'Talk to Inès'),
      act: (L) => talkFriend(L),
    });

    L.zone({ ...M(14, 8), w: 2, h: 5, once: true, onEnter: (L) => L.goto('first', 'stairs') });
    L.zone({ ...M(31, 11), w: 14, h: 14, once: true, when: () => !f.hintGap, onEnter: () => {
      f.hintGap = true; HUD.toast('The smokers’ corner. Security watches the doors — but students come and go all the time.', 3600);
    } });
    L.zone({ ...M(22, 0), w: 8, h: 26, once: true, onEnter: (L) => {
      f.inside = true;
      if (!f.pastGates) L.objective('Get past the gates — or round the corner into the auditorium');
      if (!f.hintLobby) { f.hintLobby = true; HUD.toast('A gate stays open 7 seconds after a student badges through.', 3600); }
    } });
    L.zone({ ...M(-4, 0), w: 29, h: 7, once: true, onEnter: () => HUD.toast('Auditorium. Sit among the students — the exit is by the stairs.', 3400) });
    const past = (L) => { if (f.pastGates) return; f.pastGates = true; L.objective('Round the west end of the stairs, then climb east'); };
    L.zone({ ...M(-5, 11), w: 26, h: 9, once: true, onEnter: past });
    L.zone({ ...M(-5, 8), w: 8, h: 5, once: true, onEnter: past });
  },

  ways(L) {
    const f = L.flags, touch = document.body.classList.contains('is-touch');
    if (f.pastGates) return { title: 'Next', items: [{ text: 'Go round the stairs’ west end and climb east → 1st floor', active: true }] };
    return { title: 'Ways in', items: [
      { text: 'Security checks the doors: go in with a crowd, or during his phone break', done: !!f.inside },
      { text: f.badge ? 'Inès got you a badge — walk through a gate' : 'Text Inès — she can bring you a badge', key: touch ? 'PHONE' : 'P', done: !!f.badge, active: !!f.texted && !f.badge },
      { text: 'Tailgate: a gate stays open 7 s after a student badges' },
      { text: 'Auditorium: door round the corner, exit by the stairs' },
    ] };
  },

  attract(L) {
    L.attractX = 40 * 16;
    L.cameras.main.centerOn(L.attractX, 30 * 16);
    busArrives(L); walkers(L, 4);
  },
  attractUpdate(L, dt) {
    L.attractX += dt * 14;
    if (L.attractX > 125 * 16) L.attractX = 40 * 16;
    L.cameras.main.centerOn(L.attractX, 30 * 16);
  },
  tick(L, dt) {
    L.updateBus && L.updateBus(dt);
    for (const n of L.smokers) if (n.active && !n.dead && Math.random() < dt * 0.55) puff(L, n);
  },

  // ~10 s, skippable. Lines advance by themselves — nothing waits on a key.
  async intro(L) {
    const p = L.player, c = (pr) => L.cw(pr), sp = 104;
    L.cameras.main.startFollow(p, true, 0.1, 0.1);
    HUD.caption('<b>09:07</b> · Gare d’Austerlitz · class started at <b>9:00</b>', 3200);
    await c(p.walkTo(...xy(12, 49), sp));
    await c(p.walkTo(...xy(32, 49), sp));
    HUD.caption('Room <b>1.11</b>. Edusign closes at <b>9:30</b>.', 2600);
    await c(p.walkTo(...xy(32, 41), sp));
    await c(p.walkTo(...xy(46, 39), sp));
    p.face(0); p.animate(false);
    await c(HUD.say('You', 'Late again. Coffee, phone, badge…  …badge?', { auto: 900 }));
    p.sprite.setTint(0xffd0d0); L.cameras.main.shake(140, 0.003);
    await c(wait(220)); p.sprite.clearTint();
    await c(HUD.say('You', 'It’s at home. No badge, no gates. There has to be another way in.', { auto: 1300 }));
  },
  skipIntro(L) {
    const [x, y] = xy(46, 39);
    L.player.setPosition(x, y); L.player.body.reset(x, y); L.player.face(0); L.player.animate(false);
    L.cameras.main.centerOn(x, y);
  },

  onPlay(L) {
    const f = L.flags;
    if (!f.pastGates) L.objective(f.badge ? 'Walk through the gates like you belong' : 'Get into IFM — entrance in the covered gap');
    if (!f.hintPhone) {
      f.hintPhone = true;
      const touch = document.body.classList.contains('is-touch');
      HUD.toast(touch ? 'Your options are top right. Tap the phone to text Inès.' : 'Your options are top right.  P — phone · Shift — run', 4200);
    }
  },

  phone(L) {
    const f = L.flags;
    if (f.badge) return HUD.toast('Inès: “Don’t lose that one too.”');
    if (f.texted) {
      return HUD.phone({ thread: [['me', 'Inès I forgot my badge. Can you bring me yours… or anyone’s?'], ['them', 'omg AGAIN?? ok coming down. meet me outside'], ['them', 'and NOT in front of security']], choices: [{ label: 'ok ok' }] });
    }
    HUD.phone({
      thread: [['them', 'where r u?? he’s already taking attendance'], ['them', 'edusign closes at 9:30']],
      choices: [
        { label: 'Inès I forgot my badge. Can you bring me yours… or anyone’s?', id: 'ask' },
        { label: '2 min, on my way!', id: 'no' },
      ],
      onPick: (c) => {
        if (c.id !== 'ask') return;
        f.texted = true;
        L.objective('Wait for Inès outside, in the covered gap');
        L.time.delayedCall(3000, () => { HUD.toast('Inès: “omg AGAIN?? coming down. NOT in front of security.”', 3800); spawnFriend(L); });
      },
    });
  },

  update(L, dt) {
    doorCheck(L);
    const h = L.handoff;
    if (!h) return;
    const watched = L.watchers.find((w) => L.watcherSees(w) || friendSeen(L, w));
    if (watched) {
      L.handoff = null; Input.locked = false;
      L.suspicion += 50; L.lastSeenBy = watched;
      HUD.say(watched.name, 'Hé! What are you two passing around?');
      return;
    }
    h.t += dt;
    HUD.prompt(`Passing the badge… ${'▮'.repeat(Math.ceil(h.t / 0.3))}`);
    if (h.t >= 1.5) {
      L.handoff = null; Input.locked = false;
      L.flags.badge = true; L.player.hasBadge = true; HUD.setBadge(true);
      L.sfx('pop');
      HUD.say('Inès', 'It’s Camille’s. Do NOT smile at reception. See you in 1.11.').then(() => L.objective('Walk through the gates like you belong'));
      L.friend.route(pathIn(L.friend), (n) => L.remove(n));
    }
  },
};

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

// Security checks IFM's doors: walking (or sprinting) in without a badge while he
// watches gets you stopped — unless you're inside a crowd of students.
function doorCheck(L) {
  const p = L.player, lx = p.x / 16 - OX, ly = p.y / 16 - OY;
  const inDoorRows = DOORS.some((y) => ly >= y - 0.2 && ly <= y + 2.2);
  const side = lx < 30.5 ? -1 : 1;
  if (inDoorRows && L.lastDoorSide === 1 && side === -1 && !p.hasBadge) {
    const gd = L.doorGuard;
    const seen = gd && !gd.dead && L.watcherSees(gd);
    if (seen && !L.inCrowd()) {
      L.suspicion += p.running ? 80 : 55; L.lastSeenBy = gd;
      HUD.toast('Security: “Hé! Badge?”', 2200);
    } else if (seen) HUD.toast('In with the crowd…', 1800);
    else HUD.toast('In. He didn’t see you.', 1800);
  }
  if (inDoorRows || Math.abs(lx - 30.5) > 2) L.lastDoorSide = side;
}
const xy = (tx, ty) => { const p = tilePt(tx, ty); return [p.x, p.y]; };
const pick = (a) => a[(Math.random() * a.length) | 0];
function friendSeen(L, w) {
  const fr = L.friend;
  if (!fr || w.onPhone) return false;
  return sees(L.world, w, fr.x, fr.y - 8);
}

// Routes through the building (local coords). A gate opens when someone walks through it.
// Down from the stair top → round its west end → east to a gate → lobby → doors → outside.
function pathOut(spot) {
  const lane = pick(LANES), door = pick(DOORS);
  return [P(4, 10), P(2, 10), P(2, 15), P(18, lane), P(20, lane), P(23, lane), P(27, door), P(30, door), P(32, door), P(...spot, { look: (Math.random() * 4) | 0 })];
}
// …and back: doors → gate → round the stair → up it (east) → gone upstairs.
function pathIn(n) {
  const lane = pick(LANES), door = pick(DOORS);
  const pts = [];
  if (n.y > 37 * 16) { const lx = Math.round(n.x / 16) - OX; pts.push(P(lx, 27), P(lx, 23)); }
  return [...pts, P(33, door), P(30, door), P(27, door), P(23, lane), P(20, lane), P(18, lane), P(2, 15), P(2, 10), P(14, 10)];
}
function smoker(L, n) { n.smoking = true; L.smokers.push(n); return n; }
function comeOut(L) {
  const spot = pick(SMOKE_SPOTS);
  const n = L.student({ seed: (Math.random() * 999) | 0, ...P(14, 10), speed: 34 + Math.random() * 8 });
  n.route(pathOut(spot), (m) => smoker(L, m));
}
function goBackIn(L) {
  const n = L.smokers.splice((Math.random() * L.smokers.length) | 0, 1)[0];
  if (!n || n.dead) return;
  n.smoking = false;
  n.route(pathIn(n), (m) => L.remove(m));
}
function puff(L, n) {
  const p = L.add.image(n.x + (n.dir === 2 ? -4 : 4), n.y - 20, 'puff').setDepth(9400).setAlpha(0.9);
  L.tweens.add({ targets: p, y: p.y - 12, x: p.x + 4, alpha: 0, scale: 1.8, duration: 1500, onComplete: () => p.destroy() });
}

function spawnFriend(L) {
  if (L.friend) return;
  const fr = L.friend = L.npc({ key: 'friend', look: LOOKS.friend, role: 'friend', name: 'Inès', ...P(14, 10), speed: 44 });
  fr.route(pathOut([36, 15]), (n) => n.setBubble('dots'));
  L.friendTalk.target = fr;
  L.objective('Meet Inès in the covered gap');
}

async function talkFriend(L) {
  const fr = L.friend;
  if (fr.mode !== 'follow') {
    fr.setBubble(null);
    await HUD.say('Inès', 'Not here — security is right there. Lead the way. Somewhere nobody’s watching.');
    fr.follow(L.player);
    L.objective('Lead Inès somewhere nobody can see you');
    return;
  }
  if (L.handoff) return;
  L.handoff = { t: 0 };
  Input.locked = true;
}

function walkers(L, n) {
  for (let i = 0; i < n; i++) {
    const w = L.student({ seed: (Math.random() * 999) | 0, x: (30 - i * 2) * 16, y: (39 + (i % 2)) * 16 + 4, dir: 3, speed: 36 + Math.random() * 8 });
    w.route([tilePt(97 + i, 39 + (i % 2)), P(36 + i, 23)], (m) => (Math.random() < 0.5 ? smoker(L, m) : m.route(pathIn(m), (k) => L.remove(k))));
  }
}

// Bus 61 / 215 pulls in at "Cité de la Mode et du Design" and unloads a crowd.
function busArrives(L) {
  if (L.bus) return;
  const bus = L.bus = L.add.image(-60, 43 * 16 + 2, 'bus').setDepth(43 * 16 + 20);
  bus.state = 'in';
  L.updateBus = (dt) => {
    const b = L.bus; if (!b) return;
    const stopX = (BUS_STOP.x + 1) * 16;
    if (b.state === 'in') { b.x += Math.max(18, Math.min(120, (stopX - b.x) * 1.2)) * dt; if (b.x >= stopX - 1) { b.state = 'stop'; b.t = 0; } }
    else if (b.state === 'stop') {
      b.t += dt;
      if (!b.unloaded && b.t > 0.6) {
        b.unloaded = true;
        if (L.mode === 'play' && !L.flags.pastGates) HUD.toast('Bus 61 — a crowd of students heads into IFM. Blend in at the gates.', 3200);
        for (let i = 0; i < 8; i++) {
          L.time.delayedCall(i * 260, () => {
            const st = L.student({ seed: (Math.random() * 999) | 0, x: stopX - 10 + (i % 3) * 8, y: 41 * 16 + 6, dir: 2, speed: 34 + Math.random() * 10 });
            st.route([tilePt(104 - (i % 4), 40), P(36 + (i % 5), 23)], (m) => (i % 3 === 0 ? smoker(L, m) : m.route(pathIn(m), (k) => L.remove(k))));
          });
        }
      }
      if (b.t > 3.5) b.state = 'out';
    } else { b.x += 110 * dt; if (b.x > L.world.widthPx + 80) { b.destroy(); L.bus = null; } }
  };
}
