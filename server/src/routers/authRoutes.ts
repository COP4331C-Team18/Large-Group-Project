import { Router } from "express";
import { signup, login, verifyEmail, googleOAuth, resendVerification, getCurrentUser, logout, forgotPassword, resetPassword } from "../controllers/authController.js";
import { protect } from "../middleware/jwtProtect.js";

const router = Router();

// Public routes
router.post("/login", login);
router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/google", googleOAuth);
router.post("/resend-verification", resendVerification);
router.post("/logout", logout); 
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", protect, getCurrentUser); // gets current user info based on token in cookie
export default router;
