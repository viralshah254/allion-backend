import { Request, Response, NextFunction } from "express";
import RiskNote, { IRiskNote, MotorSubcategory } from "../models/RiskNote";
import mongoose from "mongoose";

// @desc    Create a new risk note
// @route   POST /api/risk-notes
// @access  Private
export const createRiskNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const riskNoteData = req.body;

    // Validate motor policy has required fields
    if (riskNoteData.policyCategory === "Motor") {
      if (!riskNoteData.subCategory) {
        res.status(400).json({
          success: false,
          error: "Subcategory is required for Motor policy",
        });
        return;
      }

      if (!Object.values(MotorSubcategory).includes(riskNoteData.subCategory)) {
        res.status(400).json({
          success: false,
          error: "Invalid subcategory for Motor policy",
        });
        return;
      }

      if (
        !riskNoteData.motorDetails ||
        !riskNoteData.motorDetails.registrationNumber ||
        !riskNoteData.motorDetails.make ||
        !riskNoteData.motorDetails.model ||
        !riskNoteData.motorDetails.year
      ) {
        res.status(400).json({
          success: false,
          error: "Complete motor details are required for Motor policy",
        });
        return;
      }
    }

    // Create the risk note
    const riskNote = await RiskNote.create(riskNoteData);

    res.status(201).json({
      success: true,
      data: riskNote,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (val: any) => val.message
      );
      res.status(400).json({
        success: false,
        error: messages,
      });
      return;
    } else {
      next(error);
    }
  }
};

// @desc    Get all risk notes with filtering, sorting, and pagination
// @route   GET /api/risk-notes
// @access  Private
export const getRiskNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Copy query object
    let queryObj: Record<string, any> = { ...req.query };

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
      "minPremium",
      "maxPremium",
      "minSumInsured",
      "maxSumInsured",
    ];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Filter by policy category
    if (req.query.policyCategory) {
      queryObj.policyCategory = req.query.policyCategory;
    }

    // Filter by subcategory
    if (req.query.subCategory) {
      queryObj.subCategory = req.query.subCategory;
    }

    // Process date filters for creation date
    if (req.query.createdFrom || req.query.createdTo) {
      queryObj.createdAt = {};

      if (req.query.createdFrom) {
        queryObj.createdAt.$gte = new Date(req.query.createdFrom as string);
      }

      if (req.query.createdTo) {
        queryObj.createdAt.$lte = new Date(req.query.createdTo as string);
      }
    }

    // Process date filters for update date
    if (req.query.updatedFrom || req.query.updatedTo) {
      queryObj.updatedAt = {};

      if (req.query.updatedFrom) {
        queryObj.updatedAt.$gte = new Date(req.query.updatedFrom as string);
      }

      if (req.query.updatedTo) {
        queryObj.updatedAt.$lte = new Date(req.query.updatedTo as string);
      }
    }

    // Search functionality - using regex for partial matching in text fields
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, "i");

      // Add $or operator for searching across multiple fields
      const searchQuery = {
        $or: [
          { "motorDetails.registrationNumber": searchRegex },
          { "motorDetails.make": searchRegex },
          { "motorDetails.model": searchRegex },
          { policyCategory: searchRegex },
          { subCategory: searchRegex },
        ],
      };

      // Combine search criteria with existing query
      queryObj = { ...queryObj, ...searchQuery };
    }

    // Range filter for premiumBreakdown.totalPremium
    if (req.query.minPremium || req.query.maxPremium) {
      queryObj["premiumBreakdown.totalPremium"] = {};

      if (req.query.minPremium) {
        queryObj["premiumBreakdown.totalPremium"].$gte = Number(
          req.query.minPremium
        );
      }

      if (req.query.maxPremium) {
        queryObj["premiumBreakdown.totalPremium"].$lte = Number(
          req.query.maxPremium
        );
      }
    }

    // Range filter for premiumBreakdown.sumInsured
    if (req.query.minSumInsured || req.query.maxSumInsured) {
      queryObj["premiumBreakdown.sumInsured"] = {};

      if (req.query.minSumInsured) {
        queryObj["premiumBreakdown.sumInsured"].$gte = Number(
          req.query.minSumInsured
        );
      }

      if (req.query.maxSumInsured) {
        queryObj["premiumBreakdown.sumInsured"].$lte = Number(
          req.query.maxSumInsured
        );
      }
    }

    // Execute count for pagination metadata before applying any pagination
    const totalDocs = await RiskNote.countDocuments(queryObj);

    // Build query
    let query = RiskNote.find(queryObj) as any;

    // Apply population
    query = query
      .populate("client", " firstName lastName email phone")
      .populate("insuranceCompany", "companyName email phone");

    // Sort
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt"); // Default sort by newest first
    }

    // Field limiting
    if (req.query.fields) {
      const fields = (req.query.fields as string).split(",").join(" ");
      query = query.select(fields);
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const totalPages = Math.ceil(totalDocs / limit);

    // Execute query
    const riskNotes = await query.exec();

    res.status(200).json({
      success: true,
      count: riskNotes.length,
      totalDocs,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      data: riskNotes,
    });
  } catch (error) {
    next(error);
  }
};



