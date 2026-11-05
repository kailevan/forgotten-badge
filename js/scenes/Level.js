// ─────────────────────────────────────────────────────────────
//  Level — the one scene every map runs in.
//  Generic stealth rules live here; each level file (js/levels)
//  only describes its map, its cast and its story beats.
// ─────────────────────────────────────────────────────────────
import { TILE, SUSPICION, CROWD, VISION, CLOCK, PAL, RENDER_SCALE, GATE_OPEN_MS } from '../config.js';
import { T } from '../art/tiles.js';
import { buildMap } from '../systems/map.js';
import { sees, conePoints } from '../systems/vision.js';
import { Input } from '../systems/input.js';
import { HUD } from '../ui/hud.js';
import { Player, NPC, CCTV, tilePt } from '../entities/actors.js';
import { LOOKS, studentLook, buildMisc } from '../art/characters.js';
import { LEVELS } from '../levels/index.js';

export class Level extends Phaser.Scene {
  constructor() { super('Level'); }

  init(data) {
    this.levelKey = data.level || 'quai';
    this.mode = data.title ? 'title' : 'play'; // title | cinema | play | over | plan
    this.planRequested = !!data.plan;
    this.entry = data.entry || null;
  }

  create() {
    buildMisc(this);
    const def = this.def = LEVELS[this.levelKey];
    const reg = this.registry;
    if (reg.get('clock') == null) reg.set('clock', CLOCK.start);
    if (reg.get('caught') == null) reg.set('caught', 0);
    if (!reg.get('flags')) reg.set('flags', {});
    this.flags = reg.get('flags');
    this.flags.badgeAtLevelStart = !!this.flags.badge;

    // start every run clean: nothing left open from the last attempt
    HUD.abort(); HUD.closePhone && HUD.closePhone(); HUD.prompt(null); HUD.letterbox(false); HUD.skip(false);
    Input.locked = false; Input.clearPressed();

    this.world = buildMap(this, def.rows);
    this.physics.world.setBounds(0, 0, this.world.widthPx, this.world.heightPx);

    this.npcs = []; this.watchers = []; this.interacts = []; this.zones = []; this.timers = []; this.graveyard = [];
    // Phaser reuses this scene object on restart: wipe everything a level stored on it last run
    this.friend = this.friendTalk = this.handoff = this.guard = this.bus = this.updateBus = null;
    this.skipCinema = null; this.cineSkipped = false; this.errLogged = false;
    this.restricted = (def.restricted || []).map(tileRect);
    this.suspicion = 0;
    this.lastSeenBy = null;

    (def.labels || []).forEach((l) => this.label(l));

    const sp = (this.entry && def.entries?.[this.entry]) || def.spawn;
    this.player = new Player(this, sp.x * TILE + 8, sp.y * TILE + 12, LOOKS.player);
    this.player.dir = sp.dir ?? 0;
    this.player.hasBadge = !!this.flags.badge;
    this.physics.add.collider(this.player, this.world.layer);

    this.gates = [];
    this.gateGroup = this.physics.add.staticGroup();
    this.world.gates.forEach(({ x, y, vertical }) => this.addGate(x, y, vertical));
    this.physics.add.collider(this.player, this.gateGroup, null, (p, g) => !g.gate.open, this);

    this.cones = this.add.graphics().setDepth(-5);
    this.gateFx = this.add.graphics().setDepth(9000);
    this.canopies = this.world.trees.map(({ x, y }) => this.add.image(x * TILE + 8, y * TILE - 6, 'canopy').setDepth(9500));
    // Roofs: interiors stay hidden until you get close / step inside (Escapists-style).
    // style 'docks' = oak deck + green Plug-Over band, 'canopy' = green glass overhang.
    this.roofs = (def.roofs || []).map((r) => {
      const data = [];
      for (let j = 0; j < r.h; j++) {
        const row = [];
        for (let i = 0; i < r.w; i++) {
          let key = 'roofDeck';
          if (r.style === 'canopy') key = 'plugGlass';
          else if (j < 3) key = 'plugGlass';
          else if (((i * 7 + j * 3) % 23) === 0) key = 'roofPlant';
          else if (Math.abs((i - j * 2.4) % 19) < 1.2 && j > 4) key = 'plugGlass';
          const v = ((i * 5 + j * 11) ^ (i * j)) & 3;
          row.push(v * this.world.columns + T[key]);
        }
        data.push(row);
      }
      const rm = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
      const ts = rm.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
      const layer = rm.createLayer(0, ts, r.x * TILE, r.y * TILE).setDepth(9600);
      const edge = this.add.graphics().setDepth(9601);
      edge.fillStyle(0x000000, 0.3).fillRect(r.x * TILE, (r.y + r.h) * TILE, r.w * TILE, 3);
      edge.lineStyle(1, 0x1b1a22, 0.9).strokeRect(r.x * TILE + 0.5, r.y * TILE + 0.5, r.w * TILE - 1, r.h * TILE - 1);
      const label = r.label ? this.add.text((r.x + r.w / 2) * TILE, (r.y + r.h / 2) * TILE, r.label, { fontFamily: 'Silkscreen', fontSize: '8px', color: '#f4f1ea', backgroundColor: '#1b1a22', padding: { x: 4, y: 2 }, align: 'center', resolution: RENDER_SCALE * 2 }).setOrigin(0.5).setDepth(9602) : null;
      const reveal = { l: 0.4, r: 0.4, t: 0.4, b: 1.6, ...(r.reveal || {}) };
      return { ...r, reveal, parts: [layer, edge, label].filter(Boolean), open: 0 };
    });
    // Exits: a bobbing arrow + sign so stairs and doors read at a glance
    this.exits = (def.exits || []).map((e) => {
      const cx = (e.x + (e.w || 1) / 2) * TILE, cy = e.y * TILE;
      const arrow = this.add.image(cx, cy - 2, e.icon || 'arrow-up').setDepth(9550);
      const sign = this.add.text(cx, cy - 16, e.label, { fontFamily: 'Silkscreen', fontSize: '8px', color: '#1b1a22', backgroundColor: e.color || '#ffd75e', padding: { x: 4, y: 2 }, resolution: RENDER_SCALE * 2 }).setOrigin(0.5, 1).setDepth(9551);
      this.tweens.add({ targets: arrow, y: cy - 6, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      return { arrow, sign };
    });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.world.widthPx, this.world.heightPx);
    cam.setZoom(RENDER_SCALE);
    cam.setRoundPixels(true);
    cam.setBackgroundColor(PAL.void);

    (def.props || []).forEach((p) => this.add.image(p.x * TILE, p.y * TILE, p.key).setOrigin(0, 0).setDepth(p.depth ?? -3));
    def.setup && def.setup(this);

    HUD.setBadge(this.player.hasBadge);
    HUD.setSuspicion(0);
    HUD.setClock(reg.get('clock'));

    if (this.planRequested) { this.enterPlan(); return; }
    if (this.mode === 'title') {
      HUD.show(false);
      (def.attract || (() => cam.startFollow(this.player, true, 0.1, 0.1)))(this);
    } else if (def.intro && !this.flags[`intro_${this.levelKey}`]) {
      this.flags[`intro_${this.levelKey}`] = true;
      this.cinema(() => def.intro(this), def.skipIntro);
    } else {
      this.beginPlay();
    }
    cam.fadeIn(400, 20, 19, 26);
    if (new URLSearchParams(location.search).has('overview')) {   // dev: see the whole map
      HUD.show(false); HUD.screen('screen-title', false);
      this.mode = 'title'; cam.stopFollow(); cam.removeBounds();
      cam.setZoom(RENDER_SCALE * Math.min(480 / this.world.widthPx, 270 / this.world.heightPx));
      cam.centerOn(this.world.widthPx / 2, this.world.heightPx / 2);
      this.def.attractUpdate = null;
    }
  }

  // ── plan viewer (plans.html): the whole floor as the game draws it ──
  enterPlan() {
    this.mode = 'plan'; this.planView = true;
    HUD.show(false); HUD.letterbox(false); HUD.screen('screen-title', false); HUD.setWays(null);
    const cam = this.cameras.main;
    cam.stopFollow(); cam.removeBounds(); cam.fadeIn(1);
    this.planFit();
    // names over everyone who watches, and their patrol routes
    const ROLE = { guard: 0x4ea3ff, teacher: 0xffc93c, camera: 0xff5c8a, staff: 0x9be36a };
    const pg = this.add.graphics().setDepth(9700);
    this.planLayer = [pg];
    for (const n of this.npcs) {
      if (n.mode !== 'patrol' || !n.points?.length) continue;
      const col = ROLE[n.role] || 0xffffff;
      pg.lineStyle(1, col, 0.9);
      const pts = [n.home, ...n.points];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; pg.lineBetween(a.x, a.y - 4, b.x, b.y - 4); }
      n.points.forEach((p) => { pg.fillStyle(col, 1); pg.fillCircle(p.x, p.y - 4, p.wait ? 2.5 : 1.5); });
    }
    for (const w of this.watchers) {
      const t = this.add.text(w.x, w.y - 34, w.name, { fontFamily: 'Silkscreen', fontSize: '8px', color: '#1b1a22', backgroundColor: '#f4f1ea', padding: { x: 3, y: 1 }, resolution: RENDER_SCALE * 2 }).setOrigin(0.5, 1).setDepth(9800);
      this.planLayer.push(t);
    }
    const you = this.add.text(this.player.x, this.player.y - 30, 'YOU START', { fontFamily: 'Silkscreen', fontSize: '8px', color: '#1b1a22', backgroundColor: '#ffd75e', padding: { x: 3, y: 1 }, resolution: RENDER_SCALE * 2 }).setOrigin(0.5, 1).setDepth(9800);
    this.planLayer.push(you);
    this.planRoofs(false);
    // drag to pan, wheel / pinch to zoom
    this.input.on('pointermove', (p) => {
      if (!p.isDown) return;
      cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom; cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
    });
    this.input.on('wheel', (p, objs, dx, dy) => this.planZoom(dy < 0 ? 1.15 : 1 / 1.15, p));
    window.__plan = this;
  }
  planFit() {
    const cam = this.cameras.main;
    cam.setZoom(Math.min(cam.width / this.world.widthPx, cam.height / this.world.heightPx));
    cam.centerOn(this.world.widthPx / 2, this.world.heightPx / 2);
  }
  planZoom(k, p) {
    const cam = this.cameras.main;
    const before = p ? cam.getWorldPoint(p.x, p.y) : null;
    cam.setZoom(Phaser.Math.Clamp(cam.zoom * k, 0.25, 6));
    if (before) { const after = cam.getWorldPoint(p.x, p.y); cam.scrollX += before.x - after.x; cam.scrollY += before.y - after.y; }
  }
  planRoofs(show) { this.roofs.forEach((r) => r.parts.forEach((o) => o.setAlpha(show || r.fixed ? 1 : 0))); }
  planCones(show) { this.cones.setVisible(show); this.planLayer.forEach((o) => o.setVisible(show)); }

