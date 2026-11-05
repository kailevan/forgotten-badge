// ─────────────────────────────────────────────────────────────
//  Actors: the player (arcade physics) and NPCs (kinematic,
//  scripted paths). NPCs never collide — their routes are designed.
// ─────────────────────────────────────────────────────────────
import { PLAYER, TILE } from '../config.js';
import { buildCharacter } from '../art/characters.js';

const DIRS = ['down', 'up', 'left', 'right'];
const dirFromVec = (x, y) => (Math.abs(x) > Math.abs(y) ? (x < 0 ? 2 : 3) : (y < 0 ? 1 : 0));
const angleOfDir = [Math.PI / 2, -Math.PI / 2, Math.PI, 0];

class Actor extends Phaser.GameObjects.Container {
  constructor(scene, x, y, key, look) {
    super(scene, x, y);
    buildCharacter(scene, key, look);
    this.key = key;
    this.shadow = scene.add.image(0, 0, 'shadow');
    this.sprite = scene.add.sprite(0, -10, key, 0);
    this.add([this.shadow, this.sprite]);
    this.dir = 0;
    this.moving = false;
    scene.add.existing(this);
  }
  face(dir) { this.dir = dir; }
  faceToward(x, y) { this.dir = dirFromVec(x - this.x, y - this.y); }
  animate(moving) {
    if (!this.active || !this.sprite.anims) return; // already removed from the level
    const k = `${this.key}-walk-${DIRS[this.dir]}`;
    if (moving) { if (this.sprite.anims.currentAnim?.key !== k || !this.sprite.anims.isPlaying) this.sprite.play(k); }
    else { this.sprite.anims.stop(); this.sprite.setFrame(this.dir * 3); }
    this.setDepth(this.y);
  }
}

export class Player extends Actor {
  constructor(scene, x, y, look) {
    super(scene, x, y, 'player', look);
    this.ring = scene.add.image(0, 0, 'ring').setAlpha(0.75);
    this.addAt(this.ring, 0);
    scene.physics.add.existing(this);
    this.body.setSize(PLAYER.bodyW, PLAYER.bodyH).setOffset(-PLAYER.bodyW / 2, -PLAYER.bodyH / 2);
    this.body.setCollideWorldBounds(true);
    this.hasBadge = false;
    this.hidden = false;
    this.running = false;
    this.auto = null; // cutscene walk target
  }
  drive(input) {
    let vx = input.x, vy = input.y;
    if (this.auto) {
      const dx = this.auto.x - this.x, dy = this.auto.y - this.y, d = Math.hypot(dx, dy);
      // safety: a scripted walk that's blocked (furniture…) gives up after a few seconds instead of hanging
      const stuck = performance.now() - this.auto.t0 > (this.auto.limit || 6000);
      if (d < 2 || stuck) { const done = this.auto.done; this.auto = null; vx = vy = 0; done && done(); }
      else { vx = dx / d; vy = dy / d; }
    }
    const moving = Math.hypot(vx, vy) > 0.05;
    this.running = moving && input.run && !this.auto;
    const sp = this.auto ? (this.auto.speed || PLAYER.walk) : this.running ? PLAYER.run : PLAYER.walk;
    this.body.setVelocity(vx * sp, vy * sp);
    if (moving) this.dir = dirFromVec(vx, vy);
    this.sprite.anims.timeScale = this.running ? 1.6 : 1;
    this.moving = moving;
    this.animate(moving);
  }
  walkTo(x, y, speed) { return new Promise((done) => { this.auto = { x, y, speed, done, t0: performance.now() }; }); }
}

// NPC behaviours:
//   patrol: loop over waypoints [{x,y,wait,look,phone}]
//   route:  walk a one-way list of points, then onArrive()
//   follow: trail behind a target
//   idle:   stand, optionally scanning between look directions
export class NPC extends Actor {
  constructor(scene, opts) {
    super(scene, opts.x, opts.y, opts.key, opts.look);
    this.role = opts.role || 'student';         // guard | teacher | student | friend | staff
    this.name = opts.name || '';
    this.speed = opts.speed || 40;
    this.vision = opts.vision || null;          // {range, fov} → this NPC is a watcher
    this.watchMult = opts.watchMult || 1;
    this.bump = opts.bump;
    this.strict = !!opts.strict;
    this.memory = !!opts.memory;
    this.canChase = opts.canChase;
    this.caughtLines = opts.caughtLines;
    this.facing = angleOfDir[opts.dir ?? 0];
    this.dir = opts.dir ?? 0;
    this.mode = opts.mode || 'idle';
    this.points = opts.points || [];
    this.idx = 0;
    this.waitUntil = 0;
    this.scan = opts.scan || null;              // [dir, dir, …] for idle watchers
    this.scanEvery = opts.scanEvery || 2600;
    this.onArrive = opts.onArrive || null;
    this.target = null;
    this.onPhone = false;
    this.alert = 0;                             // 0 calm, 1 "?", 2 "!"
    this.chasing = false;
    this.bubble = scene.add.image(0, -30, 'bubble-q').setVisible(false);
    this.add(this.bubble);
    if (this.vision) { this.icon = scene.add.image(0, -29, 'ic-' + this.role); this.add(this.icon); }
    this.home = { x: opts.x, y: opts.y };
    this.animate(false);
  }

