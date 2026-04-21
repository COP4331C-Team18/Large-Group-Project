import {
  useEffect, useLayoutEffect, useRef, useState, useCallback,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import * as Y from 'yjs';
import { createYjsConnection } from '@/utils/yjsSocketAdapter';

// Internal Components
import WhiteboardHeader from '../components/whiteboard/WhiteboardHeader';
import WhiteboardToolbar from '../components/whiteboard/WhiteboardToolbar';
import WhiteboardHUD from '../components/whiteboard/WhiteboardHUD';
import TextEditorOverlay from '../components/whiteboard/TextEditorOverlay';
import ExportDialog from '../components/whiteboard/ExportDialog';

// Utils and Types
import { boardService } from '@/api/services/boardService';
import { THEMES } from '@/config/theme';
import type { Tool, Stroke, Viewport } from '../types/whiteboard';
import {
  genId, screenToWorld, worldToScreen, renderStroke,
  MIN_SCALE, MAX_SCALE, SNAPSHOT_DEBOUNCE_MS, parseFramedYjsUpdates
} from '../utils/whiteboardUtils';

// External libraries
import jsPDF from 'jspdf';

function getThemeColors() {
  const themeId = document.documentElement.getAttribute('data-theme') ?? 'inkboard';
  const theme = THEMES.find(t => t.id === themeId);
  return {
    bg: theme?.swatch.base ?? '#F8F6F0',
    dotColor: theme?.swatch.content ?? '#111410',
  };
}

// Deterministic cursor color from userId
function userColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return `hsl(${Math.abs(hash) % 360}, 65%, 45%)`;
}

type RemoteCursor = { x: number; y: number; username: string; lastSeen: number };


