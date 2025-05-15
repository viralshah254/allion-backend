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

const router = express.Router();

// Client routes
router.route("/").post(createClient).get(getClients);

router.route("/:id").get(getClientById).put(updateClient).delete(deleteClient);

router.route("/type/:type").get(getClientsByType);

// KYC document upload route
router.route("/:id/kyc").post(uploadKycDocuments);

export default router;
