import { Request, Response, NextFunction } from "express";
import Policy, { IPolicy, PolicyStatus } from "../models/Policy";
import Client from "../models/Client";
import Group from "../models/Group";
import logger from "../utils/logger";
import { Document, Query } from "mongoose";

// @desc    Create new policy
// @route   POST /api/policies
// @access  Private
export const createPolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      policyType,
      client,
      group,
      insuredItem,
      description,
      coverageAmount,
      premium,
      deductible,
      paymentFrequency,
      startDate,
      endDate,
      status,
      documents,
    } = req.body;

    // Validate that either client or group is provided
    if (!client && !group) {
      const error: any = new Error("Either client or group must be specified");
      error.status = 400;
      return next(error);
    }

    // If client is provided, validate it exists
    if (client) {
      const existingClient = await Client.findById(client);
      if (!existingClient) {
        const error: any = new Error("Client not found");
        error.status = 404;
        return next(error);
      }
    }

    // If group is provided, validate it exists
    if (group) {
      const existingGroup = await Group.findById(group);
      if (!existingGroup) {
        const error: any = new Error("Group not found");
        error.status = 404;
        return next(error);
      }
    }

    // Create policy
    const policy = await Policy.create({
      policyType,
      client,
      group,
      insuredItem,
      description,
      coverageAmount,
      premium,
      deductible,
      paymentFrequency,
      startDate,
      endDate,
      status,
      documents,
    });

    logger.info(`New policy created: ${policy.policyNumber}`);
    res.status(201).json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    logger.error(`Error creating policy: ${error.message}`);
    next(error);
  }
};

// @desc    Get all policies with filtering
// @route   GET /api/policies
// @access  Private
export const getPolicies = async (
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
      "startDateFrom",
      "startDateTo",
      "endDateFrom",
      "endDateTo",
    ];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Process date filters
    // 1. Start date filtering
    if (req.query.startDateFrom || req.query.startDateTo) {
      queryObj.startDate = {};

      if (req.query.startDateFrom) {
        queryObj.startDate.$gte = new Date(req.query.startDateFrom as string);
      }

      if (req.query.startDateTo) {
        queryObj.startDate.$lte = new Date(req.query.startDateTo as string);
      }
    }

    // 2. End date filtering
    if (req.query.endDateFrom || req.query.endDateTo) {
      queryObj.endDate = {};

      if (req.query.endDateFrom) {
        queryObj.endDate.$gte = new Date(req.query.endDateFrom as string);
      }

      if (req.query.endDateTo) {
        queryObj.endDate.$lte = new Date(req.query.endDateTo as string);
      }
    }

    // Apply the filters directly
    let query: Query<IPolicy[], IPolicy> = Policy.find(queryObj);

    // Populate client and group fields
    query = query
      .populate({
        path: "client",
        select: "firstName lastName companyName clientCode clientType",
      })
      .populate({
        path: "group",
        select: "groupName groupCode",
      });

    // Sorting
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      // Default sort by creation date
      query = query.sort("-createdAt");
    }

    // Field limiting
    if (req.query.fields) {
      const fields = (req.query.fields as string).split(",").join(" ");
      query = query.select(fields) as Query<IPolicy[], IPolicy>;
    } else {
      // Exclude '__v' field by default
      query = query.select("-__v") as Query<IPolicy[], IPolicy>;
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Policy.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const policies = await query.exec();

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
      count: policies.length,
      pagination: {
        total,
        page,
        limit,
        ...pagination,
      },
      data: policies,
    });
  } catch (error: any) {
    logger.error(`Error fetching policies: ${error.message}`);
    next(error);
  }
};

