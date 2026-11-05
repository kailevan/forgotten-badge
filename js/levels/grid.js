// Tiny drawing kit for laying out ASCII levels with rectangles.
// Levels can also be pasted as raw strings — both end up as rows.
export function grid(w, h, fill = ' ') {
  const g = Array.from({ length: h }, () => Array(w).fill(fill));
  const api = {
    rect(x, y, rw, rh, ch) { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (g[j] && i >= 0 && i < w) g[j][i] = ch; return api; },
    hline(x, y, len, ch) { return api.rect(x, y, len, 1, ch); },
    vline(x, y, len, ch) { return api.rect(x, y, 1, len, ch); },
    box(x, y, rw, rh, wall, floor) { api.rect(x, y, rw, rh, wall); if (floor) api.rect(x + 1, y + 1, rw - 2, rh - 2, floor); return api; },
    set(x, y, ch) { if (g[y]) g[y][x] = ch; return api; },
    every(x, y, len, stepX, ch) { for (let i = x; i < x + len; i += stepX) api.set(i, y, ch); return api; },
    rows() { return g.map((r) => r.join('')); },
  };
  return api;
}