  beginPlay() {
    this.mode = 'play';
    HUD.show(true);
    HUD.setWays(this.def.ways ? this.def.ways(this) : null);
    this.cameras.main.startFollow(this.player, true, 0.22, 0.22);
    this.def.onPlay && this.def.onPlay(this);
  }

  // Cutscenes are skippable (Esc / Skip button). Level intros wrap every
  // await in L.cw(...) so a skip stops them dead instead of leaking lines.
  async cinema(fn, onSkip) {
    this.mode = 'cinema';
    this.cineSkipped = false;
    HUD.show(false); HUD.letterbox(true); HUD.skip(true); Input.locked = true;
    const skip = new Promise((res) => { this.skipCinema = res; });
    try { await Promise.race([fn(), skip]); } catch (e) { /* skipped */ }
    if (this.cineSkipped) { HUD.abort(); this.player.auto = null; onSkip && onSkip(this); }
    this.skipCinema = null;
    HUD.skip(false); HUD.letterbox(false); Input.locked = false; Input.clearPressed();
    this.beginPlay();
  }
  cw(promise) { return Promise.resolve(promise).then((v) => { if (this.cineSkipped) throw new Error('skip'); return v; }); }

  // ── builders used by level files ───────────────────────────
  npc(opts) {
    const n = new NPC(this, opts);
    this.npcs.push(n);
    if (n.vision) this.watchers.push(n);
    return n;
  }
  cctv(opts) {
    const c = new CCTV(this, opts);
    this.npcs.push(c); this.watchers.push(c);
    return c;
  }
  student(opts) {
    const seed = opts.seed ?? ((Math.random() * 1e6) | 0);
    return this.npc({ key: `stu-${seed % 160}`, look: studentLook(seed % 160), role: 'student', speed: 34 + (seed % 9), ...opts });
  }
  // Removal is deferred to the end of the frame: an NPC often removes
  // itself from inside its own step() (route finished) — destroying it
  // mid-step is what froze the game.
  remove(n) {
    if (n.dead) return;
    n.dead = true;
    this.npcs = this.npcs.filter((x) => x !== n);
    this.watchers = this.watchers.filter((x) => x !== n);
    n.setVisible(false);
    this.graveyard.push(n);
  }
  interact(o) { this.interacts.push(o); return o; }
  zone(o) { const z = { ...tileRect(o), ...o }; this.zones.push(z); return z; }
  every(ms, fn, first = ms) { this.timers.push({ ms, fn, next: this.time.now + first }); }
  objective(t) { HUD.setObjective(t); }
  // Text in the world renders at 4× so it stays sharp. plate = a sign background.
  label({ x, y, text, size = 8, color = '#f4f1ea', depth = -4, align = 'left', font = 'Silkscreen', alpha = 1, angle = 0, plate = null, center = false }) {
    const style = { fontFamily: font, fontSize: size + 'px', color, align, resolution: RENDER_SCALE * 2 };
    if (plate) { style.backgroundColor = plate; style.padding = { x: 3, y: 1 }; }
    const t = this.add.text(x * TILE, y * TILE, text, style).setDepth(depth).setAlpha(alpha).setAngle(angle);
    if (center) t.setOrigin(0.5, 0.5);
    return t;
  }
  addGate(tx, ty, vertical = false) {
    const x = tx * TILE + 8, y = ty * TILE + 8;
    const img = this.gateGroup.create(x, y, 'gate-closed');
    if (vertical) { img.setAngle(90); img.body.setSize(6, 16).setOffset(5, 0); }
    else img.body.setSize(16, 6).setOffset(0, 6);
    const gate = { x, y, img, vertical, open: false, until: 0, badge: false };
    img.gate = gate; img.setDepth(y);
    this.gates.push(gate);
    return gate;
  }
  openGate(gate, ms = GATE_OPEN_MS, badge = false) {
    gate.until = Math.max(gate.until, this.time.now + ms);
    gate.badge = badge || gate.badge;
    if (!gate.open) { gate.open = true; gate.img.setTexture('gate-open'); }
  }
  goto(level, entry) {
    if (this.mode === 'over') return;
    this.mode = 'over';
    this.cameras.main.fadeOut(350, 20, 19, 26);
    this.time.delayedCall(380, () => this.scene.restart({ level, entry }));
  }

