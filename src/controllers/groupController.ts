import { Request, Response, NextFunction } from "express";
import Group, { IGroup } from "../models/Group";
import Client from "../models/Client";
import logger from "../utils/logger";

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupName, description, members } = req.body;

    // Validate group name
    if (!groupName) {
      const error: any = new Error("Group name is required");
      error.status = 400;
      return next(error);
    }

    // Create group
    const group = await Group.create({
      groupName,
      description,
      members: members || [],
    });

    logger.info(`New group created: ${group.groupCode}`);
    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    logger.error(`Error creating group: ${error.message}`);
    next(error);
  }
};

// @desc    Get all groups with filtering, search, and pagination
// @route   GET /api/groups
// @access  Private
export const getGroups = async (
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
        { groupName: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { groupCode: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Build query
    let query = Group.find(queryObj) as any;

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
    const total = await Group.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const groups = await query.exec();

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
      count: groups.length,
      pagination: {
        total,
        page,
        limit,
        ...pagination,
      },
      data: groups,
    });
  } catch (error: any) {
    logger.error(`Error fetching groups: ${error.message}`);
    next(error);
  }
};

// @desc    Get single group with populated members
// @route   GET /api/groups/:id
// @access  Private
export const getGroupById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const group = await Group.findById(req.params.id).populate({
      path: "members.clientId",
      model: "Client",
    });

    if (!group) {
      logger.warn(`Group not found with id: ${req.params.id}`);
      const error: any = new Error("Group not found");
      error.status = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    logger.error(`Error fetching group ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private
export const updateGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!group) {
      logger.warn(`Group not found with id: ${req.params.id}`);
      const error: any = new Error("Group not found");
      error.status = 404;
      return next(error);
    }

    logger.info(`Group updated: ${group.groupCode}`);
    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    logger.error(`Error updating group ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private
export const deleteGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);

    if (!group) {
      logger.warn(`Group not found with id: ${req.params.id}`);
      const error: any = new Error("Group not found");
      error.status = 404;
      return next(error);
    }

    logger.info(`Group deleted: ${group.groupCode}`);
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    logger.error(`Error deleting group ${req.params.id}: ${error.message}`);
    next(error);
  }
};

// @desc    Add member to group
// @route   POST /api/groups/:id/members
// @access  Private
export const addMemberToGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientId, clientType } = req.body;

    // Validate request
    if (!clientId || !clientType) {
      const error: any = new Error("Client ID and type are required");
      error.status = 400;
      return next(error);
    }

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      const error: any = new Error("Client not found");
      error.status = 404;
      return next(error);
    }

    // Get the group
    const group = await Group.findById(req.params.id);
    if (!group) {
      logger.warn(`Group not found with id: ${req.params.id}`);
      const error: any = new Error("Group not found");
      error.status = 404;
      return next(error);
    }

    // Check if client is already a member
    const isMember = group.members.some(
      (member) => member.clientId.toString() === clientId
    );

    if (isMember) {
      const error: any = new Error("Client is already a member of this group");
      error.status = 400;
      return next(error);
    }

    // Add new member
    group.members.push({ clientId, clientType });
    await group.save();

    logger.info(`Added member ${clientId} to group ${group.groupCode}`);
    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    logger.error(`Error adding member to group: ${error.message}`);
    next(error);
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:clientId
// @access  Private
export const removeMemberFromGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, clientId } = req.params;

    // Get the group
    const group = await Group.findById(id);
    if (!group) {
      logger.warn(`Group not found with id: ${id}`);
      const error: any = new Error("Group not found");
      error.status = 404;
      return next(error);
    }

    // Check if client is a member
    const memberIndex = group.members.findIndex(
      (member) => member.clientId.toString() === clientId
    );

    if (memberIndex === -1) {
      const error: any = new Error("Client is not a member of this group");
      error.status = 400;
      return next(error);
    }

    // Remove member
    group.members.splice(memberIndex, 1);
    await group.save();

    logger.info(`Removed member ${clientId} from group ${group.groupCode}`);
    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    logger.error(`Error removing member from group: ${error.message}`);
    next(error);
  }
};