// @desc    Get single policy
// @route   GET /api/policies/:id
// @access  Private
export const getPolicyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate({
        path: "client",
        select: "firstName lastName companyName clientCode clientType",
      })
      .populate({
        path: "group",
        select: "groupName groupCode",
      });

    if (!policy) {
      logger.warn(`Policy not found with id: ${req.params.id}`);
      const error: any = new Error("Policy not found");
      error.status = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    logger.error(`Error fetching policy ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Update policy
// @route   PUT /api/policies/:id
// @access  Private
export const updatePolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      logger.warn(`Policy not found with id: ${req.params.id}`);
      const error: any = new Error("Policy not found");
      error.status = 404;
      return next(error);
    }

    // Check if client is being changed
    if (req.body.client && req.body.client !== policy.client?.toString()) {
      const existingClient = await Client.findById(req.body.client);
      if (!existingClient) {
        const error: any = new Error("Client not found");
        error.status = 404;
        return next(error);
      }
    }

    // Check if group is being changed
    if (req.body.group && req.body.group !== policy.group?.toString()) {
      const existingGroup = await Group.findById(req.body.group);
      if (!existingGroup) {
        const error: any = new Error("Group not found");
        error.status = 404;
        return next(error);
      }
    }

    const updatedPolicy = await Policy.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate({
        path: "client",
        select: "firstName lastName companyName clientCode clientType",
      })
      .populate({
        path: "group",
        select: "groupName groupCode",
      });

    logger.info(`Policy updated: ${updatedPolicy!.policyNumber}`);
    res.status(200).json({
      success: true,
      data: updatedPolicy,
    });
  } catch (error: any) {
    logger.error(`Error updating policy ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Delete policy
// @route   DELETE /api/policies/:id
// @access  Private
export const deletePolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const policy = await Policy.findByIdAndDelete(req.params.id);

    if (!policy) {
      logger.warn(`Policy not found with id: ${req.params.id}`);
      const error: any = new Error("Policy not found");
      error.status = 404;
      return next(error);
    }

    logger.info(`Policy deleted: ${policy.policyNumber}`);
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    logger.error(`Error deleting policy ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Renew policy
// @route   PUT /api/policies/:id/renew
// @access  Private
export const renewPolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      logger.warn(`Policy not found with id: ${req.params.id}`);
      const error: any = new Error("Policy not found");
      error.status = 404;
      return next(error);
    }

    // Get new date parameters from request, or calculate defaults
    const { newStartDate, newEndDate, newPremium } = req.body;

    // Default new start date is the day after current end date
    const startDate = newStartDate
      ? new Date(newStartDate)
      : new Date(policy.endDate.getTime() + 24 * 60 * 60 * 1000);

    // Default new end date is one year after new start date
    const endDate = newEndDate
      ? new Date(newEndDate)
      : new Date(
          startDate.getFullYear() + 1,
          startDate.getMonth(),
          startDate.getDate()
        );

    // Update the policy with new dates and status
    const renewalUpdates = {
      startDate,
      endDate,
      status: PolicyStatus.ACTIVE,
      ...(newPremium && { premium: newPremium }), // Update premium if provided
    };

    const renewedPolicy = await Policy.findByIdAndUpdate(
      req.params.id,
      renewalUpdates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate({
        path: "client",
        select: "firstName lastName companyName clientCode clientType",
      })
      .populate({
        path: "group",
        select: "groupName groupCode",
      });

    logger.info(`Policy renewed: ${renewedPolicy!.policyNumber}`);
    res.status(200).json({
      success: true,
      data: renewedPolicy,
    });
  } catch (error: any) {
    logger.error(`Error renewing policy ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Get policies by client
// @route   GET /api/clients/:clientId/policies
// @access  Private
export const getPoliciesByClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientId } = req.params;

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      const error: any = new Error("Client not found");
      error.status = 404;
      return next(error);
    }

    // Copy query object
    const queryObj: Record<string, any> = {
      ...req.query,
      client: clientId,
    };

    // Fields to exclude from filtering
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Apply the filters directly
    let query: Query<IPolicy[], IPolicy> = Policy.find(queryObj);

    // Sorting
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      // Default sort by creation date
      query = query.sort("-createdAt");
    }

    // Field limiting
    if (req.query.fields) {
      const fields = (req.query.fields as string).split(",").join(" ");
      query = query.select(fields) as Query<IPolicy[], IPolicy>;
    } else {
      // Exclude '__v' field by default
      query = query.select("-__v") as Query<IPolicy[], IPolicy>;
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Policy.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const policies = await query.exec();

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
      count: policies.length,
      pagination: {
        total,
        page,
        limit,
        ...pagination,
      },
      data: policies,
    });
  } catch (error: any) {
    logger.error(`Error fetching client policies: ${error.message}`);
    next(error);
  }
};

// @desc    Get policies by group
// @route   GET /api/groups/:groupId/policies
// @access  Private
export const getPoliciesByGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      const error: any = new Error("Group not found");
      error.status = 404;
      return next(error);
    }

    // Copy query object
    const queryObj: Record<string, any> = {
      ...req.query,
      group: groupId,
    };

    // Fields to exclude from filtering
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Apply the filters directly
    let query: Query<IPolicy[], IPolicy> = Policy.find(queryObj);

    // Sorting
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      // Default sort by creation date
      query = query.sort("-createdAt");
    }

    // Field limiting
    if (req.query.fields) {
      const fields = (req.query.fields as string).split(",").join(" ");
      query = query.select(fields) as Query<IPolicy[], IPolicy>;
    } else {
      // Exclude '__v' field by default
      query = query.select("-__v") as Query<IPolicy[], IPolicy>;
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Policy.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const policies = await query.exec();

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
      count: policies.length,
      pagination: {
        total,
        page,
        limit,
        ...pagination,
      },
      data: policies,
    });
  } catch (error: any) {
    logger.error(`Error fetching group policies: ${error.message}`);
    next(error);
  }
};
