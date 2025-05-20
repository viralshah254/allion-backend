import express from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
} from "../controllers/groupController";
import { getPoliciesByGroup } from "../controllers/policyController";
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../models/User";

const router = express.Router();

// Protect all routes
router.use(protect);

// Main group routes
router
  .route("/")
  .get(getGroups)
  .post(authorize(UserRole.ADMIN, UserRole.MANAGER), createGroup);

router
  .route("/:id")
  .get(getGroupById)
  .put(authorize(UserRole.ADMIN, UserRole.MANAGER), updateGroup)
  .delete(authorize(UserRole.ADMIN), deleteGroup);

// Group member management
router
  .route("/:id/members")
  .post(authorize(UserRole.ADMIN, UserRole.MANAGER), addMemberToGroup);

router
  .route("/:id/members/:clientId")
  .delete(authorize(UserRole.ADMIN, UserRole.MANAGER), removeMemberFromGroup);

// Get policies by group
router.route("/:groupId/policies").get(getPoliciesByGroup);

export default router;
