import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const MIN_PASSWORD_LENGTH = 10; // Define minimum password length


/* 
 Sample payload for login endpoint:
 {
   "login": "user1", // can be either username or email
   "password": "password123"
 }
*/

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const { login, password } = req.body;

  // Basic json field validation
  if (!login || !password) {
    return res.status(400).json({ error: "Missing login or password" });
  }

  try {
    // Allowing login by username OR email
    const user = await User.findOne({
      $or: [{ username: login }, { email: login }],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid login or password" });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid login or password" });
    }

    // Create JWT (expires in 7 days)
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}



/*
  Sample payload for createaccount endpoint:
  {
    "username": "user1",
    "email": "user1@example.com",
    "password": "password123"
  }
*/

// POST /api/auth/createaccount
export async function createaccount(req: Request, res: Response) {
  const { username, email, password } = req.body;

  // Basic field validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Email format check with regex
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Password length check
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
  }

  try {
    // Check duplicates
    const alreadyExists = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (alreadyExists) {
      return res.status(409).json({ error: "Username or email already exists" });
    }

    // Create user (password hashing happens in the model)
    const user = await User.create({ username, email, password });

    // Create JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
