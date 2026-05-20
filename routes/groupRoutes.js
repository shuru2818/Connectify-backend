import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createGroup,
  getMyGroups,
  addUserToGroup,
  searchGroups,
  deleteGroup,
  removeUserFromGroup,
  updateGroupImage
} from "../controller/groupController.js";

import upload from "../middleware/upload.js";

const router = express.Router();


// CREATE GROUP WITH IMAGE
router.post(
  "/create",
  protect,
  upload.single("groupImage"),
  createGroup
);


// GET MY GROUPS
router.get("/my", protect, getMyGroups);


// SEARCH GROUPS
router.get("/search", protect, searchGroups);


// ADD USER
router.post("/add-user", protect, addUserToGroup);


// REMOVE USER
router.post("/remove-user", protect, removeUserFromGroup);


// DELETE GROUP
router.delete("/delete/:groupId", protect, deleteGroup);

//image 
router.put("/update-image/:groupId", protect, upload.single("groupImage"),updateGroupImage);

export default router;