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

export const setBoardJoinCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { joinCode } = req.body;

    // Validate joinCode format (must be a 6-character hex string, e.g. "3F2A1B")
    if (!/^[0-9A-Fa-f]{6}$/.test(joinCode)) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: 'Join code must be a 6-character hex code' });
    }

    // Normalize to uppercase before saving
    const normalizedCode = joinCode.toUpperCase();

    // Find the board and make sure the current user is the owner
    const board = await Board.findOne({ _id: id, owner: userId });

    if (!board) {
      return res.status(HTTPStatusCodes.NOT_FOUND).json({ error: 'Board not found or unauthorized' });
    }

    board.joinCode = normalizedCode;
    await board.save();

    return res.status(HTTPStatusCodes.OK).json(board);
  } catch (err) {
    console.error("Error setting join code:", err);
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server error setting join code' });
  }
};


// GET /api/boards/join/:code
// PUBLIC: Fetches a single board using its 6-digit access code
export const joinBoardByCode = async (req: Request, res: Response) => {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;

    // Find the board with this exact 6-digit code (normalise to uppercase to match stored format)
    const board = await Board.findOne({ joinCode: code.toUpperCase() });
    
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

export const getBoardById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Find the board and make sure the current user is the owner
    const board = await Board.findOne({ _id: id, owner: userId });

    if (!board) {
      return res.status(HTTPStatusCodes.NOT_FOUND).json({ error: 'Board not found or unauthorized' });
    }

    return res.status(HTTPStatusCodes.OK).json(board);
  } catch (err) {
    console.error("Error fetching board by ID:", err);
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server error fetching board' });
  }
};

// POST /api/boards
// PROTECTED: Creates a new board for the logged-in user
export const createBoard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const { title = 'Untitled Board', description = '', category = 'General' } = req.body;

    // Create and save the new board
    const newBoard = new Board({
      title,
      description,
      category,
      owner: userId
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

// GET /api/boards/yjs/:sessionId
// INTERNAL (inksubserver only): returns the stored binary Yjs state for a board
export const getYjsState = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const board = await Board.findOne({ joinCode: sessionId });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    if (!board.yjsUpdate || board.yjsUpdate.length === 0) return res.status(204).send();
    res.set('Content-Type', 'application/octet-stream');
    return res.send(board.yjsUpdate);
  } catch (err) {
    console.error('Error fetching Yjs state:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/boards/yjs/:sessionId
// INTERNAL: Appends binary Yjs updates to the board state
export const saveYjsState = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const incomingBuffer = req.body; // Ensure express.raw() middleware is used

    if (!Buffer.isBuffer(incomingBuffer) || incomingBuffer.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty body' });
    }

    // Use findOneAndUpdate with $set and $concat (or manual append)
    const board = await Board.findOne({ joinCode: sessionId });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    // APPEND logic: Combine existing data with new chunk
    const existingUpdate = board.yjsUpdate || Buffer.alloc(0);
    const combinedBuffer = Buffer.concat([existingUpdate, incomingBuffer]);

    board.yjsUpdate = combinedBuffer;
    
    // Optional: Only push to revisions on "Last Leave" to save DB space, 
    // or keep it here for granular history.
    board.revisions.push({ 
      yjsUpdate: incomingBuffer, 
      userId: board.owner, 
      savedAt: new Date() 
    });

    await board.save();
    
    console.log(`[api] Appended ${incomingBuffer.length} bytes to room ${sessionId}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error saving Yjs state:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/boards/yjs/:sessionId/close
// INTERNAL (inksubserver only): sets the joinCode to null after room is empty for 5 minutes
export const closeYjsRoom = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const board = await Board.findOne({ joinCode: sessionId });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    
    // Use undefined so Mongoose unsets the field, bypassing the unique constraint for multiple closed rooms
    board.joinCode = undefined as any;
    await board.save();
    return res.status(200).json({ ok: true, message: 'Room closed' });
  } catch (err) {
    console.error('Error closing Yjs room:', err);
    return res.status(500).json({ error: 'Server error' });
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