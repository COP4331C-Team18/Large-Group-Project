// server.ts
import 'dotenv/config';

import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import Stroke from './models/Stroke';
import Board from './models/Board';
import app from './app';
import axios from 'axios';

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

// ── Yjs Collaboration State (inksubserver fallback) ───────────────────────────
interface YjsRoomState {
  members: Map<string, { userId: string; username: string }>; // socketId -> user info
  updateBuffer: Buffer[]; // Buffered Yjs binary updates
  currentBufferSize: number;
}

const yjsRooms = new Map<string, YjsRoomState>(); // sessionId -> room state
const socketToYjsRoom = new Map<string, string>(); // socketId -> sessionId
const MAX_BUFFER_SIZE_BYTES = 512 * 1024; // 512 KB high-water mark

// Helper to get or create a Yjs room
function getYjsRoom(sessionId: string): YjsRoomState {
  if (!yjsRooms.has(sessionId)) {
    yjsRooms.set(sessionId, {
      members: new Map(),
      updateBuffer: [],
      currentBufferSize: 0,
    });
  }
  return yjsRooms.get(sessionId)!;
}

// Helper to serialize updates with length-prefix (4-byte big-endian)
function serializeUpdates(updates: Buffer[]): Buffer {
  let totalSize = 0;
  for (const update of updates) {
    totalSize += 4 + update.length; // 4 bytes for length + update
  }
  const result = Buffer.alloc(totalSize);
  let offset = 0;
  for (const update of updates) {
    result.writeUInt32BE(update.length, offset);
    offset += 4;
    update.copy(result, offset);
    offset += update.length;
  }
  return result;
}

// Helper to deserialize updates from blob
function deserializeUpdates(blob: Buffer): Buffer[] {
  const updates: Buffer[] = [];
  let pos = 0;
  while (pos + 4 <= blob.length) {
    const len = blob.readUInt32BE(pos);
    pos += 4;
    if (pos + len > blob.length) break;
    updates.push(blob.slice(pos, pos + len));
    pos += len;
  }
  return updates;
}

// Helper to persist room state to Node API
async function persistYjsRoomState(sessionId: string, updates: Buffer[]): Promise<void> {
  try {
    const blob = serializeUpdates(updates);
    const url = `${process.env.API_URL || 'http://localhost:5000'}/api/boards/yjs/${sessionId}`;
    const internalSecret = process.env.INTERNAL_SECRET || '';
    
    await axios.post(url, blob, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-internal-secret': internalSecret,
      },
    });
    console.log(`[yjs] Persisted ${blob.length} bytes for room ${sessionId}`);
  } catch (err) {
    console.error(`[yjs] Error persisting room ${sessionId}:`, err);
  }
}

// Helper to fetch room state from Node API
async function fetchYjsRoomState(sessionId: string): Promise<Buffer | null> {
  try {
    const url = `${process.env.API_URL || 'http://localhost:5000'}/api/boards/yjs/${sessionId}`;
    const internalSecret = process.env.INTERNAL_SECRET || '';
    
    const response = await axios.get(url, {
      headers: { 'x-internal-secret': internalSecret },
      responseType: 'arraybuffer',
    });
    
    if (response.data && response.data.byteLength > 0) {
      console.log(`[yjs] Fetched ${response.data.byteLength} bytes for room ${sessionId}`);
      return Buffer.from(response.data);
    }
    return null;
  } catch (err: any) {
    if (err.response?.status === 404) {
      console.log(`[yjs] Room ${sessionId} not found (404)`);
      return null;
    }
    console.error(`[yjs] Error fetching room ${sessionId}:`, err);
    return null;
  }
}

