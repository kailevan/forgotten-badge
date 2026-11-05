// Sketch pad: white paper + pen. Every page autosaves to sketches/<page>.png
// (through _serve.py) so Claude can look at the drawing.
(() => {
  const cv = document.getElementById('paper');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const state = { page: 'outside', tool: 'pen', color: '#111111', size: 6, undo: [], saveTimer: null };

  const blank = () => { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); };
  const status = (t, cls = '') => { const el = document.getElementById('status'); el.textContent = t; el.className = 'status ' + cls; };

  function load(page) {
    state.page = page; state.undo = [];
    blank();
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, W, H); status('Your saved sketch', 'ok'); };
    img.onerror = () => status('Blank page — draw, it saves by itself');
    img.src = `sketches/${page}.png?t=${Date.now()}`;
    document.querySelectorAll('[data-page]').forEach((b) => b.classList.toggle('is-on', b.dataset.page === page));
  }
  function snapshot() { state.undo.push(ctx.getImageData(0, 0, W, H)); if (state.undo.length > 40) state.undo.shift(); }
  function scheduleSave() { status('Saving…'); clearTimeout(state.saveTimer); state.saveTimer = setTimeout(save, 700); }
  async function save() {
    try {
      const r = await fetch(`/api/sketch/${state.page}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: cv.toDataURL('image/png') }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error);
      status(`Saved ✓ ${new Date().toLocaleTimeString()}`, 'ok');
    } catch (e) { status('Not saved — is “python3 _serve.py” running?', 'err'); }
  }

  // ── drawing ──
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
  let drawing = null;
  cv.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    if (state.tool === 'text') {
      const t = prompt('Label:');
      if (!t) return;
      snapshot();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = state.color; ctx.font = `600 ${18 + state.size * 3}px system-ui, -apple-system, sans-serif`; ctx.textBaseline = 'middle';
      ctx.fillText(t, p.x, p.y);
      scheduleSave(); return;
    }
    snapshot();
    cv.setPointerCapture(e.pointerId);
    drawing = { last: p, mid: p };
    ctx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = state.color; ctx.fillStyle = state.color;
    ctx.lineWidth = state.tool === 'eraser' ? state.size * 5 : state.size;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill();
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    for (const ev of list && list.length ? list : [e]) {
      const p = pos(ev), mid = { x: (drawing.last.x + p.x) / 2, y: (drawing.last.y + p.y) / 2 };
      ctx.beginPath(); ctx.moveTo(drawing.mid.x, drawing.mid.y); ctx.quadraticCurveTo(drawing.last.x, drawing.last.y, mid.x, mid.y); ctx.stroke();
      drawing.last = p; drawing.mid = mid;
    }
  });
  const end = () => {
    if (!drawing) return;
    drawing = null;
    if (state.tool === 'eraser') { // keep the paper white where it was erased
      ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    }
    scheduleSave();
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  // ── UI ──
  const setTool = (t) => { state.tool = t; document.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('is-on', b.dataset.tool === t)); document.body.className = 'is-' + t; };
  document.querySelectorAll('[data-tool]').forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
  document.querySelectorAll('[data-color]').forEach((b) => (b.onclick = () => { state.color = b.dataset.color; document.querySelectorAll('[data-color]').forEach((x) => x.classList.toggle('is-on', x === b)); if (state.tool === 'eraser') setTool('pen'); }));
  document.querySelectorAll('[data-size]').forEach((b) => (b.onclick = () => { state.size = +b.dataset.size; document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('is-on', x === b)); }));
  document.querySelectorAll('[data-page]').forEach((b) => (b.onclick = () => { clearTimeout(state.saveTimer); if (status && document.getElementById('status').textContent === 'Saving…') save(); load(b.dataset.page); }));
  document.getElementById('undo').onclick = () => { const s = state.undo.pop(); if (s) { ctx.putImageData(s, 0, 0); scheduleSave(); } };
  document.getElementById('clear').onclick = () => { if (!confirm('Clear this page?')) return; snapshot(); blank(); scheduleSave(); };
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); document.getElementById('undo').click(); return; }
    if (e.metaKey || e.ctrlKey) return;
    ({ p: 'pen', e: 'eraser', t: 'text' })[e.key.toLowerCase()] && setTool(({ p: 'pen', e: 'eraser', t: 'text' })[e.key.toLowerCase()]);
  });

  load('outside');
})();