  setBubble(kind) {
    if (this.icon) this.icon.setVisible(!kind);
    if (!kind) { this.bubble.setVisible(false); return; }
    this.bubble.setTexture('bubble-' + kind).setVisible(true);
  }

  // Smoothly turn the vision cone toward the body direction.
  turnTo(angle, dt, rate = 7) {
    const d = Math.atan2(Math.sin(angle - this.facing), Math.cos(angle - this.facing));
    this.facing += Math.max(-rate * dt, Math.min(rate * dt, d));
  }

  step(dt, now, world) {
    if (this.dead) return;
    let tx = null, ty = null, sp = this.speed;
    if (this.chasing && this.chaseTarget) {
      tx = this.chaseTarget.x; ty = this.chaseTarget.y; sp = this.speed * 1.35;
    } else if (this.mode === 'patrol' || this.mode === 'route') {
      if (now >= this.waitUntil && this.points.length) {
        const p = this.points[this.idx];
        const d = Math.hypot(p.x - this.x, p.y - this.y);
        if (d < 1.5) {
          if (p.wait) this.waitUntil = now + p.wait;
          if (p.look !== undefined) this.dir = p.look;
          this.onPhone = !!p.phone;
          this.idx++;
          if (this.idx >= this.points.length) {
            if (this.mode === 'patrol') this.idx = 0;
            else { this.mode = 'idle'; this.points = []; const cb = this.onArrive; this.onArrive = null; cb && cb(this); if (this.dead) return; }
          }
        } else { tx = p.x; ty = p.y; this.onPhone = false; }
      }
    } else if (this.mode === 'follow' && this.target) {
      const d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
      if (d > 18) { tx = this.target.x; ty = this.target.y; sp = Math.max(this.speed, d > 40 ? 90 : 60); }
      else this.faceToward(this.target.x, this.target.y);
    } else if (this.mode === 'idle' && this.scan && now >= this.waitUntil) {
      this.scanIdx = ((this.scanIdx ?? -1) + 1) % this.scan.length;
      this.dir = this.scan[this.scanIdx];
      this.waitUntil = now + this.scanEvery;
    }

    let moving = false;
    if (tx !== null) {
      const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
      if (d > 0.5) {
        const s = Math.min(d, sp * dt);
        const nx = this.x + (dx / d) * s, ny = this.y + (dy / d) * s;
        // chasers respect walls; scripted walkers trust their route
        if (!this.chasing || !world.isSolid(nx, ny)) { this.x = nx; this.y = ny; moving = true; }
        this.dir = dirFromVec(dx, dy);
      }
    }
    this.moving = moving;
    if (this.vision) this.turnTo(angleOfDir[this.dir], dt);
    this.animate(moving);
    this.bubble.setDepth(10000);
  }

  route(points, onArrive) { this.mode = 'route'; this.points = points; this.idx = 0; this.onArrive = onArrive || null; }
  follow(target) { this.mode = 'follow'; this.target = target; }
}

export const tilePt = (tx, ty, extra = {}) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 + 4, ...extra });
export { dirFromVec, angleOfDir };

// Ceiling dome camera (seen in the IFM hall photos). Sweeps between two
// angles, never moves, never chases — but it reports you.
export class CCTV extends Phaser.GameObjects.Container {
  constructor(scene, opts) {
    super(scene, opts.x, opts.y);
    this.role = 'camera';
    this.name = opts.name || 'CCTV';
    this.vision = opts.vision || { range: 110, fov: 0.9 };
    this.watchMult = opts.watchMult || 0.9;
    this.strict = true;
    this.canChase = false;
    this.a0 = opts.from; this.a1 = opts.to;
    this.period = opts.period || 7000;
    this.facing = this.a0;
    this.alert = 0;
    this.caughtLines = opts.caughtLines || ['(radio) “Camera 3 — student without a badge. Picking them up.”'];
    this.img = scene.add.image(0, -10, 'cctv');
    this.led = scene.add.image(3, -12, 'led').setVisible(false);
    this.add([this.img, this.led]);
    this.setDepth(9000);
    scene.add.existing(this);
  }
  step(dt, now) {
    if (this.alert) { this.led.setVisible(Math.floor(now / 180) % 2 === 0); return; }
    this.led.setVisible(Math.floor(now / 900) % 2 === 0);
    const t = (Math.sin((now / this.period) * Math.PI * 2) + 1) / 2;
    this.facing = this.a0 + (this.a1 - this.a0) * t;
  }
  faceToward(x, y) { this.facing = Math.atan2(y - (this.y - 10), x - this.x); }
  setBubble() {}
}
