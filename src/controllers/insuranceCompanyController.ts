import { Request, Response, NextFunction } from "express";
import InsuranceCompany, {
  IInsuranceCompany,
} from "../models/InsuranceCompany";
import logger from "../utils/logger";
import mongoose from "mongoose";

// Extend the Express Request interface to include files for multer
interface MulterRequest extends Request {
  files?: any;
}

// @desc    Create new insurance company
// @route   POST /api/insurance-companies
// @access  Private
export const createInsuranceCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      companyName,
      postalAddress,
      physicalAddress,
      coordinates,
      phoneNumber,
      email,
      contactPersons,
      branches,
      kycDocuments,
    } = req.body;

    // Check if company name is provided
    if (!companyName) {
      const error: any = new Error("Company name is required");
      error.status = 400;
      return next(error);
    }

    // Check if a company with the same name already exists
    const existingCompany = await InsuranceCompany.findOne({ companyName });
    if (existingCompany) {
      const error: any = new Error("A company with this name already exists");
      error.status = 400;
      return next(error);
    }

    // Create insurance company
    const insuranceCompany = await InsuranceCompany.create({
      companyName,
      postalAddress,
      physicalAddress,
      coordinates,
      phoneNumber,
      email,
      contactPersons,
      branches,
      kycDocuments,
    });

    logger.info(`New insurance company created: ${insuranceCompany.code}`);
    res.status(201).json({
      success: true,
      data: insuranceCompany,
    });
  } catch (error: any) {
    logger.error(`Error creating insurance company: ${error.message}`);
    next(error);
  }
};

// @desc    Get all insurance companies with filtering, searching, and pagination
// @route   GET /api/insurance-companies
// @access  Private
export const getInsuranceCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Copy query object
    const queryObj: Record<string, any> = { ...req.query };

    // Fields to exclude from filtering
    const excludedFields = [
      "page",
      "sort",
      "limit",
      "fields",
      "search",
      "createdFrom",
      "createdTo",
      "updatedFrom",
      "updatedTo",
    ];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Add KYC Status filter if present
    if (req.query.kycStatus) {
      queryObj.kycStatus = req.query.kycStatus;
    }

    // Process date filters
    // 1. Creation date filtering
    if (req.query.createdFrom || req.query.createdTo) {
      queryObj.createdAt = {};

      if (req.query.createdFrom) {
        queryObj.createdAt.$gte = new Date(req.query.createdFrom as string);
      }

      if (req.query.createdTo) {
        queryObj.createdAt.$lte = new Date(req.query.createdTo as string);
      }
    }

    // 2. Updated date filtering
    if (req.query.updatedFrom || req.query.updatedTo) {
      queryObj.updatedAt = {};

      if (req.query.updatedFrom) {
        queryObj.updatedAt.$gte = new Date(req.query.updatedFrom as string);
      }

      if (req.query.updatedTo) {
        queryObj.updatedAt.$lte = new Date(req.query.updatedTo as string);
      }
    }

    // Build search query if provided
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      queryObj["$or"] = [
        { companyName: { $regex: searchTerm, $options: "i" } },
        { code: { $regex: searchTerm, $options: "i" } },
        { phoneNumber: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { "contactPersons.name": { $regex: searchTerm, $options: "i" } },
        { "branches.name": { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Apply the filters
    let query = InsuranceCompany.find(queryObj) as any;

    // Sorting
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      // Default sort by createdAt descending
      query = query.sort("-createdAt");
    }

    // Field limiting
    if (req.query.fields) {
      const fields = (req.query.fields as string).split(",").join(" ");
      query = query.select(fields);
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await InsuranceCompany.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const insuranceCompanies = await query;

    // Pagination result
    const pagination: any = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: insuranceCompanies.length,
      pagination,
      total,
      data: insuranceCompanies,
    });
  } catch (error: any) {
    logger.error(`Error getting insurance companies: ${error.message}`);
    next(error);
  }
};

