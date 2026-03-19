import { Router } from "express";
import { createaccount, login } from "./authController";

const router = Router();

router.post("/login", login);
router.post("/createaccount", createaccount);
// router.post("/verify-email", verifyEmail);
// router.post("/google-oauth", googleOAuth);

export default router;
