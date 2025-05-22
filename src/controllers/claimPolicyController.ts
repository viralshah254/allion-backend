import { Request, Response, NextFunction } from "express";
import ClaimPolicy from "../models/ClaimPolicy";
import RiskNote from "../models/RiskNote";

// @desc    Create a new claim policy
// @route   POST /api/claim-policies
// @access  Private
export const createClaimPolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate that the referenced policy exists
    const policyId = req.body.policyId;
    const policyExists = await RiskNote.findById(policyId);

    if (!policyExists) {
      res.status(404).json({
        success: false,
        error: "The referenced risk note does not exist",
      });
      return;
    }

    // Create new claim policy
    const claimPolicy = await ClaimPolicy.create(req.body);

    res.status(201).json({
      success: true,
      data: claimPolicy,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all claim policies with filtering, sorting, and pagination
// @route   GET /api/claim-policies
// @access  Private
export const getClaimPolicies = async (
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
      "policyNumber",
      "registrationNumber",
      "driverName",
    ];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Process status filter
    if (req.query.status) {
      queryObj.status = req.query.status;
    }

    // Process claim type filter
    if (req.query.claimType) {
      queryObj.claimType = req.query.claimType;
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

    // Handle specific policyNumber search - needs to look up policy from RiskNote
    if (req.query.policyNumber) {
      const policyNumberToSearch = req.query.policyNumber as string;

      // First, find the associated risk notes
      const riskNotes = await RiskNote.find(
        {
          policyNumber: new RegExp(policyNumberToSearch, "i"),
        },
        "_id"
      );

      if (riskNotes.length > 0) {
        const riskNoteIds = riskNotes.map((note) => note._id);
        queryObj.policyId = { $in: riskNoteIds };
      } else {
        // If no matching risk notes, return empty result
        res.status(200).json({
          success: true,
          count: 0,
          totalDocs: 0,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPrevPage: false,
          data: [],
        });
        return;
      }
    }

    // Search functionality - using regex for partial matching in text fields
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, "i");

      // Add $or operator for searching across multiple fields
      const searchQuery = {
        $or: [
          { claimNumber: searchRegex },
          { "policyHolder.name": searchRegex },
          { "policyHolder.email": searchRegex },
          { "policyHolder.phoneNumber": searchRegex },
          { "vehicle.registrationNumber": searchRegex },
          { "vehicle.makeModel": searchRegex },
          { "driver.fullName": searchRegex },
        ],
      };

      // Combine search criteria with existing query
      queryObj = { ...queryObj, ...searchQuery };
    }

    // Vehicle registration number filter
    if (req.query.registrationNumber) {
      const regNumRegex = new RegExp(
        req.query.registrationNumber as string,
        "i"
      );
      queryObj["vehicle.registrationNumber"] = regNumRegex;
    }

    // Driver name filter
    if (req.query.driverName) {
      const driverNameRegex = new RegExp(req.query.driverName as string, "i");
      queryObj["driver.fullName"] = driverNameRegex;
    }

    // Execute count for pagination metadata before applying any pagination
    const totalDocs = await ClaimPolicy.countDocuments(queryObj);

    // Build query
    let query = ClaimPolicy.find(queryObj) as any;

    // Apply population for the policyId reference
    query = query.populate({
      path: "policyId",
      select: "policyNumber client insuranceCompany startDate endDate",
      populate: [
        {
          path: "client",
          select: "firstName lastName email phone",
        },
        {
          path: "insuranceCompany",
          select: "companyName email phone",
        },
      ],
    });

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
    const claimPolicies = await query.exec();

    res.status(200).json({
      success: true,
      count: claimPolicies.length,
      totalDocs,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      data: claimPolicies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single claim policy
// @route   GET /api/claim-policies/:id
// @access  Private
export const getClaimPolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const claimPolicy = await ClaimPolicy.findById(req.params.id).populate({
      path: "policyId",
      select: "policyNumber client insuranceCompany startDate endDate",
      populate: [
        {
          path: "client",
          select: "firstName lastName email phone",
        },
        {
          path: "insuranceCompany",
          select: "companyName email phone",
        },
      ],
    });

    if (!claimPolicy) {
      res.status(404).json({
        success: false,
        error: "Claim policy not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: claimPolicy,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update claim policy
// @route   PUT /api/claim-policies/:id
// @access  Private
export const updateClaimPolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if trying to update policyId and validate it exists
    if (req.body.policyId) {
      const policyExists = await RiskNote.findById(req.body.policyId);

      if (!policyExists) {
        res.status(404).json({
          success: false,
          error: "The referenced risk note does not exist",
        });
        return;
      }
    }

    const claimPolicy = await ClaimPolicy.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!claimPolicy) {
      res.status(404).json({
        success: false,
        error: "Claim policy not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: claimPolicy,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update claim policy status
// @route   PATCH /api/claim-policies/:id/status
// @access  Private
export const updateClaimStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;

    // Validate status is a valid value
    const validStatuses = [
      "Draft",
      "Submitted",
      "Processing",
      "Approved",
      "Rejected",
    ];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const claimPolicy = await ClaimPolicy.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!claimPolicy) {
      res.status(404).json({
        success: false,
        error: "Claim policy not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: claimPolicy,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete claim policy
// @route   DELETE /api/claim-policies/:id
// @access  Private
export const deleteClaimPolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const claimPolicy = await ClaimPolicy.findByIdAndDelete(req.params.id);

    if (!claimPolicy) {
      res.status(404).json({
        success: false,
        error: "Claim policy not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
