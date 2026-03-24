import { Router } from "express";
import { getAllUsers, getUserById, updateUser, deleteUser } from "./userController";

const router = Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id/username", updateUser);
router.delete("/:id", deleteUser);

export default router;
