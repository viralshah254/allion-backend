import express from "express";
import {
  createClaimPolicy,
  getClaimPolicies,
  getClaimPolicy,
  updateClaimPolicy,
  updateClaimStatus,
  deleteClaimPolicy,
} from "../controllers/claimPolicyController";

const router = express.Router();

// Main claim policy routes
router.route("/").get(getClaimPolicies).post(createClaimPolicy);

router
  .route("/:id")
  .get(getClaimPolicy)
  .put(updateClaimPolicy)
  .delete(deleteClaimPolicy);

// Update claim status
router.route("/:id/status").patch(updateClaimStatus);

export default router;
