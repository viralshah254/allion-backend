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
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../models/User";

const router = express.Router();

// Protect all routes
// router.use(protect);

// Main client routes
router.route("/").get(getClients).post(createClient);

router.route("/:id").get(getClientById).put(updateClient).delete(deleteClient);

// Get clients by type
router.route("/type/:type").get(getClientsByType);

// Upload KYC documents
router.route("/:id/kyc").post(uploadKycDocuments);

// Get policies by client
// router.route("/:clientId/policies").get(getPoliciesByClient);

export default router;