// @desc    Get risk note by ID
// @route   GET /api/risk-notes/:id
// @access  Private
export const getRiskNoteById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const riskNote = await RiskNote.findById(req.params.id)
      .populate("client", "firstName lastName email phone")
      .populate("insuranceCompany", "companyName email phone");

    if (!riskNote) {
      res.status(404).json({
        success: false,
        error: "Risk note not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: riskNote,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      res.status(400).json({
        success: false,
        error: "Invalid risk note ID",
      });
      return;
    }

    next(error);
  }
};

// @desc    Update risk note
// @route   PUT /api/risk-notes/:id
// @access  Private
export const updateRiskNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const riskNoteData = req.body;

    // Validate motor policy has required fields if updating to motor category
    if (riskNoteData.policyCategory === "Motor") {
      if (!riskNoteData.subCategory) {
        res.status(400).json({
          success: false,
          error: "Subcategory is required for Motor policy",
        });
        return;
      }

      if (!Object.values(MotorSubcategory).includes(riskNoteData.subCategory)) {
        res.status(400).json({
          success: false,
          error: "Invalid subcategory for Motor policy",
        });
        return;
      }

      if (
        !riskNoteData.motorDetails ||
        !riskNoteData.motorDetails.registrationNumber ||
        !riskNoteData.motorDetails.make ||
        !riskNoteData.motorDetails.model ||
        !riskNoteData.motorDetails.year
      ) {
        res.status(400).json({
          success: false,
          error: "Complete motor details are required for Motor policy",
        });
        return;
      }
    }

    const riskNote = await RiskNote.findByIdAndUpdate(
      req.params.id,
      riskNoteData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!riskNote) {
      res.status(404).json({
        success: false,
        error: "Risk note not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: riskNote,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (val: any) => val.message
      );
      res.status(400).json({
        success: false,
        error: messages,
      });
      return;
    } else if (error instanceof mongoose.Error.CastError) {
      res.status(400).json({
        success: false,
        error: "Invalid risk note ID",
      });
      return;
    } else {
      next(error);
    }
  }
};

// @desc    Delete risk note
// @route   DELETE /api/risk-notes/:id
// @access  Private
export const deleteRiskNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const riskNote = await RiskNote.findById(req.params.id);

    if (!riskNote) {
      res.status(404).json({
        success: false,
        error: "Risk note not found",
      });
      return;
    }

    await riskNote.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      res.status(400).json({
        success: false,
        error: "Invalid risk note ID",
      });
      return;
    }

    next(error);
  }
};

// @desc    Get risk notes by client ID
// @route   GET /api/risk-notes/client/:clientId
// @access  Private
export const getRiskNotesByClient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const riskNotes = await RiskNote.find({ client: req.params.clientId })
      .populate("client", " firstName lastName email phone")
      .populate("insuranceCompany", "companyName email phone");

    res.status(200).json({
      success: true,
      count: riskNotes.length,
      data: riskNotes,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      res.status(400).json({
        success: false,
        error: "Invalid client ID",
      });
      return;
    }

    next(error);
  }
};

// @desc    Get risk notes by insurance company ID
// @route   GET /api/risk-notes/insurance-company/:insuranceCompanyId
// @access  Private
export const getRiskNotesByInsuranceCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const riskNotes = await RiskNote.find({
      insuranceCompany: req.params.insuranceCompanyId,
    })
      .populate("client", "name email phone")
      .populate("insuranceCompany", "name email phone");

    res.status(200).json({
      success: true,
      count: riskNotes.length,
      data: riskNotes,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      res.status(400).json({
        success: false,
        error: "Invalid insurance company ID",
      });
      return;
    }

    next(error);
  }
};
