import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwtUtils.js';
import { HTTPStatusCodes } from '../utils/statusCodes.js';

// Extend the standard Express Request so TypeScript knows we are adding a 'user' property
export interface AuthRequest extends Request {
  user?: any; 
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Get the token from the "Authorization: Bearer <token>" header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 2. If there is no token, reject the request immediately
  if (!token) {
    return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ 
      error: 'Access denied. No token provided.' 
    });
  }

  try {
    // 3. Verify the token (this throws an error if it's expired or tampered with)
    const decoded = verifyAccessToken(token);
    
    // 4. Attach the decoded user data (like user ID) to the request object
    // This allows your controllers (like getMyBoards) to know exactly who is asking!
    req.user = decoded; 
    
    // 5. Hand off control to the actual route controller
    next(); 
  } catch (err) {
    return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ 
      error: 'Invalid or expired token.' 
    });
  }
};