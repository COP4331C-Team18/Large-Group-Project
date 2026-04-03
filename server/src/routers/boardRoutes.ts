import express from 'express';
import { getMyBoards, joinBoardByCode, createBoard, updateBoard, deleteBoard, getBoardById } from '../controllers/boardController.js';
import { protect } from '../middleware/jwtProtect.js';

const router = express.Router();

// Protected route to fetch user's boards
router.get('/', protect, getMyBoards);

// Protected route to CREATE a new board
router.post('/', protect, createBoard);

router.get('/:id', protect, getBoardById);

// Protected route to UPDATE a board
router.put('/:id', protect, updateBoard);

// Protected route to DELETE a board
router.delete('/:id', protect, deleteBoard);

// PUBLIC route for joining via 6-digit code
router.get('/join/:code', joinBoardByCode);

export default router;