import { Request, Response } from "express";
import User from "../models/User";
//import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { signAccessToken, verifyAccessToken } from "../utils/jwtUtils";
import { HTTPStatusCodes } from "../utils/statusCodes";


const MIN_PASSWORD_LENGTH = 10; // Define minimum password length
const JWT_EXPIRATION = "1h"; // token valid for 1 hour

// Helper functions
// generating 6 digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// sending verification code to email using nodemailer
async function sendVerificationEmail(email: string, code: string, expirationMins: number) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER or EMAIL_PASS is not configured");
  }

  // Create transporter using environment variables for email credentials
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `Inkboard <${emailUser}>`,
      to: email,
      subject: "Verify your Inkboard account",
      text: `Your Inkboard verification code is: ${code}. Expires in ${expirationMins} minutes.`,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
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
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Missing login or password" });
  }

  try {
    // Allowing login by username OR email
    const user = await User.findOne({
      $or: [{ username: login }, { email: login }],
    });

    if (!user) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: "Invalid login or password" });
    }

    // Check if email is verfied for users
    if (user.provider === "inkboard" && !user.verified) {
      return res.status(HTTPStatusCodes.FORBIDDEN).json({ error: "Email not verified." });
    }

    // Check if the email is already registered with google  as a provider
    if (user.provider === "google") {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({
        error: "This email is registered with Google. Please sign in with Google."
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: "Invalid login or password" });
    }

    // Create JWT (expires in 7 days)
    const token = signAccessToken(
      { id: user._id, username: user.username },
      JWT_EXPIRATION
    );

    return res.status(HTTPStatusCodes.OK).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Server error" });
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
export async function signup(req: Request, res: Response) {
  const { username, email, password } = req.body;
  const verificationExpirationMins = 10;

  // Basic field validation
  if (!username || !email || !password) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Missing required fields" });
  }

  // Email format check with regex
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Invalid email format" });
  }

  // Password length check
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
  }

  try {
    // Check for duplicates
    const alreadyExists = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (alreadyExists) {
      return res.status(HTTPStatusCodes.CONFLICT).json({ error: "Username or email already exists" });
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
      verificationCodeExpires: new Date(Date.now() + verificationExpirationMins * 60 * 1000),
    });

    // Send verification email using nodemailer
    try {
      await sendVerificationEmail(user.email, verificationCode, verificationExpirationMins);
    } catch (emailErr) {
      await User.deleteOne({ _id: user._id }); // delete user if email sending fails
      return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Unable to send verification email. Please try again." });
    }


    return res.status(HTTPStatusCodes.CREATED).json({
      message: "Verification code sent to email.",
      email: user.email,
    });
  } catch (err) {
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Server error" });
  }
}





// POST /api/auth/verify-email
export async function verifyEmail(req: Request, res: Response) {  
  const { email, verificationCode } = req.body;

  // Basic field validation
  if(!email || !verificationCode) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Missing email or verification code" });
  } 

  try {
    const user = await User.findOne({ email });

    if(!user) {
      return res.status(HTTPStatusCodes.NOT_FOUND).json({ error: "User not found" });
    }

    // check verification status of user
    if(user.verified) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Email already verified" });
    }

    // Check if verification code matches
    if(user.verificationCode !== verificationCode) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Invalid verification code" });
    }

    // Check if code is expired
    if(!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Verification code expired" });
    }

    // Email is verified
    // updating user docs
    user.verified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Creating JWT (expires in 7 days)
    const token = signAccessToken(
      { id: user._id, username: user.username },
      JWT_EXPIRATION
    );

    // Return payload with token and user info
    return res.status(HTTPStatusCodes.OK).json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (err) {
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Server error" });
  }

}

// POST /api/auth/google
export async function googleOAuth(req: Request, res: Response) {
  const { idToken } = req.body;

  // Basic field validation
  if (!idToken) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Missing ID token" });
  }

  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    // Check if Google Client ID is configured
    if (!googleClientId) {
      return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Google configuration is missing" });
    }

    // Creating OAuth2 client
    const client = new OAuth2Client(googleClientId);

    // Verifying the ID token with google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    // Extracting user info from token payload
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.name) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Invalid token payload" });
    }

    const email = payload.email;
    const name = payload.name;
    const googleId = payload.sub;

    // Find existing user or create new one
    let user = await User.findOne({ email });

    if (user) {
      // User exists - verify they used Google to login
      if (user.provider !== "google") {
        return res.status(HTTPStatusCodes.CONFLICT).json({ error: "Email already registered with a different provider" });
      }
    } else {
      // Create new Google user 
      user = await User.create({
        username: name.replace(/\s+/g, "").toLowerCase() + "_" + googleId.slice(0, 8),
        email,
        password: "", // Google users don't have password
        provider: "google",
        verified: true, // verified by Google
      });
    }

    // Create JWT (expires in 7 days)
    const token = signAccessToken(
      { id: user._id, username: user.username },
      JWT_EXPIRATION
    );

    // Return payload for successful login
    return res.status(HTTPStatusCodes.OK).json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);

    // inadded error handling for invalid token
    if (err.message?.includes("Invalid token")) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: "Invalid or expired token" });
    }
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Server error" });
  }
}


// POST /api/auth/resend-verification
export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body;
  
  // Basic field validation
  if (!email) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Missing email" });
  }

  try {
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(HTTPStatusCodes.NOT_FOUND).json({ error: "User not found" });
    }

    // Check if user is already verified
    if (user.verified) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Email already verified" });
    }

    // Generating a new verification code
    const verificationExpirationMins = 10;
    const verificationCode = generateVerificationCode();

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + verificationExpirationMins * 60 * 1000); // code expires in 10 mins
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationCode, verificationExpirationMins);

    return res.status(HTTPStatusCodes.OK).json({
      message: "Verification code resent to email.",
      email: user.email,
    });

  } catch (err) {
    console.error("Error in resend verification:", err);
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Server error" });
  }   
}
