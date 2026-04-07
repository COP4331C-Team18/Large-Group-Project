import express from 'express';
import { getMyBoards, joinBoardByCode, createBoard, updateBoard, deleteBoard } from '../controllers/boardController';
import { protect } from '../middleware/jwtProtect';

const router = express.Router();

// Protected route to fetch user's boards
router.get('/', protect, getMyBoards);

// Protected route to CREATE a new board
router.post('/', protect, createBoard);

// Protected route to UPDATE a board
router.put('/:id', protect, updateBoard);

// Protected route to DELETE a board
router.delete('/:id', protect, deleteBoard);

// PUBLIC route for joining via 6-digit code
router.get('/join/:code', joinBoardByCode);

export default router;