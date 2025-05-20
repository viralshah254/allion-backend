import express from "express";
import {
  createInsuranceCompany,
  getInsuranceCompanies,
  getInsuranceCompanyById,
  updateInsuranceCompany,
  deleteInsuranceCompany,
  uploadKycDocuments,
} from "../controllers/insuranceCompanyController";

const router = express.Router();

// Main insurance company routes
router.route("/").get(getInsuranceCompanies).post(createInsuranceCompany);

router
  .route("/:id")
  .get(getInsuranceCompanyById)
  .put(updateInsuranceCompany)
  .delete(deleteInsuranceCompany);

// Upload KYC documents
router.route("/:id/kyc").post(uploadKycDocuments);

export default router;
