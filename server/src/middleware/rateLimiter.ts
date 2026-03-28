import { Request, Response, NextFunction } from "express";
import rateLimit from "../config/upstash.js";


// middleware/rateLimiter.js
const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    // If browser is just checking permissions, don't rate limit!
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        const { success } = await rateLimit.limit(req.ip || "127.0.0.1");
        
        if (!success) {
            // IMPORTANT: We must manually add the CORS header here 
            // because Express might skip the cors() middleware on a 429
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
            return res.status(429).json({ message: "Too many requests" });
        }
        next();
    } catch (e) {
        next(); // Don't crash the app if Upstash is down
    }
}

export default rateLimiter;