import { Request, Response, NextFunction } from "express";
import Application, { IApplication } from "../models/Application";
import logger from "../utils/logger";

// @desc    Create new insurance application
// @route   POST /api/v1/applications
// @access  Public (adjust as needed)
export const createApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientName, clientEmail, coverageType, premiumAmount } = req.body;

    const application: IApplication = await Application.create({
      clientName,
      clientEmail,
      coverageType,
      premiumAmount,
    });

    logger.info(
      `New application created: ${application._id} by ${clientEmail}`
    );
    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    logger.error(`Error creating application: ${error.message}`);
    // Pass to global error handler, or handle more specifically if needed
    next(error);
  }
};

// @desc    Get all insurance applications
// @route   GET /api/v1/applications
// @access  Public (adjust as needed, e.g., admin only)
export const getApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const applications = await Application.find();
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error: any) {
    logger.error(`Error fetching applications: ${error.message}`);
    next(error);
  }
};

// @desc    Get single insurance application
// @route   GET /api/v1/applications/:id
// @access  Public (adjust as needed)
export const getApplicationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      logger.warn(`Application not found with id: ${req.params.id}`);
      // Create a custom error to be handled by the global error handler
      const error: any = new Error("Application not found");
      error.status = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    logger.error(
      `Error fetching application ${req.params.id}: ${error.message}`
    );
    next(error);
  }
};