  // ── main loop ──────────────────────────────────────────────
  update(time, delta) {
    try {
      this.frame(time, delta);
    } catch (err) {
      // never let one bad frame freeze the whole game — log it and keep running
      if (!this.errLogged) { console.error('[FORGOTTEN BADGE] frame error', err); this.errLogged = true; }
    }
    Input.clearPressed(); // presses are per-frame: nothing queues up for later
    if (this.graveyard.length) { this.graveyard.forEach((n) => n.destroy()); this.graveyard.length = 0; }
  }

  frame(time, delta) {
    if (this.mode === 'plan') { this.drawCones(); return; }
    const dt = Math.min(delta, 50) / 1000;
    Input.update();
    if (HUD.dialogueOpen) { if (Input.consume('act')) HUD.advance(); }
    if (this.mode === 'cinema' && this.skipCinema && Input.consume('back')) { this.cineSkipped = true; this.skipCinema(); }

    const frozen = HUD.dialogueOpen || HUD.phoneOpen || this.mode === 'over';
    if (this.mode === 'title') { this.npcs.forEach((n) => n.step(dt, time, this.world)); this.def.tick && this.def.tick(this, dt); this.def.attractUpdate && this.def.attractUpdate(this, dt); return; }

    this.player.drive(frozen && !this.player.auto ? { x: 0, y: 0, run: false } : Input.state);
    if (frozen && this.mode !== 'cinema') { if (!this.player.auto) this.player.body.setVelocity(0, 0); this.drawCones(); return; }

    // clock
    if (this.mode === 'play') {
      const c = this.registry.get('clock') + dt * CLOCK.scale;
      this.registry.set('clock', c); HUD.setClock(c);
    }

    this.timers.forEach((t) => { if (time >= t.next) { t.next = time + t.ms; t.fn(this); } });
    this.npcs.slice().forEach((n) => n.step(dt, time, this.world));
    this.def.tick && this.def.tick(this, dt);   // ambient things that run in cutscenes too (traffic…)
    this.updateGates(time);
    this.drawGateTimers();

    if (this.mode === 'play') {
      this.updateHide();
      this.updateSuspicion(dt, time);
      this.updateInteract();
      this.updateZones();
      if (Input.consume('phone')) this.def.phone ? this.def.phone(this) : HUD.toast('No signal in here.');
      if (this.def.ways) HUD.setWays(this.def.ways(this));
      this.def.update && this.def.update(this, dt);
    }
    this.drawCones();
    // roofs lift off while you're inside (or standing in the doorway)
    for (const r of this.roofs) {
      if (r.fixed || this.planView) continue;           // fixed = never opens (e.g. the west wing)
      const p = this.player, v = r.reveal;
      const inside = p.x > (r.x - v.l) * TILE && p.x < (r.x + r.w + v.r) * TILE && p.y > (r.y - v.t) * TILE && p.y < (r.y + r.h + v.b) * TILE;
      r.open = Phaser.Math.Linear(r.open, inside ? 1 : 0, 0.14);
      r.parts.forEach((o) => o.setAlpha(1 - r.open));
    }
    // canopies go see-through when you walk under them
    for (const c of this.canopies) {
      const under = Math.abs(c.x - this.player.x) < 22 && this.player.y > c.y - 22 && this.player.y < c.y + 22;
      c.setAlpha(Phaser.Math.Linear(c.alpha, under ? 0.45 : 1, 0.15));
    }
  }

