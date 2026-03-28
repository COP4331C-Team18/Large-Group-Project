import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { signAccessToken } from "../utils/jwtUtils.js";
import { HTTPStatusCodes } from "../utils/statusCodes.js";
import { Request, Response } from "express";
import * as postmark from "postmark";

const MIN_PASSWORD_LENGTH = 10;
const JWT_EXPIRATION = "1h";

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// send verification email via Postmark
async function sendVerificationEmail(email: string, code: string, expirationMins: number) {
  const apiKey = process.env.POSTMARK_API_KEY;
  const fromAddress = process.env.POSTMARK_FROM_EMAIL;

  if (!apiKey || !fromAddress) {
    throw new Error("POSTMARK_API_KEY or POSTMARK_FROM_EMAIL is not configured in .env");
  }

  const client = new postmark.ServerClient(apiKey);

  await client.sendEmail({
    From: `InkBoard <${fromAddress}>`,
    To: email,
    Subject: "Verify your InkBoard account",
    TextBody: `Your InkBoard verification code is: ${code}\n\nThis code expires in ${expirationMins} minutes.\n\nIf you did not sign up for InkBoard, you can safely ignore this email.`,
    HtmlBody: `
      <div style="font-family: 'Raleway', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ede8df; border-radius: 4px;">
        <h2 style="font-family: 'Lora', Georgia, serif; color: #111410; margin-bottom: 8px;">Verify your InkBoard account</h2>
        <p style="color: #9e8268; margin-bottom: 24px;">Use the code below to complete your sign-up. It expires in <strong>${expirationMins} minutes</strong>.</p>
        <div style="display: flex; gap: 8px; margin-bottom: 24px;">
          ${code.split("").map(d => `
            <div style="
              width: 40px; height: 52px;
              background: #f7f2e8;
              border: 1px solid rgba(74,90,58,0.28);
              border-radius: 3px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-family: 'Lora', Georgia, serif;
              font-size: 22px;
              font-weight: 600;
              color: #2a2d2e;
              text-align: center;
              line-height: 52px;
            ">${d}</div>
          `).join("")}
        </div>
        <p style="color: #9e8268; font-size: 13px;">If you did not sign up for InkBoard, you can safely ignore this email.</p>
      </div>
    `,
    MessageStream: "outbound",
  });
}


