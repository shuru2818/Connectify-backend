import express from "express"
import { createOrGetPrivateChat } from "../controller/chatController.js"
import { protect } from "../middleware/authMiddleware.js"

const router =  express.Router();

router.post("/create", protect, createOrGetPrivateChat);

export default router;