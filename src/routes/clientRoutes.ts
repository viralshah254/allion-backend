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

const router = express.Router();

// Main client routes
router.route("/").get(getClients).post(createClient);

router.route("/:id").get(getClientById).put(updateClient).delete(deleteClient);

// Get clients by type
router.route("/type/:type").get(getClientsByType);

// Upload KYC documents
router.route("/:id/kyc").post(uploadKycDocuments);

// Get policies by client
router.route("/:clientId/policies").get(getPoliciesByClient);

export default router;