  updateGates(time) {
    const p = this.player;
    for (const g of this.gates) {
      // along = distance along the walking direction, across = distance across the lane
      const rel = (o) => (g.vertical ? { along: o.x - g.x, across: o.y - g.y } : { along: o.y - g.y, across: o.x - g.x });
      for (const n of this.npcs) {
        if (n.role === 'guard' || n.role === 'teacher' || n.role === 'camera') continue;
        const r = rel(n);
        if (Math.abs(r.across) < 7 && Math.abs(r.along) < 12) this.openGate(g);
      }
      const rp = rel(p);
      if (p.hasBadge && Math.abs(rp.across) < 10 && Math.abs(rp.along) < 20) {
        if (!g.open) {
          this.sfx('beep');
          // it's still someone else's badge: whoever's watching takes a look at the photo
          const looking = this.watchers.find((w) => w.role === 'guard' && this.watcherSees(w));
          if (looking && !this.inCrowd()) { this.suspicion += SUSPICION.badgePhotoSpike; this.lastSeenBy = looking; HUD.toast(`${looking.name} glances at the photo… “Camille?”`, 2400); }
        }
        this.openGate(g, GATE_OPEN_MS, true);
      }
      if (g.open && time > g.until) { g.open = false; g.badge = false; g.img.setTexture('gate-closed'); }
      g.secondsLeft = g.open ? Math.max(0, (g.until - time) / 1000) : 0;

      // tailgating: crossing an open gate without a badge
      const side = rp.along > 0 ? 1 : -1;
      if (Math.abs(rp.across) < 8) {
        if (g.lastSide && side !== g.lastSide && !p.hasBadge) this.onTailgate(g);
        g.lastSide = side;
      } else g.lastSide = null;
    }
  }

