import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createGroup,
  getMyGroups,
  addUserToGroup,
  searchGroups,
  deleteGroup,
  removeUserFromGroup
} from "../controller/groupController.js";

const router = express.Router();

router.post("/create", protect, createGroup);
router.get("/my", protect, getMyGroups);
router.get("/search", protect, searchGroups);
router.post("/add-user", protect, addUserToGroup);
router.delete("/delete/:groupId", protect, deleteGroup);
router.post("/remove-user", protect, removeUserFromGroup);

export default router;