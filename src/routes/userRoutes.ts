import express from "express";
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../models/User";

const router = express.Router();

// Protect all routes
// router.use(protect);

// Restrict to admin and manager
// router.use(authorize(UserRole.ADMIN, UserRole.MANAGER));

router.route("/").get(getUsers);

router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

export default router;
