import mongoose from "mongoose";
import dotenv from "dotenv";
import User, { UserRole } from "../models/User";
import logger from "./logger";
import connectDB from "../config/db";

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Create admin user
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({
      role: UserRole.ADMIN,
    });

    if (adminExists) {
      logger.info("Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    await User.create({
      name: "Admin User",
      phoneNumber: "+254713322025", // Change this to your admin phone number
      password: "123456", // Change this to a secure password
      role: UserRole.ADMIN,
    });

    logger.info("Admin user created");
    process.exit(0);
  } catch (err: any) {
    logger.error(`Error creating admin user: ${err.message}`);
    process.exit(1);
  }
};

// Delete all users
const deleteAllUsers = async () => {
  try {
    await User.deleteMany({});
    logger.info("All users deleted");
    process.exit(0);
  } catch (err: any) {
    logger.error(`Error deleting users: ${err.message}`);
    process.exit(1);
  }
};

// Process command line arguments
if (process.argv[2] === "-i") {
  createAdmin();
} else if (process.argv[2] === "-d") {
  deleteAllUsers();
} else {
  logger.info(
    "Usage: ts-node seeder.ts -i (import admin) or -d (delete all users)"
  );
  process.exit(1);
}