export default function Whiteboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Board metadata
  const [boardId, setBoardId] = useState<string | undefined>();
  const [boardTitle, setBoardTitle] = useState('Untitled Board');
  const [joinCode, setJoinCode] = useState<string | undefined>();
  const [, setCollabActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#111410');
  const [lineWidth, setLineWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [userCount, setUserCount] = useState(1);
  const [codeCopied, setCodeCopied] = useState(false);
  const [zoom, setZoom] = useState(1);           
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [pendingTextCreate, setPendingTextCreate] = useState<{ x: number; y: number } | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Canvas refs — 3 layers stacked
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);     // layer 1: background + dots
  const canvasRef = useRef<HTMLCanvasElement>(null);       // layer 2: strokes (receives pointer events)
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null); // layer 3: remote cursors
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Viewport (pan + zoom)
  const vpRef = useRef<Viewport>({ x: 0, y: 0, scale: 1 });

  // Yjs State
  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const yStrokesRef = useRef<Y.Map<Y.Map<any>>>(ydocRef.current.getMap('strokes'));
  const yTextsRef = useRef<Y.Map<Y.Map<any>>>(ydocRef.current.getMap('texts'));
  const undoManagerRef = useRef<Y.UndoManager>(new Y.UndoManager([
    yStrokesRef.current,
    yTextsRef.current,
  ]));
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const editingTextIdRef = useRef<string | null>(null);
  const selectedTextIdRef = useRef<string | null>(null);
  const skipNextTextStyleWriteRef = useRef(false);
  const skipNextTextFontWriteRef = useRef(false);
  
  // Track the ID of the active stroke being drawn
  const activeStrokeId = useRef<string | null>(null);

  // WebSocket ref for collab
  const wsRef = useRef<WebSocket | null>(null);
  // Reconnect state — ref so closure in onclose always sees latest joinCode
  const joinCodeRef = useRef<string | undefined>(undefined);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Cursor overlay
  const remoteCursorsRef = useRef<Map<string, RemoteCursor>>(new Map());
  const lastCursorSendRef = useRef(0);
  const localMouseScreenRef = useRef<{ x: number; y: number } | null>(null);
  // Stable anonymous ID and display name for this browser session
  // toString(36) gives 0-9 + a-z; slice(2,8) picks 6 chars after the "0."
  const anonSuffixRef = useRef(Math.random().toString(36).slice(2, 8).toUpperCase());
  const anonIdRef = useRef(`anon_${anonSuffixRef.current.toLowerCase()}`);

  // Pointer tracking
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef<{ px: number; py: number; vpx: number; vpy: number } | null>(null);
  const spaceDown = useRef(false);
  const activeTextTransform = useRef<{
    id: string;
    mode: 'move' | 'resize';
    startWx: number;
    startWy: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  // Touch (pinch-zoom)
  const lastTouches = useRef<React.Touch[] | null>(null);

  // Animation frame for render loop
  const rafRef = useRef<number>(0);
  const needsRender = useRef(true);
  const bgNeedsRender = useRef(true); // only set on resize or theme change

  // ── Dirty flag helpers ──────────────────────────────────────────────────────
  const markDirty = useCallback(() => { needsRender.current = true; }, []);
  const markBgDirty = useCallback(() => { bgNeedsRender.current = true; needsRender.current = true; }, []);

  // ── Undo/redo state sync ─────────────────────────────────────────────────────
  const syncUndoState = useCallback(() => {
    setCanUndoState(undoManagerRef.current.undoStack.length > 0);
    setCanRedoState(undoManagerRef.current.redoStack.length > 0);
  }, []);

  
  // Create a new text element in Yjs and return its id
  function createTextElementAt(worldX: number, worldY: number) {
    const id = genId();
    ydocRef.current.transact(() => {
      const yEl = new Y.Map<any>();
      yEl.set('id', id);
      yEl.set('type', 'text');
      yEl.set('x', worldX);
      yEl.set('y', worldY);
      yEl.set('width', 200);
      yEl.set('height', 80);
      yEl.set('fontSize', 18);
      yEl.set('color', '#111410');
      yEl.set('opacity', 1);
      const ytext = new Y.Text();
      yEl.set('content', ytext);
      yTextsRef.current.set(id, yEl);
    });
    markDirty();
    return id;
  }

  const createPendingTextBox = useCallback(() => {
    if (!pendingTextCreate) return;
    const tid = createTextElementAt(pendingTextCreate.x, pendingTextCreate.y);
    setSelectedTextId(tid);
    setEditingTextId(tid);
    setPendingTextCreate(null);
  }, [pendingTextCreate]);

  function cssHexToRgb(hex: string): { r: number; g: number; b: number } {
    const normalized = hex.replace('#', '').trim();
    const expanded = normalized.length === 3
      ? normalized.split('').map((ch) => ch + ch).join('')
      : normalized;
    const padded = expanded.padEnd(6, '0').slice(0, 6);
    const int = Number.parseInt(padded, 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
    };
  }

  function rgbaFromHex(hex: string, alpha: number): string {
    const { r, g, b } = cssHexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getReadableTextColor(hex: string): string {
    const { r, g, b } = cssHexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? '#111410' : '#FFFFFF';
  }

  function getTextHitRegion(worldX: number, worldY: number): { id: string; region: 'delete' | 'resize' | 'body' } | null {
    const scale = Math.max(0.1, vpRef.current.scale);
    const pad = 2 / scale;
    const ctrlSize = 18 / scale;
    const ctrlGap = 3 / scale;
    const resizeSize = 18 / scale;

    const keys = Array.from(yTextsRef.current.keys()).reverse();
    for (const k of keys) {
      const el = yTextsRef.current.get(k);
      if (!el) continue;

      const ex = el.get('x') as number;
      const ey = el.get('y') as number;
      const ew = el.get('width') as number;
      const eh = el.get('height') as number;

      const ctrlY0 = ey - ctrlSize - ctrlGap;
      const ctrlY1 = ey - ctrlGap;
      const deleteX1 = ex + ew - pad;
      const deleteX0 = deleteX1 - ctrlSize;

      const inDelete =
        worldX >= deleteX0 && worldX <= deleteX1 &&
        worldY >= ctrlY0 && worldY <= ctrlY1;
      if (inDelete) return { id: k, region: 'delete' };

      const inBody = worldX >= ex && worldX <= ex + ew && worldY >= ey && worldY <= ey + eh;
      if (!inBody) continue;

      const inResize =
        worldX >= ex + ew - resizeSize && worldX <= ex + ew &&
        worldY >= ey + eh - resizeSize && worldY <= ey + eh;
      if (inResize) return { id: k, region: 'resize' };

      return { id: k, region: 'body' };
    }

    return null;
  }

  function hitTestTextAt(worldX: number, worldY: number): { id: string; mode: 'move' | 'resize' } | null {
    const hit = getTextHitRegion(worldX, worldY);
    if (!hit) return null;
    if (hit.region === 'delete') return null;
    return { id: hit.id, mode: hit.region === 'resize' ? 'resize' : 'move' };
  }

  function hitTestTextControlAt(worldX: number, worldY: number): { id: string; action: 'body' | 'resize' | 'delete' } | null {
    const hit = getTextHitRegion(worldX, worldY);
    if (!hit) return null;
    return { id: hit.id, action: hit.region };
  }

  function hitTestTextBody(worldX: number, worldY: number): { id: string } | null {
    const hit = getTextHitRegion(worldX, worldY);
    if (!hit || hit.region === 'delete') return null;
    return { id: hit.id };
  }

  function hitTestTextControlHover(worldX: number, worldY: number): 'delete' | 'resize' | null {
    const hit = getTextHitRegion(worldX, worldY);
    if (!hit) return null;
    if (hit.region === 'delete' || hit.region === 'resize') return hit.region;
    return null;
  }

  // ── Render loop ─────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    rafRef.current = requestAnimationFrame(render);
    if (!needsRender.current) return;
    needsRender.current = false;

    const vp = vpRef.current;

    // ── Layer 1: fixed background + dot grid (redraws only on resize/theme) ──
    if (bgNeedsRender.current) {
      bgNeedsRender.current = false;
      const bgCanvas = bgCanvasRef.current;
      if (bgCanvas) {
        const bgCtx = bgCanvas.getContext('2d');
        if (bgCtx) {
          const { bg } = getThemeColors();
          const W = bgCanvas.width;
          const H = bgCanvas.height;
          bgCtx.clearRect(0, 0, W, H);
          bgCtx.fillStyle = bg;
          bgCtx.fillRect(0, 0, W, H);

        }
      }
    }

    // ── Layer 2: strokes + text elements (transparent background) ───────────
    const strokeCanvas = canvasRef.current;
    if (strokeCanvas) {
      const ctx = strokeCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, strokeCanvas.width, strokeCanvas.height);

        const strokes: Stroke[] = [];
        yStrokesRef.current.forEach((yStroke: Y.Map<any>) => {
          const s: any = {
            id: yStroke.get('id'),
            tool: yStroke.get('tool'),
            color: yStroke.get('color'),
            width: yStroke.get('width'),
            opacity: yStroke.get('opacity'),
            timestamp: yStroke.get('timestamp') || 0,
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
        for (const s of strokes) renderStroke(ctx, s, vp);

        // Render text elements (on top of strokes)
        yTextsRef.current.forEach((yEl: Y.Map<any>) => {
          const type = yEl.get('type');
          if (type !== 'text') return;
          const isEditingThis = (yEl.get('id') as string) === editingTextIdRef.current;
          if (isEditingThis) return;
          const x = yEl.get('x') as number;
          const y = yEl.get('y') as number;
          const width = yEl.get('width') as number;
          const height = yEl.get('height') as number;
          const fontSize = yEl.get('fontSize') as number;
          const color = yEl.get('color') as string;
          const boxOpacity = Math.min(1, Math.max(0, (yEl.get('opacity') as number) ?? 1));
          const ytext = yEl.get('content') as Y.Text;
          const text = ytext ? ytext.toString() : '';
          const isSelected = (yEl.get('id') as string) === selectedTextIdRef.current;
          const textColor = getReadableTextColor(color);

          ctx.save();
          ctx.font = `${fontSize * vp.scale}px sans-serif`;
          const { x: sx, y: sy } = worldToScreen(x, y, vp);
          const boxW = width * vp.scale;
          const boxH = height * vp.scale;
          const lineHeight = fontSize * vp.scale * 1.2;
          const boxRenderH = Math.max(boxH, lineHeight + 8);
          const ctrlSizePx = 18;
          const ctrlGapPx = 3;
          const ctrlY = sy - ctrlSizePx - ctrlGapPx;
          ctx.fillStyle = rgbaFromHex(color, boxOpacity);
          ctx.strokeStyle = isSelected ? '#111410' : color;
          ctx.lineWidth = Math.max(1.25, (isSelected ? 2.4 : 1.5) * vp.scale);
          ctx.beginPath();
          ctx.roundRect(sx, sy, boxW, boxRenderH, 8 * vp.scale);
          ctx.fill();
          ctx.stroke();

          const mouse = localMouseScreenRef.current;
          const inBox = mouse !== null &&
            mouse.x >= sx && mouse.x <= sx + boxW &&
            mouse.y >= sy && mouse.y <= sy + boxRenderH;
          const inCtrlStrip = mouse !== null &&
            mouse.x >= sx && mouse.x <= sx + boxW &&
            mouse.y >= ctrlY && mouse.y <= sy;
          const isHovered = inBox || inCtrlStrip;
          if (isHovered) {
            const ctrlPad = 2;
            const deleteX = sx + boxW - ctrlSizePx - ctrlPad;

            // Delete icon button (tiny red X)
            ctx.fillStyle = '#d32727';
            ctx.beginPath();
            ctx.roundRect(deleteX, ctrlY, ctrlSizePx, ctrlSizePx, 4);
            ctx.fill();

            ctx.font = 'bold 10px Raleway, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline = 'middle';
            ctx.fillText('X', deleteX + 4.5, ctrlY + ctrlSizePx / 2);

            ctx.textBaseline = 'top';
          }

          // Hover controls temporarily change the font; reset before drawing text content.
          ctx.font = `${fontSize * vp.scale}px sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textBaseline = 'top';
          if (!isEditingThis) {
            const maxLines = Math.max(1, Math.floor((Math.max(boxH, lineHeight + 8) - 12) / lineHeight));
            const textX = sx + 6;
            const textWidth = Math.max(1, boxW - 12);
            let cursorY = sy + 6;
            let linesDrawn = 0;

            const paragraphs = text.split('\n');
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

              // Preserve blank lines between paragraphs if there is vertical room.
              if (paragraph === '' && linesDrawn < maxLines) {
                cursorY += lineHeight;
                linesDrawn += 1;
                if (linesDrawn >= maxLines) break;
              } else {
                // Account for explicit newline between paragraphs.
                if (linesDrawn < maxLines) {
                  cursorY += 0;
                }
              }
            }
          }

          const handleSizePx = 18;
          const handleX = sx + boxW - handleSizePx - 2;
          const handleY = sy + boxRenderH - handleSizePx - 2;
          ctx.fillStyle = 'rgba(17, 20, 16, 0.84)';
          ctx.beginPath();
          ctx.roundRect(handleX, handleY, handleSizePx, handleSizePx, 4);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.65)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(handleX + 6, handleY + handleSizePx - 6);
          ctx.lineTo(handleX + handleSizePx - 4, handleY + 4);
          ctx.moveTo(handleX + 9, handleY + handleSizePx - 4);
          ctx.lineTo(handleX + handleSizePx - 4, handleY + 9);
          ctx.stroke();
          ctx.restore();
        });
      }
    }

    // ── Layer 3: remote cursors ──────────────────────────────────────────────
    const cursorCanvas = cursorCanvasRef.current;
    if (cursorCanvas) {
      const ctx = cursorCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

        const nowMs = Date.now();
        const mouse = localMouseScreenRef.current;
        remoteCursorsRef.current.forEach((cursor, uid) => {
          if (nowMs - cursor.lastSeen > 3000) return;
          const { x: sx, y: sy } = worldToScreen(cursor.x, cursor.y, vp);
          const W = cursorCanvas.width;
          const H = cursorCanvas.height;
          if (sx < 0 || sx > W || sy < 0 || sy > H) return;
          const col = userColor(uid);

          ctx.save();
          ctx.fillStyle = col;
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 1.5;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(sx,       sy);
          ctx.lineTo(sx,       sy + 14);
          ctx.lineTo(sx + 3.5, sy + 10.5);
          ctx.lineTo(sx + 6.5, sy + 17);
          ctx.lineTo(sx + 8.5, sy + 16);
          ctx.lineTo(sx + 5.5, sy + 9.5);
          ctx.lineTo(sx + 11,  sy + 9.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          const hovered = mouse !== null &&
            mouse.x >= sx - 4 && mouse.x <= sx + 15 &&
            mouse.y >= sy - 4 && mouse.y <= sy + 21;
          if (hovered) {
            ctx.font = 'bold 11px Raleway, sans-serif';
            const label = cursor.username;
            const tw = ctx.measureText(label).width;
            const pad = 5;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.roundRect(sx + 14 - pad, sy + 1, tw + pad * 2, 17, 4);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText(label, sx + 14, sy + 13);
          }
          ctx.restore();
        });
      }
    }
  }, []);

  // Start render loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  useEffect(() => {
    editingTextIdRef.current = editingTextId;
  }, [editingTextId]);

  useEffect(() => {
    selectedTextIdRef.current = selectedTextId;
  }, [selectedTextId]);

  useEffect(() => {
    if (!selectedTextId) return;
    skipNextTextStyleWriteRef.current = true;
    skipNextTextFontWriteRef.current = true;
    const yEl = yTextsRef.current.get(selectedTextId);
    if (!yEl) return;
    const boxColor = (yEl.get('color') as string) || '#111410';
    const boxOpacity = (yEl.get('opacity') as number) ?? 1;
    const boxFontSize = (yEl.get('fontSize') as number) ?? 18;
    if (color !== boxColor) setColor(boxColor);
    if (opacity !== boxOpacity) setOpacity(boxOpacity);
    if (fontSize !== boxFontSize) setFontSize(boxFontSize);
  }, [selectedTextId]);

  useEffect(() => {
    if (!selectedTextId || editingTextIdRef.current === selectedTextId) return;
    if (skipNextTextStyleWriteRef.current) {
      skipNextTextStyleWriteRef.current = false;
      return;
    }
    const yEl = yTextsRef.current.get(selectedTextId);
    if (!yEl) return;
    const nextColor = color;
    const nextOpacity = opacity;
    if (yEl.get('color') === nextColor && (yEl.get('opacity') as number) === nextOpacity) return;
    ydocRef.current.transact(() => {
      yEl.set('color', nextColor);
      yEl.set('opacity', nextOpacity);
    });
    markDirty();
  }, [color, opacity, markDirty, selectedTextId]);

  useEffect(() => {
    if (!selectedTextId || editingTextIdRef.current === selectedTextId) return;
    if (skipNextTextFontWriteRef.current) {
      skipNextTextFontWriteRef.current = false;
      return;
    }
    const yEl = yTextsRef.current.get(selectedTextId);
    if (!yEl) return;
    if ((yEl.get('fontSize') as number) === fontSize) return;
    ydocRef.current.transact(() => {
      yEl.set('fontSize', fontSize);
    });
    markDirty();
  }, [fontSize, markDirty, selectedTextId]);

  useEffect(() => {
    if (tool !== 'text' && pendingTextCreate) {
      setPendingTextCreate(null);
    }
  }, [tool, pendingTextCreate]);

  // ── Canvas resize ────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    let centered = false;

    function sizeCanvas() {
      const wr = wrapperRef.current;
      if (!wr) return;
      const { width, height } = wr.getBoundingClientRect();
      if (width < 10 || height < 10) return;
      const w = Math.floor(width);
      const h = Math.floor(height);
      [bgCanvasRef.current, canvasRef.current, cursorCanvasRef.current].forEach(cv => {
        if (cv) { cv.width = w; cv.height = h; }
      });
      if (!centered) {
        vpRef.current.x = w / 2;
        vpRef.current.y = h / 2;
        centered = true;
      }
      bgNeedsRender.current = true;
      needsRender.current = true;
    }

    sizeCanvas();

    const ro = new ResizeObserver(sizeCanvas);
    const wr = wrapperRef.current;
    if (wr) ro.observe(wr);

    window.addEventListener('resize', sizeCanvas);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sizeCanvas);
    };
  }, [loading]);

  // Redraw background when the user changes the app theme
  useEffect(() => {
    const mo = new MutationObserver(() => markBgDirty());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [markBgDirty]);

  // ── Load board metadata ───────────────────────────────────────────────────────
  // Two paths:
  //   ?collab=CODE  → guest/invited user, load via public join endpoint
  //   no param      → board owner, load via protected endpoint
  useEffect(() => {
    const collabCode = searchParams.get('collab');

    if (collabCode) {
      boardService.joinBoardByCode(collabCode)
        .then(data => {
          if (data._id || data.id) {
            const bid = data._id || data.id;
            setBoardId(bid);
            setBoardTitle(data.title || 'Untitled Board');
            setJoinCode(collabCode);
            // Hydrate the Yjs doc from the DB state (framed format)
            for (const update of parseFramedYjsUpdates(data.yjsUpdate)) {
              Y.applyUpdate(ydocRef.current, update);
            }
            markDirty();
          } else {
            setError('Invalid room code');
          }
        })
        .catch(() => setError('Invalid room code'))
        .finally(() => setLoading(false));
    } else if (id) {
      boardService.getBoardById(id)
        .then(data => {
          if (data._id || data.id) {
            const bid = data._id || data.id;
            setBoardId(bid);
            setBoardTitle(data.title || 'Untitled Board');
            // Restore the board's stable join code for the collab button
            if (data.joinCode) setJoinCode(data.joinCode);
            // Hydrate the Yjs doc from the DB state (framed format)
            for (const update of parseFramedYjsUpdates(data.yjsUpdate)) {
              Y.applyUpdate(ydocRef.current, update);
            }
            markDirty();
          } else {
            setError('Invalid board ID');
          }
        })
        .catch(err => {
          if (err.response?.status === 403) {
            setError('Forbidden: You do not have access to this board.');
          } else {
            setError('Could not connect to server');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps -- searchParams intentionally excluded

  // Keep joinCodeRef in sync so the WS onclose closure always sees the latest code
  useEffect(() => { joinCodeRef.current = joinCode; }, [joinCode]);

  // ── Setup Yjs Subscriptions ───────────────────────────────────────────────────
  useEffect(() => {
    if (!boardId) return;

    // Listen for any deep changes in the CRDT to trigger a re-render
    const observer = () => markDirty();
    yStrokesRef.current.observeDeep(observer);
    yTextsRef.current.observeDeep(observer);

    // Listen for UndoManager changes to update button states
    undoManagerRef.current.on('stack-item-added', syncUndoState);
    undoManagerRef.current.on('stack-item-popped', syncUndoState);

    return () => {
      yStrokesRef.current.unobserveDeep(observer);
      yTextsRef.current.unobserveDeep(observer);
    };
  }, [boardId, markDirty, syncUndoState]);

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    undoManagerRef.current.undo();
  }, []);

  const redo = useCallback(() => {
    undoManagerRef.current.redo();
  }, []);

  // ── Zoom around a screen point ────────────────────────────────────────────────
  const zoomAt = useCallback((screenX: number, screenY: number, delta: number) => {
    const vp = vpRef.current;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, vp.scale * (1 + delta)));
    const ratio = newScale / vp.scale;
    vpRef.current = {
      scale: newScale,
      x: screenX - ratio * (screenX - vp.x),
      y: screenY - ratio * (screenY - vp.y),
    };
    setZoom(newScale);
    markDirty();
  }, [markDirty]);

  // ── Fit-to-screen ─────────────────────────────────────────────────────────────
  const fitToScreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const strokes: Stroke[] = [];
    yStrokesRef.current.forEach((yStroke: Y.Map<any>) => {
      const s: any = {};
      const yPoints = yStroke.get('points') as Y.Array<number> | undefined;
      if (yPoints) {
        s.points = yPoints.toArray();
      } else {
        s.x0 = yStroke.get('x0'); s.y0 = yStroke.get('y0');
        s.x1 = yStroke.get('x1'); s.y1 = yStroke.get('y1');
      }
      strokes.push(s);
    });

    if (strokes.length === 0) {
      vpRef.current = { x: 0, y: 0, scale: 1 };
      setZoom(1);
      markDirty();
      return;
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of strokes) {
      if (s.points) {
        for (let i = 0; i < s.points.length; i += 2) {
          minX = Math.min(minX, s.points[i]);
          minY = Math.min(minY, s.points[i + 1]);
          maxX = Math.max(maxX, s.points[i]);
          maxY = Math.max(maxY, s.points[i + 1]);
        }
      } else {
        minX = Math.min(minX, s.x0!, s.x1!);
        minY = Math.min(minY, s.y0!, s.y1!);
        maxX = Math.max(maxX, s.x0!, s.x1!);
        maxY = Math.max(maxY, s.y0!, s.y1!);
      }
    }
    const pad = 80;
    const W = canvas.width - pad * 2;
    const H = canvas.height - pad * 2;
    const contentW = maxX - minX || 1;
    const contentH = maxY - minY || 1;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(W / contentW, H / contentH)));
    vpRef.current = {
      scale: newScale,
      x: pad + (W - contentW * newScale) / 2 - minX * newScale,
      y: pad + (H - contentH * newScale) / 2 - minY * newScale,
    };
    setZoom(newScale);
    markDirty();
  }, [markDirty]);

  // ── Get canvas-relative pointer position ─────────────────────────────────────
  const getCanvasPos = useCallback((e: PointerEvent | MouseEvent | Touch): { sx: number; sy: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      sx: e.clientX - rect.left,
      sy: e.clientY - rect.top,
    };
  }, []);

  // ── Pointer down ──────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    const { sx, sy } = getCanvasPos(e.nativeEvent);
    const vp = vpRef.current;
    const effectiveTool = spaceDown.current ? 'pan' : tool;

    if (e.button === 0) {
      const { x: wx, y: wy } = screenToWorld(sx, sy, vp);
      const bodyHit = hitTestTextBody(wx, wy);
      const controlHit = hitTestTextControlAt(wx, wy);
      if (controlHit) {
        setSelectedTextId(controlHit.id);
        setPendingTextCreate(null);

        if (controlHit.action === 'delete') {
          ydocRef.current.transact(() => {
            yTextsRef.current.delete(controlHit.id);
          });
          setSelectedTextId((current) => (current === controlHit.id ? null : current));
          if (editingTextIdRef.current === controlHit.id) {
            setEditingTextId(null);
          }
          markDirty();
          return;
        }

        if (controlHit.action === 'resize') {
          const yEl = yTextsRef.current.get(controlHit.id);
          if (!yEl) return;
          activeTextTransform.current = {
            id: controlHit.id,
            mode: 'resize',
            startWx: wx,
            startWy: wy,
            startX: yEl.get('x') as number,
            startY: yEl.get('y') as number,
            startW: yEl.get('width') as number,
            startH: yEl.get('height') as number,
          };
          return;
        }

      }

      if (bodyHit && editingTextIdRef.current !== bodyHit.id) {
        const yEl = yTextsRef.current.get(bodyHit.id);
        if (yEl) {
          setSelectedTextId(bodyHit.id);
          activeTextTransform.current = {
            id: bodyHit.id,
            mode: 'move',
            startWx: wx,
            startWy: wy,
            startX: yEl.get('x') as number,
            startY: yEl.get('y') as number,
            startW: yEl.get('width') as number,
            startH: yEl.get('height') as number,
          };
          setPendingTextCreate(null);
          return;
        }
      }

      setSelectedTextId(null);
    }

    if (effectiveTool === 'pan' || e.button === 1 || e.button === 2) {
      isPanning.current = true;
      panStart.current = { px: sx, py: sy, vpx: vp.x, vpy: vp.y };
      return;
    }

    if (e.button !== 0) return;

    
    const { x: wx, y: wy } = screenToWorld(sx, sy, vp);

    // If text tool, create a text element and open editor, then return
    if (effectiveTool === 'text') {
      const hit = hitTestTextAt(wx, wy);
      if (hit) {
        setSelectedTextId(hit.id);
        setPendingTextCreate(null);
        const yEl = yTextsRef.current.get(hit.id);
        if (!yEl) return;
        activeTextTransform.current = {
          id: hit.id,
          mode: hit.mode,
          startWx: wx,
          startWy: wy,
          startX: yEl.get('x') as number,
          startY: yEl.get('y') as number,
          startW: yEl.get('width') as number,
          startH: yEl.get('height') as number,
        };
        return;
      }

      setPendingTextCreate({ x: wx, y: wy });
      // do not start a stroke
      return;
    }

    if (pendingTextCreate) {
      setPendingTextCreate(null);
    }

    // Start drawing a stroke
    isDrawing.current = true;

    // Create the stroke in Yjs
    const sid = genId();
    activeStrokeId.current = sid;

    ydocRef.current.transact(() => {
      const yStroke = new Y.Map<any>();
      yStroke.set('id', sid);
      yStroke.set('tool', effectiveTool);
      yStroke.set('color', effectiveTool === 'eraser' ? '#000000' : color);
      yStroke.set('width', lineWidth / vpRef.current.scale);
      yStroke.set('opacity', effectiveTool === 'eraser' ? 1 : opacity);
      yStroke.set('timestamp', Date.now());

      if (effectiveTool === 'pen' || effectiveTool === 'eraser') {
        const yPoints = new Y.Array<number>();
        yPoints.push([wx, wy]);
        yStroke.set('points', yPoints);
      } else {
        yStroke.set('x0', wx); yStroke.set('y0', wy);
        yStroke.set('x1', wx); yStroke.set('y1', wy);
      }

      yStrokesRef.current.set(sid, yStroke);
    });

  }, [tool, color, lineWidth, opacity, getCanvasPos, pendingTextCreate]);

  // ── Pointer move ──────────────────────────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const { sx, sy } = getCanvasPos(e.nativeEvent);

    // Track local mouse screen position for cursor label proximity detection
    localMouseScreenRef.current = { x: sx, y: sy };
    markDirty();

    const hoverWorld = screenToWorld(sx, sy, vpRef.current);
    const hoverControl = hitTestTextControlHover(hoverWorld.x, hoverWorld.y);
    if (canvasRef.current) {
      if (hoverControl) {
        canvasRef.current.style.cursor = 'pointer';
      } else if (spaceDown.current) {
        canvasRef.current.style.cursor = isPanning.current ? 'grabbing' : 'grab';
      } else {
        canvasRef.current.style.cursor = getCursor(tool);
      }
    }

    // Re-render when mouse enters or leaves the cursor's hover area so the label snaps on/off
    const vp = vpRef.current;
    remoteCursorsRef.current.forEach((cursor) => {
      const { x: cx, y: cy } = worldToScreen(cursor.x, cursor.y, vp);
      const nearX = sx >= cx - 8 && sx <= cx + 19;
      const nearY = sy >= cy - 8 && sy <= cy + 25;
      if (nearX && nearY) needsRender.current = true;
    });

    // Throttled cursor broadcast (~30fps)
    const nowMs = Date.now();
    if (wsRef.current?.readyState === WebSocket.OPEN && nowMs - lastCursorSendRef.current > 33) {
      lastCursorSendRef.current = nowMs;
      const { x, y } = screenToWorld(sx, sy, vpRef.current);
      wsRef.current.send(JSON.stringify({ type: 'cursor', x, y }));
    }

    if (isPanning.current && panStart.current) {
      const ps = panStart.current;
      vpRef.current = {
        ...vpRef.current,
        x: ps.vpx + (sx - ps.px),
        y: ps.vpy + (sy - ps.py),
      };
      markDirty();
      return;
    }

    if (activeTextTransform.current) {
      const { x: wx, y: wy } = screenToWorld(sx, sy, vpRef.current);
      const active = activeTextTransform.current;
      const yEl = yTextsRef.current.get(active.id);
      if (!yEl) return;

      ydocRef.current.transact(() => {
        if (active.mode === 'move') {
          yEl.set('x', active.startX + (wx - active.startWx));
          yEl.set('y', active.startY + (wy - active.startWy));
        } else {
          yEl.set('width', Math.max(80, active.startW + (wx - active.startWx)));
          yEl.set('height', Math.max(48, active.startH + (wy - active.startWy)));
        }
      });
      markDirty();
      return;
    }

    if (!isDrawing.current || !activeStrokeId.current) return;

    const { x: wx, y: wy } = screenToWorld(sx, sy, vpRef.current);
    
    const yStroke = yStrokesRef.current.get(activeStrokeId.current);
    if (!yStroke) return;

    const currentTool = yStroke.get('tool');

    if (currentTool === 'pen' || currentTool === 'eraser') {
      const yPoints = yStroke.get('points') as Y.Array<number>;
      yPoints.push([wx, wy]);
    } else {
      yStroke.set('x1', wx);
      yStroke.set('y1', wy);
    }

  }, [getCanvasPos, markDirty, tool]);

  // ── Pointer up ────────────────────────────────────────────────────────────────
  const onPointerUp = useCallback((_e: React.PointerEvent<HTMLCanvasElement>) => {
    localMouseScreenRef.current = null;
    markDirty();
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
      return;
    }

    if (activeTextTransform.current) {
      activeTextTransform.current = null;
      return;
    }

    if (!isDrawing.current || !activeStrokeId.current) return;
    isDrawing.current = false;
    activeStrokeId.current = null;

  }, [markDirty]);

  // Double-click toggles edit mode for the clicked text box.
  const onCanvasDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { sx, sy } = getCanvasPos(e.nativeEvent as unknown as PointerEvent);
    const { x: wx, y: wy } = screenToWorld(sx, sy, vpRef.current);

    const hit = hitTestTextAt(wx, wy);
    if (hit) {
      setSelectedTextId(hit.id);
      setEditingTextId((current) => {
        const next = current === hit.id ? null : hit.id;
        editingTextIdRef.current = next;
        return next;
      });
      markDirty();
      return;
    }

    editingTextIdRef.current = null;
    setEditingTextId(null);
    markDirty();
  }, [getCanvasPos, markDirty]);

  // ── Wheel zoom ────────────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { sx, sy } = getCanvasPos(e.nativeEvent);

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) {
      vpRef.current = {
        ...vpRef.current,
        x: vpRef.current.x - e.deltaX,
        y: vpRef.current.y - e.deltaY,
      };
      markDirty();
    } else if (e.shiftKey) {
      vpRef.current = { ...vpRef.current, x: vpRef.current.x - e.deltaY };
      markDirty();
    } else {
      const direction = e.deltaY > 0 ? -1 : 1;
      zoomAt(sx, sy, direction * 0.05);
    }
  }, [getCanvasPos, zoomAt, markDirty]);

  // ── Touch support ─────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      lastTouches.current = [e.touches[0], e.touches[1]];
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastTouches.current?.length === 2) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const [la, lb] = lastTouches.current;

      const prevDist = Math.hypot(la.clientX - lb.clientX, la.clientY - lb.clientY);
      const curDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const midX = (a.clientX + b.clientX) / 2;
      const midY = (a.clientY + b.clientY) / 2;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();

      zoomAt(midX - rect.left, midY - rect.top, (curDist - prevDist) * 0.01);

      const dxA = a.clientX - la.clientX;
      const dyA = a.clientY - la.clientY;
      vpRef.current = {
        ...vpRef.current,
        x: vpRef.current.x + dxA,
        y: vpRef.current.y + dyA,
      };

      lastTouches.current = [a, b];
      markDirty();
    }
  }, [zoomAt, markDirty]);

  const onTouchEnd = useCallback(() => {
    lastTouches.current = null;
  }, []);

  // touchmove needs a native non-passive listener so preventDefault() works (React makes it passive)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => canvas.removeEventListener('touchmove', onTouchMove);
  }, [onTouchMove, loading]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' && !e.repeat) {
        spaceDown.current = true;
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

      if (e.key === 'v' || e.key === 'V') setTool('pan');
      if (e.key === 'p' || e.key === 'P') setTool('pen');
      if (e.key === 'e' || e.key === 'E') setTool('eraser');
      if (e.key === 't' || e.key === 'T') setTool('text');
      if (e.key === 'l' || e.key === 'L') setTool('line');
      if (e.key === 'r' || e.key === 'R') setTool('rect');
      if (e.key === 'o' || e.key === 'O') setTool('circle');
      if (e.key === '=' || e.key === '+') {
        const c = canvasRef.current!;
        zoomAt(c.width / 2, c.height / 2, 0.15);
      }
      if (e.key === '-' || e.key === '_') {
        const c = canvasRef.current!;
        zoomAt(c.width / 2, c.height / 2, -0.15);
      }
      if (e.key === '0') fitToScreen();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDown.current = false;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = getCursor(tool);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [undo, redo, fitToScreen, zoomAt, tool]);

  // ── Clear canvas ──────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    ydocRef.current.transact(() => {
        // Collect all keys then delete them individually to properly log actions in Yjs
        const keys = Array.from(yStrokesRef.current.keys());
        keys.forEach(key => yStrokesRef.current.delete(key));

        const textKeys = Array.from(yTextsRef.current.keys());
        textKeys.forEach(key => yTextsRef.current.delete(key));
    });
    setPendingTextCreate(null);
    setSelectedTextId(null);
    markDirty();
  }, [markDirty]);

  // ── Export Dialog ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  const handleExport = useCallback((format: 'png' | 'jpg' | 'svg' | 'pdf') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get strokes for SVG export
    const strokes: Stroke[] = [];
    yStrokesRef.current.forEach((yStroke: Y.Map<any>) => {
      const s: any = {
        id: yStroke.get('id'),
        tool: yStroke.get('tool'),
        color: yStroke.get('color'),
        width: yStroke.get('width'),
        opacity: yStroke.get('opacity'),
        timestamp: yStroke.get('timestamp') || 0,
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

    const filename = `${boardTitle}.${format}`;

    if (format === 'png' || format === 'jpg') {
      // Create temporary canvas with background
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const ctx = tmp.getContext('2d')!;
      ctx.fillStyle = '#F8F6F0';
      ctx.fillRect(0, 0, tmp.width, tmp.height);
      ctx.drawImage(canvas, 0, 0);

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpg' ? 0.9 : undefined;

      const a = document.createElement('a');
      a.download = filename;
      a.href = tmp.toDataURL(mimeType, quality);
      a.click();
    } else if (format === 'svg') {
      // Generate SVG from strokes
      const vp = vpRef.current;
      let svgContent = `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">`;
      svgContent += `<rect width="100%" height="100%" fill="#F8F6F0"/>`;

      strokes.forEach(stroke => {
        const opacity = stroke.opacity ?? 1;
        let pathData = '';

        if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
          const pts = stroke.points!;
          if (pts && pts.length >= 2) {
            const p0 = worldToScreen(pts[0], pts[1], vp);
            pathData = `M ${p0.x} ${p0.y}`;
            for (let i = 2; i < pts.length; i += 2) {
              const p = worldToScreen(pts[i], pts[i + 1], vp);
              pathData += ` L ${p.x} ${p.y}`;
            }
          }
        } else if (stroke.tool === 'line') {
          const a = worldToScreen(stroke.x0!, stroke.y0!, vp);
          const b = worldToScreen(stroke.x1!, stroke.y1!, vp);
          pathData = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
        } else if (stroke.tool === 'rect') {
          const a = worldToScreen(stroke.x0!, stroke.y0!, vp);
          const b = worldToScreen(stroke.x1!, stroke.y1!, vp);
          const w = b.x - a.x;
          const h = b.y - a.y;
          pathData = `M ${a.x} ${a.y} L ${a.x + w} ${a.y} L ${a.x + w} ${a.y + h} L ${a.x} ${a.y + h} Z`;
        } else if (stroke.tool === 'circle') {
          const a = worldToScreen(stroke.x0!, stroke.y0!, vp);
          const b = worldToScreen(stroke.x1!, stroke.y1!, vp);
          const rx = Math.abs(b.x - a.x) / 2;
          const ry = Math.abs(b.y - a.y) / 2;
          const cx = a.x + (b.x - a.x) / 2;
          const cy = a.y + (b.y - a.y) / 2;
          pathData = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
        }

        if (pathData) {
          const strokeColor = stroke.tool === 'eraser' ? 'none' : stroke.color;
          const strokeWidth = stroke.width * vp.scale;
          svgContent += `<path d="${pathData}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
        }
      });

      svgContent += '</svg>';

      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = filename;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Generate PDF using jsPDF
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      // Create temporary canvas with background
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const ctx = tmp.getContext('2d')!;
      ctx.fillStyle = '#F8F6F0';
      ctx.fillRect(0, 0, tmp.width, tmp.height);
      ctx.drawImage(canvas, 0, 0);

      const imgData = tmp.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
    }

    setShowExportDialog(false);
  }, [boardTitle]);

  // ── Copy room code ────────────────────────────────────────────────────────────
  const handleCopyCode = useCallback(() => {
    if (!joinCode) return;
    navigator.clipboard.writeText(joinCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [joinCode]);

  // ── Collab session connection ─────────────────────────────────────────────────
  const connectToCollabServer = useCallback((sessionId: string) => {
    if (wsRef.current) return; // already connected

    // NOTE: do NOT call boardService.setJoinCode here.
    // For owners, the code is persisted by handleCollab before this is called.
    // For guests, this is a protected endpoint they cannot call (would return 401).

    // Use socket.io fallback if VITE_USE_SOCKETIO is true, otherwise use WebSocket
    const ws = createYjsConnection({
      useSocketIO: import.meta.env.VITE_USE_SOCKETIO === 'true',
    });
    wsRef.current = ws;

    ws.onopen = () => {
      const userId   = user?.id       ?? anonIdRef.current;
      const username = user?.username ?? `Anon${anonSuffixRef.current}`;
      ws.send(JSON.stringify({ type: 'join', sessionId, userId, username }));
      setStatusMsg('Connecting to room...');
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);
        if (msg.type === 'joined' && msg.ok) {
          reconnectAttemptsRef.current = 0;
          setCollabActive(true);
          setStatusMsg('Collab active');
          setTimeout(() => setStatusMsg(''), 2500);
          // Send our full Yjs state so existing peers can apply it
          const state = Y.encodeStateAsUpdate(ydocRef.current);
          ws.send(state.buffer.slice(state.byteOffset, state.byteOffset + state.byteLength) as ArrayBuffer);
        } else if (msg.type === 'userCount') {
          // Re-broadcast full state whenever a new peer joins so they hydrate
          if (msg.count > 1 && ws.readyState === WebSocket.OPEN) {
            const state = Y.encodeStateAsUpdate(ydocRef.current);
            ws.send(state.buffer.slice(state.byteOffset, state.byteOffset + state.byteLength) as ArrayBuffer);
          }
          setUserCount(msg.count);
        } else if (msg.type === 'cursor') {
          remoteCursorsRef.current.set(msg.userId, {
            x: msg.x,
            y: msg.y,
            username: msg.username,
            lastSeen: Date.now(),
          });
          needsRender.current = true;
        } else if (msg.type === 'error') {
          setStatusMsg(msg.message || 'Connection error');
          setTimeout(() => setStatusMsg(''), 3000);
        }
      } else {
        // Binary — Yjs update from a peer; tag 'remote' to suppress echo
        const update = new Uint8Array(event.data);
        Y.applyUpdate(ydocRef.current, update, 'remote');
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setCollabActive(false);
      setUserCount(1);
      const code = joinCodeRef.current;
      if (code) {
        // Exponential backoff reconnect (1s → 2s → 4s … max 30s)
        const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttemptsRef.current));
        reconnectAttemptsRef.current++;
        setStatusMsg(`Reconnecting in ${Math.round(delay / 1000)}s…`);
        reconnectTimerRef.current = setTimeout(() => {
          connectToCollabServer(code);
        }, delay);
      } else {
        setStatusMsg('Disconnected from room');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
      setStatusMsg('Connection error');
      setTimeout(() => setStatusMsg(''), 3000);
    };
  }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always-on Yjs update forwarder — checks WS state internally, no dependency on collabActive
  // Also debounces a full-state save to the DB so non-collab sessions persist too
  useEffect(() => {
    if (!boardId) return;

    let saveTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleSave = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const snapshot = Y.encodeStateAsUpdate(ydocRef.current);
        boardService.saveYjsState(boardId, snapshot).catch(() => {});
      }, SNAPSHOT_DEBOUNCE_MS);
    };

    const onUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== 'remote' && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(update.buffer.slice(update.byteOffset, update.byteOffset + update.byteLength) as ArrayBuffer);
      }
      if (origin !== 'remote') scheduleSave();
    };
    const flushSave = () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      const snapshot = Y.encodeStateAsUpdate(ydocRef.current);
      boardService.saveYjsState(boardId, snapshot).catch(() => {});
    };

    // keepalive survives page reload/close; axios requests are cancelled on unload
    const flushSaveOnUnload = () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      const snapshot = Y.encodeStateAsUpdate(ydocRef.current);
      boardService.saveYjsStateOnUnload(boardId, snapshot);
    };

    window.addEventListener('beforeunload', flushSaveOnUnload);

    ydocRef.current.on('update', onUpdate);
    return () => {
      ydocRef.current.off('update', onUpdate);
      window.removeEventListener('beforeunload', flushSaveOnUnload);
      flushSave(); // flush on React unmount (navigating away)
    };
  }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tear down collab cleanly — clears joinCodeRef BEFORE closing so the
  // onclose handler sees no code and skips the exponential-backoff reconnect.
  // Without this, onclose fires async after unmount and spawns an orphaned connection.
  const disconnectCollab = useCallback(() => {
    joinCodeRef.current = undefined;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    remoteCursorsRef.current.clear();
    needsRender.current = true;
  }, []);

  // Close WebSocket immediately when browser back/forward button is pressed
  useEffect(() => {
    window.addEventListener('popstate', disconnectCollab);
    return () => window.removeEventListener('popstate', disconnectCollab);
  }, [disconnectCollab]);

  // Cleanup WebSocket and reconnect timer on unmount
  useEffect(() => {
    return () => {
      disconnectCollab();
    };
  }, []);

  // Auto-connect when arriving via ?collab=CODE (must be after connectToCollabServer is defined)
  useEffect(() => {
    if (!boardId || !joinCode) return;
    const collabCode = searchParams.get('collab');
    if (collabCode && collabCode === joinCode) {
      connectToCollabServer(joinCode);
    }
  }, [boardId, joinCode, connectToCollabServer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect using the board's stable joinCode (set by owner or loaded from board data)
  const handleCollab = useCallback(async () => {
    if (joinCode) {
      connectToCollabServer(joinCode);
      return;
    }
    // No join code yet — generate one, persist it to MongoDB, then connect
    const newCode = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('').toUpperCase();
    try {
      await boardService.setJoinCode(boardId!, newCode);
      setJoinCode(newCode);
      connectToCollabServer(newCode);
    } catch {
      setStatusMsg('Failed to create collab room');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  }, [joinCode, boardId, connectToCollabServer]);

  // ── Cursor helper ─────────────────────────────────────────────────────────────
  // Solid black arrow cursor matching the navigation-arrow style
  const ARROW_CURSOR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M2 1 L2 15 L5.5 11.5 L8.5 18 L10.5 17 L7.5 10.5 L13 10.5 Z' fill='%23000000'/%3E%3C/svg%3E\") 2 1, auto";

  function getCursor(t: Tool): string {
    if (t === 'pan') return 'grab';
    if (t === 'eraser') return 'cell';
    if (t === 'text') return 'text';
    return ARROW_CURSOR;
  }

  // ── Loading / error screens ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-serif text-primary italic text-sm">Joining room…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-base-200 border border-base-300 shadow-xl max-w-sm text-center">
          <div className="text-4xl">🔒</div>
          <h2 className="font-['Playfair_Display',Georgia,serif] text-xl text-base-content font-bold">Room Not Found</h2>
          <p className="font-serif text-sm text-secondary italic">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-content font-bold text-xs uppercase tracking-widest hover:bg-primary/80 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const zoomPct = Math.round(zoom * 100);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen overflow-hidden select-none bg-base-100"
      style={{ fontFamily: "'Raleway', sans-serif" }}
    >
      <WhiteboardToolbar
        tool={tool}
        setTool={setTool}
        undo={undo}
        redo={redo}
        canUndoState={canUndoState}
        canRedoState={canRedoState}
        handleClear={handleClear}
        handleDownload={handleDownload}
        onBack={() => {
          disconnectCollab();
          navigate('/dashboard');
        }}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <WhiteboardHeader 
          boardTitle={boardTitle}
          statusMsg={statusMsg}
          color={color}
          setColor={setColor}
          tool={tool}
          setTool={setTool}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          opacity={opacity}
          setOpacity={setOpacity}
          fontSize={fontSize}
          setFontSize={setFontSize}
          hasTextSelection={selectedTextId !== null}
          zoomPct={zoomPct}
          zoomAt={zoomAt}
          fitToScreen={fitToScreen}
          handleCopyCode={handleCopyCode}
          onCollab={handleCollab}
          codeCopied={codeCopied}
          joinCode={joinCode}
          userCount={userCount}
          canvasRef={canvasRef}
        />

        <div ref={wrapperRef} className="relative flex-1 overflow-hidden">
          {/* Layer 1: background + dot grid */}
          <canvas ref={bgCanvasRef} className="absolute inset-0" style={{ zIndex: 0 }} />

          {/* Layer 2: strokes + text elements — transparent, receives all pointer events */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            style={{
              zIndex: 1,
              cursor: spaceDown.current
                ? (isPanning.current ? 'grabbing' : 'grab')
                : getCursor(tool),
              touchAction: 'none',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onContextMenu={e => e.preventDefault()}
            onDoubleClick={onCanvasDoubleClick}
          />

          {/* Layer 3: remote cursors — pointer-events disabled so clicks pass through */}
          <canvas
            ref={cursorCanvasRef}
            className="absolute inset-0"
            style={{ zIndex: 2, pointerEvents: 'none' }}
          />

          <TextEditorOverlay
            yElement={ editingTextId ? (yTextsRef.current.get(editingTextId) as Y.Map<any>) : null }
            worldToScreen={worldToScreen}
            vp={vpRef.current}
            onClose={() => {
              editingTextIdRef.current = null;
              setEditingTextId(null);
              markDirty();
            }}
          />

          {pendingTextCreate && tool === 'text' && (() => {
            const anchor = worldToScreen(pendingTextCreate.x, pendingTextCreate.y, vpRef.current);
            return (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  createPendingTextBox();
                }}
                className="absolute z-40 rounded-full border border-[#2D3A27]/30 bg-[#F8F6F0] px-3 py-1 text-[11px] font-semibold text-[#2D3A27] shadow-md hover:bg-[#EAE5D7]"
                style={{
                  left: Math.round(anchor.x),
                  top: Math.round(anchor.y - 34),
                }}
              >
                Create text box here
              </button>
            );
          })()}

          <WhiteboardHUD tool={tool} />
        </div>
      </div>

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
      />
    </div>
  );
}