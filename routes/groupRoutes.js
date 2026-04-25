import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createGroup,
  getMyGroups,
  addUserToGroup,
  searchGroups,
} from "../controller/groupController.js";

const router = express.Router();

router.post("/create", protect, createGroup);
router.get("/my", protect, getMyGroups);
router.get("/search", protect, searchGroups);
router.post("/add-user", protect, addUserToGroup);

export default router;