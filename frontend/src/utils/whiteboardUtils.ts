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
