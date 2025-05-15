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

const router = express.Router();

// Group routes
router.route("/").post(createGroup).get(getGroups);

router.route("/:id").get(getGroupById).put(updateGroup).delete(deleteGroup);

// Group membership management
router.route("/:id/members").post(addMemberToGroup);

router.route("/:id/members/:clientId").delete(removeMemberFromGroup);

export default router;
