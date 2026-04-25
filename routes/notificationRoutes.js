import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import { getMyNotifications, deleteNotifications, markAllAsRead, markAsRead } from "../controller/notificationController.js";

const router = express.Router();

router.get("/allnotifications", protect, getMyNotifications);
router.get("/marksallread", protect, markAllAsRead);
router.get("/:id/read", protect, markAsRead);
router.get("/:id", protect, deleteNotifications);

export default router;