  // a shrinking bar on every open gate: how long until it closes again
  drawGateTimers() {
    const g = this.gateFx; g.clear();
    for (const gate of this.gates) {
      if (!gate.open) continue;
      const k = Math.min(1, gate.secondsLeft / (GATE_OPEN_MS / 1000));
      const col = k > 0.45 ? 0x7fbf3f : k > 0.2 ? 0xf2b134 : 0xff3b30;
      const x = gate.x + (gate.vertical ? 9 : -7), y = gate.y + (gate.vertical ? -7 : 9);
      const len = 14;
      g.fillStyle(0x1b1a22, 0.85);
      if (gate.vertical) { g.fillRect(x - 1, y - 1, 4, len + 2); g.fillStyle(col, 1); g.fillRect(x, y + len * (1 - k), 2, len * k); }
      else { g.fillRect(x - 1, y - 1, len + 2, 4); g.fillStyle(col, 1); g.fillRect(x, y, len * k, 2); }
    }
  }

  onTailgate() {
    const watching = this.watchers.filter((w) => this.watcherSees(w));
    if (!watching.length) { HUD.toast('Through. Nobody saw.'); return; }
    const spike = this.inCrowd() ? SUSPICION.tailgateCrowdSpike : SUSPICION.tailgateSpike;
    this.suspicion += spike;
    this.lastSeenBy = watching[0];
    HUD.toast(this.inCrowd() ? 'Lost in the crowd…' : 'Hey! — the guard saw that.');
  }

