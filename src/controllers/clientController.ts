import { Request, Response, NextFunction } from "express";
import Client, { IClient, ClientType, Department } from "../models/Client";
import logger from "../utils/logger";
import Group from "../models/Group";
import mongoose from "mongoose";

import RiskNote from "../models/RiskNote";

// Extend the Express Request interface to include files for multer
interface MulterRequest extends Request {
  files?: any;
}

// @desc    Create new client
// @route   POST /api/clients
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

    // Check if client type is valid
    if (!Object.values(ClientType).includes(clientType)) {
      const error: any = new Error("Invalid client type");
      error.status = 400;
      return next(error);
    }
    //check if phone number is provided and is valid
    if (
      (phoneNumber && !phoneNumber.match(/^\+?[0-9]{10,15}$/)) ||
      !phoneNumber
    ) {
      const error: any = new Error(
        "Phone number is required and must be valid"
      );
      error.status = 400;
      return next(error);
    }

    // Check if phone number is already in use
    const existingClient = await Client.findOne({ phoneNumber });
    if (existingClient) {
      const error: any = new Error(
        "Phone number already in use by another client"
      );
      logger.error(
        `Phone number already in use by another client: ${phoneNumber}`
      );
      error.status = 400;
      return next(error);
    }

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

// @desc    Get all clients with filtering, search, and pagination
// @route   GET /api/clients
// @access  Private
export const getClients = async (
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
      "clientType",
      "createdFrom",
      "createdTo",
      "updatedFrom",
      "updatedTo",
      "dobFrom",
      "dobTo",
      "policyType",
    ];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Add KycStatus filter if present (keep this in queryObj for direct MongoDB filtering)
    if (req.query.kycStatus) {
      queryObj.kycStatus = req.query.kycStatus;
    }

    // Handle policy type filtering - find client IDs with the specified policy type
    if (req.query.policyType) {
      const policyType = req.query.policyType as string;
      // Find all policies of the specified type and get their client IDs
      const policiesWithType = await RiskNote.find({
        policyCategory: policyType,
      }).distinct("client");

      // Only include clients that have the specified policy type
      if (policiesWithType.length > 0) {
        queryObj._id = { $in: policiesWithType };
      } else {
        // If no policies match the type, use a valid ObjectId that won't match any document
        // Using a valid but non-existent ObjectId to avoid cast errors
        queryObj._id = { $in: ["000000000000000000000000"] };
      }
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

    //4.clientType filtering
    if (req.query.clientType) {
      queryObj.clientType = req.query.clientType as ClientType;
      if (req.query.clientType === ClientType.INDIVIDUAL) {
        // Only add dateOfBirth filter if we have actual date values
        if (req.query.dobFrom || req.query.dobTo) {
          queryObj.dateOfBirth = {};
          if (req.query.dobFrom) {
            queryObj.dateOfBirth.$gte = new Date(req.query.dobFrom as string);
          }
          if (req.query.dobTo) {
            queryObj.dateOfBirth.$lte = new Date(req.query.dobTo as string);
          }
        }
      }
    }

    // Build search query if provided
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      queryObj["$or"] = [
        { firstName: { $regex: searchTerm, $options: "i" } },
        { lastName: { $regex: searchTerm, $options: "i" } },
        { companyName: { $regex: searchTerm, $options: "i" } },
        { phoneNumber: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { clientCode: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Apply the filters directly without JSON conversion
    let query = Client.find(queryObj) as any;

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
    } else {
      // Exclude '__v' field by default
      query = query.select("-__v");
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Client.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const clients = await query.exec();

    // Fetch group and policy information for each client
    const clientsWithGroupsAndPolicies = await Promise.all(
      (clients as IClient[]).map(async (client: IClient) => {
        // Find groups where this client is a member
        const groups = await Group.find({
          "members.clientId": client._id,
        }).select("_id groupName groupCode");

        // Find policies where this client is insured
        const policies = await RiskNote.find({
          client: client._id,
        }).select("_id policyNumber policyCategory subCategory");

        // Convert client to a plain object so we can add properties
        const clientObj = client.toObject();

        // Add groups information to client
        clientObj.groups = groups.map((group: any) => ({
          groupId: group._id,
          groupName: group.groupName,
          groupCode: group.groupCode,
        }));

        // Add policies information to client
        clientObj.policies = policies.map((policy: any) => ({
          policyId: policy._id,
          policyNumber: policy.policyNumber,
          policyType: policy.policyCategory,
          subCategory: policy.subCategory,
          status: "Active",
        }));

        return clientObj;
      })
    );

    // For sorting by name or group after fetching data (post-processing sort)
    if (req.query.sort) {
      const sortParams = (req.query.sort as string).split(",");

      // Handle special sort cases that need post-processing
      if (sortParams.includes("name") || sortParams.includes("-name")) {
        const direction = sortParams.includes("-name") ? -1 : 1;
        clientsWithGroupsAndPolicies.sort((a, b) => {
          // For individual clients, sort by firstName + lastName
          if (
            a.clientType === ClientType.INDIVIDUAL &&
            b.clientType === ClientType.INDIVIDUAL
          ) {
            const aName = `${a.firstName || ""} ${a.lastName || ""}`.trim();
            const bName = `${b.firstName || ""} ${b.lastName || ""}`.trim();
            return direction * aName.localeCompare(bName);
          }
          // For corporate clients, sort by companyName
          else if (
            a.clientType === ClientType.CORPORATE &&
            b.clientType === ClientType.CORPORATE
          ) {
            return (
              direction *
              (a.companyName || "").localeCompare(b.companyName || "")
            );
          }
          // Mixed types - individuals come first
          else {
            return a.clientType === ClientType.INDIVIDUAL
              ? -1 * direction
              : 1 * direction;
          }
        });
      }

      // Sort by group (first group name)
      if (sortParams.includes("group") || sortParams.includes("-group")) {
        const direction = sortParams.includes("-group") ? -1 : 1;
        clientsWithGroupsAndPolicies.sort((a, b) => {
          const aGroup =
            a.groups && a.groups.length > 0 ? a.groups[0].groupName : "";
          const bGroup =
            b.groups && b.groups.length > 0 ? b.groups[0].groupName : "";
          return direction * aGroup.localeCompare(bGroup);
        });
      }
    }

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
      count: clients.length,
      pagination: {
        total,
        page,
        limit,
        ...pagination,
      },
      data: clientsWithGroupsAndPolicies,
    });
  } catch (error: any) {
    logger.error(`Error fetching clients: ${error.message}`);
    next(error);
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
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

    // Find groups where this client is a member
    const groups = await Group.find({
      "members.clientId": client._id,
    }).select("_id groupName groupCode");

    // Find policies where this client is insured
    const policies = await RiskNote.find({
      client: client._id,
    }).select("_id policyNumber policyCategory subCategory");

    // Convert client to a plain object so we can add properties
    const clientObj = client.toObject();

    // Add groups information to client
    clientObj.groups = groups.map((group: any) => ({
      groupId: group._id,
      groupName: group.groupName,
      groupCode: group.groupCode,
    }));

    // Add policies information to client
    clientObj.policies = policies.map((policy: any) => ({
      policyId: policy._id,
      policyNumber: policy.policyNumber,
      policyType: policy.policyCategory,
      subCategory: policy.subCategory,
      status: "Active",
    }));

    res.status(200).json({
      success: true,
      data: clientObj,
    });
  } catch (error: any) {
    logger.error(`Error fetching client ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
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
// @route   DELETE /api/clients/:id
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

// @desc    Get clients by type with filtering, search, and pagination
// @route   GET /api/clients/type/:type
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

    // Copy query object and add the clientType filter
    const queryObj: Record<string, any> = { ...req.query, clientType: type };

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
      "dobFrom",
      "dobTo",
      "policyType",
    ];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Add KycStatus filter if present (keep this in queryObj for direct MongoDB filtering)
    if (req.query.kycStatus) {
      queryObj.kycStatus = req.query.kycStatus;
    }

    // Handle policy type filtering - find client IDs with the specified policy type
    if (req.query.policyType) {
      const policyType = req.query.policyType as string;
      // Find all policies of the specified type and get their client IDs
      const policiesWithType = await RiskNote.find({
        policyCategory: policyType,
        client: { $exists: true, $ne: null },
      }).distinct("client");

      // Only include clients that have the specified policy type
      if (policiesWithType.length > 0) {
        queryObj._id = { $in: policiesWithType };
      } else {
        // If no policies match the type, use a valid ObjectId that won't match any document
        // Using a valid but non-existent ObjectId to avoid cast errors
        queryObj._id = { $in: ["000000000000000000000000"] };
      }
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

    // 3. Date of birth filtering (for individual clients)
    if (req.query.dobFrom || req.query.dobTo) {
      queryObj.dateOfBirth = {};

      if (req.query.dobFrom) {
        queryObj.dateOfBirth.$gte = new Date(req.query.dobFrom as string);
      }

      if (req.query.dobTo) {
        queryObj.dateOfBirth.$lte = new Date(req.query.dobTo as string);
      }
    }

    // Build search query if provided
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      queryObj["$and"] = [
        { clientType: type },
        {
          $or: [
            { firstName: { $regex: searchTerm, $options: "i" } },
            { lastName: { $regex: searchTerm, $options: "i" } },
            { companyName: { $regex: searchTerm, $options: "i" } },
            { phoneNumber: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { clientCode: { $regex: searchTerm, $options: "i" } },
          ],
        },
      ];
      // Remove the clientType from the top level since it's in the $and
      delete queryObj.clientType;
    }

    // Apply the filters directly without JSON conversion
    let query = Client.find(queryObj) as any;

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
    } else {
      // Exclude '__v' field by default
      query = query.select("-__v");
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Client.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const clients = await query.exec();

    // Fetch group and policy information for each client
    const clientsWithGroupsAndPolicies = await Promise.all(
      (clients as IClient[]).map(async (client: IClient) => {
        // Find groups where this client is a member
        const groups = await Group.find({
          "members.clientId": client._id,
        }).select("_id groupName groupCode");

        // Find policies where this client is insured
        const policies = await RiskNote.find({
          client: client._id,
        }).select("_id policyNumber policyCategory subCategory");

        // Convert client to a plain object so we can add properties
        const clientObj = client.toObject();

        // Add groups information to client
        clientObj.groups = groups.map((group: any) => ({
          groupId: group._id,
          groupName: group.groupName,
          groupCode: group.groupCode,
        }));

        // Add policies information to client
        clientObj.policies = policies.map((policy: any) => ({
          policyId: policy._id,
          policyNumber: policy.policyNumber,
          policyType: policy.policyCategory,
          subCategory: policy.subCategory,
          status: "Active",
        }));

        return clientObj;
      })
    );

    // For sorting by name or group after fetching data (post-processing sort)
    if (req.query.sort) {
      const sortParams = (req.query.sort as string).split(",");

      // Handle special sort cases that need post-processing
      if (sortParams.includes("name") || sortParams.includes("-name")) {
        const direction = sortParams.includes("-name") ? -1 : 1;
        clientsWithGroupsAndPolicies.sort((a, b) => {
          // For individual clients, sort by firstName + lastName
          if (
            a.clientType === ClientType.INDIVIDUAL &&
            b.clientType === ClientType.INDIVIDUAL
          ) {
            const aName = `${a.firstName || ""} ${a.lastName || ""}`.trim();
            const bName = `${b.firstName || ""} ${b.lastName || ""}`.trim();
            return direction * aName.localeCompare(bName);
          }
          // For corporate clients, sort by companyName
          else if (
            a.clientType === ClientType.CORPORATE &&
            b.clientType === ClientType.CORPORATE
          ) {
            return (
              direction *
              (a.companyName || "").localeCompare(b.companyName || "")
            );
          }
          // Mixed types - individuals come first
          else {
            return a.clientType === ClientType.INDIVIDUAL
              ? -1 * direction
              : 1 * direction;
          }
        });
      }

      // Sort by group (first group name)
      if (sortParams.includes("group") || sortParams.includes("-group")) {
        const direction = sortParams.includes("-group") ? -1 : 1;
        clientsWithGroupsAndPolicies.sort((a, b) => {
          const aGroup =
            a.groups && a.groups.length > 0 ? a.groups[0].groupName : "";
          const bGroup =
            b.groups && b.groups.length > 0 ? b.groups[0].groupName : "";
          return direction * aGroup.localeCompare(bGroup);
        });
      }
    }

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
      count: clients.length,
      pagination: {
        total,
        page,
        limit,
        ...pagination,
      },
      data: clientsWithGroupsAndPolicies,
    });
  } catch (error: any) {
    logger.error(`Error fetching clients by type: ${error.message}`);
    next(error);
  }
};

// @desc    Upload KYC documents for a client
// @route   POST /api/clients/:id/kyc
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
