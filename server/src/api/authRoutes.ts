import { Router } from "express";
import { createaccount, login } from "./authController";

const router = Router();

router.post("/login", login);
router.post("/createaccount", createaccount);


export default router;