  updateHide() {
    const p = this.player;
    p.hidden = !p.moving && this.world.isHide(p.x, p.y - 2);
    p.sprite.setAlpha(p.hidden ? 0.5 : 1);
    HUD.setHidden(p.hidden);
  }

  inCrowd() {
    const p = this.player;
    let n = 0;
    for (const s of this.npcs) if ((s.role === 'student' || s.role === 'friend') && Math.hypot(s.x - p.x, s.y - p.y) < CROWD.radius) n++;
    return n >= CROWD.min;
  }

  watcherSees(w) {
    const p = this.player;
    if (p.hidden) return false;
    if (w.onPhone) return Math.hypot(w.x - p.x, w.y - p.y) < VISION.bumpRadius;
    return sees(this.world, w, p.x, p.y - 8);
  }

  inRestricted() {
    const p = this.player;
    return this.restricted.some((r) => p.x >= r.px && p.x < r.px + r.pw && p.y >= r.py && p.y < r.py + r.ph);
  }

  updateSuspicion(dt, time) {
    const p = this.player;
    const crowd = this.inCrowd();
    const restricted = this.inRestricted() && !p.hasBadge;
    let best = 0, others = 0, bestW = null, camCaught = null;
    for (const w of this.watchers) {
      const s = this.watcherSees(w);
      w.seesPlayer = s;
      if (s) {
        w.lastSaw = time;
        w.everSaw = true;
        let r = SUSPICION.baseRate * w.watchMult * (w.memory && w.memorized ? 1.7 : 1) * (this.def.alertness || 1);
        if (p.running) r *= SUSPICION.runMult;
        if (restricted) r *= SUSPICION.restrictedMult;
        if (crowd) r *= SUSPICION.crowdMult;
        // a borrowed badge only fools guards from a distance — teachers and cameras aren't fooled
        if (p.hasBadge && w.role === 'guard') r *= SUSPICION.badgeMult;
        if (!restricted && !p.running && !w.strict) r *= 0.35; // just standing on a public street is barely suspicious
        // CCTV: if a camera gets a clear look at you (no crowd to hide in), you're caught almost instantly
        if (w.role === 'camera' && !crowd) {
          w.camT = (w.camT || 0) + dt;
          if (w.camT >= SUSPICION.cameraCatch) camCaught = w;
        }
        if (r > best) { others += best; best = r; bestW = w; } else others += r;
      } else if (w.role === 'camera') w.camT = 0;
    }
    if (camCaught) { this.suspicion = SUSPICION.caughtAt; this.lastSeenBy = camCaught; bestW = camCaught; }
    else if (bestW) { this.suspicion += (best + others * 0.3) * dt; this.lastSeenBy = bestW; }
    else this.suspicion -= (this.def.decay ?? SUSPICION.decay) * dt;
    this.suspicion = Math.max(0, this.suspicion);
    HUD.setSuspicion(this.suspicion);
    HUD.setSeen(!!bestW);

    for (const w of this.watchers) {
      if (w.seesPlayer && this.suspicion >= SUSPICION.questionAt) {
        w.alert = this.suspicion >= SUSPICION.alertAt ? 2 : 1;
        w.faceToward(p.x, p.y);
        if (w.memory) w.memorized = true;
        // security tails you as soon as they're suspicious ("?"); teachers only come at you on "!"
        const tail = w.role === 'guard' && w.alert >= 1;
        if ((w.alert === 2 || tail) && w.canChase !== false && !w.chasing) this.startChase(w);
      } else if (!w.seesPlayer && time - (w.lastSaw || 0) > 2500) {
        w.alert = 0;
        if (w.chasing) this.endChase(w);
      }
      if (w.chasing) {
        w.chaseTarget = { x: p.x, y: p.y };
        const last = w.trail[w.trail.length - 1];
        if (!last || Math.hypot(last.x - w.x, last.y - w.y) > 6) w.trail.push({ x: w.x, y: w.y });
      }
      w.setBubble(w.onPhone && !w.alert ? 'phone' : w.alert === 2 ? 'x' : w.alert === 1 ? 'q' : null);
    }

    if (this.suspicion >= SUSPICION.caughtAt) this.caught(this.lastSeenBy);
  }

