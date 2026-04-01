// src/models/Stroke.ts
import mongoose, { Document, Schema } from 'mongoose';

export type StrokeTool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle';

export interface StrokeDocument extends Document {
  boardId: mongoose.Types.ObjectId;
  tool: StrokeTool;
  color: string;
  width: number;
  opacity: number;
  // Path strokes (pen/eraser): serialised JSON array of [x,y,x,y,...]
  // Stored as a string to avoid per-point subdocument overhead
  pointsData?: string;
  // Shape strokes (line/rect/circle) and bounding box for pen strokes
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  createdAt: Date;
}

const strokeSchema = new Schema<StrokeDocument>(
  {
    boardId:    { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    tool:       { type: String, enum: ['pen', 'eraser', 'line', 'rect', 'circle'], required: true },
    color:      { type: String, required: true },
    width:      { type: Number, required: true },
    opacity:    { type: Number, default: 1 },
    // Path data for pen/eraser — can be several KB for long strokes
    pointsData: { type: String, default: null },
    // Bounding box (world coords) — used by shapes and indexed for spatial culling
    x0: { type: Number, default: 0 },
    y0: { type: Number, default: 0 },
    x1: { type: Number, default: 0 },
    y1: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for fast replay (boardId + time order)
strokeSchema.index({ boardId: 1, createdAt: 1 });

export default mongoose.model<StrokeDocument>('Stroke', strokeSchema);