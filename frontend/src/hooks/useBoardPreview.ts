import { useEffect, type RefObject } from 'react';
import * as Y from 'yjs';
import { renderStroke, parseFramedYjsUpdates } from '@/utils/whiteboardUtils';
import type { Stroke, Viewport } from '@/types/whiteboard';
import { boardService } from '@/api/services/boardService';

function computeFitViewport(strokes: Stroke[], W: number, H: number, padding = 16): Viewport {
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
        const strokes: Stroke[] = [];
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
        strokes.sort((a, b) => a.timestamp - b.timestamp);

        const vp = computeFitViewport(strokes, W, H, padding);
        ctx.clearRect(0, 0, W, H);
        for (const s of strokes) {
          renderStroke(ctx, s, vp);
        }

        doc.destroy();
      })
      .catch(() => { /* preview silently stays blank on error */ });

    return () => { cancelled = true; };
  }, [boardId, canvasRef, padding]);
}
