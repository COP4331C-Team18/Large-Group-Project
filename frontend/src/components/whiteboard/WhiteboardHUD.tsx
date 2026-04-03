import React from 'react';
import type { Tool } from '../../types/whiteboard';

interface WhiteboardHUDProps {
  tool: Tool;
}

const WhiteboardHUD: React.FC<WhiteboardHUDProps> = ({ tool }) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-3">
      <div className="px-3 py-1.5 rounded-full backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest bg-primary/80 text-primary-content">
        {tool === 'pan'    && '✦ Pan  —  drag to move'}
        {tool === 'pen'    && '✦ Pen  —  freehand draw'}
        {tool === 'eraser' && '✦ Eraser  —  drag to erase'}
        {tool === 'line'   && '✦ Line  —  click & drag'}
        {tool === 'rect'   && '✦ Rectangle  —  click & drag'}
        {tool === 'circle' && '✦ Ellipse  —  click & drag'}
      </div>
      <div className="px-2.5 py-1.5 rounded-full backdrop-blur-sm text-[10px] font-mono bg-primary/60 text-primary-content/70">
        Space+drag · Scroll to pan · Ctrl+scroll to zoom
      </div>
    </div>
  );
};

export default WhiteboardHUD;
