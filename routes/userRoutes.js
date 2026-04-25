import express from "express";
import { searchUsers, getUserById } from "../controller/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/search", protect, searchUsers);
router.get("/:id", protect, getUserById);

export default router;