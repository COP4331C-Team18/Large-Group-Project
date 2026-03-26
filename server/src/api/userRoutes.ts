import { Router } from "express";
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from "./userController.js";

const router = Router();

router.get("/", getAllUsers);
router.post("/", createUser);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