// POST /api/auth/login
/*
  Request:  { login: string, password: string }
  Success:  { message, user: { id, username, email } } // token is sent in http-only cookie
  Error:    { error: string }
*/
export async function login(req: Request, res: Response) {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Missing login or password" });
  }

  try {
    const user = await User.findOne({
      $or: [{ username: login }, { email: login }],
    });

    if (!user) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: "Invalid login or password" });
    }

    if (user.provider === "inkboard" && !user.verified) {
      return res.status(HTTPStatusCodes.FORBIDDEN).json({ error: "Email not verified." });
    }

    if (user.provider === "google") {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({
        error: "This email is registered with Google. Please sign in with Google.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: "Invalid login or password" });
    }

    const token = signAccessToken(
      { id: user._id, username: user.username },
      JWT_EXPIRATION
    );

    const httpsEnabled = process.env.PRODUCTION === "true" ? true : false;

    // Returning token in a http-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: httpsEnabled, // Set to true in production (requires HTTPS)
      sameSite: "lax", // for cross-origin requests from frontend
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return res.status(HTTPStatusCodes.OK).json({
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Server error" });
  }
}


// POST /api/auth/signup
/*
  Request:  { username: string, email: string, password: string }
  Success:  { message, email }
  Error:    { error: string }
*/
export async function signup(req: Request, res: Response) {
  const { username, email, password } = req.body;
  const verificationExpirationMins = 10;

  if (!username || !email || !password) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Missing required fields" });
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Invalid email format" });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    });
  }

  try {
    const emailExists = await User.findOne({ email });

    if (emailExists) {
      // Case 1: registered with Google — block and redirect
      if (emailExists.provider === "google") {
        return res.status(HTTPStatusCodes.CONFLICT).json({
          error: "Email already registered with Google. Please sign in with Google.",
        });
      }

      // Case 2: registered but unverified — resend code
      if (!emailExists.verified) {
        const verificationCode = generateVerificationCode();
        emailExists.verificationCode = verificationCode;
        emailExists.verificationCodeExpires = new Date(
          Date.now() + verificationExpirationMins * 60 * 1000
        );
        await emailExists.save();

        try {
          await sendVerificationEmail(emailExists.email, verificationCode, verificationExpirationMins);
        } catch (emailErr) {
          return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Unable to send verification email. Please try again.",
          });
        }

        return res.status(HTTPStatusCodes.OK).json({
          message: "Verification code resent to email. Please check your email.",
          email: emailExists.email,
        });
      }

      // Case 3: already verified — block
      return res.status(HTTPStatusCodes.CONFLICT).json({ error: "Email already registered." });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(HTTPStatusCodes.CONFLICT).json({ error: "Username already exists." });
    }

    const verificationCode = generateVerificationCode();

    const user = await User.create({
      username,
      email,
      password,
      provider: "inkboard",
      verified: false,
      verificationCode,
      verificationCodeExpires: new Date(Date.now() + verificationExpirationMins * 60 * 1000),
    });

    try {
      await sendVerificationEmail(user.email, verificationCode, verificationExpirationMins);
    } catch (emailErr) {
      await User.deleteOne({ _id: user._id });
      return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Unable to send verification email. Please try again.",
      });
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
/*
  Request:  { email: string, verificationCode: string }
  Success:  { message, user: { id, username, email } } // token is sent in http-only cookie
  Error:    { error: string }
*/
export async function verifyEmail(req: Request, res: Response) {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Missing email or verification code" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(HTTPStatusCodes.NOT_FOUND).json({ error: "User not found" });
    }

    if (user.verified) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Email already verified" });
    }

    if (user.verificationCode !== verificationCode) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Invalid verification code" });
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Verification code expired" });
    }

    user.verified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = signAccessToken(
      { id: user._id, username: user.username },
      JWT_EXPIRATION
    );

    const httpsEnabled = process.env.PRODUCTION === "true" ? true : false;
    // Returning token in a http-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: httpsEnabled, // Set to true in production (requires HTTPS)
      sameSite: "lax",
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    return res.status(HTTPStatusCodes.OK).json({
      message: "Email verified successfully",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Server error" });
  }
}


// POST /api/auth/google
/*
  Request:  { idToken: string }
  Success:  { message, user: { id, username, email } } // token is sent in http-only cookie
  Error:    { error: string }
*/
export async function googleOAuth(req: Request, res: Response) {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Missing ID token" });
  }

  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Google configuration is missing",
      });
    }

    const client = new OAuth2Client(googleClientId);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.name) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Invalid token payload" });
    }

    const email = payload.email;
    const name = payload.name;
    const googleId = payload.sub;

    let user = await User.findOne({ email });

    if (user) {
      if (user.provider !== "google") {
        return res.status(HTTPStatusCodes.CONFLICT).json({
          error: "Email already registered with a different provider",
        });
      }
    } else {
      user = await User.create({
        username: name.replace(/\s+/g, "").toLowerCase() + "_" + googleId.slice(0, 8),
        email,
        password: "",
        provider: "google",
        verified: true,
      });
    }

    const token = signAccessToken(
      { id: user._id, username: user.username },
      JWT_EXPIRATION
    );

    const httpsEnabled = process.env.PRODUCTION === "true" ? true : false;

    // Returning token in a http-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: httpsEnabled, // Set to true in production (requires HTTPS)
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return res.status(HTTPStatusCodes.OK).json({
      message: "Google login successful",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err: any) {
    console.error("Google login error:", err);
    if (err.message?.includes("Invalid token")) {
      return res.status(HTTPStatusCodes.UNAUTHORIZED).json({ error: "Invalid or expired token" });
    }
    return res.status(HTTPStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Server error" });
  }
}


// POST /api/auth/resend-verification
/*
  Request:  { email: string }
  Success:  { message, email }
  Error:    { error: string }
*/
export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Missing email" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(HTTPStatusCodes.NOT_FOUND).json({ error: "User not found" });
    }

    if (user.verified) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json({ error: "Email already verified" });
    }

    const verificationExpirationMins = 10;
    const verificationCode = generateVerificationCode();

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + verificationExpirationMins * 60 * 1000);
    await user.save();

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