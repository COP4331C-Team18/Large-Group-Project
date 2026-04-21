// server.ts
import 'dotenv/config';

import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import Stroke from './models/Stroke';
import Board from './models/Board';
import app from './app';

connectDB();
const server = http.createServer(app);

// ── Socket.IO Setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── In-memory presence tracking ───────────────────────────────────────────────
const roomPresence = new Map<string, Set<string>>();

function addToRoom(boardId: string, socketId: string) {
  if (!roomPresence.has(boardId)) roomPresence.set(boardId, new Set());
  roomPresence.get(boardId)!.add(socketId);
}

function removeFromRoom(boardId: string, socketId: string) {
  roomPresence.get(boardId)?.delete(socketId);
}

function getRoomCount(boardId: string): number {
  return roomPresence.get(boardId)?.size ?? 0;
}

const socketToBoard = new Map<string, string>();

interface IncomingStroke {
  id?: string;
  tool: string;
  color: string;
  width: number;
  opacity?: number;
  points?: number[];
  x0?: number; y0?: number;
  x1?: number; y1?: number;
}

// ── Socket handler ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🟢 Connected: ${socket.id}`);

  // Join board
  socket.on('join_board', async (boardId: string) => {
    socket.join(boardId);
    addToRoom(boardId, socket.id);
    socketToBoard.set(socket.id, boardId);

    console.log(`🤝 ${socket.id} joined room ${boardId} (${getRoomCount(boardId)} users)`);

    socket.to(boardId).emit('user_count', getRoomCount(boardId));

    // Replay all saved strokes to the joining socket only
    try {
      const strokes = await Stroke.find({ boardId }).sort({ createdAt: 1 }).lean();
      const hydrated = strokes.map((s: any) => {
        const out: any = {
          id: s._id.toString(),
          tool: s.tool,
          color: s.color,
          width: s.width,
          opacity: s.opacity ?? 1,
        };
        if (s.pointsData) {
          out.points = JSON.parse(s.pointsData);
        } else {
          out.x0 = s.x0; out.y0 = s.y0;
          out.x1 = s.x1; out.y1 = s.y1;
        }
        return out;
      });
      socket.emit('replay_strokes', hydrated);
    } catch (err) {
      console.error('Error replaying strokes:', err);
    }

    socket.emit('user_count', getRoomCount(boardId));
  });

  // Full stroke committed
  socket.on('draw_stroke', async (data: { boardId: string; stroke: IncomingStroke }) => {
    const { boardId, stroke } = data;

    // Broadcast immediately to other peers
    socket.to(boardId).emit('draw_stroke', stroke);

    // Persist asynchronously
    const doc: any = {
      boardId,
      tool: stroke.tool,
      color: stroke.color,
      width: stroke.width,
      opacity: stroke.opacity ?? 1,
    };

    if (stroke.points && stroke.points.length > 0) {
      doc.pointsData = JSON.stringify(stroke.points);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < stroke.points.length; i += 2) {
        minX = Math.min(minX, stroke.points[i]);
        minY = Math.min(minY, stroke.points[i + 1]);
        maxX = Math.max(maxX, stroke.points[i]);
        maxY = Math.max(maxY, stroke.points[i + 1]);
      }
      doc.x0 = minX; doc.y0 = minY; doc.x1 = maxX; doc.y1 = maxY;
    } else {
      doc.x0 = stroke.x0 ?? 0;
      doc.y0 = stroke.y0 ?? 0;
      doc.x1 = stroke.x1 ?? 0;
      doc.y1 = stroke.y1 ?? 0;
    }

    Stroke.create(doc).catch((err: any) => console.error('Error saving stroke:', err));
  });

  // Streaming partial pen update or shape preview
  socket.on('stroke_update', (data: { boardId: string; id: string; tool?: string; color?: string; width?: number; opacity?: number; points?: number[]; x0?: number; y0?: number; x1?: number; y1?: number }) => {
    socket.to(data.boardId).emit('stroke_update', {
      id: data.id,
      tool: data.tool,
      color: data.color,
      width: data.width,
      opacity: data.opacity,
      points: data.points,
      x0: data.x0,
      y0: data.y0,
      x1: data.x1,
      y1: data.y1,
    });
  });

  // Clear canvas
  socket.on('clear_canvas', async (boardId: string) => {
    socket.to(boardId).emit('clear_canvas');
    try {
      await Stroke.deleteMany({ boardId });
      await Board.findByIdAndUpdate(boardId, { $unset: { snapshot: '' } });
    } catch (err) {
      console.error('Error clearing canvas data:', err);
    }
  });

  // Snapshot
  socket.on('save_snapshot', async (data: { boardId: string; snapshot: string }) => {
    try {
      await Board.findByIdAndUpdate(data.boardId, {
        snapshot: data.snapshot,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error('Error saving snapshot:', err);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`🔴 Disconnected: ${socket.id}`);
    const boardId = socketToBoard.get(socket.id);
    if (boardId) {
      removeFromRoom(boardId, socket.id);
      socketToBoard.delete(socket.id);
      const newCount = getRoomCount(boardId);
      io.to(boardId).emit('user_count', newCount);
      console.log(`   Room ${boardId} now has ${newCount} users`);
    }
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT;
if (!PORT) {
    throw new Error('PORT is not defined in .env');
}

server.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));