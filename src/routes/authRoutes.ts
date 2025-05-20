import express from "express";
import {
  registerAdminUser,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  registerAdmin,
} from "../controllers/authController";
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../models/User";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);
router.post("/registeradmin", registerAdmin);

// Protected routes

router.get("/me", getMe);
router.put("/updateprofile", updateProfile);

// Admin only routes
router.use(authorize(UserRole.ADMIN));
router.post("/register", registerAdminUser);

export default router;
