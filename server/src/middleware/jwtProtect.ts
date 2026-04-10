import jwt from 'jsonwebtoken';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

interface JwtPayload {
  id: string;
  username: string;
}

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  // No token at all
  if (!token) {
    // Special case: /auth/me must return authenticated: false
    if (req.originalUrl.endsWith("/me")) {
      return res.status(401).json({ authenticated: false });
    }

    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (!decoded.id || !decoded.username) {
      if (req.originalUrl.endsWith("/me")) {
        return res.status(401).json({ authenticated: false });
      }
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      if (req.originalUrl.endsWith("/me")) {
        return res.status(401).json({ authenticated: false });
      }
      return res.status(401).json({ error: "User ID missing" });
    }

    // Sliding session refresh — issue new 20m token
    const newToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "20m" }
    );

    const isProd = process.env.PRODUCTION === "true";

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 20 * 60 * 1000,
    });

    (req as any).user = user;
    return next();

  } catch (error) {
    console.error(`JWT VERIFICATION ERROR: ${error}`);

    if (req.originalUrl.endsWith("/me")) {
      return res.status(401).json({ authenticated: false });
    }

    return res.status(401).json({ error: "Unauthorized" });
  }
});
