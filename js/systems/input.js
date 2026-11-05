// ─────────────────────────────────────────────────────────────
//  One input surface for keyboard (laptop) and touch (phone).
//  Game code only reads Input.state — never raw events.
// ─────────────────────────────────────────────────────────────

const keys = new Set();
const pressed = new Set(); // edge-triggered, cleared each frame by consume()

export const Input = {
  state: { x: 0, y: 0, run: false },
  touch: { x: 0, y: 0, run: false, active: false },
  locked: false,

  init() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
      if (!keys.has(k)) pressed.add(k);
      if (k === 'h') document.getElementById('ways')?.classList.toggle('is-min');
      keys.add(k);
    });
    window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => keys.clear());
    initTouch();
  },

  update() {
    let x = 0, y = 0;
    if (keys.has('a') || keys.has('q') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('z') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (this.touch.active) { x = this.touch.x; y = this.touch.y; }
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    this.state.x = this.locked ? 0 : x;
    this.state.y = this.locked ? 0 : y;
    this.state.run = !this.locked && (keys.has('shift') || this.touch.run);
  },

  // "act" = E / Space / Enter / the A button.  "phone" = P / Tab / phone button.
  consume(action) {
    const map = { act: ['e', ' ', 'enter', '#act'], phone: ['p', 'tab', '#phone'], back: ['escape', '#back'] };
    for (const k of map[action]) if (pressed.has(k)) { pressed.delete(k); return true; }
    return false;
  },
  press(name) { pressed.add('#' + name); },
  clearPressed() { pressed.clear(); },
};

function initTouch() {
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  document.body.classList.toggle('is-touch', isTouch);
  const pad = document.getElementById('stick');
  const knob = document.getElementById('stick-knob');
  if (pad && knob) {
    let id = null, cx = 0, cy = 0, R = 1;
    const move = (e) => {
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.min(Math.hypot(dx, dy), R);
      const a = Math.atan2(dy, dx);
      const nx = Math.cos(a) * d, ny = Math.sin(a) * d;
      knob.style.transform = `translate(${nx}px, ${ny}px)`;
      const dead = 0.18;
      const m = d / R;
      Input.touch.x = m < dead ? 0 : (nx / R);
      Input.touch.y = m < dead ? 0 : (ny / R);
      Input.touch.active = true;
    };
    pad.addEventListener('pointerdown', (e) => {
      id = e.pointerId; pad.setPointerCapture(id);
      const r = pad.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width * 0.38;
      move(e);
    });
    pad.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null; knob.style.transform = '';
      Input.touch.x = Input.touch.y = 0; Input.touch.active = false;
    };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
  }
  const bind = (elId, down, up) => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.classList.add('is-pressed'); down(); });
    const off = () => { el.classList.remove('is-pressed'); up && up(); };
    el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
  };
  bind('btn-act', () => Input.press('act'));
  bind('btn-run', () => { Input.touch.run = true; }, () => { Input.touch.run = false; });
  bind('btn-phone', () => Input.press('phone'));
}
