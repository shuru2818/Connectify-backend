import express from "express";
import { signup, login, logout, getMe, googleLogin } from "../controller/authControllers.js";
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/profile", protect, getMe);
router.post("/google", googleLogin);

export default router;