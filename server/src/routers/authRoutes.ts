import { Router } from "express";
import { signup, login, verifyEmail, googleOAuth, resendVerification, getCurrentUser, logout } from "../controllers/authController";
import { protect } from "../middleware/jwtProtect";

const router = Router();

// Public routes
router.post("/login", login);
router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/google", googleOAuth);
router.post("/resend-verification", resendVerification);
router.post("/logout", logout); 

// Protected routes
router.get("/me", protect, getCurrentUser); // gets current user info based on token in cookie
export default router;
