import express from "express";
import {
  createRiskNote,
  getRiskNotes,
  getRiskNoteById,
  updateRiskNote,
  deleteRiskNote,
  getRiskNotesByClient,
  getRiskNotesByInsuranceCompany,
} from "../controllers/riskNoteController";

const router = express.Router();

// Main risk note routes
router.route("/").get(getRiskNotes).post(createRiskNote);

router
  .route("/:id")
  .get(getRiskNoteById)
  .put(updateRiskNote)
  .delete(deleteRiskNote);

// Get risk notes by client
router.route("/client/:clientId").get(getRiskNotesByClient);

// Get risk notes by insurance company
router
  .route("/insurance-company/:insuranceCompanyId")
  .get(getRiskNotesByInsuranceCompany);

export default router;
