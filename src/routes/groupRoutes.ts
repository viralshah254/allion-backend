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

const router = express.Router();

// Main group routes
router.route("/").get(getGroups).post(createGroup);

router.route("/:id").get(getGroupById).put(updateGroup).delete(deleteGroup);

// Group member management
router.route("/:id/members").post(addMemberToGroup);

router.route("/:id/members/:clientId").delete(removeMemberFromGroup);

// Get policies by group
router.route("/:groupId/policies").get(getPoliciesByGroup);

export default router;
