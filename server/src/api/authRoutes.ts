import { Router } from "express";
import { signup, login, verifyEmail, googleOAuth, resendVerification } from "./authController";

const router = Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/google", googleOAuth);
router.post("/resend-verification", resendVerification);

export default router;
