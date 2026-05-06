import express from "express";
import {
  sendMessage,
  getMessagesByChatId,
  markMessagesAsRead,
  deleteMessage,
  updateMessage
} from "../controller/messageController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/send", protect, upload.single("file"),sendMessage);
router.get("/:chatId", protect, getMessagesByChatId);
router.put("/read", protect, markMessagesAsRead);
router.delete("/:messageId", protect, deleteMessage);
router.put("/:messageId", protect, updateMessage);

export default router;