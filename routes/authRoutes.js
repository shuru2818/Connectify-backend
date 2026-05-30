import express from "express";
import { signup, login, logout, getMe, googleLogin, verifyOTP} from "../controller/authControllers.js";
import { protect } from "../middleware/authMiddleware.js";
// import { sendOTPEmail } from "../services/EmailServices.js";
// import { generateOTP } from "../services/OTPGenerator.js";


const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/profile", protect, getMe);
router.post("/google", googleLogin);
router.post("/verify-otp", verifyOTP);

export default router;