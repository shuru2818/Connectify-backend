import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import { getMyNotifications, deleteNotifications, markAllAsRead, markAsRead } from "../controller/notificationController.js";

const router = express.Router();

router.get("/allnotifications", protect, getMyNotifications);
router.put("/marks-all-read", protect, markAllAsRead);
router.put("/:id/read", protect, markAsRead);
router.delete("/:id", protect, deleteNotifications);

export default router;