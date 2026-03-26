import { Router } from "express";
import { getAllBoards, getBoardById, createBoard, updateBoard, deleteBoard } from "./boardController.js";

const router = Router();

router.get("/", getAllBoards);
router.post("/", createBoard);
router.get("/:id", getBoardById);
router.patch("/:id", updateBoard);
router.delete("/:id", deleteBoard);

export default router;
