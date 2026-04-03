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
            const c = canvasRef.current;
            if (c) zoomAt(c.width / 2, c.height / 2, -0.25);
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
            const c = canvasRef.current;
            if (c) zoomAt(c.width / 2, c.height / 2, 0.25);
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
        {joinCode ? (
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-[10px] tracking-widest uppercase transition shadow-sm hover:shadow-md"
            style={{ background: '#2D3A27', color: '#c4a96a' }}
            title="Copy invite link"
          >
            {codeCopied ? <Check size={11} /> : <Copy size={11} />}
            {joinCode}
          </button>
        ) : (
          <button
            onClick={onCollab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] tracking-widest uppercase transition shadow-sm hover:shadow-md active:scale-95"
            style={{ background: '#4A5D3F', color: '#F4F1EA' }}
            title="Start Collaboration"
          >
            <Users size={12} />
            Go Collab
          </button>
        )}
        <div className="flex items-center gap-1 ml-1" style={{ color: '#4A5D3F' }}>
          <Users size={13} />
          <span className="text-xs font-bold">{userCount}</span>
        </div>
      </div>
    </header>
  );
};

export default WhiteboardHeader;
