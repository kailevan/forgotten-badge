// ─────────────────────────────────────────────────────────────
//  FORGOTTEN BADGE — entry point
// ─────────────────────────────────────────────────────────────
import { VIEW_W, VIEW_H, PAL, RENDER_SCALE } from './config.js';
import { Level } from './scenes/Level.js';
import { Input } from './systems/input.js';
import { HUD, waitForAct } from './ui/hud.js';
import { LEVELS } from './levels/index.js';
import { LOOKS } from './art/characters.js';
import { buildCharacter } from './ui/builder.js';

Input.init();

await Promise.race([
  Promise.all(['8px Silkscreen', '16px "Pixelify Sans"'].map((f) => document.fonts.load(f))),
  new Promise((r) => setTimeout(r, 2500)),
]);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_W * RENDER_SCALE,
  height: VIEW_H * RENDER_SCALE,
  backgroundColor: PAL.void,
  pixelArt: true,
  roundPixels: true,
  physics: { default: 'arcade', arcade: { debug: new URLSearchParams(location.search).has('debug') } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [],
});

game.scene.add('Level', Level, false);
window.__game = game; window.__input = Input; // handy for debugging in the console

const q = new URLSearchParams(location.search);

// ?map=custom → play the maps drawn in the editor (maps/<level>.json) instead of the built-in ones
if (q.get('map') === 'custom') {
  for (const key of Object.keys(LEVELS)) {
    try {
      const r = await fetch(`maps/${key}.json`, { cache: 'no-store' });
      if (!r.ok) continue;
      const data = await r.json();
      LEVELS[key].rows = data.rows;
      const start = (data.markers || []).find((mk) => mk.type === 'start');
      if (start) { LEVELS[key].spawn = { x: start.x, y: start.y, dir: 1 }; LEVELS[key].entries = { ...(LEVELS[key].entries || {}), gates: LEVELS[key].spawn, stairs: LEVELS[key].spawn, retry: LEVELS[key].spawn, door: LEVELS[key].spawn }; }
    } catch (e) { /* keep the built-in map */ }
  }
}

// ?level=quai / ?level=first jumps straight in (for testing)
const jump = q.get('level');
if (q.has('plan')) {
  // ── plan viewer ──
  HUD.screen('screen-title', false);
  document.body.classList.add('is-plan');
  const level = jump || 'quai';
  game.registry.set('flags', { intro_quai: true, hintPhone: true });
  game.scene.start('Level', { level, plan: true });
  const bar = document.createElement('div');
  bar.id = 'plan-bar';
  bar.innerHTML = `
    <strong>FLOOR PLANS</strong>
    <a href="?plan&level=quai" class="${level === 'quai' ? 'is-on' : ''}">Outside + ground floor</a>
    <a href="?plan&level=first" class="${level === 'first' ? 'is-on' : ''}">1st floor</a>
    <span class="sep"></span>
    <label><input type="checkbox" id="pl-roofs"> Roofs (outside view)</label>
    <label><input type="checkbox" id="pl-cones" checked> Guards, cones &amp; routes</label>
    <span class="sep"></span>
    <button id="pl-out">−</button><button id="pl-fit">Fit</button><button id="pl-in">+</button>
    <span class="hint">drag to move · scroll to zoom</span>
    <a href="./" class="play">▶ Play</a>`;
  document.body.appendChild(bar);
  const S = () => window.__plan;
  bar.querySelector('#pl-roofs').onchange = (e) => S()?.planRoofs(e.target.checked);
  bar.querySelector('#pl-cones').onchange = (e) => S()?.planCones(e.target.checked);
  bar.querySelector('#pl-fit').onclick = () => S()?.planFit();
  bar.querySelector('#pl-in').onclick = () => S()?.planZoom(1.3);
  bar.querySelector('#pl-out').onclick = () => S()?.planZoom(1 / 1.3);
} else if (jump) {
  game.registry.set('flags', { badge: q.has('badge'), intro_quai: true, hintPhone: true });
  HUD.screen('screen-title', false);
  game.scene.start('Level', { level: jump, entry: q.get('entry') });
} else {
  game.scene.start('Level', { level: 'quai', title: true });
  HUD.screen('screen-title', true);
  await waitForAct('title-start');
  try { game.sound.context && game.sound.context.resume(); } catch (e) { /* no audio */ }
  HUD.screen('screen-title', false);
  // a small character builder, then the intro with *your* character
  const look = await buildCharacter();
  for (const k of Object.keys(LOOKS.player)) delete LOOKS.player[k];
  Object.assign(LOOKS.player, look, { spriteKey: `player-${Date.now()}` });   // a fresh sprite sheet — never swap one that's on screen
  const lvl = game.scene.getScene('Level');
  lvl.cameras.main.fadeOut(500, 20, 19, 26);
  setTimeout(() => lvl.scene.restart({ level: 'quai' }), 520);
}

