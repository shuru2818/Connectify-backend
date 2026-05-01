import express from "express"
import { createOrGetPrivateChat, accessChat } from "../controller/chatController.js"
import { protect } from "../middleware/authMiddleware.js"

const router =  express.Router();

router.post("/create", protect, createOrGetPrivateChat);
router.post("/access", protect, accessChat);

export default router;