// Helper to broadcast to Yjs room
function broadcastToYjsRoom(sessionId: string, event: string, data: any, exclude?: string) {
  const room = yjsRooms.get(sessionId);
  if (!room) return;
  
  io.to(sessionId).emit(event, data);
  if (exclude) {
    io.to(sessionId).except(exclude).emit(event, data);
  }
}

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

  // ─────────────────────────────────────────────────────────────────────────────
  // ── Yjs Collaboration (inksubserver fallback) ────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────

  // Join a Yjs collaboration room
  socket.on('join', async (data: { sessionId: string; userId: string; username: string }) => {
    const { sessionId, userId, username } = data;
    
    if (!sessionId) {
      socket.emit('error', { message: 'missing sessionId' });
      return;
    }

    // Leave previous Yjs room if any
    const previousRoom = socketToYjsRoom.get(socket.id);
    if (previousRoom) {
      socket.leave(previousRoom);
      const room = yjsRooms.get(previousRoom);
      if (room) {
        room.members.delete(socket.id);
        const count = room.members.size;
        io.to(previousRoom).emit('userCount', { count });
        if (count === 0) {
          yjsRooms.delete(previousRoom);
        }
      }
    }

    // Join new room
    socket.join(sessionId);
    socketToYjsRoom.set(socket.id, sessionId);
    
    const room = getYjsRoom(sessionId);
    const isFirstMember = room.members.size === 0;
    room.members.set(socket.id, { userId, username });

    console.log(`[yjs] ${socket.id} joined ${sessionId} | Room size: ${room.members.size}`);

    // Send joined ack
    socket.emit('joined', { sessionId, ok: true });

    // Broadcast updated user count
    const count = room.members.size;
    io.to(sessionId).emit('userCount', { count });

    // If first member, fetch persisted state from Node API
    if (isFirstMember) {
      try {
        const blob = await fetchYjsRoomState(sessionId);
        if (blob && blob.length > 0) {
          const updates = deserializeUpdates(blob);
          for (const update of updates) {
            socket.emit('replay_updates', update);
          }
          console.log(`[yjs] Hydrated ${sessionId} with ${updates.length} updates`);
        }
      } catch (err) {
        console.error(`[yjs] Error hydrating ${sessionId}:`, err);
      }
    }
  });

  // Handle cursor position broadcasts (JSON)
  socket.on('cursor', (data: { x: number; y: number }) => {
    const sessionId = socketToYjsRoom.get(socket.id);
    if (!sessionId) return;

    const room = yjsRooms.get(sessionId);
    if (!room) return;

    const userInfo = room.members.get(socket.id);
    if (!userInfo) return;

    // Server injects identity for security
    io.to(sessionId).except(socket.id).emit('cursor', {
      userId: userInfo.userId,
      username: userInfo.username,
      x: data.x,
      y: data.y,
    });
  });

  // Handle binary Yjs updates
  socket.on('yjs_update', (update: Buffer) => {
    const sessionId = socketToYjsRoom.get(socket.id);
    if (!sessionId) return;

    const room = yjsRooms.get(sessionId);
    if (!room) return;

    // Buffer the update
    const updateBuf = Buffer.isBuffer(update) ? update : Buffer.from(update);
    room.updateBuffer.push(updateBuf);
    room.currentBufferSize += updateBuf.length;

    // Check high-water mark (512 KB)
    if (room.currentBufferSize >= MAX_BUFFER_SIZE_BYTES) {
      const bufferToPersist = room.updateBuffer.splice(0);
      room.currentBufferSize = 0;
      
      // Persist asynchronously
      persistYjsRoomState(sessionId, bufferToPersist).catch((err) => {
        console.error(`[yjs] Failed to persist ${sessionId}:`, err);
      });

      console.log(`[yjs] Threshold reached (${MAX_BUFFER_SIZE_BYTES} bytes) for ${sessionId}. Flushed to API.`);
    }

    // Relay to other peers
    socket.to(sessionId).emit('yjs_update', updateBuf);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`🔴 Disconnected: ${socket.id}`);
    
    // Clean up stroke room
    const boardId = socketToBoard.get(socket.id);
    if (boardId) {
      removeFromRoom(boardId, socket.id);
      socketToBoard.delete(socket.id);
      const newCount = getRoomCount(boardId);
      io.to(boardId).emit('user_count', newCount);
      console.log(`   Room ${boardId} now has ${newCount} users`);
    }

    // Clean up Yjs room
    const sessionId = socketToYjsRoom.get(socket.id);
    if (sessionId) {
      const room = yjsRooms.get(sessionId);
      if (room) {
        room.members.delete(socket.id);
        const count = room.members.size;
        io.to(sessionId).emit('userCount', { count });
        console.log(`[yjs] ${socket.id} left ${sessionId} | Room size: ${count}`);
        
        // Remove empty rooms
        if (count === 0) {
          yjsRooms.delete(sessionId);
        }
      }
      socketToYjsRoom.delete(socket.id);
    }
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT;
if (!PORT) {
    throw new Error('PORT is not defined in .env');
}

server.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));