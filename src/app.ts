import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import logger from "./utils/logger";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import clientRoutes from "./routes/clientRoutes";
import groupRoutes from "./routes/groupRoutes";
import insuranceCompanyRoutes from "./routes/insuranceCompanyRoutes";
import riskNoteRoutes from "./routes/riskNoteRoutes";
import claimPolicyRoutes from "./routes/claimPolicyRoutes";

dotenv.config();

const app: Application = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic Route for testing
app.get("/", (req: Request, res: Response) => {
  res.send("Insurance API Running");
});

// Mount Routers

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/insurance-companies", insuranceCompanyRoutes);
app.use("/api/risk-notes", riskNoteRoutes);
app.use("/api/claim-policies", claimPolicyRoutes);

//log endpoints used
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Global Error Handler Middleware
interface HttpError extends Error {
  status?: number;
}

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

export default app;
