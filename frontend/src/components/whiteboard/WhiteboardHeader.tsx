import React from 'react';
import {
  Pipette, Minus as MinusIcon, Plus, ZoomOut, ZoomIn,
  Maximize2, Check, Copy, Users
} from 'lucide-react';
import type { Tool } from '../../types/whiteboard';
import { PALETTE } from '../../utils/whiteboardUtils';

interface WhiteboardHeaderProps {
  boardTitle: string;
  statusMsg: string;
  color: string;
  setColor: (color: string) => void;
  tool: Tool;
  setTool: (tool: Tool) => void;
  lineWidth: number;
  setLineWidth: React.Dispatch<React.SetStateAction<number>>;
  opacity: number;
  setOpacity: (opacity: number) => void;
  zoomPct: number;
  zoomAt: (sx: number, sy: number, delta: number) => void;
  fitToScreen: () => void;
  handleCopyCode: () => void;
  onCollab: () => void;
  codeCopied: boolean;
  joinCode: string | undefined;
  userCount: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const WhiteboardHeader: React.FC<WhiteboardHeaderProps> = ({
  boardTitle,
  statusMsg,
  color,
  setColor,
  tool,
  setTool,
  lineWidth,
  setLineWidth,
  opacity,
  setOpacity,
  zoomPct,
  zoomAt,
  fitToScreen,
  handleCopyCode,
  onCollab,
  codeCopied,
  joinCode,
  userCount,
  canvasRef,
}) => {
  return (
    <header className="flex items-center gap-3 px-4 py-2 flex-shrink-0 z-10 bg-base-100 border-b border-secondary/20 shadow-sm">

      {/* Title */}
      <h1 className="text-sm font-semibold tracking-wide truncate max-w-[200px] text-primary font-serif">
        {boardTitle}
      </h1>

      {statusMsg && (
        <span className="text-[10px] italic animate-pulse text-secondary">
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
          className="relative w-5 h-5 rounded-full overflow-hidden cursor-pointer border-2 border-dashed border-secondary/50 transition"
          style={{ background: color }}
        >
          <Pipette size={8} className="absolute inset-0 m-auto text-secondary" />
          <input
            type="color"
            value={color}
            onChange={e => { setColor(e.target.value); if (tool === 'eraser') setTool('pen'); }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>

      {/* Line width */}
      <div className="flex items-center gap-1.5 px-3 border-l border-secondary/20">
        <button
          onClick={() => setLineWidth(w => Math.max(1, w - 1))}
          className="text-primary hover:text-primary/80 transition"
        >
          <MinusIcon size={13} />
        </button>
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10"
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
          className="text-primary hover:text-primary/80 transition"
        >
          <Plus size={13} />
        </button>
        <span className="text-[10px] font-mono text-secondary" style={{ minWidth: 24 }}>{lineWidth}px</span>
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-2 px-3 border-l border-secondary/20">
        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">α</span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={opacity}
          onChange={e => setOpacity(parseFloat(e.target.value))}
          className="w-16 h-1 accent-primary"
          title={`Opacity: ${Math.round(opacity * 100)}%`}
        />
        <span className="text-[10px] font-mono text-secondary" style={{ minWidth: 30 }}>
          {Math.round(opacity * 100)}%
        </span>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-1 px-3 border-l border-secondary/20">
        <button
          onClick={() => { const c = canvasRef.current; if (c) zoomAt(c.width / 2, c.height / 2, -0.25); }}
          className="flex items-center justify-center w-6 h-6 rounded transition text-primary"
          title="Zoom out (-)"
        >
          <ZoomOut size={14} />
        </button>
        <button
          className="text-[10px] font-mono px-1.5 py-0.5 rounded transition hover:bg-primary/10 text-primary/90"
          style={{ minWidth: 44 }}
          onClick={fitToScreen}
          title="Fit to screen (0)"
        >
          {zoomPct}%
        </button>
        <button
          onClick={() => { const c = canvasRef.current; if (c) zoomAt(c.width / 2, c.height / 2, 0.25); }}
          className="flex items-center justify-center w-6 h-6 rounded transition text-primary"
          title="Zoom in (+)"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={fitToScreen}
          className="flex items-center justify-center w-6 h-6 rounded transition text-secondary"
          title="Fit to content (0)"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {/* Room code + users */}
      <div className="flex items-center gap-2 pl-3 border-l border-secondary/20">
        {joinCode ? (
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-[10px] tracking-widest uppercase transition shadow-sm hover:shadow-md bg-neutral text-[#c4a96a]"
            title="Copy invite link"
          >
            {codeCopied ? <Check size={11} /> : <Copy size={11} />}
            {joinCode}
          </button>
        ) : (
          <button
            onClick={onCollab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] tracking-widest uppercase transition shadow-sm hover:shadow-md active:scale-95 bg-primary text-primary-content"
            title="Start Collaboration"
          >
            <Users size={12} />
            Go Collab
          </button>
        )}
        <div className="flex items-center gap-1 ml-1 text-primary">
          <Users size={13} />
          <span className="text-xs font-bold">{userCount}</span>
        </div>
      </div>
    </header>
  );
};

export default WhiteboardHeader;
