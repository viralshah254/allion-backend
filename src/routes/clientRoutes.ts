import express from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientsByType,
  uploadKycDocuments,
} from "../controllers/clientController";
import { getPoliciesByClient } from "../controllers/policyController";
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../models/User";

const router = express.Router();

// Protect all routes
router.use(protect);

// Main client routes
router
  .route("/")
  .get(getClients)
  .post(
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT),
    createClient
  );

router
  .route("/:id")
  .get(getClientById)
  .put(
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT),
    updateClient
  )
  .delete(authorize(UserRole.ADMIN, UserRole.MANAGER), deleteClient);

// Get clients by type
router.route("/type/:type").get(getClientsByType);

// Upload KYC documents
router
  .route("/:id/kyc")
  .post(
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT),
    uploadKycDocuments
  );

// Get policies by client
router.route("/:clientId/policies").get(getPoliciesByClient);

export default router;
