import { Request, Response, NextFunction } from "express";
import User, { UserRole, IUser } from "../models/User";
import crypto from "crypto";
import logger from "../utils/logger";

// @desc    Register user
// @route   POST /api/auth/register
// @access  Private/Admin
export const registerAdminUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phoneNumber, password,  email, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with that phone number already exists",
      });
      return;
    }

    // Only admins can create other admin users
    if (role === UserRole.ADMIN && req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: "Not authorized to create admin users",
      });
      return;
    }

    // Create admin user
    const user = await User.create({
      name,
      phoneNumber,
      password,
      role: UserRole.ADMIN,
      email,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err: any) {
    logger.error(`Error registering user: ${err.message}`);
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phoneNumber, password } = req.body;

    // Validate phone and password
    if (!phoneNumber || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide phone number and password",
      });
      return;
    }

    // Check for user
    const user = await User.findOne({ phoneNumber }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (err: any) {
    logger.error(`Error logging in user: ${err.message}`);
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // user is already available in req due to the protect middleware
    const user = await User.findById(req.user?.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    logger.error(`Error getting user profile: ${err.message}`);
    next(err);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phoneNumber } = req.body;

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "There is no user with that phone number",
      });
      return;
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // In a real app, you would send an SMS with the reset token
    // For now, we'll just return it in the response

    res.status(200).json({
      success: true,
      data: {
        resetToken,
        message: "In production, this token would be sent via SMS",
      },
    });
  } catch (err: any) {
    logger.error(`Error in forgot password: ${err.message}`);

    // If there's an error, reset the reset token fields
    if (req.body.phoneNumber) {
      const user = await User.findOne({ phoneNumber: req.body.phoneNumber });

      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }

    next(err);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid token or token has expired",
      });
      return;
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err: any) {
    logger.error(`Error resetting password: ${err.message}`);
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phoneNumber, email, password } = req.body;

    // Create object with allowed fields
    const fieldsToUpdate: any = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;
    if (phoneNumber) fieldsToUpdate.phoneNumber = phoneNumber;

    // If user wants to update password
    if (password) {
      fieldsToUpdate.password = password;
    }

    // Update user
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err: any) {
    logger.error(`Error updating profile: ${err.message}`);
    next(err);
  }
};

// @desc    Register an admin user
// @route   POST /api/auth/registeradmin
// @access  Public (with admin key)
export const registerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phoneNumber, password, email, adminKey } = req.body;

    // Validate admin key - In a real application, this would be a secure environment variable
    // This is a simple implementation for demonstration purposes
    const validAdminKey = process.env.ADMIN_REGISTRATION_KEY;
    console.log(validAdminKey);

    if (adminKey !== validAdminKey) {
      res.status(401).json({
        success: false,
        message: "Invalid admin registration key",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with that phone number already exists",
      });
      return;
    }

    // Create admin user
    const user = await User.create({
      name,
      phoneNumber,
      password,
      role: UserRole.ADMIN,
      email,
    });

    logger.info(`New admin user created: ${user.name}`);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err: any) {
    logger.error(`Error registering admin: ${err.message}`);
    next(err);
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      email: user.email,
    },
  });
};
