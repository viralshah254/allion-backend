import express from "express";
import {
  registerUser,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
} from "../controllers/authController";
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../models/User";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

// Protected routes
router.use(protect);
router.get("/me", getMe);
router.put("/updateprofile", updateProfile);

// Admin only routes
router.use(authorize(UserRole.ADMIN));
router.post("/register", registerUser);

export default router;
