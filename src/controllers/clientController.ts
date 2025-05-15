import { Request, Response, NextFunction } from "express";
import Client, { IClient, ClientType, Department } from "../models/Client";
import logger from "../utils/logger";

// Extend the Express Request interface to include files for multer
interface MulterRequest extends Request {
  files?: any;
}

// @desc    Create new client
// @route   POST /api/v1/clients
// @access  Private
export const createClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      clientType,
      // Individual fields
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      occupation,
      // Corporate fields
      companyName,
      // Common fields
      postalAddress,
      physicalAddress,
      coordinates,
      phoneNumber,
      email,
      contactPersons,
      referredBy,
      kycDocuments,
      isGroup,
    } = req.body;

    // Validate required fields based on client type
    if (clientType === ClientType.INDIVIDUAL) {
      if (!firstName || !lastName) {
        const error: any = new Error(
          "First name and last name are required for individual clients"
        );
        error.status = 400;
        return next(error);
      }
    } else if (clientType === ClientType.CORPORATE) {
      if (!companyName) {
        const error: any = new Error(
          "Company name is required for corporate clients"
        );
        error.status = 400;
        return next(error);
      }
    }

    // Create client
    const client = await Client.create({
      clientType,
      // Individual fields
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      occupation,
      // Corporate fields
      companyName,
      // Common fields
      postalAddress,
      physicalAddress,
      coordinates,
      phoneNumber,
      email,
      contactPersons,
      referredBy,
      kycDocuments,
      isGroup,
    });

    logger.info(`New client created: ${client.clientCode}`);
    res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    logger.error(`Error creating client: ${error.message}`);
    next(error);
  }
};

// @desc    Get all clients
// @route   GET /api/v1/clients
// @access  Private
export const getClients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clients = await Client.find();

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error: any) {
    logger.error(`Error fetching clients: ${error.message}`);
    next(error);
  }
};

// @desc    Get single client
// @route   GET /api/v1/clients/:id
// @access  Private
export const getClientById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      logger.warn(`Client not found with id: ${req.params.id}`);
      const error: any = new Error("Client not found");
      error.status = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    logger.error(`Error fetching client ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Update client
// @route   PUT /api/v1/clients/:id
// @access  Private
export const updateClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the client to check the client type
    const existingClient = await Client.findById(req.params.id);

    if (!existingClient) {
      logger.warn(`Client not found with id: ${req.params.id}`);
      const error: any = new Error("Client not found");
      error.status = 404;
      return next(error);
    }

    // If client type is being changed, validate the required fields
    if (
      req.body.clientType &&
      req.body.clientType !== existingClient.clientType
    ) {
      if (
        req.body.clientType === ClientType.INDIVIDUAL &&
        !req.body.firstName &&
        !req.body.lastName
      ) {
        const error: any = new Error(
          "First name and last name are required for individual clients"
        );
        error.status = 400;
        return next(error);
      } else if (
        req.body.clientType === ClientType.CORPORATE &&
        !req.body.companyName
      ) {
        const error: any = new Error(
          "Company name is required for corporate clients"
        );
        error.status = 400;
        return next(error);
      }
    }

    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    logger.info(`Client updated: ${client!.clientCode}`);
    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    logger.error(`Error updating client ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Delete client
// @route   DELETE /api/v1/clients/:id
// @access  Private
export const deleteClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      logger.warn(`Client not found with id: ${req.params.id}`);
      const error: any = new Error("Client not found");
      error.status = 404;
      return next(error);
    }

    logger.info(`Client deleted: ${client.clientCode}`);
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    logger.error(`Error deleting client ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Get clients by type
// @route   GET /api/v1/clients/type/:type
// @access  Private
export const getClientsByType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;

    // Validate client type
    if (!Object.values(ClientType).includes(type as ClientType)) {
      const error: any = new Error("Invalid client type");
      error.status = 400;
      return next(error);
    }

    const clients = await Client.find({ clientType: type });

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error: any) {
    logger.error(`Error fetching clients by type: ${error.message}`);
    next(error);
  }
};

// @desc    Upload KYC documents for a client
// @route   POST /api/v1/clients/:id/kyc
// @access  Private
export const uploadKycDocuments = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // In a real-world application, you would:
    // 1. Use a middleware like multer to handle file uploads
    // 2. Upload files to storage (local, S3, etc.)
    // 3. Store file paths/URLs in the database

    if (!req.files || Object.keys(req.files).length === 0) {
      const error: any = new Error("No files were uploaded");
      error.status = 400;
      return next(error);
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      logger.warn(`Client not found with id: ${req.params.id}`);
      const error: any = new Error("Client not found");
      error.status = 404;
      return next(error);
    }

    // For demonstration purposes, assuming we're receiving file paths
    // In a real app, this would be handled by file upload middleware
    const documentPaths = Array.isArray(req.body.documents)
      ? req.body.documents
      : [req.body.documents];

    // Add new documents to the existing ones
    if (!client.kycDocuments) {
      client.kycDocuments = [];
    }

    client.kycDocuments.push(...documentPaths);

    await client.save();

    logger.info(`KYC documents uploaded for client: ${client.clientCode}`);
    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    logger.error(`Error uploading KYC documents: ${error.message}`);
    next(error);
  }
};
