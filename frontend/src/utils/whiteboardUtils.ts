import type { Stroke, Viewport } from '../types/whiteboard';

export const PALETTE = [
  '#111410', '#2D3A27', '#4A5D3F', '#7A9E6E',
  '#c4a96a', '#A67C52', '#8B4513', '#C41E3A',
  '#1B4F72', '#2E86AB', '#D4C5B0', '#FFFFFF',
];

export const SNAPSHOT_DEBOUNCE_MS = 20_000;

/**
 * Parses the inksubserver framing format stored in MongoDB yjsUpdate:
 *   [4-byte big-endian uint32 length][raw Yjs update bytes] × N
 * MongoDB Buffers arrive over JSON as { type: 'Buffer', data: number[] }
 * or occasionally as a plain number array.
 */
export function parseFramedYjsUpdates(raw: any): Uint8Array[] {
  let bytes: Uint8Array | null = null;
  if (raw instanceof Uint8Array) bytes = raw;
  else if (Array.isArray(raw?.data) && raw.data.length > 0) bytes = new Uint8Array(raw.data);
  else if (Array.isArray(raw) && raw.length > 0) bytes = new Uint8Array(raw);
  if (!bytes || bytes.byteLength < 4) return [];

  const updates: Uint8Array[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 0;
  while (pos + 4 <= bytes.byteLength) {
    const len = view.getUint32(pos, false); // big-endian, matches htonl in C++
    pos += 4;
    if (pos + len > bytes.byteLength) break;
    updates.push(bytes.slice(pos, pos + len));
    pos += len;
  }
  return updates;
}
export const MIN_SCALE = 0.0000001;
export const MAX_SCALE = 100000000;

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

  ctx.lineWidth = Math.min(stroke.width * vp.scale, 10000);
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
