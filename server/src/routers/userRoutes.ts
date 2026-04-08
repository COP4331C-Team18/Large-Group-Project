import { Router } from "express";
import { getAllUsers, getUserById, updateUser, updatePassword, deleteUser } from "../controllers/userController.js";

const router = Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id/username", updateUser);
router.put("/:id/password", updatePassword);
router.delete("/:id", deleteUser);

export default router;
