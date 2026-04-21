export type Tool = 'pan' | 'pen' | 'text' | 'eraser' | 'line' | 'rect' | 'circle';

/** All coordinates in WORLD space (invariant to pan/zoom) */
export interface Stroke {
  id: string;
  tool: Exclude<Tool, 'pan'>;
  points?: number[];
  x0?: number; y0?: number;
  x1?: number; y1?: number;
  color: string;
  width: number;
  opacity: number;
  timestamp: number;
}

export interface Viewport {
  x: number;   // pan offset in screen pixels
  y: number;
  scale: number;
}
