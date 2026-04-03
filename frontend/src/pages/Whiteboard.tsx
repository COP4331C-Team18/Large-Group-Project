import {
  useEffect, useLayoutEffect, useRef, useState, useCallback,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// Internal Components
import WhiteboardHeader from '../components/whiteboard/WhiteboardHeader';
import WhiteboardToolbar from '../components/whiteboard/WhiteboardToolbar';
import WhiteboardHUD from '../components/whiteboard/WhiteboardHUD';

// Utils and Types
import { boardService } from '@/api/services/boardService';
import type { Tool, Stroke, Viewport } from '../types/whiteboard';
import { 
  genId, screenToWorld, worldToScreen, renderStroke,
  MIN_SCALE, MAX_SCALE
} from '../utils/whiteboardUtils';

export default function Whiteboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Board metadata
  const [boardId, setBoardId] = useState<string | undefined>();
  const [boardTitle, setBoardTitle] = useState('Untitled Board');
  const [joinCode, setJoinCode] = useState<string | undefined>();
  const [collabActive, setCollabActive] = useState(false);
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

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Viewport (pan + zoom)
  const vpRef = useRef<Viewport>({ x: 0, y: 0, scale: 1 });

  // Yjs State
  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const yStrokesRef = useRef<Y.Map<Y.Map<any>>>(ydocRef.current.getMap('strokes'));
  const undoManagerRef = useRef<Y.UndoManager>(new Y.UndoManager(yStrokesRef.current));
  
  // Track the ID of the active stroke being drawn
  const activeStrokeId = useRef<string | null>(null);

  // WebSocket ref for collab
  const wsRef = useRef<WebSocket | null>(null);

  // Pointer tracking
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef<{ px: number; py: number; vpx: number; vpy: number } | null>(null);
  const spaceDown = useRef(false);

  // Touch (pinch-zoom)
  const lastTouches = useRef<React.Touch[] | null>(null);

  // Animation frame for render loop
  const rafRef = useRef<number>(0);
  const needsRender = useRef(true);

  // ── Dirty flag helpers ──────────────────────────────────────────────────────
  const markDirty = useCallback(() => { needsRender.current = true; }, []);

  // ── Undo/redo state sync ─────────────────────────────────────────────────────
  const syncUndoState = useCallback(() => {
    setCanUndoState(undoManagerRef.current.undoStack.length > 0);
    setCanRedoState(undoManagerRef.current.redoStack.length > 0);
  }, []);

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

    // Read strokes from Yjs
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

    // Sort strokes by timestamp to maintain z-index order
    strokes.sort((a, b) => a.timestamp - b.timestamp);

    for (const s of strokes) {
      renderStroke(ctx, s, vp);
    }

  }, []);

  // Start render loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // ── Canvas resize ────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    let centered = false;

    function sizeCanvas() {
      const cv = canvasRef.current;
      const wr = wrapperRef.current;
      if (!cv || !wr) return;
      const { width, height } = wr.getBoundingClientRect();
      if (width < 10 || height < 10) return;
      cv.width = Math.floor(width);
      cv.height = Math.floor(height);
      if (!centered) {
        vpRef.current.x = cv.width / 2;
        vpRef.current.y = cv.height / 2;
        centered = true;
      }
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

  // ── Load board metadata ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    
    boardService.getBoardById(id)
      .then(data => {
        if (data._id || data.id) {
          const bid = data._id || data.id;
          setBoardId(bid);
          setBoardTitle(data.title || 'Untitled Board');
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
  }, [id]);

  // ── Setup Yjs Subscriptions ───────────────────────────────────────────────────
  useEffect(() => {
    if (!boardId) return;

    // Local IndexedDB Offline Support
    const indexeddbProvider = new IndexeddbPersistence(boardId, ydocRef.current);
    
    indexeddbProvider.on('synced', () => {
      setStatusMsg('Offline strokes loaded');
      markDirty();
      setTimeout(() => setStatusMsg(''), 2500);
    });

    // Listen for any deep changes in the CRDT to trigger a re-render
    const observer = () => markDirty();
    yStrokesRef.current.observeDeep(observer);
    
    // Listen for UndoManager changes to update button states
    undoManagerRef.current.on('stack-item-added', syncUndoState);
    undoManagerRef.current.on('stack-item-popped', syncUndoState);

    return () => {
      yStrokesRef.current.unobserveDeep(observer);
      indexeddbProvider.destroy();
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

    if (effectiveTool === 'pan' || e.button === 1 || e.button === 2) {
      isPanning.current = true;
      panStart.current = { px: sx, py: sy, vpx: vp.x, vpy: vp.y };
      return;
    }

    if (e.button !== 0) return;

    isDrawing.current = true;
    
    const { x: wx, y: wy } = screenToWorld(sx, sy, vp);

    // Create the stroke in Yjs
    const sid = genId();
    activeStrokeId.current = sid;

    ydocRef.current.transact(() => {
      const yStroke = new Y.Map<any>();
      yStroke.set('id', sid);
      yStroke.set('tool', effectiveTool);
      yStroke.set('color', effectiveTool === 'eraser' ? '#000000' : color);
      yStroke.set('width', lineWidth);
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

  }, [tool, color, lineWidth, opacity, getCanvasPos]);

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

  }, [getCanvasPos, markDirty]);

  // ── Pointer up ────────────────────────────────────────────────────────────────
  const onPointerUp = useCallback((_e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
      return;
    }

    if (!isDrawing.current || !activeStrokeId.current) return;
    isDrawing.current = false;
    activeStrokeId.current = null;

  }, []);

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
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
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
    ydocRef.current.transact(() => {
        // Collect all keys then delete them individually to properly log actions in Yjs
        const keys = Array.from(yStrokesRef.current.keys());
        keys.forEach(key => yStrokesRef.current.delete(key));
    });
    markDirty();
  }, [markDirty]);

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
    if (!joinCode) return;
    const url = `${window.location.origin}/board/${joinCode}`;
    navigator.clipboard.writeText(url);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [joinCode]);

  // ── Collab session connection ─────────────────────────────────────────────────
  const connectToCollabServer = useCallback((sessionId: string) => {
    if (wsRef.current) return; // already connected

    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:9001';
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      // Send join request
      ws.send(JSON.stringify({ type: 'join', sessionId }));
      setStatusMsg('Connecting to room...');
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        // JSON protocol messages
        const msg = JSON.parse(event.data);
        if (msg.type === 'joined' && msg.ok) {
          setCollabActive(true);
          setStatusMsg('Collab active');
          setTimeout(() => setStatusMsg(''), 2500);

          // Now that we're joined, send our current Yjs state to sync peers
          const state = Y.encodeStateAsUpdate(ydocRef.current);
          ws.send(state);
        } else if (msg.type === 'userCount') {
          setUserCount(msg.count);
        }
      } else {
        // Binary — incoming Yjs update from a peer (tagged 'remote' to avoid echo)
        const update = new Uint8Array(event.data);
        Y.applyUpdate(ydocRef.current, update, 'remote');
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setCollabActive(false);
      setUserCount(1);
      setStatusMsg('Disconnected from room');
      setTimeout(() => setStatusMsg(''), 3000);
    };

    ws.onerror = () => {
      ws.close();
      setJoinCode(undefined);
      setStatusMsg('Failed to connect');
      setTimeout(() => setStatusMsg(''), 3000);
    };
  }, []);

  // Forward local Yjs updates to WebSocket when collab is active
  useEffect(() => {
    if (!collabActive) return;

    const onUpdate = (update: Uint8Array, origin: any) => {
      // Only send local changes (not updates we received from peers)
      if (origin !== 'remote' && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(update);
      }
    };

    ydocRef.current.on('update', onUpdate);
    return () => { ydocRef.current.off('update', onUpdate); };
  }, [collabActive]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  const handleCollab = useCallback(() => {
    const hexCode = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
    setJoinCode(hexCode);
    connectToCollabServer(hexCode);
  }, [connectToCollabServer]);

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
            className="px-5 py-2.5 rounded-xl bg-[#4A5D3F] text-[#F4F1EA] font-bold text-xs uppercase tracking-widest hover:bg-[#2D3A27] transition"
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
      className="flex h-screen overflow-hidden select-none"
      style={{ background: '#EDEAE2', fontFamily: "'Raleway', sans-serif" }}
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
        navigate={navigate}
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

          <WhiteboardHUD tool={tool} />
        </div>
      </div>
    </div>
  );
}
