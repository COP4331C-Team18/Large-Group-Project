import express, { Request, Response, NextFunction } from 'express';
import { getMyBoards, joinBoardByCode, createBoard, updateBoard, deleteBoard, getBoardById, getYjsState, saveYjsState, setBoardJoinCode, closeYjsRoom } from '../controllers/boardController.js';
import { protect } from '../middleware/jwtProtect.js';
import { set } from 'mongoose';

const router = express.Router();

// ── Internal middleware: only inksubserver may call /yjs/* routes ──────────────
const yjsInternalAuth = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.INTERNAL_SECRET;
  if (!secret || req.headers['x-internal-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};

// ── Internal Yjs persistence routes (called by inksubserver, not by browsers) ──
// Must be declared before /:id to avoid Express matching "yjs" as an id param.
router.get('/yjs/:sessionId', yjsInternalAuth, getYjsState);
router.post(
  '/yjs/:sessionId',
  yjsInternalAuth,
  express.raw({ type: 'application/octet-stream', limit: '50mb' }),
  saveYjsState,
);
router.post('/yjs/:sessionId/close', yjsInternalAuth, closeYjsRoom);

// ── Public route for joining via 6-digit code ─────────────────────────────────
router.get('/join/:code', joinBoardByCode);

// ── Protected board CRUD ──────────────────────────────────────────────────────
router.post('/:id/joinCode', protect, setBoardJoinCode);
router.get('/', protect, getMyBoards);
router.post('/', protect, createBoard);
router.get('/:id', protect, getBoardById);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);

export default router;