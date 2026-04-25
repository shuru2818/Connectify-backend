import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendInvitation, rejectInvitation, getMyInvitation, acceptInvitation } from "../controller/invitationController.js";

const router  = express.Router();

router.post("/send", protect, sendInvitation);
router.post("/:id/accept", protect, acceptInvitation);
router.post("/:id/reject", protect, rejectInvitation);
router.get("/all", protect, getMyInvitation);

export default router;
