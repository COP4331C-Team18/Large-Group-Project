import React, { useState } from 'react';
import {
  ArrowLeft, Move, Pen, Eraser, Minus, Square, Circle,
  Undo2, Redo2, Trash2, Download
} from 'lucide-react';
import type { Tool, EraserMode } from '../../types/whiteboard';

interface ToolBtnProps {
  id: Tool;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  currentTool: Tool;
  setTool: (tool: Tool) => void;
}

const ToolBtn: React.FC<ToolBtnProps> = ({
  id, icon, label, shortcut, currentTool, setTool
}) => (
  <button
    onClick={() => setTool(id)}
    title={`${label} (${shortcut})`}
    className={`
      group relative flex flex-col items-center justify-center gap-0.5
      w-11 h-11 rounded-xl transition-all duration-150 select-none
      ${currentTool === id
        ? 'bg-primary text-primary-content shadow-inner shadow-black/20'
        : 'text-primary hover:bg-primary/10'
      }
    `}
  >
    {icon}
    <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">{label}</span>
    <span className={`
      absolute -right-1 -top-1 w-4 h-4 rounded-full text-[8px] font-mono font-bold
      flex items-center justify-center transition-all
      ${currentTool === id
        ? 'bg-[#c4a96a] text-neutral'
        : 'bg-secondary/15 text-secondary opacity-0 group-hover:opacity-100'
      }
    `}>{shortcut}</span>
  </button>
);

interface WhiteboardToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  eraserMode: EraserMode;
  setEraserMode: (m: EraserMode) => void;
  isOwner: boolean;
  undo: () => void;
  redo: () => void;
  canUndoState: boolean;
  canRedoState: boolean;
  handleClear: () => void;
  handleDownload: () => void;
  onBack: () => void;
}

const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  tool,
  setTool,
  eraserMode,
  setEraserMode,
  isOwner,
  undo,
  redo,
  canUndoState,
  canRedoState,
  handleClear,
  handleDownload,
  onBack,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
    {/* Clear-all confirmation dialog */}
    {showConfirm && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
        onClick={() => setShowConfirm(false)}
      >
        <div
          className="bg-base-100 border border-secondary/30 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-5"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-error/10 text-error flex-shrink-0">
              <Trash2 size={20} />
            </span>
            <div>
              <h2 className="font-serif text-base font-bold text-base-content leading-tight">Clear entire board?</h2>
              <p className="font-sans text-xs text-base-content/55 mt-0.5">This removes all strokes for everyone and cannot be undone.</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 rounded-lg font-sans text-xs font-semibold text-base-content/70 hover:bg-secondary/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => { handleClear(); setShowConfirm(false); }}
              className="px-4 py-2 rounded-lg font-sans text-xs font-semibold bg-error text-white hover:bg-error/80 transition"
            >
              Clear everything
            </button>
          </div>
        </div>
      </div>
    )}
    <aside
      className="flex flex-col items-center gap-2 py-4 px-2 w-[68px] flex-shrink-0 z-20 bg-base-100 border-r border-secondary/20"
      style={{ boxShadow: '2px 0 16px rgba(44,44,36,0.09)' }}
    >
      {/* Back */}
      <button
        onClick={onBack}
        title="Back to Dashboard"
        className="flex items-center justify-center w-10 h-10 rounded-xl text-secondary hover:bg-secondary/10 transition mb-1"
      >
        <ArrowLeft size={17} />
      </button>

      <div className="w-8 h-px bg-secondary/20" />

      {/* Tools */}
      <ToolBtn id="pan"    icon={<Move size={16} />}    label="Pan"   shortcut="V" currentTool={tool} setTool={setTool} />
      <ToolBtn id="pen"    icon={<Pen size={16} />}     label="Pen"   shortcut="P" currentTool={tool} setTool={setTool} />
      {/* Eraser — click to select, click again to toggle stroke ↔ area mode */}
      <button
        onClick={() => {
          if (tool === 'eraser') {
            setEraserMode(eraserMode === 'stroke' ? 'area' : 'stroke');
          } else {
            setTool('eraser');
          }
        }}
        title={
          tool === 'eraser'
            ? `Eraser: ${eraserMode === 'stroke' ? 'Stroke' : 'Area'} mode — click to switch`
            : 'Eraser (E)'
        }
        className={`
          group relative flex flex-col items-center justify-center gap-0.5
          w-11 h-11 rounded-xl transition-all duration-150 select-none
          ${tool === 'eraser'
            ? 'bg-primary text-primary-content shadow-inner shadow-black/20'
            : 'text-primary hover:bg-primary/10'
          }
        `}
      >
        <Eraser size={16} />
        <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">
          {tool === 'eraser' ? (eraserMode === 'stroke' ? 'Stroke' : 'Area') : 'Erase'}
        </span>
        <span className={`
          absolute -right-1 -top-1 w-4 h-4 rounded-full text-[8px] font-mono font-bold
          flex items-center justify-center transition-all
          ${tool === 'eraser'
            ? 'bg-[#c4a96a] text-neutral'
            : 'bg-secondary/15 text-secondary opacity-0 group-hover:opacity-100'
          }
        `}>E</span>
        {/* Small rectangle badge indicates area mode */}
        {tool === 'eraser' && eraserMode === 'area' && (
          <span className="absolute bottom-1 right-1 w-2.5 h-2 rounded-[2px] border border-current opacity-70" />
        )}
      </button>
      <ToolBtn id="line"   icon={<Minus size={16} />}   label="Line"  shortcut="L" currentTool={tool} setTool={setTool} />
      <ToolBtn id="rect"   icon={<Square size={16} />}  label="Rect"  shortcut="R" currentTool={tool} setTool={setTool} />
      <ToolBtn id="circle" icon={<Circle size={16} />}  label="Oval"  shortcut="O" currentTool={tool} setTool={setTool} />

      <div className="w-8 h-px mt-1 bg-secondary/20" />

      {/* Undo / Redo */}
      <button
        onClick={undo}
        disabled={!canUndoState}
        title="Undo (Ctrl+Z)"
        className="flex flex-col items-center justify-center gap-0.5 w-11 h-11 rounded-xl text-primary hover:bg-primary/10 transition disabled:opacity-25"
      >
        <Undo2 size={16} />
        <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">Undo</span>
      </button>

      <button
        onClick={redo}
        disabled={!canRedoState}
        title="Redo (Ctrl+Y)"
        className="flex flex-col items-center justify-center gap-0.5 w-11 h-11 rounded-xl text-primary hover:bg-primary/10 transition disabled:opacity-25"
      >
        <Redo2 size={16} />
        <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">Redo</span>
      </button>

      {/* Clear — owner only, requires confirmation */}
      {isOwner && (
        <button
          onClick={() => setShowConfirm(true)}
          title="Clear entire canvas"
          className="flex flex-col items-center justify-center gap-0.5 w-11 h-11 rounded-xl text-error/70 hover:bg-error/10 transition"
        >
          <Trash2 size={16} />
          <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">Clear</span>
        </button>
      )}

      <div className="flex-1" />

      {/* Download */}
      <button
        onClick={handleDownload}
        title="Export as PNG"
        className="flex flex-col items-center justify-center gap-0.5 w-11 h-11 rounded-xl text-secondary hover:bg-secondary/10 transition"
      >
        <Download size={16} />
        <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">Save</span>
      </button>
    </aside>
    </>
  );
};

export default WhiteboardToolbar;
