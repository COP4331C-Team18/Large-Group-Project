import { useEffect, type RefObject } from 'react';
import * as Y from 'yjs';
import { renderStroke, parseFramedYjsUpdates, worldToScreen } from '@/utils/whiteboardUtils';
import type { Stroke, Viewport } from '@/types/whiteboard';
import { boardService } from '@/api/services/boardService';

type PreviewText = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function computeFitViewport(strokes: Stroke[], texts: PreviewText[], W: number, H: number, padding = 16): Viewport {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) {
    const hw = (s.width ?? 2) / 2;
    if (s.points && s.points.length >= 2) {
      for (let i = 0; i < s.points.length; i += 2) {
        minX = Math.min(minX, s.points[i] - hw);
        maxX = Math.max(maxX, s.points[i] + hw);
        minY = Math.min(minY, s.points[i + 1] - hw);
        maxY = Math.max(maxY, s.points[i + 1] + hw);
      }
    } else if (s.x0 != null) {
      minX = Math.min(minX, s.x0 - hw, (s.x1 ?? s.x0) - hw);
      maxX = Math.max(maxX, s.x0 + hw, (s.x1 ?? s.x0) + hw);
      minY = Math.min(minY, s.y0! - hw, (s.y1 ?? s.y0!) - hw);
      maxY = Math.max(maxY, s.y0! + hw, (s.y1 ?? s.y0!) + hw);
    }
  }
  for (const t of texts) {
    minX = Math.min(minX, t.x);
    minY = Math.min(minY, t.y);
    maxX = Math.max(maxX, t.x + t.width);
    maxY = Math.max(maxY, t.y + t.height);
  }
  if (!isFinite(minX)) return { x: 0, y: 0, scale: 1 };
  const cW = maxX - minX || 1;
  const cH = maxY - minY || 1;
  const scale = Math.min((W - padding * 2) / cW, (H - padding * 2) / cH);
  return {
    x: (W - cW * scale) / 2 - minX * scale,
    y: (H - cH * scale) / 2 - minY * scale,
    scale,
  };
}

function rgbaFromHex(hex: string, alpha: number) {
  const raw = (hex || '#111410').replace('#', '').trim();
  const expanded = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const value = Number.parseInt(expanded.padEnd(6, '0').slice(0, 6), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`;
}

function getReadableTextColor(hex: string) {
  const raw = (hex || '#111410').replace('#', '').trim();
  const expanded = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const value = Number.parseInt(expanded.padEnd(6, '0').slice(0, 6), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#111410' : '#FFFFFF';
}

export function useBoardPreview(
  boardId: string | number | undefined,
  canvasRef: RefObject<HTMLCanvasElement>,
  padding?: number,
) {
  useEffect(() => {
    if (!boardId) return;
    let cancelled = false;

    boardService.getBoardById(String(boardId))
      .then((board) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const doc = new Y.Doc();

        for (const update of parseFramedYjsUpdates(board.yjsUpdate)) {
          Y.applyUpdate(doc, update);
        }

        const { width: W, height: H } = canvas;
        const yStrokes = doc.getMap<Y.Map<any>>('strokes');
        const yTexts = doc.getMap<Y.Map<any>>('texts');
        const strokes: Stroke[] = [];
        const texts: Array<PreviewText & {
          color: string;
          opacity: number;
          fontSize: number;
          text: string;
        }> = [];

        yStrokes.forEach((yStroke) => {
          const s: any = {
            id: yStroke.get('id'),
            tool: yStroke.get('tool'),
            color: yStroke.get('color'),
            width: yStroke.get('width'),
            opacity: yStroke.get('opacity'),
            timestamp: yStroke.get('timestamp') ?? 0,
          };
          const yPoints = yStroke.get('points') as Y.Array<number> | undefined;
          if (yPoints) {
            s.points = yPoints.toArray();
          } else {
            s.x0 = yStroke.get('x0');
            s.y0 = yStroke.get('y0');
            s.x1 = yStroke.get('x1');
            s.y1 = yStroke.get('y1');
          }
          strokes.push(s);
        });

        yTexts.forEach((yEl) => {
          if (yEl.get('type') !== 'text') return;
          const ytext = yEl.get('content') as Y.Text | undefined;
          texts.push({
            x: (yEl.get('x') as number) ?? 0,
            y: (yEl.get('y') as number) ?? 0,
            width: Math.max(1, (yEl.get('width') as number) ?? 180),
            height: Math.max(1, (yEl.get('height') as number) ?? 72),
            color: (yEl.get('color') as string) ?? '#111410',
            opacity: Math.min(1, Math.max(0, (yEl.get('opacity') as number) ?? 1)),
            fontSize: Math.max(10, (yEl.get('fontSize') as number) ?? 18),
            text: ytext ? ytext.toString() : '',
          });
        });

        strokes.sort((a, b) => a.timestamp - b.timestamp);

        const vp = computeFitViewport(strokes, texts, W, H, padding);
        ctx.clearRect(0, 0, W, H);
        for (const s of strokes) {
          renderStroke(ctx, s, vp);
        }

        for (const t of texts) {
          const { x: sx, y: sy } = worldToScreen(t.x, t.y, vp);
          const boxW = t.width * vp.scale;
          const boxH = t.height * vp.scale;
          const lineHeight = t.fontSize * vp.scale * 1.2;
          const boxRenderH = Math.max(boxH, lineHeight + 8);
          const textX = sx + 6;
          const textWidth = Math.max(1, boxW - 12);

          ctx.save();
          ctx.fillStyle = rgbaFromHex(t.color, t.opacity);
          ctx.strokeStyle = t.color;
          ctx.lineWidth = Math.max(1.25, 1.5 * vp.scale);
          ctx.beginPath();
          ctx.roundRect(sx, sy, boxW, boxRenderH, 8 * vp.scale);
          ctx.fill();
          ctx.stroke();

          ctx.font = `${t.fontSize * vp.scale}px sans-serif`;
          ctx.fillStyle = getReadableTextColor(t.color);
          ctx.textBaseline = 'top';

          let cursorY = sy + 6;
          const maxLines = Math.max(1, Math.floor((Math.max(boxH, lineHeight + 8) - 12) / lineHeight));
          let linesDrawn = 0;
          const paragraphs = t.text.split('\n');

          for (const paragraph of paragraphs) {
            let line = '';
            for (const ch of paragraph) {
              const testLine = line + ch;
              if (ctx.measureText(testLine).width > textWidth && line.length > 0) {
                ctx.fillText(line, textX, cursorY);
                cursorY += lineHeight;
                linesDrawn += 1;
                if (linesDrawn >= maxLines) break;
                line = ch;
              } else {
                line = testLine;
              }
            }

            if (linesDrawn >= maxLines) break;
            ctx.fillText(line, textX, cursorY);
            cursorY += lineHeight;
            linesDrawn += 1;
            if (linesDrawn >= maxLines) break;
          }

          ctx.restore();
        }

        doc.destroy();
      })
      .catch(() => { /* preview silently stays blank on error */ });

    return () => { cancelled = true; };
  }, [boardId, canvasRef, padding]);
}