  startChase(w) {
    w.chasing = true; w.trail = [{ x: w.x, y: w.y }];
    w.tailDist = w.role === 'guard' ? 38 : 0;            // security keeps you in sight from a few metres back
    w.savedMode = { mode: w.mode, points: w.points, idx: w.idx };
    this.sfx('alert');
  }
  endChase(w) {
    w.chasing = false;
    const back = w.trail.slice().reverse();
    const saved = w.savedMode;
    w.route(back, () => { if (saved) { w.mode = saved.mode; w.points = saved.points; w.idx = saved.idx; } });
  }

  async caught(w) {
    if (this.mode === 'over') return;
    this.mode = 'over';
    this.player.body.setVelocity(0, 0);
    this.sfx('caught');
    this.registry.set('caught', this.registry.get('caught') + 1);
    this.cameras.main.shake(180, 0.004);
    const line = w?.caughtLines ? Phaser.Utils.Array.GetRandom(w.caughtLines) : 'Badge, please.';
    await HUD.caught({ who: w?.name || 'Security', line });
    // no checkpoints: caught anywhere = back on the pavement in front of the school, progress lost
    this.registry.set('clock', this.registry.get('clock') + 90);
    Object.assign(this.flags, { badge: false, texted: false, pastGates: false, inside: false });
    this.cameras.main.fadeOut(300, 20, 19, 26);
    this.time.delayedCall(320, () => this.scene.restart({ level: 'quai', entry: 'retry' }));
  }

