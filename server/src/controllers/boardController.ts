import { Request, Response } from 'express';
import Board from '../models/Board'; // Make sure you saved the Board.ts model we updated earlier!
import { AuthRequest } from '../middleware/authMiddleware';
import { HTTPStatusCodes } from '../utils/statusCodes';

// GET /api/boards
// PROTECTED: Fetches only the boards owned by the logged-in user
export const getMyBoards = async (req: AuthRequest, res: Response) => {
  try {
    // req.user is attached by the protect middleware
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: 'User ID missing' });
    }

    // Find all boards owned by this user, newest first
    const boards = await Board.find({ owner: userId }).sort({ updatedAt: -1 });
    
    return res.status(HTTPStatusCodes.OK).json(boards);
  } catch (err) {
    console.error("Error fetching boards:", err);
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server error fetching boards' });
  }
};


// GET /api/boards/join/:code
// PUBLIC: Fetches a single board using its 6-digit access code
export const joinBoardByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    // Find the board with this exact 6-digit code
    const board = await Board.findOne({ joinCode: code });
    
    if (!board) {
      return res.status(HTTPStatusCodes.NOT_FOUND).json({ error: 'Invalid room code.' });
    }

    // Success! Return the board data (which includes the board._id we need for Socket.io)
    return res.status(HTTPStatusCodes.OK).json(board);
  } catch (err) {
    console.error("Error joining board:", err);
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server error joining board' });
  }
};

// Helper function to generate a 6-digit string
const generateJoinCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/boards
// PROTECTED: Creates a new board for the logged-in user
export const createBoard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const { title = 'Untitled Board', description = '', category = 'General' } = req.body;

    let joinCode = generateJoinCode();
    let isUnique = false;

    // Ensure the 6-digit code doesn't already exist in the database
    while (!isUnique) {
      const existingBoard = await Board.findOne({ joinCode });
      if (!existingBoard) {
        isUnique = true;
      } else {
        joinCode = generateJoinCode(); // Try again if it exists
      }
    }

    // Create and save the new board
    const newBoard = new Board({
      title,
      description,
      category,
      owner: userId,
      joinCode
    });

    await newBoard.save();

    return res.status(HTTPStatusCodes.CREATED).json(newBoard);
  } catch (err: any) {
    console.error("Error creating board:", err);
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Server error creating board',
      details: err.message,
      stack: err.stack
    });
  }
};

// PUT /api/boards/:id
// PROTECTED: Updates a board's details
export const updateBoard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { title, description, category } = req.body;

    // Find the board and make sure the current user is the owner
    const board = await Board.findOne({ _id: id, owner: userId });

    if (!board) {
      return res.status(HTTPStatusCodes.NOT_FOUND).json({ error: 'Board not found or unauthorized' });
    }

    if (title !== undefined) board.set('title', title);
    if (description !== undefined) board.set('description', description);
    if (category !== undefined) board.set('category', category);

    await board.save();

    return res.status(HTTPStatusCodes.OK).json(board);
  } catch (err) {
    console.error("Error updating board:", err);
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server error updating board' });
  }
};

// DELETE /api/boards/:id
// PROTECTED: Deletes a board
export const deleteBoard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Find the board and make sure the current user is the owner before deleting
    const board = await Board.findOneAndDelete({ _id: id, owner: userId });

    if (!board) {
      return res.status(HTTPStatusCodes.NOT_FOUND).json({ error: 'Board not found or unauthorized' });
    }

    return res.status(HTTPStatusCodes.OK).json({ message: 'Board deleted successfully' });
  } catch (err) {
    console.error("Error deleting board:", err);
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server error deleting board' });
  }
};