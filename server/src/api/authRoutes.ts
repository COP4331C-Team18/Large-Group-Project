import { Router } from "express";
import { createaccount, login } from "./authController";

const router = Router();

router.post("/login", login);
router.post("/signup", createaccount);
// router.post("/verify-email", verifyEmail);
// router.post("/google", googleOAuth);

export default router;
