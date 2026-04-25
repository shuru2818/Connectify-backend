import express from "express";
import {
  sendMessage,
  getMessagesByChatId,
  markMessagesAsRead
} from "../controller/messageController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/:chatId", protect, getMessagesByChatId);
router.put("/read", protect, markMessagesAsRead);

export default router;