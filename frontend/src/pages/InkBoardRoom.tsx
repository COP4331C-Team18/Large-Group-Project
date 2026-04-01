// src/pages/InkBoardRoom.tsx
// ── Figma-style infinite canvas whiteboard ────────────────────────────────────
// Features:
//   • Infinite pan (Space+drag or middle-mouse) with momentum
//   • Smooth pinch-zoom and scroll-wheel zoom, centered on cursor
//   • All drawing tools: pen, eraser, line, rect, circle, arrow, text
//   • Coordinates stored in world-space → viewport transform applied at render
//   • Full undo/redo stack (local-only, non-destructive)
//   • Socket.io real-time sync with replay on join
//   • Debounced snapshot saved to server
//   • Touch support (single-finger draw, two-finger pan/pinch)
//   • Keyboard shortcuts: V=select/pan, P=pen, E=eraser, L=line,
//     R=rect, O=oval, Ctrl+Z=undo, Ctrl+Y/Ctrl+Shift+Z=redo,
//     Space (hold)=pan mode, +/-=zoom, 0=fit

import {
  useEffect, useRef, useState, useCallback,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  Pen, Eraser, Minus, Square, Circle, Trash2,
  ArrowLeft, Users, Copy, Check, Undo2, Redo2,
  Download, Pipette, Minus as MinusIcon, Plus,
  Move, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tool = 'pan' | 'pen' | 'eraser' | 'line' | 'rect' | 'circle';

/** All coordinates in WORLD space (invariant to pan/zoom) */
interface Stroke {
  id: string;
  tool: Exclude<Tool, 'pan'>;
  // For pen/eraser: array of [x,y] pairs
  points?: number[];
  // For shapes: start & end
  x0?: number; y0?: number;
  x1?: number; y1?: number;
  color: string;
  width: number;
  opacity: number;
}

interface Viewport {
  x: number;   // pan offset in screen pixels
  y: number;
  scale: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SOCKET_URL =
  import.meta.env.MODE !== 'development'
    ? 'https://inkboard.xyz'
    : 'http://localhost:5000';

function buildPath(route: string): string {
  return import.meta.env.MODE !== 'development'
    ? `https://inkboard.xyz/${route}`
    : `http://localhost:5000/${route}`;
}

const PALETTE = [
  '#111410', '#2D3A27', '#4A5D3F', '#7A9E6E',
  '#c4a96a', '#A67C52', '#8B4513', '#C41E3A',
  '#1B4F72', '#2E86AB', '#D4C5B0', '#FFFFFF',
];

const SNAPSHOT_DEBOUNCE_MS = 20_000;
const MIN_SCALE = 0.05;
const MAX_SCALE = 20;
const ZOOM_SENSITIVITY = 0.0012;

// ── ID generator ──────────────────────────────────────────────────────────────
let _idCounter = 0;
function genId(): string {
  return `${Date.now()}-${++_idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Viewport helpers ──────────────────────────────────────────────────────────

/** Screen → World */
function screenToWorld(sx: number, sy: number, vp: Viewport) {
  return {
    x: (sx - vp.x) / vp.scale,
    y: (sy - vp.y) / vp.scale,
  };
}

/** World → Screen */
function worldToScreen(wx: number, wy: number, vp: Viewport) {
  return {
    x: wx * vp.scale + vp.x,
    y: wy * vp.scale + vp.y,
  };
}

// ── Render a single stroke onto a ctx ─────────────────────────────────────────

function renderStroke(
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
    if (pts.length < 2) { ctx.restore(); return; }
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

// ─────────────────────────────────────────────────────────────────────────────
export default function WhiteboardRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  // Board metadata
  const [boardId, setBoardId] = useState<string | undefined>();
  const [boardTitle, setBoardTitle] = useState('Untitled Board');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#111410');
  const [lineWidth, setLineWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [userCount, setUserCount] = useState(1);
  const [codeCopied, setCodeCopied] = useState(false);
  const [zoom, setZoom] = useState(1);           // mirror of vp.scale for display
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const initialCenterDone = useRef(false);

  // Viewport (pan + zoom) — stored in a ref for perf, mirrored to state for zoom display
  const vpRef = useRef<Viewport>({ x: 0, y: 0, scale: 1 });

  // Stroke storage (world-space)
  const strokesRef = useRef<Stroke[]>([]);

  // Undo / redo stacks store complete snapshots of strokesRef
  // For huge boards you'd store diffs, but snapshots keep things simple & correct
  const undoStack = useRef<Stroke[][]>([]);
  const redoStack = useRef<Stroke[][]>([]);

  // Active stroke being drawn right now
  const activeStroke = useRef<Stroke | null>(null);

  // Socket
  const socketRef = useRef<Socket | null>(null);

  // Pointer tracking
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef<{ px: number; py: number; vpx: number; vpy: number } | null>(null);
  const spaceDown = useRef(false);

  // Touch (pinch-zoom)
  const lastTouches = useRef<React.Touch[] | null>(null);

  // Snapshot debounce
  const snapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation frame for render loop
  const rafRef = useRef<number>(0);
  const needsRender = useRef(true);  // dirty flag

  // ── Dirty flag helpers ──────────────────────────────────────────────────────
  const markDirty = useCallback(() => { needsRender.current = true; }, []);

  // ── Render loop ─────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    rafRef.current = requestAnimationFrame(render);
    if (!needsRender.current) return;
    needsRender.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vp = vpRef.current;
    const W = canvas.width;
    const H = canvas.height;

    // Background + grid
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#F8F6F0';
    ctx.fillRect(0, 0, W, H);

    // Dot grid (scales with zoom, fades when too dense)
    const gridSpacing = 28 * vp.scale;
    if (gridSpacing > 6) {
      const alpha = Math.min(1, (gridSpacing - 6) / 20) * 0.4;
      ctx.fillStyle = `rgba(100, 90, 70, ${alpha})`;
      const offX = ((vp.x % gridSpacing) + gridSpacing) % gridSpacing;
      const offY = ((vp.y % gridSpacing) + gridSpacing) % gridSpacing;
      for (let gx = offX; gx < W; gx += gridSpacing) {
        for (let gy = offY; gy < H; gy += gridSpacing) {
          ctx.beginPath();
          ctx.arc(gx, gy, Math.min(1.5, vp.scale * 0.8), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // All committed strokes
    for (const s of strokesRef.current) {
      renderStroke(ctx, s, vp);
    }

    // Active (in-progress) stroke
    if (activeStroke.current) {
      renderStroke(ctx, activeStroke.current, vp);
    }
  }, []);

  // Start render loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // ── Canvas resize ────────────────────────────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        
        // Require a minimum size (e.g., > 10px) to ignore split-second intermediate frames
        if (width > 10 && height > 10) {
          canvas.width = Math.floor(width);
          canvas.height = Math.floor(height);
          
          // Center exactly once, only after the wrapper has actual dimensions
          if (!initialCenterDone.current) {
            vpRef.current.x = canvas.width / 2;
            vpRef.current.y = canvas.height / 2;
            initialCenterDone.current = true;
          }
          
          markDirty();
        }
      } 
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [markDirty]);

  // ── Snapshot ─────────────────────────────────────────────────────────────────
  const scheduleSnapshot = useCallback((bId: string) => {
    if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    snapshotTimer.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Render at reduced size for snapshot
      const tmp = document.createElement('canvas');
      const ratio = Math.min(1, 1200 / Math.max(canvas.width, canvas.height));
      tmp.width = Math.floor(canvas.width * ratio);
      tmp.height = Math.floor(canvas.height * ratio);
      const ctx2 = tmp.getContext('2d')!;
      ctx2.fillStyle = '#F8F6F0';
      ctx2.fillRect(0, 0, tmp.width, tmp.height);
      ctx2.drawImage(canvas, 0, 0, tmp.width, tmp.height);
      socketRef.current?.emit('save_snapshot', {
        boardId: bId,
        snapshot: tmp.toDataURL('image/jpeg', 0.65),
      });
    }, SNAPSHOT_DEBOUNCE_MS);
  }, []);

  // ── Undo/redo state sync ─────────────────────────────────────────────────────
  const syncUndoState = useCallback(() => {
    setCanUndoState(undoStack.current.length > 0);
    setCanRedoState(redoStack.current.length > 0);
  }, []);

  // ── Push undo checkpoint ─────────────────────────────────────────────────────
  const pushUndo = useCallback(() => {
    undoStack.current.push([...strokesRef.current]);
    redoStack.current = [];
    syncUndoState();
  }, [syncUndoState]);

  // ── Undo ─────────────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    redoStack.current.push([...strokesRef.current]);
    strokesRef.current = undoStack.current.pop()!;
    syncUndoState();
    markDirty();
  }, [syncUndoState, markDirty]);

  // ── Redo ─────────────────────────────────────────────────────────────────────
  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    undoStack.current.push([...strokesRef.current]);
    strokesRef.current = redoStack.current.pop()!;
    syncUndoState();
    markDirty();
  }, [syncUndoState, markDirty]);

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
    const strokes = strokesRef.current;
    if (strokes.length === 0) {
      vpRef.current = { x: 0, y: 0, scale: 1 };
      setZoom(1);
      markDirty();
      return;
    }
    // Bounding box in world space
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

  // ── Load board metadata ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!code) return;
    fetch(buildPath(`api/boards/join/${code}`))
      .then(r => r.json())
      .then(data => {
        if (data._id) {
          setBoardId(data._id);
          setBoardTitle(data.title || 'Untitled Board');
        } else {
          setError(data.error || 'Invalid room code');
        }
      })
      .catch(() => setError('Could not connect to server'))
      .finally(() => setLoading(false));
  }, [code]);

  // ── Socket connection ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!boardId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_board', boardId);
    });

    // Server sends full history on join
    socket.on('replay_strokes', (raw: any[]) => {
      // Convert legacy segment-based strokes if needed
      const converted = convertLegacyStrokes(raw);
      strokesRef.current = converted;
      undoStack.current = [];
      redoStack.current = [];
      syncUndoState();
      markDirty();
      setStatusMsg('Canvas restored');
      setTimeout(() => setStatusMsg(''), 2500);
    });

    // A peer drew something
    socket.on('draw_stroke', (stroke: Stroke) => {
      strokesRef.current.push(stroke);
      markDirty();
    });

    // Partial pen update from peer (streaming)
    socket.on('stroke_update', (data: { id: string; points: number[] }) => {
      const s = strokesRef.current.find(x => x.id === data.id);
      if (s) {
        s.points = data.points;
        markDirty();
      }
    });

    socket.on('clear_canvas', () => {
      strokesRef.current = [];
      undoStack.current = [];
      redoStack.current = [];
      syncUndoState();
      markDirty();
    });

    socket.on('user_count', (count: number) => setUserCount(count));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    };
  }, [boardId, markDirty, syncUndoState, scheduleSnapshot]);

  // ── Convert legacy segment strokes (old format) to new path format ────────────
  function convertLegacyStrokes(raw: any[]): Stroke[] {
    // Old server strokes: { x0, y0, x1, y1, color, width, tool }
    // Group adjacent pen segments by proximity into path strokes
    const result: Stroke[] = [];
    const penAccum = new Map<string, Stroke>();

    for (const s of raw) {
      if (!s.tool) continue;
      if (s.tool === 'pen' || s.tool === 'eraser') {
        if (s.points) {
          // Already new format
          result.push({ ...s, id: s.id || genId() });
        } else if (s.x0 !== undefined) {
          // Legacy segment — merge into accumulated path by proximity
          const key = `${s.tool}-${s.color}-${s.width}`;
          const existing = penAccum.get(key);
          if (existing && existing.points) {
            const lastX = existing.points[existing.points.length - 2];
            const lastY = existing.points[existing.points.length - 1];
            const dist = Math.hypot(s.x0 - lastX, s.y0 - lastY);
            if (dist < 60) {
              existing.points.push(s.x1, s.y1);
            } else {
              result.push(existing);
              penAccum.set(key, {
                id: genId(), tool: s.tool, color: s.color,
                width: s.width, opacity: 1,
                points: [s.x0, s.y0, s.x1, s.y1],
              });
            }
          } else {
            if (existing) result.push(existing);
            penAccum.set(key, {
              id: genId(), tool: s.tool, color: s.color,
              width: s.width, opacity: 1,
              points: [s.x0, s.y0, s.x1, s.y1],
            });
          }
        }
      } else {
        // Shape — flush any accumulated pen strokes first
        for (const [k, acc] of penAccum) {
          result.push(acc);
          penAccum.delete(k);
        }
        result.push({
          id: s.id || genId(),
          tool: s.tool,
          x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1,
          color: s.color, width: s.width, opacity: 1,
        });
      }
    }
    for (const acc of penAccum.values()) result.push(acc);
    return result;
  }

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

    if (effectiveTool === 'pan' || e.button === 1 || e.button === 2) {
      isPanning.current = true;
      panStart.current = { px: sx, py: sy, vpx: vp.x, vpy: vp.y };
      return;
    }

    if (e.button !== 0) return;

    isDrawing.current = true;
    pushUndo();

    const { x: wx, y: wy } = screenToWorld(sx, sy, vp);

    const stroke: Stroke = {
      id: genId(),
      tool: effectiveTool as Exclude<Tool, 'pan'>,
      color: effectiveTool === 'eraser' ? '#000000' : color,
      width: lineWidth,
      opacity: effectiveTool === 'eraser' ? 1 : opacity,
    };

    if (effectiveTool === 'pen' || effectiveTool === 'eraser') {
      stroke.points = [wx, wy];
    } else {
      stroke.x0 = wx; stroke.y0 = wy;
      stroke.x1 = wx; stroke.y1 = wy;
    }

    activeStroke.current = stroke;
    markDirty();
  }, [tool, color, lineWidth, opacity, getCanvasPos, pushUndo, markDirty]);

  // ── Pointer move ──────────────────────────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const { sx, sy } = getCanvasPos(e.nativeEvent);

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

    if (!isDrawing.current || !activeStroke.current) return;

    const { x: wx, y: wy } = screenToWorld(sx, sy, vpRef.current);
    const s = activeStroke.current;

    if (s.tool === 'pen' || s.tool === 'eraser') {
      s.points!.push(wx, wy);

      // Stream intermediate pen points to peers (throttled to every 8 points)
      if (boardId && s.points!.length % 8 === 0) {
        socketRef.current?.emit('stroke_update', {
          boardId,
          id: s.id,
          points: [...s.points!],
        });
      }
    } else {
      s.x1 = wx; s.y1 = wy;
    }

    markDirty();
  }, [getCanvasPos, boardId, markDirty]);

  // ── Pointer up ────────────────────────────────────────────────────────────────
  const onPointerUp = useCallback((_e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
      return;
    }

    if (!isDrawing.current || !activeStroke.current) return;
    isDrawing.current = false;

    const s = { ...activeStroke.current };
    activeStroke.current = null;

    // Commit to stroke list
    strokesRef.current.push(s);
    markDirty();

    // Emit full stroke to peers
    if (boardId) {
      socketRef.current?.emit('draw_stroke', { boardId, stroke: s });
      scheduleSnapshot(boardId);
    }
  }, [boardId, scheduleSnapshot, markDirty]);

  // ── Wheel zoom ────────────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { sx, sy } = getCanvasPos(e.nativeEvent);

    if (e.ctrlKey || e.metaKey) {
      // Pinch-zoom on trackpad (ctrl+wheel)
      zoomAt(sx, sy, -e.deltaY * ZOOM_SENSITIVITY * 5);
    } else if (e.shiftKey) {
      // Horizontal pan
      vpRef.current = { ...vpRef.current, x: vpRef.current.x - e.deltaY };
      markDirty();
    } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) {
      // Natural horizontal trackpad scroll
      vpRef.current = {
        ...vpRef.current,
        x: vpRef.current.x - e.deltaX,
        y: vpRef.current.y - e.deltaY,
      };
      markDirty();
    } else {
      // Scroll = pan vertically; scroll with modifier = zoom
      vpRef.current = {
        ...vpRef.current,
        x: vpRef.current.x - e.deltaX,
        y: vpRef.current.y - e.deltaY,
      };
      markDirty();
    }
  }, [getCanvasPos, zoomAt, markDirty]);

  // ── Touch support ─────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      lastTouches.current = [e.touches[0], e.touches[1]];
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
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

      // Pan
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

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' && !e.repeat) {
        spaceDown.current = true;
        (canvasRef.current!).style.cursor = 'grab';
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

      if (e.key === 'v' || e.key === 'V') setTool('pan');
      if (e.key === 'p' || e.key === 'P') setTool('pen');
      if (e.key === 'e' || e.key === 'E') setTool('eraser');
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
    pushUndo();
    strokesRef.current = [];
    redoStack.current = [];
    syncUndoState();
    markDirty();
    if (boardId) socketRef.current?.emit('clear_canvas', boardId);
  }, [boardId, pushUndo, syncUndoState, markDirty]);

  // ── Download PNG ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const ctx = tmp.getContext('2d')!;
    ctx.fillStyle = '#F8F6F0';
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement('a');
    a.download = `${boardTitle}.png`;
    a.href = tmp.toDataURL('image/png');
    a.click();
  }, [boardTitle]);

  // ── Copy room code ────────────────────────────────────────────────────────────
  const handleCopyCode = useCallback(() => {
    if (!code) return;
    const url = `${window.location.origin}/board/${code}`;
    navigator.clipboard.writeText(url);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [code]);

  // ── Cursor helper ─────────────────────────────────────────────────────────────
  function getCursor(t: Tool): string {
    if (t === 'pan') return 'grab';
    if (t === 'eraser') return 'cell';
    return 'crosshair';
  }

  // ── Loading / error screens ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F1EA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#4A5D3F] border-t-transparent rounded-full animate-spin" />
          <p className="font-serif text-[#4A5D3F] italic text-sm">Joining room…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F1EA]">
        <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-white border border-[#A67C5244] shadow-xl max-w-sm text-center">
          <div className="text-4xl">🔒</div>
          <h2 className="font-['Playfair_Display',Georgia,serif] text-xl text-[#2D3A27] font-bold">Room Not Found</h2>
          <p className="font-serif text-sm text-[#A67C52] italic">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A5D3F] text-[#F4F1EA] font-bold text-xs uppercase tracking-widest hover:bg-[#2D3A27] transition"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Tool button component ──────────────────────────────────────────────────────
  const ToolBtn = ({
    id, icon, label, shortcut,
  }: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }) => (
    <button
      onClick={() => setTool(id)}
      title={`${label} (${shortcut})`}
      className={`
        group relative flex flex-col items-center justify-center gap-0.5
        w-11 h-11 rounded-xl transition-all duration-150 select-none
        ${tool === id
          ? 'bg-[#4A5D3F] text-[#F4F1EA] shadow-inner shadow-black/20'
          : 'text-[#4A5D3F] hover:bg-[#4A5D3F]/10'
        }
      `}
    >
      {icon}
      <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">{label}</span>
      <span className={`
        absolute -right-1 -top-1 w-4 h-4 rounded-full text-[8px] font-mono font-bold
        flex items-center justify-center transition-all
        ${tool === id ? 'bg-[#c4a96a] text-[#2D3A27]' : 'bg-[#A67C5222] text-[#A67C52] opacity-0 group-hover:opacity-100'}
      `}>{shortcut}</span>
    </button>
  );

  const zoomPct = Math.round(zoom * 100);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen overflow-hidden select-none"
      style={{ background: '#EDEAE2', fontFamily: "'Raleway', sans-serif" }}
    >
      {/* ── Left Tool Panel ── */}
      <aside
        className="flex flex-col items-center gap-2 py-4 px-2 w-[68px] flex-shrink-0 z-20"
        style={{
          background: '#F4F1EA',
          borderRight: '1px solid rgba(166,124,82,0.2)',
          boxShadow: '2px 0 16px rgba(44,44,36,0.09)',
        }}
      >
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          title="Back to Dashboard"
          className="flex items-center justify-center w-10 h-10 rounded-xl text-[#A67C52] hover:bg-[#A67C5215] transition mb-1"
        >
          <ArrowLeft size={17} />
        </button>

        <div className="w-8 h-px" style={{ background: 'rgba(166,124,82,0.2)' }} />

        {/* Tools */}
        <ToolBtn id="pan"    icon={<Move size={16} />}    label="Pan"   shortcut="V" />
        <ToolBtn id="pen"    icon={<Pen size={16} />}     label="Pen"   shortcut="P" />
        <ToolBtn id="eraser" icon={<Eraser size={16} />}  label="Erase" shortcut="E" />
        <ToolBtn id="line"   icon={<Minus size={16} />}   label="Line"  shortcut="L" />
        <ToolBtn id="rect"   icon={<Square size={16} />}  label="Rect"  shortcut="R" />
        <ToolBtn id="circle" icon={<Circle size={16} />}  label="Oval"  shortcut="O" />

        <div className="w-8 h-px mt-1" style={{ background: 'rgba(166,124,82,0.2)' }} />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndoState}
          title="Undo (Ctrl+Z)"
          className="flex flex-col items-center justify-center gap-0.5 w-11 h-11 rounded-xl text-[#4A5D3F] hover:bg-[#4A5D3F]/10 transition disabled:opacity-25"
        >
          <Undo2 size={16} />
          <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">Undo</span>
        </button>

        <button
          onClick={redo}
          disabled={!canRedoState}
          title="Redo (Ctrl+Y)"
          className="flex flex-col items-center justify-center gap-0.5 w-11 h-11 rounded-xl text-[#4A5D3F] hover:bg-[#4A5D3F]/10 transition disabled:opacity-25"
        >
          <Redo2 size={16} />
          <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">Redo</span>
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          title="Clear entire canvas"
          className="flex flex-col items-center justify-center gap-0.5 w-11 h-11 rounded-xl text-red-700/60 hover:bg-red-50 transition"
        >
          <Trash2 size={16} />
          <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">Clear</span>
        </button>

        <div className="flex-1" />

        {/* Download */}
        <button
          onClick={handleDownload}
          title="Export as PNG"
          className="flex flex-col items-center justify-center gap-0.5 w-11 h-11 rounded-xl text-[#A67C52] hover:bg-[#A67C5215] transition"
        >
          <Download size={16} />
          <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">Save</span>
        </button>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Top Bar ── */}
        <header
          className="flex items-center gap-3 px-4 py-2 flex-shrink-0 z-10"
          style={{
            background: '#F4F1EA',
            borderBottom: '1px solid rgba(166,124,82,0.2)',
            boxShadow: '0 2px 10px rgba(44,44,36,0.07)',
          }}
        >
          {/* Title */}
          <h1
            className="text-sm font-semibold tracking-wide truncate max-w-[200px]"
            style={{ color: '#2D3A27', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {boardTitle}
          </h1>

          {statusMsg && (
            <span className="text-[10px] italic animate-pulse" style={{ color: '#A67C52' }}>
              {statusMsg}
            </span>
          )}

          <div className="flex-1" />

          {/* Color palette */}
          <div className="flex items-center gap-1">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
                title={c}
                className="w-5 h-5 rounded-full border-2 transition-all duration-100 hover:scale-110"
                style={{
                  background: c,
                  borderColor: color === c && tool !== 'eraser' ? '#c4a96a' : 'transparent',
                  transform: color === c && tool !== 'eraser' ? 'scale(1.25)' : undefined,
                  boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px rgba(166,124,82,0.3)' : undefined,
                }}
              />
            ))}
            <label
              title="Custom color"
              className="relative w-5 h-5 rounded-full overflow-hidden cursor-pointer transition"
              style={{
                border: '2px dashed rgba(166,124,82,0.5)',
                background: color,
              }}
            >
              <Pipette size={8} className="absolute inset-0 m-auto" style={{ color: '#A67C52' }} />
              <input
                type="color"
                value={color}
                onChange={e => { setColor(e.target.value); if (tool === 'eraser') setTool('pen'); }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>

          {/* Line width */}
          <div
            className="flex items-center gap-1.5 px-3"
            style={{ borderLeft: '1px solid rgba(166,124,82,0.2)' }}
          >
            <button
              onClick={() => setLineWidth(w => Math.max(1, w - 1))}
              className="text-[#4A5D3F] hover:text-[#2D3A27] transition"
            >
              <MinusIcon size={13} />
            </button>
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{ background: 'rgba(74,93,63,0.1)' }}
              title={`${lineWidth}px`}
            >
              <div
                className="rounded-full"
                style={{
                  width: Math.max(3, lineWidth * 2),
                  height: Math.max(3, lineWidth * 2),
                  background: color === '#FFFFFF' ? '#888' : color,
                  maxWidth: 24,
                  maxHeight: 24,
                }}
              />
            </div>
            <button
              onClick={() => setLineWidth(w => Math.min(60, w + 1))}
              className="text-[#4A5D3F] hover:text-[#2D3A27] transition"
            >
              <Plus size={13} />
            </button>
            <span className="text-[10px] font-mono" style={{ color: '#A67C52', minWidth: 24 }}>{lineWidth}px</span>
          </div>

          {/* Opacity */}
          <div
            className="flex items-center gap-2 px-3"
            style={{ borderLeft: '1px solid rgba(166,124,82,0.2)' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#A67C52' }}>α</span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={opacity}
              onChange={e => setOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 accent-[#4A5D3F]"
              title={`Opacity: ${Math.round(opacity * 100)}%`}
            />
            <span className="text-[10px] font-mono" style={{ color: '#A67C52', minWidth: 30 }}>
              {Math.round(opacity * 100)}%
            </span>
          </div>

          {/* Zoom controls */}
          <div
            className="flex items-center gap-1 px-3"
            style={{ borderLeft: '1px solid rgba(166,124,82,0.2)' }}
          >
            <button
              onClick={() => {
                const c = canvasRef.current!;
                zoomAt(c.width / 2, c.height / 2, -0.25);
              }}
              className="flex items-center justify-center w-6 h-6 rounded transition"
              style={{ color: '#4A5D3F' }}
              title="Zoom out (-)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              className="text-[10px] font-mono px-1.5 py-0.5 rounded transition hover:bg-[#4A5D3F]/10"
              style={{ color: '#2D3A27', minWidth: 44 }}
              onClick={fitToScreen}
              title="Fit to screen (0)"
            >
              {zoomPct}%
            </button>
            <button 
              onClick={() => {
                const c = canvasRef.current!;
                zoomAt(c.width / 2, c.height / 2, 0.25);
              }}
              className="flex items-center justify-center w-6 h-6 rounded transition"
              style={{ color: '#4A5D3F' }}
              title="Zoom in (+)"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={fitToScreen}
              className="flex items-center justify-center w-6 h-6 rounded transition"
              style={{ color: '#A67C52' }}
              title="Fit to content (0)"
            >
              <Maximize2 size={13} />
            </button>
          </div>

          {/* Room code + users */}
          <div
            className="flex items-center gap-2 pl-3"
            style={{ borderLeft: '1px solid rgba(166,124,82,0.2)' }}
          >
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-[11px] tracking-widest uppercase transition"
              style={{ background: '#2D3A27', color: '#c4a96a' }}
              title="Copy invite link"
            >
              {codeCopied ? <Check size={11} /> : <Copy size={11} />}
              {code}
            </button>
            <div className="flex items-center gap-1" style={{ color: '#4A5D3F' }}>
              <Users size={13} />
              <span className="text-xs font-bold">{userCount}</span>
            </div>
          </div>
        </header>

        {/* ── Canvas ── */}
        <div ref={wrapperRef} className="relative flex-1 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            style={{
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
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onContextMenu={e => e.preventDefault()}
          />

          {/* Bottom HUD */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-3">
            <div
              className="px-3 py-1.5 rounded-full backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(45,58,39,0.82)', color: '#F4F1EA' }}
            >
              {tool === 'pan'    && '✦ Pan  —  drag to move'}
              {tool === 'pen'    && '✦ Pen  —  freehand draw'}
              {tool === 'eraser' && '✦ Eraser  —  drag to erase'}
              {tool === 'line'   && '✦ Line  —  click & drag'}
              {tool === 'rect'   && '✦ Rectangle  —  click & drag'}
              {tool === 'circle' && '✦ Ellipse  —  click & drag'}
            </div>
            <div
              className="px-2.5 py-1.5 rounded-full backdrop-blur-sm text-[10px] font-mono"
              style={{ background: 'rgba(45,58,39,0.6)', color: 'rgba(244,241,234,0.7)' }}
            >
              Space+drag · Scroll to pan · Ctrl+scroll to zoom
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}