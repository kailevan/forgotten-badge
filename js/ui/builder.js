// ─────────────────────────────────────────────────────────────
//  Character builder — after Press start. Six rows of ◀ ▶ choices,
//  a live preview (front · side · back). Remembered for next time.
// ─────────────────────────────────────────────────────────────
import { CUSTOM, customLabel, paintPreview, LOOKS } from '../art/characters.js';

const $ = (id) => document.getElementById(id);
const KEY = 'fb-look';

export function buildCharacter() {
  return new Promise((resolve) => {
    let look = { ...LOOKS.player };
    try { Object.assign(look, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* private mode */ }
    let row = 0;
    const list = $('builder-rows');
    const render = () => {
      list.innerHTML = CUSTOM.map(([label, key, opts], i) => {
        const v = look[key] ?? null;
        const txt = customLabel(key, v);
        const sw = typeof v === 'string' && v.startsWith('#') ? `<i style="background:${v}"></i>` : '';
        return `<li class="${i === row ? 'is-sel' : ''}" data-i="${i}"><span class="lab">${label}</span>
          <button data-i="${i}" data-d="-1" aria-label="previous">◀</button><span class="val">${sw}${txt}</span><button data-i="${i}" data-d="1" aria-label="next">▶</button></li>`;
      }).join('');
      paintPreview($('builder-preview'), look);
    };
    const step = (i, d) => {
      const [, key, opts] = CUSTOM[i];
      const cur = Math.max(0, opts.indexOf(look[key] ?? null));
      look[key] = opts[(cur + d + opts.length) % opts.length];
      if (look[key] === null) delete look[key];
      render();
    };
    list.onclick = (e) => { const b = e.target.closest('button'); const li = e.target.closest('li'); if (li) row = +li.dataset.i; if (b) step(+b.dataset.i, +b.dataset.d); else render(); };
    $('builder-random').onclick = () => { CUSTOM.forEach(([, key, opts]) => { look[key] = opts[(Math.random() * opts.length) | 0]; if (look[key] === null) delete look[key]; }); render(); };
    const done = () => {
      window.removeEventListener('keydown', onKey, true);
      try { localStorage.setItem(KEY, JSON.stringify(look)); } catch (e) { /* fine */ }
      $('screen-builder').classList.remove('is-on');
      resolve(look);
    };
    $('builder-go').onclick = done;
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w' || k === 'z') { row = (row + CUSTOM.length - 1) % CUSTOM.length; render(); }
      else if (k === 'arrowdown' || k === 's') { row = (row + 1) % CUSTOM.length; render(); }
      else if (k === 'arrowleft' || k === 'a' || k === 'q') step(row, -1);
      else if (k === 'arrowright' || k === 'd') step(row, 1);
      else if (k === 'enter' || k === ' ' || k === 'e') done();
      else return;
      e.preventDefault(); e.stopPropagation();
    };
    setTimeout(() => window.addEventListener('keydown', onKey, true), 150);
    $('screen-builder').classList.add('is-on');
    render();
  });
}
