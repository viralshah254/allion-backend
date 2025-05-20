import express from "express";
import {
  createInsuranceCompany,
  getInsuranceCompanies,
  getInsuranceCompanyById,
  updateInsuranceCompany,
  deleteInsuranceCompany,
  uploadKycDocuments,
} from "../controllers/insuranceCompanyController";
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../models/User";

const router = express.Router();

// Apply protect middleware to all routes
// router.use(protect);

// Main insurance company routes
router
  .route("/")
  .get(getInsuranceCompanies)
  .post( createInsuranceCompany);

router
  .route("/:id")
  .get(getInsuranceCompanyById)
  .put( updateInsuranceCompany)
  .delete( deleteInsuranceCompany);

// Upload KYC documents
router
  .route("/:id/kyc")
  .post(uploadKycDocuments);

export default router;
