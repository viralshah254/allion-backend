import { Request, Response, NextFunction } from "express";
import User, { UserRole } from "../models/User";
import logger from "../utils/logger";

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find().select(
      "-resetPasswordToken -resetPasswordExpire"
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err: any) {
    logger.error(`Error getting users: ${err.message}`);
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-resetPasswordToken -resetPasswordExpire"
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: `No user with the id of ${req.params.id}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    logger.error(`Error getting user: ${err.message}`);
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Prevent updating to admin role unless current user is admin
    if (req.body.role === UserRole.ADMIN && req.user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: "Not authorized to create admin users",
      });
      return;
    }

    // Remove password from update data if it exists
    if (req.body.password) {
      delete req.body.password;
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: `No user with the id of ${req.params.id}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    logger.error(`Error updating user: ${err.message}`);
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: `No user with the id of ${req.params.id}`,
      });
      return;
    }

    // Prevent deleting an admin user if not admin
    if (user.role === UserRole.ADMIN && req.user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: "Not authorized to delete admin users",
      });
      return;
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err: any) {
    logger.error(`Error deleting user: ${err.message}`);
    next(err);
  }
};
