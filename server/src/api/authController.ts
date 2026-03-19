import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const MIN_PASSWORD_LENGTH = 10; // Define minimum password length

// Helper functions
// generating 6 digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


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

    // Check if email is verfied for users
    if (user.provider === "inkboard" && !user.verified) {
      return res.status(403).json({ error: "Email not verified." });
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
  Sample payload for signup endpoint:
  {
    "username": "user1",
    "email": "user1@example.com",
    "password": "password123"
  }
*/

// POST /api/auth/signup
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

    

    // generating a 6 digit verification code
    const verificationCode = generateVerificationCode();

    // Create user 
    const user = await User.create({ 
      username, 
      email, 
      password,
      provider: "inkboard",
      verified: false, // must call verify-email endpoint to verify email
      verificationCode,
      verificationCodeExpires: new Date(Date.now() + (10 * 60 * 1000)), // code expires in 10 minutes
    });


    return res.status(201).json({
      message: "Verification code sent to email.",
      email: user.email,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}



// POST /api/auth/verify-email
export async function verifyEmail(req: Request, res: Response) {  
  const { email, verificationCode } = req.body;

  // Basic field validation
  if(!email || !verificationCode) {
    return res.status(400).json({ error: "Missing email or verification code" });
  } 

  try {
    const user = await User.findOne({ email });

    if(!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // check verification status of user
    if(user.verified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Check if verification code matches
    if(user.verificationCode !== verificationCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Check if code is expired
    if(!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ error: "Verification code expired" });
    }

    // Email is verified
    // updating user docs
    user.verified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Creating JWT (expires in 7 days)
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return payload with token and user info
    return res.status(200).json({
      message: "Email verified successfully",
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