// @desc    Get single insurance company
// @route   GET /api/insurance-companies/:id
// @access  Private
export const getInsuranceCompanyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const insuranceCompany = await InsuranceCompany.findById(req.params.id);

    if (!insuranceCompany) {
      const error: any = new Error("Insurance company not found");
      error.status = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: insuranceCompany,
    });
  } catch (error: any) {
    logger.error(`Error getting insurance company: ${error.message}`);
    next(error);
  }
};

// @desc    Update insurance company
// @route   PUT /api/insurance-companies/:id
// @access  Private
export const updateInsuranceCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if the company exists
    const insuranceCompany = await InsuranceCompany.findById(req.params.id);
    if (!insuranceCompany) {
      const error: any = new Error("Insurance company not found");
      error.status = 404;
      return next(error);
    }

    // Check if the company name is being updated and if it already exists
    if (
      req.body.companyName &&
      req.body.companyName !== insuranceCompany.companyName
    ) {
      const existingCompany = await InsuranceCompany.findOne({
        companyName: req.body.companyName,
        _id: { $ne: req.params.id },
      });

      if (existingCompany) {
        const error: any = new Error("A company with this name already exists");
        error.status = 400;
        return next(error);
      }
    }

    // Update the insurance company
    const updatedInsuranceCompany = await InsuranceCompany.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    logger.info(`Insurance company updated: ${updatedInsuranceCompany?.code}`);
    res.status(200).json({
      success: true,
      data: updatedInsuranceCompany,
    });
  } catch (error: any) {
    logger.error(`Error updating insurance company: ${error.message}`);
    next(error);
  }
};

// @desc    Delete insurance company
// @route   DELETE /api/insurance-companies/:id
// @access  Private
export const deleteInsuranceCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const insuranceCompany = await InsuranceCompany.findById(req.params.id);

    if (!insuranceCompany) {
      const error: any = new Error("Insurance company not found");
      error.status = 404;
      return next(error);
    }

    await insuranceCompany.deleteOne();

    logger.info(`Insurance company deleted: ${insuranceCompany.code}`);
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    logger.error(`Error deleting insurance company: ${error.message}`);
    next(error);
  }
};

// @desc    Upload KYC documents
// @route   POST /api/insurance-companies/:id/kyc
// @access  Private
export const uploadKycDocuments = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if the company exists
    const insuranceCompany = await InsuranceCompany.findById(req.params.id);
    if (!insuranceCompany) {
      const error: any = new Error("Insurance company not found");
      error.status = 404;
      return next(error);
    }

    // Check if files are provided
    if (!req.files) {
      const error: any = new Error("Please upload files");
      error.status = 400;
      return next(error);
    }

    // Update KYC documents
    const updateData: any = { kycDocuments: {} };

    if (req.files.license) {
      updateData.kycDocuments.license = req.files.license[0].path;
    }

    if (req.files.registration) {
      updateData.kycDocuments.registration = req.files.registration[0].path;
    }

    if (req.files.taxClearance) {
      updateData.kycDocuments.taxClearance = req.files.taxClearance[0].path;
    }

    // Update KYC status if all documents are provided
    if (
      (updateData.kycDocuments.license ||
        insuranceCompany.kycDocuments?.license) &&
      (updateData.kycDocuments.registration ||
        insuranceCompany.kycDocuments?.registration) &&
      (updateData.kycDocuments.taxClearance ||
        insuranceCompany.kycDocuments?.taxClearance)
    ) {
      updateData.kycStatus = "Pending";
    }

    // Update the insurance company
    const updatedInsuranceCompany = await InsuranceCompany.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    logger.info(
      `KYC documents uploaded for insurance company: ${updatedInsuranceCompany?.code}`
    );
    res.status(200).json({
      success: true,
      data: updatedInsuranceCompany,
    });
  } catch (error: any) {
    logger.error(`Error uploading KYC documents: ${error.message}`);
    next(error);
  }
};
