import express from "express";
import {
  createPolicy,
  getPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
  renewPolicy,
} from "../controllers/policyController";

const router = express.Router();

// Main policy routes
router.route("/").get(getPolicies).post(createPolicy);

router.route("/:id").get(getPolicyById).put(updatePolicy).delete(deletePolicy);

// Special route for renewing a policy
router.route("/:id/renew").put(renewPolicy);

export default router;
