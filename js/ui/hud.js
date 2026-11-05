// ─────────────────────────────────────────────────────────────
//  HUD — all UI is HTML over the canvas so text stays razor sharp
//  at any screen size (phones included). Styles: css/hud.css
// ─────────────────────────────────────────────────────────────
import { Input } from '../systems/input.js';

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let typing = null;      // current typewriter
let dialogueDone = null;
const last = {};        // last value written per HUD field — only touch the DOM on change
const changed = (k, v) => (last[k] === v ? false : ((last[k] = v), true));
let waysTimer = null, waysPinned = null; // null = automatic, true/false = the player chose

export const HUD = {
  dialogueOpen: false,
  phoneOpen: false,

  show(on) { if (changed('show', on)) $('hud').classList.toggle('is-on', on); },

  setSuspicion(v) {
    const p = Math.round(Math.max(0, Math.min(100, v)));
    if (!changed('sus', p)) return;
    $('sus-fill').style.width = p + '%';
    const lvl = p >= 70 ? 'high' : p >= 35 ? 'mid' : 'low';
    if (changed('susLvl', lvl)) $('meter').dataset.level = lvl;
  },
  setSeen(on) { if (changed('seen', on)) $('meter').classList.toggle('is-seen', on); },
  setObjective(text) {
    const el = $('objective');
    if (el.dataset.text === text) return;
    el.dataset.text = text;
    el.classList.remove('is-new'); void el.offsetWidth; el.classList.add('is-new');
    $('objective-text').textContent = text;
  },
  setClock(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    if (!changed('clock', h * 60 + m)) return;
    $('clock').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    $('clock').classList.toggle('is-late', sec >= 9 * 3600 + 30 * 60);
  },
  // the hints panel, top right: { title, items: [{ text, done, active, key }] } or null.
  // Folded to a small tab by default; opens for a few seconds when its content changes.
  // H / tap toggles it (and then it stays how you left it).
  setWays(w) {
    const sig = w ? w.title + '|' + w.items.map((it) => it.text + (it.done ? '1' : '0') + (it.active ? 'a' : '')).join('|') : '';
    if (!changed('ways', sig)) return;
    const box = $('ways');
    box.classList.toggle('is-on', !!w);
    if (!w) return;
    $('ways-title').textContent = w.title;
    $('ways-count').textContent = w.items.filter((it) => !it.done).length;
    $('ways-list').innerHTML = w.items.map((it) => `<li class="${it.done ? 'is-done' : ''} ${it.active ? 'is-active' : ''}">${it.key ? `<kbd>${it.key}</kbd>` : ''}<span>${it.text}</span></li>`).join('');
    if (waysPinned === null) {
      box.classList.remove('is-min');
      clearTimeout(waysTimer); waysTimer = setTimeout(() => { if (waysPinned === null) box.classList.add('is-min'); }, 6500);
    }
  },
  toggleWays() {
    const box = $('ways');
    clearTimeout(waysTimer);
    box.classList.toggle('is-min');
    waysPinned = !box.classList.contains('is-min');
  },
  setBadge(on) { if (changed('badge', on)) $('badge-chip').classList.toggle('is-on', on); },
  setHidden(on) { if (changed('hidden', on)) $('hidden-chip').classList.toggle('is-on', on); },
  prompt(text) {
    if (!changed('prompt', text || null)) return;
    const el = $('prompt');
    if (!text) { el.classList.remove('is-on'); return; }
    el.querySelector('span').textContent = text;
    el.classList.add('is-on');
  },
  toast(text, ms = 2200) {
    const el = $('toast');
    el.textContent = text; el.classList.add('is-on');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('is-on'), ms);
  },

  // ── cinematic ──
  letterbox(on) { document.body.classList.toggle('is-cinema', on); },
  skip(on) { $('skip').classList.toggle('is-on', on); },
  abort() { // a skipped cutscene: clear anything still on screen
    $('caption').classList.remove('is-on'); $('card').classList.remove('is-on');
    if (this.dialogueOpen) { clearInterval(typing?.id); typing = { done: true }; const d = dialogueDone; dialogueDone = null; d && d(); }
  },
  async caption(text, ms = 2600) {
    const el = $('caption');
    el.innerHTML = text; el.classList.add('is-on');
    await wait(ms);
    el.classList.remove('is-on');
    await wait(350);
  },
  async card(lines, ms = 3200) {
    const el = $('card');
    el.innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
    el.classList.add('is-on');
    await wait(ms);
    el.classList.remove('is-on');
    await wait(600);
  },

  // ── dialogue ──
  // auto: ms after typing finishes to close by itself (cutscenes)
  say(name, text, { portrait, auto } = {}) {
    return new Promise((resolve) => {
      const box = $('dialogue');
      $('dlg-name').textContent = name || '';
      $('dlg-name').style.display = name ? '' : 'none';
      box.dataset.who = portrait || '';
      box.classList.add('is-on');
      this.dialogueOpen = true;
      Input.locked = true;
      const out = $('dlg-text');
      out.textContent = '';
      let i = 0;
      clearInterval(typing?.id);
      typing = { full: text, id: setInterval(() => {
        i += 1; out.textContent = text.slice(0, i);
        if (i >= text.length) {
          clearInterval(typing.id); typing.done = true;
          if (auto) { const mine = typing; setTimeout(() => { if (typing === mine) this.advance(); }, auto); }
        }
      }, 22), done: false };
      dialogueDone = () => {
        box.classList.remove('is-on');
        this.dialogueOpen = false;
        Input.locked = false;
        resolve();
      };
    });
  },
  advance() {
    if (!this.dialogueOpen) return;
    if (typing && !typing.done) { clearInterval(typing.id); typing.done = true; $('dlg-text').textContent = typing.full; return; }
    const d = dialogueDone; dialogueDone = null; d && d();
  },
  async talk(lines, opts) { for (const [n, t] of lines) await this.say(n, t, opts); },

  // ── phone ──
  phone({ thread, choices, onPick }) {
    const el = $('phone');
    this.phoneOpen = true; Input.locked = true;
    el.classList.add('is-on');
    const msgs = $('phone-msgs');
    msgs.innerHTML = thread.map(([who, t]) => `<div class="msg msg--${who}">${t}</div>`).join('');
    msgs.scrollTop = msgs.scrollHeight;
    const list = $('phone-choices');
    list.innerHTML = '';
    let sel = 0;
    const items = choices.map((c, i) => {
      const b = document.createElement('button');
      b.className = 'choice'; b.textContent = c.label;
      b.addEventListener('click', () => pick(i));
      list.appendChild(b); return b;
    });
    const mark = () => items.forEach((b, i) => b.classList.toggle('is-sel', i === sel));
    mark();
    const key = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowdown' || k === 's') { sel = (sel + 1) % items.length; mark(); e.preventDefault(); }
      if (k === 'arrowup' || k === 'w' || k === 'z') { sel = (sel - 1 + items.length) % items.length; mark(); e.preventDefault(); }
      if (k === 'enter' || k === 'e' || k === ' ') { pick(sel); e.preventDefault(); }
      if (k === 'escape' || k === 'p' || k === 'tab') { close(); e.preventDefault(); }
      if (/^[1-9]$/.test(k) && items[+k - 1]) pick(+k - 1);
    };
    const close = () => {
      this.closePhone = null;
      window.removeEventListener('keydown', key, true);
      el.classList.remove('is-on');
      this.phoneOpen = false;
      setTimeout(() => { Input.locked = false; Input.clearPressed(); }, 50);
    };
    const pick = (i) => { const c = choices[i]; close(); onPick && onPick(c); };
    $('phone-close').onclick = close;
    this.closePhone = close;
    setTimeout(() => window.addEventListener('keydown', key, true), 30);
  },

  // ── screens ──
  screen(id, on) { $(id).classList.toggle('is-on', on); },
  async caught({ who, line }) {
    $('caught-who').textContent = who;
    $('caught-line').textContent = `“${line}”`;
    this.screen('screen-caught', true);
    Input.locked = true;
    await wait(700);
    await waitForAct('caught-retry');
    this.screen('screen-caught', false);
    Input.locked = false;
  },
  async win({ time, late, caughtCount }) {
    $('win-time').textContent = time;
    $('win-note').textContent = late ? 'Edusign closed — but you made it in.' : 'Signed in before Edusign closed. Nobody suspects a thing.';
    $('win-caught').textContent = caughtCount === 0 ? 'Never caught' : `Caught ${caughtCount}×`;
    this.screen('screen-win', true);
    Input.locked = true;
    await wait(900);
    await waitForAct('win-again');
    location.reload();
  },
};

export function waitForAct(buttonId) {
  return new Promise((resolve) => {
    const btn = buttonId && $(buttonId);
    let done = false;
    const finish = () => { if (done) return; done = true; window.removeEventListener('keydown', key); btn && btn.removeEventListener('click', finish); resolve(); };
    const key = (e) => { if (['enter', ' ', 'e'].includes(e.key.toLowerCase())) finish(); };
    window.addEventListener('keydown', key);
    btn && btn.addEventListener('click', finish);
  });
}
