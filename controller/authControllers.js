import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { sendOTPEmail } from "../services/EmailServices.js";
import { generateOTP } from "../services/OTPGenerator.js";

//verfication of OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // OTP attempts check
    if (!user.otpAttempts) user.otpAttempts = 0;

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        message: "Too many attempts. Try again later.",
      });
    }

    if (user.otp !== otp) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;

    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Email verified successfully",
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//google login

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: name,
        email,
        profilePic: picture,
        authType: "google",
        isVerified: true,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Google Login Failed",
      error: error.message,
    });
  }
};

//signup function

export const signup = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    // -------------------------
    // 1. VALIDATION
    // -------------------------
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone ? phone.trim() : null;

    // -------------------------
    // 2. CHECK EXISTING USER (SAFE)
    // -------------------------
    const query = [{ email: cleanEmail }];

    if (cleanPhone) {
      query.push({ phone: cleanPhone });
    }

    const existingUser = await User.findOne({
      $or: query,
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return res.status(409).json({
          message: "User already exists with this email",
        });
      }

      if (cleanPhone && existingUser.phone === cleanPhone) {
        return res.status(409).json({
          message: "User already exists with this phone number",
        });
      }
    }

    // -------------------------
    // 3. HASH PASSWORD
    // -------------------------
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // -------------------------
    // 4. GENERATE OTP
    // -------------------------
    const otp = generateOTP();

    // -------------------------
    // 5. CREATE USER (PENDING VERIFICATION)
    // -------------------------
    const newUser = await User.create({
      username: username.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
      isVerified: false,
    });

    // -------------------------
    // 6. SEND OTP EMAIL (IMPORTANT CHECK)
    // -------------------------
    try {
      await sendOTPEmail(newUser.email, otp);
    } catch (emailError) {
      // rollback user if email fails
      await User.findByIdAndDelete(newUser._id);

      return res.status(500).json({
        message: "Failed to send OTP email. Please try again.",
      });
    }

    // -------------------------
    // 7. RESPONSE (NO TOKEN HERE ❌)
    // -------------------------
    return res.status(201).json({
      message: "OTP sent successfully. Please verify your email.",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//login function

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // brute force protection
    if (!user.loginAttempts) user.loginAttempts = 0;

    if (user.loginAttempts >= 5) {
      return res.status(429).json({
        message: "Too many failed attempts. Try later.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts += 1;
      await user.save();

      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first",
      });
    }

    // reset attempts after success
    user.loginAttempts = 0;
    user.isOnline = true;
    user.lastSeen = new Date();

    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic,
        about: user.about,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//logout function

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error("GetMe Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
