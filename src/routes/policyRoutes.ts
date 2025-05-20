import express from "express";
import {
  createPolicy,
  getPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
  renewPolicy,
} from "../controllers/policyController";
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../models/User";

const router = express.Router();

// Protect all routes
// router.use(protect);

// Main policy routes
router
  .route("/")
  .get(getPolicies)
  .post(
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT),
    createPolicy
  );

router
  .route("/:id")
  .get(getPolicyById)
  .put(
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT),
    updatePolicy
  )
  .delete(authorize(UserRole.ADMIN, UserRole.MANAGER), deletePolicy);

// Special route for renewing a policy
router
  .route("/:id/renew")
  .put(
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT),
    renewPolicy
  );

export default router;
