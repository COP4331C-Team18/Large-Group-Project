import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    
    // 1. Look for the token in the cookies instead of the header
    const token = req.cookies.token;

    if (token) {
        try {
            // 2. Verify the token
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET as string
            ) as { id: string; username: string };

            // 3. Admin logic (unchanged)
            if(!decoded.id || !decoded.username) {
                res.status(401);
                throw new Error('Not authorized, invalid token payload');
            }

            // 4. Find the user and attach to req.user
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                res.status(401);
                throw new Error('User no longer exists');
            }

            (req as any).user = user;
            
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        // 5. If no cookie is found
        res.status(401);
        throw new Error('Not authorized, no token provided');
    }
});