  updateInteract() {
    const p = this.player;
    let best = null, bd = 1e9;
    for (const o of this.interacts) {
      if (o.when && !o.when(this)) continue;
      const ox = o.target ? o.target.x : o.x * TILE + 8, oy = o.target ? o.target.y : o.y * TILE + 8;
      const d = Math.hypot(ox - p.x, oy - p.y);
      if (d < (o.r || 20) && d < bd) { bd = d; best = o; }
    }
    const isTouch = document.body.classList.contains('is-touch');
    HUD.prompt(best ? `${isTouch ? 'A' : 'E'} — ${typeof best.label === 'function' ? best.label(this) : best.label}` : null);
    if (best && Input.consume('act')) best.act(this);
    else if (!best) Input.consume('act');
  }

  updateZones() {
    const p = this.player;
    for (const z of this.zones) {
      const inZ = p.x >= z.px && p.x < z.px + z.pw && p.y >= z.py && p.y < z.py + z.ph;
      if (inZ && !z.inside && (!z.when || z.when(this))) { z.inside = true; if (!z.fired || !z.once) { z.fired = true; z.onEnter(this); } }
      if (!inZ) z.inside = false;
    }
  }

  // Colour = who's looking (security blue · teachers yellow · cameras pink · staff green).
  // Turns orange on "?" and red on "!". Outlined so the edge of sight is readable.
  drawCones() {
    const g = this.cones; g.clear();
    const ROLE = { guard: 0x4ea3ff, teacher: 0xffc93c, camera: 0xff5c8a, staff: 0x9be36a };
    for (const w of this.watchers) {
      if (!w.vision || !w.active) continue;
      if (w.onPhone && !w.alert) continue;
      const col = w.alert === 2 ? 0xff3b30 : w.alert === 1 ? 0xff9f1a : (ROLE[w.role] || 0xfff6e0);
      const pts = toPts(conePoints(this.world, w));
      g.fillStyle(col, w.alert ? 0.34 : 0.24);
      g.fillPoints(pts, true);
      g.lineStyle(1, col, w.alert ? 1 : 0.8);
      g.strokePoints(pts, true);
      if (w.bump) { g.lineStyle(1, col, 0.35); g.strokeCircle(w.x, w.y - 10, w.bump); }
    }
  }

  // Tiny synthesized SFX — swapped for real sounds in the audio pass.
  sfx(kind) {
    try {
      const ctx = this.sound.context; if (!ctx) return;
      const o = ctx.createOscillator(), gn = ctx.createGain();
      const t = ctx.currentTime;
      const spec = { beep: [1320, 0.06, 'square'], alert: [520, 0.18, 'square'], caught: [180, 0.4, 'sawtooth'], pop: [880, 0.05, 'triangle'] }[kind] || [600, 0.1, 'square'];
      o.type = spec[2]; o.frequency.setValueAtTime(spec[0], t);
      if (kind === 'alert') o.frequency.linearRampToValueAtTime(880, t + 0.15);
      if (kind === 'caught') o.frequency.exponentialRampToValueAtTime(60, t + 0.4);
      gn.gain.setValueAtTime(0.06, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + spec[1]);
      o.connect(gn).connect(ctx.destination); o.start(t); o.stop(t + spec[1] + 0.02);
    } catch (e) { /* audio is optional */ }
  }
}

function tileRect(r) { return { px: r.x * TILE, py: r.y * TILE, pw: r.w * TILE, ph: r.h * TILE }; }
function toPts(a) { const o = []; for (let i = 0; i < a.length; i += 2) o.push({ x: a[i], y: a[i + 1] }); return o; }

export { tilePt };
