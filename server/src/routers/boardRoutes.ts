import express from 'express';
import { getMyBoards, joinBoardByCode, createBoard } from '../controllers/boardController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected route to fetch user's boards
router.get('/', authenticateToken, getMyBoards);

// Protected route to CREATE a new board
router.post('/', authenticateToken, createBoard);

// PUBLIC route for joining via 6-digit code
router.get('/join/:code', joinBoardByCode);

export default router;