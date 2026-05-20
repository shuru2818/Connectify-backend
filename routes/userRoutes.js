import express from "express";
import {
  searchUsers,
  getUserById,
  getAllUsers,
} from "../controller/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import User from "../models/User.js";

const router = express.Router();


// GET ALL USERS
router.get("/", protect, getAllUsers);


// SEARCH USERS
router.get("/search", protect, searchUsers);


// GET SINGLE USER
router.get("/:id", protect, getUserById);



// UPDATE USER PROFILE
router.put("/update/:id", protect, async (req, res) => {
  try {

    const { username, about } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.username = username || user.username;
    user.about = about || user.about;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});



// UPLOAD PROFILE PIC
router.put(
  "/upload-profile/:id",
  protect,
  upload.single("profilePic"),
  async (req, res) => {
    try {

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // CLOUDINARY IMAGE URL
      user.profilePic = req.file.path;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile picture uploaded",
        profilePic: user.profilePic,
        user,
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

export default router;