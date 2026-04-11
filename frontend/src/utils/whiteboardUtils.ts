import type { Stroke, Viewport } from '../types/whiteboard';

export const PALETTE = [
  '#111410', '#2D3A27', '#4A5D3F', '#7A9E6E',
  '#c4a96a', '#A67C52', '#8B4513', '#C41E3A',
  '#1B4F72', '#2E86AB', '#D4C5B0', '#FFFFFF',
];

export const SNAPSHOT_DEBOUNCE_MS = 20_000;
export const MIN_SCALE = 0.05;
export const MAX_SCALE = 20;

let _idCounter = 0;
export function genId(): string {
  return `${Date.now()}-${++_idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Screen → World */
export function screenToWorld(sx: number, sy: number, vp: Viewport) {
  return {
    x: (sx - vp.x) / vp.scale,
    y: (sy - vp.y) / vp.scale,
  };
}

/** World → Screen */
export function worldToScreen(wx: number, wy: number, vp: Viewport) {
  return {
    x: wx * vp.scale + vp.x,
    y: wy * vp.scale + vp.y,
  };
}

export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  vp: Viewport,
) {
  ctx.save();
  ctx.globalAlpha = stroke.opacity ?? 1;

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
  }

  ctx.lineWidth = stroke.width * vp.scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
    const pts = stroke.points!;
    if (!pts || pts.length < 2) { ctx.restore(); return; }
    ctx.beginPath();
    const p0 = worldToScreen(pts[0], pts[1], vp);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 2; i < pts.length; i += 2) {
      const p = worldToScreen(pts[i], pts[i + 1], vp);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  } else if (stroke.tool === 'line') {
    const a = worldToScreen(stroke.x0!, stroke.y0!, vp);
    const b = worldToScreen(stroke.x1!, stroke.y1!, vp);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  } else if (stroke.tool === 'rect') {
    const a = worldToScreen(stroke.x0!, stroke.y0!, vp);
    const b = worldToScreen(stroke.x1!, stroke.y1!, vp);
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  } else if (stroke.tool === 'circle') {
    const a = worldToScreen(stroke.x0!, stroke.y0!, vp);
    const b = worldToScreen(stroke.x1!, stroke.y1!, vp);
    const rx = Math.abs(b.x - a.x) / 2;
    const ry = Math.abs(b.y - a.y) / 2;
    ctx.beginPath();
    ctx.ellipse(a.x + (b.x - a.x) / 2, a.y + (b.y - a.y) / 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// ── Eraser hit-test helpers ───────────────────────────────────────────────────

function pointSegmentDist(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-10) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/**
 * Returns true if the eraser brush (circle of worldRadius) touches `stroke`.
 * All coordinates are in world space.
 */
export function strokeHitsPoint(
  stroke: Stroke,
  wx: number, wy: number,
  worldRadius: number,
): boolean {
  const r = worldRadius + (stroke.width ?? 1) / 2;

  if (stroke.points) {
    const pts = stroke.points;
    if (pts.length < 2) return false;
    if (pts.length === 2) return Math.hypot(wx - pts[0], wy - pts[1]) <= r;
    for (let i = 0; i < pts.length - 2; i += 2) {
      if (pointSegmentDist(wx, wy, pts[i], pts[i + 1], pts[i + 2], pts[i + 3]) <= r) return true;
    }
    return false;
  }

  const x0 = stroke.x0!, y0 = stroke.y0!, x1 = stroke.x1!, y1 = stroke.y1!;

  if (stroke.tool === 'line') {
    return pointSegmentDist(wx, wy, x0, y0, x1, y1) <= r;
  }
  if (stroke.tool === 'rect') {
    return (
      pointSegmentDist(wx, wy, x0, y0, x1, y0) <= r ||
      pointSegmentDist(wx, wy, x1, y0, x1, y1) <= r ||
      pointSegmentDist(wx, wy, x1, y1, x0, y1) <= r ||
      pointSegmentDist(wx, wy, x0, y1, x0, y0) <= r
    );
  }
  if (stroke.tool === 'circle') {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
    if (rx < 1e-6 || ry < 1e-6) return Math.hypot(wx - cx, wy - cy) <= r;
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      if (Math.hypot(wx - (cx + rx * Math.cos(a)), wy - (cy + ry * Math.sin(a))) <= r) return true;
    }
    return false;
  }
  return false;
}

/**
 * Returns true if `stroke` has at least one defining point inside the
 * axis-aligned rectangle (rx0,ry0)→(rx1,ry1).  World space.
 */
export function strokeIntersectsRect(
  stroke: Stroke,
  rx0: number, ry0: number,
  rx1: number, ry1: number,
): boolean {
  const minX = Math.min(rx0, rx1), maxX = Math.max(rx0, rx1);
  const minY = Math.min(ry0, ry1), maxY = Math.max(ry0, ry1);
  const inRect = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY;

  if (stroke.points) {
    const pts = stroke.points;
    for (let i = 0; i < pts.length; i += 2) {
      if (inRect(pts[i], pts[i + 1])) return true;
    }
    return false;
  }

  const x0 = stroke.x0!, y0 = stroke.y0!, x1 = stroke.x1!, y1 = stroke.y1!;
  return inRect(x0, y0) || inRect(x1, y1) || inRect((x0 + x1) / 2, (y0 + y1) / 2);
}
