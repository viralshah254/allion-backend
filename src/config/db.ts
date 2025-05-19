import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/insurance";

const connectDB = async () => {
  if (!MONGO_URI) {
    logger.error("MongoDB URI not found in environment variables.");
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("MongoDB Connected");
  } catch (err: any) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
