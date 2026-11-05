// ─────────────────────────────────────────────────────────────
//  Vision cones: line-of-sight ray-marching against the opaque grid.
//  Glass, desks, railings don't block sight. Walls, trees, lifts do.
// ─────────────────────────────────────────────────────────────
import { VISION } from '../config.js';

const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export function lineOfSight(world, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  const n = Math.ceil(d / VISION.step);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (world.isOpaque(x0 + dx * t, y0 + dy * t)) return false;
  }
  return true;
}

// Can watcher (eye point + facing + range/fov) see a point?
export function sees(world, w, tx, ty) {
  const ex = w.x, ey = w.y - 10; // eyes, not feet
  const d = Math.hypot(tx - ex, ty - ey);
  // peripheral awareness: up close you get noticed whichever way they face
  if (d < (w.bump ?? VISION.bumpRadius)) return d < VISION.bumpRadius || lineOfSight(world, ex, ey, tx, ty);
  if (d > w.vision.range) return false;
  const a = Math.atan2(ty - ey, tx - ex);
  if (Math.abs(angDiff(a, w.facing)) > w.vision.fov / 2) return false;
  return lineOfSight(world, ex, ey, tx, ty);
}

// Polygon of the visible cone, clipped by walls.
export function conePoints(world, w) {
  const ex = w.x, ey = w.y - 6;
  const pts = [ex, ey];
  const half = w.vision.fov / 2, n = VISION.rays, r = w.vision.range;
  for (let i = 0; i <= n; i++) {
    const a = w.facing - half + (w.vision.fov * i) / n;
    const cx = Math.cos(a), cy = Math.sin(a);
    let len = VISION.step;
    while (len < r && !world.isOpaque(ex + cx * len, ey + cy * len)) len += VISION.step;
    pts.push(ex + cx * len, ey + cy * len);
  }
  return pts;
}

export { angDiff };
